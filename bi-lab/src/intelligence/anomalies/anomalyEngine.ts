/**
 * ANOMALY ENGINE
 * Methods: robust Z (MAD) on moving-average residuals, IQR fences, classic Z-score, percentage
 * deviation from a leave-one-out moving average, and period-over-period spike/drop detection.
 * A point is flagged only when the primary method AND at least one confirming method agree,
 * and results are capped so the engine never marks "everything" as abnormal.
 */
import type { L10n, NumberFormat, Sensitivity } from '@/types/core'
import type { Anomaly, AnomalyReport, Breakdown, SeriesMetric } from '@/types/analysis'
import { looMovingAverage, mad, mean, quantileSorted, sortedCopy, std } from '@/lib/stats'
import type { Ctx } from '../analysis/context'
import type { MeasureInfo } from '../analysis/measures'

export const SENSITIVITY: Record<Sensitivity, { robustZ: number; iqrK: number; z: number; pct: number; maxShare: number; segZ: number; recordIqr: number }> = {
  sensitive: { robustZ: 2.5, iqrK: 1.5, z: 2.0, pct: 0.2, maxShare: 0.12, segZ: 1.6, recordIqr: 3 },
  balanced: { robustZ: 3.0, iqrK: 2.0, z: 2.5, pct: 0.3, maxShare: 0.08, segZ: 2.0, recordIqr: 4.5 },
  conservative: { robustZ: 4.0, iqrK: 3.0, z: 3.0, pct: 0.45, maxShare: 0.05, segZ: 2.6, recordIqr: 7 },
}

export const ANOMALY_METHODS = ['robust-z-mad', 'iqr-fence', 'z-score', 'pct-deviation-ma', 'period-over-period', 'segment-z', 'record-iqr']

const METHOD_LABEL: Record<string, L10n> = {
  'robust-z-mad': { vi: 'Robust Z-score (MAD) trên phần dư so với trung bình trượt', en: 'Robust Z-score (MAD) on moving-average residuals' },
  'iqr-fence': { vi: 'Hàng rào IQR (Tukey)', en: 'IQR (Tukey) fences' },
  'z-score': { vi: 'Z-score cổ điển', en: 'Classic Z-score' },
  'pct-deviation-ma': { vi: 'Độ lệch % so với trung bình trượt', en: 'Percentage deviation from moving average' },
  'period-over-period': { vi: 'Đột biến so với kỳ liền trước', en: 'Period-over-period spike/drop' },
  'segment-z': { vi: 'So sánh biến động giữa các nhóm (Z-score)', en: 'Cross-segment change comparison (Z-score)' },
  'record-iqr': { vi: 'Giao dịch cực trị (IQR mở rộng)', en: 'Extreme transaction (wide IQR)' },
}

function severityOf(dev: number, score: number, s: (typeof SENSITIVITY)['balanced']): 'low' | 'medium' | 'high' {
  const a = Math.abs(dev)
  if (a >= 0.5 || score >= s.robustZ * 2) return 'high'
  if (a >= 0.25 || score >= s.robustZ * 1.4) return 'medium'
  return 'low'
}

export function detectSeriesAnomalies(series: SeriesMetric, sens: Sensitivity, granularity: string): Anomaly[] {
  const s = SENSITIVITY[sens]
  const pts = series.points
  const y = pts.map((p) => p.value)
  const n = y.length
  if (n < 8) return []
  const half = granularity === 'day' ? 3 : 2
  const base = looMovingAverage(y, half)
  const resid = y.map((v, i) => v - base[i])
  const rMad = mad(resid) || std(resid) * 0.8
  const sorted = sortedCopy(y)
  const q1 = quantileSorted(sorted, 0.25)
  const q3 = quantileSorted(sorted, 0.75)
  const iqr = q3 - q1
  const mu = mean(y)
  const sd = std(y)
  const flagged: Anomaly[] = []
  for (let i = 0; i < n; i++) {
    const v = y[i]
    if (!Number.isFinite(v)) continue
    const rz = rMad > 0 ? Math.abs(resid[i]) / rMad : 0
    const methods: string[] = []
    if (rz >= s.robustZ) methods.push('robust-z-mad')
    if (iqr > 0 && (v < q1 - s.iqrK * iqr || v > q3 + s.iqrK * iqr)) methods.push('iqr-fence')
    if (sd > 0 && Math.abs(v - mu) / sd >= s.z) methods.push('z-score')
    const dev = base[i] !== 0 ? (v - base[i]) / Math.abs(base[i]) : 0
    if (Math.abs(dev) >= s.pct) methods.push('pct-deviation-ma')
    if (i > 0 && y[i - 1] !== 0) {
      const pop = (v - y[i - 1]) / Math.abs(y[i - 1])
      if (Math.abs(pop) >= s.pct * 1.5 && rz >= s.robustZ * 0.8) methods.push('period-over-period')
    }
    // primary (robust) + at least one confirmation
    if (!methods.includes('robust-z-mad') || methods.length < 2) continue
    const width = Math.max(rMad * s.robustZ, Math.abs(base[i]) * 0.05)
    const floor = sorted[0] >= 0 ? 0 : -Infinity
    flagged.push({
      id: `an_${series.measure}_${pts[i].label}`,
      scope: 'series',
      metric: series.measure,
      metricLabel: series.label,
      label: pts[i].label,
      periodStart: pts[i].start,
      expected: base[i],
      expectedLow: Math.max(floor, base[i] - width),
      expectedHigh: base[i] + width,
      actual: v,
      deviation: dev,
      severity: severityOf(dev, rz, s),
      method: methods[0],
      methodDetail: { vi: methods.map((m) => METHOD_LABEL[m].vi).join(' · '), en: methods.map((m) => METHOD_LABEL[m].en).join(' · ') },
      format: series.format,
      direction: v >= base[i] ? 'spike' : 'drop',
      rowsInvolved: pts[i].count,
    })
  }
  // cap: keep the strongest deviations only
  const cap = Math.max(1, Math.floor(n * s.maxShare))
  return flagged.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)).slice(0, cap)
}

/** Segments whose latest-period change is far from their peers' changes. */
export function detectSegmentAnomalies(b: Breakdown, sens: Sensitivity, format: NumberFormat): Anomaly[] {
  const s = SENSITIVITY[sens]
  const items = b.items.filter((x) => x.change !== null && x.change !== undefined && (x.previous ?? 0) > 0 && x.share >= 0.01)
  if (items.length < 5) return []
  const ch = items.map((x) => x.change as number)
  const med = quantileSorted(sortedCopy(ch), 0.5)
  const spread = mad(ch) || std(ch)
  if (!(spread > 0)) return []
  const out: Anomaly[] = []
  for (const it of items) {
    const z = Math.abs((it.change as number) - med) / spread
    if (z < s.segZ * 1.5 || Math.abs(it.change as number) < s.pct || it.share < 0.03) continue
    const expected = (it.previous as number) * (1 + med)
    out.push({
      id: `seg_${b.dimRole}_${it.label}`,
      scope: 'segment',
      metric: b.measure,
      metricLabel: { vi: `${b.measureLabel.vi} — ${b.dimColumn}`, en: `${b.measureLabel.en} — ${b.dimColumn}` },
      label: it.label,
      expected,
      expectedLow: Math.max(0, (it.previous as number) * (1 + med - spread * s.segZ)),
      expectedHigh: (it.previous as number) * (1 + med + spread * s.segZ),
      actual: it.current as number,
      deviation: it.change as number,
      severity: z >= s.segZ * 3 && Math.abs(it.change as number) >= 0.5 && it.share >= 0.08 ? 'high' : z >= s.segZ * 2 ? 'medium' : 'low',
      method: 'segment-z',
      methodDetail: METHOD_LABEL['segment-z'],
      format,
      direction: (it.change as number) >= med ? 'spike' : 'drop',
      rowsInvolved: it.count,
    })
  }
  return out.sort((a, b2) => Math.abs(b2.deviation) - Math.abs(a.deviation)).slice(0, 5)
}

/** Individual records far outside the distribution (e.g. a single huge order). */
export function detectRecordAnomalies(ctx: Ctx, m: MeasureInfo, sens: Sensitivity, dateArr: Float64Array | null): Anomaly[] {
  const s = SENSITIVITY[sens]
  const a = ctx.measure(m.role)
  if (!a || ctx.size < 30) return []
  const vals: number[] = []
  ctx.forEach((i) => {
    if (a[i] === a[i]) vals.push(a[i])
  })
  const sorted = sortedCopy(vals)
  const q1 = quantileSorted(sorted, 0.25)
  const q3 = quantileSorted(sorted, 0.75)
  const med = quantileSorted(sorted, 0.5)
  const iqr = q3 - q1
  if (!(iqr > 0)) return []
  const hi = q3 + s.recordIqr * iqr
  const lo = q1 - s.recordIqr * iqr
  const out: { i: number; v: number }[] = []
  ctx.forEach((i) => {
    const v = a[i]
    if (v === v && (v > hi || (v < lo && lo > 0))) out.push({ i, v })
  })
  if (out.length > vals.length * 0.02) return [] // heavy-tailed by nature: not anomalous
  return out
    .sort((x, y) => Math.abs(y.v - med) - Math.abs(x.v - med))
    .slice(0, 5)
    .map(({ i, v }) => ({
      id: `rec_${m.role}_${i}`,
      scope: 'record' as const,
      metric: m.role,
      metricLabel: m.label,
      label: `#${i + 1}`,
      periodStart: dateArr ? dateArr[i] : undefined,
      expected: med,
      expectedLow: Math.max(lo, sorted[0]),
      expectedHigh: hi,
      actual: v,
      deviation: med !== 0 ? (v - med) / Math.abs(med) : 0,
      severity: v > q3 + s.recordIqr * 2 * iqr ? ('high' as const) : ('medium' as const),
      method: 'record-iqr',
      methodDetail: METHOD_LABEL['record-iqr'],
      format: m.format,
      direction: v > med ? ('spike' as const) : ('drop' as const),
      rowsInvolved: 1,
    }))
}

export function runAnomalyEngine(input: {
  ctx: Ctx
  series: SeriesMetric[]
  breakdowns: Breakdown[]
  measures: MeasureInfo[]
  sensitivity: Sensitivity
  granularity: string
  dateArr: Float64Array | null
  primary?: MeasureInfo | null
}): AnomalyReport {
  const all: Anomaly[] = []
  let checks = 0
  // series anomalies; correlated metrics flagged in the same period are merged into one finding
  const byPeriod = new Map<string, Anomaly[]>()
  for (const s of input.series) {
    checks += 5
    for (const a of detectSeriesAnomalies(s, input.sensitivity, input.granularity)) {
      const arr = byPeriod.get(a.label) ?? []
      arr.push(a)
      byPeriod.set(a.label, arr)
    }
  }
  const primaryRole = input.primary?.role
  for (const arr of byPeriod.values()) {
    arr.sort((x, y) => (x.metric === primaryRole ? -1 : y.metric === primaryRole ? 1 : Math.abs(y.deviation) - Math.abs(x.deviation)))
    const lead = arr[0]
    if (arr.length > 1) {
      const others = arr.slice(1)
      lead.methodDetail = {
        vi: `${lead.methodDetail.vi}. Cùng kỳ, các chỉ số khác cũng bất thường: ${others.map((o) => `${o.metricLabel.vi} (${(o.deviation * 100).toFixed(0)}%)`).join(', ')}.`,
        en: `${lead.methodDetail.en}. Other metrics were also unusual in this period: ${others.map((o) => `${o.metricLabel.en} (${(o.deviation * 100).toFixed(0)}%)`).join(', ')}.`,
      }
    }
    all.push(lead)
  }
  for (const b of input.breakdowns) {
    checks++
    all.push(...detectSegmentAnomalies(b, input.sensitivity, b.format))
  }
  // record-level outliers only for the primary additive measure (avoids flooding with natural extremes)
  const primary = input.primary ?? input.measures.find((x) => x.agg === 'sum')
  if (primary) {
    checks++
    all.push(...detectRecordAnomalies(input.ctx, primary, input.sensitivity, input.dateArr).slice(0, 3))
  }
  const rank = { high: 3, medium: 2, low: 1 }
  all.sort((a, b) => rank[b.severity] - rank[a.severity] || Math.abs(b.deviation) - Math.abs(a.deviation))
  return { sensitivity: input.sensitivity, anomalies: all.slice(0, 60), checksRun: checks, seriesAnalysed: input.series.length, methods: ANOMALY_METHODS }
}
