/** Core shared types for the Local Business Intelligence Engine. */

export type Lang = 'vi' | 'en'
export interface L10n {
  vi: string
  en: string
}

export type Domain =
  | 'sales'
  | 'retail'
  | 'finance'
  | 'marketing'
  | 'hr'
  | 'manufacturing'
  | 'operations'
  | 'inventory'
  | 'customer_service'
  | 'generic'

export type ColumnType = 'number' | 'currency' | 'percent' | 'date' | 'text' | 'category' | 'boolean' | 'id' | 'empty'

export type Role =
  // time
  | 'date'
  | 'hire_date'
  // measures
  | 'revenue'
  | 'cost'
  | 'profit'
  | 'quantity'
  | 'price'
  | 'discount'
  | 'target'
  | 'budget'
  | 'actual'
  | 'expense'
  | 'inventory'
  | 'defect'
  | 'downtime'
  | 'output'
  | 'planned_output'
  | 'salary'
  | 'attendance'
  | 'absence'
  | 'performance'
  | 'lead'
  | 'conversion'
  | 'spend'
  | 'impressions'
  | 'clicks'
  | 'orders'
  | 'returns'
  | 'response_time'
  | 'satisfaction'
  | 'duration'
  | 'hours'
  | 'margin'
  // dimensions
  | 'customer'
  | 'product'
  | 'category'
  | 'region'
  | 'branch'
  | 'salesperson'
  | 'status'
  | 'department'
  | 'channel'
  | 'campaign'
  | 'machine'
  | 'line'
  | 'shift'
  | 'employee'
  | 'position'
  | 'supplier'
  | 'warehouse'
  | 'ticket'
  | 'order_id'
  | 'other'

export type RoleKind = 'date' | 'measure' | 'dimension' | 'id' | 'other'

export type NumberFormat = 'currency' | 'number' | 'percent' | 'ratio' | 'minutes' | 'hours' | 'days' | 'score' | 'integer' | 'pp'

export interface ColumnProfile {
  key: string
  index: number
  name: string
  type: ColumnType
  storage: 'num' | 'str'
  count: number
  missing: number
  missingPct: number
  unique: number
  min?: number
  max?: number
  mean?: number
  median?: number
  std?: number
  sum?: number
  p25?: number
  p75?: number
  topValues?: { value: string; count: number }[]
  needsReview: number
  reviewSamples: string[]
  invalid: number
  negativeCount: number
  zeroCount: number
  outlierCount: number
  currency?: 'VND' | 'USD' | null
  dateFormat?: string
  hasTime?: boolean
  sample: string[]
  /** For text columns: count of values that differ only by case/accents/whitespace */
  inconsistentVariants?: number
  whitespaceIssues?: number
  futureDates?: number
}

export interface Dataset {
  id: string
  name: string
  source: 'upload' | 'demo'
  fileName?: string
  fileSize?: number
  sheetName?: string
  rowCount: number
  columns: ColumnProfile[]
  /** numeric & date columns: NaN = missing. Dates are epoch ms (UTC) */
  num: Record<string, Float64Array>
  /** text/category columns */
  str: Record<string, (string | null)[]>
  /** original cell text for values flagged "Needs Review" (key -> rowIndex -> raw) */
  review: Record<string, Record<number, string>>
  currency: 'VND' | 'USD' | null
  duplicateRows: number
  headerRow: number
  duplicateHeaders: string[]
  createdAt: number
  warnings: string[]
}

export interface FieldMatch {
  key: string
  column: string
  role: Role
  confidence: number
  reason: string
  alternatives: { role: Role; confidence: number }[]
}

/** user-confirmed mapping column key -> role */
export type Mapping = Record<string, Role>

export interface DomainDetection {
  domain: Domain
  confidence: number
  scores: Record<Domain, number>
  matchedRoles: Role[]
}

export type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year'
export type Sensitivity = 'sensitive' | 'balanced' | 'conservative'

export interface AnalysisSettings {
  sensitivity: Sensitivity
  granularity: Granularity | 'auto'
  domainOverride: Domain | null
  currencyOverride: 'VND' | 'USD' | 'none' | null
}
