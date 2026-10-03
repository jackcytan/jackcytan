import { describe, expect, it } from 'vitest'
import { detectDateOrder, detectNumberStyle, excelSerialToMs, isMissing, parseDate, parseNumber } from '@/lib/parse'

describe('numeric parsing', () => {
  const cases: [string, number][] = [
    ['1,000,000', 1_000_000],
    ['1.000.000', 1_000_000],
    ['1 000 000', 1_000_000],
    ['10.500.000 ₫', 10_500_000],
    ['10,500,000 VND', 10_500_000],
    ['10.5 triệu', 10_500_000],
    ['10,5 triệu', 10_500_000],
    ['10 tỷ', 10_000_000_000],
    ['2,5 tỷ đồng', 2_500_000_000],
    ['500k', 500_000],
    ['1.2B', 1_200_000_000],
    ['$1,234.56', 1234.56],
    ['1.234,56', 1234.56],
    ['(1,500.00)', -1500],
    ['-2.000.000', -2_000_000],
    ['12%', 0.12],
    ['12,5%', 0.125],
    ['0.125', 0.125],
    ['3,75', 3.75],
  ]
  for (const [raw, v] of cases) {
    it(`parses "${raw}"`, () => {
      const r = parseNumber(raw)
      expect(r.ok).toBe(true)
      expect(r.value).toBeCloseTo(v, 6)
    })
  }
  it('detects currency', () => {
    expect(parseNumber('10.500.000 ₫').currency).toBe('VND')
    expect(parseNumber('$1,200').currency).toBe('USD')
  })
  it('flags ambiguous values instead of silently guessing', () => {
    expect(parseNumber('1.000').ambiguous).toBe(true)
    expect(parseNumber('1,000').ambiguous).toBe(true)
    expect(parseNumber('1.000', 'vn').ambiguous).toBe(false)
    expect(parseNumber('1.000', 'vn').value).toBe(1000)
    expect(parseNumber('1.000', 'en').value).toBe(1)
  })
  it('rejects non-numbers', () => {
    for (const s of ['abc', 'Hà Nội', '12abc', '1.2.3.4x', '']) expect(parseNumber(s).ok).toBe(false)
  })
  it('detects column number style', () => {
    expect(detectNumberStyle(['1.250.000', '35.000', '2.000'])).toBe('vn')
    expect(detectNumberStyle(['1,250,000', '35.5', '2,000'])).toBe('en')
    expect(detectNumberStyle(['125.000', '35.000', '2.000', '15.000', '99.000'])).toBe('vn')
  })
  it('missing tokens', () => {
    for (const s of ['', '--', 'N/A', 'null', 'undefined', 'blank', '#N/A']) expect(isMissing(s)).toBe(true)
    expect(isMissing('0')).toBe(false)
  })
})

describe('date parsing', () => {
  const ymd = (t: number) => new Date(t).toISOString().slice(0, 10)
  it('dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd', () => {
    expect(ymd(parseDate('25/12/2025').value)).toBe('2025-12-25')
    expect(ymd(parseDate('25-12-2025').value)).toBe('2025-12-25')
    expect(ymd(parseDate('2025-12-25').value)).toBe('2025-12-25')
    expect(ymd(parseDate('2025-12-25T10:30:00').value)).toBe('2025-12-25')
  })
  it('mm/dd/yyyy when the column says so', () => {
    expect(ymd(parseDate('03/04/2025', 'mdy').value)).toBe('2025-03-04')
    expect(ymd(parseDate('03/04/2025', 'dmy').value)).toBe('2025-04-03')
    expect(ymd(parseDate('12/31/2025').value)).toBe('2025-12-31')
  })
  it('month-year, quarter, Vietnamese month names', () => {
    expect(ymd(parseDate('09/2026').value)).toBe('2026-09-01')
    expect(ymd(parseDate('Tháng 3/2026').value)).toBe('2026-03-01')
    expect(ymd(parseDate('Q2 2025').value)).toBe('2025-04-01')
    expect(ymd(parseDate('Jan 15, 2025').value)).toBe('2025-01-15')
  })
  it('rejects invalid dates', () => {
    expect(parseDate('31/02/2025').ok).toBe(false)
    expect(parseDate('hello').ok).toBe(false)
  })
  it('detects day/month order', () => {
    expect(detectDateOrder(['13/01/2025', '02/01/2025']).order).toBe('dmy')
    expect(detectDateOrder(['01/13/2025', '01/02/2025']).order).toBe('mdy')
  })
  it('Excel serial', () => {
    expect(ymd(excelSerialToMs(45658))).toBe('2025-01-01')
  })
})
