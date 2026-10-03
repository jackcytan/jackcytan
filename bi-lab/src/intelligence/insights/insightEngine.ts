/** INSIGHT ENGINE — turns rule hits into a ranked, de-duplicated list of evidence-backed insights. */
import type { Lang } from '@/types/core'
import type { Insight, RuleHit } from '@/types/analysis'
import { TEMPLATE_BY_ID } from './templates'
import { RECOMMENDATIONS } from './recommendations'
import { renderTemplate } from '@/lib/format'

const POSITIVE = new Set(['positive', 'opportunity'])

export function buildInsights(hits: RuleHit[], max = 24): Insight[] {
  const sorted = [...hits].sort((a, b) => b.score - a.score)
  const perMetric = new Map<string, number>()
  const out: Insight[] = []
  for (const h of sorted) {
    const tone = POSITIVE.has(h.severity) ? '+' : '-'
    const key = `${h.metric}${tone}`
    const n = perMetric.get(key) ?? 0
    if (n >= 2) continue
    perMetric.set(key, n + 1)
    out.push({ ...h, id: `ins_${h.ruleId}`, source: 'rule' })
    if (out.length >= max) break
  }
  return out
}

export function insightTitle(i: Pick<Insight, 'templateId' | 'params'>, lang: Lang): string {
  const t = TEMPLATE_BY_ID.get(i.templateId)
  return t ? capitalize(renderTemplate(t.title[lang], i.params, lang)) : i.templateId
}

export function insightText(i: Pick<Insight, 'templateId' | 'params'>, lang: Lang): string {
  const t = TEMPLATE_BY_ID.get(i.templateId)
  return t ? capitalize(renderTemplate(t.text[lang], i.params, lang)) : ''
}

export function recommendationText(id: string, params: Insight['params'], lang: Lang): string {
  const r = RECOMMENDATIONS[id]
  if (!r) return ''
  return renderTemplate(r[lang], { dim: params.dim ?? (lang === 'vi' ? 'nhóm' : 'group') }, lang)
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
