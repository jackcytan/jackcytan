/** Human labels + formats for fact keys (used for WHY / evidence panels). */
import type { L10n, NumberFormat, Role } from '@/types/core'
import type { EvidenceItem } from '@/types/analysis'
import { ROLE_META } from '../dictionaries/roles'
import { KPI_BY_ID } from '../metrics/kpiLibrary'
import { RATIO_METRICS } from '../analysis/ratioFacts'

export interface FactMeta {
  label: L10n
  format: NumberFormat
  signed?: boolean
}

const rl = (r: string): L10n => ROLE_META[r as Role]?.label ?? { vi: r, en: r }
const cat = (a: L10n, vi: string, en: string): L10n => ({ vi: `${a.vi} ${vi}`.trim(), en: `${a.en} ${en}`.trim() })
const pre = (vi: string, en: string, a: L10n): L10n => ({ vi: `${vi} ${a.vi.toLowerCase()}`, en: `${en} ${a.en.toLowerCase()}` })

export function factMeta(key: string): FactMeta {
  const parts = key.split('.')
  const [head] = parts
  switch (head) {
    case 'g':
      return { label: cat(rl(parts[1]), '— tăng trưởng kỳ gần nhất', '— latest period growth'), format: 'percent', signed: true }
    case 'g3':
      return { label: cat(rl(parts[1]), '— 3 kỳ gần nhất so với 3 kỳ trước', '— last 3 vs prior 3 periods'), format: 'percent', signed: true }
    case 'yoy':
      return { label: cat(rl(parts[1]), '— so với cùng kỳ năm trước', '— year over year'), format: 'percent', signed: true }
    case 'last':
      return { label: cat(rl(parts[1]), 'kỳ gần nhất', 'latest period'), format: ROLE_META[parts[1] as Role]?.format ?? 'number' }
    case 'prev':
      return { label: cat(rl(parts[1]), 'kỳ trước', 'previous period'), format: ROLE_META[parts[1] as Role]?.format ?? 'number' }
    case 'last_vs_avg':
      return { label: cat(rl(parts[1]), 'kỳ gần nhất so với bình quân', 'latest vs average'), format: 'percent', signed: true }
    case 'trend':
      return parts[2] === 'r2'
        ? { label: cat(rl(parts[1]), '— độ phù hợp xu hướng (R²)', '— trend fit (R²)'), format: 'score' }
        : { label: cat(rl(parts[1]), '— độ dốc xu hướng mỗi kỳ', '— trend slope per period'), format: 'percent', signed: true }
    case 'cv':
      return { label: cat(rl(parts[1]), '— hệ số biến thiên', '— coefficient of variation'), format: 'percent' }
    case 'decl':
      return { label: cat(rl(parts[1]), '— số kỳ giảm liên tiếp', '— consecutive declining periods'), format: 'integer' }
    case 'incr':
      return { label: cat(rl(parts[1]), '— số kỳ tăng liên tiếp', '— consecutive rising periods'), format: 'integer' }
    case 'accel':
      return { label: cat(rl(parts[1]), '— thay đổi tốc độ tăng trưởng', '— change in growth rate'), format: 'pp', signed: true }
    case 'is_peak':
    case 'is_low':
      return { label: cat(rl(parts[1]), head === 'is_peak' ? '— kỳ gần nhất là đỉnh' : '— kỳ gần nhất là đáy', head === 'is_peak' ? '— latest is a peak' : '— latest is a low'), format: 'integer' }
    case 'margin':
      if (parts[1] === 'chg_pp') return { label: { vi: 'Thay đổi biên lợi nhuận', en: 'Margin change' }, format: 'pp', signed: true }
      if (parts[1] === 'decl') return { label: { vi: 'Số kỳ biên lợi nhuận giảm liên tiếp', en: 'Consecutive margin declines' }, format: 'integer' }
      if (parts[1] === 'slope_pp') return { label: { vi: 'Xu hướng biên lợi nhuận mỗi kỳ', en: 'Margin trend per period' }, format: 'pp', signed: true }
      return { label: parts[1] === 'cur' ? { vi: 'Biên lợi nhuận kỳ gần nhất', en: 'Latest period margin' } : { vi: 'Biên lợi nhuận kỳ trước', en: 'Previous period margin' }, format: 'percent' }
    case 'kpi': {
      const def = KPI_BY_ID.get(parts[1])
      const name = def?.name ?? { vi: parts[1], en: parts[1] }
      const fmt = def?.format ?? 'number'
      if (parts[2] === 'cur') return { label: cat(name, '(kỳ gần nhất)', '(latest period)'), format: fmt }
      if (parts[2] === 'prev') return { label: cat(name, '(kỳ trước)', '(previous period)'), format: fmt }
      if (parts[2] === 'chg') return { label: cat(name, '— thay đổi', '— change'), format: fmt === 'percent' ? 'pp' : 'percent', signed: true }
      return { label: name, format: fmt }
    }
    case 'seg': {
      const dim = rl(parts[1])
      switch (parts[2]) {
        case 'top_share':
          return { label: pre('Tỷ trọng lớn nhất theo', 'Largest share by', dim), format: 'percent' }
        case 'top5_share':
          return { label: pre('Tỷ trọng Top 5 theo', 'Top 5 share by', dim), format: 'percent' }
        case 'worst_chg':
          return { label: pre('Biến động kém nhất theo', 'Worst change by', dim), format: 'percent', signed: true }
        case 'best_chg':
          return { label: pre('Biến động tốt nhất theo', 'Best change by', dim), format: 'percent', signed: true }
        case 'worst_share':
        case 'best_share':
          return { label: pre('Tỷ trọng của nhóm theo', 'Group share by', dim), format: 'percent' }
        case 'decliners_share':
          return { label: pre('Tỷ lệ nhóm giảm theo', 'Share of declining groups by', dim), format: 'percent' }
        case 'avg_chg':
          return { label: pre('Biến động bình quân theo', 'Average change by', dim), format: 'percent', signed: true }
        case 'spread':
          return { label: pre('Chênh lệch tăng trưởng theo', 'Growth spread by', dim), format: 'percent' }
        case 'lead_ratio':
          return { label: pre('Hệ số dẫn đầu theo', 'Lead ratio by', dim), format: 'ratio' }
        case 'count':
          return { label: pre('Số nhóm theo', 'Number of groups by', dim), format: 'integer' }
        default:
          return { label: dim, format: 'number' }
      }
    }
    case 'pareto': {
      const dim = rl(parts[1])
      if (parts[2] === 'share80') return { label: pre('Tỷ lệ tạo 80% giá trị —', 'Share generating 80% —', dim), format: 'percent' }
      if (parts[2] === 'top20') return { label: pre('Đóng góp của 20% hàng đầu —', 'Contribution of top 20% —', dim), format: 'percent' }
      return { label: pre('Số lượng', 'Count of', dim), format: 'integer' }
    }
    case 'ratio': {
      const def = RATIO_METRICS.find((r) => r.id === parts[1])
      const dim = rl(parts[2])
      const name = def?.label ?? { vi: parts[1], en: parts[1] }
      const suffix: Record<string, L10n> = {
        max: { vi: 'cao nhất', en: 'highest' },
        min: { vi: 'thấp nhất', en: 'lowest' },
        avg: { vi: 'bình quân', en: 'average' },
        n: { vi: 'số nhóm', en: 'groups' },
      }
      const s = suffix[parts[3]] ?? { vi: '', en: '' }
      return { label: { vi: `${name.vi} theo ${dim.vi.toLowerCase()} — ${s.vi}`, en: `${name.en} by ${dim.en.toLowerCase()} — ${s.en}` }, format: parts[3] === 'n' ? 'integer' : def?.format ?? 'number' }
    }
    case 'dq':
      return { label: parts[1] === 'score' ? { vi: 'Điểm chất lượng dữ liệu', en: 'Data quality score' } : { vi: 'Độ đầy đủ dữ liệu', en: 'Completeness' }, format: 'integer' }
    case 'anom':
      return { label: { vi: 'Số điểm bất thường', en: 'Anomalies' }, format: 'integer' }
    default:
      return { label: { vi: key, en: key }, format: 'number' }
  }
}

export function evidenceFor(keys: string[], facts: Record<string, number>, labels: Record<string, string>): EvidenceItem[] {
  const out: EvidenceItem[] = []
  for (const k of keys) {
    if (!(k in facts)) continue
    const m = factMeta(k)
    const lab = labels[k]
    out.push({ label: lab ? { vi: `${m.label.vi} (${lab})`, en: `${m.label.en} (${lab})` } : m.label, value: { v: facts[k], f: m.format, signed: m.signed } })
  }
  return out
}
