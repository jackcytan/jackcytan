import { describe, expect, it } from 'vitest'
import { DEMOS, generateDemo } from '@/demo/generator'
import { runPipeline } from '@/intelligence/pipeline'
import { insightText, insightTitle, recommendationText } from '@/intelligence/insights/insightEngine'

const expected: Record<string, string> = { executive: 'sales', sales: 'sales', retail: 'retail', finance: 'finance', hr: 'hr', manufacturing: 'manufacturing', operations: 'operations', marketing: 'marketing' }

describe('demo datasets through the full pipeline', () => {
  for (const d of DEMOS) {
    it(d.id, () => {
      const rows = generateDemo(d.id)
      expect(JSON.stringify(rows.slice(0, 50))).toBe(JSON.stringify(generateDemo(d.id).slice(0, 50)))
      const r = runPipeline(rows, { name: d.id, source: 'demo' })
      const a = r.analysis
      expect(r.dataset.rowCount).toBeGreaterThanOrEqual(500)
      expect(r.dataset.rowCount).toBeLessThanOrEqual(3100)
      expect(a.domain.domain).toBe(expected[d.id])
      expect(a.kpis.length).toBeGreaterThanOrEqual(6)
      expect(a.charts.length).toBeGreaterThanOrEqual(3)
      expect(a.insights.length).toBeGreaterThan(0)
      expect(a.health.components.length).toBeGreaterThanOrEqual(3)
      expect(a.health.score).toBeGreaterThan(0)
      for (const i of a.insights) {
        for (const lang of ['vi', 'en'] as const) {
          expect(insightTitle(i, lang)).not.toMatch(/\{\w+\}|NaN|undefined|__/)
          expect(insightText(i, lang)).not.toMatch(/\{\w+\}|NaN|undefined|__/)
          for (const rec of i.recommendationIds) expect(recommendationText(rec, i.params, lang)).not.toMatch(/\{\w+\}/)
        }
      }
    })
  }
})
