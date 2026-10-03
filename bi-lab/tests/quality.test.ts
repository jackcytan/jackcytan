import { describe, expect, it } from 'vitest'
import { load } from './helpers'
import { QUALITY_CHECKS } from '@/intelligence/quality/qualityEngine'

describe('data quality & profiling edge cases', () => {
  it('has 20+ checks', () => expect(QUALITY_CHECKS.length).toBeGreaterThanOrEqual(20))
  it('finds missing values, duplicates, inconsistent categories & needs-review numbers', () => {
    const rows: (string | number | null)[][] = [['Ngày', 'Khu vực', 'Doanh thu', 'Doanh thu']]
    for (let i = 0; i < 50; i++) rows.push([`${String((i % 28) + 1).padStart(2, '0')}/01/2026`, i % 10 === 0 ? null : i % 3 === 0 ? 'Hà Nội' : i % 3 === 1 ? 'ha noi' : 'HCM', 1000 + i, i === 7 ? '1.000' : i === 8 ? 'abc' : 5])
    rows.push([...rows[5]])
    rows.push(['Tổng cộng', null, 999999, null])
    const t = load(rows as never)
    expect(t.ds.rowCount).toBe(51)
    expect(t.ds.duplicateHeaders).toEqual(['Doanh thu'])
    const a = t.analysis()
    const ids = new Set(a.quality.issues.map((i) => i.checkId))
    for (const id of ['DQ01', 'DQ03', 'DQ04', 'DQ12', 'DQ16']) expect(ids.has(id), id).toBe(true)
    expect(a.quality.score).toBeLessThan(100)
    expect(a.quality.score).toBeGreaterThan(40)
  })
  it('handles all-text, single-column and all-missing data without crashing', () => {
    const allText = load([['Tên', 'Ghi chú'], ['A', 'x'], ['B', 'y'], ['C', 'z']])
    expect(() => allText.analysis()).not.toThrow()
    const single = load([['Doanh thu'], [1], [2], [3]])
    expect(single.analysis().kpis.find((k) => k.id === 'revenue')!.value).toBe(6)
    const missing = load([['A', 'B'], [null, null], ['', '--'], ['N/A', null]])
    expect(missing.ds.rowCount).toBe(0)
    expect(() => missing.analysis()).not.toThrow()
  })
  it('converts Excel serial dates in a date-named column', () => {
    const t = load([['Ngày', 'Doanh thu'], [45658, 10], [45659, 20], [45660, 30]])
    expect(t.ds.columns[0].type).toBe('date')
    expect(new Date(t.ds.num[t.ds.columns[0].key][0]).toISOString().slice(0, 10)).toBe('2025-01-01')
  })
})
