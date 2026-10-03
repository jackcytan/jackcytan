/**
 * SEMANTIC FIELD DICTIONARY
 * ------------------------------------------------------------------
 * Aliases are matched after normalization (lowercase, accents removed, punctuation -> space),
 * so "Doanh thu", "doanh_thu", "DoanhThu" and "DOANH THU" all match "doanh thu".
 * Write aliases naturally (with Vietnamese accents); they are normalized at load time.
 *
 * To extend: add strings to the relevant role. Longer, more specific aliases win over shorter
 * ones (e.g. "doanh thu kế hoạch" -> target beats "doanh thu" -> revenue).
 */
import type { Role } from '@/types/core'

export const FIELD_ALIASES: Partial<Record<Role, string[]>> = {
  date: [
    'ngày', 'ngay', 'date', 'time', 'datetime', 'timestamp', 'thời gian', 'thoi gian', 'transaction date', 'order date',
    'ngày bán', 'ngày tạo', 'ngày giao dịch', 'ngày đặt hàng', 'ngày đặt', 'ngày chứng từ', 'ngày hóa đơn', 'ngày hạch toán',
    'ngày ghi nhận', 'ngày xuất', 'ngày giao', 'ngày sản xuất', 'sale date', 'invoice date', 'created at', 'created date',
    'posting date', 'period', 'kỳ', 'tháng', 'month', 'week', 'tuần', 'quý', 'quarter', 'năm tháng', 'ngay ct', 'ngày ct',
    'report date', 'ngày báo cáo', 'business date', 'day', 'ship date', 'delivery date', 'production date', 'ngày phát sinh',
    'ticket date', 'ngày tiếp nhận', 'opened at', 'close date', 'ngày chốt',
  ],
  hire_date: ['ngày vào làm', 'ngay vao lam', 'hire date', 'joining date', 'join date', 'start date', 'ngày bắt đầu làm việc', 'ngày tuyển dụng', 'date of joining', 'onboard date'],
  revenue: [
    'doanh thu', 'doanhthu', 'doanh số', 'doanh so', 'sales', 'sale amount', 'sales amount', 'revenue', 'gross sales', 'net sales',
    'gmv', 'turnover', 'thành tiền', 'thanh tien', 'tổng tiền', 'tong tien', 'giá trị đơn hàng', 'gia tri don hang', 'order value',
    'order amount', 'amount', 'số tiền', 'so tien', 'tiền hàng', 'tien hang', 'doanh thu thuần', 'doanh thu bán hàng',
    'net revenue', 'gross revenue', 'total sales', 'total revenue', 'sales value', 'invoice amount', 'giá trị', 'gia tri',
    'income', 'thu nhập', 'tổng doanh thu', 'doanh thu thực tế', 'billing', 'bookings', 'tổng thanh toán', 'thanh toán',
    'sales revenue', 'value', 'dt',
  ],
  cost: [
    'chi phí', 'chi phi', 'cost', 'costs', 'cogs', 'giá vốn', 'gia von', 'giá vốn hàng bán', 'cost of goods sold', 'total cost',
    'tổng chi phí', 'chi phí sản xuất', 'chi phí hàng bán', 'unit cost total', 'cost amount', 'tiền vốn', 'vốn', 'cogs amount',
    'direct cost', 'chi phí trực tiếp', 'operating cost', 'chi phí vận hành', 'purchase cost', 'giá nhập', 'gia nhap', 'cp',
  ],
  profit: [
    'lợi nhuận', 'loi nhuan', 'profit', 'gross profit', 'net profit', 'lãi', 'lai', 'lãi gộp', 'lai gop', 'lợi nhuận gộp',
    'lợi nhuận ròng', 'lợi nhuận thuần', 'earnings', 'margin amount', 'gross margin amount', 'contribution', 'ebit', 'ebitda',
    'operating profit', 'lợi nhuận trước thuế', 'net income', 'ln',
  ],
  quantity: [
    'số lượng', 'so luong', 'quantity', 'qty', 'units', 'unit sold', 'units sold', 'sl', 'số lượng bán', 'sản lượng bán',
    'khối lượng', 'khoi luong', 'volume', 'pcs', 'số cái', 'số hộp', 'quantity sold', 'item count', 'số lượng xuất', 'sold qty',
  ],
  price: ['đơn giá', 'don gia', 'giá', 'gia', 'price', 'unit price', 'giá bán', 'gia ban', 'selling price', 'list price', 'giá niêm yết', 'rate', 'giá đơn vị', 'avg price'],
  discount: ['chiết khấu', 'chiet khau', 'giảm giá', 'giam gia', 'discount', 'discount amount', 'khuyến mãi', 'khuyen mai', 'promotion', 'rebate', 'markdown', 'ck'],
  target: [
    'mục tiêu', 'muc tieu', 'target', 'quota', 'plan', 'kế hoạch', 'ke hoach', 'chỉ tiêu', 'chi tieu', 'doanh thu kế hoạch',
    'doanh số mục tiêu', 'sales target', 'revenue target', 'planned revenue', 'kpi target', 'forecast', 'dự báo', 'goal',
    'target revenue', 'plan revenue', 'kh doanh thu',
  ],
  budget: ['ngân sách', 'ngan sach', 'budget', 'budgeted', 'budget amount', 'dự toán', 'du toan', 'ngân sách kế hoạch', 'allocated', 'phân bổ', 'budget plan'],
  actual: ['thực tế', 'thuc te', 'actual', 'actuals', 'actual amount', 'thực chi', 'thuc chi', 'thực hiện', 'thuc hien', 'số thực hiện', 'actual spend', 'actual cost'],
  expense: [
    'chi tiêu', 'chi tieu', 'expense', 'expenses', 'expenditure', 'opex', 'chi phí hoạt động', 'chi phí quản lý', 'spending',
    'khoản chi', 'khoan chi', 'tiền chi', 'outflow', 'payment out', 'chi', 'overhead',
  ],
  inventory: [
    'tồn kho', 'ton kho', 'inventory', 'stock', 'on hand', 'stock on hand', 'tồn', 'ton', 'tồn cuối kỳ', 'ton cuoi ky',
    'số lượng tồn', 'closing stock', 'available stock', 'inventory level', 'qty on hand', 'tồn hiện tại',
  ],
  defect: ['lỗi', 'loi', 'defect', 'defects', 'reject', 'rejects', 'scrap', 'phế phẩm', 'phe pham', 'hàng lỗi', 'hang loi', 'số lỗi', 'ng', 'ng qty', 'defective', 'sản phẩm lỗi', 'hỏng', 'rework'],
  downtime: ['downtime', 'thời gian dừng', 'thoi gian dung', 'machine stop', 'dừng máy', 'dung may', 'stop time', 'idle time', 'thời gian chết', 'breakdown', 'downtime minutes', 'downtime min', 'phút dừng', 'stoppage'],
  output: [
    'sản lượng', 'san luong', 'output', 'actual output', 'sản lượng thực tế', 'produced', 'production', 'production qty', 'good units',
    'thành phẩm', 'thanh pham', 'units produced', 'sản xuất', 'throughput', 'sản lượng đạt',
  ],
  planned_output: ['sản lượng kế hoạch', 'san luong ke hoach', 'planned output', 'plan output', 'target output', 'planned qty', 'kế hoạch sản xuất', 'planned production', 'capacity', 'công suất'],
  salary: ['lương', 'luong', 'salary', 'payroll', 'compensation', 'wage', 'wages', 'thu nhập nhân viên', 'lương cơ bản', 'base salary', 'gross pay', 'monthly salary', 'tổng lương', 'pay', 'luong co ban'],
  attendance: ['chuyên cần', 'chuyen can', 'attendance', 'attendance rate', 'tỷ lệ đi làm', 'ngày công', 'ngay cong', 'công', 'present days', 'days present', 'số ngày công'],
  absence: ['vắng mặt', 'vang mat', 'absence', 'absent', 'absent days', 'nghỉ', 'nghi', 'ngày nghỉ', 'ngay nghi', 'leave days', 'số ngày nghỉ', 'absenteeism'],
  performance: ['hiệu suất', 'hieu suat', 'performance', 'performance score', 'đánh giá', 'danh gia', 'rating', 'kpi score', 'điểm đánh giá', 'điểm kpi', 'xếp loại', 'appraisal', 'score'],
  lead: ['lead', 'leads', 'khách tiềm năng', 'khach tiem nang', 'prospect', 'prospects', 'mql', 'sql', 'contacts', 'đăng ký', 'dang ky', 'signups', 'sign ups', 'inquiries', 'số lead'],
  conversion: ['conversion', 'tỷ lệ chuyển đổi', 'ty le chuyen doi', 'conversion rate', 'cvr', 'cr', 'chuyển đổi', 'chuyen doi', 'win rate', 'tỷ lệ chốt', 'close rate'],
  spend: ['chi phí marketing', 'chi phi marketing', 'spend', 'ad spend', 'marketing spend', 'chi phí quảng cáo', 'chi phi quang cao', 'media cost', 'ads cost', 'advertising cost', 'ngân sách quảng cáo', 'cost ads', 'campaign cost'],
  impressions: ['impressions', 'impression', 'lượt hiển thị', 'luot hien thi', 'hiển thị', 'reach', 'views', 'lượt xem', 'luot xem', 'impr'],
  clicks: ['clicks', 'click', 'lượt nhấp', 'luot nhap', 'lượt click', 'luot click', 'nhấp chuột', 'link clicks'],
  orders: ['số đơn', 'so don', 'số đơn hàng', 'so don hang', 'orders', 'order count', 'transactions', 'purchases', 'conversions', 'số giao dịch', 'deals', 'deals won', 'đơn chốt', 'sales count'],
  returns: ['hoàn trả', 'hoan tra', 'return', 'returns', 'refund', 'refunds', 'trả hàng', 'tra hang', 'hàng trả lại', 'returned qty', 'số lượng trả', 'refund amount'],
  response_time: ['thời gian phản hồi', 'thoi gian phan hoi', 'response time', 'first response time', 'frt', 'resolution time', 'thời gian giải quyết', 'handle time', 'aht', 'wait time'],
  satisfaction: ['hài lòng', 'hai long', 'satisfaction', 'csat', 'nps', 'customer satisfaction', 'điểm hài lòng', 'mức độ hài lòng', 'feedback score', 'review score'],
  duration: ['thời gian xử lý', 'thoi gian xu ly', 'processing time', 'lead time', 'cycle time', 'duration', 'turnaround time', 'tat', 'thời gian thực hiện', 'thời gian giao hàng', 'delivery time'],
  hours: ['số giờ', 'so gio', 'hours', 'hours worked', 'giờ làm', 'gio lam', 'man hours', 'work hours', 'giờ công', 'overtime hours', 'giờ tăng ca'],
  margin: ['biên lợi nhuận', 'bien loi nhuan', 'margin', 'margin pct', 'gross margin', 'tỷ suất lợi nhuận', 'ty suat loi nhuan', 'profit margin', 'margin rate'],
  customer: [
    'khách hàng', 'khach hang', 'customer', 'client', 'buyer', 'account', 'tên khách hàng', 'ten khach hang', 'customer name',
    'mã khách hàng', 'ma khach hang', 'customer id', 'kh', 'đối tác', 'doi tac', 'partner', 'người mua', 'consignee', 'dealer',
    'đại lý', 'dai ly', 'company', 'công ty', 'account name', 'shop', 'tên kh', 'ma kh',
  ],
  product: [
    'sản phẩm', 'san pham', 'product', 'item', 'sku', 'goods', 'hàng hóa', 'hang hoa', 'mặt hàng', 'mat hang', 'tên sản phẩm',
    'ten san pham', 'product name', 'mã sản phẩm', 'ma san pham', 'product id', 'item name', 'mã hàng', 'ma hang', 'tên hàng',
    'ten hang', 'model', 'article', 'service', 'dịch vụ', 'sp', 'gói', 'package', 'vật tư', 'vat tu', 'material',
  ],
  category: ['danh mục', 'danh muc', 'category', 'loại', 'loai', 'nhóm', 'nhom', 'nhóm hàng', 'nhom hang', 'product category', 'product line', 'ngành hàng', 'nganh hang', 'segment', 'phân khúc', 'type', 'class', 'brand', 'thương hiệu', 'khoản mục', 'cost category', 'hạng mục'],
  region: ['khu vực', 'khu vuc', 'vùng', 'vung', 'region', 'area', 'territory', 'miền', 'mien', 'tỉnh', 'tinh', 'tỉnh thành', 'province', 'city', 'thành phố', 'thanh pho', 'zone', 'market', 'thị trường', 'location region', 'địa bàn', 'country', 'quốc gia', 'state'],
  branch: ['chi nhánh', 'chi nhanh', 'branch', 'store', 'cửa hàng', 'cua hang', 'location', 'outlet', 'showroom', 'điểm bán', 'diem ban', 'site', 'plant', 'nhà máy', 'nha may', 'factory', 'office', 'văn phòng', 'store name', 'cn'],
  salesperson: [
    'nhân viên sale', 'nhan vien sale', 'salesperson', 'sales rep', 'seller', 'account manager', 'nhân viên kinh doanh', 'nhan vien kinh doanh',
    'nvkd', 'sales person', 'sales staff', 'người bán', 'nguoi ban', 'sales executive', 'rep', 'owner', 'sale', 'sales agent',
    'tư vấn viên', 'tu van vien', 'người phụ trách', 'nguoi phu trach', 'phụ trách', 'am', 'agent',
  ],
  status: ['trạng thái', 'trang thai', 'status', 'stage', 'state', 'tình trạng', 'tinh trang', 'order status', 'deal stage', 'kết quả', 'ket qua', 'outcome', 'pipeline stage', 'tt'],
  department: ['phòng ban', 'phong ban', 'department', 'team', 'division', 'bộ phận', 'bo phan', 'phòng', 'phong', 'khối', 'khoi', 'unit', 'dept', 'cost center', 'trung tâm chi phí', 'ban'],
  channel: ['kênh', 'kenh', 'channel', 'source', 'nguồn', 'nguon', 'kênh bán', 'kenh ban', 'sales channel', 'medium', 'platform', 'nền tảng', 'utm source', 'lead source', 'traffic source', 'kênh bán hàng'],
  campaign: ['chiến dịch', 'chien dich', 'campaign', 'campaign name', 'ad set', 'adset', 'ad group', 'promotion name', 'chương trình', 'chuong trinh'],
  machine: ['máy', 'may', 'machine', 'equipment', 'thiết bị', 'thiet bi', 'asset', 'mã máy', 'ma may', 'machine id', 'tool', 'robot'],
  line: ['dây chuyền', 'day chuyen', 'line', 'production line', 'chuyền', 'chuyen', 'xưởng', 'xuong', 'workshop', 'cell', 'work center'],
  shift: ['ca', 'ca làm việc', 'ca lam viec', 'shift', 'ca sản xuất', 'ca lam', 'work shift', 'kíp', 'kip'],
  employee: ['nhân viên', 'nhan vien', 'employee', 'staff', 'headcount', 'họ tên', 'ho ten', 'họ và tên', 'ho va ten', 'employee name', 'employee id', 'mã nhân viên', 'ma nhan vien', 'worker', 'công nhân', 'cong nhan', 'operator', 'người lao động', 'full name', 'name', 'tên', 'ten', 'msnv', 'nv'],
  position: ['chức danh', 'chuc danh', 'position', 'title', 'job title', 'chức vụ', 'chuc vu', 'vị trí', 'vi tri', 'role', 'level', 'cấp bậc', 'grade'],
  supplier: ['nhà cung cấp', 'nha cung cap', 'supplier', 'vendor', 'ncc', 'provider', 'nguồn hàng', 'manufacturer', 'nhà sản xuất'],
  warehouse: ['kho', 'warehouse', 'kho hàng', 'kho hang', 'depot', 'storage', 'distribution center', 'dc', 'mã kho', 'ma kho', 'bin'],
  ticket: ['ticket', 'ticket id', 'mã yêu cầu', 'ma yeu cau', 'case', 'case id', 'yêu cầu', 'yeu cau', 'incident', 'request id', 'phiếu', 'complaint', 'khiếu nại'],
  order_id: ['mã đơn hàng', 'ma don hang', 'order id', 'order no', 'order number', 'invoice', 'invoice no', 'số hóa đơn', 'so hoa don', 'transaction id', 'mã giao dịch', 'ma giao dich', 'đơn hàng', 'don hang', 'order', 'số chứng từ', 'so chung tu', 'receipt', 'bill no', 'po number', 'mã hóa đơn', 'ma hoa don', 'hóa đơn', 'hoa don', 'mã vận đơn', 'ma van don', 'vận đơn', 'van don', 'tracking', 'tracking number', 'waybill', 'shipment id'],
}

/** Abbreviations frequently used in Vietnamese business sheets. Lower confidence than full aliases. */
export const ABBREVIATIONS: Record<string, Role> = {
  dt: 'revenue', ds: 'revenue', tt: 'revenue', sl: 'quantity', kh: 'customer', sp: 'product', cn: 'branch', nv: 'employee', nvkd: 'salesperson',
  cp: 'cost', ln: 'profit', ck: 'discount', gv: 'cost', dg: 'price', nsx: 'date', nct: 'date', hd: 'order_id', mh: 'product', ncc: 'supplier',
  qty: 'quantity', amt: 'revenue', rev: 'revenue', cust: 'customer', prod: 'product', reg: 'region', dept: 'department', emp: 'employee',
  sal: 'salary', inv: 'inventory', pl: 'profit', kv: 'region',
}

/** Words that signal a planned / budget variant of a measure ("Doanh thu kế hoạch"). */
export const PLAN_MODIFIERS = ['ke hoach', 'muc tieu', 'chi tieu', 'target', 'plan', 'planned', 'quota', 'budget', 'ngan sach', 'du toan', 'forecast', 'du bao', 'goal', 'kh']
/** Words that signal an actual variant. */
export const ACTUAL_MODIFIERS = ['thuc te', 'thuc hien', 'actual', 'th', 'thuc dat', 'dat duoc', 'achieved']

/** Words that indicate a column is a code / identifier rather than a name. */
export const ID_MODIFIERS = ['ma', 'id', 'code', 'so', 'no', 'number', 'stt', 'key']

export function countAliases(): number {
  let n = 0
  for (const list of Object.values(FIELD_ALIASES)) n += list?.length ?? 0
  return n + Object.keys(ABBREVIATIONS).length
}
