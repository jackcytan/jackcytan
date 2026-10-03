import { describe, expect, it } from 'vitest'
import { buildDataset } from '@/intelligence/profiling/profiler'
import { aliasCount, detectFields, matchHeader } from '@/intelligence/semantic/detect'
import { detectDomain } from '@/intelligence/semantic/domain'
import type { Role } from '@/types/core'

describe('semantic header matching', () => {
  const cases: [string, Role][] = [
    ['Doanh thu', 'revenue'], ['doanhthu', 'revenue'], ['DOANH THU', 'revenue'], ['doanh_thu', 'revenue'], ['DoanhThu', 'revenue'], ['Net Sales', 'revenue'], ['GMV', 'revenue'], ['DT', 'revenue'],
    ['Ngày bán', 'date'], ['ngay', 'date'], ['Transaction Date', 'date'], ['Khách hàng', 'customer'], ['khach hang', 'customer'], ['Client', 'customer'],
    ['Sản phẩm', 'product'], ['SKU', 'product'], ['Số lượng', 'quantity'], ['qty', 'quantity'], ['Chi phí', 'cost'], ['COGS', 'cost'], ['Lợi nhuận', 'profit'],
    ['Khu vực', 'region'], ['Territory', 'region'], ['Chi nhánh', 'branch'], ['Store', 'branch'], ['Nhân viên kinh doanh', 'salesperson'], ['Sales Rep', 'salesperson'],
    ['Trạng thái', 'status'], ['Phòng ban', 'department'], ['Doanh thu kế hoạch', 'target'], ['Quota', 'target'], ['Ngân sách', 'budget'], ['Tồn kho', 'inventory'],
    ['defects', 'defect'], ['Thời gian dừng', 'downtime'], ['Lương', 'salary'], ['Payroll', 'salary'], ['Khách tiềm năng', 'lead'], ['Tỷ lệ chuyển đổi', 'conversion'],
    ['Mã đơn hàng', 'order_id'], ['Hoàn trả', 'returns'], ['Sản lượng kế hoạch', 'planned_output'], ['actual_output', 'output'], ['Chiến dịch', 'campaign'],
  ]
  for (const [h, role] of cases) {
    it(`"${h}" → ${role}`, () => {
      expect(matchHeader(h)[0]?.role).toBe(role)
    })
  }
  it('has 300+ aliases', () => {
    expect(aliasCount()).toBeGreaterThanOrEqual(300)
  })
})

describe('field detection uses types & values', () => {
  it('detects roles on a mixed dataset and resolves conflicts', () => {
    const rows = [
      ['Cột A', 'Ngày', 'DT', 'Khu vực', 'Notes'],
      ['x1', '01/03/2026', '1.200.000', 'Hà Nội', 'abc'],
      ['x2', '02/03/2026', '2.500.000', 'HCM', 'def'],
      ['x3', '15/03/2026', '900.000', 'Đà Nẵng', 'ghi'],
      ['x4', '20/03/2026', '3.100.000', 'Hà Nội', 'jkl'],
    ]
    const ds = buildDataset(rows, 0, { name: 't', source: 'upload' })
    const f = detectFields(ds)
    const by = Object.fromEntries(f.map((x) => [x.column, x.role]))
    expect(by['Ngày']).toBe('date')
    expect(by['DT']).toBe('revenue')
    expect(by['Khu vực']).toBe('region')
    expect(ds.num[ds.columns[2].key][1]).toBe(2_500_000)
  })
  it('value hints identify a region column with an unclear header', () => {
    const rows = [['Cột 1', 'Giá trị'], ...['Hà Nội', 'HCM', 'Đà Nẵng', 'Cần Thơ', 'Hà Nội', 'HCM'].map((v, i) => [v, i * 10])]
    const ds = buildDataset(rows as never, 0, { name: 't', source: 'upload' })
    expect(detectFields(ds)[0].role).toBe('region')
  })
})

describe('business context detection', () => {
  it('sales', () => expect(detectDomain(['revenue', 'customer', 'product', 'salesperson', 'date']).domain).toBe('sales'))
  it('manufacturing', () => expect(detectDomain(['machine', 'output', 'defect', 'downtime', 'date']).domain).toBe('manufacturing'))
  it('hr', () => expect(detectDomain(['employee', 'salary', 'department']).domain).toBe('hr'))
  it('marketing', () => expect(detectDomain(['spend', 'impressions', 'clicks', 'campaign']).domain).toBe('marketing'))
  it('finance', () => expect(detectDomain(['budget', 'actual', 'department', 'date']).domain).toBe('finance'))
  it('generic when unsure', () => expect(detectDomain(['other', 'other', 'status']).domain).toBe('generic'))
})
