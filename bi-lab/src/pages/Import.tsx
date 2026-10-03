import { useCallback, useMemo, useRef, useState } from 'react'
import { m } from 'motion/react'
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Compass, FileSpreadsheet, Layers, Loader2, PlayCircle, RotateCcw, ShieldCheck, Table2, Upload, Wand2 } from 'lucide-react'
import { navigate, setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { STAGES, buildFromDraft, importFile, reanalyze, ACCEPTED_EXT } from '@/app/actions'
import type { ErrorCode, StageId } from '@/workers/protocol'
import type { Domain, Mapping, Role } from '@/types/core'
import { Badge, Button, Card, CardHeader, PageHeader, ProgressBar, Select, cx } from '@/components/ui/primitives'
import { fmtBytes, fmtDate, fmtNumber } from '@/lib/format'
import { ALL_ROLES, ROLE_META } from '@/intelligence/dictionaries/roles'
import { DOMAIN_LABELS, detectDomain } from '@/intelligence/semantic/domain'

function useStageLabels() {
  const { tr } = useT()
  return (s: StageId, detail?: string, a?: { kpis?: number; rules?: number }): string => {
    const n = detail && /^\d+$/.test(detail) ? Number(detail).toLocaleString() : null
    switch (s) {
      case 'read':
        return tr('Đọc file / workbook', 'Reading workbook')
      case 'parse':
        return tr('Phân tích cú pháp các dòng', 'Parsing rows')
      case 'detect':
        return n ? tr(`Nhận diện cột · ${n} dòng`, `Detecting columns · ${n} rows`) : tr('Nhận diện cột & trường nghiệp vụ', 'Detecting columns & business fields')
      case 'clean':
        return tr('Làm sạch & chuẩn hóa giá trị', 'Cleaning values')
      case 'metrics':
        return a?.kpis ? tr(`Tính ${a.kpis} KPI`, `Calculating ${a.kpis} KPIs`) : tr('Tính toán chỉ số KPI', 'Calculating metrics')
      case 'patterns':
        return a?.rules ? tr(`Chạy ${a.rules} kiểm tra nghiệp vụ & phát hiện bất thường`, `Running ${a.rules} business checks & detecting anomalies`) : tr('Phát hiện xu hướng & bất thường', 'Detecting patterns & anomalies')
      case 'dashboard':
        return tr('Xây dựng dashboard', 'Building dashboard')
    }
  }
}

const ERRORS: Record<ErrorCode, { vi: [string, string]; en: [string, string] }> = {
  corrupt: { vi: ['File bị hỏng hoặc không đúng định dạng', 'Mở file bằng Excel, chọn "Lưu thành" .xlsx hoặc .csv rồi thử lại.'], en: ['The file is corrupt or not a valid spreadsheet', 'Open it in Excel, "Save As" .xlsx or .csv, then try again.'] },
  empty: { vi: ['File không có dữ liệu', 'Kiểm tra lại sheet có chứa bảng dữ liệu, hoặc chọn một file khác.'], en: ['The file has no data', 'Make sure a sheet contains a data table, or choose another file.'] },
  unsupported: { vi: ['Định dạng chưa được hỗ trợ', 'Hỗ trợ: .xlsx, .xlsm, .xls, .csv, .tsv. Hãy xuất dữ liệu sang một trong các định dạng này.'], en: ['Unsupported format', 'Supported: .xlsx, .xlsm, .xls, .csv, .tsv. Export your data to one of these formats.'] },
  no_header: { vi: ['Không tìm thấy dòng tiêu đề', 'Chọn lại dòng tiêu đề trong bước xem trước, hoặc thêm tên cột vào dòng đầu tiên.'], en: ['No header row found', 'Pick the header row in the preview step, or add column names to the first row.'] },
  too_large: { vi: ['File quá lớn (> 200 MB)', 'Hãy lọc bớt dữ liệu hoặc chia thành nhiều file nhỏ hơn.'], en: ['File too large (> 200 MB)', 'Filter the data or split it into smaller files.'] },
  no_data: { vi: ['Không có dòng dữ liệu bên dưới tiêu đề', 'Kiểm tra dòng tiêu đề đã chọn có đúng không.'], en: ['No data rows below the header', 'Check that the selected header row is correct.'] },
  password: { vi: ['File được bảo vệ bằng mật khẩu', 'Gỡ mật khẩu trong Excel (File → Info → Protect Workbook) rồi tải lại.'], en: ['The file is password-protected', 'Remove the password in Excel (File → Info → Protect Workbook) and upload again.'] },
  single_column: { vi: ['Chỉ có một cột dữ liệu', 'Kiểm tra dấu phân cách CSV (dấu phẩy / chấm phẩy).'], en: ['Only one column detected', 'Check the CSV delimiter (comma / semicolon).'] },
  internal: { vi: ['Không thể xử lý file này', 'Thử lưu lại file dưới dạng .xlsx hoặc .csv. Dữ liệu của bạn chưa rời khỏi thiết bị.'], en: ['This file could not be processed', 'Try saving it again as .xlsx or .csv. Your data has not left this device.'] },
}

function ProcessingView() {
  const { tr, lang } = useT()
  const p = useStore((s) => s.processing)!
  const a = useStore((s) => s.analysis)
  const label = useStageLabels()
  if (p.error) {
    const e = ERRORS[p.error.code] ?? ERRORS.internal
    return (
      <Card className="mx-auto max-w-2xl p-8">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--negative)_12%,transparent)] text-negative">
            <AlertTriangle size={22} />
          </span>
          <div>
            <h2 className="text-[18px] font-semibold">{e[lang][0]}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{e[lang][1]}</p>
            <p className="mt-2 text-[12.5px] text-subtle">{tr('Tệp', 'File')}: {p.title}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" icon={RotateCcw} onClick={() => setState({ processing: null })}>{tr('Chọn file khác', 'Choose another file')}</Button>
              <Button icon={PlayCircle} onClick={() => { setState({ processing: null }); navigate('demo') }}>{tr('Dùng dữ liệu demo', 'Use demo data')}</Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }
  const overall = (p.done.length + p.stagePct) / STAGES.length
  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <div className="border-b border-line px-7 py-6">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
          <Loader2 size={14} className="spin-slow" /> Local Intelligence Engine
        </div>
        <h2 className="mt-2 truncate text-[20px] font-semibold">{p.title}</h2>
        <ProgressBar value={p.active ? overall : 1} className="mt-4" />
        <div className="mt-2 flex justify-between text-[12px] text-subtle">
          <span>{tr('Xử lý 100% trên thiết bị — không tải lên máy chủ', '100% on-device — nothing uploaded')}</span>
          <span className="tabular">{Math.round((p.active ? overall : 1) * 100)}%</span>
        </div>
      </div>
      <ol className="px-7 py-5">
        {STAGES.map((s, i) => {
          const done = p.done.includes(s) || !p.active
          const cur = p.active && p.stage === s
          return (
            <m.li key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 py-2.5">
              <span className={cx('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold', done ? 'border-transparent bg-[color-mix(in_srgb,var(--positive)_16%,transparent)] text-positive' : cur ? 'border-accent text-accent' : 'border-line text-subtle')}>
                {done ? <Check size={14} strokeWidth={3} /> : cur ? <Loader2 size={14} className="spin-slow" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">STEP {i + 1}</div>
                <div className={cx('text-[14.5px] font-medium', done || cur ? 'text-fg' : 'text-subtle')}>{label(s, cur ? p.detail : undefined, done && a ? { kpis: a.stats.kpisCalculated, rules: a.stats.rulesEvaluated } : undefined)}</div>
              </div>
              {cur && <span className="tabular text-[12px] text-muted">{Math.round(p.stagePct * 100)}%</span>}
            </m.li>
          )
        })}
      </ol>
      {!p.active && (
        <div className="flex items-center gap-2 border-t border-line px-7 py-4 text-[14px] font-semibold text-positive">
          <CheckCircle2 size={18} /> {tr('Hoàn tất', 'Complete')}
        </div>
      )}
    </Card>
  )
}

function Dropzone() {
  const { tr } = useT()
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const onFiles = useCallback((files: FileList | null) => {
    const f = files?.[0]
    if (f) importFile(f)
  }, [])
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onFiles(e.dataTransfer.files)
      }}
      className={cx('relative overflow-hidden rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all', over ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface hover:border-accent/60')}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative">
        <m.span animate={over ? { scale: 1.08, y: -3 } : { scale: 1, y: 0 }} className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent shadow-[0_10px_30px_-12px_var(--accent)]">
          <Upload size={28} strokeWidth={1.7} />
        </m.span>
        <h2 className="mt-5 text-[20px] font-semibold">{tr('Kéo & thả file Excel hoặc CSV vào đây', 'Drag & drop an Excel or CSV file here')}</h2>
        <p className="mt-2 text-[14px] text-muted">{tr('hoặc', 'or')}</p>
        <Button variant="primary" size="lg" icon={FileSpreadsheet} className="mt-3" onClick={() => input.current?.click()}>
          {tr('Chọn file từ máy', 'Choose a file')}
        </Button>
        <input ref={input} type="file" className="hidden" accept={ACCEPTED_EXT.map((e) => '.' + e).join(',')} onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} aria-label={tr('Chọn file', 'Choose file')} />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {['.xlsx', '.xlsm', '.xls', '.csv', '.tsv'].map((x) => (
            <Badge key={x}>{x}</Badge>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-subtle">
          <ShieldCheck size={14} className="text-positive" /> {tr('File được đọc ngay trong trình duyệt. Không tải lên máy chủ. Macro & công thức không được thực thi.', 'Files are read inside your browser. Nothing is uploaded. Macros & formulas are never executed.')}
        </p>
      </div>
    </div>
  )
}

function DraftConfig() {
  const { tr, lang } = useT()
  const d = useStore((s) => s.draft)!
  const sheet = d.sheets.find((s) => s.name === d.sheet) ?? d.sheets[0]
  const preview = sheet.preview
  const width = Math.min(12, Math.max(0, ...preview.map((r) => r.length)))
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><FileSpreadsheet size={21} /></span>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold">{d.fileName}</div>
              <div className="text-[12.5px] text-muted">{fmtBytes(d.size)} · {d.kind === 'csv' ? 'CSV' : 'Excel workbook'}</div>
            </div>
          </div>
          <div className="flex gap-8 text-[13px]">
            <div><div className="text-subtle">Sheets</div><div className="tabular font-semibold">{d.sheets.length}</div></div>
            <div><div className="text-subtle">{tr('Dòng', 'Rows')}</div><div className="tabular font-semibold">{fmtNumber(sheet.rowCount, 0, lang)}</div></div>
            <div><div className="text-subtle">{tr('Cột', 'Columns')}</div><div className="tabular font-semibold">{sheet.colCount}</div></div>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => setState({ draft: null })}>{tr('Hủy', 'Cancel')}</Button>
            <Button variant="primary" icon={Wand2} onClick={() => buildFromDraft()} disabled={sheet.rowCount === 0}>{tr('Phân tích dữ liệu', 'Analyze data')}</Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <Card className="h-fit p-5">
          {d.sheets.length > 1 && (
            <div className="mb-5">
              <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">Sheet</label>
              <Select className="w-full" value={d.sheet} onChange={(e) => { const s = d.sheets.find((x) => x.name === e.target.value)!; setState({ draft: { ...d, sheet: s.name, headerRow: s.headerGuess } }) }}>
                {d.sheets.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} ({fmtNumber(s.rowCount, 0, lang)})</option>
                ))}
              </Select>
            </div>
          )}
          <label className="mb-1.5 block text-[12.5px] font-semibold text-muted">{tr('Dòng tiêu đề (header)', 'Header row')}</label>
          <Select className="w-full" value={d.headerRow} onChange={(e) => setState({ draft: { ...d, headerRow: Number(e.target.value) } })}>
            {preview.slice(0, 25).map((r, i) => (
              <option key={i} value={i}>{tr('Dòng', 'Row')} {i + 1}: {r.filter(Boolean).slice(0, 3).join(' · ').slice(0, 40)}</option>
            ))}
          </Select>
          <p className="mt-2 text-[12.5px] leading-relaxed text-subtle">{tr(`Hệ thống đoán dòng ${sheet.headerGuess + 1} là tiêu đề. Nếu sai, chọn dòng khác hoặc bấm trực tiếp vào bảng xem trước.`, `Row ${sheet.headerGuess + 1} was detected as the header. If wrong, pick another row or click it in the preview.`)}</p>
          <div className="mt-5 rounded-xl border border-line bg-surface-2 p-3.5 text-[12.5px] leading-relaxed text-muted">
            <div className="mb-1 font-semibold text-fg">{tr('Tự động xử lý', 'Handled automatically')}</div>
            {tr('Ô trống, "--", "N/A" · số 1.000 / 1,000 / 1 000 · "10,5 triệu", "10 tỷ", "₫/VND/USD" · ngày dd/mm/yyyy, yyyy-mm-dd, số serial Excel · ô gộp · dòng "Tổng cộng".', 'Blanks, "--", "N/A" · numbers 1.000 / 1,000 / 1 000 · "10,5 triệu", "10 tỷ", "₫/VND/USD" · dates dd/mm/yyyy, yyyy-mm-dd, Excel serials · merged cells · "Total" rows.')}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader icon={Table2} title={tr('Xem trước', 'Preview')} subtitle={tr(`Hiển thị ${Math.min(preview.length, 30)} / ${fmtNumber(sheet.rowCount, 0, lang)} dòng đầu tiên`, `Previewing ${Math.min(preview.length, 30)} of ${fmtNumber(sheet.rowCount, 0, lang)} rows`)} />
          <div className="mt-4 max-h-[460px] overflow-auto border-t border-line">
            <table className="w-full border-collapse text-[12.5px]">
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} onClick={() => setState({ draft: { ...d, headerRow: i } })} className={cx('cursor-pointer border-b border-line', i === d.headerRow ? 'bg-accent-soft font-semibold text-fg' : i < d.headerRow ? 'text-subtle opacity-60' : 'hover:bg-surface-2')}>
                    <td className="tabular sticky left-0 w-10 bg-inherit px-3 py-2 text-subtle">{i + 1}</td>
                    {Array.from({ length: width }, (_, c) => (
                      <td key={c} className="max-w-[180px] truncate whitespace-nowrap px-3 py-2">{r[c] ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

const DOMAINS: Domain[] = ['sales', 'retail', 'finance', 'marketing', 'hr', 'manufacturing', 'operations', 'inventory', 'customer_service', 'generic']

function MappingScreen() {
  const { tr, lang, l } = useT()
  const ds = useStore((s) => s.dataset)!
  const fields = useStore((s) => s.fields)
  const current = useStore((s) => s.mapping)
  const analysis = useStore((s) => s.analysis)!
  const settings = useStore((s) => s.settings)
  const [draft, setDraft] = useState<Mapping>(current)
  const [domain, setDomain] = useState<Domain | 'auto'>(settings.domainOverride ?? 'auto')
  const detected = useMemo(() => detectDomain(Object.values(draft) as Role[]), [draft])
  const changed = JSON.stringify(draft) !== JSON.stringify(current) || (domain === 'auto' ? null : domain) !== settings.domainOverride
  const apply = async () => {
    if (changed) await reanalyze({ mapping: draft, settings: { domainOverride: domain === 'auto' ? null : domain } })
    setState({ showMapping: false })
    navigate('overview')
  }
  const roleOptions = ALL_ROLES
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Compass size={21} /></span>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">Detected Business Context</div>
              <div className="text-[17px] font-semibold">{l(DOMAIN_LABELS[detected.domain])} <span className="tabular text-muted">· {tr('Độ tin cậy', 'Confidence')} {Math.round(detected.confidence * 100)}%</span></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted">{tr('Đổi thủ công', 'Override')}</span>
            <Select value={domain} onChange={(e) => setDomain(e.target.value as Domain | 'auto')}>
              <option value="auto">{tr('Tự động', 'Automatic')}</option>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>{l(DOMAIN_LABELS[d])}</option>
              ))}
            </Select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => setDraft(current)} disabled={!changed}>{tr('Hoàn tác', 'Reset')}</Button>
            <Button variant="primary" icon={ArrowRight} onClick={apply}>{changed ? tr('Áp dụng & mở Command Center', 'Apply & open Command Center') : tr('Xác nhận & mở Command Center', 'Confirm & open Command Center')}</Button>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader icon={Layers} title={tr('Ánh xạ trường dữ liệu (Semantic Mapping)', 'Field mapping (Semantic Mapping)')} subtitle={tr(`${fields.filter((f) => f.role !== 'other').length}/${fields.length} cột đã được nhận diện. Đổi vai trò nếu hệ thống đoán chưa đúng — phân tích sẽ được tính lại.`, `${fields.filter((f) => f.role !== 'other').length}/${fields.length} columns recognised. Change a role if the guess is wrong — the analysis will be recalculated.`)} />
        <div className="mt-4 overflow-x-auto border-t border-line">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle">
                <th className="px-5 py-3 font-semibold">{tr('Cột', 'Column')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Giá trị mẫu', 'Sample values')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Kiểu', 'Type')}</th>
                <th className="px-3 py-3 font-semibold">{tr('Vai trò nghiệp vụ', 'Business role')}</th>
                <th className="px-5 py-3 font-semibold">{tr('Độ tin cậy', 'Confidence')}</th>
              </tr>
            </thead>
            <tbody>
              {ds.columns.map((c) => {
                const f = fields.find((x) => x.key === c.key)
                const role = draft[c.key] ?? 'other'
                const conf = f ? (role === f.role ? f.confidence : 1) : 0
                const allowed = roleOptions.filter((r) => ROLE_META[r].types.includes(c.type as never) || r === role || r === 'other')
                return (
                  <tr key={c.key} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-fg">{c.name}</div>
                      {c.needsReview > 0 && <Badge tone="warning" className="mt-1">Needs Review · {c.needsReview}</Badge>}
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-3 text-muted">{c.sample.slice(0, 3).map((v) => (c.type === 'date' ? fmtDate(Number(v), lang) : c.storage === 'num' ? fmtNumber(Number(v), 2, lang) : v)).join(' · ')}</td>
                    <td className="px-3 py-3"><Badge>{c.type}</Badge></td>
                    <td className="px-3 py-3">
                      <Select value={role} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value as Role })} aria-label={`${tr('Vai trò của', 'Role of')} ${c.name}`}>
                        {allowed.map((r) => (
                          <option key={r} value={r}>{ROLE_META[r].label[lang]}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={role === 'other' ? 0 : conf} tone={conf >= 0.8 ? 'positive' : conf >= 0.6 ? 'warning' : 'negative'} className="w-24" />
                        <span className="tabular w-10 text-[12px] text-muted">{role === 'other' ? '—' : `${Math.round(conf * 100)}%`}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[12.5px] text-subtle">{tr(`Phân tích hiện tại: ${analysis.stats.kpisCalculated} KPI, ${analysis.stats.rulesEvaluated} quy tắc được đánh giá, ${analysis.insights.length} insight.`, `Current analysis: ${analysis.stats.kpisCalculated} KPIs, ${analysis.stats.rulesEvaluated} rules evaluated, ${analysis.insights.length} insights.`)}</p>
    </div>
  )
}

export default function ImportPage() {
  const { tr } = useT()
  const processing = useStore((s) => s.processing)
  const draft = useStore((s) => s.draft)
  const showMapping = useStore((s) => s.showMapping)
  const ds = useStore((s) => s.dataset)
  let body
  if (processing) body = <ProcessingView />
  else if (draft && !showMapping) body = <DraftConfig />
  else if (showMapping && ds) body = <MappingScreen />
  else body = <Dropzone />
  return (
    <div>
      <PageHeader
        eyebrow="Import Wizard"
        title={showMapping ? tr('Xác nhận ánh xạ trường', 'Confirm field mapping') : tr('Nhập dữ liệu kinh doanh', 'Import business data')}
        subtitle={tr('Excel / CSV → nhận diện cấu trúc → làm sạch → KPI, insight và dashboard. Mọi bước chạy cục bộ.', 'Excel / CSV → structure detection → cleaning → KPIs, insights and dashboard. Every step runs locally.')}
        right={!processing && !draft && !showMapping && ds ? <Button icon={Layers} onClick={() => setState({ showMapping: true })}>{tr('Xem lại ánh xạ trường', 'Review field mapping')}</Button> : undefined}
      />
      {body}
      {!processing && !draft && !showMapping && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            [tr('Tiêu đề Việt / Anh', 'Vietnamese / English headers'), tr('"Doanh thu", "doanhthu", "DT", "Revenue", "GMV"… đều được nhận diện qua từ điển ngữ nghĩa 700+ bí danh.', '"Doanh thu", "doanhthu", "DT", "Revenue", "GMV"… are recognised via a 700+ alias semantic dictionary.')],
            [tr('Không đoán bừa', 'No silent guessing'), tr('Giá trị số không chắc chắn được giữ nguyên và đánh dấu "Needs Review" thay vì tự đổi.', 'Ambiguous numbers are kept as-is and flagged "Needs Review" instead of being changed.')],
            [tr('An toàn', 'Safe by design'), tr('Chỉ đọc giá trị ô. Không chạy macro/VBA, không thực thi công thức, không hiển thị HTML từ file.', 'Reads cell values only. No macros/VBA, no formula execution, no HTML from files.')],
          ].map(([t, d]) => (
            <Card key={t} className="p-5">
              <div className="text-[14px] font-semibold">{t}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{d}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
