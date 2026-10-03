/**
 * QUERY EXECUTOR — runs a ParsedQuery against the in-memory columnar dataset.
 * Every answer is computed from the data and returned with KPI highlights, a chart spec and a table.
 */
import type { Dataset, Granularity, L10n, NumberFormat, Role } from '@/types/core'
import type { Analysis, ChartSpec } from '@/types/analysis'
import { Ctx, type RoleMap } from '../analysis/context'
import { ROLE_META } from '../dictionaries/roles'
import { lexicon, type MetricDef, type QueryOp } from './lexicon'
import type { ParsedQuery, QuerySchema } from './parser'
import { formatValue } from '@/lib/format'
import { periodKey, periodLabel, periodStart } from '../analysis/time'
import { pearson, trendLine } from '@/lib/stats'
import { detectSeriesAnomalies } from '../anomalies/anomalyEngine'
import { projectSeries } from '../forecasting/forecast'
import { strengthLabel } from '../analysis/correlation'

export interface QueryResult {
  status: 'ok' | 'unknown' | 'nodata'
  op: QueryOp | null
  answer: L10n
  highlights: { label: L10n; value: number; format: NumberFormat; tone?: 'positive' | 'negative' | 'neutral'; text?: string }[]
  chart?: ChartSpec
  table?: { columns: { key: string; label: L10n; format?: NumberFormat }[]; rows: Record<string, string | number | null>[] }
  interpretation: { label: L10n; value: L10n }[]
  notes: L10n[]
  rowsMatched: number
  confidence: number
}

const L = (vi: string, en: string): L10n => ({ vi, en })
const AVG_ROLES = new Set<Role>(['price', 'satisfaction', 'performance', 'attendance', 'response_time', 'duration', 'conversion', 'margin', 'inventory'])

function metricFormat(m: MetricDef): NumberFormat {
  if (m.kind === 'count' || m.kind === 'distinct') return 'integer'
  if (m.kind === 'ratio') return m.format ?? 'number'
  return ROLE_META[m.role!].format ?? 'number'
}

/** Evaluate a metric on a context with a given aggregation. */
export function evalMetric(c: Ctx, m: MetricDef, agg: 'sum' | 'avg' | 'median' | 'max' | 'min' | 'auto' = 'auto'): number {
  if (m.kind === 'count') return c.transactions()
  if (m.kind === 'distinct') return c.distinct(m.role!)
  if (m.kind === 'ratio') {
    const n = c.sum(m.num!)
    const d = m.den === 'count' ? c.transactions() : c.sum(m.den as Role)
    return d ? n / d : NaN
  }
  const role = m.role!
  const a = agg === 'auto' ? (AVG_ROLES.has(role) ? 'avg' : 'sum') : agg
  if (a === 'sum') return c.sum(role)
  if (a === 'avg') return c.avg(role)
  const arr = c.measure(role)
  if (!arr) return NaN
  const vals: number[] = []
  c.forEach((i) => {
    if (arr[i] === arr[i]) vals.push(arr[i])
  })
  if (!vals.length) return NaN
  if (a === 'max') return Math.max(...vals)
  if (a === 'min') return Math.min(...vals)
  vals.sort((x, y) => x - y)
  const mid = vals.length >> 1
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2
}

function filterRows(ds: Dataset, roles: RoleMap, pq: ParsedQuery, window?: { start: number; end: number } | null): Int32Array {
  const n = ds.rowCount
  const out = new Int32Array(n)
  let k = 0
  const dates = roles.date ? ds.num[roles.date] : null
  const fl = pq.filters.map((f) => ({ arr: ds.str[roles[f.role]!] ?? null, set: new Set(f.values) }))
  const w = window === undefined ? pq.time : window
  for (let i = 0; i < n; i++) {
    let ok = true
    for (const f of fl) {
      if (!f.arr || !f.set.has(f.arr[i] as string)) {
        ok = false
        break
      }
    }
    if (ok && w && dates) {
      const t = dates[i]
      if (!(t >= w.start && t < w.end)) ok = false
    }
    if (ok) out[k++] = i
  }
  return out.slice(0, k)
}

function groupIndex(c: Ctx, role: Role): Map<string, number[]> {
  const d = c.dim(role)
  const g = new Map<string, number[]>()
  if (!d) return g
  c.forEach((i) => {
    const v = d[i]
    if (v === null) return
    let a = g.get(v)
    if (!a) g.set(v, (a = []))
    a.push(i)
  })
  return g
}

function timeGroups(c: Ctx, dates: Float64Array, grain: Granularity): Map<string, number[]> {
  const g = new Map<string, number[]>()
  c.forEach((i) => {
    const t = dates[i]
    if (t !== t) return
    const k = periodKey(periodStart(t, grain), grain)
    let a = g.get(k)
    if (!a) g.set(k, (a = []))
    a.push(i)
  })
  return new Map([...g.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)))
}

function f(v: number, fmt: NumberFormat, lang: 'vi' | 'en', signed = false) {
  return formatValue(v, fmt, { lang, signed })
}
function both(fn: (lang: 'vi' | 'en') => string): L10n {
  return { vi: fn('vi'), en: fn('en') }
}

export function executeQuery(pq: ParsedQuery, ds: Dataset, roles: RoleMap, analysis: Analysis | null, schema: QuerySchema): QueryResult {
  const base: QueryResult = { status: 'ok', op: pq.op, answer: L('', ''), highlights: [], interpretation: [], notes: [], rowsMatched: 0, confidence: pq.confidence }
  if (!pq.op) {
    return { ...base, status: 'unknown', answer: L('Tôi chưa xác định chính xác yêu cầu.', 'I could not determine the request precisely.') }
  }
  const root = new Ctx(ds, roles)
  const metric = pq.metric
  const mf = metric ? metricFormat(metric) : 'number'
  const mLabel: L10n = metric?.label ?? L('Giá trị', 'Value')
  const lower = (x: L10n) => ({ vi: x.vi.toLowerCase(), en: x.en.toLowerCase() })
  // interpretation chips
  const interp: QueryResult['interpretation'] = [{ label: L('Phép tính', 'Operation'), value: { vi: pq.op, en: pq.op } }]
  if (metric) interp.push({ label: L('Chỉ số', 'Metric'), value: metric.label })
  if (pq.dimension) interp.push({ label: L('Nhóm theo', 'Group by'), value: ROLE_META[pq.dimension].label })
  if (pq.timeGrain) interp.push({ label: L('Chu kỳ', 'Grain'), value: both((l) => ({ day: l === 'vi' ? 'Ngày' : 'Day', week: l === 'vi' ? 'Tuần' : 'Week', month: l === 'vi' ? 'Tháng' : 'Month', quarter: l === 'vi' ? 'Quý' : 'Quarter', year: l === 'vi' ? 'Năm' : 'Year' })[pq.timeGrain!]) })
  for (const fl of pq.filters) interp.push({ label: { vi: `Lọc: ${ROLE_META[fl.role].label.vi}`, en: `Filter: ${ROLE_META[fl.role].label.en}` }, value: { vi: fl.values.slice(0, 4).join(', ') + (fl.values.length > 4 ? '…' : ''), en: fl.values.slice(0, 4).join(', ') + (fl.values.length > 4 ? '…' : '') } })
  if (pq.time) interp.push({ label: L('Thời gian', 'Time'), value: pq.time.label })
  if (pq.topN) interp.push({ label: L('Số lượng', 'Top N'), value: { vi: String(pq.topN), en: String(pq.topN) } })
  base.interpretation = interp
  if (pq.time && schema.anchor) {
    base.notes.push(L(`"${pq.time.label.vi}" được tính theo ngày dữ liệu mới nhất (${periodLabel(periodKey(periodStart(schema.anchor, 'day'), 'day'), 'vi')}).`, `"${pq.time.label.en}" is relative to the latest date in the data (${periodLabel(periodKey(periodStart(schema.anchor, 'day'), 'day'), 'en')}).`))
  }
  if (pq.defaulted.includes('metric') && metric) base.notes.push(L(`Không nêu chỉ số — dùng chỉ số chính: ${metric.label.vi}.`, `No metric specified — using the main metric: ${metric.label.en}.`))

  const idx = filterRows(ds, roles, pq)
  const c = root.subset(idx)
  base.rowsMatched = idx.length
  if (!idx.length && pq.op !== 'CORRELATION') {
    return { ...base, status: 'nodata', answer: L('Không có dòng dữ liệu nào khớp với điều kiện lọc.', 'No rows match the filters.') }
  }
  const dates = roles.date ? ds.num[roles.date] : null

  switch (pq.op) {
    case 'SUM':
    case 'AVERAGE':
    case 'MEDIAN':
    case 'COUNT': {
      const agg = pq.op === 'AVERAGE' ? (metric?.kind === 'measure' ? 'avg' : 'auto') : pq.op === 'MEDIAN' ? 'median' : 'auto'
      let v: number
      let label = mLabel
      if (pq.op === 'AVERAGE' && metric && metric.kind !== 'measure') {
        // "average number of orders" -> per period if possible
        v = evalMetric(c, metric)
      } else v = evalMetric(c, metric!, agg as 'auto')
      if (pq.op === 'AVERAGE' && metric?.kind === 'measure') label = { vi: `${mLabel.vi} trung bình / dòng`, en: `Average ${mLabel.en.toLowerCase()} per record` }
      if (pq.op === 'MEDIAN') label = { vi: `Trung vị ${mLabel.vi.toLowerCase()}`, en: `Median ${mLabel.en.toLowerCase()}` }
      if (!Number.isFinite(v)) return { ...base, status: 'nodata', answer: L('Không đủ dữ liệu để tính chỉ số này.', 'Not enough data to compute this metric.') }
      const scope = scopeText(pq)
      base.answer = both((l) => `${label[l]}${scope[l]}: ${f(v, mf, l)}.`)
      base.highlights.push({ label, value: v, format: mf })
      if (pq.op === 'SUM' && metric?.kind === 'measure' && pq.filters.length) {
        const all = evalMetric(root.subset(filterRows(ds, roles, { ...pq, filters: [] })), metric)
        if (all > 0) {
          base.highlights.push({ label: L('Tỷ trọng trên tổng', 'Share of total'), value: v / all, format: 'percent' })
          base.answer = both((l) => `${label[l]}${scope[l]}: ${f(v, mf, l)} — ${l === 'vi' ? 'chiếm' : 'representing'} ${f(v / all, 'percent', l)} ${l === 'vi' ? 'tổng' : 'of total'}.`)
        }
      }
      // mini trend if time available
      if (dates && metric) {
        const tg = timeGroups(c, dates, pq.time?.grain === 'month' || pq.time?.grain === 'week' ? 'day' : schema.defaultGrain)
        if (tg.size >= 3) {
          const cats = [...tg.keys()]
          base.chart = { id: 'q_trend', kind: 'area', title: { vi: `${mLabel.vi} theo thời gian`, en: `${mLabel.en} over time` }, categories: cats, series: [{ name: mLabel, values: cats.map((k) => evalMetric(root.subset(Int32Array.from(tg.get(k)!)), metric)), format: mf, tone: 'primary', kind: 'area' }] }
        }
      }
      return base
    }
    case 'MIN':
    case 'MAX': {
      if (pq.timeGrain && dates) {
        const tg = timeGroups(c, dates, pq.timeGrain)
        const rows = [...tg.entries()].map(([k, ix]) => ({ k, v: evalMetric(root.subset(Int32Array.from(ix)), metric!) })).filter((r) => Number.isFinite(r.v))
        if (!rows.length) return { ...base, status: 'nodata', answer: L('Không đủ dữ liệu.', 'Not enough data.') }
        const best = rows.reduce((a, r) => (pq.op === 'MAX' ? (r.v > a.v ? r : a) : r.v < a.v ? r : a))
        const avg = rows.reduce((s, r) => s + r.v, 0) / rows.length
        base.answer = both((l) => `${periodLabel(best.k, l)} ${l === 'vi' ? (pq.op === 'MAX' ? 'có' : 'có') : 'has the'} ${pq.op === 'MAX' ? (l === 'vi' ? `${lower(mLabel).vi} cao nhất` : `highest ${lower(mLabel).en}`) : l === 'vi' ? `${lower(mLabel).vi} thấp nhất` : `lowest ${lower(mLabel).en}`}: ${f(best.v, mf, l)} (${l === 'vi' ? 'bình quân' : 'average'} ${f(avg, mf, l)}).`)
        base.highlights.push({ label: L('Kỳ', 'Period'), value: NaN, format: 'number', text: best.k }, { label: mLabel, value: best.v, format: mf }, { label: L('So với bình quân', 'vs average'), value: avg ? (best.v - avg) / Math.abs(avg) : NaN, format: 'percent', tone: best.v >= avg ? 'positive' : 'negative' })
        const cats = rows.map((r) => r.k)
        base.chart = { id: 'q_minmax', kind: 'bar', title: { vi: `${mLabel.vi} theo kỳ`, en: `${mLabel.en} by period` }, categories: cats, series: [{ name: mLabel, values: rows.map((r) => r.v), format: mf, tone: 'primary' }] }
        base.table = { columns: [{ key: 'period', label: L('Kỳ', 'Period') }, { key: 'value', label: mLabel, format: mf }], rows: [...rows].sort((a, b) => (pq.op === 'MAX' ? b.v - a.v : a.v - b.v)).slice(0, 12).map((r) => ({ period: r.k, value: r.v })) }
        return base
      }
      // record-level max/min
      if (metric?.kind !== 'measure') return executeQuery({ ...pq, op: 'SUM' }, ds, roles, analysis, schema)
      const arr = c.measure(metric.role!)!
      let bi = -1
      c.forEach((i) => {
        if (arr[i] !== arr[i]) return
        if (bi < 0 || (pq.op === 'MAX' ? arr[i] > arr[bi] : arr[i] < arr[bi])) bi = i
      })
      if (bi < 0) return { ...base, status: 'nodata', answer: L('Không đủ dữ liệu.', 'Not enough data.') }
      const v = arr[bi]
      base.answer = both((l) => `${l === 'vi' ? (pq.op === 'MAX' ? 'Giá trị lớn nhất' : 'Giá trị nhỏ nhất') : pq.op === 'MAX' ? 'Largest' : 'Smallest'} ${lower(mLabel)[l]}${scopeText(pq)[l]}: ${f(v, mf, l)} (${l === 'vi' ? 'dòng' : 'row'} #${bi + 1}).`)
      base.highlights.push({ label: mLabel, value: v, format: mf })
      base.table = { columns: ds.columns.slice(0, 10).map((col) => ({ key: col.key, label: { vi: col.name, en: col.name } })), rows: [Object.fromEntries(ds.columns.slice(0, 10).map((col) => [col.key, col.storage === 'str' ? ds.str[col.key][bi] : col.type === 'date' ? new Date(ds.num[col.key][bi]).toISOString().slice(0, 10) : ds.num[col.key][bi]]))] }
      return base
    }
    case 'TOP_N':
    case 'BOTTOM_N':
    case 'RANK':
    case 'GROUP_BY': {
      const dim = pq.dimension!
      const g = groupIndex(c, dim)
      const total = evalMetric(c, metric!)
      const rows = [...g.entries()].map(([k, ix]) => ({ k, v: evalMetric(root.subset(Int32Array.from(ix)), metric!), n: ix.length })).filter((r) => Number.isFinite(r.v))
      const asc = pq.op === 'BOTTOM_N' || pq.direction === 'asc'
      rows.sort((a, b) => (asc ? a.v - b.v : b.v - a.v))
      const n = pq.op === 'GROUP_BY' || pq.op === 'RANK' ? Math.min(rows.length, 30) : Math.min(rows.length, pq.topN ?? 10)
      const sel = rows.slice(0, n)
      if (!sel.length) return { ...base, status: 'nodata', answer: L('Không đủ dữ liệu.', 'Not enough data.') }
      const additive = metric!.kind === 'measure' ? !AVG_ROLES.has(metric!.role!) : metric!.kind === 'count'
      const dimL = ROLE_META[dim].label
      const top = sel[0]
      const share = additive && total ? top.v / total : NaN
      const selShare = additive && total ? sel.reduce((s, r) => s + r.v, 0) / total : NaN
      base.answer = both((l) => {
        const lead = asc ? (l === 'vi' ? 'thấp nhất' : 'lowest') : l === 'vi' ? 'cao nhất' : 'highest'
        if (n === 1) return l === 'vi' ? `${dimL.vi} có ${lower(mLabel).vi} ${lead}: ${top.k} — ${f(top.v, mf, l)}${Number.isFinite(share) ? ` (chiếm ${f(share, 'percent', l)} tổng)` : ''}.` : `${dimL.en} with the ${lead} ${lower(mLabel).en}: ${top.k} — ${f(top.v, mf, l)}${Number.isFinite(share) ? ` (${f(share, 'percent', l)} of total)` : ''}.`
        const head = pq.op === 'GROUP_BY' || pq.op === 'RANK' ? (l === 'vi' ? `${mLabel.vi} theo ${lower(dimL).vi}` : `${mLabel.en} by ${lower(dimL).en}`) : l === 'vi' ? `Top ${n} ${lower(dimL).vi} theo ${lower(mLabel).vi}${asc ? ' (thấp nhất)' : ''}` : `${asc ? 'Bottom' : 'Top'} ${n} ${lower(dimL).en} by ${lower(mLabel).en}`
        return `${head}: ${l === 'vi' ? 'dẫn đầu là' : 'led by'} ${top.k} (${f(top.v, mf, l)}${Number.isFinite(share) ? `, ${f(share, 'percent', l)}` : ''})${Number.isFinite(selShare) && n > 1 && n < rows.length ? (l === 'vi' ? `; nhóm này chiếm ${f(selShare, 'percent', l)} tổng` : `; together ${f(selShare, 'percent', l)} of total`) : ''}.`
      })
      base.highlights.push({ label: L(`${dimL.vi} dẫn đầu`, `Top ${dimL.en.toLowerCase()}`), value: NaN, format: 'number', text: top.k }, { label: mLabel, value: top.v, format: mf })
      if (Number.isFinite(share)) base.highlights.push({ label: L('Tỷ trọng', 'Share'), value: share, format: 'percent' })
      if (Number.isFinite(selShare) && n > 1 && n < rows.length) base.highlights.push({ label: L(`Tỷ trọng ${n} nhóm`, `Share of ${n}`), value: selShare, format: 'percent' })
      base.chart = { id: 'q_rank', kind: sel.length > 8 ? 'hbar' : 'bar', title: { vi: `${mLabel.vi} theo ${lower(dimL).vi}`, en: `${mLabel.en} by ${lower(dimL).en}` }, categories: sel.map((r) => r.k), series: [{ name: mLabel, values: sel.map((r) => r.v), format: mf, tone: 'primary' }] }
      base.table = { columns: [{ key: 'rank', label: L('#', '#') }, { key: 'label', label: dimL }, { key: 'value', label: mLabel, format: mf }, ...(additive ? [{ key: 'share', label: L('Tỷ trọng', 'Share'), format: 'percent' as NumberFormat }] : []), { key: 'rows', label: L('Số dòng', 'Rows'), format: 'integer' as NumberFormat }], rows: sel.map((r, i) => ({ rank: i + 1, label: r.k, value: r.v, share: additive && total ? r.v / total : null, rows: r.n })) }
      return base
    }
    case 'SHARE': {
      if (pq.dimension && !pq.filters.some((x) => x.role === pq.dimension)) {
        return executeQuery({ ...pq, op: 'TOP_N', topN: pq.topN ?? 10 }, ds, roles, analysis, schema)
      }
      const all = evalMetric(root.subset(filterRows(ds, roles, { ...pq, filters: [] })), metric!)
      const v = evalMetric(c, metric!)
      const s = all ? v / all : NaN
      const what = pq.filters.map((x) => x.values.join(', ')).join(' · ')
      base.answer = both((l) => (l === 'vi' ? `${what} chiếm ${f(s, 'percent', l)} tổng ${lower(mLabel).vi} (${f(v, mf, l)} / ${f(all, mf, l)}).` : `${what} accounts for ${f(s, 'percent', l)} of total ${lower(mLabel).en} (${f(v, mf, l)} of ${f(all, mf, l)}).`))
      base.highlights.push({ label: L('Tỷ trọng', 'Share'), value: s, format: 'percent' }, { label: mLabel, value: v, format: mf }, { label: L('Tổng', 'Total'), value: all, format: mf })
      base.chart = { id: 'q_share', kind: 'donut', title: { vi: 'Tỷ trọng', en: 'Share' }, categories: [what, 'Khác / Other'], series: [{ name: mLabel, values: [v, Math.max(0, all - v)], format: mf, tone: 'primary' }] }
      return base
    }
    case 'COMPARE': {
      const fl = pq.filters.find((x) => x.values.length >= 2) ?? null
      const groups: { label: string; idx: Int32Array }[] = []
      if (fl) {
        for (const v of fl.values.slice(0, 6)) groups.push({ label: v, idx: filterRows(ds, roles, { ...pq, filters: [...pq.filters.filter((x) => x !== fl), { ...fl, values: [v] }] }) })
      } else {
        for (const x of pq.filters.slice(0, 4)) groups.push({ label: x.values.join(', '), idx: filterRows(ds, roles, { ...pq, filters: [x] }) })
      }
      const vals = groups.map((g) => ({ label: g.label, v: evalMetric(root.subset(g.idx), metric!), n: g.idx.length }))
      if (vals.length < 2) return { ...base, status: 'nodata', answer: L('Cần ít nhất hai nhóm để so sánh.', 'At least two groups are needed to compare.') }
      const [a, b] = vals
      const diff = a.v - b.v
      const ratio = b.v ? a.v / b.v : NaN
      base.answer = both((l) => (l === 'vi' ? `${mLabel.vi}: ${a.label} ${f(a.v, mf, l)} so với ${b.label} ${f(b.v, mf, l)} — chênh lệch ${f(diff, mf, l, true)}${Number.isFinite(ratio) ? ` (${f(ratio, 'ratio', l)})` : ''}.` : `${mLabel.en}: ${a.label} ${f(a.v, mf, l)} vs ${b.label} ${f(b.v, mf, l)} — difference ${f(diff, mf, l, true)}${Number.isFinite(ratio) ? ` (${f(ratio, 'ratio', l)})` : ''}.`))
      base.highlights = vals.slice(0, 3).map((x) => ({ label: { vi: x.label, en: x.label }, value: x.v, format: mf }))
      base.highlights.push({ label: L('Chênh lệch', 'Difference'), value: b.v ? diff / Math.abs(b.v) : NaN, format: 'percent', tone: diff >= 0 ? 'positive' : 'negative' })
      if (dates) {
        const grain = schema.defaultGrain
        const per = groups.map((g) => timeGroups(root.subset(g.idx), dates, grain))
        const keys = [...new Set(per.flatMap((p) => [...p.keys()]))].sort()
        if (keys.length >= 3) {
          base.chart = { id: 'q_compare', kind: 'line', title: { vi: `So sánh ${lower(mLabel).vi} theo thời gian`, en: `${mLabel.en} comparison over time` }, categories: keys, series: per.map((p, i) => ({ name: { vi: groups[i].label, en: groups[i].label }, values: keys.map((k) => (p.get(k) ? evalMetric(root.subset(Int32Array.from(p.get(k)!)), metric!) : 0)), format: mf, kind: 'line' as const, tone: i === 0 ? ('primary' as const) : ('secondary' as const) })) }
        }
      }
      if (!base.chart) base.chart = { id: 'q_compare', kind: 'bar', title: { vi: 'So sánh', en: 'Comparison' }, categories: vals.map((x) => x.label), series: [{ name: mLabel, values: vals.map((x) => x.v), format: mf, tone: 'primary' }] }
      base.table = { columns: [{ key: 'label', label: L('Nhóm', 'Group') }, { key: 'value', label: mLabel, format: mf }, { key: 'rows', label: L('Số dòng', 'Rows'), format: 'integer' }], rows: vals.map((x) => ({ label: x.label, value: x.v, rows: x.n })) }
      return base
    }
    case 'GROWTH': {
      if (!dates) return { ...base, status: 'nodata', answer: L('Cần cột ngày để tính tăng trưởng.', 'A date column is needed to compute growth.') }
      // windows
      let cur: { start: number; end: number }
      let prev: { start: number; end: number }
      let curL: L10n
      let prevL: L10n
      if (pq.time) {
        cur = { start: pq.time.start, end: pq.time.end }
        prev = { start: pq.time.prevStart, end: pq.time.prevEnd }
        curL = pq.time.label
        prevL = L('kỳ trước', 'previous period')
      } else {
        const ti = analysis?.time
        if (!ti || !ti.currentLabel || !ti.previousLabel) return { ...base, status: 'nodata', answer: L('Không đủ kỳ dữ liệu để so sánh.', 'Not enough periods to compare.') }
        const ci = ti.periods.findIndex((p) => p.label === ti.currentLabel)
        cur = { start: ti.periods[ci].start, end: ti.periods[ci].end }
        prev = { start: ti.periods[ci - 1].start, end: ti.periods[ci - 1].end }
        curL = { vi: periodLabel(ti.currentLabel, 'vi'), en: periodLabel(ti.currentLabel, 'en') }
        prevL = { vi: periodLabel(ti.previousLabel, 'vi'), en: periodLabel(ti.previousLabel, 'en') }
      }
      const cIdx = filterRows(ds, roles, pq, cur)
      const pIdx = filterRows(ds, roles, pq, prev)
      if (pq.dimension) {
        const gc = groupIndex(root.subset(cIdx), pq.dimension)
        const gp = groupIndex(root.subset(pIdx), pq.dimension)
        const rows = [...new Set([...gc.keys(), ...gp.keys()])].map((k) => {
          const a = gc.get(k) ? evalMetric(root.subset(Int32Array.from(gc.get(k)!)), metric!) : 0
          const b = gp.get(k) ? evalMetric(root.subset(Int32Array.from(gp.get(k)!)), metric!) : 0
          return { k, cur: a, prev: b, chg: b ? (a - b) / Math.abs(b) : NaN }
        }).filter((r) => Number.isFinite(r.chg))
        const down = pq.growthDirection === 'down' || pq.direction === 'asc'
        rows.sort((a, b) => (down ? a.chg - b.chg : b.chg - a.chg))
        if (!rows.length) return { ...base, status: 'nodata', answer: L('Không đủ dữ liệu ở hai kỳ để so sánh.', 'Not enough data in both periods.') }
        const top = rows[0]
        const dimL = ROLE_META[pq.dimension].label
        base.answer = both((l) => (l === 'vi' ? `${dimL.vi} ${down ? 'giảm mạnh nhất' : 'tăng mạnh nhất'}: ${top.k} — ${lower(mLabel).vi} ${f(top.chg, 'percent', l, true)} (${f(top.prev, mf, l)} → ${f(top.cur, mf, l)}), ${curL.vi} so với ${prevL.vi}.` : `${dimL.en} with the ${down ? 'largest decline' : 'strongest growth'}: ${top.k} — ${lower(mLabel).en} ${f(top.chg, 'percent', l, true)} (${f(top.prev, mf, l)} → ${f(top.cur, mf, l)}), ${curL.en} vs ${prevL.en}.`))
        base.highlights.push({ label: dimL, value: NaN, format: 'number', text: top.k }, { label: L('Thay đổi', 'Change'), value: top.chg, format: 'percent', tone: top.chg >= 0 ? 'positive' : 'negative' }, { label: L('Kỳ hiện tại', 'Current'), value: top.cur, format: mf })
        const sel = rows.slice(0, Math.min(rows.length, pq.topN ?? 12))
        base.chart = { id: 'q_growth', kind: 'hbar', title: { vi: `Tăng trưởng ${lower(mLabel).vi} theo ${lower(dimL).vi}`, en: `${mLabel.en} growth by ${lower(dimL).en}` }, categories: sel.map((r) => r.k), series: [{ name: L('Thay đổi', 'Change'), values: sel.map((r) => r.chg), format: 'percent', tone: down ? 'negative' : 'positive' }] }
        base.table = { columns: [{ key: 'label', label: dimL }, { key: 'prev', label: L('Kỳ trước', 'Previous'), format: mf }, { key: 'cur', label: L('Kỳ hiện tại', 'Current'), format: mf }, { key: 'chg', label: L('Thay đổi', 'Change'), format: 'percent' }], rows: sel.map((r) => ({ label: r.k, prev: r.prev, cur: r.cur, chg: r.chg })) }
        return base
      }
      const a = evalMetric(root.subset(cIdx), metric!)
      const b = evalMetric(root.subset(pIdx), metric!)
      const chg = b ? (a - b) / Math.abs(b) : NaN
      base.answer = both((l) => (l === 'vi' ? `${mLabel.vi} ${curL.vi}: ${f(a, mf, l)}, ${Number.isFinite(chg) ? `${chg >= 0 ? 'tăng' : 'giảm'} ${f(Math.abs(chg), 'percent', l)} so với ${prevL.vi} (${f(b, mf, l)})` : 'không có dữ liệu kỳ trước để so sánh'}.` : `${mLabel.en} ${curL.en}: ${f(a, mf, l)}, ${Number.isFinite(chg) ? `${chg >= 0 ? 'up' : 'down'} ${f(Math.abs(chg), 'percent', l)} vs ${prevL.en} (${f(b, mf, l)})` : 'no previous-period data to compare'}.`))
      base.highlights.push({ label: L('Kỳ hiện tại', 'Current'), value: a, format: mf }, { label: L('Kỳ trước', 'Previous'), value: b, format: mf }, { label: L('Tăng trưởng', 'Growth'), value: chg, format: 'percent', tone: chg >= 0 ? 'positive' : 'negative' })
      base.chart = { id: 'q_growth', kind: 'bar', title: { vi: 'Kỳ hiện tại so với kỳ trước', en: 'Current vs previous period' }, categories: [prevL.vi === 'kỳ trước' ? 'Prev' : prevL.vi, curL.vi], series: [{ name: mLabel, values: [b, a], format: mf, tone: 'primary' }] }
      return base
    }
    case 'TREND': {
      if (!dates) return { ...base, status: 'nodata', answer: L('Cần cột ngày để xem xu hướng.', 'A date column is needed for trends.') }
      const grain = pq.timeGrain ?? schema.defaultGrain
      const tg = timeGroups(c, dates, grain)
      const pts = [...tg.entries()].map(([k, ix]) => ({ k, v: evalMetric(root.subset(Int32Array.from(ix)), metric!) })).filter((p) => Number.isFinite(p.v))
      if (pts.length < 2) return { ...base, status: 'nodata', answer: L('Không đủ kỳ dữ liệu.', 'Not enough periods.') }
      const tl = trendLine(pts.map((p) => p.v))
      const avg = pts.reduce((s, p) => s + p.v, 0) / pts.length
      const slopePct = avg ? tl.slope / Math.abs(avg) : 0
      const hi = pts.reduce((a, p) => (p.v > a.v ? p : a))
      const lo = pts.reduce((a, p) => (p.v < a.v ? p : a))
      base.answer = both((l) => (l === 'vi' ? `${mLabel.vi} qua ${pts.length} kỳ: ${slopePct >= 0.01 ? 'xu hướng tăng' : slopePct <= -0.01 ? 'xu hướng giảm' : 'tương đối đi ngang'} (${f(slopePct, 'percent', l, true)}/kỳ, R² ${f(tl.r2, 'score', l)}). Cao nhất ${periodLabel(hi.k, l)} (${f(hi.v, mf, l)}), thấp nhất ${periodLabel(lo.k, l)} (${f(lo.v, mf, l)}).` : `${mLabel.en} over ${pts.length} periods: ${slopePct >= 0.01 ? 'upward trend' : slopePct <= -0.01 ? 'downward trend' : 'broadly flat'} (${f(slopePct, 'percent', l, true)}/period, R² ${f(tl.r2, 'score', l)}). Peak ${periodLabel(hi.k, l)} (${f(hi.v, mf, l)}), low ${periodLabel(lo.k, l)} (${f(lo.v, mf, l)}).`))
      base.highlights.push({ label: L('Bình quân / kỳ', 'Average / period'), value: avg, format: mf }, { label: L('Xu hướng / kỳ', 'Trend / period'), value: slopePct, format: 'percent', tone: slopePct >= 0 ? 'positive' : 'negative' }, { label: L('Kỳ cao nhất', 'Peak'), value: hi.v, format: mf })
      base.chart = { id: 'q_trend', kind: 'area', title: { vi: `${mLabel.vi} theo ${{ day: 'ngày', week: 'tuần', month: 'tháng', quarter: 'quý', year: 'năm' }[grain]}`, en: `${mLabel.en} by ${grain}` }, categories: pts.map((p) => p.k), series: [{ name: mLabel, values: pts.map((p) => p.v), format: mf, tone: 'primary', kind: 'area' }], zoom: pts.length > 30 }
      base.table = { columns: [{ key: 'period', label: L('Kỳ', 'Period') }, { key: 'value', label: mLabel, format: mf }], rows: pts.slice(-24).map((p) => ({ period: p.k, value: p.v })) }
      return base
    }
    case 'PARETO': {
      const dim = pq.dimension!
      const g = groupIndex(c, dim)
      const rows = [...g.entries()].map(([k, ix]) => ({ k, v: evalMetric(root.subset(Int32Array.from(ix)), metric!) })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v)
      if (rows.length < 3) return { ...base, status: 'nodata', answer: L('Cần ít nhất 3 nhóm để phân tích Pareto.', 'At least 3 groups are needed for Pareto.') }
      const total = rows.reduce((s, r) => s + r.v, 0)
      const n20 = Math.max(1, Math.round(rows.length * 0.2))
      const top20 = rows.slice(0, n20).reduce((s, r) => s + r.v, 0) / total
      let cum = 0
      let k80 = rows.length
      const items = rows.map((r, i) => {
        cum += r.v
        if (cum / total >= 0.8 && k80 === rows.length) k80 = i + 1
        return { ...r, cum: cum / total }
      })
      const dimL = ROLE_META[dim].label
      base.answer = both((l) => (l === 'vi' ? `20% ${lower(dimL).vi} hàng đầu (${n20}/${rows.length}) tạo ra ${f(top20, 'percent', l)} ${lower(mLabel).vi}. ${f(k80 / rows.length, 'percent', l)} số ${lower(dimL).vi} (${k80}) tạo ra 80% ${lower(mLabel).vi}.` : `The top 20% of ${lower(dimL).en} (${n20}/${rows.length}) generate ${f(top20, 'percent', l)} of ${lower(mLabel).en}. ${f(k80 / rows.length, 'percent', l)} of ${lower(dimL).en} (${k80}) generate 80%.`))
      base.highlights.push({ label: L('Top 20% đóng góp', 'Top 20% contribute'), value: top20, format: 'percent' }, { label: L('Tỷ lệ tạo 80%', 'Share for 80%'), value: k80 / rows.length, format: 'percent' }, { label: L('Số nhóm', 'Groups'), value: rows.length, format: 'integer' })
      const sel = items.slice(0, 25)
      base.chart = { id: 'q_pareto', kind: 'pareto', title: { vi: `Pareto ${lower(dimL).vi}`, en: `Pareto — ${lower(dimL).en}` }, categories: sel.map((r) => r.k), series: [{ name: L('Tỷ trọng', 'Share'), values: sel.map((r) => r.v / total), kind: 'bar', format: 'percent', tone: 'primary' }, { name: L('Lũy kế', 'Cumulative'), values: sel.map((r) => r.cum), kind: 'line', format: 'percent', tone: 'secondary' }] }
      base.table = { columns: [{ key: 'label', label: dimL }, { key: 'value', label: mLabel, format: mf }, { key: 'cum', label: L('Lũy kế', 'Cumulative'), format: 'percent' }], rows: sel.map((r) => ({ label: r.k, value: r.v, cum: r.cum })) }
      return base
    }
    case 'ANOMALY': {
      if (pq.timeGrain && dates) {
        const md = metric ?? lexicon().metrics.find((x) => x.def.id === schema.mainMetric)?.def
        if (md) {
          const tg = timeGroups(c, dates, pq.timeGrain)
          const pts = [...tg.entries()].map(([k, ix]) => ({ label: k, start: 0, value: evalMetric(root.subset(Int32Array.from(ix)), md), count: ix.length }))
          const vals = pts.map((p) => p.value)
          const an = detectSeriesAnomalies({ measure: md.id, label: md.label, format: metricFormat(md), points: pts, movingAvg: vals, growth: [] }, analysis?.sensitivity ?? 'balanced', pq.timeGrain)
          base.answer = an.length ? both((l) => (l === 'vi' ? `Phát hiện ${an.length} kỳ ${lower(md.label).vi} bất thường. Đáng chú ý nhất: ${periodLabel(an[0].label, l)} — ${f(an[0].actual, metricFormat(md), l)} (kỳ vọng ${f(an[0].expectedLow, metricFormat(md), l)}–${f(an[0].expectedHigh, metricFormat(md), l)}).` : `${an.length} unusual periods found for ${lower(md.label).en}. Most notable: ${periodLabel(an[0].label, l)} — ${f(an[0].actual, metricFormat(md), l)} (expected ${f(an[0].expectedLow, metricFormat(md), l)}–${f(an[0].expectedHigh, metricFormat(md), l)}).`)) : L(`Không phát hiện kỳ bất thường đáng kể cho ${lower(md.label).vi}.`, `No significant anomalies found for ${lower(md.label).en}.`)
          base.chart = { id: 'q_anom', kind: 'line', title: { vi: `${md.label.vi} — điểm bất thường`, en: `${md.label.en} — anomalies` }, categories: pts.map((p) => p.label), series: [{ name: md.label, values: vals, format: metricFormat(md), tone: 'primary', kind: 'line' }], insightKey: JSON.stringify(an.map((a) => a.label)), zoom: pts.length > 40 }
          base.table = { columns: [{ key: 'period', label: L('Kỳ', 'Period') }, { key: 'actual', label: L('Thực tế', 'Actual'), format: metricFormat(md) }, { key: 'expected', label: L('Kỳ vọng', 'Expected'), format: metricFormat(md) }, { key: 'dev', label: L('Độ lệch', 'Deviation'), format: 'percent' }, { key: 'sev', label: L('Mức độ', 'Severity') }], rows: an.map((a) => ({ period: a.label, actual: a.actual, expected: a.expected, dev: a.deviation, sev: a.severity })) }
          base.highlights.push({ label: L('Số kỳ bất thường', 'Anomalous periods'), value: an.length, format: 'integer' })
          return base
        }
      }
      const list = (analysis?.anomalies.anomalies ?? []).filter((a) => !metric || a.metric === metric.id || a.metric === metric.role)
      base.answer = list.length ? both((l) => (l === 'vi' ? `Có ${list.length} điểm bất thường (${list.filter((a) => a.severity === 'high').length} mức cao). Nổi bật: ${list[0].metricLabel.vi} ${list[0].scope === 'series' ? periodLabel(list[0].label, l) : list[0].label} — ${f(list[0].actual, list[0].format, l)}, lệch ${f(list[0].deviation, 'percent', l, true)} so với kỳ vọng.` : `${list.length} anomalies found (${list.filter((a) => a.severity === 'high').length} high). Notable: ${list[0].metricLabel.en} ${list[0].scope === 'series' ? periodLabel(list[0].label, l) : list[0].label} — ${f(list[0].actual, list[0].format, l)}, ${f(list[0].deviation, 'percent', l, true)} vs expected.`)) : L('Không phát hiện điểm bất thường đáng kể với độ nhạy hiện tại.', 'No significant anomalies at the current sensitivity.')
      base.highlights.push({ label: L('Bất thường', 'Anomalies'), value: list.length, format: 'integer' }, { label: L('Mức cao', 'High'), value: list.filter((a) => a.severity === 'high').length, format: 'integer', tone: 'negative' })
      base.table = { columns: [{ key: 'metric', label: L('Chỉ số', 'Metric') }, { key: 'label', label: L('Thời điểm / nhóm', 'When / group') }, { key: 'actual', label: L('Thực tế', 'Actual') }, { key: 'range', label: L('Khoảng kỳ vọng', 'Expected range') }, { key: 'dev', label: L('Độ lệch', 'Deviation'), format: 'percent' }, { key: 'sev', label: L('Mức độ', 'Severity') }], rows: list.slice(0, 15).map((a) => ({ metric: a.metricLabel.vi + ' / ' + a.metricLabel.en, label: a.label, actual: f(a.actual, a.format, 'vi'), range: `${f(a.expectedLow, a.format, 'vi')} – ${f(a.expectedHigh, a.format, 'vi')}`, dev: a.deviation, sev: a.severity })) }
      return base
    }
    case 'CORRELATION': {
      const m1 = pq.metric
      const m2 = pq.metric2
      if (m1?.kind === 'measure' && m2?.kind === 'measure') {
        const a = root.measure(m1.role!)!
        const b = root.measure(m2.role!)!
        const xs = Float64Array.from(idx, (i) => a[i])
        const ys = Float64Array.from(idx, (i) => b[i])
        const { r, n } = pearson(xs, ys)
        const st = strengthLabel(r)
        base.answer = both((l) => (l === 'vi' ? `Hệ số tương quan giữa ${lower(m1.label).vi} và ${lower(m2.label).vi}: r = ${f(r, 'score', l)} (${f(n, 'integer', l)} dòng) — ${st.vi}. Đây là liên hệ thống kê, không khẳng định quan hệ nhân quả.` : `Correlation between ${lower(m1.label).en} and ${lower(m2.label).en}: r = ${f(r, 'score', l)} (${f(n, 'integer', l)} rows) — ${st.en}. This is a statistical association, not causation.`))
        base.highlights.push({ label: L('Hệ số r', 'Coefficient r'), value: r, format: 'score' }, { label: L('Số dòng', 'Rows'), value: n, format: 'integer' })
        const pts: { x: number; y: number; label: string }[] = []
        const step = Math.max(1, Math.floor(idx.length / 800))
        for (let i = 0; i < idx.length; i += step) if (xs[i] === xs[i] && ys[i] === ys[i]) pts.push({ x: xs[i], y: ys[i], label: `#${idx[i] + 1}` })
        base.chart = { id: 'q_corr', kind: 'scatter', title: { vi: `${m1.label.vi} và ${m2.label.vi}`, en: `${m1.label.en} vs ${m2.label.en}` }, categories: [], series: [], points: pts, xFormat: metricFormat(m1), yFormat: metricFormat(m2) }
        return base
      }
      const corr = analysis?.correlation
      if (!corr || !corr.pairs.length) return { ...base, status: 'nodata', answer: L('Cần ít nhất 2 trường số để tính tương quan.', 'At least two numeric fields are needed for correlation.') }
      const top = corr.pairs.slice(0, 6)
      const rl = (r: string) => ROLE_META[r as Role]?.label ?? L(r, r)
      base.answer = both((l) => (l === 'vi' ? `Cặp liên hệ mạnh nhất: ${rl(top[0].a).vi} – ${rl(top[0].b).vi} (r = ${top[0].r.toFixed(2)}, ${top[0].strength.vi}). Chỉ thể hiện liên hệ thống kê.` : `Strongest pair: ${rl(top[0].a).en} – ${rl(top[0].b).en} (r = ${top[0].r.toFixed(2)}, ${top[0].strength.en}). Statistical association only.`))
      base.table = { columns: [{ key: 'pair', label: L('Cặp chỉ số', 'Pair') }, { key: 'r', label: L('r', 'r'), format: 'score' }, { key: 's', label: L('Mức độ', 'Strength') }], rows: top.map((p) => ({ pair: `${rl(p.a).vi} – ${rl(p.b).vi}`, r: p.r, s: p.strength.vi })) }
      return base
    }
    case 'FORECAST': {
      if (!dates) return { ...base, status: 'nodata', answer: L('Cần cột ngày để dự phóng.', 'A date column is needed for projection.') }
      const grain = analysis?.time?.granularity ?? schema.defaultGrain
      const tg = timeGroups(c, dates, grain)
      const keys = [...tg.keys()]
      const usable = analysis?.time?.partialLast ? keys.slice(0, -1) : keys
      const starts = new Map<string, number>()
      c.forEach((i) => {
        const t = dates[i]
        if (t === t) {
          const st = periodStart(t, grain)
          starts.set(periodKey(st, grain), st)
        }
      })
      const pts = usable.map((k) => ({ label: k, start: starts.get(k) ?? 0, value: evalMetric(root.subset(Int32Array.from(tg.get(k)!)), metric!), count: tg.get(k)!.length }))
      const fr = projectSeries({ measure: metric!.id, label: mLabel, format: mf, points: pts, movingAvg: [], growth: [] }, grain)
      if (!fr.ok) return { ...base, answer: fr.reason ?? L('Không đủ dữ liệu để dự phóng tin cậy.', 'Insufficient data for reliable projection.'), notes: [...base.notes, L('Dự phóng thống kê (Statistical Projection) — không phải dự báo AI.', 'Statistical Projection — not an AI forecast.')] }
      base.answer = both((l) => (l === 'vi' ? `Dự phóng thống kê ${lower(mLabel).vi} kỳ ${periodLabel(fr.projection[0].label, l)}: ${f(fr.projection[0].value, mf, l)} (khoảng ${f(fr.projection[0].low, mf, l)} – ${f(fr.projection[0].high, mf, l)}). Độ tin cậy: ${fr.quality === 'high' ? 'cao' : fr.quality === 'medium' ? 'trung bình' : 'thấp'} (${fr.qualityScore}/100).` : `Statistical projection of ${lower(mLabel).en} for ${periodLabel(fr.projection[0].label, l)}: ${f(fr.projection[0].value, mf, l)} (range ${f(fr.projection[0].low, mf, l)} – ${f(fr.projection[0].high, mf, l)}). Quality: ${fr.quality} (${fr.qualityScore}/100).`))
      base.notes.push(L('Dự phóng thống kê (hồi quy tuyến tính + trung bình trượt có trọng số) — không phải dự báo AI.', 'Statistical Projection (linear regression + weighted moving average) — not an AI forecast.'))
      base.highlights.push({ label: L('Kỳ tới', 'Next period'), value: fr.projection[0].value, format: mf }, { label: L('Chất lượng', 'Quality'), value: fr.qualityScore, format: 'integer' })
      base.chart = { id: 'q_fc', kind: 'line', title: { vi: `Dự phóng thống kê — ${mLabel.vi}`, en: `Statistical projection — ${mLabel.en}` }, categories: [...fr.history.map((h) => h.label), ...fr.projection.map((p) => p.label)], series: [{ name: L('Thực tế', 'Actual'), values: [...fr.history.map((h) => h.value), ...fr.projection.map(() => NaN)], format: mf, kind: 'line', tone: 'primary' }, { name: L('Dự phóng', 'Projection'), values: [...fr.history.map((_, i) => (i === fr.history.length - 1 ? fr.history[i].value : NaN)), ...fr.projection.map((p) => p.value)], format: mf, kind: 'line', tone: 'projection', dashed: true }] }
      return base
    }
  }
  return { ...base, status: 'unknown', answer: L('Tôi chưa xác định chính xác yêu cầu.', 'I could not determine the request precisely.') }
}

function scopeText(pq: ParsedQuery): L10n {
  const parts: L10n[] = []
  for (const x of pq.filters) parts.push({ vi: x.values.slice(0, 3).join(', '), en: x.values.slice(0, 3).join(', ') })
  if (pq.time) parts.push(pq.time.label)
  if (!parts.length) return { vi: '', en: '' }
  return { vi: ` (${parts.map((p) => p.vi).join(' · ')})`, en: ` (${parts.map((p) => p.en).join(' · ')})` }
}
