/**
 * DETERMINISTIC DEMO DATA GENERATOR
 * Seeded PRNG (mulberry32) → identical datasets on every run. Data is generated at runtime, so the
 * bundle ships no large demo files. Each demo embeds realistic patterns (seasonality, a declining
 * segment, a spike, concentration) so every engine has something real to find.
 * Generated rows go through the SAME parser/profiler/semantic pipeline as uploaded files.
 */
import type { L10n } from '@/types/core'
import type { Cell } from '@/intelligence/profiling/profiler'

export type DemoId = 'executive' | 'sales' | 'retail' | 'finance' | 'hr' | 'manufacturing' | 'operations' | 'marketing'

export interface DemoMeta {
  id: DemoId
  name: L10n
  description: L10n
  rowsHint: number
  headersLang: 'vi' | 'vi-noaccent' | 'en'
}

export const DEMOS: DemoMeta[] = [
  { id: 'executive', name: { vi: 'Executive Demo', en: 'Executive Demo' }, description: { vi: 'Toàn cảnh doanh nghiệp đa chi nhánh: doanh thu, giá vốn, mục tiêu.', en: 'Multi-branch company overview: revenue, COGS, targets.' }, rowsHint: 2600, headersLang: 'en' },
  { id: 'sales', name: { vi: 'Sales Demo', en: 'Sales Demo' }, description: { vi: 'Đơn hàng B2B theo khách hàng, sản phẩm, khu vực và nhân viên kinh doanh.', en: 'B2B orders by customer, product, region and salesperson.' }, rowsHint: 2400, headersLang: 'vi' },
  { id: 'retail', name: { vi: 'Retail Demo', en: 'Retail Demo' }, description: { vi: 'Chuỗi cửa hàng bán lẻ, tiêu đề tiếng Việt không dấu, số định dạng VN.', en: 'Retail chain with unaccented Vietnamese headers and VN number formats.' }, rowsHint: 3000, headersLang: 'vi-noaccent' },
  { id: 'finance', name: { vi: 'Finance Demo', en: 'Finance Demo' }, description: { vi: 'Ngân sách và thực chi theo phòng ban, hạng mục trong 24 tháng.', en: 'Budget vs actual by department and category over 24 months.' }, rowsHint: 864, headersLang: 'en' },
  { id: 'hr', name: { vi: 'HR Demo', en: 'HR Demo' }, description: { vi: 'Nhân sự theo tháng: lương, chuyên cần, hiệu suất, phòng ban.', en: 'Monthly workforce records: salary, attendance, performance.' }, rowsHint: 1680, headersLang: 'vi' },
  { id: 'manufacturing', name: { vi: 'Manufacturing Demo', en: 'Manufacturing Demo' }, description: { vi: 'Sản lượng, lỗi, thời gian dừng theo dây chuyền, máy và ca.', en: 'Output, defects and downtime by line, machine and shift.' }, rowsHint: 2700, headersLang: 'en' },
  { id: 'operations', name: { vi: 'Operations Demo', en: 'Operations Demo' }, description: { vi: 'Vận hành giao nhận: thời gian xử lý, đúng hạn, chi phí theo chi nhánh.', en: 'Fulfilment operations: processing time, on-time, cost by hub.' }, rowsHint: 2500, headersLang: 'vi' },
  { id: 'marketing', name: { vi: 'Marketing Demo', en: 'Marketing Demo' }, description: { vi: 'Hiệu quả kênh & chiến dịch: chi phí, hiển thị, nhấp, lead, đơn, doanh thu.', en: 'Channel & campaign performance: spend, impressions, clicks, leads, orders, revenue.' }, rowsHint: 1440, headersLang: 'en' },
]

// ---------------------------------------------------------------- PRNG
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class R {
  private r: () => number
  constructor(seed: number) {
    this.r = mulberry32(seed)
  }
  next() {
    return this.r()
  }
  int(a: number, b: number) {
    return Math.floor(a + this.r() * (b - a + 1))
  }
  range(a: number, b: number) {
    return a + this.r() * (b - a)
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.r() * arr.length)]
  }
  weighted<T>(arr: readonly T[], w: readonly number[]): T {
    const total = w.reduce((s, x) => s + x, 0)
    let x = this.r() * total
    for (let i = 0; i < arr.length; i++) {
      x -= w[i]
      if (x <= 0) return arr[i]
    }
    return arr[arr.length - 1]
  }
  normal(mu = 0, sd = 1) {
    const u = Math.max(1e-9, this.r())
    const v = this.r()
    return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  chance(p: number) {
    return this.r() < p
  }
}

const DAY = 86400000
/** Fixed anchor so demos are identical on every run: data ends 30 Sep 2026. */
export const DEMO_END = Date.UTC(2026, 8, 30)

const iso = (t: number) => new Date(t).toISOString().slice(0, 10)
const dmy = (t: number) => {
  const d = new Date(t)
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
}
const monthIndex = (t: number) => {
  const d = new Date(t)
  return d.getUTCFullYear() * 12 + d.getUTCMonth()
}
const END_M = monthIndex(DEMO_END)
const round = (v: number, step = 1000) => Math.round(v / step) * step
const season = (t: number, amp = 0.12) => 1 + amp * Math.sin(((new Date(t).getUTCMonth() + 1) / 12) * 2 * Math.PI - 1.2)
const vnNum = (v: number) => Math.round(v).toLocaleString('de-DE') // 1.250.000

function weights(n: number, skew: number): number[] {
  return Array.from({ length: n }, (_, i) => 1 / Math.pow(i + 1, skew))
}

// ---------------------------------------------------------------- generators
function sales(r: R): Cell[][] {
  const head = ['Ngày', 'Mã đơn hàng', 'Khách hàng', 'Sản phẩm', 'Khu vực', 'Nhân viên kinh doanh', 'Số lượng', 'Doanh thu', 'Chi phí', 'Lợi nhuận', 'Trạng thái']
  const customers = ['Công ty Minh Phát', 'Tập đoàn Hòa Bình', 'Siêu thị An Khang', 'Công ty Đại Việt', 'TNHH Thành Công', 'Nhà phân phối Sao Mai', 'Công ty Phú Gia', 'Đại lý Kim Long', 'Công ty Tân Thịnh', 'Chuỗi Bách Hóa Xanh Lá', 'Công ty Hưng Thịnh', 'TNHH Việt Á', 'Công ty Bảo Tín', 'Đại lý Nam Phong', 'Công ty Ánh Dương', 'TNHH Lộc Phát', 'Công ty Trường Sơn', 'Đại lý Hoàng Gia', 'Công ty Quang Minh', 'TNHH An Phú', 'Công ty Thiên Long', 'Đại lý Phương Nam', 'Công ty Đông Á', 'TNHH Hải Âu', 'Công ty Vạn Xuân', 'Đại lý Hồng Hà', 'Công ty Sông Đà', 'TNHH Mê Kông', 'Công ty Tây Bắc', 'Đại lý Cửu Long', 'Công ty Ngọc Lan', 'TNHH Kim Cương', 'Công ty Hòa Phát Mới', 'Đại lý Bình Minh', 'Công ty Lam Sơn', 'TNHH Tiến Đạt', 'Công ty Hùng Vương', 'Đại lý Phú Quý', 'Công ty Nhật Tân', 'TNHH Thăng Long']
  const products = ['Sản phẩm A — Máy lọc nước', 'Sản phẩm B — Máy lọc không khí', 'Sản phẩm C — Bình nóng lạnh', 'Sản phẩm D — Quạt điều hòa', 'Sản phẩm E — Nồi chiên', 'Sản phẩm F — Robot hút bụi', 'Sản phẩm G — Máy sấy', 'Sản phẩm H — Bếp từ', 'Sản phẩm I — Lò vi sóng', 'Sản phẩm J — Máy xay']
  const price = [8_500_000, 6_200_000, 4_300_000, 3_100_000, 2_400_000, 9_800_000, 3_600_000, 5_200_000, 2_900_000, 1_400_000]
  const margin = [0.32, 0.28, 0.22, 0.18, 0.25, 0.35, 0.2, 0.26, 0.15, 0.3]
  const regions = ['Miền Bắc', 'Miền Trung', 'Miền Nam', 'Tây Nguyên', 'Đồng bằng sông Cửu Long']
  const reps = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Thu Dung', 'Hoàng Minh Đức', 'Vũ Ngọc Hà', 'Đặng Quốc Huy', 'Bùi Thanh Lan']
  const statuses = ['Hoàn thành', 'Hoàn thành', 'Hoàn thành', 'Hoàn thành', 'Hoàn thành', 'Hoàn thành', 'Đang giao', 'Đã hủy', 'Trả hàng']
  const rows: Cell[][] = [head]
  const start = Date.UTC(2025, 3, 1)
  const days = Math.round((DEMO_END - start) / DAY)
  const cw = weights(customers.length, 1.15)
  const pw = weights(products.length, 0.7)
  let id = 10000
  for (let i = 0; i < 2400; i++) {
    const t = start + r.int(0, days) * DAY
    const m = monthIndex(t)
    const region = r.weighted(regions, [3, 1.6, 3.4, 0.8, 1.2])
    const pi = products.indexOf(r.weighted(products, pw))
    let qty = Math.max(1, Math.round(r.range(2, 40) * season(t) * (1 + (END_M - m < 6 ? 0.04 * (6 - (END_M - m)) : 0))))
    // Product A grows strongly in the last 4 months
    if (pi === 0 && END_M - m < 4) qty = Math.round(qty * 1.6)
    // Southern region slump in the latest month
    if (region === 'Miền Nam' && m === END_M) qty = Math.max(1, Math.round(qty * 0.55))
    const unit = price[pi] * r.range(0.93, 1.05)
    const revenue = round(qty * unit)
    // cost pressure in the last month
    const cm = margin[pi] - (m === END_M ? 0.05 : 0) + r.normal(0, 0.02)
    const cost = round(revenue * (1 - cm))
    const st = r.pick(statuses)
    rows.push([dmy(t), `DH${id++}`, r.weighted(customers, cw), products[pi], r.chance(0.012) ? null : region, r.pick(reps), qty, revenue, cost, revenue - cost, st])
  }
  // a spike day (large tender) and a few exact duplicates for data-quality realism
  rows.push([dmy(DEMO_END - 70 * DAY), 'DH99001', 'Tập đoàn Hòa Bình', products[5], 'Miền Bắc', 'Trần Thị Bình', 420, 4_116_000_000, 2_675_400_000, 1_440_600_000, 'Hoàn thành'])
  for (let i = 0; i < 9; i++) rows.push([...rows[1 + r.int(0, 2000)]])
  return rows
}

function executive(r: R): Cell[][] {
  const head = ['Order Date', 'Branch', 'Region', 'Product Category', 'Customer', 'Units', 'Revenue', 'COGS', 'Revenue Target']
  const branches: [string, string, number][] = [['Hanoi Flagship', 'North', 1.5], ['Hai Phong', 'North', 0.8], ['Da Nang', 'Central', 0.9], ['Nha Trang', 'Central', 0.5], ['HCMC District 1', 'South', 1.8], ['HCMC Thu Duc', 'South', 1.2], ['Can Tho', 'South', 0.7], ['Binh Duong', 'South', 0.9]]
  const cats = ['Enterprise Software', 'Cloud Services', 'Hardware', 'Professional Services', 'Training', 'Support Contracts']
  const catP = [180e6, 95e6, 140e6, 120e6, 35e6, 60e6]
  const catM = [0.55, 0.48, 0.18, 0.35, 0.6, 0.62]
  const customers = Array.from({ length: 60 }, (_, i) => `Client ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) + 1 : ''} Corp`)
  const cw = weights(customers.length, 1.25)
  const rows: Cell[][] = [head]
  const startM = END_M - 23
  for (let mi = startM; mi <= END_M; mi++) {
    const y = Math.floor(mi / 12)
    const mo = mi % 12
    const daysIn = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate()
    const growth = 1 + (mi - startM) * 0.018
    const n = 100 + r.int(-8, 8)
    for (let k = 0; k < n; k++) {
      const t = Date.UTC(y, mo, r.int(1, daysIn))
      const [br, reg, bw] = r.weighted(branches, branches.map((b) => b[2]))
      const ci = r.int(0, cats.length - 1)
      const units = r.int(1, 6)
      let rev = catP[ci] * units * r.range(0.7, 1.3) * season(t, 0.1) * growth * (bw > 1.4 ? 1.1 : 1)
      // latest month: revenue drop and cost increase in the South → cost pressure
      if (mi === END_M) rev *= reg === 'South' ? 0.72 : 0.94
      let m = catM[ci] + r.normal(0, 0.03)
      if (mi >= END_M - 1) m -= 0.06
      const target = rev / r.range(0.95, 1.08) * (mi === END_M ? 1.25 : 1)
      rows.push([iso(t), br, reg, cats[ci], r.weighted(customers, cw), units, round(rev, 10000), round(rev * (1 - m), 10000), round(target, 10000)])
    }
  }
  return rows
}

function retail(r: R): Cell[][] {
  const head = ['Ngay ban', 'Ma hoa don', 'Cua hang', 'Danh muc', 'San pham', 'So luong', 'Don gia', 'Chiet khau', 'Doanh thu', 'So luong tra']
  const stores = ['CH Quan 1', 'CH Quan 3', 'CH Thu Duc', 'CH Go Vap', 'CH Cau Giay', 'CH Hoan Kiem', 'CH Long Bien', 'CH Hai Chau']
  const catalog: [string, string, number][] = [
    ['Thoi trang', 'Ao so mi nam', 450000], ['Thoi trang', 'Vay cong so', 650000], ['Thoi trang', 'Quan jean', 520000], ['Thoi trang', 'Ao thun basic', 199000],
    ['Giay dep', 'Giay the thao', 1250000], ['Giay dep', 'Sandal nu', 390000], ['Phu kien', 'Tui xach', 890000], ['Phu kien', 'That lung da', 350000],
    ['Phu kien', 'Kinh mat', 420000], ['My pham', 'Son moi', 280000], ['My pham', 'Kem duong', 540000], ['My pham', 'Nuoc hoa', 1650000],
  ]
  const rows: Cell[][] = [head]
  const start = DEMO_END - 182 * DAY
  const sw = [1.6, 1.1, 1.3, 0.9, 1.4, 1.2, 0.8, 0.7]
  for (let i = 0; i < 3000; i++) {
    const t = start + r.int(0, 182) * DAY
    const store = r.weighted(stores, sw)
    const [cat, prod, p] = r.pick(catalog)
    const dow = new Date(t).getUTCDay()
    let qty = Math.max(1, Math.round(r.range(1, 4) * (dow === 0 || dow === 6 ? 1.5 : 1)))
    if (store === 'CH Long Bien' && t > DEMO_END - 30 * DAY) qty = Math.max(1, Math.round(qty * 0.5))
    const disc = r.chance(0.35) ? round(p * qty * r.pick([0.1, 0.15, 0.2, 0.3]), 1000) : 0
    const rev = p * qty - disc
    const ret = cat === 'Giay dep' && r.chance(0.12) ? 1 : r.chance(0.02) ? 1 : 0
    rows.push([dmy(t), `HD${200000 + i}`, store, cat, prod, qty, vnNum(p), vnNum(disc), vnNum(rev), ret])
  }
  return rows
}

function finance(r: R): Cell[][] {
  const head = ['Month', 'Department', 'Category', 'Revenue', 'Expense', 'Budget', 'Actual']
  const depts: [string, number][] = [['Sales', 3], ['Marketing', 1.6], ['Operations', 2.4], ['IT', 1.2], ['HR', 0.6], ['Finance', 0.5]]
  const cats = ['Personnel', 'Software & Tools', 'Travel', 'Facilities', 'Outsourcing', 'Advertising']
  const rows: Cell[][] = [head]
  for (let mi = END_M - 23; mi <= END_M; mi++) {
    const y = Math.floor(mi / 12)
    const mo = mi % 12
    const t = Date.UTC(y, mo, 1)
    for (const [d, w] of depts) {
      for (const c of cats) {
        if (c === 'Advertising' && d !== 'Marketing' && d !== 'Sales') continue
        const budget = w * 120e6 * (c === 'Personnel' ? 3 : c === 'Outsourcing' ? 1.2 : 0.6) * (1 + (mi - END_M + 23) * 0.01)
        let actual = budget * r.range(0.86, 1.06)
        if (d === 'Marketing' && mi === END_M) actual *= 1.6
        if (d === 'IT' && c === 'Software & Tools' && mi >= END_M - 5) actual *= 1.25
        const revenue = d === 'Sales' ? budget * r.range(3.2, 3.8) * season(t) : d === 'Marketing' ? budget * r.range(0.6, 0.9) : 0
        rows.push([iso(t), d, c, round(revenue, 100000), round(actual, 100000), round(budget, 100000), round(actual, 100000)])
      }
    }
  }
  return rows
}

function hr(r: R): Cell[][] {
  const head = ['Tháng', 'Mã NV', 'Họ tên', 'Phòng ban', 'Chức danh', 'Lương', 'Tỷ lệ chuyên cần', 'Điểm hiệu suất', 'Ngày vào làm']
  const depts: [string, number, number][] = [['Kinh doanh', 38, 18e6], ['Sản xuất', 52, 11e6], ['Kỹ thuật', 18, 24e6], ['Kế toán', 8, 16e6], ['Nhân sự', 6, 15e6], ['Marketing', 10, 19e6]]
  const positions = ['Nhân viên', 'Nhân viên', 'Nhân viên', 'Chuyên viên', 'Trưởng nhóm', 'Quản lý']
  const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương']
  const dem = ['Văn', 'Thị', 'Minh', 'Ngọc', 'Quốc', 'Thanh', 'Hoàng', 'Thu', 'Đức', 'Gia']
  const ten = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hùng', 'Khánh', 'Linh', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Tuấn', 'Vy', 'Yến', 'Long']
  const emps: { id: string; name: string; dept: string; pos: string; base: number; hire: number; perf: number; att: number }[] = []
  let n = 1
  for (const [d, count, sal] of depts) {
    for (let i = 0; i < count; i++) {
      const pos = r.pick(positions)
      const mult = pos === 'Quản lý' ? 2.2 : pos === 'Trưởng nhóm' ? 1.6 : pos === 'Chuyên viên' ? 1.25 : 1
      emps.push({ id: `NV${String(n++).padStart(4, '0')}`, name: `${r.pick(ho)} ${r.pick(dem)} ${r.pick(ten)}`, dept: d, pos, base: round(sal * mult * r.range(0.85, 1.2), 100000), hire: DEMO_END - r.int(60, 3200) * DAY, perf: Math.min(5, Math.max(1.5, r.normal(3.6, 0.55))), att: Math.min(1, Math.max(0.82, r.normal(0.965, 0.025))) })
    }
  }
  const rows: Cell[][] = [head]
  for (let mi = END_M - 11; mi <= END_M; mi++) {
    const y = Math.floor(mi / 12)
    const mo = mi % 12
    for (const e of emps) {
      if (e.hire > Date.UTC(y, mo + 1, 0)) continue
      let att = e.att + r.normal(0, 0.012)
      if (e.dept === 'Sản xuất') att -= mi === END_M ? 0.09 : 0.012
      const perf = e.perf + r.normal(0, 0.15)
      const salary = round(e.base * (mi === END_M ? 1.06 : 1), 100000)
      rows.push([`${String(mo + 1).padStart(2, '0')}/${y}`, e.id, e.name, e.dept, e.pos, salary, Math.round(Math.min(1, att) * 1000) / 10 + '%', Math.round(Math.min(5, perf) * 10) / 10, dmy(e.hire)])
    }
  }
  return rows
}

function manufacturing(r: R): Cell[][] {
  const head = ['date', 'line', 'machine', 'product', 'shift', 'operator', 'planned_output', 'actual_output', 'defects', 'downtime_min']
  const lines: [string, string[]][] = [['Line 1', ['M-01', 'M-02']], ['Line 2', ['M-03', 'M-04']], ['Line 3', ['M-05', 'M-06']]]
  const products = ['Bottle 500ml', 'Bottle 1.5L', 'Can 330ml', 'Pouch 250ml']
  const shifts = ['Shift A', 'Shift B', 'Shift C']
  const rows: Cell[][] = [head]
  const start = DEMO_END - 149 * DAY
  for (let d = 0; d < 150; d++) {
    const t = start + d * DAY
    const recent = DEMO_END - t < 10 * DAY
    for (const [line, machines] of lines) {
      for (const m of machines) {
        for (const s of shifts) {
          const planned = 2400 + (line === 'Line 3' ? 300 : 0)
          let downtime = Math.max(0, r.normal(18, 9))
          if (m === 'M-04' && recent) downtime += r.range(70, 130)
          if (r.chance(0.01)) downtime += r.range(120, 240)
          const efficiency = Math.max(0.6, 1 - downtime / 480 - Math.abs(r.normal(0, 0.03)) - (s === 'Shift C' ? 0.03 : 0))
          const actual = Math.round(planned * efficiency)
          let dr = Math.max(0.002, r.normal(0.014, 0.004))
          if (line === 'Line 2' && recent) dr += 0.018
          if (s === 'Shift C') dr += 0.004
          rows.push([iso(t), line, m, r.pick(products), s, `OP-${line.slice(-1)}${shifts.indexOf(s) + 1}${machines.indexOf(m)}`, planned, actual, Math.round(actual * dr), Math.round(downtime)])
        }
      }
    }
  }
  return rows
}

function operations(r: R): Cell[][] {
  const head = ['Ngày tạo', 'Mã vận đơn', 'Chi nhánh', 'Kênh', 'Thời gian xử lý (giờ)', 'Trạng thái', 'Chi phí', 'Doanh thu']
  const hubs = ['Hub Hà Nội', 'Hub Đà Nẵng', 'Hub TP.HCM', 'Hub Cần Thơ', 'Hub Hải Phòng']
  const channels = ['Website', 'Shopee', 'Lazada', 'TikTok Shop', 'B2B']
  const rows: Cell[][] = [head]
  const start = DEMO_END - 120 * DAY
  for (let i = 0; i < 2500; i++) {
    const t = start + r.int(0, 120) * DAY
    const hub = r.weighted(hubs, [1.4, 0.7, 1.8, 0.6, 0.8])
    let hours = Math.max(2, r.normal(26, 8))
    if (hub === 'Hub Đà Nẵng' && DEMO_END - t < 12 * DAY) hours *= 1.7
    const late = hours > 42 || r.chance(0.04)
    const status = r.chance(0.025) ? 'Đã hủy' : late ? 'Trễ hạn' : 'Đúng hạn'
    const rev = round(r.range(150000, 2_400_000), 1000)
    rows.push([dmy(t), `VD${500000 + i}`, hub, r.weighted(channels, [1, 1.6, 1.1, 1.3, 0.5]), Math.round(hours * 10) / 10, status, round(rev * r.range(0.12, 0.22) + hours * 900, 1000), rev])
  }
  return rows
}

function marketing(r: R): Cell[][] {
  const head = ['date', 'channel', 'campaign', 'spend', 'impressions', 'clicks', 'leads', 'orders', 'revenue']
  const camps: [string, string, number, number, number][] = [
    // channel, campaign, cpm, ctr, conv-to-lead
    ['Facebook Ads', 'FB — Back to School', 52000, 0.012, 0.09],
    ['Facebook Ads', 'FB — Retargeting', 70000, 0.021, 0.14],
    ['Google Ads', 'Google — Search Brand', 95000, 0.06, 0.12],
    ['Google Ads', 'Google — Search Generic', 88000, 0.032, 0.07],
    ['TikTok Ads', 'TikTok — Creator Collab', 38000, 0.009, 0.05],
    ['Zalo Ads', 'Zalo — OA Promotion', 45000, 0.011, 0.06],
    ['Email', 'Email — Loyalty', 8000, 0.035, 0.16],
    ['Display', 'Display — Awareness', 25000, 0.0035, 0.03],
  ]
  const rows: Cell[][] = [head]
  const start = DEMO_END - 179 * DAY
  for (let d = 0; d < 180; d++) {
    const t = start + d * DAY
    for (const [ch, cp, cpm, ctr, cvl] of camps) {
      const late = DEMO_END - t < 12 * DAY
      let spend = r.range(2.5e6, 9e6) * (ch === 'Email' ? 0.2 : 1) * season(t, 0.08)
      if (cp.includes('Generic') && late) spend *= 1.5
      const impr = Math.round((spend / cpm) * 1000 * r.range(0.85, 1.15))
      const clicks = Math.round(impr * ctr * r.range(0.8, 1.2))
      const leads = Math.round(clicks * cvl * r.range(0.7, 1.3) * (cp.includes('Generic') && late ? 0.6 : 1))
      const orders = Math.round(leads * r.range(0.18, 0.32))
      rows.push([iso(t), ch, cp, round(spend), impr, clicks, leads, orders, round(orders * r.range(330000, 720000) * (ch === 'Display' ? 0.6 : 1))])
    }
  }
  return rows
}

const GEN: Record<DemoId, (r: R) => Cell[][]> = { executive, sales, retail, finance, hr, manufacturing, operations, marketing }
const SEEDS: Record<DemoId, number> = { executive: 20260101, sales: 1337, retail: 4242, finance: 777, hr: 31415, manufacturing: 2718, operations: 9001, marketing: 8080 }

export function generateDemo(id: DemoId): Cell[][] {
  return GEN[id](new R(SEEDS[id]))
}

/** Synthetic sales-like dataset of arbitrary size for performance tests. */
export function generateSynthetic(rowsCount: number, seed = 99): Cell[][] {
  const r = new R(seed)
  const head = ['Date', 'Order ID', 'Customer', 'Product', 'Region', 'Branch', 'Salesperson', 'Quantity', 'Revenue', 'Cost', 'Status']
  const rows: Cell[][] = [head]
  const start = DEMO_END - 730 * DAY
  const custW = weights(400, 1.05)
  const customers = Array.from({ length: 400 }, (_, i) => `Customer ${i + 1}`)
  const products = Array.from({ length: 80 }, (_, i) => `SKU-${1000 + i}`)
  const regions = ['North', 'Central', 'South', 'Highlands', 'Mekong']
  const branches = Array.from({ length: 20 }, (_, i) => `Branch ${i + 1}`)
  const reps = Array.from({ length: 30 }, (_, i) => `Rep ${i + 1}`)
  for (let i = 0; i < rowsCount; i++) {
    const t = start + r.int(0, 730) * DAY
    const q = r.int(1, 20)
    const rev = round(q * r.range(150000, 2500000))
    rows.push([iso(t), `O${i}`, r.weighted(customers, custW), r.pick(products), r.pick(regions), r.pick(branches), r.pick(reps), q, rev, round(rev * r.range(0.6, 0.85)), r.chance(0.05) ? 'Cancelled' : 'Completed'])
  }
  return rows
}
