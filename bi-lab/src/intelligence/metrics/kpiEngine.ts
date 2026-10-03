/** KPI ENGINE — evaluates the KPI library against the dataset (full range + latest periods + sparkline). */
import type { Domain } from '@/types/core'
import type { KpiResult } from '@/types/analysis'
import type { Ctx } from '../analysis/context'
import { KPI_LIBRARY, type KpiDef } from './kpiLibrary'
import type { TimeIndex } from '../analysis/time'

export interface KpiEngineInput {
  ctx: Ctx
  time: TimeIndex | null
  periodCtx: Ctx[] | null
  domain: Domain
}

export function isApplicable(def: KpiDef, ctx: Ctx, hasTime: boolean): boolean {
  if (def.needsTime && !hasTime) return false
  return def.required.every((r) => (r === 'date' ? hasTime : ctx.has(r)))
}

export function computeKpis({ ctx, time, periodCtx, domain }: KpiEngineInput): KpiResult[] {
  const hasTime = !!time && !!periodCtx && periodCtx.length >= 2
  const out: KpiResult[] = []
  let ci = -1
  if (hasTime && time) {
    ci = time.info.periods.length - (time.info.partialLast ? 2 : 1)
  }
  const pair = hasTime && ci >= 1 ? { cur: periodCtx![ci], prev: periodCtx![ci - 1] } : undefined
  for (const def of KPI_LIBRARY) {
    if (!isApplicable(def, ctx, hasTime)) continue
    let value: number
    try {
      value = def.compute(ctx, pair)
    } catch {
      continue
    }
    if (!Number.isFinite(value)) continue
    let current: number | null = null
    let previous: number | null = null
    let change: number | null = null
    let changeKind: 'pct' | 'pp' | null = null
    const spark: number[] = []
    const sparkLabels: string[] = []
    if (def.trend && pair) {
      const c = def.compute(pair.cur)
      const p = def.compute(pair.prev)
      current = Number.isFinite(c) ? c : null
      previous = Number.isFinite(p) ? p : null
      if (current !== null && previous !== null) {
        if (def.format === 'percent') {
          change = current - previous
          changeKind = 'pp'
        } else if (previous !== 0) {
          change = (current - previous) / Math.abs(previous)
          changeKind = 'pct'
        }
      }
    }
    const domainBoost = def.domain.includes(domain) ? 0 : def.domain.includes('generic') ? 6 : 20
    const columns = def.required
      .filter((r) => r !== 'date' || hasTime)
      .map((r) => {
        const key = r === 'date' ? time?.info.dateKey : ctx.key(r) ?? (r === 'profit' ? ctx.key('revenue') : undefined)
        const col = ctx.ds.columns.find((c) => c.key === key)
        return { role: r, column: r === 'profit' && !ctx.key('profit') ? `${ctx.ds.columns.find((c) => c.key === ctx.key('revenue'))?.name} − ${ctx.ds.columns.find((c) => c.key === ctx.key('cost'))?.name}` : col?.name ?? r }
      })
    out.push({
      id: def.id,
      name: def.name,
      description: def.description,
      formula: def.formula,
      format: def.format,
      domain: def.domain.filter((d): d is Domain => d !== 'generic'),
      direction: def.direction,
      value,
      current,
      previous,
      change,
      changeKind,
      spark,
      sparkLabels,
      requiredFields: columns,
      rowsUsed: ctx.size,
      priority: def.priority + domainBoost,
      periodBased: !!def.needsTime,
    })
  }
  out.sort((a, b) => a.priority - b.priority)
  // sparklines for the most relevant trend KPIs
  if (hasTime && periodCtx && time) {
    const last = time.info.periods.length - (time.info.partialLast ? 1 : 0)
    const from = Math.max(0, last - 24)
    let made = 0
    for (const k of out) {
      if (made >= 12) break
      const def = KPI_LIBRARY.find((d) => d.id === k.id)!
      if (!def.trend) continue
      for (let p = from; p < last; p++) {
        const v = def.compute(periodCtx[p])
        k.spark.push(Number.isFinite(v) ? v : 0)
        k.sparkLabels.push(time.info.periods[p].label)
      }
      made++
    }
  }
  return out
}
