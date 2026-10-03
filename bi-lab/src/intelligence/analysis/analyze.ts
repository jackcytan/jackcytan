/**
 * ANALYSIS ORCHESTRATOR
 * Dataset + mapping → profiling facts → KPIs → series/breakdowns → quality → anomalies → facts →
 * rules → insights → health → charts → focus items. Pure & deterministic (runs in the worker).
 */
import type { AnalysisSettings, Dataset, Mapping, Role } from '@/types/core'
import type { Analysis, FocusItem, Insight } from '@/types/analysis'
import { Ctx, periodSubsets, primaryRoles } from './context'
import { buildTimeIndex, periodLabel } from './time'
import { availableMeasures, mainMeasure, breakdownMeasure, polarityOf } from './measures'
import { computeKpis } from '../metrics/kpiEngine'
import { KPI_LIBRARY } from '../metrics/kpiLibrary'
import { buildBreakdowns, buildPareto, buildSeries, groupableDims } from './series'
import { runQualityChecks } from '../quality/qualityEngine'
import { runAnomalyEngine } from '../anomalies/anomalyEngine'
import { buildFacts } from './facts'
import { computeRatioFacts } from './ratioFacts'
import { runRules } from '../rules/ruleEngine'
import { RULE_LIBRARY } from '../rules/ruleLibrary'
import { buildInsights } from '../insights/insightEngine'
import { buildHealth } from '../scoring/healthEngine'
import { planCharts } from './chartPlanner'
import { projectSeries } from '../forecasting/forecast'
import { buildCorrelation } from './correlation'
import { detectDomain } from '../semantic/domain'
import type { ProgressFn } from '../profiling/profiler'

export const DEFAULT_SETTINGS: AnalysisSettings = { sensitivity: 'balanced', granularity: 'auto', domainOverride: null, currencyOverride: null }

export function analyze(ds: Dataset, mapping: Mapping, settings: AnalysisSettings = DEFAULT_SETTINGS, onProgress?: ProgressFn): Analysis {
  const t0 = performance.now()
  const progress = onProgress ?? (() => {})
  const roles = primaryRoles(ds, mapping)
  const ctx = new Ctx(ds, roles)
  const detection = detectDomain(Object.values(mapping) as Role[])
  const domain = settings.domainOverride ?? detection.domain
  const domainInfo = settings.domainOverride ? { ...detection, domain: settings.domainOverride, confidence: 1 } : detection

  // time
  const time = roles.date ? buildTimeIndex(ds, roles.date, settings.granularity) : null
  const subsets = time ? periodSubsets(time.rowPeriod, time.info.periods.length) : null
  const periodCtx = subsets ? subsets.map((s) => ctx.subset(s)) : null
  const ci = time ? time.info.periods.length - (time.info.partialLast ? 2 : 1) : -1
  const cur = periodCtx && ci >= 0 ? periodCtx[ci] : null
  const prev = periodCtx && ci >= 1 ? periodCtx[ci - 1] : null
  progress('metrics', 0.1)

  const measures = availableMeasures(ctx)
  const main = mainMeasure(ctx, domain, measures)
  const kpis = computeKpis({ ctx, time, periodCtx, domain })
  progress('metrics', 0.5)

  const series = time && periodCtx ? buildSeries(periodCtx, time, measures) : []
  const dims = groupableDims(ctx)
  const bMeasure = breakdownMeasure(domain, measures, main)
  const breakdowns = buildBreakdowns(ctx, dims, bMeasure, cur, prev)
  const pareto = buildPareto(ctx, bMeasure)
  progress('metrics', 1)

  const quality = runQualityChecks(ds, mapping, time)
  progress('patterns', 0.2)
  const anomalies = runAnomalyEngine({ ctx, series, breakdowns, measures, sensitivity: settings.sensitivity, granularity: time?.info.granularity ?? 'month', dateArr: roles.date ? ds.num[roles.date] : null, primary: bMeasure })
  progress('patterns', 0.5)

  const { facts, labels } = buildFacts({ kpis, series, breakdowns, pareto, quality, rows: ds.rowCount, periods: series[0]?.points.length ?? 0, currentLabel: time?.info.currentLabel ?? null, previousLabel: time?.info.previousLabel ?? null, granularity: time?.info.granularity, polarity: polarityOf(bMeasure?.role) })
  const rf = computeRatioFacts(ctx)
  Object.assign(facts, rf.facts)
  Object.assign(labels, rf.labels)
  facts['anom.count'] = anomalies.anomalies.length
  facts['anom.high'] = anomalies.anomalies.filter((a) => a.severity === 'high').length

  const periodL10n = time?.info.currentLabel ? { vi: periodLabel(time.info.currentLabel, 'vi'), en: periodLabel(time.info.currentLabel, 'en') } : null
  const ruleRun = runRules(facts, labels, { period: periodL10n, measure: bMeasure?.label ?? { vi: 'Số bản ghi', en: 'Records' } })
  const insights = buildInsights(ruleRun.hits)
  progress('patterns', 1)

  const health = buildHealth(facts, domain, main?.role ?? null)
  const charts = planCharts({ ctx, domain, time, periodCtx, series, breakdowns, pareto, main, measures })
  const mainSeries = main ? series.find((s) => s.measure === main.role) : undefined
  const forecast = mainSeries && time ? projectSeries(mainSeries, time.info.granularity) : null
  const correlation = buildCorrelation(ctx, measures)
  const focus = buildFocus(insights, anomalies.anomalies.length)
  progress('dashboard', 1)

  const roleColumns: Partial<Record<Role, string>> = {}
  for (const [r, k] of Object.entries(roles)) roleColumns[r as Role] = ds.columns.find((c) => c.key === k)?.name ?? k
  const vietnameseHeaders = ds.columns.some((c) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(c.name) || /^(doanh thu|chi phi|ngay|so luong)/i.test(c.name))
  const currency = settings.currencyOverride === 'none' ? null : settings.currencyOverride ?? ds.currency ?? (measures.some((m) => m.format === 'currency') && vietnameseHeaders ? 'VND' : null)

  return {
    datasetId: ds.id,
    domain: { ...domainInfo, domain },
    roles,
    roleColumns,
    measures: measures.map((m) => ({ key: m.key, id: m.id, label: m.label, format: m.format, role: m.role })),
    time: time?.info ?? null,
    kpis,
    series,
    breakdowns,
    pareto,
    facts,
    insights,
    anomalies,
    quality,
    health,
    charts,
    forecast,
    correlation,
    focus,
    currency,
    sensitivity: settings.sensitivity,
    stats: {
      rows: ds.rowCount,
      columns: ds.columns.length,
      kpisCalculated: kpis.length,
      kpisAvailable: KPI_LIBRARY.length,
      rulesEvaluated: ruleRun.evaluated,
      rulesTriggered: ruleRun.hits.length,
      rulesTotal: RULE_LIBRARY.length,
      anomalyChecks: anomalies.checksRun,
      qualityChecks: quality.checksRun,
      durationMs: Math.round(performance.now() - t0),
    },
  }
}

const PAGE_FOR: Record<string, FocusItem['page']> = { dashboard: 'dashboard', anomalies: 'anomalies', health: 'health' }

function buildFocus(insights: Insight[], anomalyCount: number): FocusItem[] {
  const neg = insights.filter((i) => ['critical', 'warning', 'watch'].includes(i.severity))
  const pos = insights.filter((i) => ['opportunity', 'positive'].includes(i.severity))
  const picked = [...neg.slice(0, 3), ...pos.slice(0, 2)]
  const out: FocusItem[] = picked.map((i) => ({
    id: `focus_${i.id}`,
    title: { vi: i.templateId, en: i.templateId },
    detail: { vi: '', en: '' },
    severity: i.severity,
    page: i.focusPage ?? PAGE_FOR.dashboard,
    insightId: i.id,
  }))
  if (anomalyCount > 0 && out.length < 5) out.push({ id: 'focus_anomalies', title: { vi: `Kiểm tra ${anomalyCount} điểm bất thường`, en: `Review ${anomalyCount} anomalies` }, detail: { vi: 'Các điểm lệch khỏi khoảng kỳ vọng thống kê', en: 'Points outside the statistically expected range' }, severity: 'watch', page: 'anomalies' })
  return out
}
