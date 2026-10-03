import { describe, expect, it } from 'vitest'
import { generateDemo } from '@/demo/generator'
import { runPipeline } from '@/intelligence/pipeline'
import { buildQuerySchema, parseQuery } from '@/intelligence/query/parser'
import { executeQuery } from '@/intelligence/query/executor'
import type { QueryOp } from '@/intelligence/query/lexicon'

const sales = runPipeline(generateDemo('sales'), { name: 'sales', source: 'demo' })
const a = sales.analysis
const schema = buildQuerySchema(sales.dataset, a.roles, a.time!.max, a.time!.granularity, 'revenue')
const ask = (q: string) => {
  const pq = parseQuery(q, schema)
  return { pq, res: executeQuery(pq, sales.dataset, a.roles, a, schema) }
}

describe('Ask Your Data — questions from the brief', () => {
  const cases: [string, QueryOp, Partial<{ metric: string; dim: string; filter: string; time: boolean; top: number }>][] = [
    ['doanh thu bao nhiêu', 'SUM', { metric: 'revenue' }],
    ['tổng doanh thu', 'SUM', { metric: 'revenue' }],
    ['doanh thu tháng này', 'SUM', { time: true }],
    ['doanh thu tháng trước', 'SUM', { time: true }],
    ['doanh thu theo tháng', 'TREND', {}],
    ['doanh thu theo khu vực', 'GROUP_BY', { dim: 'region' }],
    ['top 10 sản phẩm', 'TOP_N', { dim: 'product', top: 10 }],
    ['5 khách hàng lớn nhất', 'TOP_N', { dim: 'customer', top: 5 }],
    ['khu vực nào bán tốt nhất', 'TOP_N', { dim: 'region', top: 1 }],
    ['tháng nào thấp nhất', 'MIN', {}],
    ['chi phí lớn nhất nằm ở đâu', 'TOP_N', { metric: 'cost' }],
    ['lợi nhuận trung bình', 'AVERAGE', { metric: 'profit' }],
    ['doanh thu HCM', 'SUM', { filter: 'region' }],
    ['doanh thu của sản phẩm A', 'SUM', { filter: 'product' }],
    ['so sánh Miền Bắc với Miền Nam', 'COMPARE', {}],
    ['tăng trưởng tháng này', 'GROWTH', {}],
    ['có gì bất thường', 'ANOMALY', {}],
    ['khách hàng nào chiếm nhiều doanh thu nhất', 'SHARE', { dim: 'customer' }],
    ['20% sản phẩm tạo bao nhiêu doanh thu', 'PARETO', { dim: 'product' }],
    ['top nhân viên sale', 'TOP_N', { dim: 'salesperson' }],
    ['khu vực nào giảm mạnh nhất', 'GROWTH', { dim: 'region' }],
    ['ngày nào doanh thu bất thường', 'ANOMALY', {}],
    ['Top 5 sản phẩm doanh thu cao nhất', 'TOP_N', { dim: 'product', top: 5 }],
    ['doanh thu thang nay', 'SUM', { time: true }],
    ['revenue by region', 'GROUP_BY', { dim: 'region' }],
    ['top 3 customers by revenue', 'TOP_N', { dim: 'customer', top: 3 }],
    ['average profit', 'AVERAGE', { metric: 'profit' }],
    ['revenue last month', 'SUM', { time: true }],
    ['biên lợi nhuận theo khu vực', 'GROUP_BY', { metric: 'margin', dim: 'region' }],
    ['dự báo doanh thu', 'FORECAST', {}],
    ['tương quan số lượng và doanh thu', 'CORRELATION', {}],
    ['số đơn hàng theo tháng', 'TREND', { metric: 'transactions' }],
    ['bao nhiêu khách hàng', 'COUNT', { metric: 'customers' }],
  ]
  for (const [q, op, exp] of cases) {
    it(q, () => {
      const { pq, res } = ask(q)
      expect(pq.op).toBe(op)
      if (exp.metric) expect(pq.metric?.id).toBe(exp.metric)
      if (exp.dim) expect(pq.dimension).toBe(exp.dim)
      if (exp.filter) expect(pq.filters[0]?.role).toBe(exp.filter)
      if (exp.time) expect(pq.time).not.toBeNull()
      if (exp.top) expect(pq.topN).toBe(exp.top)
      expect(res.status).toBe('ok')
      expect(res.answer.vi.length).toBeGreaterThan(10)
    })
  }
  it('refuses to guess on unrelated text', () => {
    for (const q of ['xin chào bạn', 'thời tiết hôm nay', 'hello world', 'asdf qwerty']) {
      const { res } = ask(q)
      expect(res.status, q).toBe('unknown')
    }
  })
  it('answer numbers match the data', () => {
    const { res } = ask('tổng doanh thu')
    expect(res.highlights[0].value).toBeCloseTo(a.kpis.find((k) => k.id === 'revenue')!.value, 3)
  })
})

describe('Ask Your Data — composable combinations (150+)', () => {
  const metricsVi: [string, string][] = [['doanh thu', 'revenue'], ['chi phí', 'cost'], ['lợi nhuận', 'profit'], ['số lượng', 'quantity'], ['số đơn hàng', 'transactions']]
  const metricsEn: [string, string][] = [['revenue', 'revenue'], ['cost', 'cost'], ['profit', 'profit'], ['quantity', 'quantity']]
  const dims: [string, string, string][] = [['khu vực', 'region', 'region'], ['sản phẩm', 'product', 'product'], ['khách hàng', 'customer', 'customer'], ['nhân viên kinh doanh', 'salesperson', 'sales rep']]
  const combos: { q: string; op: QueryOp; metric: string; dim?: string }[] = []
  for (const [m, mid] of metricsVi) {
    combos.push({ q: `tổng ${m}`, op: mid === 'transactions' ? 'COUNT' : 'SUM', metric: mid })
    combos.push({ q: `${m} theo tháng`, op: 'TREND', metric: mid })
    combos.push({ q: `${m} theo quý`, op: 'TREND', metric: mid })
    combos.push({ q: `tăng trưởng ${m} tháng này`, op: 'GROWTH', metric: mid })
    combos.push({ q: `${m} tháng trước`, op: mid === 'transactions' ? 'COUNT' : 'SUM', metric: mid })
    for (const [d, did] of dims) {
      combos.push({ q: `${m} theo ${d}`, op: 'GROUP_BY', metric: mid, dim: did })
      combos.push({ q: `top 5 ${d} theo ${m}`, op: 'TOP_N', metric: mid, dim: did })
      combos.push({ q: `${d} nào có ${m} thấp nhất`, op: 'BOTTOM_N', metric: mid, dim: did })
      combos.push({ q: `${d} nào ${m} giảm mạnh nhất`, op: 'GROWTH', metric: mid, dim: did })
      combos.push({ q: `xếp hạng ${d} theo ${m}`, op: 'RANK', metric: mid, dim: did })
    }
  }
  for (const [m, mid] of metricsEn) {
    combos.push({ q: `total ${m}`, op: 'SUM', metric: mid })
    combos.push({ q: `${m} by month`, op: 'TREND', metric: mid })
    for (const [, did, de] of dims) {
      combos.push({ q: `${m} by ${de}`, op: 'GROUP_BY', metric: mid, dim: did })
      combos.push({ q: `top 10 ${de} by ${m}`, op: 'TOP_N', metric: mid, dim: did })
    }
  }
  it(`covers ${combos.length} combinations`, () => {
    expect(combos.length).toBeGreaterThanOrEqual(150)
    const failures: string[] = []
    for (const c of combos) {
      const { pq, res } = ask(c.q)
      if (pq.op !== c.op || pq.metric?.id !== c.metric || (c.dim && pq.dimension !== c.dim) || res.status !== 'ok') failures.push(`${c.q} → ${pq.op}/${pq.metric?.id}/${pq.dimension}/${res.status}`)
    }
    expect(failures).toEqual([])
  })
})
