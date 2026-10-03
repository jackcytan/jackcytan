import type { L10n, NumberFormat, Role, RoleKind } from '@/types/core'

export interface RoleMeta {
  role: Role
  kind: RoleKind
  label: L10n
  /** default aggregation for measures */
  agg?: 'sum' | 'avg'
  format?: NumberFormat
  /** money-like measure: formatted with currency */
  money?: boolean
  /** higher is better */
  better?: 'up' | 'down' | 'neutral'
  /** allowed column types */
  types: ('number' | 'currency' | 'percent' | 'date' | 'text' | 'category' | 'id' | 'boolean')[]
}

const M = (role: Role, vi: string, en: string, o: Partial<RoleMeta> = {}): RoleMeta => ({
  role,
  kind: 'measure',
  label: { vi, en },
  agg: 'sum',
  format: 'number',
  better: 'up',
  types: ['number', 'currency', 'percent'],
  ...o,
})
const D = (role: Role, vi: string, en: string, o: Partial<RoleMeta> = {}): RoleMeta => ({
  role,
  kind: 'dimension',
  label: { vi, en },
  types: ['text', 'category', 'id', 'boolean'],
  ...o,
})

export const ROLE_META: Record<Role, RoleMeta> = {
  date: { role: 'date', kind: 'date', label: { vi: 'Ngày', en: 'Date' }, types: ['date'] },
  hire_date: { role: 'hire_date', kind: 'date', label: { vi: 'Ngày vào làm', en: 'Hire date' }, types: ['date'] },
  revenue: M('revenue', 'Doanh thu', 'Revenue', { money: true, format: 'currency' }),
  cost: M('cost', 'Chi phí', 'Cost', { money: true, format: 'currency', better: 'down' }),
  profit: M('profit', 'Lợi nhuận', 'Profit', { money: true, format: 'currency' }),
  quantity: M('quantity', 'Số lượng', 'Quantity', { format: 'integer' }),
  price: M('price', 'Đơn giá', 'Unit price', { money: true, format: 'currency', agg: 'avg', better: 'neutral' }),
  discount: M('discount', 'Chiết khấu', 'Discount', { money: true, format: 'currency', better: 'down' }),
  target: M('target', 'Mục tiêu', 'Target', { money: true, format: 'currency', better: 'neutral' }),
  budget: M('budget', 'Ngân sách', 'Budget', { money: true, format: 'currency', better: 'neutral' }),
  actual: M('actual', 'Giá trị thực hiện', 'Actual', { money: true, format: 'currency', better: 'neutral' }),
  expense: M('expense', 'Chi tiêu', 'Expense', { money: true, format: 'currency', better: 'down' }),
  inventory: M('inventory', 'Tồn kho', 'Inventory', { format: 'integer', agg: 'avg', better: 'neutral' }),
  defect: M('defect', 'Lỗi / phế phẩm', 'Defects', { format: 'integer', better: 'down' }),
  downtime: M('downtime', 'Thời gian dừng', 'Downtime', { format: 'minutes', better: 'down' }),
  output: M('output', 'Sản lượng thực tế', 'Actual output', { format: 'integer' }),
  planned_output: M('planned_output', 'Sản lượng kế hoạch', 'Planned output', { format: 'integer', better: 'neutral' }),
  salary: M('salary', 'Lương', 'Salary', { money: true, format: 'currency', agg: 'sum', better: 'neutral' }),
  attendance: M('attendance', 'Chuyên cần', 'Attendance', { format: 'percent', agg: 'avg' }),
  absence: M('absence', 'Vắng mặt', 'Absence', { format: 'number', better: 'down' }),
  performance: M('performance', 'Hiệu suất / đánh giá', 'Performance', { format: 'score', agg: 'avg' }),
  lead: M('lead', 'Khách tiềm năng', 'Leads', { format: 'integer' }),
  conversion: M('conversion', 'Tỷ lệ chuyển đổi', 'Conversion rate', { format: 'percent', agg: 'avg' }),
  spend: M('spend', 'Chi phí marketing', 'Marketing spend', { money: true, format: 'currency', better: 'neutral' }),
  impressions: M('impressions', 'Lượt hiển thị', 'Impressions', { format: 'integer' }),
  clicks: M('clicks', 'Lượt nhấp', 'Clicks', { format: 'integer' }),
  orders: M('orders', 'Số đơn hàng', 'Orders', { format: 'integer' }),
  returns: M('returns', 'Hàng hoàn trả', 'Returns', { format: 'integer', better: 'down' }),
  response_time: M('response_time', 'Thời gian phản hồi', 'Response time', { format: 'minutes', agg: 'avg', better: 'down' }),
  satisfaction: M('satisfaction', 'Mức độ hài lòng', 'Satisfaction', { format: 'score', agg: 'avg' }),
  duration: M('duration', 'Thời gian xử lý', 'Processing time', { format: 'hours', agg: 'avg', better: 'down' }),
  hours: M('hours', 'Số giờ làm', 'Hours worked', { format: 'hours' }),
  margin: M('margin', 'Biên lợi nhuận', 'Margin', { format: 'percent', agg: 'avg' }),
  customer: D('customer', 'Khách hàng', 'Customer'),
  product: D('product', 'Sản phẩm', 'Product'),
  category: D('category', 'Danh mục', 'Category'),
  region: D('region', 'Khu vực', 'Region'),
  branch: D('branch', 'Chi nhánh', 'Branch'),
  salesperson: D('salesperson', 'Nhân viên kinh doanh', 'Salesperson'),
  status: D('status', 'Trạng thái', 'Status'),
  department: D('department', 'Phòng ban', 'Department'),
  channel: D('channel', 'Kênh', 'Channel'),
  campaign: D('campaign', 'Chiến dịch', 'Campaign'),
  machine: D('machine', 'Máy', 'Machine'),
  line: D('line', 'Dây chuyền', 'Production line'),
  shift: D('shift', 'Ca làm việc', 'Shift'),
  employee: D('employee', 'Nhân viên', 'Employee'),
  position: D('position', 'Chức danh', 'Position'),
  supplier: D('supplier', 'Nhà cung cấp', 'Supplier'),
  warehouse: D('warehouse', 'Kho', 'Warehouse'),
  ticket: { role: 'ticket', kind: 'id', label: { vi: 'Mã yêu cầu', en: 'Ticket ID' }, types: ['text', 'category', 'id', 'number'] },
  order_id: { role: 'order_id', kind: 'id', label: { vi: 'Mã đơn hàng', en: 'Order ID' }, types: ['text', 'category', 'id', 'number'] },
  other: { role: 'other', kind: 'other', label: { vi: 'Khác', en: 'Other' }, types: ['number', 'currency', 'percent', 'date', 'text', 'category', 'id', 'boolean'] },
}

export const ALL_ROLES = Object.keys(ROLE_META) as Role[]
export const MEASURE_ROLES = ALL_ROLES.filter((r) => ROLE_META[r].kind === 'measure')
export const DIMENSION_ROLES = ALL_ROLES.filter((r) => ROLE_META[r].kind === 'dimension')

export function roleLabel(role: Role, lang: 'vi' | 'en'): string {
  return ROLE_META[role]?.label[lang] ?? role
}
