/**
 * QUERY LEXICON — vocabulary for the local Business Query Engine (no LLM).
 * All phrases are written naturally and normalized (accents removed) at load time.
 */
import type { NumberFormat, Role, Granularity } from '@/types/core'
import { FIELD_ALIASES } from '../dictionaries/fieldAliases'
import { normalizeKey } from '@/lib/text'

export type QueryOp =
  | 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX' | 'MEDIAN' | 'TOP_N' | 'BOTTOM_N' | 'RANK' | 'GROUP_BY'
  | 'COMPARE' | 'GROWTH' | 'SHARE' | 'TREND' | 'ANOMALY' | 'PARETO' | 'CORRELATION' | 'FORECAST'

export const ALL_OPS: QueryOp[] = ['SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX', 'MEDIAN', 'TOP_N', 'BOTTOM_N', 'RANK', 'GROUP_BY', 'COMPARE', 'GROWTH', 'SHARE', 'TREND', 'ANOMALY', 'PARETO', 'CORRELATION', 'FORECAST']

/** Signal words → operation hints */
export const OP_WORDS: Record<string, string[]> = {
  sum: ['tổng', 'tong cong', 'total', 'sum', 'tổng cộng', 'cộng dồn', 'tất cả', 'toàn bộ'],
  avg: ['trung bình', 'bình quân', 'average', 'avg', 'mean', 'tb'],
  median: ['trung vị', 'median'],
  count: ['đếm', 'count', 'how many', 'có bao nhiêu', 'mấy', 'number of', 'bao nhiêu cái'],
  max: ['cao nhất', 'lớn nhất', 'nhiều nhất', 'tốt nhất', 'mạnh nhất', 'dẫn đầu', 'đứng đầu', 'highest', 'largest', 'biggest', 'best', 'max', 'maximum', 'most', 'top performer', 'bán chạy nhất', 'chạy nhất', 'hiệu quả nhất', 'cao', 'lớn'],
  min: ['thấp nhất', 'nhỏ nhất', 'ít nhất', 'kém nhất', 'tệ nhất', 'yếu nhất', 'lowest', 'smallest', 'worst', 'least', 'min', 'minimum', 'bottom', 'chậm nhất', 'thấp', 'nhỏ'],
  top: ['top', 'hàng đầu', 'đứng đầu', 'leading'],
  bottom: ['bottom', 'cuối bảng', 'đội sổ'],
  group: ['theo', 'từng', 'mỗi', 'by', 'per', 'each', 'phân theo', 'chia theo', 'breakdown', 'phân bổ', 'cơ cấu'],
  rank: ['xếp hạng', 'rank', 'ranking', 'bảng xếp hạng', 'thứ hạng'],
  compare: ['so sánh', 'compare', 'versus', 'vs', 'đối chiếu', 'so với', 'khác nhau'],
  growth: ['tăng trưởng', 'growth', 'tăng bao nhiêu', 'giảm bao nhiêu', 'thay đổi', 'biến động', 'change', 'tăng hay giảm', 'tăng', 'giảm', 'increase', 'decrease', 'grew', 'declined', 'drop', 'tụt'],
  growthUp: ['tăng mạnh nhất', 'tăng nhiều nhất', 'tăng trưởng nhanh nhất', 'tăng nhanh nhất', 'grew the most', 'fastest growing'],
  growthDown: ['giảm mạnh nhất', 'giảm nhiều nhất', 'sụt giảm mạnh nhất', 'tụt mạnh nhất', 'giảm sâu nhất', 'declined the most', 'dropped the most', 'biggest decline'],
  share: ['chiếm', 'tỷ trọng', 'tỉ trọng', 'phần trăm', 'share', 'percentage', 'contribution', 'đóng góp', 'bao nhiêu phần trăm', 'tỷ lệ đóng góp'],
  trend: ['xu hướng', 'trend', 'diễn biến', 'theo thời gian', 'over time', 'lịch sử', 'history', 'biểu đồ'],
  anomaly: ['bất thường', 'anomaly', 'anomalies', 'đột biến', 'outlier', 'outliers', 'khác thường', 'lạ', 'unusual', 'spike', 'bất ổn', 'có gì lạ', 'có vấn đề gì'],
  pareto: ['pareto', '80/20', '80 20', 'tạo ra 80', '80%', '20%', '20 phần trăm', '80 phần trăm'],
  correlation: ['tương quan', 'correlation', 'liên hệ', 'liên quan', 'association', 'quan hệ giữa', 'ảnh hưởng'],
  forecast: ['dự báo', 'dự phóng', 'forecast', 'projection', 'dự đoán', 'tháng tới', 'kỳ tới', 'next month', 'sắp tới'],
  where: ['ở đâu', 'nằm ở đâu', 'where', 'chỗ nào', 'đâu'],
  which: ['nào', 'which', 'what', 'ai', 'who'],
}

export interface MetricDef {
  id: string
  kind: 'measure' | 'count' | 'distinct' | 'ratio'
  role?: Role
  num?: Role
  den?: Role | 'count'
  format?: NumberFormat
  phrases: string[]
  label: { vi: string; en: string }
  /** higher is better (used for wording) */
  better?: 'up' | 'down'
}

const measureAliases = (r: Role, extra: string[] = []) => [...(FIELD_ALIASES[r] ?? []), ...extra]

export const METRICS: MetricDef[] = [
  { id: 'revenue', kind: 'measure', role: 'revenue', phrases: measureAliases('revenue', ['bán', 'bán hàng', 'bán được', 'bán tốt', 'sales performance', 'kinh doanh', 'doanh số bán', 'tiền bán']), label: { vi: 'Doanh thu', en: 'Revenue' } },
  { id: 'cost', kind: 'measure', role: 'cost', phrases: measureAliases('cost', ['tốn', 'chi phí cao']), label: { vi: 'Chi phí', en: 'Cost' }, better: 'down' },
  { id: 'profit', kind: 'measure', role: 'profit', phrases: measureAliases('profit', ['lời', 'có lãi', 'sinh lời']), label: { vi: 'Lợi nhuận', en: 'Profit' } },
  { id: 'quantity', kind: 'measure', role: 'quantity', phrases: measureAliases('quantity', ['sản lượng bán', 'bán được bao nhiêu cái']), label: { vi: 'Số lượng', en: 'Quantity' } },
  { id: 'expense', kind: 'measure', role: 'expense', phrases: measureAliases('expense'), label: { vi: 'Chi tiêu', en: 'Expense' }, better: 'down' },
  { id: 'actual', kind: 'measure', role: 'actual', phrases: measureAliases('actual'), label: { vi: 'Thực hiện', en: 'Actual' } },
  { id: 'target', kind: 'measure', role: 'target', phrases: measureAliases('target'), label: { vi: 'Mục tiêu', en: 'Target' } },
  { id: 'budget', kind: 'measure', role: 'budget', phrases: measureAliases('budget'), label: { vi: 'Ngân sách', en: 'Budget' } },
  { id: 'defect', kind: 'measure', role: 'defect', phrases: measureAliases('defect'), label: { vi: 'Số lỗi', en: 'Defects' }, better: 'down' },
  { id: 'output', kind: 'measure', role: 'output', phrases: measureAliases('output', ['sản xuất được']), label: { vi: 'Sản lượng', en: 'Output' } },
  { id: 'planned_output', kind: 'measure', role: 'planned_output', phrases: measureAliases('planned_output'), label: { vi: 'Sản lượng kế hoạch', en: 'Planned output' } },
  { id: 'downtime', kind: 'measure', role: 'downtime', phrases: measureAliases('downtime', ['dừng']), label: { vi: 'Thời gian dừng', en: 'Downtime' }, better: 'down' },
  { id: 'salary', kind: 'measure', role: 'salary', phrases: measureAliases('salary', ['quỹ lương', 'chi phí lương']), label: { vi: 'Lương', en: 'Salary' } },
  { id: 'lead', kind: 'measure', role: 'lead', phrases: measureAliases('lead'), label: { vi: 'Lead', en: 'Leads' } },
  { id: 'spend', kind: 'measure', role: 'spend', phrases: measureAliases('spend', ['ngân sách marketing', 'tiền quảng cáo']), label: { vi: 'Chi phí marketing', en: 'Marketing spend' } },
  { id: 'impressions', kind: 'measure', role: 'impressions', phrases: measureAliases('impressions'), label: { vi: 'Lượt hiển thị', en: 'Impressions' } },
  { id: 'clicks', kind: 'measure', role: 'clicks', phrases: measureAliases('clicks'), label: { vi: 'Lượt nhấp', en: 'Clicks' } },
  { id: 'orders', kind: 'measure', role: 'orders', phrases: measureAliases('orders'), label: { vi: 'Số đơn', en: 'Orders' } },
  { id: 'inventory', kind: 'measure', role: 'inventory', phrases: measureAliases('inventory'), label: { vi: 'Tồn kho', en: 'Inventory' } },
  { id: 'discount', kind: 'measure', role: 'discount', phrases: measureAliases('discount'), label: { vi: 'Chiết khấu', en: 'Discount' }, better: 'down' },
  { id: 'returns', kind: 'measure', role: 'returns', phrases: measureAliases('returns'), label: { vi: 'Hoàn trả', en: 'Returns' }, better: 'down' },
  { id: 'duration', kind: 'measure', role: 'duration', phrases: measureAliases('duration', ['xử lý lâu', 'thời gian giao']), label: { vi: 'Thời gian xử lý', en: 'Processing time' }, better: 'down' },
  { id: 'response_time', kind: 'measure', role: 'response_time', phrases: measureAliases('response_time'), label: { vi: 'Thời gian phản hồi', en: 'Response time' }, better: 'down' },
  { id: 'satisfaction', kind: 'measure', role: 'satisfaction', phrases: measureAliases('satisfaction'), label: { vi: 'Mức hài lòng', en: 'Satisfaction' } },
  { id: 'performance', kind: 'measure', role: 'performance', phrases: measureAliases('performance'), label: { vi: 'Điểm hiệu suất', en: 'Performance' } },
  { id: 'attendance', kind: 'measure', role: 'attendance', phrases: measureAliases('attendance'), label: { vi: 'Chuyên cần', en: 'Attendance' } },
  { id: 'hours', kind: 'measure', role: 'hours', phrases: measureAliases('hours'), label: { vi: 'Số giờ', en: 'Hours' } },
  { id: 'price', kind: 'measure', role: 'price', phrases: measureAliases('price'), label: { vi: 'Đơn giá', en: 'Price' } },
  // counts
  { id: 'transactions', kind: 'count', phrases: ['số đơn', 'số đơn hàng', 'bao nhiêu đơn', 'đơn hàng', 'giao dịch', 'số giao dịch', 'transactions', 'orders count', 'number of orders', 'how many orders', 'số hóa đơn', 'bản ghi', 'records', 'dòng'], label: { vi: 'Số giao dịch', en: 'Transactions' } },
  { id: 'customers', kind: 'distinct', role: 'customer', phrases: ['số khách hàng', 'bao nhiêu khách hàng', 'số khách', 'how many customers', 'number of customers', 'customer count'], label: { vi: 'Số khách hàng', en: 'Customers' } },
  { id: 'products_count', kind: 'distinct', role: 'product', phrases: ['số sản phẩm', 'bao nhiêu sản phẩm', 'how many products', 'number of products'], label: { vi: 'Số sản phẩm', en: 'Products' } },
  { id: 'employees', kind: 'distinct', role: 'employee', phrases: ['số nhân viên', 'bao nhiêu nhân viên', 'headcount', 'how many employees', 'nhân sự'], label: { vi: 'Số nhân viên', en: 'Employees' } },
  // ratios
  { id: 'margin', kind: 'ratio', num: 'profit', den: 'revenue', format: 'percent', phrases: ['biên lợi nhuận', 'margin', 'tỷ suất lợi nhuận', 'biên lãi', 'profit margin', 'gross margin'], label: { vi: 'Biên lợi nhuận', en: 'Profit margin' } },
  { id: 'aov', kind: 'ratio', num: 'revenue', den: 'count', format: 'currency', phrases: ['giá trị đơn trung bình', 'giá trị đơn hàng trung bình', 'aov', 'average order value', 'trung bình mỗi đơn'], label: { vi: 'Giá trị đơn trung bình', en: 'Average order value' } },
  { id: 'defect_rate', kind: 'ratio', num: 'defect', den: 'output', format: 'percent', phrases: ['tỷ lệ lỗi', 'defect rate', 'tỷ lệ phế phẩm', 'scrap rate'], label: { vi: 'Tỷ lệ lỗi', en: 'Defect rate' }, better: 'down' },
  { id: 'roas', kind: 'ratio', num: 'revenue', den: 'spend', format: 'ratio', phrases: ['roas', 'return on ad spend', 'hiệu quả quảng cáo'], label: { vi: 'ROAS', en: 'ROAS' } },
  { id: 'ctr', kind: 'ratio', num: 'clicks', den: 'impressions', format: 'percent', phrases: ['ctr', 'tỷ lệ nhấp', 'click through rate'], label: { vi: 'CTR', en: 'CTR' } },
  { id: 'cpl', kind: 'ratio', num: 'spend', den: 'lead', format: 'currency', phrases: ['cpl', 'chi phí mỗi lead', 'chi phí trên lead', 'cost per lead'], label: { vi: 'Chi phí / lead', en: 'Cost per lead' }, better: 'down' },
  { id: 'conversion_rate', kind: 'ratio', num: 'orders', den: 'lead', format: 'percent', phrases: ['tỷ lệ chuyển đổi', 'conversion', 'conversion rate', 'chuyển đổi'], label: { vi: 'Tỷ lệ chuyển đổi', en: 'Conversion rate' } },
  { id: 'achievement', kind: 'ratio', num: 'revenue', den: 'target', format: 'percent', phrases: ['đạt mục tiêu', 'hoàn thành mục tiêu', 'tỷ lệ đạt', 'target achievement', 'achievement'], label: { vi: 'Tỷ lệ đạt mục tiêu', en: 'Target achievement' } },
]

/** Extra dimension phrases used in questions ("chi nhánh nào", "ai bán"). */
export const DIM_EXTRA: Partial<Record<Role, string[]>> = {
  salesperson: ['nhân viên sale', 'sale nào', 'ai bán', 'người bán', 'nhân viên bán hàng', 'sales rep', 'top sale', 'nhân viên kinh doanh'],
  customer: ['khách', 'khách nào', 'client', 'customers'],
  product: ['mặt hàng', 'sản phẩm nào', 'products', 'items', 'hàng'],
  region: ['vùng', 'miền', 'khu vực', 'regions', 'tỉnh'],
  branch: ['chi nhánh', 'cửa hàng', 'store', 'stores', 'branches', 'hub', 'showroom'],
  channel: ['kênh', 'channels', 'nguồn'],
  department: ['phòng ban', 'phòng', 'bộ phận', 'departments'],
  category: ['danh mục', 'nhóm hàng', 'ngành hàng', 'loại', 'categories', 'hạng mục'],
  campaign: ['chiến dịch', 'campaigns'],
  machine: ['máy', 'machines'],
  line: ['dây chuyền', 'line', 'lines'],
  shift: ['ca', 'ca làm', 'shifts'],
  employee: ['nhân viên', 'employees', 'người'],
  position: ['chức danh', 'vị trí'],
  status: ['trạng thái'],
  warehouse: ['kho'],
  supplier: ['nhà cung cấp'],
}

export const TIME_DIM_WORDS: [string, Granularity][] = [
  ['theo ngày', 'day'], ['mỗi ngày', 'day'], ['hàng ngày', 'day'], ['ngày nào', 'day'], ['daily', 'day'], ['by day', 'day'], ['which day', 'day'],
  ['theo tuần', 'week'], ['mỗi tuần', 'week'], ['tuần nào', 'week'], ['weekly', 'week'], ['by week', 'week'], ['which week', 'week'],
  ['theo tháng', 'month'], ['mỗi tháng', 'month'], ['hàng tháng', 'month'], ['tháng nào', 'month'], ['monthly', 'month'], ['by month', 'month'], ['which month', 'month'], ['từng tháng', 'month'],
  ['theo quý', 'quarter'], ['mỗi quý', 'quarter'], ['quý nào', 'quarter'], ['quarterly', 'quarter'], ['by quarter', 'quarter'], ['which quarter', 'quarter'],
  ['theo năm', 'year'], ['năm nào', 'year'], ['yearly', 'year'], ['by year', 'year'],
]

/** Value synonyms (city names etc.) used when matching filter values. */
export const VALUE_SYNONYMS: Record<string, string[]> = {
  hcm: ['ho chi minh', 'tp hcm', 'tphcm', 'hcmc', 'sai gon', 'saigon', 'mien nam', 'south', 'tp ho chi minh', 'thanh pho ho chi minh'],
  'ha noi': ['hanoi', 'hn', 'mien bac', 'north', 'thu do'],
  'da nang': ['danang', 'mien trung', 'central'],
  'mien nam': ['south', 'hcm'],
  'mien bac': ['north', 'ha noi'],
  'mien trung': ['central', 'da nang'],
  'can tho': ['cantho', 'mien tay', 'dbscl', 'dong bang song cuu long', 'mekong'],
  'hai phong': ['haiphong'],
}

let NORMALIZED: { metrics: { def: MetricDef; phrase: string }[]; dims: { role: Role; phrase: string }[]; ops: Record<string, string[]>; timeDims: [string, Granularity][] } | null = null

export function lexicon() {
  if (NORMALIZED) return NORMALIZED
  const metrics: { def: MetricDef; phrase: string }[] = []
  for (const def of METRICS) for (const p of def.phrases) metrics.push({ def, phrase: normalizeKey(p) })
  metrics.sort((a, b) => b.phrase.length - a.phrase.length)
  const dims: { role: Role; phrase: string }[] = []
  const dimRoles: Role[] = ['customer', 'product', 'category', 'region', 'branch', 'salesperson', 'status', 'department', 'channel', 'campaign', 'machine', 'line', 'shift', 'employee', 'position', 'supplier', 'warehouse']
  for (const r of dimRoles) {
    for (const p of [...(FIELD_ALIASES[r] ?? []), ...(DIM_EXTRA[r] ?? [])]) {
      const n = normalizeKey(p)
      if (n.length >= 2) dims.push({ role: r, phrase: n })
    }
  }
  dims.sort((a, b) => b.phrase.length - a.phrase.length)
  const ops: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(OP_WORDS)) ops[k] = v.map(normalizeKey).sort((a, b) => b.length - a.length)
  const timeDims = TIME_DIM_WORDS.map(([p, g]) => [normalizeKey(p), g] as [string, Granularity])
  NORMALIZED = { metrics, dims, ops, timeDims }
  return NORMALIZED
}

export function queryVocabularySize(): number {
  const l = lexicon()
  return l.metrics.length + l.dims.length + Object.values(l.ops).reduce((s, x) => s + x.length, 0) + l.timeDims.length
}
