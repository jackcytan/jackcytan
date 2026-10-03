import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  columnFilteringFeature, columnVisibilityFeature, createColumnHelper, createFilteredRowModel, createPaginatedRowModel, createSortedRowModel,
  filterFn_includesString, globalFilteringFeature, rowPaginationFeature, rowSortingFeature, sortFn_alphanumeric, sortFn_basic, tableFeatures, useTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Columns3, Eye, EyeOff, Info, Search, Table2, X } from 'lucide-react'
import { setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { Badge, Button, Card, PageHeader, ProgressBar, Select, cx } from '@/components/ui/primitives'
import { fmtDate, fmtNumber, formatValue } from '@/lib/format'
import type { ColumnProfile, Dataset } from '@/types/core'
import { ROLE_META } from '@/intelligence/dictionaries/roles'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature,
})
const helper = createColumnHelper<typeof features, { i: number }>()

function cellValue(ds: Dataset, c: ColumnProfile, row: number): string | number | null {
  if (c.storage === 'str') return ds.str[c.key][row]
  const v = ds.num[c.key][row]
  return v === v ? v : null
}

function Histogram({ ds, c }: { ds: Dataset; c: ColumnProfile }) {
  const bins = useMemo(() => {
    if (c.storage !== 'num' || c.min === undefined || c.max === undefined || c.min === c.max) return null
    const arr = ds.num[c.key]
    const n = 24
    const out = new Array(n).fill(0)
    const span = c.max - c.min
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (v === v) out[Math.min(n - 1, Math.floor(((v - c.min) / span) * n))]++
    }
    return out
  }, [ds, c])
  if (!bins) return null
  const mx = Math.max(...bins, 1)
  return (
    <div className="flex h-20 items-end gap-[2px]" aria-hidden>
      {bins.map((b, i) => (
        <div key={i} className="flex-1 rounded-t-sm bg-accent/70" style={{ height: `${Math.max(2, (b / mx) * 100)}%`, background: 'var(--accent)', opacity: 0.75 }} />
      ))}
    </div>
  )
}

function ColumnProfilePanel({ ds, c, onClose }: { ds: Dataset; c: ColumnProfile; onClose: () => void }) {
  const { tr, lang } = useT()
  const mapping = useStore((s) => s.mapping)
  const role = mapping[c.key]
  const f = (v: number | undefined) => (v === undefined ? '—' : c.type === 'date' ? fmtDate(v, lang) : formatValue(v, c.type === 'percent' ? 'percent' : 'number', { lang }))
  const Row = ({ k, v }: { k: string; v: ReactNode }) => (
    <div className="flex justify-between gap-3 border-b border-line py-2 text-[13px] last:border-0"><span className="text-muted">{k}</span><span className="tabular font-semibold">{v}</span></div>
  )
  return (
    <Card className="h-fit p-5 xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-accent">COLUMN PROFILE</div>
          <h3 className="mt-1 truncate text-[17px] font-semibold">{c.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{c.type}</Badge>
            {role && role !== 'other' && <Badge tone="accent">{ROLE_META[role].label[lang]}</Badge>}
            {c.needsReview > 0 && <Badge tone="warning">Needs Review · {c.needsReview}</Badge>}
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label={tr('Đóng', 'Close')}><X size={16} /></button>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[12px]"><span className="text-muted">{tr('Thiếu dữ liệu', 'Missing')}</span><span className="tabular font-semibold">{formatValue(c.missingPct, 'percent', { lang })}</span></div>
        <ProgressBar value={1 - c.missingPct} tone={c.missingPct > 0.2 ? 'negative' : c.missingPct > 0.05 ? 'warning' : 'positive'} />
      </div>
      <div className="mt-4">
        <Row k={tr('Giá trị hợp lệ', 'Valid values')} v={fmtNumber(c.count, 0, lang)} />
        <Row k={tr('Giá trị khác nhau', 'Unique values')} v={fmtNumber(c.unique, 0, lang)} />
        <Row k={tr('Thiếu', 'Missing')} v={`${fmtNumber(c.missing, 0, lang)} (${formatValue(c.missingPct, 'percent', { lang })})`} />
        {c.storage === 'num' && (
          <>
            <Row k="Min" v={f(c.min)} />
            <Row k="Max" v={f(c.max)} />
            {c.type !== 'date' && <Row k={tr('Trung bình', 'Average')} v={f(c.mean)} />}
            <Row k={tr('Trung vị', 'Median')} v={f(c.median)} />
            {c.type !== 'date' && <Row k={tr('Độ lệch chuẩn', 'Std. deviation')} v={f(c.std)} />}
            {c.type !== 'date' && <Row k={tr('Tổng', 'Sum')} v={f(c.sum)} />}
            {c.type !== 'date' && <Row k={tr('Giá trị âm / bằng 0', 'Negative / zero')} v={`${c.negativeCount} / ${c.zeroCount}`} />}
            {c.type !== 'date' && <Row k={tr('Cực trị (3×IQR)', 'Extreme (3×IQR)')} v={c.outlierCount} />}
            {c.dateFormat && <Row k={tr('Định dạng ngày', 'Date format')} v={c.dateFormat} />}
            {c.invalid > 0 && <Row k={tr('Không hợp lệ', 'Invalid')} v={c.invalid} />}
          </>
        )}
      </div>
      {c.storage === 'num' && c.type !== 'date' && (
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-semibold text-muted">{tr('Phân phối', 'Distribution')}</div>
          <Histogram ds={ds} c={c} />
        </div>
      )}
      {c.topValues && (
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-semibold text-muted">{tr('Giá trị phổ biến', 'Top values')}</div>
          <div className="space-y-1.5">
            {c.topValues.slice(0, 8).map((t) => (
              <div key={t.value}>
                <div className="flex justify-between gap-2 text-[12.5px]"><span className="truncate">{t.value}</span><span className="tabular text-muted">{fmtNumber(t.count, 0, lang)}</span></div>
                <ProgressBar value={t.count / (c.topValues![0].count || 1)} className="mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}
      {c.reviewSamples.length > 0 && (
        <p className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-3 text-[12.5px] text-muted">
          {tr('Giá trị chưa chắc chắn (giữ nguyên, không chuyển đổi): ', 'Uncertain values (kept as-is, not converted): ')}<b className="text-fg">{c.reviewSamples.join(', ')}</b>
        </p>
      )}
    </Card>
  )
}

export default function Explorer() {
  const { tr, lang } = useT()
  const ds = useStore((s) => s.dataset)!
  const selected = useStore((s) => s.explorerColumn)
  const [showCols, setShowCols] = useState(false)
  const data = useMemo(() => Array.from({ length: ds.rowCount }, (_, i) => ({ i })), [ds])
  const columns = useMemo(
    () =>
      helper.columns(
        ds.columns.map((c) =>
          helper.accessor((row: { i: number }) => cellValue(ds, c, row.i) as never, {
            id: c.key,
            header: c.name,
            sortFn: c.storage === 'num' ? 'basic' : 'alphanumeric',
            filterFn: 'includesString',
            sortUndefined: 'last',
          } as never),
        ) as never,
      ),
    [ds],
  )
  const table = useTable({
    features,
    data,
    columns: columns as never,
    initialState: { pagination: { pageIndex: 0, pageSize: 500 } },
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: () => true,
  } as never) as any
  const rows = table.getRowModel().rows as { id: string; original: { i: number } }[]
  const filteredCount = table.getFilteredRowModel().rows.length as number
  const scrollRef = useRef<HTMLDivElement>(null)
  const virt = useVirtualizer({ count: rows.length, getScrollElement: () => scrollRef.current, estimateSize: () => 37, overscan: 12 })
  const visibleCols = ds.columns.filter((c) => table.getColumn(c.key)?.getIsVisible())
  const selCol = ds.columns.find((c) => c.key === selected)
  const pageIndex = table.state.pagination.pageIndex as number
  const pageSize = table.state.pagination.pageSize as number
  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize))
  const large = ds.rowCount > 50000
  const renderCell = (c: ColumnProfile, row: number) => {
    const raw = ds.review[c.key]?.[row]
    const v = cellValue(ds, c, row)
    if (v === null && raw !== undefined)
      return (
        <span className="inline-flex items-center gap-1.5" title="Needs Review">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          <span className="text-warning">{raw}</span>
        </span>
      )
    if (v === null) return <span className="text-subtle">—</span>
    if (c.type === 'date') return fmtDate(v as number, lang, c.hasTime)
    if (typeof v === 'number') return formatValue(v, c.type === 'percent' ? 'percent' : 'number', { lang, compact: false })
    return v
  }
  return (
    <div>
      <PageHeader
        eyebrow="Data Explorer"
        icon={Table2}
        title={ds.name}
        subtitle={tr(`${fmtNumber(ds.rowCount, 0, lang)} dòng · ${ds.columns.length} cột · bấm tiêu đề để sắp xếp, bấm biểu tượng ⓘ để xem hồ sơ cột.`, `${fmtNumber(ds.rowCount, 0, lang)} rows · ${ds.columns.length} columns · click a header to sort, ⓘ for the column profile.`)}
        right={large ? <Badge tone="warning">Large Dataset Mode</Badge> : undefined}
      />
      <div className={cx('grid gap-5', selCol ? 'xl:grid-cols-[1fr_340px]' : '')}>
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
            <div className="relative min-w-[220px] flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input value={(table.state.globalFilter as string) ?? ''} onChange={(e) => table.setGlobalFilter(e.target.value)} placeholder={tr('Tìm trong toàn bộ dữ liệu…', 'Search all data…')} className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-3 text-[13px] outline-none focus:border-accent" aria-label={tr('Tìm kiếm', 'Search')} />
            </div>
            <div className="relative">
              <Button size="sm" icon={Columns3} onClick={() => setShowCols((v) => !v)} aria-expanded={showCols}>{tr('Cột', 'Columns')} ({visibleCols.length}/{ds.columns.length})</Button>
              {showCols && (
                <div className="absolute right-0 z-20 mt-2 max-h-80 w-64 overflow-auto rounded-xl border border-line bg-surface p-2 shadow-[var(--shadow-pop)]">
                  {ds.columns.map((c) => {
                    const col = table.getColumn(c.key)
                    const vis = col?.getIsVisible()
                    return (
                      <button key={c.key} onClick={() => col?.toggleVisibility()} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-2">
                        {vis ? <Eye size={14} className="text-accent" /> : <EyeOff size={14} className="text-subtle" />}
                        <span className={cx('truncate', !vis && 'text-subtle')}>{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <Select value={pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))} aria-label={tr('Số dòng mỗi trang', 'Rows per page')}>
              {[100, 500, 1000, 5000].map((n) => (
                <option key={n} value={n}>{fmtNumber(n, 0, lang)} / {tr('trang', 'page')}</option>
              ))}
            </Select>
          </div>
          <div ref={scrollRef} className="h-[620px] overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-[13px]" style={{ display: 'grid' }}>
              <thead className="sticky top-0 z-10" style={{ display: 'grid' }}>
                <tr style={{ display: 'flex' }}>
                  <th className="tabular w-16 shrink-0 border-b border-line bg-surface-2 px-3 py-2.5 text-left text-[11.5px] font-semibold text-subtle">#</th>
                  {visibleCols.map((c) => {
                    const col = table.getColumn(c.key)
                    const dir = col?.getIsSorted()
                    return (
                      <th key={c.key} className="w-44 shrink-0 border-b border-l border-line bg-surface-2 px-3 py-2 text-left">
                        <div className="flex items-center gap-1">
                          <button onClick={() => col?.toggleSorting()} className="flex min-w-0 flex-1 items-center gap-1 text-[12.5px] font-semibold text-fg" aria-label={`${tr('Sắp xếp', 'Sort')} ${c.name}`}>
                            <span className="truncate">{c.name}</span>
                            {dir === 'asc' ? <ArrowUp size={13} className="text-accent" /> : dir === 'desc' ? <ArrowDown size={13} className="text-accent" /> : null}
                          </button>
                          <button onClick={() => setState({ explorerColumn: c.key })} className={cx('rounded p-0.5 hover:bg-surface-3', selected === c.key ? 'text-accent' : 'text-subtle')} aria-label={`COLUMN PROFILE ${c.name}`}><Info size={13} /></button>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-normal text-subtle">
                          <span>{c.type}</span>
                          {c.missingPct > 0 && <span>· {formatValue(c.missingPct, 'percent', { lang })} {tr('trống', 'empty')}</span>}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody style={{ display: 'grid', height: virt.getTotalSize(), position: 'relative' }}>
                {virt.getVirtualItems().map((vi) => {
                  const r = rows[vi.index]
                  return (
                    <tr key={r.id} data-index={vi.index} className="hover:bg-surface-2" style={{ display: 'flex', position: 'absolute', transform: `translateY(${vi.start}px)`, width: '100%', height: 37 }}>
                      <td className="tabular w-16 shrink-0 border-b border-line px-3 py-2 text-[12px] text-subtle">{r.original.i + 1}</td>
                      {visibleCols.map((c) => (
                        <td key={c.key} className={cx('tabular w-44 shrink-0 truncate border-b border-l border-line px-3 py-2', c.storage === 'num' && c.type !== 'date' && 'text-right')}>{renderCell(c, r.original.i)}</td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!rows.length && <div className="p-10 text-center text-[14px] text-muted">{tr('Không có dòng phù hợp.', 'No matching rows.')}</div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[12.5px] text-muted">
            <span className="tabular">
              {tr('Hiển thị', 'Showing')} {fmtNumber(rows.length, 0, lang)} / {fmtNumber(filteredCount, 0, lang)} {tr('dòng khớp', 'matching rows')} · {tr('tổng', 'total')} {fmtNumber(ds.rowCount, 0, lang)}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" icon={ChevronLeft} disabled={pageIndex === 0} onClick={() => table.previousPage()}>{tr('Trước', 'Prev')}</Button>
              <span className="tabular">{pageIndex + 1} / {pageCount}</span>
              <Button size="sm" variant="ghost" disabled={pageIndex >= pageCount - 1} onClick={() => table.nextPage()}>{tr('Sau', 'Next')} <ChevronRight size={14} /></Button>
            </div>
          </div>
        </Card>
        {selCol && <ColumnProfilePanel ds={ds} c={selCol} onClose={() => setState({ explorerColumn: null })} />}
      </div>
      <p className="mt-3 text-[12.5px] text-subtle">{tr('Bảng chỉ dựng các dòng đang hiển thị (virtualization) — phù hợp cho dữ liệu hàng trăm nghìn dòng. Ô màu vàng là giá trị "Needs Review" được giữ nguyên.', 'Only visible rows are rendered (virtualization) — suitable for hundreds of thousands of rows. Amber cells are "Needs Review" values kept as-is.')}</p>
    </div>
  )
}
