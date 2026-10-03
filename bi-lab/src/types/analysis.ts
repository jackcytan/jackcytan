import type { Domain, DomainDetection, Granularity, L10n, NumberFormat, Role, Sensitivity } from './core'

export type Severity = 'positive' | 'opportunity' | 'info' | 'watch' | 'warning' | 'critical'

/** A typed parameter for localized templates. Strings are rendered as-is (escaped by React). */
export type Param = string | { v: number; f: NumberFormat; signed?: boolean } | { t: L10n }

export interface EvidenceItem {
  label: L10n
  value: Param
  note?: L10n
}

export interface KpiResult {
  id: string
  name: L10n
  description: L10n
  formula: string
  format: NumberFormat
  domain: Domain[]
  direction: 'up' | 'down' | 'neutral'
  value: number
  current: number | null
  previous: number | null
  change: number | null
  changeKind: 'pct' | 'pp' | null
  spark: number[]
  sparkLabels: string[]
  requiredFields: { role: Role; column: string }[]
  rowsUsed: number
  priority: number
  /** value compares the latest period with the previous one (growth KPIs) */
  periodBased?: boolean
}

export interface SeriesPoint {
  label: string
  start: number
  value: number
  count: number
}

export interface TimeInfo {
  dateKey: string
  dateColumn: string
  min: number
  max: number
  spanDays: number
  granularity: Granularity
  detectedGranularity: Granularity
  periods: { label: string; start: number; end: number }[]
  partialLast: boolean
  partialFirst: boolean
  currentLabel: string | null
  previousLabel: string | null
}

export type ChartKind = 'line' | 'area' | 'bar' | 'hbar' | 'donut' | 'scatter' | 'pareto' | 'combo' | 'heatmap' | 'stacked'

export interface ChartSeries {
  name: L10n
  values: number[]
  kind?: 'line' | 'bar' | 'area' | 'scatter'
  axis?: 0 | 1
  format: NumberFormat
  tone?: 'primary' | 'secondary' | 'positive' | 'negative' | 'warning' | 'neutral' | 'muted' | 'projection'
  dashed?: boolean
}

export interface ChartSpec {
  id: string
  kind: ChartKind
  title: L10n
  subtitle?: L10n
  categories: string[]
  series: ChartSeries[]
  /** scatter: x/y pairs */
  points?: { x: number; y: number; label: string }[]
  xFormat?: NumberFormat
  yFormat?: NumberFormat
  heat?: { x: string[]; y: string[]; values: [number, number, number][]; format: NumberFormat }
  insightKey?: string
  size?: 'sm' | 'md' | 'lg'
  zoom?: boolean
}

export interface BreakdownItem {
  label: string
  value: number
  share: number
  count: number
  current?: number
  previous?: number
  change?: number | null
}

export interface Breakdown {
  dimRole: Role
  dimKey: string
  dimColumn: string
  measure: string
  measureLabel: L10n
  format: NumberFormat
  total: number
  items: BreakdownItem[]
  distinct: number
}

export interface ParetoResult {
  dimRole: Role
  dimColumn: string
  measure: string
  format: NumberFormat
  total: number
  distinct: number
  /** share of entities (0..1) that produce 80% of the measure */
  entityShareFor80: number
  top20Share: number
  items: { label: string; value: number; cumShare: number }[]
}

export interface RuleHit {
  ruleId: string
  domain: Domain | 'generic'
  severity: Severity
  templateId: string
  params: Record<string, Param>
  evidence: EvidenceItem[]
  metric: string
  current?: Param
  comparison?: Param
  recommendationIds: string[]
  focusPage?: 'dashboard' | 'anomalies' | 'health' | 'ask' | 'explorer' | 'scenario'
  score: number
}

export interface Insight extends RuleHit {
  id: string
  source: 'rule' | 'observation' | 'anomaly'
}

export interface Anomaly {
  id: string
  scope: 'series' | 'segment' | 'record'
  metric: string
  metricLabel: L10n
  label: string
  periodStart?: number
  expectedLow: number
  expectedHigh: number
  expected: number
  actual: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  method: string
  methodDetail: L10n
  format: NumberFormat
  direction: 'spike' | 'drop'
  rowsInvolved: number
}

export interface AnomalyReport {
  sensitivity: Sensitivity
  anomalies: Anomaly[]
  checksRun: number
  seriesAnalysed: number
  methods: string[]
}

export interface QualityIssue {
  checkId: string
  severity: 'info' | 'watch' | 'warning' | 'critical'
  column?: string
  affected: number
  pct: number
  message: L10n
  recommendation: L10n
}

export interface QualityReport {
  score: number
  completeness: number
  consistency: number
  uniqueness: number
  validity: number
  issues: QualityIssue[]
  checksRun: number
}

export interface HealthComponent {
  id: string
  name: L10n
  score: number
  weight: number
  status: 'good' | 'watch' | 'risk'
  explanation: L10n
  evidence: EvidenceItem[]
}

export interface HealthReport {
  score: number
  status: 'good' | 'watch' | 'risk'
  components: HealthComponent[]
  summary: L10n
}

export interface ForecastResult {
  metric: string
  metricLabel: L10n
  format: NumberFormat
  ok: boolean
  reason?: L10n
  method: string
  history: { label: string; value: number }[]
  projection: { label: string; value: number; low: number; high: number }[]
  r2: number
  slopePerPeriod: number
  quality: 'high' | 'medium' | 'low'
  qualityScore: number
  qualityNotes: L10n[]
  growthPerPeriod: number
}

export interface Correlation {
  keys: string[]
  labels: string[]
  matrix: number[][]
  pairs: { a: string; b: string; r: number; n: number; strength: L10n }[]
}

export interface FocusItem {
  id: string
  title: L10n
  detail: L10n
  severity: Severity
  page: 'dashboard' | 'anomalies' | 'health' | 'ask' | 'explorer' | 'scenario'
  query?: string
  insightId?: string
}

export interface SeriesMetric {
  measure: string
  label: L10n
  format: NumberFormat
  points: SeriesPoint[]
  movingAvg: number[]
  growth: (number | null)[]
}

export interface AnalysisStats {
  rows: number
  columns: number
  kpisCalculated: number
  kpisAvailable: number
  rulesEvaluated: number
  rulesTriggered: number
  rulesTotal: number
  anomalyChecks: number
  qualityChecks: number
  durationMs: number
}

export interface Analysis {
  datasetId: string
  domain: DomainDetection
  roles: Partial<Record<Role, string>>
  roleColumns: Partial<Record<Role, string>>
  measures: { key: string; id: string; label: L10n; format: NumberFormat; role: Role }[]
  time: TimeInfo | null
  kpis: KpiResult[]
  series: SeriesMetric[]
  breakdowns: Breakdown[]
  pareto: ParetoResult[]
  facts: Record<string, number>
  insights: Insight[]
  anomalies: AnomalyReport
  quality: QualityReport
  health: HealthReport
  charts: ChartSpec[]
  forecast: ForecastResult | null
  correlation: Correlation | null
  focus: FocusItem[]
  currency: 'VND' | 'USD' | null
  stats: AnalysisStats
  sensitivity: Sensitivity
}

export type { Granularity }
