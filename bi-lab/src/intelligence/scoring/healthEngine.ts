/**
 * BUSINESS HEALTH SCORE
 * Components are added ONLY when the underlying KPI/fact exists. Each component maps a measured
 * value to 0–100 through a documented, monotonic scale and carries its own evidence.
 */
import type { Domain, L10n, NumberFormat, Role } from '@/types/core'
import type { HealthComponent, HealthReport } from '@/types/analysis'
import { ROLE_META } from '../dictionaries/roles'
import { clamp } from '@/lib/stats'
import { formatValue } from '@/lib/format'

const L = (vi: string, en: string): L10n => ({ vi, en })
const status = (s: number): 'good' | 'watch' | 'risk' => (s >= 75 ? 'good' : s >= 55 ? 'watch' : 'risk')

interface Spec {
  id: string
  name: L10n
  weight: number
  keys: string[]
  score: (f: Record<string, number>) => number
  explain: (f: Record<string, number>, lang: 'vi' | 'en') => string
  format: NumberFormat
  primary: string
  domains?: (Domain | 'all')[]
}

function fv(v: number, f: NumberFormat, lang: 'vi' | 'en', signed = false) {
  return formatValue(v, f, { lang, signed })
}

export function buildHealth(f: Record<string, number>, domain: Domain, mainMeasure: Role | null): HealthReport {
  const m = mainMeasure ?? 'revenue'
  const mName = ROLE_META[m]?.label ?? L('Chỉ số chính', 'Main metric')
  const specs: Spec[] = [
    {
      id: 'growth', name: L('Tăng trưởng', 'Growth'), weight: 1.2, keys: [`g3.${m}`], primary: `g3.${m}`, format: 'percent',
      score: (x) => clamp(60 + x[`g3.${m}`] * 200, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `${mName.vi} 3 kỳ gần nhất ${fv(x[`g3.${m}`], 'percent', lang, true)} so với 3 kỳ trước.` : `${mName.en} over the last 3 periods is ${fv(x[`g3.${m}`], 'percent', lang, true)} vs the prior 3.`),
    },
    {
      id: 'momentum', name: L('Đà tăng trưởng', 'Momentum'), weight: 0.8, keys: [`g.${m}`], primary: `g.${m}`, format: 'percent',
      score: (x) => clamp(62 + x[`g.${m}`] * 180, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `${mName.vi} kỳ gần nhất ${fv(x[`g.${m}`], 'percent', lang, true)} so với kỳ trước.` : `${mName.en} latest period ${fv(x[`g.${m}`], 'percent', lang, true)} vs previous.`),
    },
    {
      id: 'profitability', name: L('Khả năng sinh lời', 'Profitability'), weight: 1.3, keys: ['kpi.gross_margin'], primary: 'kpi.gross_margin', format: 'percent',
      score: (x) => {
        const v = x['kpi.gross_margin']
        return v < 0 ? 10 : v < 0.05 ? 35 + v * 300 : v < 0.1 ? 50 + (v - 0.05) * 300 : v < 0.2 ? 65 + (v - 0.1) * 150 : v < 0.3 ? 80 + (v - 0.2) * 100 : 93
      },
      explain: (x, lang) => (lang === 'vi' ? `Biên lợi nhuận chung ${fv(x['kpi.gross_margin'], 'percent', lang)}.` : `Overall profit margin is ${fv(x['kpi.gross_margin'], 'percent', lang)}.`),
    },
    {
      id: 'cost_control', name: L('Kiểm soát chi phí', 'Cost control'), weight: 1, keys: ['g.cost', 'g.revenue'], primary: 'g.cost', format: 'percent',
      score: (x) => clamp(72 - (x['g.cost'] - x['g.revenue']) * 220, 10, 96),
      explain: (x, lang) => (lang === 'vi' ? `Chi phí ${fv(x['g.cost'], 'percent', lang, true)} so với doanh thu ${fv(x['g.revenue'], 'percent', lang, true)} trong kỳ gần nhất.` : `Cost ${fv(x['g.cost'], 'percent', lang, true)} vs revenue ${fv(x['g.revenue'], 'percent', lang, true)} in the latest period.`),
    },
    {
      id: 'customer_concentration', name: L('Phân tán khách hàng', 'Customer diversification'), weight: 1, keys: ['seg.customer.top_share'], primary: 'seg.customer.top_share', format: 'percent',
      score: (x) => clamp(100 - x['seg.customer.top_share'] * 120 - Math.max(0, (x['seg.customer.top5_share'] ?? 0) - 0.5) * 60, 8, 96),
      explain: (x, lang) => (lang === 'vi' ? `Khách hàng lớn nhất chiếm ${fv(x['seg.customer.top_share'], 'percent', lang)}; Top 5 chiếm ${fv(x['seg.customer.top5_share'] ?? NaN, 'percent', lang)}.` : `Largest customer holds ${fv(x['seg.customer.top_share'], 'percent', lang)}; top 5 hold ${fv(x['seg.customer.top5_share'] ?? NaN, 'percent', lang)}.`),
    },
    {
      id: 'product_concentration', name: L('Cơ cấu sản phẩm', 'Product mix'), weight: 0.6, keys: ['seg.product.top_share'], primary: 'seg.product.top_share', format: 'percent',
      score: (x) => clamp(100 - x['seg.product.top_share'] * 100, 15, 95),
      explain: (x, lang) => (lang === 'vi' ? `Sản phẩm dẫn đầu chiếm ${fv(x['seg.product.top_share'], 'percent', lang)}.` : `Top product holds ${fv(x['seg.product.top_share'], 'percent', lang)}.`),
    },
    {
      id: 'target', name: L('Hoàn thành mục tiêu', 'Target achievement'), weight: 1.2, keys: ['kpi.target_achievement'], primary: 'kpi.target_achievement', format: 'percent',
      score: (x) => clamp(50 + (x['kpi.target_achievement'] - 0.9) * 300, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `Đạt ${fv(x['kpi.target_achievement'], 'percent', lang)} mục tiêu.` : `${fv(x['kpi.target_achievement'], 'percent', lang)} of target achieved.`),
    },
    {
      id: 'stability', name: L('Ổn định vận hành', 'Operational stability'), weight: 0.8, keys: [`cv.${m}`], primary: `cv.${m}`, format: 'percent',
      score: (x) => clamp(100 - x[`cv.${m}`] * 150, 10, 96),
      explain: (x, lang) => (lang === 'vi' ? `Hệ số biến thiên của ${mName.vi.toLowerCase()} giữa các kỳ là ${fv(x[`cv.${m}`], 'percent', lang)}.` : `Period-to-period variation of ${mName.en.toLowerCase()} is ${fv(x[`cv.${m}`], 'percent', lang)}.`),
    },
    {
      id: 'quality', name: L('Chất lượng sản xuất', 'Production quality'), weight: 1.3, keys: ['kpi.defect_rate'], primary: 'kpi.defect_rate', format: 'percent',
      score: (x) => clamp(100 - x['kpi.defect_rate'] * 1100, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `Tỷ lệ lỗi ${fv(x['kpi.defect_rate'], 'percent', lang)}.` : `Defect rate is ${fv(x['kpi.defect_rate'], 'percent', lang)}.`),
    },
    {
      id: 'plan', name: L('Đạt kế hoạch sản xuất', 'Plan achievement'), weight: 1.1, keys: ['kpi.output_achievement'], primary: 'kpi.output_achievement', format: 'percent',
      score: (x) => clamp(50 + (x['kpi.output_achievement'] - 0.9) * 300, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `Sản lượng đạt ${fv(x['kpi.output_achievement'], 'percent', lang)} kế hoạch.` : `Output at ${fv(x['kpi.output_achievement'], 'percent', lang)} of plan.`),
    },
    {
      id: 'downtime', name: L('Thời gian dừng máy', 'Downtime trend'), weight: 0.9, keys: ['g.downtime'], primary: 'g.downtime', format: 'percent',
      score: (x) => clamp(72 - x['g.downtime'] * 110, 8, 96),
      explain: (x, lang) => (lang === 'vi' ? `Thời gian dừng kỳ gần nhất ${fv(x['g.downtime'], 'percent', lang, true)} so với kỳ trước.` : `Downtime latest period ${fv(x['g.downtime'], 'percent', lang, true)} vs previous.`),
    },
    {
      id: 'absence', name: L('Chuyên cần', 'Attendance'), weight: 1, keys: ['kpi.absence_rate'], primary: 'kpi.absence_rate', format: 'percent',
      score: (x) => clamp(100 - x['kpi.absence_rate'] * 600, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `Tỷ lệ vắng mặt ${fv(x['kpi.absence_rate'], 'percent', lang)}.` : `Absence rate is ${fv(x['kpi.absence_rate'], 'percent', lang)}.`),
    },
    {
      id: 'performance', name: L('Hiệu suất nhân sự', 'Workforce performance'), weight: 0.8, keys: ['kpi.avg_performance', 'ratio.performance_avg.department.max'], primary: 'kpi.avg_performance', format: 'score',
      score: (x) => clamp((x['kpi.avg_performance'] / Math.max(x['kpi.avg_performance'], x['ratio.performance_avg.department.max'] ?? 0, x['kpi.avg_performance'] <= 5 ? 5 : x['kpi.avg_performance'] <= 10 ? 10 : 100)) * 110, 10, 95),
      explain: (x, lang) => (lang === 'vi' ? `Điểm hiệu suất bình quân ${fv(x['kpi.avg_performance'], 'score', lang)}.` : `Average performance score ${fv(x['kpi.avg_performance'], 'score', lang)}.`),
    },
    {
      id: 'roas', name: L('Hiệu quả quảng cáo', 'Advertising efficiency'), weight: 1.2, keys: ['kpi.roas'], primary: 'kpi.roas', format: 'ratio',
      score: (x) => clamp(30 + x['kpi.roas'] * 12, 5, 97),
      explain: (x, lang) => (lang === 'vi' ? `ROAS đạt ${fv(x['kpi.roas'], 'ratio', lang)}.` : `ROAS is ${fv(x['kpi.roas'], 'ratio', lang)}.`),
    },
    {
      id: 'ctr', name: L('Mức độ thu hút', 'Engagement'), weight: 0.6, keys: ['kpi.ctr'], primary: 'kpi.ctr', format: 'percent',
      score: (x) => clamp(40 + x['kpi.ctr'] * 1500, 10, 96),
      explain: (x, lang) => (lang === 'vi' ? `CTR đạt ${fv(x['kpi.ctr'], 'percent', lang)}.` : `CTR is ${fv(x['kpi.ctr'], 'percent', lang)}.`),
    },
    {
      id: 'cpl', name: L('Chi phí thu hút lead', 'Lead cost trend'), weight: 0.7, keys: ['kpi.cpl.chg'], primary: 'kpi.cpl.chg', format: 'percent',
      score: (x) => clamp(70 - x['kpi.cpl.chg'] * 150, 10, 96),
      explain: (x, lang) => (lang === 'vi' ? `CPL kỳ gần nhất ${fv(x['kpi.cpl.chg'], 'percent', lang, true)}.` : `CPL latest period ${fv(x['kpi.cpl.chg'], 'percent', lang, true)}.`),
    },
    {
      id: 'budget', name: L('Kỷ luật ngân sách', 'Budget discipline'), weight: 1.2, keys: ['kpi.budget_utilization'], primary: 'kpi.budget_utilization', format: 'percent',
      score: (x) => clamp(95 - Math.max(0, x['kpi.budget_utilization'] - 1) * 300 - Math.max(0, 0.9 - x['kpi.budget_utilization']) * 120, 5, 97),
      explain: (x, lang) => (lang === 'vi' ? `Sử dụng ${fv(x['kpi.budget_utilization'], 'percent', lang)} ngân sách.` : `${fv(x['kpi.budget_utilization'], 'percent', lang)} of budget used.`),
    },
    {
      id: 'stock', name: L('Sẵn hàng', 'Stock availability'), weight: 1, keys: ['kpi.stockout_rate'], primary: 'kpi.stockout_rate', format: 'percent',
      score: (x) => clamp(100 - x['kpi.stockout_rate'] * 600, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `${fv(x['kpi.stockout_rate'], 'percent', lang)} bản ghi hết hàng.` : `${fv(x['kpi.stockout_rate'], 'percent', lang)} of records are out of stock.`),
    },
    {
      id: 'satisfaction', name: L('Hài lòng khách hàng', 'Customer satisfaction'), weight: 1.2, keys: ['kpi.avg_satisfaction'], primary: 'kpi.avg_satisfaction', format: 'score',
      score: (x) => {
        const v = x['kpi.avg_satisfaction']
        const scale = v <= 5 ? 5 : v <= 10 ? 10 : 100
        return clamp((v / scale) * 105 - 5, 5, 98)
      },
      explain: (x, lang) => (lang === 'vi' ? `Điểm hài lòng bình quân ${fv(x['kpi.avg_satisfaction'], 'score', lang)}.` : `Average satisfaction ${fv(x['kpi.avg_satisfaction'], 'score', lang)}.`),
    },
    {
      id: 'on_time', name: L('Đúng hạn', 'On-time delivery'), weight: 1, keys: ['kpi.on_time_rate'], primary: 'kpi.on_time_rate', format: 'percent',
      score: (x) => clamp(50 + (x['kpi.on_time_rate'] - 0.85) * 300, 5, 98),
      explain: (x, lang) => (lang === 'vi' ? `Tỷ lệ đúng hạn ${fv(x['kpi.on_time_rate'], 'percent', lang)}.` : `On-time rate ${fv(x['kpi.on_time_rate'], 'percent', lang)}.`),
    },
    {
      id: 'data_quality', name: L('Chất lượng dữ liệu', 'Data quality'), weight: 0.5, keys: ['dq.score'], primary: 'dq.score', format: 'integer',
      score: (x) => x['dq.score'],
      explain: (x, lang) => (lang === 'vi' ? `Điểm chất lượng dữ liệu ${Math.round(x['dq.score'])}/100.` : `Data quality score ${Math.round(x['dq.score'])}/100.`),
    },
  ]
  const comps: HealthComponent[] = []
  for (const s of specs) {
    if (!s.keys.slice(0, 1).every((k) => k in f && Number.isFinite(f[k]))) continue
    if (s.id === 'cost_control' && !('g.revenue' in f)) continue
    const sc = Math.round(s.score(f))
    if (!Number.isFinite(sc)) continue
    comps.push({
      id: s.id,
      name: s.name,
      score: sc,
      weight: s.weight,
      status: status(sc),
      explanation: { vi: s.explain(f, 'vi'), en: s.explain(f, 'en') },
      evidence: [{ label: s.name, value: { v: f[s.primary], f: s.format } }],
    })
  }
  if (!comps.length) {
    return { score: 0, status: 'watch', components: [], summary: L('Chưa đủ dữ liệu để tính sức khỏe kinh doanh.', 'Not enough data to compute business health.') }
  }
  const tw = comps.reduce((s, c) => s + c.weight, 0)
  const score = Math.round(comps.reduce((s, c) => s + c.score * c.weight, 0) / tw)
  const weakest = [...comps].filter((c) => c.id !== 'data_quality').sort((a, b) => a.score - b.score)[0]
  const strongest = [...comps].filter((c) => c.id !== 'data_quality').sort((a, b) => b.score - a.score)[0]
  const summary: L10n = weakest && strongest && weakest !== strongest
    ? { vi: `Điểm mạnh: ${strongest.name.vi.toLowerCase()} (${strongest.score}). Cần chú ý: ${weakest.name.vi.toLowerCase()} (${weakest.score}). Tổng hợp từ ${comps.length} thành phần có đủ dữ liệu (lĩnh vực: ${domain}).`, en: `Strength: ${strongest.name.en.toLowerCase()} (${strongest.score}). Watch: ${weakest.name.en.toLowerCase()} (${weakest.score}). Based on ${comps.length} components with sufficient data (domain: ${domain}).` }
    : { vi: `Tổng hợp từ ${comps.length} thành phần có đủ dữ liệu.`, en: `Based on ${comps.length} components with sufficient data.` }
  return { score, status: status(score), components: comps, summary }
}
