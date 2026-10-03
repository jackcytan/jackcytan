/** Locale-aware number formatting for VND / USD / generic numbers. */
import type { Lang, NumberFormat } from '@/types/core'
import type { Param } from '@/types/analysis'

export type CurrencyMode = 'VND' | 'USD' | null

let currentLang: Lang = 'vi'
let currentCurrency: CurrencyMode = 'VND'

export function setFormatContext(lang: Lang, currency: CurrencyMode) {
  currentLang = lang
  currentCurrency = currency
}
export function getFormatLang(): Lang {
  return currentLang
}

const nfCache = new Map<string, Intl.NumberFormat>()
function nf(lang: Lang, min: number, max: number): Intl.NumberFormat {
  const k = `${lang}|${min}|${max}`
  let f = nfCache.get(k)
  if (!f) {
    f = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { minimumFractionDigits: min, maximumFractionDigits: max })
    nfCache.set(k, f)
  }
  return f
}

/** Compact number: 20,4 tỷ / 20.4B */
export function compact(n: number, lang: Lang = currentLang): string {
  if (!Number.isFinite(n)) return '—'
  const a = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  const units: [number, string, string][] = [
    [1e12, ' nghìn tỷ', 'T'],
    [1e9, ' tỷ', 'B'],
    [1e6, ' triệu', 'M'],
    [1e3, ' nghìn', 'K'],
  ]
  for (const [v, vi, en] of units) {
    if (a >= v) {
      const x = a / v
      const digits = x >= 100 ? 0 : x >= 10 ? 1 : 2
      return sign + nf(lang, 0, digits).format(x) + (lang === 'vi' ? vi : en)
    }
  }
  return sign + nf(lang, 0, a < 10 ? 2 : a < 100 ? 1 : 0).format(a)
}

export function fmtNumber(n: number, digits = 0, lang: Lang = currentLang): string {
  if (!Number.isFinite(n)) return '—'
  return nf(lang, 0, digits).format(n)
}

export function fmtCurrency(n: number, opts: { compact?: boolean; lang?: Lang; currency?: CurrencyMode } = {}): string {
  const lang = opts.lang ?? currentLang
  const cur = opts.currency === undefined ? currentCurrency : opts.currency
  if (!Number.isFinite(n)) return '—'
  const useCompact = opts.compact ?? Math.abs(n) >= 1e6
  const body = useCompact ? compact(n, lang) : fmtNumber(n, Math.abs(n) < 100 && n % 1 !== 0 ? 2 : 0, lang)
  if (cur === 'VND') return body + ' ₫'
  if (cur === 'USD') return (n < 0 ? '-$' : '$') + body.replace(/^-/, '')
  return body
}

export function fmtPercent(fraction: number, digits = 1, lang: Lang = currentLang): string {
  if (!Number.isFinite(fraction)) return '—'
  return nf(lang, digits, digits).format(fraction * 100) + '%'
}

export function fmtSigned(s: string, n: number): string {
  return n > 0 ? '+' + s : s
}

export function formatValue(n: number | null | undefined, f: NumberFormat, opts: { compact?: boolean; signed?: boolean; lang?: Lang } = {}): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  const lang = opts.lang ?? currentLang
  let s: string
  switch (f) {
    case 'currency':
      s = fmtCurrency(n, { compact: opts.compact, lang })
      break
    case 'percent':
      s = fmtPercent(n, Math.abs(n) < 0.01 && n !== 0 ? 2 : 1, lang)
      break
    case 'pp':
      s = nf(lang, 1, 1).format(n * 100) + (lang === 'vi' ? ' điểm %' : ' pp')
      break
    case 'ratio':
      s = nf(lang, 0, 2).format(n) + '×'
      break
    case 'minutes':
      s = (opts.compact !== false && Math.abs(n) >= 1e4 ? compact(n, lang) : fmtNumber(n, 1, lang)) + (lang === 'vi' ? ' phút' : ' min')
      break
    case 'hours':
      s = (Math.abs(n) >= 1e4 ? compact(n, lang) : fmtNumber(n, 1, lang)) + (lang === 'vi' ? ' giờ' : ' h')
      break
    case 'days':
      s = fmtNumber(n, 1, lang) + (lang === 'vi' ? ' ngày' : ' days')
      break
    case 'score':
      s = fmtNumber(n, 2, lang)
      break
    case 'integer':
      s = opts.compact && Math.abs(n) >= 1e6 ? compact(n, lang) : fmtNumber(Math.round(n), 0, lang)
      break
    default:
      s = opts.compact !== false && Math.abs(n) >= 1e5 ? compact(n, lang) : fmtNumber(n, Math.abs(n) < 10 ? 2 : Math.abs(n) < 1000 ? 1 : 0, lang)
  }
  return opts.signed ? fmtSigned(s, n) : s
}

export function formatParam(p: Param, lang: Lang = currentLang): string {
  if (typeof p === 'string') return p
  if ('t' in p) return p.t[lang]
  return formatValue(p.v, p.f, { signed: p.signed, lang })
}

/** Render a template "Doanh thu {a} ..." with params. Unknown keys stay visible to surface bugs in tests. */
export function renderTemplate(tpl: string, params: Record<string, Param>, lang: Lang = currentLang): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? formatParam(params[k], lang) : `{${k}}`))
}

export function fmtDate(ms: number, lang: Lang = currentLang, withTime = false): string {
  if (!Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const y = d.getUTCFullYear()
  const base = lang === 'vi' ? `${dd}/${mm}/${y}` : `${y}-${mm}-${dd}`
  if (!withTime) return base
  return `${base} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
