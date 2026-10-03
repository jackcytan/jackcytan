import type { AnalysisSettings, Dataset, FieldMatch, Mapping } from '@/types/core'
import type { Analysis } from '@/types/analysis'
import type { DemoId } from '@/demo/generator'

export type StageId = 'read' | 'parse' | 'detect' | 'clean' | 'metrics' | 'patterns' | 'dashboard'

export interface SheetInfo {
  name: string
  rowCount: number
  colCount: number
  preview: (string | null)[][]
  headerGuess: number
}

export type WorkerRequest =
  | { type: 'parse'; id: number; buffer: ArrayBuffer; fileName: string; size: number }
  | { type: 'build'; id: number; sheet: string; headerRow: number; name: string; settings: AnalysisSettings }
  | { type: 'analyze'; id: number; mapping: Mapping; settings: AnalysisSettings }
  | { type: 'demo'; id: number; demoId: DemoId; name: string; settings: AnalysisSettings }

export type WorkerResponse =
  | { type: 'progress'; id: number; stage: StageId; pct: number; detail?: string }
  | { type: 'parsed'; id: number; sheets: SheetInfo[]; kind: 'xlsx' | 'csv' }
  | { type: 'built'; id: number; dataset: Dataset; fields: FieldMatch[]; mapping: Mapping; analysis: Analysis }
  | { type: 'analyzed'; id: number; analysis: Analysis }
  | { type: 'error'; id: number; code: ErrorCode; detail?: string }

export type ErrorCode = 'corrupt' | 'empty' | 'unsupported' | 'no_header' | 'too_large' | 'no_data' | 'password' | 'single_column' | 'internal'
