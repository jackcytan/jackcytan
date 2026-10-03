/**
 * DASHBOARD PLANNER
 * Chooses charts from the semantic mapping — never from a fixed template. A chart is only produced
 * when the required fields exist AND the data makes it meaningful (enough groups / periods).
 */
import type { Domain, L10n, Role } from '@/types/core'
import type { Breakdown, ChartSpec, ParetoResult, SeriesMetric } from '@/types/analysis'
import type { Ctx } from './context'
import type { MeasureInfo } from './measures'
import type { TimeIndex } from './time'
import { ROLE_META } from '../dictionaries/roles'

const L = (vi: string, en: string): L10n => ({ vi, en })
const lbl = (r: Role) => ROLE_META[r].label
const by = (a: L10n, b: L10n): L10n => ({ vi: `${a.vi} theo ${b.vi.toLowerCase()}`, en: `${a.en} by ${b.en.toLowerCase()}` })

function topN(b: Breakdown, n: number) {
  return b.items.slice(0, n)
}

export function planCharts(input: {
  ctx: Ctx
  domain: Domain
  time: TimeIndex | null
  periodCtx: Ctx[] | null
  series: SeriesMetric[]
  breakdowns: Breakdown[]
  pareto: ParetoResult[]
  main: MeasureInfo | null
  measures: MeasureInfo[]
}): ChartSpec[] {
  const { ctx, time, series, breakdowns, pareto, main, domain } = input
  const charts: ChartSpec[] = []
  const bd = (r: Role) => breakdowns.find((b) => b.dimRole === r)
  const ser = (r: Role) => series.find((s) => s.measure === r)

  // 1. main trend
  if (time && main) {
    const s = ser(main.role)
    if (s && s.points.length >= 3) {
      charts.push({
        id: 'trend_main',
        kind: 'area',
        title: L(`Xu hướng ${main.label.vi.toLowerCase()}`, `${main.label.en} trend`),
        subtitle: L(`Theo ${time.info.granularity === 'day' ? 'ngày' : time.info.granularity === 'week' ? 'tuần' : time.info.granularity === 'month' ? 'tháng' : 'quý'} · đường nét đứt: trung bình trượt`, `By ${time.info.granularity} · dashed: moving average`),
        categories: s.points.map((p) => p.label),
        series: [
          { name: main.label, values: s.points.map((p) => p.value), kind: 'area', format: main.format, tone: 'primary' },
          { name: L('Trung bình trượt', 'Moving average'), values: s.movingAvg, kind: 'line', format: main.format, tone: 'muted', dashed: true },
        ],
        size: 'lg',
        zoom: s.points.length > 24,
        insightKey: main.role,
      })
    }
  }
  // 2. revenue vs cost (+ margin)
  if (time && ser('revenue') && (ser('cost') || ser('expense'))) {
    const rv = ser('revenue')!
    const cs = (ser('cost') ?? ser('expense'))!
    charts.push({
      id: 'rev_vs_cost',
      kind: 'combo',
      title: L(`Doanh thu và ${cs.label.vi.toLowerCase()}`, `Revenue vs ${cs.label.en.toLowerCase()}`),
      categories: rv.points.map((p) => p.label),
      series: [
        { name: rv.label, values: rv.points.map((p) => p.value), kind: 'bar', format: 'currency', tone: 'primary' },
        { name: cs.label, values: cs.points.map((p) => p.value), kind: 'bar', format: 'currency', tone: 'secondary' },
      ],
      size: 'lg',
      zoom: rv.points.length > 24,
    })
  }
  if (time && ser('revenue') && ser('profit')) {
    const rv = ser('revenue')!
    const pr = ser('profit')!
    if (rv.points.length >= 3)
      charts.push({ id: 'margin_trend', kind: 'line', title: L('Biên lợi nhuận theo kỳ', 'Profit margin by period'), categories: rv.points.map((p) => p.label), series: [{ name: L('Biên lợi nhuận', 'Profit margin'), values: rv.points.map((p, i) => (p.value ? pr.points[i].value / p.value : NaN)), kind: 'line', format: 'percent', tone: 'primary' }], size: 'md', zoom: rv.points.length > 24 })
  }
  // 3. target vs actual by group
  if (ctx.has('target') && main && main.agg === 'sum') {
    const dim = (['region', 'branch', 'salesperson', 'department'] as Role[]).find((r) => bd(r) && bd(r)!.distinct <= 25)
    if (dim) {
      const actualRole: Role = ctx.has('actual') ? 'actual' : 'revenue'
      const act = ctx.groupSum(dim, actualRole)
      const tgt = ctx.groupSum(dim, 'target')
      const labels = [...act.keys()].sort((a, b) => (act.get(b) ?? 0) - (act.get(a) ?? 0)).slice(0, 12)
      charts.push({
        id: 'target_vs_actual',
        kind: 'bar',
        title: by(L('Thực hiện so với mục tiêu', 'Actual vs target'), lbl(dim)),
        categories: labels,
        series: [
          { name: lbl(actualRole), values: labels.map((l) => act.get(l) ?? 0), format: 'currency', tone: 'primary' },
          { name: lbl('target'), values: labels.map((l) => tgt.get(l) ?? 0), format: 'currency', tone: 'muted' },
        ],
        size: 'md',
      })
    }
  }
  // 4. geography / organisation breakdown
  const geo = (['region', 'branch', 'department', 'channel', 'line'] as Role[]).map(bd).find((b) => b && b.distinct >= 2 && b.distinct <= 60)
  if (geo) {
    const items = topN(geo, 12)
    charts.push({
      id: `by_${geo.dimRole}`,
      kind: 'hbar',
      title: by(geo.measureLabel, lbl(geo.dimRole)),
      subtitle: geo.distinct > 12 ? L(`Top 12 / ${geo.distinct}`, `Top 12 of ${geo.distinct}`) : undefined,
      categories: items.map((i) => i.label),
      series: [{ name: geo.measureLabel, values: items.map((i) => i.value), format: geo.format, tone: 'primary' }],
      size: 'md',
    })
  }
  // 5. product / category ranking
  const prod = (['product', 'category', 'campaign', 'machine', 'position'] as Role[]).map(bd).find((b) => b && b !== geo && b.distinct >= 3)
  if (prod) {
    const items = topN(prod, 10)
    charts.push({
      id: `top_${prod.dimRole}`,
      kind: 'bar',
      title: L(`Top ${Math.min(10, prod.distinct)} ${lbl(prod.dimRole).vi.toLowerCase()} theo ${prod.measureLabel.vi.toLowerCase()}`, `Top ${Math.min(10, prod.distinct)} ${lbl(prod.dimRole).en.toLowerCase()} by ${prod.measureLabel.en.toLowerCase()}`),
      categories: items.map((i) => i.label),
      series: [{ name: prod.measureLabel, values: items.map((i) => i.value), format: prod.format, tone: 'primary' }],
      size: 'md',
    })
  }
  // 6. pareto (customer first)
  const par = pareto.find((p) => p.dimRole === 'customer') ?? pareto.find((p) => p.dimRole === 'product')
  if (par && par.distinct >= 8) {
    const items = par.items.slice(0, 25)
    charts.push({
      id: `pareto_${par.dimRole}`,
      kind: 'pareto',
      title: L(`Phân tích Pareto — ${lbl(par.dimRole).vi.toLowerCase()}`, `Pareto analysis — ${lbl(par.dimRole).en.toLowerCase()}`),
      subtitle: L(`${(par.entityShareFor80 * 100).toFixed(1)}% số ${lbl(par.dimRole).vi.toLowerCase()} tạo ra 80% giá trị`, `${(par.entityShareFor80 * 100).toFixed(1)}% of ${lbl(par.dimRole).en.toLowerCase()} generate 80% of value`),
      categories: items.map((i) => i.label),
      series: [
        { name: L('Tỷ trọng', 'Share'), values: items.map((i) => i.value / par.total), kind: 'bar', format: 'percent', tone: 'primary' },
        { name: L('Lũy kế', 'Cumulative'), values: items.map((i) => i.cumShare), kind: 'line', format: 'percent', tone: 'secondary' },
      ],
      size: 'md',
    })
  }
  // 7. composition donut
  const comp = (['channel', 'category', 'status', 'department', 'shift', 'region'] as Role[]).map(bd).find((b) => b && b.distinct >= 2 && b.distinct <= 12 && b !== geo)
  if (comp) {
    const items = comp.items.slice(0, 7)
    const rest = comp.total - items.reduce((s, i) => s + i.value, 0)
    charts.push({
      id: `mix_${comp.dimRole}`,
      kind: 'donut',
      title: L(`Cơ cấu theo ${lbl(comp.dimRole).vi.toLowerCase()}`, `Mix by ${lbl(comp.dimRole).en.toLowerCase()}`),
      categories: [...items.map((i) => i.label), ...(rest > comp.total * 0.005 ? [domain === 'generic' ? 'Khác / Other' : 'Khác / Other'] : [])],
      series: [{ name: comp.measureLabel, values: [...items.map((i) => i.value), ...(rest > comp.total * 0.005 ? [rest] : [])], format: comp.format, tone: 'primary' }],
      size: 'sm',
    })
  }
  // 8. domain specific ratio charts
  const ratioChart = (id: string, num: Role, den: Role | null, dims: Role[], title: L10n, format: ChartSpec['yFormat'], transform?: (v: number) => number) => {
    if (!ctx.has(num) || (den && !ctx.has(den))) return
    const dim = dims.find((d) => bd(d) && bd(d)!.distinct >= 2 && bd(d)!.distinct <= 40)
    if (!dim) return
    const a = ctx.groupSum(dim, num)
    const cnt = ctx.groupSum(dim, 'count')
    const b = den ? ctx.groupSum(dim, den) : cnt
    const rows = [...a.keys()].map((k) => [k, (b.get(k) ?? 0) ? (transform ? transform(a.get(k)! / b.get(k)!) : a.get(k)! / b.get(k)!) : NaN] as [string, number]).filter(([, v]) => Number.isFinite(v)).sort((x, y) => y[1] - x[1]).slice(0, 12)
    if (rows.length < 2) return
    charts.push({ id, kind: 'hbar', title: by(title, lbl(dim)), categories: rows.map((r) => r[0]), series: [{ name: title, values: rows.map((r) => r[1]), format: format ?? 'number', tone: 'secondary' }], size: 'md' })
  }
  if (domain === 'manufacturing' || ctx.has('defect')) {
    ratioChart('defect_by', 'defect', 'output', ['line', 'machine', 'shift', 'product'], L('Tỷ lệ lỗi', 'Defect rate'), 'percent')
    ratioChart('downtime_by', 'downtime', null, ['machine', 'line', 'shift'], L('Thời gian dừng bình quân', 'Average downtime'), 'minutes')
    if (time && ser('output') && ser('planned_output')) {
      const o = ser('output')!
      const p = ser('planned_output')!
      charts.push({ id: 'output_vs_plan', kind: 'combo', title: L('Sản lượng thực tế so với kế hoạch', 'Actual vs planned output'), categories: o.points.map((x) => x.label), series: [{ name: o.label, values: o.points.map((x) => x.value), kind: 'bar', format: 'integer', tone: 'primary' }, { name: p.label, values: p.points.map((x) => x.value), kind: 'line', format: 'integer', tone: 'muted', dashed: true }], size: 'lg', zoom: o.points.length > 24 })
    }
  }
  if (domain === 'marketing' || ctx.has('spend')) {
    ratioChart('roas_by', 'revenue', 'spend', ['channel', 'campaign'], L('ROAS', 'ROAS'), 'ratio')
    ratioChart('cpl_by', 'spend', 'lead', ['channel', 'campaign'], L('Chi phí / lead', 'Cost per lead'), 'currency')
    const sd = (['campaign', 'channel'] as Role[]).find((d) => bd(d) && bd(d)!.distinct >= 4)
    const yRole: Role | null = ctx.has('revenue') ? 'revenue' : ctx.has('lead') ? 'lead' : null
    if (sd && yRole && ctx.has('spend')) {
      const sp = ctx.groupSum(sd, 'spend')
      const rv = ctx.groupSum(sd, yRole)
      charts.push({ id: 'spend_scatter', kind: 'scatter', title: L(`Chi phí và ${lbl(yRole).vi.toLowerCase()} theo ${lbl(sd).vi.toLowerCase()}`, `Spend vs ${lbl(yRole).en.toLowerCase()} by ${lbl(sd).en.toLowerCase()}`), subtitle: L('Mỗi điểm là một nhóm · chỉ thể hiện liên hệ thống kê', 'Each point is a group · statistical association only'), categories: [], series: [], points: [...sp.keys()].map((k) => ({ x: sp.get(k)!, y: rv.get(k) ?? 0, label: k })), xFormat: 'currency', yFormat: ROLE_META[yRole].format, size: 'md' })
    }
  }
  if (domain === 'hr' || ctx.has('salary')) {
    ratioChart('salary_by', 'salary', null, ['department', 'position'], L('Lương bình quân', 'Average salary'), 'currency')
    if (ctx.has('attendance')) ratioChart('absence_by', 'attendance', null, ['department', 'branch'], L('Tỷ lệ vắng mặt', 'Absence rate'), 'percent', (v) => 1 - (v > 1.5 ? v / 100 : v))
    if (ctx.has('performance') && ctx.has('employee')) {
      const sal = ctx.measure('salary')
      const per = ctx.measure('performance')
      const emp = ctx.dim('employee')
      if (sal && per && emp) {
        const pts: { x: number; y: number; label: string }[] = []
        ctx.forEach((i) => {
          if (pts.length < 600 && sal[i] === sal[i] && per[i] === per[i]) pts.push({ x: sal[i], y: per[i], label: emp[i] ?? '' })
        })
        if (pts.length >= 10) charts.push({ id: 'salary_perf', kind: 'scatter', title: L('Lương và điểm hiệu suất', 'Salary vs performance'), subtitle: L('Liên hệ thống kê, không phải quan hệ nhân quả', 'Statistical association, not causation'), categories: [], series: [], points: pts, xFormat: 'currency', yFormat: 'score', size: 'md' })
      }
    }
  }
  if (ctx.has('budget') && (ctx.has('actual') || ctx.has('expense'))) {
    const dim = (['department', 'category'] as Role[]).find((d) => bd(d) && bd(d)!.distinct <= 25)
    if (dim) {
      const actRole: Role = ctx.has('actual') ? 'actual' : 'expense'
      const a = ctx.groupSum(dim, actRole)
      const b = ctx.groupSum(dim, 'budget')
      const labels = [...b.keys()].sort((x, y) => (b.get(y) ?? 0) - (b.get(x) ?? 0)).slice(0, 12)
      charts.push({ id: 'budget_vs_actual', kind: 'bar', title: by(L('Ngân sách và thực chi', 'Budget vs actual'), lbl(dim)), categories: labels, series: [{ name: lbl('budget'), values: labels.map((l) => b.get(l) ?? 0), format: 'currency', tone: 'muted' }, { name: lbl(actRole), values: labels.map((l) => a.get(l) ?? 0), format: 'currency', tone: 'primary' }], size: 'md' })
    }
  }
  if (ctx.has('satisfaction')) ratioChart('csat_by', 'satisfaction', null, ['channel', 'employee', 'branch'], L('Điểm hài lòng', 'Satisfaction'), 'score')
  if (ctx.has('inventory')) ratioChart('inventory_by', 'inventory', null, ['warehouse', 'category', 'product'], L('Tồn kho bình quân', 'Average inventory'), 'integer')

  // 9. heatmap dim × period
  if (time && input.periodCtx && main && main.agg === 'sum') {
    const hd = (['region', 'branch', 'channel', 'line', 'department', 'category'] as Role[]).map(bd).find((b) => b && b.distinct >= 3 && b.distinct <= 12)
    const usable = time.info.periods.length - (time.info.partialLast ? 1 : 0)
    if (hd && usable >= 4) {
      const from = Math.max(0, usable - 12)
      const xs = time.info.periods.slice(from, usable).map((p) => p.label)
      const ys = hd.items.map((i) => i.label)
      const vals: [number, number, number][] = []
      for (let p = from; p < usable; p++) {
        const g = input.periodCtx[p].groupSum(hd.dimRole, main.role)
        ys.forEach((y, yi) => vals.push([p - from, yi, g.get(y) ?? 0]))
      }
      charts.push({ id: 'heatmap', kind: 'heatmap', title: L(`Bản đồ nhiệt ${main.label.vi.toLowerCase()} — ${lbl(hd.dimRole).vi.toLowerCase()} × thời gian`, `${main.label.en} heatmap — ${lbl(hd.dimRole).en.toLowerCase()} × time`), categories: xs, series: [], heat: { x: xs, y: ys, values: vals, format: main.format }, size: 'lg' })
    }
  }
  return charts
}
