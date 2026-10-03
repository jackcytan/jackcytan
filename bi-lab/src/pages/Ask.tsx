import { useEffect, useMemo, useRef, useState } from 'react'
import { m } from 'motion/react'
import { ArrowUp, CornerDownLeft, History, Info, Play, ScanSearch, SlidersHorizontal, Sparkle, Table2 } from 'lucide-react'
import { setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { Button, Card, Kbd, PageHeader, Segmented, Select, cx } from '@/components/ui/primitives'
import { Chart } from '@/components/charts/Chart'
import { buildQuerySchema, builderQuery, parseQuery, parseTime, type ParsedQuery } from '@/intelligence/query/parser'
import { executeQuery, type QueryResult } from '@/intelligence/query/executor'
import { buildSuggestions } from '@/intelligence/query/suggestions'
import { METRICS, type QueryOp } from '@/intelligence/query/lexicon'
import { formatValue } from '@/lib/format'
import { periodLabel } from '@/intelligence/analysis/time'
import { ROLE_META, DIMENSION_ROLES } from '@/intelligence/dictionaries/roles'
import type { Role } from '@/types/core'

interface Entry {
  id: number
  q: string
  pq: ParsedQuery
  res: QueryResult
  ms: number
}

function ResultCard({ e }: { e: Entry }) {
  const { tr, lang, l } = useT()
  const r = e.res
  const unknown = r.status === 'unknown'
  return (
    <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-5 py-3">
          <ScanSearch size={16} className="text-accent" />
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{e.q}</span>
          <span className="tabular shrink-0 text-[11.5px] text-subtle">{e.ms.toFixed(0)} ms · local</span>
        </div>
        <div className="p-5">
          <p className={cx('text-[16px] font-medium leading-relaxed', unknown ? 'text-muted' : 'text-fg')}>{l(r.answer)}</p>
          {!unknown && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.interpretation.map((c, i) => (
                <span key={i} className="inline-flex h-6 items-center gap-1 rounded-md border border-line bg-surface-2 px-2 text-[11.5px]">
                  <span className="text-subtle">{l(c.label)}:</span>
                  <span className="font-semibold text-fg">{l(c.value)}</span>
                </span>
              ))}
              <span className="inline-flex h-6 items-center rounded-md border border-line px-2 text-[11.5px] text-subtle">{tr('Độ tin cậy hiểu câu hỏi', 'Parse confidence')} {Math.round(r.confidence * 100)}%</span>
            </div>
          )}
          {r.highlights.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {r.highlights.slice(0, 4).map((h, i) => (
                <div key={i} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
                  <div className="truncate text-[12px] text-muted">{l(h.label)}</div>
                  <div className={cx('tabular mt-1 truncate text-[19px] font-semibold', h.tone === 'positive' ? 'text-positive' : h.tone === 'negative' ? 'text-negative' : 'text-fg')}>
                    {h.text ?? formatValue(h.value, h.format, { lang, signed: h.tone !== undefined && h.format === 'percent' })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {r.chart && (
            <div className="mt-4 rounded-xl border border-line p-3">
              <Chart spec={r.chart} height={260} highlight={r.chart.insightKey ? (JSON.parse(r.chart.insightKey) as string[]) : undefined} />
            </div>
          )}
          {r.table && r.table.rows.length > 0 && (
            <div className="mt-4 max-h-[320px] overflow-auto rounded-xl border border-line">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0 bg-surface-2">
                  <tr>
                    {r.table.columns.map((c) => (
                      <th key={c.key} className="px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-[0.06em] text-subtle">{l(c.label)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.table.rows.map((row, i) => (
                    <tr key={i} className="border-t border-line">
                      {r.table!.columns.map((c) => {
                        const v = row[c.key]
                        const txt = v === null || v === undefined ? '—' : typeof v === 'number' && c.format ? formatValue(v, c.format, { lang }) : c.key === 'period' && typeof v === 'string' ? periodLabel(v, lang) : String(v)
                        return <td key={c.key} className={cx('tabular max-w-[260px] truncate px-3 py-2', typeof v === 'number' && 'text-right')}>{txt}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.notes.length > 0 && (
            <div className="mt-3 space-y-1">
              {r.notes.map((n, i) => (
                <p key={i} className="flex items-start gap-1.5 text-[12px] text-subtle"><Info size={13} className="mt-0.5 shrink-0" />{l(n)}</p>
              ))}
            </div>
          )}
        </div>
      </Card>
    </m.div>
  )
}

function QueryBuilder({ onRun }: { onRun: (label: string, pq: ParsedQuery) => void }) {
  const { tr, lang, l } = useT()
  const a = useStore((s) => s.analysis)!
  const ds = useStore((s) => s.dataset)!
  const schema = useMemo(() => buildQuerySchema(ds, a.roles, a.time?.max ?? null, a.time?.granularity ?? 'month', a.measures[0]?.id ?? 'transactions'), [ds, a])
  const metrics = METRICS.filter((m2) => (m2.kind === 'count' ? true : m2.kind === 'distinct' ? schema.available.has(m2.role!) : m2.kind === 'measure' ? schema.available.has(m2.role!) : schema.available.has(m2.num!) && (m2.den === 'count' || schema.available.has(m2.den as Role))))
  const dims = DIMENSION_ROLES.filter((r) => schema.available.has(r))
  const [metric, setMetric] = useState(metrics[0]?.id ?? 'transactions')
  const [op, setOp] = useState<QueryOp>('SUM')
  const [dim, setDim] = useState<string>('')
  const [frole, setFrole] = useState<string>('')
  const [fval, setFval] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [topN, setTopN] = useState(10)
  const ops: { v: QueryOp; vi: string; en: string }[] = [
    { v: 'SUM', vi: 'Tổng (SUM)', en: 'SUM' }, { v: 'AVERAGE', vi: 'Trung bình', en: 'AVERAGE' }, { v: 'MEDIAN', vi: 'Trung vị', en: 'MEDIAN' }, { v: 'COUNT', vi: 'Đếm', en: 'COUNT' },
    { v: 'MAX', vi: 'Lớn nhất', en: 'MAX' }, { v: 'MIN', vi: 'Nhỏ nhất', en: 'MIN' }, { v: 'TOP_N', vi: 'Top N', en: 'TOP N' }, { v: 'BOTTOM_N', vi: 'Bottom N', en: 'BOTTOM N' },
    { v: 'GROUP_BY', vi: 'Nhóm theo', en: 'GROUP BY' }, { v: 'SHARE', vi: 'Tỷ trọng', en: 'SHARE' }, { v: 'GROWTH', vi: 'Tăng trưởng', en: 'GROWTH' }, { v: 'TREND', vi: 'Xu hướng', en: 'TREND' },
    { v: 'PARETO', vi: 'Pareto', en: 'PARETO' }, { v: 'ANOMALY', vi: 'Bất thường', en: 'ANOMALY' }, { v: 'FORECAST', vi: 'Dự phóng', en: 'PROJECTION' },
  ]
  const values = useMemo(() => (frole ? [...new Set(schema.valueIndex.filter((v) => v.role === frole).map((v) => v.value))].slice(0, 300) : []), [frole, schema])
  const run = () => {
    const md = METRICS.find((x) => x.id === metric)!
    const needsDim = ['TOP_N', 'BOTTOM_N', 'GROUP_BY', 'PARETO'].includes(op)
    const dimension = (dim || (needsDim ? dims[0] : '')) as Role | ''
    const timeFilter = time ? parseTime(time, schema.anchor).time : null
    const pq = builderQuery({ metric: md, op, dimension: dimension || null, filter: frole && fval ? { role: frole as Role, values: [fval] } : null, time: timeFilter, topN, grain: op === 'TREND' ? (a.time?.granularity ?? 'month') : null })
    const label = `${md.label[lang]} · ${op}${dimension ? ` · ${ROLE_META[dimension].label[lang]}` : ''}${fval ? ` · ${fval}` : ''}${timeFilter ? ` · ${l(timeFilter.label)}` : ''}`
    onRun(label, pq)
  }
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>{children}</label>
  )
  return (
    <Card className="p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <F label="Metric"><Select className="w-full" value={metric} onChange={(e) => setMetric(e.target.value)}>{metrics.map((x) => <option key={x.id} value={x.id}>{x.label[lang]}</option>)}</Select></F>
        <F label="Operation"><Select className="w-full" value={op} onChange={(e) => setOp(e.target.value as QueryOp)}>{ops.map((o) => <option key={o.v} value={o.v}>{lang === 'vi' ? o.vi : o.en}</option>)}</Select></F>
        <F label="Group by"><Select className="w-full" value={dim} onChange={(e) => setDim(e.target.value)}><option value="">—</option>{dims.map((d) => <option key={d} value={d}>{ROLE_META[d].label[lang]}</option>)}</Select></F>
        <F label="Top N"><Select className="w-full" value={topN} onChange={(e) => setTopN(Number(e.target.value))}>{[3, 5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}</Select></F>
        <F label="Filter"><Select className="w-full" value={frole} onChange={(e) => { setFrole(e.target.value); setFval('') }}><option value="">—</option>{dims.map((d) => <option key={d} value={d}>{ROLE_META[d].label[lang]}</option>)}</Select></F>
        <F label={tr('Giá trị lọc', 'Filter value')}><Select className="w-full" value={fval} onChange={(e) => setFval(e.target.value)} disabled={!frole}><option value="">—</option>{values.map((v) => <option key={v} value={v}>{v}</option>)}</Select></F>
        <F label="Time Range"><Select className="w-full" value={time} onChange={(e) => setTime(e.target.value)} disabled={!a.time}><option value="">{tr('Toàn bộ', 'All time')}</option><option value="thang nay">{tr('Tháng này', 'This month')}</option><option value="thang truoc">{tr('Tháng trước', 'Last month')}</option><option value="quy nay">{tr('Quý này', 'This quarter')}</option><option value="nam nay">{tr('Năm nay', 'This year')}</option><option value="3 thang gan nhat">{tr('3 tháng gần nhất', 'Last 3 months')}</option></Select></F>
        <div className="flex items-end"><Button variant="primary" icon={Play} className="w-full" onClick={run}>RUN ANALYSIS</Button></div>
      </div>
    </Card>
  )
}

export default function Ask() {
  const { tr, lang } = useT()
  const a = useStore((s) => s.analysis)!
  const ds = useStore((s) => s.dataset)!
  const pending = useStore((s) => s.pendingQuery)
  const [mode, setMode] = useState<'nl' | 'builder'>('nl')
  const [q, setQ] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const seq = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const mainMetric = useMemo(() => {
    const main = a.charts.find((c) => c.id === 'trend_main')?.insightKey ?? a.measures[0]?.role
    return METRICS.find((x) => x.role === main && x.kind === 'measure')?.id ?? 'transactions'
  }, [a])
  const schema = useMemo(() => buildQuerySchema(ds, a.roles, a.time?.max ?? null, a.time?.granularity ?? 'month', mainMetric), [ds, a, mainMetric])
  const suggestions = useMemo(() => buildSuggestions(schema, lang, 12), [schema, lang])
  const runPq = (label: string, pq: ParsedQuery) => {
    const t0 = performance.now()
    const res = executeQuery(pq, ds, a.roles, a, schema)
    setEntries((e) => [{ id: ++seq.current, q: label, pq, res, ms: performance.now() - t0 }, ...e].slice(0, 20))
  }
  const ask = (text: string) => {
    const t = text.trim()
    if (!t) return
    runPq(t, parseQuery(t, schema))
    setQ('')
  }
  useEffect(() => {
    if (pending) {
      ask(pending)
      setState({ pendingQuery: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const latest = entries[0]
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business Query Engine"
        icon={ScanSearch}
        title="ASK YOUR DATA"
        subtitle={tr('Natural Language Business Query — hỏi bằng tiếng Việt hoặc tiếng Anh. Bộ phân tích câu hỏi chạy cục bộ, không dùng LLM; nếu chưa hiểu, hệ thống sẽ không đoán.', 'Natural Language Business Query — ask in Vietnamese or English. The parser runs locally with no LLM; when unsure, it will not guess.')}
        right={<Segmented value={mode} onChange={setMode} options={[{ value: 'nl', label: tr('Câu hỏi', 'Question'), icon: ScanSearch }, { value: 'builder', label: 'Query Builder', icon: SlidersHorizontal }]} />}
      />
      {mode === 'nl' ? (
        <Card className="relative overflow-hidden p-2">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: 'radial-gradient(ellipse at top left, var(--hero-glow), transparent 55%)' }} />
          <form
            className="relative flex items-center gap-3 px-3"
            onSubmit={(e) => {
              e.preventDefault()
              ask(q)
            }}
          >
            <ScanSearch size={20} className="shrink-0 text-accent" />
            <input
              ref={inputRef}
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tr('Ví dụ: Top 5 sản phẩm doanh thu cao nhất', 'e.g. Top 5 products by revenue')}
              className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-subtle md:text-[17px]"
              aria-label={tr('Câu hỏi về dữ liệu', 'Data question')}
            />
            <span className="hidden items-center gap-1 text-[12px] text-subtle sm:flex"><Kbd>/</Kbd> {tr('để gõ', 'to focus')}</span>
            <Button type="submit" variant="primary" icon={ArrowUp} disabled={!q.trim()} aria-label={tr("Hỏi", "Ask")} className="shrink-0"><span className="hidden sm:inline">{tr("Hỏi", "Ask")}</span></Button>
          </form>
          <div className="relative flex flex-wrap gap-2 border-t border-line px-3 pb-2 pt-3">
            {suggestions.map((s) => (
              <button key={s} onClick={() => ask(s)} className="h-8 rounded-lg border border-line bg-surface-2 px-3 text-[12.5px] text-muted transition-colors hover:border-accent hover:text-accent">
                {s}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <QueryBuilder onRun={runPq} />
      )}

      {latest && latest.res.status === 'unknown' && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <Info size={18} className="mt-0.5 text-warning" />
            <div>
              <div className="text-[15px] font-semibold">{tr('Tôi chưa xác định chính xác yêu cầu.', 'I could not determine the request precisely.')}</div>
              <p className="mt-1 text-[13.5px] text-muted">{tr('Hãy thử một trong các câu hỏi phù hợp với dữ liệu này, hoặc dùng Query Builder:', 'Try one of these questions that fit this dataset, or use the Query Builder:')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.slice(0, 8).map((s) => (
                  <button key={s} onClick={() => ask(s)} className="h-8 rounded-lg border border-line bg-surface-2 px-3 text-[12.5px] hover:border-accent hover:text-accent">{s}</button>
                ))}
                <Button size="sm" icon={SlidersHorizontal} onClick={() => setMode('builder')}>Query Builder</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {entries.filter((e) => e.res.status !== 'unknown' || e !== latest).map((e) => (e.res.status === 'unknown' ? (
          <div key={e.id} className="flex items-center gap-2 px-1 text-[12.5px] text-subtle"><History size={13} /> “{e.q}” — {tr('chưa xác định', 'not understood')}</div>
        ) : (
          <ResultCard key={e.id} e={e} />
        )))}
      </div>
      {!entries.length && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Sparkle, tr('Hiểu tiếng Việt có dấu, không dấu & tiếng Anh', 'Understands accented, unaccented Vietnamese & English'), tr('"doanh thu thang nay", "Doanh thu tháng này", "revenue this month" đều cho cùng kết quả.', '"doanh thu thang nay", "Doanh thu tháng này", "revenue this month" give the same answer.')],
            [Table2, tr('Kết quả có bằng chứng', 'Evidence-backed answers'), tr('Mỗi câu trả lời gồm câu kết luận, KPI, biểu đồ mini và bảng số liệu.', 'Every answer includes a sentence, KPIs, a mini chart and a result table.')],
            [CornerDownLeft, tr('18 phép phân tích kết hợp', '18 composable operations'), tr('SUM, AVERAGE, TOP N, GROWTH, SHARE, TREND, PARETO, ANOMALY, CORRELATION, COMPARE… × chỉ số × nhóm × bộ lọc × thời gian.', 'SUM, AVERAGE, TOP N, GROWTH, SHARE, TREND, PARETO, ANOMALY, CORRELATION, COMPARE… × metrics × groups × filters × time.')],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Sparkle
            return (
              <Card key={t as string} className="p-5">
                <Icon size={18} className="text-accent" />
                <div className="mt-3 text-[14px] font-semibold">{t as string}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{d as string}</p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
