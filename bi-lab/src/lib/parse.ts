/**
 * Robust value parsers for business spreadsheets (Vietnamese + English conventions).
 * Never guesses silently: ambiguous conversions are reported so the caller can flag "Needs Review".
 */
import { stripAccents } from './text'

export const MISSING_TOKENS = new Set([
  '', '-', '--', '---', '—', 'n/a', 'na', 'n.a', 'null', 'none', 'nil', 'undefined', 'nan', '#n/a', '#value!', '#ref!',
  '#div/0!', '#name?', '#num!', '#null!', '?', 'blank', '(blank)', 'trống', 'trong', 'không có', 'khong co', 'chưa có', 'chua co', 'x/a',
])

export function isMissing(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'number') return !Number.isFinite(v)
  if (typeof v === 'string') return MISSING_TOKENS.has(v.trim().toLowerCase())
  return false
}

export type NumberStyle = 'vn' | 'en' | 'unknown'

export interface ParsedNumber {
  ok: boolean
  value: number
  ambiguous: boolean
  currency: 'VND' | 'USD' | null
  percent: boolean
  /** which separator interpretation was needed: 'dot-thousands' | 'comma-thousands' */
  hint: 'dot-thousands' | 'comma-thousands' | 'dot-decimal' | 'comma-decimal' | null
}

const PLAIN_INT = /^-?\d{1,15}$/
const FAIL: ParsedNumber = { ok: false, value: NaN, ambiguous: false, currency: null, percent: false, hint: null }

const MAGNITUDES: [RegExp, number][] = [
  [/(nghin ty|ngan ty)$/, 1e12],
  [/(ty|ti|ty dong|ti dong|bn|billion|b)$/, 1e9],
  [/(trieu|tr|trieu dong|million|mn|mil|m)$/, 1e6],
  [/(nghin|ngan|ng|thousand|k)$/, 1e3],
]

/**
 * Parse a number from a cell. `style` is the column-level separator convention when known.
 */
export function parseNumber(raw: unknown, style: NumberStyle = 'unknown'): ParsedNumber {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? { ok: true, value: raw, ambiguous: false, currency: null, percent: false, hint: null } : FAIL
  }
  if (typeof raw === 'boolean') return FAIL
  if (raw instanceof Date) return FAIL
  if (typeof raw !== 'string') return FAIL
  // fast path: plain integers / simple decimals ("12345", "-12.5" with a non-3-digit fraction)
  if (PLAIN_INT.test(raw)) return { ok: true, value: Number(raw), ambiguous: false, currency: null, percent: false, hint: null }
  let s = raw.trim()
  if (!s || s.length > 40) return FAIL
  let currency: 'VND' | 'USD' | null = null
  let negative = false
  let percent = false

  if (/^\(.*\)$/.test(s)) {
    negative = true
    s = s.slice(1, -1).trim()
  }
  let low = stripAccents(s.toLowerCase())
  // currency markers
  if (/(₫|\bvnd\b|\bvnđ\b|\bdong\b|\bđ\b|(?<=\d)\s*đ$|(?<=\d)\s*d$)/i.test(s) || /\bvnd\b|\bdong\b/.test(low)) currency = 'VND'
  if (/(\$|\busd\b|us\$)/i.test(s)) currency = currency ?? 'USD'
  low = low
    .replace(/us\$|\$|₫|\busd\b|\bvnd\b|\bvnđ\b|\bdong\b/g, ' ')
    .replace(/(?<=[\d\s])(đ|d)$/, ' ')
    .trim()
  if (low.endsWith('%')) {
    percent = true
    low = low.slice(0, -1).trim()
  }
  if (low.startsWith('-')) {
    negative = !negative
    low = low.slice(1).trim()
  } else if (low.startsWith('+')) {
    low = low.slice(1).trim()
  } else if (low.endsWith('-')) {
    negative = !negative
    low = low.slice(0, -1).trim()
  }
  let mult = 1
  const word = low.match(/[a-z ]+$/)
  if (word) {
    const w = word[0].trim()
    if (w) {
      let found = false
      for (const [re, m] of MAGNITUDES) {
        if (re.test(w) && w.replace(re, '').trim() === '') {
          mult = m
          found = true
          break
        }
      }
      if (!found) return FAIL
      low = low.slice(0, low.length - word[0].length).trim()
    }
  }
  if (!low) return FAIL
  // remove spaces between digit groups (1 000 000) and non-breaking spaces
  low = low.replace(/[\s\u00a0\u202f]/g, '')
  if (!/^[\d.,']+$/.test(low)) return FAIL
  low = low.replace(/'/g, '')
  if (!/\d/.test(low)) return FAIL

  let ambiguous = false
  let hint: ParsedNumber['hint'] = null
  const dots = (low.match(/\./g) || []).length
  const commas = (low.match(/,/g) || []).length
  let normalized: string

  if (dots && commas) {
    const lastDot = low.lastIndexOf('.')
    const lastComma = low.lastIndexOf(',')
    if (lastComma > lastDot) {
      normalized = low.replace(/\./g, '').replace(',', '.')
      hint = 'dot-thousands'
    } else {
      normalized = low.replace(/,/g, '')
      hint = 'comma-thousands'
    }
  } else if (dots > 1 || commas > 1) {
    const sep = dots > 1 ? '.' : ','
    const groups = low.split(sep)
    if (!groups.slice(1).every((g) => g.length === 3)) return FAIL
    normalized = groups.join('')
    hint = sep === '.' ? 'dot-thousands' : 'comma-thousands'
  } else if (dots === 1 || commas === 1) {
    const sep = dots === 1 ? '.' : ','
    const [a, b] = low.split(sep)
    if (!a && !b) return FAIL
    const threeAfter = b.length === 3 && a.length >= 1 && a.length <= 3 && a !== '0'
    if (threeAfter) {
      // "1.000" / "1,000" — thousands or decimal depends on convention
      const thousands = style === 'vn' ? sep === '.' : style === 'en' ? sep === ',' : null
      if (thousands === null) {
        ambiguous = true
        // best-effort default: separator interpreted as thousands (most common in business sheets)
        normalized = a + b
        hint = sep === '.' ? 'dot-thousands' : 'comma-thousands'
      } else if (thousands) {
        normalized = a + b
        hint = sep === '.' ? 'dot-thousands' : 'comma-thousands'
      } else {
        normalized = a + '.' + b
        hint = sep === '.' ? 'dot-decimal' : 'comma-decimal'
      }
    } else {
      normalized = (a || '0') + '.' + b
      hint = sep === '.' ? 'dot-decimal' : 'comma-decimal'
    }
  } else {
    normalized = low
  }
  const value = Number(normalized)
  if (!Number.isFinite(value)) return FAIL
  let v = value * mult
  if (negative) v = -v
  if (percent) v = v / 100
  return { ok: true, value: v, ambiguous, currency, percent, hint }
}

/** Decide column-level separator convention from a sample of raw strings. */
export function detectNumberStyle(values: unknown[]): NumberStyle {
  let vn = 0
  let en = 0
  let dotThree = 0
  let dotOther = 0
  let commaThree = 0
  let commaOther = 0
  for (const v of values) {
    if (typeof v !== 'string') continue
    const s = v.replace(/[^\d.,]/g, '')
    if (!s) continue
    const dots = (s.match(/\./g) || []).length
    const commas = (s.match(/,/g) || []).length
    if (dots && commas) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) vn++
      else en++
    } else if (dots > 1) vn++
    else if (commas > 1) en++
    else if (dots === 1) {
      const b = s.split('.')[1]
      if (b.length === 3) dotThree++
      else dotOther++
    } else if (commas === 1) {
      const b = s.split(',')[1]
      if (b.length === 3) commaThree++
      else commaOther++
    }
  }
  // decimal evidence
  if (dotOther > 0) en += dotOther
  if (commaOther > 0) vn += commaOther
  if (vn > en) return 'vn'
  if (en > vn) return 'en'
  // all single-separator values with exactly three trailing digits: overwhelmingly thousands separators
  if (dotThree >= 5 && commaThree === 0) return 'vn'
  if (commaThree >= 5 && dotThree === 0) return 'en'
  return 'unknown'
}

// ---------------------------------------------------------------- dates

export type DateOrder = 'dmy' | 'mdy' | 'unknown'

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
}

export interface ParsedDate {
  ok: boolean
  value: number
  hasTime: boolean
  /** detected component order when the string was day/month ambiguous */
  order?: 'dmy' | 'mdy' | 'ymd' | 'other'
  ambiguousDM?: boolean
  firstPart?: number
  secondPart?: number
}

const DFAIL: ParsedDate = { ok: false, value: NaN, hasTime: false }

function utc(y: number, m: number, d: number, hh = 0, mm = 0, ss = 0): number {
  if (y < 100) y += y < 50 ? 2000 : 1900
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return NaN
  const t = Date.UTC(y, m - 1, d, hh, mm, ss)
  const dt = new Date(t)
  if (dt.getUTCDate() !== d) return NaN
  return t
}

/** Excel serial date (1900 system) to epoch ms. */
export function excelSerialToMs(serial: number): number {
  // Excel's 1900 leap year bug: serial 60 == 1900-02-29 (doesn't exist); offset handled by epoch 1899-12-30
  return Math.round((serial - 25569) * 86400000)
}

export function isLikelyExcelSerial(n: number): boolean {
  return Number.isFinite(n) && n > 20000 && n < 80000
}

export function parseDate(raw: unknown, order: DateOrder = 'unknown'): ParsedDate {
  if (raw instanceof Date) {
    const t = raw.getTime()
    if (!Number.isFinite(t)) return DFAIL
    // xlsx creates local-time dates; convert to the same calendar date in UTC
    const v = Date.UTC(raw.getFullYear(), raw.getMonth(), raw.getDate(), raw.getHours(), raw.getMinutes(), raw.getSeconds())
    return { ok: true, value: v, hasTime: raw.getHours() + raw.getMinutes() + raw.getSeconds() > 0, order: 'other' }
  }
  if (typeof raw === 'number') return DFAIL
  if (typeof raw !== 'string') return DFAIL
  const s = raw.length === 10 && raw.charCodeAt(4) === 45 && raw.charCodeAt(7) === 45 ? raw : raw.trim()
  if (s.length < 4 || s.length > 40) return DFAIL
  // fast path: yyyy-mm-dd
  if (s.length === 10 && s.charCodeAt(4) === 45 && s.charCodeAt(7) === 45) {
    const v = utc(+s.slice(0, 4), +s.slice(5, 7), +s.slice(8, 10))
    if (Number.isFinite(v)) return { ok: true, value: v, hasTime: false, order: 'ymd' }
  }
  let m: RegExpMatchArray | null
  // ISO yyyy-mm-dd[ T]hh:mm[:ss]
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/))) {
    const v = utc(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0))
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: !!m[4], order: 'ymd' } : DFAIL
  }
  // dd/mm/yyyy or mm/dd/yyyy (also -, .) with optional time
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|sa|ch)?)?$/i))) {
    const a = +m[1]
    const b = +m[2]
    const y = +m[3]
    let hh = +(m[4] || 0)
    const ap = (m[7] || '').toLowerCase()
    if ((ap === 'pm' || ap === 'ch') && hh < 12) hh += 12
    if ((ap === 'am' || ap === 'sa') && hh === 12) hh = 0
    let d: number, mo: number, ord: 'dmy' | 'mdy'
    if (a > 12) {
      d = a; mo = b; ord = 'dmy'
    } else if (b > 12) {
      d = b; mo = a; ord = 'mdy'
    } else if (order === 'mdy') {
      d = b; mo = a; ord = 'mdy'
    } else {
      d = a; mo = b; ord = 'dmy'
    }
    const v = utc(y, mo, d, hh, +(m[5] || 0), +(m[6] || 0))
    return Number.isFinite(v)
      ? { ok: true, value: v, hasTime: !!m[4], order: ord, ambiguousDM: a <= 12 && b <= 12 && a !== b, firstPart: a, secondPart: b }
      : DFAIL
  }
  const low = stripAccents(s.toLowerCase())
  // month-year: 01/2024, 2024-01, thang 1/2024, thang 1 nam 2024, T1/2024
  if ((m = low.match(/^(?:thang\s*|t)?(\d{1,2})\s*[-/.]\s*(\d{4})$/)) || (m = low.match(/^thang\s*(\d{1,2})\s*(?:nam)?\s*(\d{4})$/))) {
    const v = utc(+m[2], +m[1], 1)
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: false, order: 'other' } : DFAIL
  }
  if ((m = low.match(/^(\d{4})\s*[-/.]\s*(\d{1,2})$/))) {
    const v = utc(+m[1], +m[2], 1)
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: false, order: 'other' } : DFAIL
  }
  // quarters: Q1 2024, Q1/2024, 2024 Q1, quy 1/2024
  if ((m = low.match(/^(?:q|quy\s*)([1-4])\s*[-/ ]?\s*(\d{4})$/)) || (m = low.match(/^(\d{4})\s*[-/ ]?\s*q([1-4])$/))) {
    const [q, y] = m[1].length === 4 ? [+m[2], +m[1]] : [+m[1], +m[2]]
    const v = utc(y, (q - 1) * 3 + 1, 1)
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: false, order: 'other' } : DFAIL
  }
  // 15 Jan 2024 / Jan 15, 2024 / January 2024
  if ((m = low.match(/^(\d{1,2})\s+([a-z]+)\.?,?\s+(\d{4})$/)) && MONTHS[m[2]]) {
    const v = utc(+m[3], MONTHS[m[2]], +m[1])
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: false, order: 'other' } : DFAIL
  }
  if ((m = low.match(/^([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/)) && MONTHS[m[1]]) {
    const v = utc(+m[3], MONTHS[m[1]], +m[2])
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: false, order: 'other' } : DFAIL
  }
  if ((m = low.match(/^([a-z]+)\.?\s+(\d{4})$/)) && MONTHS[m[1]]) {
    const v = utc(+m[2], MONTHS[m[1]], 1)
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: false, order: 'other' } : DFAIL
  }
  // "ngay 15 thang 3 nam 2024"
  if ((m = low.match(/^ngay\s*(\d{1,2})\s*thang\s*(\d{1,2})\s*nam\s*(\d{4})$/))) {
    const v = utc(+m[3], +m[2], +m[1])
    return Number.isFinite(v) ? { ok: true, value: v, hasTime: false, order: 'dmy' } : DFAIL
  }
  return DFAIL
}

/** Decide day/month order for a column from unambiguous samples. Defaults to dmy (Vietnam). */
export function detectDateOrder(values: unknown[]): { order: DateOrder; evidence: boolean } {
  let dmy = 0
  let mdy = 0
  for (const v of values) {
    if (typeof v !== 'string') continue
    const m = v.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
    if (!m) continue
    if (+m[1] > 12 && +m[2] <= 12) dmy++
    else if (+m[2] > 12 && +m[1] <= 12) mdy++
  }
  if (mdy > dmy) return { order: 'mdy', evidence: true }
  if (dmy > 0) return { order: 'dmy', evidence: true }
  return { order: 'dmy', evidence: false }
}

const TRUE_SET = new Set(['true', 'yes', 'y', 'co', 'có', 'x', '1', 'dung', 'đúng', 'ok', 'active', 'hoat dong'])
const FALSE_SET = new Set(['false', 'no', 'n', 'khong', 'không', '0', 'sai', 'inactive'])
export function parseBoolean(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw
  if (typeof raw !== 'string') return null
  const s = stripAccents(raw.trim().toLowerCase())
  if (TRUE_SET.has(s)) return true
  if (FALSE_SET.has(s)) return false
  return null
}
