/**
 * NATURAL LANGUAGE QUERY PARSER (local, rule-based — no LLM)
 * normalize → time → filter values → metrics → time grain → dimensions → operations → intent.
 * Unknown questions return intent null instead of guessing.
 */
import type { Dataset, Granularity, L10n, Role } from '@/types/core'
import { normalizeKey, normalizeValue, containsPhrase } from '@/lib/text'
import { lexicon, VALUE_SYNONYMS, type MetricDef, type QueryOp } from './lexicon'
import { nextPeriod, periodKey, periodLabel, periodStart } from '../analysis/time'
import type { RoleMap } from '../analysis/context'

export interface TimeFilter {
  start: number
  end: number
  grain: Granularity
  label: L10n
  /** previous comparable window (for growth) */
  prevStart: number
  prevEnd: number
}

export interface ParsedQuery {
  raw: string
  normalized: string
  op: QueryOp | null
  metric: MetricDef | null
  metric2: MetricDef | null
  dimension: Role | null
  timeGrain: Granularity | null
  filters: { role: Role; values: string[]; matched: string }[]
  time: TimeFilter | null
  topN: number | null
  direction: 'desc' | 'asc'
  growthDirection: 'up' | 'down' | null
  confidence: number
  tokensUnused: string[]
  defaulted: string[]
}

export interface QuerySchema {
  roles: RoleMap
  available: Set<Role>
  valueIndex: { role: Role; value: string; norm: string }[]
  anchor: number | null
  defaultGrain: Granularity
  mainMetric: string
}

const STOP = new Set(['cua', 'va', 'voi', 'la', 'cho', 'toi', 'xem', 'hien', 'thi', 'bao', 'nhieu', 'nao', 'gi', 'the', 'what', 'is', 'are', 'of', 'the', 'and', 'in', 'for', 'show', 'me', 'nhat', 'top', 'theo', 'tung', 'moi', 'by', 'co', 'khong', 'duoc', 'nhung', 'cac', 'mot', 'trong', 'tai', 'o', 'den', 'tu', 'nay', 'truoc', 'thang', 'nam', 'quy', 'tuan', 'ngay', 'a', 'an', 'to', 'which', 'how', 'many', 'much', 'tong', 'ai', 'dau', 'ra', 'tao', 'bang', 'so', 'sanh', 'hay', 'dang', 'da', 'se', 'can', 'hoi', 'list', 'liet', 'ke', 'danh', 'sach'])

/** Only keep dimension phrases that are unambiguous in questions. */
const DIM_BLOCK = new Set(['ban', 'nguoi', 'hang', 'name', 'ten', 'type', 'code', 'cn', 'nv', 'kh', 'sp', 'rep', 'am', 'agent', 'owner', 'sale', 'title', 'level', 'role', 'unit', 'model', 'item', 'order', 'value', 'state', 'source', 'tt', 'ncc', 'dc', 'bin', 'case', 'tool', 'cell', 'kip', 'grade', 'class'])

export function buildQuerySchema(ds: Dataset, roles: RoleMap, anchor: number | null, defaultGrain: Granularity, mainMetric: string): QuerySchema {
  const available = new Set<Role>()
  for (const r of Object.keys(roles) as Role[]) available.add(r)
  if (roles.revenue && roles.cost) available.add('profit')
  const valueIndex: QuerySchema['valueIndex'] = []
  for (const [role, key] of Object.entries(roles) as [Role, string][]) {
    const col = ds.columns.find((c) => c.key === key)
    if (!col || col.storage !== 'str' || col.unique > 3000) continue
    const arr = ds.str[key]
    const seen = new Set<string>()
    for (const v of arr) {
      if (v === null || seen.has(v)) continue
      seen.add(v)
      const norm = normalizeValue(v).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
      if (norm.length >= 1) valueIndex.push({ role, value: v, norm })
    }
  }
  return { roles, available, valueIndex, anchor, defaultGrain, mainMetric }
}

function mask(text: string, phrase: string): string {
  const padded = ' ' + text + ' '
  const i = padded.indexOf(' ' + phrase + ' ')
  if (i < 0) return text
  return (padded.slice(0, i) + ' ' + '§'.repeat(1) + ' ' + padded.slice(i + phrase.length + 2)).replace(/\s+/g, ' ').trim()
}

function lbl(vi: string, en: string): L10n {
  return { vi, en }
}

/** Detect time filters relative to the latest date in the data (anchor). */
export function parseTime(q: string, anchor: number | null): { time: TimeFilter | null; rest: string } {
  if (anchor === null) return { time: null, rest: q }
  let rest = q
  const make = (start: number, g: Granularity, n = 1, label?: L10n): TimeFilter => {
    let end = start
    for (let i = 0; i < n; i++) end = nextPeriod(end, g)
    let prevStart = start
    for (let i = 0; i < n; i++) {
      // step back one period
      const d = new Date(prevStart)
      prevStart = g === 'day' ? prevStart - 86400000 : g === 'week' ? prevStart - 7 * 86400000 : g === 'month' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1) : g === 'quarter' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 3, 1) : Date.UTC(d.getUTCFullYear() - 1, 0, 1)
    }
    const k = periodKey(start, g)
    return { start, end, grain: g, label: label ?? { vi: periodLabel(k, 'vi'), en: periodLabel(k, 'en') }, prevStart, prevEnd: start }
  }
  const back = (t: number, g: Granularity, n: number) => {
    let s = periodStart(t, g)
    for (let i = 0; i < n; i++) {
      const d = new Date(s)
      s = g === 'day' ? s - 86400000 : g === 'week' ? s - 7 * 86400000 : g === 'month' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1) : g === 'quarter' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 3, 1) : Date.UTC(d.getUTCFullYear() - 1, 0, 1)
    }
    return s
  }
  const rel: [RegExp, Granularity, number][] = [
    [/\b(thang nay|this month|thang hien tai|current month)\b/, 'month', 0],
    [/\b(thang truoc|thang roi|last month|previous month|thang vua roi)\b/, 'month', 1],
    [/\b(quy nay|this quarter|quy hien tai)\b/, 'quarter', 0],
    [/\b(quy truoc|last quarter|quy roi)\b/, 'quarter', 1],
    [/\b(nam nay|this year|nam hien tai)\b/, 'year', 0],
    [/\b(nam truoc|nam ngoai|last year|nam roi)\b/, 'year', 1],
    [/\b(tuan nay|this week)\b/, 'week', 0],
    [/\b(tuan truoc|last week|tuan roi)\b/, 'week', 1],
    [/\b(hom nay|today)\b/, 'day', 0],
    [/\b(hom qua|yesterday)\b/, 'day', 1],
  ]
  for (const [re, g, n] of rel) {
    const m = rest.match(re)
    if (m) {
      rest = rest.replace(re, ' ').replace(/\s+/g, ' ').trim()
      return { time: make(back(anchor, g, n), g), rest }
    }
  }
  let m: RegExpMatchArray | null
  // last N days/weeks/months
  if ((m = rest.match(/\b(\d{1,3}) (ngay|tuan|thang|quy|nam) (qua|gan nhat|gan day|vua qua|cuoi)\b/)) || (m = rest.match(/\b(?:last|past) (\d{1,3}) (days?|weeks?|months?|quarters?|years?)\b/))) {
    const n = Math.max(1, Math.min(365, +m[1]))
    const unit = m[2]
    const g: Granularity = /^(ngay|day)/.test(unit) ? 'day' : /^(tuan|week)/.test(unit) ? 'week' : /^(thang|month)/.test(unit) ? 'month' : /^(quy|quarter)/.test(unit) ? 'quarter' : 'year'
    rest = rest.replace(m[0], ' ').replace(/\s+/g, ' ').trim()
    const start = back(anchor, g, n - 1)
    const tf = make(start, g, n, { vi: `${n} ${{ day: 'ngày', week: 'tuần', month: 'tháng', quarter: 'quý', year: 'năm' }[g]} gần nhất`, en: `last ${n} ${g}${n > 1 ? 's' : ''}` })
    return { time: tf, rest }
  }
  // year to date
  if ((m = rest.match(/\b(tu dau nam|ytd|year to date|luy ke nam)\b/))) {
    rest = rest.replace(m[0], ' ').replace(/\s+/g, ' ').trim()
    const ys = periodStart(anchor, 'year')
    const end = periodStart(anchor, 'day') + 86400000
    return { time: { start: ys, end, grain: 'day', label: lbl('Từ đầu năm', 'Year to date'), prevStart: Date.UTC(new Date(ys).getUTCFullYear() - 1, 0, 1), prevEnd: end - 365 * 86400000 }, rest }
  }
  // specific month: thang 5 / thang 5 2026 / thang 5/2026 / t5
  if ((m = rest.match(/\b(?:thang|t) ?(\d{1,2})(?:\s*(?:nam)?\s*(\d{4}))?\b/)) && +m[1] >= 1 && +m[1] <= 12) {
    const ay = new Date(anchor).getUTCFullYear()
    const am = new Date(anchor).getUTCMonth() + 1
    const y = m[2] ? +m[2] : +m[1] > am ? ay - 1 : ay
    rest = rest.replace(m[0], ' ').replace(/\s+/g, ' ').trim()
    return { time: make(Date.UTC(y, +m[1] - 1, 1), 'month'), rest }
  }
  // quarter: quy 2 / q2 2026
  if ((m = rest.match(/\b(?:quy|q) ?([1-4])(?:\s*(?:nam)?\s*(\d{4}))?\b/))) {
    const ay = new Date(anchor).getUTCFullYear()
    const aq = Math.floor(new Date(anchor).getUTCMonth() / 3) + 1
    const y = m[2] ? +m[2] : +m[1] > aq ? ay - 1 : ay
    rest = rest.replace(m[0], ' ').replace(/\s+/g, ' ').trim()
    return { time: make(Date.UTC(y, (+m[1] - 1) * 3, 1), 'quarter'), rest }
  }
  // explicit year
  if ((m = rest.match(/\b(?:nam )?(20\d{2}|19\d{2})\b/))) {
    rest = rest.replace(m[0], ' ').replace(/\s+/g, ' ').trim()
    return { time: make(Date.UTC(+m[1], 0, 1), 'year'), rest }
  }
  return { time: null, rest }
}

let LEX_PHRASES: Set<string> | null = null
function lexPhrases(): Set<string> {
  if (LEX_PHRASES) return LEX_PHRASES
  const lx = lexicon()
  LEX_PHRASES = new Set([...lx.metrics.map((m) => m.phrase), ...lx.dims.map((d) => d.phrase), ...Object.values(lx.ops).flat(), ...lx.timeDims.map((t) => t[0])])
  return LEX_PHRASES
}

function matchFilters(rest: string, schema: QuerySchema): { filters: ParsedQuery['filters']; rest: string } {
  const filters: ParsedQuery['filters'] = []
  if (!schema.valueIndex.length) return { filters, rest }
  let tokens = rest.split(' ')
  const usedRoles = new Map<Role, ParsedQuery['filters'][number]>()
  const addFilter = (role: Role, values: string[], matched: string) => {
    const ex = usedRoles.get(role)
    if (ex) {
      for (const v of values) if (!ex.values.includes(v)) ex.values.push(v)
      ex.matched += ', ' + matched
    } else {
      const f = { role, values: [...new Set(values)], matched }
      usedRoles.set(role, f)
      filters.push(f)
    }
  }
  // tokens that belong to a vocabulary phrase ("san pham", "doanh thu") only match values exactly
  const vocabTok: boolean[] = new Array(tokens.length).fill(false)
  const phrases = lexPhrases()
  for (let s2 = Math.min(4, tokens.length); s2 >= 1; s2--) {
    for (let i = 0; i + s2 <= tokens.length; i++) {
      if (phrases.has(tokens.slice(i, i + s2).join(' '))) for (let j = i; j < i + s2; j++) vocabTok[j] = true
    }
  }
  for (let size = Math.min(7, tokens.length); size >= 1; size--) {
    for (let i = 0; i + size <= tokens.length; i++) {
      const gram = tokens.slice(i, i + size).join(' ')
      if (gram.includes('§')) continue
      if (size === 1 && (STOP.has(gram) || gram.length < 2)) continue
      if (/^\d+$/.test(gram)) continue
      // exact / prefix / phrase matches
      const exact = schema.valueIndex.filter((v) => v.norm === gram)
      let hits = exact
      // vocabulary words ("san pham", "khach hang") only match a value exactly
      const vocab = phrases.has(gram) || vocabTok.slice(i, i + size).every((v) => v)
      if (!hits.length && !vocab && gram.length >= 3) hits = schema.valueIndex.filter((v) => v.norm.startsWith(gram + ' '))
      if (!hits.length && !vocab && size >= 2) hits = schema.valueIndex.filter((v) => containsPhrase(v.norm, gram))
      if (!hits.length) {
        // synonyms (most specific first)
        const groupKey = Object.keys(VALUE_SYNONYMS).find((k) => k === gram || VALUE_SYNONYMS[k].includes(gram))
        if (groupKey) {
          const syns = [groupKey, ...VALUE_SYNONYMS[groupKey]]
          for (const s of syns) {
            const h = schema.valueIndex.filter((v) => v.norm === s || containsPhrase(v.norm, s))
            if (h.length) {
              hits = h
              break
            }
          }
        }
      }
      if (!hits.length) continue
      // keep a single role (the one with the most specific match)
      const role = hits[0].role
      const vals = hits.filter((h) => h.role === role).map((h) => h.value)
      if (vals.length > 25) continue
      addFilter(role, vals, tokens.slice(i, i + size).join(' '))
      tokens = [...tokens.slice(0, i), '§', ...tokens.slice(i + size)]
      vocabTok.splice(i, size, true)
    }
  }
  return { filters, rest: tokens.join(' ') }
}

export function parseQuery(text: string, schema: QuerySchema): ParsedQuery {
  const lx = lexicon()
  const normalized = normalizeKey(text.replace(/%/g, ' % ').replace(/(\d)\s*%/g, '$1%'))
  let rest = ' ' + normalizeKey(text) + ' '
  rest = rest.trim()
  const defaulted: string[] = []
  const pq: ParsedQuery = { raw: text, normalized, op: null, metric: null, metric2: null, dimension: null, timeGrain: null, filters: [], time: null, topN: null, direction: 'desc', growthDirection: null, confidence: 0, tokensUnused: [], defaulted }
  if (!rest) return pq

  // pareto signals with numbers must be read before time parsing ("20% san pham")
  const paretoSignal = /\b(20|80)\s*(%|phan tram|percent)/.test(text.toLowerCase()) || /pareto|80 ?\/ ?20/.test(rest)

  // top N
  let m: RegExpMatchArray | null
  if ((m = rest.match(/\btop ?(\d{1,3})\b/))) {
    pq.topN = +m[1]
    rest = rest.replace(m[0], ' top ').trim()
  }
  // time
  const t = parseTime(rest, schema.anchor)
  pq.time = t.time
  rest = t.rest
  // filters from data values
  const f = matchFilters(rest, schema)
  pq.filters = f.filters
  rest = f.rest
  // "N <dimension>" e.g. "5 khach hang lon nhat"
  if (pq.topN === null && (m = rest.match(/\b(\d{1,3}) (?!%)/)) && !paretoSignal) {
    const n = +m[1]
    if (n >= 1 && n <= 200) {
      pq.topN = n
      rest = rest.replace(m[0], ' ').trim()
    }
  }
  // dimension phrases that contain a metric word ("nhân viên kinh doanh", "sales rep") win over the metric
  for (const { role, phrase } of lx.dims) {
    if (!schema.available.has(role) || DIM_BLOCK.has(phrase) || !phrase.includes(' ')) continue
    if (!lx.metrics.some((m2) => containsPhrase(phrase, m2.phrase))) continue
    if (containsPhrase(rest, phrase)) {
      pq.dimension = role
      rest = mask(rest, phrase)
      break
    }
  }
  // metrics (longest phrase, available only)
  const metricAvailable = (d: MetricDef) => {
    if (d.kind === 'count') return true
    if (d.kind === 'distinct') return schema.available.has(d.role!)
    if (d.kind === 'measure') return schema.available.has(d.role!)
    return schema.available.has(d.num!) && (d.den === 'count' || schema.available.has(d.den as Role))
  }
  for (const { def, phrase } of lx.metrics) {
    if (!metricAvailable(def)) continue
    if (containsPhrase(rest, phrase)) {
      if (!pq.metric) pq.metric = def
      else if (!pq.metric2 && def.id !== pq.metric.id) pq.metric2 = def
      else continue
      rest = mask(rest, phrase)
      if (pq.metric && pq.metric2) break
    }
  }
  // time grain as a dimension
  for (const [phrase, g] of lx.timeDims) {
    if (containsPhrase(rest, phrase)) {
      pq.timeGrain = g
      rest = mask(rest, phrase)
      break
    }
  }
  // dimensions
  for (const { role, phrase } of pq.dimension ? [] : lx.dims) {
    if (!schema.available.has(role) || DIM_BLOCK.has(phrase)) continue
    if (pq.filters.some((x) => x.role === role) && !/\b(theo|tung|moi|nao|by|which|each)\b/.test(rest)) continue
    if (containsPhrase(rest, phrase)) {
      pq.dimension = role
      rest = mask(rest, phrase)
      break
    }
  }
  // operations
  const has = (k: string) => {
    let hit = false
    for (const p of lx.ops[k]) {
      if (containsPhrase(rest, p)) {
        rest = mask(rest, p)
        hit = true
      } else if (containsPhrase(normalized, p)) hit = true
    }
    return hit
  }
  const sig = {
    sum: has('sum'), avg: has('avg'), median: has('median'), count: has('count'), max: has('max'), min: has('min'), top: has('top') || pq.topN !== null,
    bottom: has('bottom'), group: has('group'), rank: has('rank'), compare: has('compare'), growth: has('growth'), growthUp: has('growthUp'), growthDown: has('growthDown'),
    share: has('share'), trend: has('trend'), anomaly: has('anomaly'), pareto: paretoSignal || has('pareto'), correlation: has('correlation'), forecast: has('forecast'), where: has('where'), which: has('which'),
  }
  // "max/min" words that are part of "tăng mạnh nhất" are growth direction
  if (sig.growthUp) pq.growthDirection = 'up'
  if (sig.growthDown) pq.growthDirection = 'down'
  if (sig.min && !sig.max) pq.direction = 'asc'
  if (sig.min && sig.max) pq.direction = /thap nhat|it nhat|kem nhat|lowest|worst|least|nho nhat|cham nhat/.test(normalized) ? 'asc' : 'desc'
  if (sig.where && !pq.dimension) {
    const loc = (['branch', 'region', 'department', 'category', 'channel', 'line', 'warehouse', 'product'] as Role[]).find((r) => schema.available.has(r))
    if (loc) {
      pq.dimension = loc
      defaulted.push('dimension')
    }
  }

  // ---------------------------------------------------------------- compose intent
  const metricDefault = () => {
    if (!pq.metric) {
      const md = lx.metrics.find((x) => x.def.id === schema.mainMetric)?.def ?? lx.metrics.find((x) => x.def.id === 'transactions')!.def
      pq.metric = md
      defaulted.push('metric')
    }
  }
  const compareFilter = pq.filters.find((x) => x.values.length >= 2)
  if (sig.anomaly) {
    pq.op = 'ANOMALY'
  } else if (sig.pareto && (pq.dimension || schema.available.has('product') || schema.available.has('customer'))) {
    pq.op = 'PARETO'
    if (!pq.dimension) {
      pq.dimension = schema.available.has('product') ? 'product' : 'customer'
      defaulted.push('dimension')
    }
    metricDefault()
  } else if (sig.correlation) {
    pq.op = 'CORRELATION'
  } else if (sig.forecast && schema.anchor !== null) {
    pq.op = 'FORECAST'
    metricDefault()
  } else if (sig.compare && (compareFilter || pq.filters.length >= 2)) {
    pq.op = 'COMPARE'
    metricDefault()
  } else if ((sig.growthUp || sig.growthDown) && pq.dimension) {
    pq.op = 'GROWTH'
    metricDefault()
  } else if (sig.growth && !sig.max && !sig.min && schema.anchor !== null && (pq.metric || pq.time || /tang truong|growth|thay doi|bien dong/.test(normalized))) {
    pq.op = 'GROWTH'
    metricDefault()
  } else if (sig.share && (pq.dimension || pq.filters.length)) {
    pq.op = 'SHARE'
    metricDefault()
    if (pq.dimension && (sig.max || sig.which) && pq.topN === null) pq.topN = 1
  } else if (pq.timeGrain && (sig.max || sig.min)) {
    pq.op = sig.min && pq.direction === 'asc' ? 'MIN' : 'MAX'
    pq.dimension = null
    metricDefault()
  } else if (pq.timeGrain || sig.trend) {
    pq.op = 'TREND'
    metricDefault()
    if (!pq.timeGrain) pq.timeGrain = schema.defaultGrain
  } else if (pq.dimension && (sig.top || sig.max || sig.min || sig.bottom || sig.which)) {
    pq.op = pq.direction === 'asc' || sig.bottom ? 'BOTTOM_N' : 'TOP_N'
    metricDefault()
    if (pq.topN === null) pq.topN = sig.top ? 10 : 1
  } else if (pq.dimension && (sig.group || sig.rank || sig.compare)) {
    pq.op = sig.rank ? 'RANK' : 'GROUP_BY'
    metricDefault()
  } else if (pq.dimension && !pq.metric && !sig.count) {
    pq.op = 'GROUP_BY'
    metricDefault()
  } else if (pq.dimension && pq.metric) {
    pq.op = 'GROUP_BY'
  } else if (sig.median && pq.metric) {
    pq.op = 'MEDIAN'
  } else if (sig.avg && pq.metric) {
    pq.op = 'AVERAGE'
  } else if ((sig.max || sig.min) && pq.metric) {
    pq.op = pq.direction === 'asc' ? 'MIN' : 'MAX'
  } else if (sig.count && (pq.metric?.kind === 'count' || pq.metric?.kind === 'distinct' || !pq.metric || pq.dimension)) {
    pq.op = 'COUNT'
    if (!pq.metric) pq.metric = lx.metrics.find((x) => x.def.id === 'transactions')!.def
  } else if (pq.metric) {
    pq.op = pq.metric.kind === 'count' || pq.metric.kind === 'distinct' ? 'COUNT' : 'SUM'
  } else if (pq.filters.length) {
    pq.op = 'SUM'
    metricDefault()
  }
  if (pq.op === 'GROUP_BY' && pq.dimension && pq.metric && pq.topN !== null) pq.op = 'TOP_N'
  // confidence: how much of the question was understood
  const leftovers = rest.split(' ').filter((w) => w && w !== '§' && !STOP.has(w) && !Object.values(lx.ops).some((arr) => arr.includes(w)))
  pq.tokensUnused = leftovers
  const total = Math.max(1, normalized.split(' ').length)
  const conf = 1 - leftovers.length / total - defaulted.length * 0.05
  // refuse to guess when most of the question was not understood
  if (pq.op && conf < 0.45 && !pq.filters.length && !pq.dimension) {
    pq.op = null
    pq.confidence = 0
    return pq
  }
  pq.confidence = pq.op ? Math.max(0.4, Math.min(0.99, conf)) : 0
  return pq
}

/** Build a ParsedQuery from the Query Builder form (no NLP). */
export function builderQuery(input: { metric: MetricDef; op: QueryOp; dimension: Role | null; filter?: { role: Role; values: string[] } | null; time?: TimeFilter | null; topN?: number | null; grain?: Granularity | null }): ParsedQuery {
  return {
    raw: '[Query Builder]',
    normalized: '',
    op: input.op,
    metric: input.metric,
    metric2: null,
    dimension: input.dimension,
    timeGrain: input.grain ?? null,
    filters: input.filter ? [{ ...input.filter, matched: input.filter.values.join(', ') }] : [],
    time: input.time ?? null,
    topN: input.topN ?? null,
    direction: input.op === 'BOTTOM_N' || input.op === 'MIN' ? 'asc' : 'desc',
    growthDirection: null,
    confidence: 1,
    tokensUnused: [],
    defaulted: [],
  }
}
