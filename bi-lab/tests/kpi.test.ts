import { describe, expect, it } from 'vitest'
import { load, monthlySales } from './helpers'
import { KPI_LIBRARY } from '@/intelligence/metrics/kpiLibrary'

describe('KPI engine', () => {
  const t = load(monthlySales())
  const a = t.analysis()
  const k = (id: string) => a.kpis.find((x) => x.id === id)
  it('library has 50+ KPI definitions with metadata', () => {
    expect(KPI_LIBRARY.length).toBeGreaterThanOrEqual(50)
    for (const d of KPI_LIBRARY) {
      expect(d.formula.length).toBeGreaterThan(2)
      expect(d.name.vi && d.name.en && d.description.vi && d.description.en).toBeTruthy()
    }
  })
  it('computes totals exactly', () => {
    let rev = 0
    for (let m = 0; m < 12; m++) for (let ri = 0; ri < 3; ri++) for (let ci = 0; ci < 2; ci++) rev += 1000 + ri * 200 + ci * 100 + m * 10
    expect(k('revenue')!.value).toBeCloseTo(rev, 6)
    expect(k('cost')!.value).toBeCloseTo(rev * 0.6, 6)
    expect(k('profit')!.value).toBeCloseTo(rev * 0.4, 6)
    expect(k('gross_margin')!.value).toBeCloseTo(0.4, 6)
    expect(k('transactions')!.value).toBe(72)
    expect(k('customers')!.value).toBe(2)
    expect(k('aov')!.value).toBeCloseTo(rev / 72, 6)
  })
  it('computes period growth from the last two months', () => {
    const cur = 6 * 1000 + 1200 + 300 + 6 * 110
    const g = k('revenue_growth')!.value
    expect(g).toBeGreaterThan(0)
    expect(k('revenue')!.current).toBeCloseTo(cur, 6)
  })
  it('does not invent KPIs without fields', () => {
    expect(k('defect_rate')).toBeUndefined()
    expect(k('roas')).toBeUndefined()
    expect(k('avg_salary')).toBeUndefined()
  })
  it('top customer share & pareto', () => {
    const s = k('top_customer_share')!.value
    expect(s).toBeGreaterThan(0.5)
    expect(s).toBeLessThan(0.6)
  })
})
