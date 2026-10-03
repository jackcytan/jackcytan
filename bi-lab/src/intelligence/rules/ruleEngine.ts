/** RULE ENGINE — evaluates the rule library on facts and returns evidence-backed hits. */
import type { L10n } from '@/types/core'
import type { Param, RuleHit, Severity } from '@/types/analysis'
import { RULE_LIBRARY, MEASURE_PARAM, PERIOD_PARAM, type Facts, type Labels, type RuleDef } from './ruleLibrary'
import { evidenceFor } from './factMeta'

export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 6, warning: 5, watch: 3.5, opportunity: 3, positive: 2.5, info: 1 }

export interface RuleRunResult {
  hits: RuleHit[]
  evaluated: number
}

export function runRules(facts: Facts, labels: Labels, ctx: { period: L10n | null; measure: L10n | null }, rules: readonly RuleDef[] = RULE_LIBRARY): RuleRunResult {
  const hits: RuleHit[] = []
  let evaluated = 0
  const fired = new Set<string>()
  const suppressed = new Set<string>()
  for (const r of rules) {
    if (!r.requires.every((k) => k in facts && Number.isFinite(facts[k]))) continue
    evaluated++
    let ok: boolean
    try {
      ok = r.when(facts, labels)
    } catch {
      ok = false
    }
    if (!ok) continue
    fired.add(r.id)
    r.suppresses?.forEach((s) => suppressed.add(s))
    const raw = r.params(facts, labels)
    const params: Record<string, Param> = {}
    for (const [key, v] of Object.entries(raw)) {
      if (v === PERIOD_PARAM) params[key] = ctx.period ? { t: ctx.period } : { t: { vi: 'gần nhất', en: 'the latest period' } }
      else if (v === MEASURE_PARAM) params[key] = ctx.measure ? { t: { vi: ctx.measure.vi.toLowerCase(), en: ctx.measure.en.toLowerCase() } } : { t: { vi: 'giá trị', en: 'value' } }
      else params[key] = v
    }
    const evidence = evidenceFor([...r.requires, ...(r.evidence ?? [])], facts, labels)
    const mag = r.magnitude ? r.magnitude(facts) : 0.5
    hits.push({
      ruleId: r.id,
      domain: r.domain,
      severity: r.severity,
      templateId: r.template,
      params,
      evidence,
      metric: r.metric,
      current: r.current?.(facts),
      comparison: r.comparison?.(facts),
      recommendationIds: r.recommendations,
      focusPage: r.focus,
      score: SEVERITY_WEIGHT[r.severity] + Math.min(1, Math.max(0, Number.isFinite(mag) ? mag : 0)),
    })
  }
  return { hits: hits.filter((h) => !suppressed.has(h.ruleId)), evaluated }
}

export function ruleCount(): number {
  return RULE_LIBRARY.length
}
