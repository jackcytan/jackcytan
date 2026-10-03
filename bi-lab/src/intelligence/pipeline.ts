/** Convenience pipeline used by the worker and tests: rows → dataset → semantic mapping → analysis. */
import type { AnalysisSettings, Dataset, FieldMatch, Mapping } from '@/types/core'
import type { Analysis } from '@/types/analysis'
import { buildDataset, guessHeaderRow, type BuildOptions, type Cell, type ProgressFn } from './profiling/profiler'
import { detectFields, mappingFromMatches } from './semantic/detect'
import { analyze, DEFAULT_SETTINGS } from './analysis/analyze'

export interface PipelineResult {
  dataset: Dataset
  fields: FieldMatch[]
  mapping: Mapping
  analysis: Analysis
}

export function runPipeline(rows: Cell[][], opts: BuildOptions & { headerRow?: number; settings?: AnalysisSettings }, onProgress?: ProgressFn): PipelineResult {
  const headerRow = opts.headerRow ?? guessHeaderRow(rows)
  const dataset = buildDataset(rows, headerRow, { ...opts, onProgress })
  const fields = detectFields(dataset)
  const mapping = mappingFromMatches(fields)
  const analysis = analyze(dataset, mapping, opts.settings ?? DEFAULT_SETTINGS, onProgress)
  return { dataset, fields, mapping, analysis }
}
