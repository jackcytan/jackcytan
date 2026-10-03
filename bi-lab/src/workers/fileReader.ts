/**
 * Safe file parsing (runs inside the worker).
 * - XLSX/XLSM/XLS via SheetJS: cached cell VALUES only — formulas are never executed, macros/VBA are
 *   never loaded, no HTML is produced.
 * - CSV/TSV via Papa Parse with delimiter auto-detection and encoding fallback.
 */
import type { Cell } from '@/intelligence/profiling/profiler'

export class ParseError extends Error {
  code: 'corrupt' | 'empty' | 'unsupported' | 'password'
  constructor(code: 'corrupt' | 'empty' | 'unsupported' | 'password', msg?: string) {
    super(msg ?? code)
    this.code = code
  }
}

export interface ParsedWorkbook {
  kind: 'xlsx' | 'csv'
  sheets: { name: string; rows: () => Cell[][] }[]
}

function decodeText(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  // UTF-16 BOMs
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes)
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes)
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  const bad = (utf8.match(/�/g) || []).length
  if (bad > Math.max(3, utf8.length * 0.001)) {
    try {
      return new TextDecoder('windows-1258').decode(bytes)
    } catch {
      return utf8
    }
  }
  return utf8.charCodeAt(0) === 0xfeff ? utf8.slice(1) : utf8
}

export async function readWorkbook(buf: ArrayBuffer, fileName: string): Promise<ParsedWorkbook> {
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  if (!buf.byteLength) throw new ParseError('empty')
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const Papa = (await import('papaparse')).default
    const text = decodeText(buf)
    if (!text.trim()) throw new ParseError('empty')
    const res = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy', dynamicTyping: false, delimiter: ext === 'tsv' ? '\t' : '' })
    const rows = res.data as Cell[][]
    if (!rows.length) throw new ParseError('empty')
    return { kind: 'csv', sheets: [{ name: fileName.replace(/\.[^.]+$/, ''), rows: () => rows }] }
  }
  if (!['xlsx', 'xlsm', 'xls', 'xlsb', 'ods'].includes(ext)) throw new ParseError('unsupported')
  const bytes = new Uint8Array(buf)
  // ZIP (xlsx/xlsm/ods) or OLE2 (xls / encrypted xlsx) signatures
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b
  const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf
  if (!isZip && !isOle) throw new ParseError('corrupt')
  const XLSX = await import('@e965/xlsx')
  let wb: import('@e965/xlsx').WorkBook
  try {
    wb = XLSX.read(bytes, { type: 'array', cellDates: true, cellFormula: false, cellHTML: false, cellStyles: false, bookVBA: false, sheetStubs: false, dense: true, WTF: false })
  } catch (e) {
    const msg = String((e as Error)?.message ?? e)
    if (/password|encrypt/i.test(msg)) throw new ParseError('password')
    throw new ParseError('corrupt', msg)
  }
  if (!wb.SheetNames.length) throw new ParseError('empty')
  return {
    kind: 'xlsx',
    sheets: wb.SheetNames.map((name) => ({
      name,
      rows: () => {
        const ws = wb.Sheets[name]
        if (!ws) return []
        const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, raw: true, defval: null, blankrows: false }) as Cell[][]
        // merged cells: propagate the anchor value across the merged range (common in business reports)
        const merges = (ws['!merges'] ?? []).slice(0, 5000)
        const r0 = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1').s.r
        for (const m of merges) {
          const anchor = rows[m.s.r - r0]?.[m.s.c]
          if (anchor === null || anchor === undefined) continue
          for (let r = m.s.r; r <= m.e.r; r++) {
            const row = rows[r - r0]
            if (!row) continue
            for (let c = m.s.c; c <= m.e.c; c++) if (row[c] === null || row[c] === undefined) row[c] = anchor
          }
        }
        return rows
      },
    })),
  }
}

export function previewRows(rows: Cell[][], n = 30): (string | null)[][] {
  return rows.slice(0, n).map((r) =>
    (r ?? []).slice(0, 60).map((c) => {
      if (c === null || c === undefined) return null
      if (c instanceof Date) return Number.isFinite(c.getTime()) ? c.toISOString().slice(0, 10) : null
      const s = String(c)
      return s.length > 80 ? s.slice(0, 77) + '…' : s
    }),
  )
}
