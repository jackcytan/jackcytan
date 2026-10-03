/** Real timings (no fake benchmarks) for the full local pipeline on synthetic datasets. Run: npm run bench */
import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { generateSynthetic } from '@/demo/generator'
import { buildDataset } from '@/intelligence/profiling/profiler'
import { detectFields, mappingFromMatches } from '@/intelligence/semantic/detect'
import { analyze, DEFAULT_SETTINGS } from '@/intelligence/analysis/analyze'
import { buildQuerySchema, parseQuery } from '@/intelligence/query/parser'
import { executeQuery } from '@/intelligence/query/executor'

const ms = (t: number) => `${(performance.now() - t).toFixed(0)} ms`

describe('performance', () => {
  for (const n of [1_000, 10_000, 50_000, 100_000]) {
    it(`${n.toLocaleString()} rows`, () => {
      const rows = generateSynthetic(n)
      // CSV round-trip through Papa Parse (as for an uploaded .csv)
      const csv = Papa.unparse(rows as string[][])
      let t = performance.now()
      const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: 'greedy' }).data
      const tParse = ms(t)
      t = performance.now()
      const ds = buildDataset(parsed, 0, { name: 'synthetic', source: 'upload' })
      const tProfile = ms(t)
      t = performance.now()
      const mapping = mappingFromMatches(detectFields(ds))
      const tSemantic = ms(t)
      t = performance.now()
      const a = analyze(ds, mapping, DEFAULT_SETTINGS)
      const tAnalyze = ms(t)
      const schema = buildQuerySchema(ds, a.roles, a.time!.max, a.time!.granularity, 'revenue')
      t = performance.now()
      for (const q of ['tổng doanh thu', 'top 10 sản phẩm', 'doanh thu theo tháng', 'khu vực nào giảm mạnh nhất', 'có gì bất thường', '20% khách hàng tạo bao nhiêu doanh thu']) {
        const r = executeQuery(parseQuery(q, schema), ds, a.roles, a, schema)
        expect(r.status).toBe('ok')
      }
      const tQuery = ms(t)
      console.log(`[perf] ${n.toLocaleString().padStart(7)} rows | csv parse ${tParse} | profile ${tProfile} | semantic ${tSemantic} | analyze ${tAnalyze} (KPIs ${a.kpis.length}, rules ${a.stats.rulesEvaluated}, anomalies ${a.anomalies.anomalies.length}) | 6 queries ${tQuery}`)
      expect(ds.rowCount).toBe(n)
      expect(a.kpis.find((k) => k.id === 'revenue')).toBeTruthy()
    })
  }
})
