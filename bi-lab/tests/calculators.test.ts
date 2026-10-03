import { describe, expect, it } from 'vitest'
import { calcRoi, DEFAULT_ROI } from '@/intelligence/roi/roi'
import { runScenario, scenarioBase, ZERO_INPUTS, priceForTargetProfit } from '@/intelligence/scenario/scenario'
import { load, monthlySales } from './helpers'
import { projectSeries } from '@/intelligence/forecasting/forecast'

describe('Automation ROI', () => {
  it('matches the documented example', () => {
    const r = calcRoi(DEFAULT_ROI)
    expect(r.manualHoursMonth).toBeCloseTo(220, 6)
    expect(r.hoursSavedMonth).toBeCloseTo(154, 6)
    expect(r.fte).toBeCloseTo(154 / 176, 6)
    const hourly = 20_500_000 / 176
    expect(r.grossAnnualSaving).toBeCloseTo(154 * hourly * 12, 0)
    expect(r.netAnnualSaving).toBeCloseTo(r.grossAnnualSaving - 18_000_000, 0)
    expect(r.paybackMonths).toBeCloseTo(80_000_000 / (r.netAnnualSaving / 12), 6)
    expect(r.threeYearBenefit).toBeCloseTo(3 * r.netAnnualSaving - 80_000_000, 0)
    expect(r.roiFirstYear).toBeCloseTo((r.netAnnualSaving - 80_000_000) / 80_000_000, 6)
  })
  it('handles no-payback and invalid inputs', () => {
    expect(calcRoi({ ...DEFAULT_ROI, automationPct: 0 }).paybackMonths).toBe(Infinity)
    const r = calcRoi({ ...DEFAULT_ROI, employees: -3, minutesPerTask: NaN })
    expect(r.valid).toBe(false)
  })
})

describe('Scenario model', () => {
  const t = load(monthlySales())
  const b = scenarioBase(t.ctx)!
  it('base equals data', () => {
    expect(b.margin).toBeCloseTo(0.4, 6)
    expect(runScenario(b, ZERO_INPUTS).deltaProfit).toBeCloseTo(0, 6)
  })
  it('price +10% raises profit by 10% of revenue', () => {
    const o = runScenario(b, { ...ZERO_INPUTS, pricePct: 0.1 })
    expect(o.deltaProfit).toBeCloseTo(b.revenue * 0.1, 4)
  })
  it('revenue +10% (volume) scales variable costs', () => {
    const o = runScenario(b, { ...ZERO_INPUTS, revenuePct: 0.1, variableShare: 1 })
    expect(o.revenue).toBeCloseTo(b.revenue * 1.1, 4)
    expect(o.cost).toBeCloseTo(b.cost * 1.1, 4)
    expect(o.margin).toBeCloseTo(b.margin, 6)
  })
  it('goal seek finds the price change for a target profit', () => {
    const p = priceForTargetProfit(b, ZERO_INPUTS, b.profit * 1.1)
    expect(runScenario(b, { ...ZERO_INPUTS, pricePct: p }).profit).toBeCloseTo(b.profit * 1.1, 4)
  })
})

describe('Statistical projection', () => {
  const pts = (vals: number[]) => ({ measure: 'revenue', label: { vi: 'DT', en: 'Rev' }, format: 'currency' as const, points: vals.map((v, i) => ({ label: `2025-${String(i + 1).padStart(2, '0')}`, start: Date.UTC(2025, i, 1), value: v, count: 1 })), movingAvg: [], growth: [] })
  it('projects a clean trend with high quality', () => {
    const f = projectSeries(pts([100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210]), 'month')
    expect(f.ok).toBe(true)
    expect(f.projection[0].value).toBeGreaterThan(210)
    expect(f.quality).toBe('high')
    expect(f.projection[0].label).toBe('2026-01')
  })
  it('refuses with too little data', () => {
    const f = projectSeries(pts([100, 120, 90]), 'month')
    expect(f.ok).toBe(false)
    expect(f.reason?.en).toMatch(/Insufficient data/)
  })
})
