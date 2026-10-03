/** User-level actions: they orchestrate the worker and update the store. No business logic here. */
import { getState, navigate, setState, toast } from './store'
import { callEngine, EngineError } from '@/workers/client'
import type { StageId, ErrorCode } from '@/workers/protocol'
import type { AnalysisSettings, Mapping } from '@/types/core'
import { DEMOS, type DemoId } from '@/demo/generator'
import { setFormatContext } from '@/lib/format'
import { trNow } from '@/i18n/useT'

export const STAGES: StageId[] = ['read', 'parse', 'detect', 'clean', 'metrics', 'patterns', 'dashboard']
export const ACCEPTED_EXT = ['xlsx', 'xlsm', 'xls', 'csv', 'tsv', 'txt']
export const WARN_SIZE = 40 * 1024 * 1024
export const MAX_SIZE = 200 * 1024 * 1024

function startProcessing(title: string, stage: StageId = 'read') {
  setState({ processing: { active: true, title, stage, stagePct: 0, done: [], startedAt: performance.now(), error: null } })
}

function onProgress(stage: StageId, pct: number, detail?: string) {
  const p = getState().processing
  if (!p) return
  const idx = STAGES.indexOf(stage)
  const done = STAGES.slice(0, Math.max(0, idx))
  setState({ processing: { ...p, stage, stagePct: pct, done, detail: detail ?? p.detail } })
}

function finishProcessing() {
  const p = getState().processing
  if (p) setState({ processing: { ...p, stage: 'dashboard', stagePct: 1, done: [...STAGES], active: false } })
}

function failProcessing(e: unknown) {
  const code: ErrorCode = e instanceof EngineError ? e.code : 'internal'
  const p = getState().processing
  setState({ processing: p ? { ...p, active: false, error: { code, detail: e instanceof EngineError ? e.detail : String(e) } } : null })
}

export function applyFormatContext() {
  const s = getState()
  const cur = s.settings.currencyOverride === 'none' ? null : s.settings.currencyOverride ?? (s.analysis ? s.analysis.currency : 'VND')
  setFormatContext(s.lang, cur)
}

export async function loadDemo(id: DemoId) {
  const meta = DEMOS.find((d) => d.id === id)!
  const name = meta.name[getState().lang]
  startProcessing(name, 'read')
  setState({ draft: null, showMapping: false })
  navigate('import')
  try {
    const res = await callEngine<'built'>({ type: 'demo', demoId: id, name, settings: { ...getState().settings, domainOverride: null, granularity: 'auto' } }, onProgress)
    setState({ dataset: res.dataset, fields: res.fields, mapping: res.mapping, analysis: res.analysis, settings: { ...getState().settings, domainOverride: null, granularity: 'auto' } })
    applyFormatContext()
    finishProcessing()
    setTimeout(() => {
      setState({ processing: null })
      navigate('overview')
    }, 450)
  } catch (e) {
    failProcessing(e)
  }
}

export function validateFile(file: File): { ok: true; warn?: string } | { ok: false; code: ErrorCode } {
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  if (!ACCEPTED_EXT.includes(ext)) return { ok: false, code: 'unsupported' }
  // MIME is advisory (browsers often report "" for CSV/XLSX); reject only clearly wrong types
  if (file.type && /^(image|video|audio)\//.test(file.type)) return { ok: false, code: 'unsupported' }
  if (file.size === 0) return { ok: false, code: 'empty' }
  if (file.size > MAX_SIZE) return { ok: false, code: 'too_large' }
  if (file.size > WARN_SIZE) return { ok: true, warn: 'large' }
  return { ok: true }
}

export async function importFile(file: File) {
  const v = validateFile(file)
  if (!v.ok) {
    setState({ processing: { active: false, title: file.name, stage: 'read', stagePct: 0, done: [], startedAt: performance.now(), error: { code: v.code } } })
    return
  }
  if (v.warn) toast(trNow('File lớn — quá trình xử lý có thể mất thêm thời gian. Giao diện vẫn hoạt động bình thường.', 'Large file — processing may take longer. The interface stays responsive.'), 'warning')
  startProcessing(file.name, 'read')
  setState({ draft: null, showMapping: false })
  try {
    const buffer = await file.arrayBuffer()
    const res = await callEngine<'parsed'>({ type: 'parse', buffer, fileName: file.name, size: file.size }, onProgress, [buffer])
    const first = res.sheets.find((s) => s.rowCount > 0) ?? res.sheets[0]
    setState({ processing: null, draft: { fileName: file.name, size: file.size, kind: res.kind, sheets: res.sheets, sheet: first.name, headerRow: first.headerGuess } })
  } catch (e) {
    failProcessing(e)
  }
}

export async function buildFromDraft() {
  const d = getState().draft
  if (!d) return
  startProcessing(d.fileName, 'detect')
  try {
    const name = d.sheets.length > 1 ? `${d.fileName} · ${d.sheet}` : d.fileName
    const settings: AnalysisSettings = { ...getState().settings, domainOverride: null, granularity: 'auto' }
    const res = await callEngine<'built'>({ type: 'build', sheet: d.sheet, headerRow: d.headerRow, name, settings }, onProgress)
    setState({ dataset: res.dataset, fields: res.fields, mapping: res.mapping, analysis: res.analysis, settings })
    applyFormatContext()
    finishProcessing()
    setTimeout(() => setState({ processing: null, showMapping: true, draft: null }), 350)
  } catch (e) {
    failProcessing(e)
  }
}

let reanalyzeSeq = 0
export async function reanalyze(patch: { mapping?: Mapping; settings?: Partial<AnalysisSettings> }, quiet = false) {
  const s = getState()
  if (!s.dataset) return
  const mapping = patch.mapping ?? s.mapping
  const settings = { ...s.settings, ...(patch.settings ?? {}) }
  setState({ mapping, settings })
  const my = ++reanalyzeSeq
  try {
    const res = await callEngine<'analyzed'>({ type: 'analyze', mapping, settings })
    if (my !== reanalyzeSeq) return
    setState({ analysis: res.analysis })
    applyFormatContext()
    if (!quiet) toast(trNow('Đã cập nhật phân tích', 'Analysis updated'), 'success')
  } catch (e) {
    toast(trNow('Không thể cập nhật phân tích', 'Could not update analysis') + (e instanceof EngineError ? ` (${e.code})` : ''), 'error')
  }
}

export function closeDataset() {
  setState({ dataset: null, analysis: null, fields: [], mapping: {}, draft: null, showMapping: false, drawer: null, processing: null })
  navigate('overview')
}
