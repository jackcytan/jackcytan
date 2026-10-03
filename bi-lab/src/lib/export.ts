/** Local exports (CSV / XLSX). Files are generated in the browser and saved directly — nothing is uploaded. */
import type { Analysis } from '@/types/analysis'
import type { Lang } from '@/types/core'
import { formatValue } from './format'
import { insightText, insightTitle } from '@/intelligence/insights/insightEngine'

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  // neutralise spreadsheet formula injection
  if (/^[=+\-@]/.test(s)) s = "'" + s
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function summaryRows(a: Analysis, lang: Lang): { sheet: string; rows: (string | number)[][] }[] {
  const vi = lang === 'vi'
  const kpi: (string | number)[][] = [[vi ? 'KPI' : 'KPI', vi ? 'Giá trị' : 'Value', vi ? 'Hiển thị' : 'Formatted', vi ? 'Kỳ gần nhất' : 'Latest period', vi ? 'Kỳ trước' : 'Previous', vi ? 'Thay đổi' : 'Change', vi ? 'Công thức' : 'Formula']]
  for (const k of a.kpis) kpi.push([k.name[lang], k.value, formatValue(k.value, k.format, { lang }), k.current ?? '', k.previous ?? '', k.change ?? '', k.formula])
  const ins: (string | number)[][] = [[vi ? 'Mức độ' : 'Severity', vi ? 'Tiêu đề' : 'Title', vi ? 'Nội dung' : 'Detail', 'Rule']]
  for (const i of a.insights) ins.push([i.severity, insightTitle(i, lang), insightText(i, lang), i.ruleId])
  const an: (string | number)[][] = [[vi ? 'Chỉ số' : 'Metric', vi ? 'Thời điểm / nhóm' : 'When / group', vi ? 'Thực tế' : 'Actual', vi ? 'Kỳ vọng thấp' : 'Expected low', vi ? 'Kỳ vọng cao' : 'Expected high', vi ? 'Độ lệch' : 'Deviation', vi ? 'Mức độ' : 'Severity', vi ? 'Phương pháp' : 'Method']]
  for (const x of a.anomalies.anomalies) an.push([x.metricLabel[lang], x.label, x.actual, x.expectedLow, x.expectedHigh, x.deviation, x.severity, x.method])
  const health: (string | number)[][] = [[vi ? 'Thành phần' : 'Component', vi ? 'Điểm' : 'Score', vi ? 'Giải thích' : 'Explanation']]
  health.push([vi ? 'TỔNG' : 'OVERALL', a.health.score, a.health.summary[lang]])
  for (const c of a.health.components) health.push([c.name[lang], c.score, c.explanation[lang]])
  return [
    { sheet: 'KPI', rows: kpi },
    { sheet: 'Insights', rows: ins },
    { sheet: 'Anomalies', rows: an },
    { sheet: 'Health', rows: health },
  ]
}

export function exportSummaryCsv(a: Analysis, lang: Lang, name: string) {
  const parts = summaryRows(a, lang).map((s) => `# ${s.sheet}\n` + s.rows.map((r) => r.map(csvCell).join(',')).join('\n'))
  downloadBlob(new Blob(['﻿' + parts.join('\n\n')], { type: 'text/csv;charset=utf-8' }), `${name}-summary.csv`)
}

export async function exportSummaryXlsx(a: Analysis, lang: Lang, name: string) {
  const XLSX = await import('@e965/xlsx')
  const wb = XLSX.utils.book_new()
  for (const s of summaryRows(a, lang)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows.map((r) => r.map((v) => (typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v)))), s.sheet)
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${name}-summary.xlsx`)
}

export function safeFileName(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'bi-lab'
}
