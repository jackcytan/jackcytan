/**
 * DATA QUALITY ENGINE — 25 checks across completeness, validity, consistency and uniqueness.
 * Every issue reports the affected count and a concrete recommendation.
 */
import type { Dataset, L10n, Mapping, Role } from '@/types/core'
import type { QualityIssue, QualityReport } from '@/types/analysis'
import type { TimeIndex } from '../analysis/time'
import { ROLE_META } from '../dictionaries/roles'
import { fmtPercent } from '@/lib/format'

export const QUALITY_CHECKS = [
  'DQ01 missing values', 'DQ02 empty columns', 'DQ03 duplicate rows', 'DQ04 duplicate headers', 'DQ05 ambiguous numbers (needs review)',
  'DQ06 invalid numbers', 'DQ07 invalid dates', 'DQ08 future dates', 'DQ09 ambiguous date format', 'DQ10 negative values in non-negative fields',
  'DQ11 extreme outliers', 'DQ12 inconsistent category spelling', 'DQ13 whitespace issues', 'DQ14 constant columns', 'DQ15 high-cardinality dimensions',
  'DQ16 total rows excluded', 'DQ17 profit ≠ revenue − cost', 'DQ18 revenue ≠ quantity × price', 'DQ19 time gaps', 'DQ20 small sample',
  'DQ21 no date column', 'DQ22 duplicate identifiers', 'DQ23 zero-heavy measures', 'DQ24 mixed currencies', 'DQ25 rates out of range',
]

const NON_NEGATIVE: Role[] = ['quantity', 'price', 'inventory', 'impressions', 'clicks', 'lead', 'output', 'planned_output', 'defect', 'downtime', 'salary', 'orders', 'hours', 'duration', 'response_time']

const L = (vi: string, en: string): L10n => ({ vi, en })

export function runQualityChecks(ds: Dataset, mapping: Mapping, time: TimeIndex | null): QualityReport {
  const issues: QualityIssue[] = []
  const n = ds.rowCount
  const cols = ds.columns
  const push = (i: QualityIssue) => issues.push(i)
  const sev = (pct: number, w = 0.05, warn = 0.2, crit = 0.5): QualityIssue['severity'] => (pct >= crit ? 'critical' : pct >= warn ? 'warning' : pct >= w ? 'watch' : 'info')

  let totalCells = 0
  let missingCells = 0
  let badCells = 0
  let typedCells = 0
  let consistencyPenalty = 0

  for (const c of cols) {
    totalCells += n
    missingCells += c.missing
    // DQ02 empty
    if (c.missing === n && n > 0) {
      push({ checkId: 'DQ02', severity: 'watch', column: c.name, affected: n, pct: 1, message: L(`Cột "${c.name}" hoàn toàn trống.`, `Column "${c.name}" is completely empty.`), recommendation: L('Xem xét loại bỏ cột này hoặc bổ sung dữ liệu.', 'Consider removing this column or filling it in.') })
      continue
    }
    // DQ01 missing
    if (c.missingPct >= 0.02) {
      push({ checkId: 'DQ01', severity: sev(c.missingPct), column: c.name, affected: c.missing, pct: c.missingPct, message: L(`${fmtPercent(c.missingPct, 1, 'vi')} dữ liệu trường "${c.name}" đang bị thiếu.`, `${fmtPercent(c.missingPct, 1, 'en')} of "${c.name}" values are missing.`), recommendation: L('Bổ sung giá trị thiếu hoặc xác nhận đây là dữ liệu không áp dụng.', 'Fill missing values or confirm they are not applicable.') })
    }
    if (c.storage === 'num') {
      typedCells += c.count + c.invalid + c.needsReview
      badCells += c.invalid + c.needsReview
    }
    // DQ05 needs review
    if (c.needsReview > 0) {
      push({ checkId: 'DQ05', severity: c.needsReview / n >= 0.05 ? 'warning' : 'watch', column: c.name, affected: c.needsReview, pct: c.needsReview / n, message: L(`${c.needsReview} giá trị trong "${c.name}" có định dạng số chưa rõ ràng (ví dụ: ${c.reviewSamples.slice(0, 3).join(', ')}). Đã giữ nguyên, không tự chuyển đổi.`, `${c.needsReview} values in "${c.name}" have ambiguous number formats (e.g. ${c.reviewSamples.slice(0, 3).join(', ')}). Kept as-is, not converted.`), recommendation: L('Kiểm tra quy ước dấu phân cách hàng nghìn / thập phân và chuẩn hóa cột này.', 'Check thousands / decimal separator conventions and standardise this column.') })
    }
    // DQ06 / DQ07 invalid
    if (c.invalid > 0) {
      const isDate = c.type === 'date'
      push({ checkId: isDate ? 'DQ07' : 'DQ06', severity: sev(c.invalid / n, 0.01, 0.05, 0.2), column: c.name, affected: c.invalid, pct: c.invalid / n, message: isDate ? L(`${c.invalid} giá trị ngày không hợp lệ trong "${c.name}".`, `${c.invalid} invalid dates in "${c.name}".`) : L(`${c.invalid} giá trị không phải số trong cột số "${c.name}".`, `${c.invalid} non-numeric values in numeric column "${c.name}".`), recommendation: L('Kiểm tra và sửa các ô lỗi trong tab Data Explorer (được đánh dấu Needs Review).', 'Review and fix flagged cells in the Data Explorer (marked Needs Review).') })
    }
    // DQ08 future dates
    if (c.futureDates) {
      push({ checkId: 'DQ08', severity: 'watch', column: c.name, affected: c.futureDates, pct: c.futureDates / n, message: L(`${c.futureDates} ngày trong "${c.name}" nằm ở tương lai.`, `${c.futureDates} dates in "${c.name}" are in the future.`), recommendation: L('Xác nhận đây là kế hoạch / dự kiến hay lỗi nhập liệu.', 'Confirm whether these are planned dates or entry errors.') })
    }
    // DQ09 ambiguous date format
    if (c.type === 'date' && c.dateFormat === 'dd/mm/yyyy*') {
      consistencyPenalty += 3
      push({ checkId: 'DQ09', severity: 'info', column: c.name, affected: c.count, pct: 1, message: L(`Không có ngày nào > 12 trong "${c.name}" để phân biệt ngày/tháng; hệ thống giả định dd/mm/yyyy.`, `No day > 12 in "${c.name}" to distinguish day/month; dd/mm/yyyy was assumed.`), recommendation: L('Kiểm tra lại định dạng ngày nếu dữ liệu dùng mm/dd/yyyy.', 'Double-check the date format if your data uses mm/dd/yyyy.') })
    }
    // DQ10 negatives
    const role = mapping[c.key]
    if (role && NON_NEGATIVE.includes(role) && c.negativeCount > 0) {
      typedCells += 0
      badCells += c.negativeCount
      push({ checkId: 'DQ10', severity: sev(c.negativeCount / n, 0.005, 0.03, 0.1), column: c.name, affected: c.negativeCount, pct: c.negativeCount / n, message: L(`${c.negativeCount} giá trị âm trong "${c.name}" (${ROLE_META[role].label.vi}).`, `${c.negativeCount} negative values in "${c.name}" (${ROLE_META[role].label.en}).`), recommendation: L('Xác nhận đây là điều chỉnh / hoàn trả hợp lệ hay lỗi dấu.', 'Confirm whether these are valid adjustments / returns or sign errors.') })
    }
    // DQ11 outliers
    if (c.storage === 'num' && c.type !== 'date' && c.count > 20 && c.outlierCount / c.count >= 0.01) {
      push({ checkId: 'DQ11', severity: 'info', column: c.name, affected: c.outlierCount, pct: c.outlierCount / c.count, message: L(`${c.outlierCount} giá trị cực trị trong "${c.name}" (ngoài 3×IQR).`, `${c.outlierCount} extreme values in "${c.name}" (beyond 3×IQR).`), recommendation: L('Kiểm tra các giá trị này trong mục Bất thường trước khi kết luận.', 'Review these values in Anomalies before drawing conclusions.') })
    }
    // DQ12 inconsistent categories
    if (c.storage === 'str' && (c.inconsistentVariants ?? 0) > 0) {
      consistencyPenalty += Math.min(12, (c.inconsistentVariants ?? 0) * 2)
      push({ checkId: 'DQ12', severity: 'watch', column: c.name, affected: c.inconsistentVariants ?? 0, pct: (c.inconsistentVariants ?? 0) / Math.max(1, c.unique), message: L(`"${c.name}" có ${c.inconsistentVariants} giá trị viết khác nhau cho cùng một nhóm (hoa/thường, dấu, khoảng trắng).`, `"${c.name}" has ${c.inconsistentVariants} spelling variants of the same group (case, accents, spacing).`), recommendation: L('Chuẩn hóa cách viết để các nhóm không bị tách rời khi tổng hợp.', 'Standardise spelling so groups are not split during aggregation.') })
    }
    // DQ13 whitespace
    if ((c.whitespaceIssues ?? 0) > 0) {
      consistencyPenalty += Math.min(4, ((c.whitespaceIssues ?? 0) / n) * 20)
      push({ checkId: 'DQ13', severity: 'info', column: c.name, affected: c.whitespaceIssues ?? 0, pct: (c.whitespaceIssues ?? 0) / n, message: L(`${c.whitespaceIssues} giá trị trong "${c.name}" có khoảng trắng thừa (đã tự làm sạch khi phân tích).`, `${c.whitespaceIssues} values in "${c.name}" had extra whitespace (trimmed for analysis).`), recommendation: L('Làm sạch khoảng trắng tại nguồn dữ liệu.', 'Trim whitespace at the data source.') })
    }
    // DQ14 constant
    if (c.count > 10 && c.unique === 1) {
      push({ checkId: 'DQ14', severity: 'info', column: c.name, affected: c.count, pct: 1, message: L(`"${c.name}" chỉ có một giá trị duy nhất.`, `"${c.name}" has a single constant value.`), recommendation: L('Cột này không giúp phân tích so sánh; có thể bỏ qua.', 'This column adds no comparative value; it can be ignored.') })
    }
    // DQ15 high cardinality dimension
    if (role && ROLE_META[role].kind === 'dimension' && c.unique > 1000 && c.unique / Math.max(1, c.count) > 0.6) {
      push({ checkId: 'DQ15', severity: 'info', column: c.name, affected: c.unique, pct: c.unique / Math.max(1, c.count), message: L(`"${c.name}" có ${c.unique} giá trị khác nhau — có thể là mã định danh hơn là nhóm.`, `"${c.name}" has ${c.unique} distinct values — possibly an identifier rather than a grouping.`), recommendation: L('Kiểm tra lại vai trò của cột trong màn hình Mapping.', 'Double-check this column\'s role on the Mapping screen.') })
    }
    // DQ22 duplicate identifiers
    if (c.type === 'id' && c.unique < c.count && (role === 'ticket' || role === 'other')) {
      const d = c.count - c.unique
      push({ checkId: 'DQ22', severity: 'watch', column: c.name, affected: d, pct: d / c.count, message: L(`${d} mã trùng lặp trong cột định danh "${c.name}".`, `${d} duplicate values in identifier column "${c.name}".`), recommendation: L('Kiểm tra bản ghi trùng hoặc dòng chi tiết của cùng một mã.', 'Check for duplicate records or multiple lines of the same ID.') })
    }
    // DQ23 zero heavy
    if (role && ROLE_META[role].kind === 'measure' && c.count > 20 && c.zeroCount / c.count > 0.6 && role !== 'returns' && role !== 'defect' && role !== 'downtime' && role !== 'discount') {
      push({ checkId: 'DQ23', severity: 'info', column: c.name, affected: c.zeroCount, pct: c.zeroCount / c.count, message: L(`${fmtPercent(c.zeroCount / c.count, 0, 'vi')} giá trị của "${c.name}" bằng 0.`, `${fmtPercent(c.zeroCount / c.count, 0, 'en')} of "${c.name}" values are zero.`), recommendation: L('Xác nhận số 0 là thật hay là dữ liệu chưa được ghi nhận.', 'Confirm whether zeros are real or unrecorded data.') })
    }
    // DQ25 rates out of range
    if (role && (role === 'conversion' || role === 'attendance') && c.max !== undefined && c.max > 100) {
      push({ checkId: 'DQ25', severity: 'watch', column: c.name, affected: c.count, pct: 1, message: L(`"${c.name}" có giá trị > 100, không phù hợp với một tỷ lệ.`, `"${c.name}" has values > 100, which is unusual for a rate.`), recommendation: L('Kiểm tra lại đơn vị của cột hoặc đổi vai trò trong Mapping.', 'Check the unit of this column or change its role in Mapping.') })
    }
  }
  // DQ03 duplicates
  if (ds.duplicateRows > 0) {
    const p = ds.duplicateRows / Math.max(1, n)
    push({ checkId: 'DQ03', severity: sev(p, 0.005, 0.03, 0.15), affected: ds.duplicateRows, pct: p, message: L(`Có ${ds.duplicateRows} dòng trùng lặp hoàn toàn.`, `There are ${ds.duplicateRows} fully duplicated rows.`), recommendation: L('Xác nhận các dòng trùng có phải giao dịch lặp hợp lệ hay lỗi xuất dữ liệu.', 'Confirm whether duplicates are valid repeated transactions or export errors.') })
  }
  // DQ04 duplicate headers
  if (ds.duplicateHeaders.length) {
    consistencyPenalty += 4
    push({ checkId: 'DQ04', severity: 'watch', affected: ds.duplicateHeaders.length, pct: ds.duplicateHeaders.length / cols.length, message: L(`Tiêu đề cột bị trùng: ${ds.duplicateHeaders.join(', ')} (đã tự đánh số).`, `Duplicate column headers: ${ds.duplicateHeaders.join(', ')} (numbered automatically).`), recommendation: L('Đặt tên cột duy nhất tại file nguồn.', 'Use unique column names in the source file.') })
  }
  // DQ16 total rows
  const tw = ds.warnings.find((w) => w.startsWith('total_rows_excluded:'))
  if (tw) {
    const cnt = Number(tw.split(':')[1])
    push({ checkId: 'DQ16', severity: 'info', affected: cnt, pct: cnt / Math.max(1, n), message: L(`Đã loại ${cnt} dòng "Tổng cộng" để tránh tính trùng.`, `Excluded ${cnt} "Total" rows to avoid double counting.`), recommendation: L('Không cần thao tác — chỉ để minh bạch.', 'No action needed — shown for transparency.') })
  }
  // DQ17 profit consistency
  const keyOf = (r: Role) => Object.keys(mapping).find((k) => mapping[k] === r)
  const rk = keyOf('revenue')
  const ck = keyOf('cost')
  const pk = keyOf('profit')
  if (rk && ck && pk) {
    const r = ds.num[rk]
    const c = ds.num[ck]
    const p = ds.num[pk]
    let mism = 0
    let cnt = 0
    for (let i = 0; i < n; i++) {
      if (r[i] === r[i] && c[i] === c[i] && p[i] === p[i]) {
        cnt++
        if (Math.abs(r[i] - c[i] - p[i]) > Math.max(1, Math.abs(r[i]) * 0.01)) mism++
      }
    }
    if (cnt && mism / cnt > 0.05) {
      consistencyPenalty += Math.min(10, (mism / cnt) * 20)
      push({ checkId: 'DQ17', severity: 'watch', affected: mism, pct: mism / cnt, message: L(`${mism} dòng có Lợi nhuận khác Doanh thu − Chi phí (sai lệch > 1%).`, `${mism} rows where Profit differs from Revenue − Cost (by > 1%).`), recommendation: L('Kiểm tra định nghĩa lợi nhuận (có thể đã trừ thêm chi phí khác).', 'Check the profit definition (other costs may be deducted).') })
    }
  }
  // DQ18 revenue vs qty × price
  const qk = keyOf('quantity')
  const prk = keyOf('price')
  if (rk && qk && prk) {
    const r = ds.num[rk]
    const q = ds.num[qk]
    const pr = ds.num[prk]
    let mism = 0
    let cnt = 0
    for (let i = 0; i < n; i++) {
      if (r[i] === r[i] && q[i] === q[i] && pr[i] === pr[i] && r[i] > 0) {
        cnt++
        if (Math.abs(q[i] * pr[i] - r[i]) / r[i] > 0.25) mism++
      }
    }
    if (cnt && mism / cnt > 0.1) {
      consistencyPenalty += Math.min(8, (mism / cnt) * 10)
      push({ checkId: 'DQ18', severity: 'info', affected: mism, pct: mism / cnt, message: L(`${mism} dòng có Doanh thu lệch > 25% so với Số lượng × Đơn giá (có thể do chiết khấu).`, `${mism} rows where Revenue deviates > 25% from Quantity × Price (possibly discounts).`), recommendation: L('Xác nhận doanh thu đã bao gồm chiết khấu / thuế hay chưa.', 'Confirm whether revenue includes discounts / tax.') })
    }
  }
  // DQ19 time gaps
  if (time) {
    const counts = new Int32Array(time.info.periods.length)
    for (let i = 0; i < time.rowPeriod.length; i++) if (time.rowPeriod[i] >= 0) counts[time.rowPeriod[i]]++
    let gaps = 0
    for (let i = 0; i < counts.length; i++) if (counts[i] === 0) gaps++
    if (gaps > 0 && time.info.granularity !== 'day') {
      consistencyPenalty += Math.min(10, gaps * 2)
      push({ checkId: 'DQ19', severity: gaps / counts.length > 0.2 ? 'warning' : 'watch', affected: gaps, pct: gaps / counts.length, message: L(`${gaps} kỳ trong khoảng thời gian không có dữ liệu.`, `${gaps} periods within the date range have no data.`), recommendation: L('Kiểm tra dữ liệu có bị thiếu kỳ khi xuất file hay không.', 'Check whether periods are missing from the export.') })
    }
    if (time.info.partialLast) {
      push({ checkId: 'DQ19', severity: 'info', affected: 1, pct: 0, message: L(`Kỳ cuối (${time.info.periods[time.info.periods.length - 1].label}) chưa đầy đủ nên không dùng để so sánh tăng trưởng.`, `The last period (${time.info.periods[time.info.periods.length - 1].label}) is incomplete and excluded from growth comparisons.`), recommendation: L('Không cần thao tác — so sánh dùng kỳ đầy đủ gần nhất.', 'No action needed — comparisons use the latest complete period.') })
    }
  } else {
    push({ checkId: 'DQ21', severity: 'info', affected: 0, pct: 0, message: L('Không tìm thấy cột ngày hợp lệ — phân tích xu hướng, tăng trưởng và dự báo không khả dụng.', 'No valid date column found — trend, growth and projection analysis are unavailable.'), recommendation: L('Thêm cột ngày giao dịch hoặc gán vai trò "Ngày" trong Mapping.', 'Add a transaction date column or assign the "Date" role in Mapping.') })
  }
  // DQ20 small sample
  if (n < 30) {
    push({ checkId: 'DQ20', severity: 'watch', affected: n, pct: 1, message: L(`Chỉ có ${n} dòng dữ liệu — các kết luận thống kê có độ tin cậy thấp.`, `Only ${n} rows — statistical conclusions have low reliability.`), recommendation: L('Bổ sung thêm dữ liệu lịch sử nếu có.', 'Add more historical data if available.') })
  }
  // DQ24 mixed currencies
  const cur = new Set(cols.map((c) => c.currency).filter(Boolean))
  if (cur.size > 1) {
    consistencyPenalty += 8
    push({ checkId: 'DQ24', severity: 'warning', affected: cur.size, pct: 0, message: L('Phát hiện cả VND và USD trong dữ liệu.', 'Both VND and USD were detected in the data.'), recommendation: L('Quy đổi về một đơn vị tiền tệ trước khi so sánh.', 'Convert to a single currency before comparing.') })
  }

  const completeness = totalCells ? Math.round(100 * (1 - missingCells / totalCells)) : 0
  const uniqueness = n ? Math.round(100 * Math.max(0, 1 - (ds.duplicateRows / n) * 3)) : 0
  const validity = typedCells ? Math.round(100 * Math.max(0, 1 - (badCells / typedCells) * 4)) : 100
  const consistency = Math.round(Math.max(0, 100 - consistencyPenalty))
  const score = n ? Math.round(completeness * 0.35 + validity * 0.25 + consistency * 0.2 + uniqueness * 0.2) : 0
  const rank = { critical: 4, warning: 3, watch: 2, info: 1 }
  issues.sort((a, b) => rank[b.severity] - rank[a.severity] || b.pct - a.pct)
  return { score, completeness, consistency, uniqueness, validity, issues, checksRun: QUALITY_CHECKS.length }
}
