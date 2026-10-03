import { describe, expect, it } from 'vitest'
import { load, monthlySales } from './helpers'
import { RULE_LIBRARY } from '@/intelligence/rules/ruleLibrary'
import { runRules } from '@/intelligence/rules/ruleEngine'
import { INSIGHT_TEMPLATES } from '@/intelligence/insights/templates'
import { RECOMMENDATIONS } from '@/intelligence/insights/recommendations'
import { insightText, insightTitle } from '@/intelligence/insights/insightEngine'

describe('business rule library', () => {
  it('has 120+ rules, unique ids, valid templates & recommendations', () => {
    expect(RULE_LIBRARY.length).toBeGreaterThanOrEqual(120)
    const ids = new Set(RULE_LIBRARY.map((r) => r.id))
    expect(ids.size).toBe(RULE_LIBRARY.length)
    const tpl = new Set(INSIGHT_TEMPLATES.map((t) => t.id))
    for (const r of RULE_LIBRARY) {
      expect(tpl.has(r.template), `${r.id} template ${r.template}`).toBe(true)
      for (const rec of r.recommendations) expect(RECOMMENDATIONS[rec], `${r.id} rec ${rec}`).toBeTruthy()
      expect(r.requires.length).toBeGreaterThan(0)
      expect(r.condition.length).toBeGreaterThan(3)
    }
    expect(INSIGHT_TEMPLATES.length).toBeGreaterThanOrEqual(60)
    expect(Object.keys(RECOMMENDATIONS).length).toBeGreaterThanOrEqual(30)
    expect(new Set(RULE_LIBRARY.map((r) => r.domain)).size).toBeGreaterThanOrEqual(9)
  })
  it('cost pressure fires when revenue falls and cost rises', () => {
    const r = runRules({ 'g.revenue': -0.142, 'g.cost': 0.078 }, {}, { period: null, measure: null })
    const hit = r.hits.find((h) => h.ruleId === 'GEN-001')!
    expect(hit.severity).toBe('critical')
    const text = insightText({ templateId: hit.templateId, params: hit.params }, 'vi')
    expect(text).toBe('Doanh thu giảm 14,2% trong khi chi phí tăng 7,8%, tạo áp lực đáng kể lên hiệu quả kinh doanh.')
    expect(r.hits.find((h) => h.ruleId === 'GEN-002')).toBeUndefined()
  })
  it('customer concentration > 40% is flagged with evidence', () => {
    const r = runRules({ 'seg.customer.top_share': 0.46, 'seg.customer.count': 30, 'seg.customer.top5_share': 0.8 }, { 'seg.customer.top': 'Client A' }, { period: null, measure: { vi: 'Doanh thu', en: 'Revenue' } })
    const hit = r.hits.find((h) => h.ruleId === 'CUS-001')!
    expect(hit).toBeTruthy()
    expect(insightTitle(hit, 'en')).toContain('customer')
    expect(insightText(hit, 'en')).toContain('Client A')
    expect(hit.evidence.length).toBeGreaterThan(0)
    expect(r.hits.find((h) => h.ruleId === 'CUS-002')).toBeTruthy()
  })
  it('does not fire when facts are missing', () => {
    const r = runRules({}, {}, { period: null, measure: null })
    expect(r.hits.length).toBe(0)
    expect(r.evaluated).toBe(0)
  })
  it('end-to-end: revenue drop & cost increase → critical insight with numbers', () => {
    const a = load(monthlySales({ lastMonthRevenueFactor: 0.8, lastMonthCostFactor: 1.5 })).analysis()
    const i = a.insights.find((x) => x.ruleId === 'GEN-001')
    expect(i).toBeTruthy()
    expect(insightText(i!, 'vi')).toMatch(/Doanh thu giảm \d/)
    for (const ins of a.insights) {
      expect(insightText(ins, 'vi')).not.toMatch(/\{\w+\}/)
      expect(insightTitle(ins, 'en')).not.toMatch(/\{\w+\}/)
    }
  })
})
