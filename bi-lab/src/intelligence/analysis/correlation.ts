/** Pearson correlation matrix across numeric measures (association only — never causation). */
import type { Correlation } from '@/types/analysis'
import { pearson } from '@/lib/stats'
import type { Ctx } from './context'
import type { MeasureInfo } from './measures'

export function strengthLabel(r: number): { vi: string; en: string } {
  const a = Math.abs(r)
  const dir = r >= 0 ? { vi: 'thuận', en: 'positive' } : { vi: 'nghịch', en: 'negative' }
  if (a >= 0.7) return { vi: `Liên hệ thống kê mạnh (${dir.vi})`, en: `Strong statistical association (${dir.en})` }
  if (a >= 0.4) return { vi: `Liên hệ thống kê trung bình (${dir.vi})`, en: `Moderate statistical association (${dir.en})` }
  if (a >= 0.2) return { vi: `Liên hệ thống kê yếu (${dir.vi})`, en: `Weak statistical association (${dir.en})` }
  return { vi: 'Hầu như không có liên hệ tuyến tính', en: 'Little or no linear association' }
}

export function buildCorrelation(ctx: Ctx, measures: MeasureInfo[], max = 8): Correlation | null {
  const ms = measures.filter((m) => {
    const a = ctx.measure(m.role)
    return !!a && ctx.count(m.role) >= 10
  }).slice(0, max)
  if (ms.length < 2) return null
  const arrays = ms.map((m) => ctx.measure(m.role)!)
  // sample for very large datasets
  const n = arrays[0].length
  const step = n > 60000 ? Math.ceil(n / 60000) : 1
  const sampled = step > 1 ? arrays.map((a) => { const o = new Float64Array(Math.ceil(n / step)); for (let i = 0, j = 0; i < n; i += step, j++) o[j] = a[i]; return o }) : arrays
  const matrix: number[][] = ms.map(() => ms.map(() => NaN))
  const pairs: Correlation['pairs'] = []
  for (let i = 0; i < ms.length; i++) {
    matrix[i][i] = 1
    for (let j = i + 1; j < ms.length; j++) {
      // skip definitional pairs (profit derived from revenue & cost)
      const { r, n: cnt } = pearson(sampled[i], sampled[j])
      matrix[i][j] = r
      matrix[j][i] = r
      if (Number.isFinite(r)) pairs.push({ a: ms[i].role, b: ms[j].role, r, n: cnt, strength: strengthLabel(r) })
    }
  }
  pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
  return { keys: ms.map((m) => m.role), labels: ms.map((m) => m.role), matrix, pairs }
}
