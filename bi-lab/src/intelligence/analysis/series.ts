/** Time series per measure + per-segment breakdowns + Pareto. */
import type { Role } from '@/types/core'
import type { Breakdown, ParetoResult, SeriesMetric } from '@/types/analysis'
import type { Ctx } from './context'
import { aggregate, type MeasureInfo } from './measures'
import type { TimeIndex } from './time'
import { DIMENSION_ROLES, ROLE_META } from '../dictionaries/roles'
import { movingAverage } from '@/lib/stats'

export function buildSeries(periodCtx: Ctx[], time: TimeIndex, measures: MeasureInfo[]): SeriesMetric[] {
  const usable = time.info.periods.length - (time.info.partialLast ? 1 : 0)
  return measures.map((m) => {
    const first = time.info.partialFirst ? 1 : 0
    const points = time.info.periods.slice(first, usable).map((p, j) => {
      const c = periodCtx[j + first]
      const v = aggregate(c, m)
      return { label: p.label, start: p.start, value: Number.isFinite(v) ? v : m.agg === 'sum' ? 0 : NaN, count: c.size }
    })
    // for averages, carry forward gaps so charts don't plunge to zero
    if (m.agg === 'avg') {
      let last = NaN
      for (const p of points) {
        if (Number.isFinite(p.value)) last = p.value
        else p.value = last
      }
    }
    const vals = points.map((p) => (Number.isFinite(p.value) ? p.value : 0))
    const window = time.info.granularity === 'day' ? 7 : 3
    const ma = movingAverage(vals, window)
    const growth = vals.map((v, i) => (i === 0 || vals[i - 1] === 0 ? null : (v - vals[i - 1]) / Math.abs(vals[i - 1])))
    return { measure: m.role, label: m.label, format: m.format, points, movingAvg: ma, growth }
  })
}

/** Dimensions that are useful for grouping (2..max distinct). */
export function groupableDims(ctx: Ctx, max = 2000): Role[] {
  return DIMENSION_ROLES.filter((r) => {
    if (!ctx.has(r)) return false
    const d = ctx.distinct(r)
    return d >= 2 && d <= max
  })
}

export function buildBreakdowns(ctx: Ctx, dims: Role[], measure: MeasureInfo | null, cur: Ctx | null, prev: Ctx | null): Breakdown[] {
  const out: Breakdown[] = []
  for (const dim of dims) {
    const role: Role | 'count' = measure && measure.agg === 'sum' ? measure.role : 'count'
    const ranked = ctx.ranked(dim, role)
    if (ranked.length < 2) continue
    let total = 0
    for (const [, v] of ranked) total += v
    const counts = ctx.groupSum(dim, 'count')
    const curMap = cur ? cur.groupSum(dim, role) : null
    const prevMap = prev ? prev.groupSum(dim, role) : null
    const key = ctx.key(dim)!
    out.push({
      dimRole: dim,
      dimKey: key,
      dimColumn: ctx.ds.columns.find((c) => c.key === key)?.name ?? dim,
      measure: role,
      measureLabel: role === 'count' ? { vi: 'Số bản ghi', en: 'Records' } : ROLE_META[role].label,
      format: role === 'count' ? 'integer' : measure!.format,
      total,
      distinct: ranked.length,
      items: ranked.slice(0, 50).map(([label, value]) => {
        const c = curMap?.get(label)
        const p = prevMap?.get(label)
        return {
          label,
          value,
          share: total ? value / total : 0,
          count: counts.get(label) ?? 0,
          current: c,
          previous: p,
          change: c !== undefined && p !== undefined && p !== 0 ? (c - p) / Math.abs(p) : null,
        }
      }),
    })
  }
  return out
}

export function buildPareto(ctx: Ctx, measure: MeasureInfo | null): ParetoResult[] {
  if (!measure || measure.agg !== 'sum') return []
  const dims: Role[] = ['customer', 'product', 'region', 'branch', 'salesperson', 'category', 'channel', 'campaign', 'department', 'machine', 'supplier']
  const out: ParetoResult[] = []
  for (const dim of dims) {
    if (!ctx.has(dim)) continue
    const ranked = ctx.ranked(dim, measure.role).filter(([, v]) => v > 0)
    if (ranked.length < 5) continue
    let total = 0
    for (const [, v] of ranked) total += v
    let cum = 0
    let share80 = 1
    let found = false
    const items = ranked.map(([label, value], i) => {
      cum += value
      const cs = cum / total
      if (!found && cs >= 0.8) {
        share80 = (i + 1) / ranked.length
        found = true
      }
      return { label, value, cumShare: cs }
    })
    const top20n = Math.max(1, Math.round(ranked.length * 0.2))
    let t20 = 0
    for (let i = 0; i < top20n; i++) t20 += ranked[i][1]
    out.push({
      dimRole: dim,
      dimColumn: ctx.ds.columns.find((c) => c.key === ctx.key(dim))?.name ?? dim,
      measure: measure.role,
      format: measure.format,
      total,
      distinct: ranked.length,
      entityShareFor80: share80,
      top20Share: t20 / total,
      items: items.slice(0, 60),
    })
  }
  return out
}
