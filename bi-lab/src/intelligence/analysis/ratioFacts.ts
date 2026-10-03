/**
 * Segment-level ratio metrics (e.g. defect rate by line, ROAS by channel, margin by product).
 * Produces facts: ratio.<metric>.<dim>.{max,min,avg,n} and labels for the extreme segments.
 */
import type { L10n, NumberFormat, Role } from '@/types/core'
import type { Ctx } from './context'

export interface RatioMetricDef {
  id: string
  label: L10n
  format: NumberFormat
  dims: Role[]
  better: 'high' | 'low'
  num: Role
  den?: Role
  /** aggregation when no denominator: average of num */
  transform?: (v: number) => number
  minDen?: number
}

export const RATIO_METRICS: RatioMetricDef[] = [
  { id: 'defect_rate', label: { vi: 'tỷ lệ lỗi', en: 'defect rate' }, format: 'percent', dims: ['line', 'machine', 'shift', 'product', 'branch'], better: 'low', num: 'defect', den: 'output' },
  { id: 'downtime_avg', label: { vi: 'thời gian dừng bình quân', en: 'average downtime' }, format: 'minutes', dims: ['machine', 'line', 'shift'], better: 'low', num: 'downtime' },
  { id: 'output_ach', label: { vi: 'tỷ lệ đạt kế hoạch', en: 'plan achievement' }, format: 'percent', dims: ['line', 'shift', 'machine', 'branch'], better: 'high', num: 'output', den: 'planned_output' },
  { id: 'roas', label: { vi: 'ROAS', en: 'ROAS' }, format: 'ratio', dims: ['channel', 'campaign'], better: 'high', num: 'revenue', den: 'spend' },
  { id: 'cpl', label: { vi: 'chi phí / lead', en: 'cost per lead' }, format: 'currency', dims: ['channel', 'campaign'], better: 'low', num: 'spend', den: 'lead' },
  { id: 'ctr', label: { vi: 'CTR', en: 'CTR' }, format: 'percent', dims: ['channel', 'campaign'], better: 'high', num: 'clicks', den: 'impressions' },
  { id: 'margin', label: { vi: 'biên lợi nhuận', en: 'profit margin' }, format: 'percent', dims: ['product', 'category', 'region', 'branch', 'channel', 'customer'], better: 'high', num: 'profit', den: 'revenue' },
  { id: 'absence', label: { vi: 'tỷ lệ vắng mặt', en: 'absence rate' }, format: 'percent', dims: ['department', 'position', 'branch'], better: 'low', num: 'attendance', transform: (v) => 1 - v },
  { id: 'salary_avg', label: { vi: 'lương bình quân', en: 'average salary' }, format: 'currency', dims: ['department', 'position'], better: 'high', num: 'salary' },
  { id: 'performance_avg', label: { vi: 'điểm hiệu suất', en: 'performance score' }, format: 'score', dims: ['department', 'position', 'branch'], better: 'high', num: 'performance' },
  { id: 'return_rate', label: { vi: 'tỷ lệ hoàn trả', en: 'return rate' }, format: 'percent', dims: ['product', 'branch', 'channel', 'category'], better: 'low', num: 'returns', den: 'quantity' },
  { id: 'response_avg', label: { vi: 'thời gian phản hồi', en: 'response time' }, format: 'minutes', dims: ['channel', 'employee', 'branch'], better: 'low', num: 'response_time' },
  { id: 'satisfaction_avg', label: { vi: 'điểm hài lòng', en: 'satisfaction' }, format: 'score', dims: ['channel', 'employee', 'branch', 'product'], better: 'high', num: 'satisfaction' },
  { id: 'duration_avg', label: { vi: 'thời gian xử lý', en: 'processing time' }, format: 'hours', dims: ['branch', 'channel', 'region', 'employee'], better: 'low', num: 'duration' },
  { id: 'target_ach', label: { vi: 'tỷ lệ đạt mục tiêu', en: 'target achievement' }, format: 'percent', dims: ['region', 'branch', 'salesperson'], better: 'high', num: 'revenue', den: 'target' },
  { id: 'budget_util', label: { vi: 'tỷ lệ sử dụng ngân sách', en: 'budget utilisation' }, format: 'percent', dims: ['department', 'category'], better: 'low', num: 'actual', den: 'budget' },
]

export interface RatioFactResult {
  facts: Record<string, number>
  labels: Record<string, string>
}

export function computeRatioFacts(ctx: Ctx): RatioFactResult {
  const facts: Record<string, number> = {}
  const labels: Record<string, string> = {}
  for (const def of RATIO_METRICS) {
    if (!ctx.has(def.num) || (def.den && !ctx.has(def.den))) continue
    const num = ctx.measure(def.num)!
    const den = def.den ? ctx.measure(def.den)! : null
    for (const dim of def.dims) {
      if (!ctx.has(dim)) continue
      const d = ctx.dim(dim)!
      const groups = new Map<string, [number, number, number]>() // num, den, count
      let tn = 0
      let td = 0
      ctx.forEach((i) => {
        const k = d[i]
        if (k === null) return
        const a = num[i]
        const b = den ? den[i] : 1
        if (a !== a || b !== b) return
        const g = groups.get(k) ?? [0, 0, 0]
        g[0] += def.transform ? def.transform(a) : a
        g[1] += b
        g[2]++
        groups.set(k, g)
        tn += def.transform ? def.transform(a) : a
        td += b
      })
      if (groups.size < 2 || groups.size > 300 || td <= 0) continue
      const vals: [string, number, number][] = []
      for (const [k, [a, b, c]] of groups) if (b > 0 && c >= 3) vals.push([k, a / b, c])
      if (vals.length < 2) continue
      vals.sort((x, y) => y[1] - x[1])
      const p = `ratio.${def.id}.${dim}`
      facts[`${p}.max`] = vals[0][1]
      labels[`${p}.max`] = vals[0][0]
      facts[`${p}.min`] = vals[vals.length - 1][1]
      labels[`${p}.min`] = vals[vals.length - 1][0]
      facts[`${p}.avg`] = tn / td
      facts[`${p}.n`] = vals.length
    }
  }
  return { facts, labels }
}
