/** Dataset-aware clickable query suggestions (Vietnamese + English). */
import type { Lang, Role } from '@/types/core'
import type { QuerySchema } from './parser'
import { ROLE_META } from '../dictionaries/roles'
import { METRICS } from './lexicon'

export function buildSuggestions(schema: QuerySchema, lang: Lang, max = 10): string[] {
  const has = (r: Role) => schema.available.has(r)
  const main = METRICS.find((m) => m.id === schema.mainMetric) ?? METRICS.find((m) => m.id === 'transactions')!
  const mv = main.label[lang].toLowerCase()
  const out: string[] = []
  const dimLabel = (r: Role) => ROLE_META[r].label[lang].toLowerCase()
  const firstDim = (['branch', 'region', 'department', 'channel', 'line', 'category'] as Role[]).find(has)
  const prodDim = (['product', 'campaign', 'machine', 'category', 'position'] as Role[]).find(has)
  if (lang === 'vi') {
    out.push(`Tổng ${mv}`)
    if (schema.anchor !== null) out.push(`${main.label.vi} theo tháng`)
    if (prodDim) out.push(`Top 5 ${dimLabel(prodDim)} ${mv} cao nhất`)
    if (firstDim) out.push(`${ROLE_META[firstDim].label.vi} nào có ${mv} cao nhất`)
    if (has('customer')) out.push(`5 khách hàng lớn nhất`)
    if (schema.anchor !== null) out.push(`Tăng trưởng ${mv} tháng này`)
    out.push('Có gì bất thường')
    if (has('product') || has('customer')) out.push(`20% ${has('product') ? 'sản phẩm' : 'khách hàng'} tạo bao nhiêu ${mv}`)
    if (firstDim && schema.anchor !== null) out.push(`${ROLE_META[firstDim].label.vi} nào giảm mạnh nhất`)
    if (has('salesperson')) out.push('Top nhân viên sale')
    if (has('profit')) out.push('Lợi nhuận trung bình')
    if (has('cost')) out.push('Chi phí lớn nhất nằm ở đâu')
    if (schema.anchor !== null) out.push(`Tháng nào ${mv} thấp nhất`)
    const cmp = compareValues(schema)
    if (cmp) out.push(`So sánh ${cmp[0]} với ${cmp[1]}`)
    if (schema.anchor !== null) out.push(`Dự báo ${mv} kỳ tới`)
  } else {
    out.push(`Total ${mv}`)
    if (schema.anchor !== null) out.push(`${main.label.en} by month`)
    if (prodDim) out.push(`Top 5 ${dimLabel(prodDim)} by ${mv}`)
    if (firstDim) out.push(`Which ${dimLabel(firstDim)} has the highest ${mv}`)
    if (has('customer')) out.push('Top 5 customers')
    if (schema.anchor !== null) out.push(`${main.label.en} growth this month`)
    out.push('Any anomalies')
    if (has('product') || has('customer')) out.push(`Pareto 80/20 ${has('product') ? 'products' : 'customers'}`)
    if (firstDim && schema.anchor !== null) out.push(`Which ${dimLabel(firstDim)} declined the most`)
    if (has('profit')) out.push('Average profit')
    if (schema.anchor !== null) out.push(`Which month has the lowest ${mv}`)
    const cmp = compareValues(schema)
    if (cmp) out.push(`Compare ${cmp[0]} vs ${cmp[1]}`)
    if (schema.anchor !== null) out.push(`Forecast ${mv} next period`)
  }
  return out.slice(0, max)
}

function compareValues(schema: QuerySchema): [string, string] | null {
  for (const r of ['region', 'branch', 'channel', 'department', 'line'] as Role[]) {
    const vals = schema.valueIndex.filter((v) => v.role === r)
    if (vals.length >= 2) return [vals[0].value, vals[1].value]
  }
  return null
}
