/** Time bucketing: auto frequency detection, continuous periods, partial-period detection. */
import type { Dataset, Granularity, Lang } from '@/types/core'
import type { TimeInfo } from '@/types/analysis'

const DAY = 86400000

export function periodStart(t: number, g: Granularity): number {
  const d = new Date(t)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  switch (g) {
    case 'day':
      return Date.UTC(y, m, d.getUTCDate())
    case 'week': {
      const day = Date.UTC(y, m, d.getUTCDate())
      const dow = (new Date(day).getUTCDay() + 6) % 7 // Monday = 0
      return day - dow * DAY
    }
    case 'month':
      return Date.UTC(y, m, 1)
    case 'quarter':
      return Date.UTC(y, Math.floor(m / 3) * 3, 1)
    case 'year':
      return Date.UTC(y, 0, 1)
  }
}

export function nextPeriod(start: number, g: Granularity): number {
  const d = new Date(start)
  switch (g) {
    case 'day':
      return start + DAY
    case 'week':
      return start + 7 * DAY
    case 'month':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
    case 'quarter':
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3, 1)
    case 'year':
      return Date.UTC(d.getUTCFullYear() + 1, 0, 1)
  }
}

function isoWeek(t: number): [number, number] {
  const d = new Date(t)
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / DAY - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return [target.getUTCFullYear(), week]
}

/** Language-neutral period key. */
export function periodKey(start: number, g: Granularity): string {
  const d = new Date(start)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  switch (g) {
    case 'day':
      return `${y}-${m}-${String(d.getUTCDate()).padStart(2, '0')}`
    case 'week': {
      const [wy, w] = isoWeek(start)
      return `${wy}-W${String(w).padStart(2, '0')}`
    }
    case 'month':
      return `${y}-${m}`
    case 'quarter':
      return `${y}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`
    case 'year':
      return `${y}`
  }
}

const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Display label for a neutral period key. */
export function periodLabel(key: string, lang: Lang): string {
  let m: RegExpMatchArray | null
  if ((m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return lang === 'vi' ? `${m[3]}/${m[2]}/${m[1]}` : `${MONTH_EN[+m[2] - 1]} ${+m[3]}, ${m[1]}`
  if ((m = key.match(/^(\d{4})-(\d{2})$/))) return lang === 'vi' ? `T${+m[2]}/${m[1]}` : `${MONTH_EN[+m[2] - 1]} ${m[1]}`
  if ((m = key.match(/^(\d{4})-W(\d{2})$/))) return lang === 'vi' ? `Tuần ${+m[2]}/${m[1]}` : `W${+m[2]} ${m[1]}`
  if ((m = key.match(/^(\d{4})-Q(\d)$/))) return lang === 'vi' ? `Quý ${m[2]}/${m[1]}` : `Q${m[2]} ${m[1]}`
  return key
}

/** Short label for chart axes. */
export function periodShort(key: string, lang: Lang): string {
  let m: RegExpMatchArray | null
  if ((m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return lang === 'vi' ? `${m[3]}/${m[2]}` : `${MONTH_EN[+m[2] - 1]} ${+m[3]}`
  if ((m = key.match(/^(\d{4})-(\d{2})$/))) return lang === 'vi' ? `T${+m[2]}/${m[1].slice(2)}` : `${MONTH_EN[+m[2] - 1]} '${m[1].slice(2)}`
  if ((m = key.match(/^(\d{4})-W(\d{2})$/))) return `W${+m[2]}`
  if ((m = key.match(/^(\d{4})-Q(\d)$/))) return `Q${m[2]}/${m[1].slice(2)}`
  return key
}

export function granularityLabel(g: Granularity, lang: Lang): string {
  const vi: Record<Granularity, string> = { day: 'Ngày', week: 'Tuần', month: 'Tháng', quarter: 'Quý', year: 'Năm' }
  const en: Record<Granularity, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly', quarter: 'Quarterly', year: 'Yearly' }
  return lang === 'vi' ? vi[g] : en[g]
}

export function detectGranularity(dates: Float64Array): Granularity {
  let min = Infinity
  let max = -Infinity
  const distinct = new Set<number>()
  let firstOfMonth = 0
  let n = 0
  for (let i = 0; i < dates.length; i++) {
    const t = dates[i]
    if (t !== t) continue
    n++
    if (t < min) min = t
    if (t > max) max = t
    if (distinct.size < 5000) distinct.add(Math.floor(t / DAY))
    if (new Date(t).getUTCDate() === 1) firstOfMonth++
  }
  if (!n) return 'month'
  const span = (max - min) / DAY
  // natively monthly data (all on 1st of month)
  if (firstOfMonth / n > 0.95 && distinct.size <= 120) return span > 365 * 6 ? 'quarter' : 'month'
  if (span <= 45) return 'day'
  if (span <= 200) return 'week'
  if (span <= 365 * 5) return 'month'
  return 'quarter'
}

export interface TimeIndex {
  info: TimeInfo
  /** period index per row, -1 when date missing */
  rowPeriod: Int32Array
}

export function buildTimeIndex(ds: Dataset, dateKey: string, gran: Granularity | 'auto'): TimeIndex | null {
  const dates = ds.num[dateKey]
  if (!dates) return null
  let min = Infinity
  let max = -Infinity
  let valid = 0
  for (let i = 0; i < dates.length; i++) {
    const t = dates[i]
    if (t !== t) continue
    valid++
    if (t < min) min = t
    if (t > max) max = t
  }
  if (valid < 2 || max <= min) return null
  const detected = detectGranularity(dates)
  let g: Granularity = gran === 'auto' ? detected : gran
  // keep the number of periods sensible
  const spanDays = (max - min) / DAY
  const approx = (gg: Granularity) => spanDays / { day: 1, week: 7, month: 30.4, quarter: 91, year: 365 }[gg]
  if (approx(g) > 400) g = g === 'day' ? 'week' : g === 'week' ? 'month' : 'quarter'
  if (approx(g) > 400) g = 'quarter'

  const periods: { label: string; start: number; end: number }[] = []
  let s = periodStart(min, g)
  const last = periodStart(max, g)
  while (s <= last && periods.length < 2000) {
    const e = nextPeriod(s, g)
    periods.push({ label: periodKey(s, g), start: s, end: e })
    s = e
  }
  const rowPeriod = new Int32Array(dates.length)
  // binary search period index
  for (let i = 0; i < dates.length; i++) {
    const t = dates[i]
    if (t !== t) {
      rowPeriod[i] = -1
      continue
    }
    let lo = 0
    let hi = periods.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (periods[mid].start <= t) lo = mid
      else hi = mid - 1
    }
    rowPeriod[i] = lo
  }
  // partial first/last period: data starts late / stops early compared with the typical coverage of other periods
  const pMin = new Float64Array(periods.length).fill(Infinity)
  const pMax = new Float64Array(periods.length).fill(-Infinity)
  for (let i = 0; i < dates.length; i++) {
    const p = rowPeriod[i]
    if (p < 0) continue
    const t = dates[i]
    if (t < pMin[p]) pMin[p] = t
    if (t > pMax[p]) pMax[p] = t
  }
  const coverEnd: number[] = []
  const coverStart: number[] = []
  for (let p = 1; p < periods.length - 1; p++) {
    if (!Number.isFinite(pMax[p])) continue
    const len = periods[p].end - periods[p].start
    coverEnd.push((pMax[p] - periods[p].start + DAY) / len)
    coverStart.push((periods[p].end - pMin[p]) / len)
  }
  const med = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 1)
  const typicalEnd = med(coverEnd)
  const typicalStart = med(coverStart)
  let partialLast = false
  let aligned = 0
  let cnt = 0
  for (let i = 0; i < dates.length && cnt < 5000; i++) {
    const t = dates[i]
    if (t !== t) continue
    cnt++
    if (periodStart(t, g) === Math.floor(t / DAY) * DAY) aligned++
  }
  if (periods.length >= 3 && g !== 'day' && aligned / Math.max(1, cnt) < 0.95) {
    const lp = periods[periods.length - 1]
    const coverage = (max - lp.start + DAY) / (lp.end - lp.start)
    if (coverage < 0.6 * typicalEnd) partialLast = true
  }
  let partialFirst = false
  if (periods.length >= 4 && g !== 'day' && aligned / Math.max(1, cnt) < 0.95) {
    const fp = periods[0]
    if ((fp.end - min) / (fp.end - fp.start) < 0.6 * typicalStart) partialFirst = true
  }
  const ci = periods.length - (partialLast ? 2 : 1)
  const col = ds.columns.find((c) => c.key === dateKey)
  return {
    rowPeriod,
    info: {
      dateKey,
      dateColumn: col?.name ?? dateKey,
      min,
      max,
      spanDays,
      granularity: g,
      detectedGranularity: detected,
      periods,
      partialLast,
      partialFirst,
      currentLabel: ci >= 0 ? periods[ci].label : null,
      previousLabel: ci >= 1 ? periods[ci - 1].label : null,
    },
  }
}
