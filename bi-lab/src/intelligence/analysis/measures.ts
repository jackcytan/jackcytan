/** Measure catalogue: which numeric fields exist, their labels/format, and the domain's main measure. */
import type { Domain, L10n, NumberFormat, Role } from '@/types/core'
import { MEASURE_ROLES, ROLE_META } from '../dictionaries/roles'
import type { Ctx } from './context'

export interface MeasureInfo {
  id: Role
  key: string
  label: L10n
  format: NumberFormat
  agg: 'sum' | 'avg'
  role: Role
}

export function availableMeasures(ctx: Ctx): MeasureInfo[] {
  const out: MeasureInfo[] = []
  for (const r of MEASURE_ROLES) {
    if (!ctx.has(r)) continue
    const meta = ROLE_META[r]
    out.push({ id: r, key: ctx.key(r) ?? (r === 'profit' ? 'derived:profit' : r), label: meta.label, format: meta.format ?? 'number', agg: meta.agg ?? 'sum', role: r })
  }
  return out
}

const MAIN_BY_DOMAIN: Record<Domain, Role[]> = {
  sales: ['revenue', 'quantity', 'orders'],
  retail: ['revenue', 'quantity'],
  finance: ['actual', 'expense', 'revenue', 'cost', 'budget'],
  marketing: ['revenue', 'lead', 'spend', 'clicks'],
  hr: ['salary', 'performance', 'attendance'],
  manufacturing: ['output', 'defect', 'downtime'],
  operations: ['duration', 'revenue', 'hours', 'downtime'],
  inventory: ['inventory', 'quantity', 'revenue'],
  customer_service: ['satisfaction', 'response_time', 'duration'],
  generic: ['revenue', 'actual', 'expense', 'cost', 'profit', 'quantity', 'output', 'spend', 'salary'],
}

export function mainMeasure(_ctx: Ctx, domain: Domain, measures: MeasureInfo[]): MeasureInfo | null {
  for (const r of MAIN_BY_DOMAIN[domain]) {
    const m = measures.find((x) => x.role === r)
    if (m) return m
  }
  for (const r of MAIN_BY_DOMAIN.generic) {
    const m = measures.find((x) => x.role === r)
    if (m) return m
  }
  return measures.find((m) => m.agg === 'sum') ?? measures[0] ?? null
}

/** Value of a measure on a context using its default aggregation. */
export function aggregate(ctx: Ctx, m: MeasureInfo | Role): number {
  const role = typeof m === 'string' ? m : m.role
  const agg = typeof m === 'string' ? ROLE_META[m].agg ?? 'sum' : m.agg
  return agg === 'avg' ? ctx.avg(role) : ctx.sum(role)
}

/** Additive measure used for group-by breakdowns / Pareto (averages cannot be shared out). */
export function breakdownMeasure(domain: Domain, measures: MeasureInfo[], main: MeasureInfo | null): MeasureInfo | null {
  if (main && main.agg === 'sum') return main
  for (const r of [...MAIN_BY_DOMAIN[domain], ...MAIN_BY_DOMAIN.generic]) {
    const m = measures.find((x) => x.role === r && x.agg === 'sum')
    if (m) return m
  }
  return measures.find((m) => m.agg === 'sum') ?? null
}

/** +1: higher is better (revenue), -1: higher is worse (cost-like), 0: neutral (salary, budget). */
export function polarityOf(role: Role | undefined): number {
  if (!role) return 1
  if (['cost', 'expense', 'actual', 'defect', 'downtime', 'returns', 'duration', 'response_time', 'absence', 'discount'].includes(role)) return -1
  if (['salary', 'budget', 'spend', 'inventory', 'target', 'planned_output', 'price', 'hours'].includes(role)) return 0
  return 1
}
