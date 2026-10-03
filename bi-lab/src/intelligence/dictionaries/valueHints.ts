/**
 * Value-based hints: when a header is unclear (e.g. "Cột 3"), the values themselves can reveal the field.
 * All values are compared after normalization (no accents, lowercase).
 */
import type { Role } from '@/types/core'

export const REGION_VALUES = [
  'ha noi', 'hn', 'ho chi minh', 'hcm', 'tp hcm', 'tphcm', 'sai gon', 'da nang', 'hai phong', 'can tho', 'binh duong', 'dong nai',
  'khanh hoa', 'nha trang', 'hue', 'quang ninh', 'nghe an', 'thanh hoa', 'bac ninh', 'vung tau', 'ba ria vung tau', 'lam dong', 'da lat',
  'mien bac', 'mien trung', 'mien nam', 'mien tay', 'tay nguyen', 'bac', 'trung', 'nam', 'north', 'south', 'central', 'east', 'west',
  'northeast', 'northwest', 'southeast', 'southwest', 'apac', 'emea', 'americas', 'europe', 'asia', 'vietnam', 'viet nam', 'thailand',
  'singapore', 'indonesia', 'malaysia', 'philippines', 'japan', 'korea', 'china', 'usa', 'us', 'uk', 'long an', 'an giang', 'kien giang',
  'dong bang song cuu long', 'dbscl', 'ha nam', 'nam dinh', 'thai nguyen', 'phu tho', 'vinh phuc', 'hung yen', 'hai duong', 'quang nam',
  'quang ngai', 'binh dinh', 'gia lai', 'dak lak', 'tay ninh', 'binh phuoc', 'ca mau', 'bac lieu', 'soc trang', 'tien giang', 'ben tre',
]

export const STATUS_VALUES = [
  'completed', 'complete', 'done', 'closed', 'open', 'pending', 'cancelled', 'canceled', 'returned', 'refunded', 'shipped', 'delivered',
  'processing', 'in progress', 'won', 'lost', 'new', 'qualified', 'paid', 'unpaid', 'overdue', 'approved', 'rejected', 'draft',
  'hoan thanh', 'da giao', 'dang giao', 'da huy', 'huy', 'cho xu ly', 'dang xu ly', 'tra hang', 'thanh cong', 'that bai', 'moi',
  'da thanh toan', 'chua thanh toan', 'dong', 'mo', 'resolved', 'escalated', 'on time', 'late', 'delayed', 'dung han', 'tre han', 'active', 'inactive',
]

export const CHANNEL_VALUES = [
  'facebook', 'fb', 'google', 'google ads', 'tiktok', 'zalo', 'youtube', 'instagram', 'linkedin', 'email', 'sms', 'seo', 'organic', 'direct',
  'referral', 'shopee', 'lazada', 'tiki', 'website', 'web', 'online', 'offline', 'retail', 'wholesale', 'b2b', 'b2c', 'store', 'app',
  'telesales', 'affiliate', 'display', 'search', 'social', 'partner', 'event', 'hotline', 'chat', 'phone',
]

export const SHIFT_VALUES = ['ca 1', 'ca 2', 'ca 3', 'ca sang', 'ca chieu', 'ca dem', 'morning', 'afternoon', 'night', 'day', 'a', 'b', 'c', 'shift a', 'shift b', 'shift c']

export const DEPARTMENT_VALUES = [
  'sales', 'marketing', 'hr', 'nhan su', 'ke toan', 'accounting', 'finance', 'tai chinh', 'it', 'cong nghe', 'operations', 'van hanh',
  'san xuat', 'production', 'kinh doanh', 'hanh chinh', 'admin', 'legal', 'phap che', 'logistics', 'kho', 'r d', 'rd', 'cskh', 'customer service',
  'mua hang', 'purchasing', 'qa', 'qc', 'chat luong', 'ban giam doc', 'management',
]

export const VALUE_HINTS: { role: Role; values: string[]; minShare: number }[] = [
  { role: 'region', values: REGION_VALUES, minShare: 0.6 },
  { role: 'status', values: STATUS_VALUES, minShare: 0.6 },
  { role: 'channel', values: CHANNEL_VALUES, minShare: 0.6 },
  { role: 'shift', values: SHIFT_VALUES, minShare: 0.8 },
  { role: 'department', values: DEPARTMENT_VALUES, minShare: 0.6 },
]

/** status values considered as negative outcomes (cancel/return/lost) */
export const NEGATIVE_STATUS = ['cancel', 'huy', 'return', 'tra hang', 'refund', 'hoan', 'lost', 'that bai', 'failed', 'rejected', 'tu choi']
export const RETURN_STATUS = ['return', 'tra hang', 'refund', 'hoan tra', 'hoan tien']
export const CANCEL_STATUS = ['cancel', 'huy']
export const POSITIVE_STATUS = ['complete', 'hoan thanh', 'done', 'delivered', 'da giao', 'won', 'thanh cong', 'paid', 'da thanh toan', 'closed won', 'resolved', 'closed', 'success', 'dung han', 'on time']
export const LATE_STATUS = ['late', 'delay', 'tre', 'overdue', 'qua han', 'breach']
