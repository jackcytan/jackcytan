/**
 * STATISTICAL PROJECTION (not AI): linear regression blended with weighted moving average.
 * Quality is rated from sample size, fit (R²) and variability. Weak data => explicitly refused.
 */
import type { ForecastResult, SeriesMetric } from '@/types/analysis'
import type { Granularity } from '@/types/core'
import { coefficientOfVariation, std, trendLine, weightedMovingAverage } from '@/lib/stats'
import { nextPeriod, periodKey } from '../analysis/time'

export function projectSeries(s: SeriesMetric, g: Granularity, horizon = 3): ForecastResult {
  const vals = s.points.map((p) => p.value).filter((v) => Number.isFinite(v))
  const base: ForecastResult = { metric: s.measure, metricLabel: s.label, format: s.format, ok: false, method: 'linear-regression + WMA', history: s.points.map((p) => ({ label: p.label, value: p.value })), projection: [], r2: 0, slopePerPeriod: 0, quality: 'low', qualityScore: 0, qualityNotes: [], growthPerPeriod: 0 }
  if (vals.length < 6) {
    return { ...base, reason: { vi: 'Không đủ dữ liệu để dự phóng tin cậy (cần tối thiểu 6 kỳ).', en: 'Insufficient data for reliable projection (at least 6 periods required).' } }
  }
  const t = trendLine(vals)
  const fitted = vals.map((_, i) => t.intercept + t.slope * i)
  const resid = vals.map((v, i) => v - fitted[i])
  const rs = std(resid)
  const cv = coefficientOfVariation(vals)
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  // quality score
  let q = 0
  const notes: { vi: string; en: string }[] = []
  q += Math.min(35, vals.length * 2.5)
  notes.push({ vi: `${vals.length} kỳ dữ liệu lịch sử`, en: `${vals.length} historical periods` })
  q += t.r2 * 35
  notes.push({ vi: `Độ phù hợp xu hướng R² = ${t.r2.toFixed(2)}`, en: `Trend fit R² = ${t.r2.toFixed(2)}` })
  const cvScore = Number.isFinite(cv) ? Math.max(0, 30 - cv * 60) : 0
  q += cvScore
  notes.push({ vi: `Hệ số biến thiên ${(cv * 100).toFixed(1)}%`, en: `Coefficient of variation ${(cv * 100).toFixed(1)}%` })
  const qualityScore = Math.round(Math.min(100, q))
  if (qualityScore < 30 || (t.r2 < 0.05 && cv > 0.6)) {
    return { ...base, r2: t.r2, qualityScore, qualityNotes: notes, reason: { vi: 'Không đủ dữ liệu để dự phóng tin cậy: dữ liệu biến động quá mạnh, không có xu hướng rõ ràng.', en: 'Insufficient data for reliable projection: values are too volatile without a clear trend.' } }
  }
  // blend: trend extrapolation weighted by R², the rest from WMA level
  const wma = weightedMovingAverage(vals, 4)
  const w = Math.max(0.2, Math.min(0.85, t.r2))
  const proj: ForecastResult['projection'] = []
  let start = s.points[s.points.length - 1].start
  for (let h = 1; h <= horizon; h++) {
    start = nextPeriod(start, g)
    const lin = t.intercept + t.slope * (vals.length - 1 + h)
    let v = w * lin + (1 - w) * (wma + t.slope * h)
    if (mean > 0 && v < 0) v = 0
    const band = 1.96 * rs * Math.sqrt(1 + h / vals.length)
    proj.push({ label: periodKey(start, g), value: v, low: Math.max(mean > 0 ? 0 : -Infinity, v - band), high: v + band })
  }
  return {
    ...base,
    ok: true,
    projection: proj,
    r2: t.r2,
    slopePerPeriod: t.slope,
    growthPerPeriod: mean ? t.slope / Math.abs(mean) : 0,
    qualityScore,
    quality: qualityScore >= 70 ? 'high' : qualityScore >= 50 ? 'medium' : 'low',
    qualityNotes: notes,
  }
}
