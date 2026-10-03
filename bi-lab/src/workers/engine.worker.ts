/// <reference lib="webworker" />
/**
 * ENGINE WORKER — all heavy work (file parsing, profiling, semantic detection, analysis, demo
 * generation) runs here so the UI never freezes. Nothing leaves this browser tab.
 */
import type { WorkerRequest, WorkerResponse, StageId, ErrorCode } from './protocol'
import type { Dataset } from '@/types/core'
import type { Cell } from '@/intelligence/profiling/profiler'
import { readWorkbook, previewRows, ParseError, type ParsedWorkbook } from './fileReader'
import { buildDataset, guessHeaderRow } from '@/intelligence/profiling/profiler'
import { detectFields, mappingFromMatches } from '@/intelligence/semantic/detect'
import { analyze } from '@/intelligence/analysis/analyze'
import { generateDemo } from '@/demo/generator'

declare const self: DedicatedWorkerGlobalScope

let workbook: ParsedWorkbook | null = null
let fileMeta: { fileName: string; size: number } | null = null
const rowCache = new Map<string, Cell[][]>()
let dataset: Dataset | null = null

const post = (m: WorkerResponse) => self.postMessage(m)
const progress = (id: number, stage: StageId, pct: number, detail?: string) => post({ type: 'progress', id, stage, pct, detail })

function sheetRows(name: string): Cell[][] {
  const hit = rowCache.get(name)
  if (hit) return hit
  const s = workbook?.sheets.find((x) => x.name === name)
  const rows = s ? s.rows() : []
  rowCache.set(name, rows)
  return rows
}

function fail(id: number, code: ErrorCode, detail?: string) {
  post({ type: 'error', id, code, detail })
}

function buildAndAnalyze(id: number, rows: Cell[][], headerRow: number, opts: { name: string; source: 'upload' | 'demo'; fileName?: string; fileSize?: number; sheetName?: string }, settings: import('@/types/core').AnalysisSettings) {
  progress(id, 'detect', 0, String(rows.length))
  const ds = buildDataset(rows, headerRow, { ...opts, onProgress: (stage, pct) => progress(id, stage as StageId, pct, String(rows.length)) })
  if (ds.rowCount === 0) return fail(id, 'no_data')
  if (ds.columns.length === 0) return fail(id, 'no_header')
  progress(id, 'detect', 1, `${ds.rowCount}`)
  const fields = detectFields(ds)
  const mapping = mappingFromMatches(fields)
  const analysis = analyze(ds, mapping, settings, (stage, pct, detail) => progress(id, stage as StageId, pct, detail))
  dataset = ds
  post({ type: 'built', id, dataset: ds, fields, mapping, analysis })
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data
  try {
    switch (msg.type) {
      case 'parse': {
        progress(msg.id, 'read', 0.2)
        if (msg.size > 200 * 1024 * 1024) return fail(msg.id, 'too_large')
        rowCache.clear()
        workbook = await readWorkbook(msg.buffer, msg.fileName)
        fileMeta = { fileName: msg.fileName, size: msg.size }
        progress(msg.id, 'parse', 0.6)
        const sheets = workbook.sheets.map((s) => {
          const rows = sheetRows(s.name)
          const width = Math.max(0, ...rows.slice(0, 50).map((r) => (r ? r.length : 0)))
          return { name: s.name, rowCount: rows.length, colCount: width, preview: previewRows(rows), headerGuess: rows.length ? guessHeaderRow(rows) : 0 }
        })
        if (!sheets.some((s) => s.rowCount > 0)) return fail(msg.id, 'empty')
        progress(msg.id, 'parse', 1)
        post({ type: 'parsed', id: msg.id, sheets, kind: workbook.kind })
        return
      }
      case 'build': {
        const rows = sheetRows(msg.sheet)
        if (!rows.length) return fail(msg.id, 'empty')
        const width = Math.max(0, ...rows.slice(msg.headerRow, msg.headerRow + 50).map((r) => (r ? r.length : 0)))
        if (width < 1) return fail(msg.id, 'no_header')
        if (rows.length - msg.headerRow - 1 < 1) return fail(msg.id, 'no_data')
        buildAndAnalyze(msg.id, rows, msg.headerRow, { name: msg.name, source: 'upload', fileName: fileMeta?.fileName, fileSize: fileMeta?.size, sheetName: msg.sheet }, msg.settings)
        return
      }
      case 'analyze': {
        if (!dataset) return fail(msg.id, 'internal', 'no dataset')
        const analysis = analyze(dataset, msg.mapping, msg.settings, (stage, pct, detail) => progress(msg.id, stage as StageId, pct, detail))
        post({ type: 'analyzed', id: msg.id, analysis })
        return
      }
      case 'demo': {
        progress(msg.id, 'read', 1)
        const rows = generateDemo(msg.demoId)
        progress(msg.id, 'parse', 1, String(rows.length - 1))
        workbook = null
        buildAndAnalyze(msg.id, rows, 0, { name: msg.name, source: 'demo' }, msg.settings)
        return
      }
    }
  } catch (e) {
    if (e instanceof ParseError) return fail(msg.id, e.code, e.message)
    console.error(e)
    fail(msg.id, 'internal', String((e as Error)?.message ?? e))
  }
}
