/**
 * DATA PROFILING
 * Turns a raw 2-D cell grid into a typed, columnar Dataset with per-column statistics.
 * Pure functions: runs inside the Web Worker and in unit tests.
 */
import type { ColumnProfile, ColumnType, Dataset } from '@/types/core'
import {
  detectDateOrder,
  detectNumberStyle,
  isLikelyExcelSerial,
  excelSerialToMs,
  isMissing,
  parseBoolean,
  parseDate,
  parseNumber,
  type DateOrder,
  type NumberStyle,
} from '@/lib/parse'
import { normalizeKey, normalizeValue } from '@/lib/text'
import { quantileSorted } from '@/lib/stats'

export type Cell = string | number | boolean | Date | null | undefined
export type ProgressFn = (stage: string, pct: number, detail?: string) => void

const DATE_HEADER_RE = /\b(ngay|date|time|thang|month|period|ky|nam|year|tuan|week|quy|quarter|created|updated)\b/
const ID_HEADER_RE = /^(stt|no|#|id|ma|ma so|so thu tu|index|row|seq|code|key)$|\b(id|ma so|stt)\b/
const TOTAL_ROW_RE = /^(tong cong|tong|cong|total|grand total|sum|subtotal|tong so|cong don|tong hop)\b/

function cellToString(v: Cell): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

/** Score candidate header rows within the first rows and return the best index. */
export function guessHeaderRow(rows: Cell[][], maxScan = 25): number {
  let best = 0
  let bestScore = -Infinity
  const limit = Math.min(rows.length, maxScan)
  for (let r = 0; r < limit; r++) {
    const row = rows[r] || []
    const filled = row.filter((c) => !isMissing(c))
    if (filled.length < 1) continue
    let textCells = 0
    for (const c of filled) {
      if (typeof c === 'string' && !parseNumber(c).ok && !parseDate(c).ok) textCells++
    }
    const uniq = new Set(filled.map((c) => cellToString(c).trim().toLowerCase())).size
    // the following rows should contain data (numbers/dates) in a similar width
    let follow = 0
    for (let k = r + 1; k < Math.min(rows.length, r + 6); k++) {
      const nxt = rows[k] || []
      const f = nxt.filter((c) => !isMissing(c)).length
      if (f >= Math.max(1, filled.length * 0.5)) follow++
    }
    const widest = Math.max(...rows.slice(0, limit).map((x) => (x || []).filter((c) => !isMissing(c)).length), 1)
    const score =
      (textCells / Math.max(filled.length, 1)) * 3 +
      (uniq / Math.max(filled.length, 1)) * 1.5 +
      (filled.length / widest) * 3 +
      follow * 0.6 -
      r * 0.05
    if (score > bestScore) {
      bestScore = score
      best = r
    }
  }
  return best
}

function makeHeaders(raw: Cell[], width: number): { names: string[]; duplicates: string[] } {
  const names: string[] = []
  const seen = new Map<string, number>()
  const duplicates: string[] = []
  for (let i = 0; i < width; i++) {
    let name = cellToString(raw[i]).replace(/\s+/g, ' ').trim()
    if (!name) name = `Cột ${i + 1}`
    const k = name.toLowerCase()
    const c = seen.get(k) ?? 0
    if (c > 0) {
      duplicates.push(name)
      name = `${name} (${c + 1})`
    }
    seen.set(k, c + 1)
    names.push(name)
  }
  return { names, duplicates }
}

interface TypeDecision {
  type: ColumnType
  storage: 'num' | 'str'
  numberStyle: NumberStyle
  dateOrder: DateOrder
  dateFromSerial: boolean
  dateEvidence: boolean
  currency: 'VND' | 'USD' | null
  percent: boolean
}

function sampleIndices(n: number, max: number): number[] {
  if (n <= max) return Array.from({ length: n }, (_, i) => i)
  const out: number[] = []
  const step = n / max
  for (let i = 0; i < max; i++) out.push(Math.floor(i * step))
  return out
}

function decideType(values: Cell[], header: string, datasetStyle: NumberStyle): TypeDecision {
  const idx = sampleIndices(values.length, 3000)
  const sample: Cell[] = []
  for (const i of idx) if (!isMissing(values[i])) sample.push(values[i])
  const base: TypeDecision = { type: 'empty', storage: 'str', numberStyle: 'unknown', dateOrder: 'dmy', dateFromSerial: false, dateEvidence: false, currency: null, percent: false }
  if (!sample.length) return base
  const nh = normalizeKey(header)
  let dates = 0
  let nums = 0
  let bools = 0
  let percents = 0
  let vnd = 0
  let usd = 0
  let serialLike = 0
  let rawNums = 0
  const strs: string[] = []
  for (const v of sample) {
    if (v instanceof Date) {
      dates++
      continue
    }
    if (typeof v === 'number') {
      nums++
      rawNums++
      if (isLikelyExcelSerial(v)) serialLike++
      continue
    }
    if (typeof v === 'boolean') {
      bools++
      continue
    }
    const s = String(v)
    strs.push(s)
    if (parseDate(s).ok) dates++
    const pn = parseNumber(s)
    if (pn.ok) {
      nums++
      if (pn.percent) percents++
      if (pn.currency === 'VND') vnd++
      if (pn.currency === 'USD') usd++
    } else if (parseBoolean(s) !== null) bools++
  }
  const n = sample.length
  const dateOrder = detectDateOrder(strs)
  if (dates / n >= 0.85 && dates >= nums * 0.9) {
    return { ...base, type: 'date', storage: 'num', dateOrder: dateOrder.order, dateEvidence: dateOrder.evidence }
  }
  if (rawNums / n >= 0.9 && serialLike / n >= 0.9 && DATE_HEADER_RE.test(nh)) {
    return { ...base, type: 'date', storage: 'num', dateFromSerial: true, dateEvidence: true }
  }
  if (nums / n >= 0.85) {
    let style = detectNumberStyle(strs)
    if (style === 'unknown') style = vnd > 0 ? 'vn' : datasetStyle
    const currency = vnd > usd ? 'VND' : usd > 0 ? 'USD' : null
    const isPercent = percents / n >= 0.5
    // integer sequence with id-like header -> identifier
    if (ID_HEADER_RE.test(nh) && !isPercent) {
      return { ...base, type: 'id', storage: 'num', numberStyle: style }
    }
    return { ...base, type: isPercent ? 'percent' : currency ? 'currency' : 'number', storage: 'num', numberStyle: style, currency, percent: isPercent }
  }
  const distinct = new Set(sample.map((v) => cellToString(v).trim().toLowerCase()))
  if (bools / n >= 0.95 && distinct.size <= 3) return { ...base, type: 'boolean', storage: 'str' }
  const ratio = distinct.size / n
  let avgLen = 0
  for (const v of sample) avgLen += cellToString(v).length
  avgLen /= n
  if (distinct.size <= 60 || (ratio <= 0.5 && avgLen <= 60)) return { ...base, type: 'category', storage: 'str' }
  if (ratio >= 0.9 && avgLen <= 24 && (ID_HEADER_RE.test(nh) || sample.filter((v) => /\d/.test(cellToString(v))).length / n > 0.8)) {
    return { ...base, type: 'id', storage: 'str' }
  }
  return { ...base, type: avgLen > 40 ? 'text' : 'category', storage: 'str' }
}

function isTotalRow(row: Cell[]): boolean {
  let firstText: string | null = null
  let numeric = 0
  for (const c of row) {
    if (isMissing(c)) continue
    if (firstText === null && typeof c === 'string' && !parseNumber(c).ok) firstText = c
    else if (typeof c === 'number' || (typeof c === 'string' && parseNumber(c).ok)) numeric++
  }
  if (!firstText || numeric === 0) return false
  return TOTAL_ROW_RE.test(normalizeKey(firstText))
}

export interface BuildOptions {
  name: string
  source: 'upload' | 'demo'
  fileName?: string
  fileSize?: number
  sheetName?: string
  onProgress?: ProgressFn
}

/** Build the typed, columnar dataset from raw rows. */
export function buildDataset(rows: Cell[][], headerRow: number, opts: BuildOptions): Dataset {
  const progress = opts.onProgress ?? (() => {})
  const warnings: string[] = []
  const width = Math.max(0, ...rows.slice(headerRow, headerRow + 200).map((r) => (r ? r.length : 0)))
  const { names, duplicates } = makeHeaders(rows[headerRow] || [], width)
  if (duplicates.length) warnings.push(`duplicate_headers:${duplicates.join(', ')}`)

  // body rows: drop fully empty rows and "total" rows (would double count)
  const body: Cell[][] = []
  let totalRows = 0
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.every((c) => isMissing(c))) continue
    if (isTotalRow(row)) {
      totalRows++
      continue
    }
    body.push(row)
  }
  if (totalRows) warnings.push(`total_rows_excluded:${totalRows}`)
  const n = body.length
  progress('detect', 0.1, `${n}`)

  // drop columns that are completely empty both in header (auto-named) and body
  const colIdx: number[] = []
  for (let c = 0; c < width; c++) {
    const autoName = names[c].startsWith('Cột ')
    if (autoName) {
      let any = false
      for (let r = 0; r < n && !any; r++) if (!isMissing(body[r][c])) any = true
      if (!any) continue
    }
    colIdx.push(c)
  }

  // pass 1: decide types (with a dataset-level number style fallback)
  const columnValues: Cell[][] = colIdx.map((c) => body.map((row) => row[c]))
  let decisions = colIdx.map((_, i) => decideType(columnValues[i], names[colIdx[i]], 'unknown'))
  const styleVotes = decisions.filter((d) => d.storage === 'num' && d.numberStyle !== 'unknown')
  const vn = styleVotes.filter((d) => d.numberStyle === 'vn').length
  const en = styleVotes.filter((d) => d.numberStyle === 'en').length
  const datasetStyle: NumberStyle = vn > en ? 'vn' : en > vn ? 'en' : 'unknown'
  if (datasetStyle !== 'unknown') {
    decisions = decisions.map((d, i) => (d.storage === 'num' && d.numberStyle === 'unknown' && d.type !== 'date' ? decideType(columnValues[i], names[colIdx[i]], datasetStyle) : d))
  }
  progress('clean', 0.3)

  const num: Record<string, Float64Array> = {}
  const str: Record<string, (string | null)[]> = {}
  const review: Record<string, Record<number, string>> = {}
  const columns: ColumnProfile[] = []
  const now = Date.now()

  decisions.forEach((d, i) => {
    const key = `c${i}`
    const values = columnValues[i]
    const header = names[colIdx[i]]
    const prof: ColumnProfile = {
      key,
      index: colIdx[i],
      name: header,
      type: d.type,
      storage: d.storage,
      count: 0,
      missing: 0,
      missingPct: 0,
      unique: 0,
      needsReview: 0,
      reviewSamples: [],
      invalid: 0,
      negativeCount: 0,
      zeroCount: 0,
      outlierCount: 0,
      sample: [],
      currency: d.currency,
    }
    const rv: Record<number, string> = {}
    if (d.storage === 'num') {
      const arr = new Float64Array(n)
      let hasTime = false
      for (let r = 0; r < n; r++) {
        const v = values[r]
        if (isMissing(v)) {
          arr[r] = NaN
          prof.missing++
          continue
        }
        if (d.type === 'date') {
          let t = NaN
          if (typeof v === 'number' && d.dateFromSerial) t = excelSerialToMs(v)
          else {
            const pd = parseDate(v, d.dateOrder)
            if (pd.ok) {
              t = pd.value
              if (pd.hasTime) hasTime = true
            }
          }
          if (Number.isFinite(t)) {
            arr[r] = t
            if (t > now + 86400000 * 2) prof.futureDates = (prof.futureDates ?? 0) + 1
          } else {
            arr[r] = NaN
            prof.invalid++
            rv[r] = cellToString(v)
          }
        } else {
          const pn = parseNumber(v, d.numberStyle)
          if (pn.ok && !pn.ambiguous) arr[r] = pn.value
          else {
            arr[r] = NaN
            rv[r] = cellToString(v)
            if (pn.ok) {
              prof.needsReview++
              if (prof.reviewSamples.length < 6) prof.reviewSamples.push(cellToString(v))
            } else prof.invalid++
          }
        }
      }
      if (d.type === 'date') {
        prof.hasTime = hasTime
        prof.dateFormat = d.dateFromSerial ? 'excel-serial' : d.dateOrder === 'mdy' ? 'mm/dd/yyyy' : d.dateEvidence ? 'dd/mm/yyyy' : 'dd/mm/yyyy*'
      }
      num[key] = arr
      profileNumeric(prof, arr, d.type === 'date')
    } else {
      const arr: (string | null)[] = new Array(n)
      const counts = new Map<string, number>()
      let ws = 0
      for (let r = 0; r < n; r++) {
        const v = values[r]
        if (isMissing(v)) {
          arr[r] = null
          prof.missing++
          continue
        }
        let s = cellToString(v)
        if (s !== s.trim() || /\s{2,}/.test(s)) {
          ws++
          s = s.replace(/\s+/g, ' ').trim()
        }
        arr[r] = s
        counts.set(s, (counts.get(s) ?? 0) + 1)
      }
      str[key] = arr
      prof.count = n - prof.missing
      prof.unique = counts.size
      prof.whitespaceIssues = ws
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])
      prof.topValues = top.slice(0, 12).map(([value, count]) => ({ value, count }))
      prof.sample = top.slice(0, 5).map(([v]) => v)
      // inconsistent variants: values that collide after normalization (Hà Nội / ha noi / HA NOI)
      if (counts.size <= 5000) {
        const norm = new Map<string, number>()
        for (const k of counts.keys()) {
          const nk = normalizeValue(k)
          norm.set(nk, (norm.get(nk) ?? 0) + 1)
        }
        let inc = 0
        for (const c of norm.values()) if (c > 1) inc += c - 1
        prof.inconsistentVariants = inc
      }
    }
    if (Object.keys(rv).length) review[key] = rv
    prof.missingPct = n ? prof.missing / n : 0
    columns.push(prof)
    progress('clean', 0.3 + (0.6 * (i + 1)) / decisions.length)
  })

  // duplicate rows (exact match across kept columns)
  let duplicateRows = 0
  if (n > 1) {
    const seen = new Set<string>()
    for (let r = 0; r < n; r++) {
      let k = ''
      for (const c of colIdx) k += cellToString(body[r][c]) + '\u0001'
      if (seen.has(k)) duplicateRows++
      else seen.add(k)
    }
  }
  const currencies = columns.map((c) => c.currency).filter(Boolean)
  const currency = currencies.includes('VND') ? 'VND' : currencies.includes('USD') ? 'USD' : null
  progress('clean', 1)
  return {
    id: `ds_${now.toString(36)}`,
    name: opts.name,
    source: opts.source,
    fileName: opts.fileName,
    fileSize: opts.fileSize,
    sheetName: opts.sheetName,
    rowCount: n,
    columns,
    num,
    str,
    review,
    currency,
    duplicateRows,
    headerRow,
    duplicateHeaders: duplicates,
    createdAt: now,
    warnings,
  }
}

/** Fill numeric statistics on a profile. */
export function profileNumeric(prof: ColumnProfile, arr: Float64Array, isDate: boolean) {
  let k = 0
  const vals = new Float64Array(arr.length)
  let s = 0
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i]
    if (v === v) {
      vals[k++] = v
      s += v
      if (v < 0) prof.negativeCount++
      if (v === 0) prof.zeroCount++
    }
  }
  const sorted = vals.subarray(0, k).sort()
  prof.count = k
  if (!k) return
  prof.min = sorted[0]
  prof.max = sorted[k - 1]
  prof.sum = isDate ? undefined : s
  prof.mean = s / k
  prof.median = quantileSorted(sorted, 0.5)
  prof.p25 = quantileSorted(sorted, 0.25)
  prof.p75 = quantileSorted(sorted, 0.75)
  let v2 = 0
  for (let i = 0; i < k; i++) v2 += (sorted[i] - prof.mean) ** 2
  prof.std = k > 1 ? Math.sqrt(v2 / (k - 1)) : 0
  // unique count (exact for <= 200k values)
  let u = k ? 1 : 0
  for (let i = 1; i < k; i++) if (sorted[i] !== sorted[i - 1]) u++
  prof.unique = u
  if (!isDate) {
    const iqr = prof.p75 - prof.p25
    const lo = prof.p25 - 3 * iqr
    const hi = prof.p75 + 3 * iqr
    let o = 0
    if (iqr > 0) for (let i = 0; i < k; i++) if (sorted[i] < lo || sorted[i] > hi) o++
    prof.outlierCount = o
  }
  const step = Math.max(1, Math.floor(k / 5))
  prof.sample = []
  for (let i = 0; i < k && prof.sample.length < 5; i += step) prof.sample.push(String(sorted[i]))
}

/** Count distinct non-null values of a string column. */
export function distinctCount(arr: (string | null)[]): number {
  const s = new Set<string>()
  for (const v of arr) if (v !== null) s.add(v)
  return s.size
}
