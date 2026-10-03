/**
 * FACTS
 * A flat, numeric description of the dataset computed once (KPIs, growth, trends, concentration,
 * segment movements, quality). Business rules read ONLY facts — so every rule is testable and every
 * insight can show the exact numbers behind it.
 */
import type { Breakdown, KpiResult, ParetoResult, QualityReport, SeriesMetric } from '@/types/analysis'
import { trendLine, coefficientOfVariation } from '@/lib/stats'

export interface FactSet {
  facts: Record<string, number>
  labels: Record<string, string>
}

export function buildFacts(input: {
  kpis: KpiResult[]
  series: SeriesMetric[]
  breakdowns: Breakdown[]
  pareto: ParetoResult[]
  quality: QualityReport
  rows: number
  periods: number
  currentLabel: string | null
  previousLabel: string | null
  granularity?: string
  polarity?: number
}): FactSet {
  const f: Record<string, number> = {}
  const l: Record<string, string> = {}
  f.rows = input.rows
  f.periods = input.periods
  f['meta.polarity'] = input.polarity ?? 1
  if (input.currentLabel) l.period_cur = input.currentLabel
  if (input.previousLabel) l.period_prev = input.previousLabel

  for (const k of input.kpis) {
    f[`kpi.${k.id}`] = k.value
    if (k.current !== null) f[`kpi.${k.id}.cur`] = k.current
    if (k.previous !== null) f[`kpi.${k.id}.prev`] = k.previous
    if (k.change !== null) f[`kpi.${k.id}.chg`] = k.change
  }

  for (const s of input.series) {
    const vals = s.points.map((p) => p.value).filter((v) => Number.isFinite(v))
    const m = s.measure
    const n = vals.length
    if (n < 2) continue
    const last = vals[n - 1]
    const prev = vals[n - 2]
    if (prev !== 0) f[`g.${m}`] = (last - prev) / Math.abs(prev)
    f[`last.${m}`] = last
    f[`prev.${m}`] = prev
    if (n >= 6) {
      const a = vals.slice(-3).reduce((x, y) => x + y, 0)
      const b = vals.slice(-6, -3).reduce((x, y) => x + y, 0)
      if (b !== 0) f[`g3.${m}`] = (a - b) / Math.abs(b)
    }
    const lag = input.granularity === 'month' ? 12 : input.granularity === 'quarter' ? 4 : input.granularity === 'year' ? 1 : 0
    if (lag && n > lag) {
      const yoyPrev = vals[n - 1 - lag]
      if (yoyPrev) f[`yoy.${m}`] = (last - yoyPrev) / Math.abs(yoyPrev)
    }
    const avg = vals.reduce((x, y) => x + y, 0) / n
    if (avg) f[`last_vs_avg.${m}`] = (last - avg) / Math.abs(avg)
    if (n >= 4) {
      const t = trendLine(vals)
      f[`trend.${m}.slope`] = avg ? t.slope / Math.abs(avg) : 0
      f[`trend.${m}.r2`] = t.r2
      const cv = coefficientOfVariation(vals)
      if (Number.isFinite(cv)) f[`cv.${m}`] = cv
    }
    // consecutive declines / increases at the end of the series
    let dec = 0
    for (let i = n - 1; i > 0 && vals[i] < vals[i - 1]; i--) dec++
    let inc = 0
    for (let i = n - 1; i > 0 && vals[i] > vals[i - 1]; i--) inc++
    f[`decl.${m}`] = dec
    f[`incr.${m}`] = inc
    const mx = Math.max(...vals)
    const mn = Math.min(...vals)
    f[`is_peak.${m}`] = last === mx && n >= 4 ? 1 : 0
    f[`is_low.${m}`] = last === mn && n >= 4 ? 1 : 0
    // acceleration: change of growth
    if (n >= 3 && vals[n - 3] !== 0 && prev !== 0) {
      const g1 = (prev - vals[n - 3]) / Math.abs(vals[n - 3])
      const g2 = (last - prev) / Math.abs(prev)
      f[`accel.${m}`] = g2 - g1
    }
  }

  // margin trend from revenue & profit series
  const rev = input.series.find((s) => s.measure === 'revenue')
  const pro = input.series.find((s) => s.measure === 'profit')
  if (rev && pro && rev.points.length >= 2) {
    const margins = rev.points.map((p, i) => (p.value ? pro.points[i].value / p.value : NaN)).filter((v) => Number.isFinite(v))
    const n = margins.length
    if (n >= 2) {
      f['margin.cur'] = margins[n - 1]
      f['margin.prev'] = margins[n - 2]
      f['margin.chg_pp'] = margins[n - 1] - margins[n - 2]
      let dec = 0
      for (let i = n - 1; i > 0 && margins[i] < margins[i - 1]; i--) dec++
      f['margin.decl'] = dec
      if (n >= 4) {
        const t = trendLine(margins)
        f['margin.slope_pp'] = t.slope
      }
    }
  }

  for (const b of input.breakdowns) {
    const d = b.dimRole
    const items = b.items
    f[`seg.${d}.count`] = b.distinct
    if (b.total > 0 && items.length) {
      f[`seg.${d}.top_share`] = items[0].value / b.total
      l[`seg.${d}.top`] = items[0].label
      f[`seg.${d}.top_value`] = items[0].value
      const top5 = items.slice(0, 5).reduce((s, x) => s + x.value, 0)
      f[`seg.${d}.top5_share`] = top5 / b.total
      const lastItem = items[items.length - 1]
      l[`seg.${d}.bottom`] = lastItem.label
      f[`seg.${d}.bottom_share`] = lastItem.value / b.total
      if (items.length >= 2 && items[1].value > 0) f[`seg.${d}.lead_ratio`] = items[0].value / items[1].value
    }
    // segment movement in the latest period (only segments with material size)
    const movers = items.filter((x) => x.change !== null && x.change !== undefined && (x.previous ?? 0) > 0 && x.share >= 0.02)
    if (movers.length >= 2) {
      const worst = movers.reduce((a, x) => ((x.change as number) < (a.change as number) ? x : a))
      const best = movers.reduce((a, x) => ((x.change as number) > (a.change as number) ? x : a))
      f[`seg.${d}.worst_chg`] = worst.change as number
      l[`seg.${d}.worst`] = worst.label
      f[`seg.${d}.worst_share`] = worst.share
      f[`seg.${d}.best_chg`] = best.change as number
      l[`seg.${d}.best`] = best.label
      f[`seg.${d}.best_share`] = best.share
      f[`seg.${d}.decliners_share`] = movers.filter((x) => (x.change as number) < 0).length / movers.length
      const changes = movers.map((x) => x.change as number)
      const avg = changes.reduce((a, b) => a + b, 0) / changes.length
      f[`seg.${d}.avg_chg`] = avg
      f[`seg.${d}.spread`] = (best.change as number) - (worst.change as number)
    }
  }

  for (const p of input.pareto) {
    f[`pareto.${p.dimRole}.share80`] = p.entityShareFor80
    f[`pareto.${p.dimRole}.top20`] = p.top20Share
    f[`pareto.${p.dimRole}.count`] = p.distinct
  }

  f['dq.score'] = input.quality.score
  f['dq.completeness'] = input.quality.completeness
  f['dq.issues'] = input.quality.issues.length
  return { facts: f, labels: l }
}
