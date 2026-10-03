import { buildDataset, type Cell } from '@/intelligence/profiling/profiler'
import { detectFields, mappingFromMatches } from '@/intelligence/semantic/detect'
import { analyze, DEFAULT_SETTINGS } from '@/intelligence/analysis/analyze'
import { Ctx, primaryRoles } from '@/intelligence/analysis/context'

export function load(rows: Cell[][]) {
  const ds = buildDataset(rows, 0, { name: 'test', source: 'upload' })
  const fields = detectFields(ds)
  const mapping = mappingFromMatches(fields)
  const roles = primaryRoles(ds, mapping)
  return { ds, fields, mapping, roles, ctx: new Ctx(ds, roles), analysis: () => analyze(ds, mapping, DEFAULT_SETTINGS) }
}

/** 12 months × 3 regions × 2 customers, deterministic. */
export function monthlySales(opts: { lastMonthRevenueFactor?: number; lastMonthCostFactor?: number } = {}): Cell[][] {
  const rows: Cell[][] = [['Date', 'Region', 'Customer', 'Product', 'Revenue', 'Cost', 'Quantity']]
  for (let m = 0; m < 12; m++) {
    for (const [ri, region] of ['North', 'South', 'Central'].entries()) {
      for (const [ci, cust] of ['Alpha', 'Beta'].entries()) {
        let rev = 1000 + ri * 200 + ci * 100 + m * 10
        let cost = rev * 0.6
        if (m === 11) {
          rev *= opts.lastMonthRevenueFactor ?? 1
          cost *= opts.lastMonthCostFactor ?? 1
        }
        rows.push([`2025-${String(m + 1).padStart(2, '0')}-15`, region, cust, ci ? 'P2' : 'P1', rev, cost, 10])
      }
    }
  }
  return rows
}
