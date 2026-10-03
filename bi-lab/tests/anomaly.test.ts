import { describe, expect, it } from 'vitest'
import { detectSeriesAnomalies } from '@/intelligence/anomalies/anomalyEngine'
import type { SeriesMetric } from '@/types/analysis'
import { mulberry32 } from '@/demo/generator'

function series(vals: number[]): SeriesMetric {
  return { measure: 'revenue', label: { vi: 'Doanh thu', en: 'Revenue' }, format: 'currency', points: vals.map((v, i) => ({ label: `P${i}`, start: i, value: v, count: 10 })), movingAvg: [], growth: [] }
}

describe('anomaly engine', () => {
  const r = mulberry32(5)
  const base = Array.from({ length: 40 }, () => 1000 + (r() - 0.5) * 60)
  it('flags an injected drop with expected range & deviation', () => {
    const v = [...base]
    v[25] = 480
    const out = detectSeriesAnomalies(series(v), 'balanced', 'month')
    const hit = out.find((a) => a.label === 'P25')!
    expect(hit).toBeTruthy()
    expect(hit.direction).toBe('drop')
    expect(hit.deviation).toBeLessThan(-0.4)
    expect(hit.expectedLow).toBeGreaterThan(480)
    expect(hit.severity).toBe('high')
  })
  it('does not mark normal noise as anomalies', () => {
    for (const s of ['balanced', 'conservative'] as const) expect(detectSeriesAnomalies(series(base), s, 'month').length).toBe(0)
  })
  it('sensitivity ordering: sensitive ≥ balanced ≥ conservative', () => {
    const v = [...base]
    v[10] = 1250
    v[30] = 1400
    const n = (s: 'sensitive' | 'balanced' | 'conservative') => detectSeriesAnomalies(series(v), s, 'month').length
    expect(n('sensitive')).toBeGreaterThanOrEqual(n('balanced'))
    expect(n('balanced')).toBeGreaterThanOrEqual(n('conservative'))
  })
  it('needs enough points', () => {
    expect(detectSeriesAnomalies(series([1, 2, 100]), 'sensitive', 'month')).toEqual([])
  })
})
