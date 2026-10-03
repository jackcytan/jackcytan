import { useState } from 'react'
import { Activity, BarChart3, Download, FileSpreadsheet, GitCompareArrows, LineChart as LineIcon, ListOrdered, Sparkle, TrendingUp } from 'lucide-react'
import { useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { reanalyze } from '@/app/actions'
import { Badge, Button, Card, CardHeader, PageHeader, ProgressBar, SEVERITY_META, Segmented, Select, cx } from '@/components/ui/primitives'
import { KpiCard, InsightRow } from '@/components/insight/cards'
import { Chart } from '@/components/charts/Chart'
import { DOMAIN_LABELS } from '@/intelligence/semantic/domain'
import { formatValue } from '@/lib/format'
import { periodLabel } from '@/intelligence/analysis/time'
import { exportSummaryCsv, exportSummaryXlsx, safeFileName } from '@/lib/export'
import type { Severity } from '@/types/analysis'
import type { Granularity, Role } from '@/types/core'
import { ROLE_META } from '@/intelligence/dictionaries/roles'

export default function Dashboard() {
  const { tr, lang, l } = useT()
  const a = useStore((s) => s.analysis)!
  const ds = useStore((s) => s.dataset)!
  const settings = useStore((s) => s.settings)
  const [sev, setSev] = useState<'all' | 'risk' | 'positive'>('all')
  const [rankDim, setRankDim] = useState<string>(a.breakdowns[0]?.dimRole ?? '')
  const kpis = a.kpis.filter((k) => k.id !== 'records').slice(0, 8)
  const rank = a.breakdowns.find((b) => b.dimRole === rankDim) ?? a.breakdowns[0]
  const insights = a.insights.filter((i) => (sev === 'all' ? true : sev === 'risk' ? ['critical', 'warning', 'watch'].includes(i.severity) : ['positive', 'opportunity'].includes(i.severity as Severity)))
  const fc = a.forecast
  const fcSpec = fc && fc.ok ? {
    id: 'fc', kind: 'line' as const, title: { vi: 'Dự phóng thống kê', en: 'Statistical projection' },
    categories: [...fc.history.slice(-18).map((h) => h.label), ...fc.projection.map((p) => p.label)],
    series: [
      { name: { vi: 'Thực tế', en: 'Actual' }, values: [...fc.history.slice(-18).map((h) => h.value), ...fc.projection.map(() => NaN)], format: fc.format, kind: 'line' as const, tone: 'primary' as const },
      { name: { vi: 'Dự phóng', en: 'Projection' }, values: [...fc.history.slice(-18).map((_, i, arr) => (i === arr.length - 1 ? arr[i].value : NaN)), ...fc.projection.map((p) => p.value)], format: fc.format, kind: 'line' as const, tone: 'projection' as const, dashed: true },
    ],
  } : null
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Smart Dashboard"
        title={ds.name}
        subtitle={tr('Dashboard được tự động thiết kế từ ánh xạ ngữ nghĩa của dữ liệu — không dùng mẫu cố định.', 'This dashboard is designed automatically from the semantic mapping — no fixed template.')}
        right={
          <>
            <Badge tone="accent">{l(DOMAIN_LABELS[a.domain.domain])}</Badge>
            {a.time && (
              <Select value={settings.granularity} onChange={(e) => reanalyze({ settings: { granularity: e.target.value as Granularity | 'auto' } })} aria-label={tr('Chu kỳ thời gian', 'Time grain')}>
                <option value="auto">{tr('Tự động', 'Auto')} ({a.time.granularity})</option>
                <option value="day">{tr('Ngày', 'Daily')}</option>
                <option value="week">{tr('Tuần', 'Weekly')}</option>
                <option value="month">{tr('Tháng', 'Monthly')}</option>
                <option value="quarter">{tr('Quý', 'Quarterly')}</option>
              </Select>
            )}
            <Button size="sm" icon={Download} onClick={() => exportSummaryCsv(a, lang, safeFileName(ds.name))}>CSV</Button>
            <Button size="sm" icon={FileSpreadsheet} onClick={() => exportSummaryXlsx(a, lang, safeFileName(ds.name))}>XLSX</Button>
          </>
        }
      />
      {a.time?.partialLast && (
        <div className="rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] text-muted">
          {tr(`Kỳ cuối (${periodLabel(a.time.periods[a.time.periods.length - 1].label, lang)}) chưa đủ dữ liệu nên các so sánh dùng kỳ đầy đủ gần nhất: ${a.time.currentLabel ? periodLabel(a.time.currentLabel, lang) : ''}.`, `The last period (${periodLabel(a.time.periods[a.time.periods.length - 1].label, lang)}) is incomplete, so comparisons use the latest complete period: ${a.time.currentLabel ? periodLabel(a.time.currentLabel, lang) : ''}.`)}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} k={k} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {a.charts.map((c) => (
          <Card key={c.id} className={cx(c.size === 'lg' && 'xl:col-span-2')}>
            <CardHeader icon={c.kind === 'line' || c.kind === 'area' ? LineIcon : c.kind === 'scatter' ? GitCompareArrows : BarChart3} title={l(c.title)} subtitle={l(c.subtitle)} />
            <div className="p-4 pt-3">
              <Chart spec={c} height={c.size === 'lg' ? 320 : 290} highlight={c.id === 'trend_main' ? a.anomalies.anomalies.filter((x) => x.scope === 'series' && x.metric === c.insightKey).map((x) => x.label) : undefined} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        {rank && (
          <Card className="overflow-hidden">
            <CardHeader
              icon={ListOrdered}
              title={tr('Bảng xếp hạng', 'Ranking')}
              subtitle={`${l(rank.measureLabel)} · ${rank.dimColumn}`}
              right={
                <Select value={rank.dimRole} onChange={(e) => setRankDim(e.target.value)} aria-label={tr('Nhóm theo', 'Group by')}>
                  {a.breakdowns.map((b) => (
                    <option key={b.dimRole} value={b.dimRole}>{ROLE_META[b.dimRole as Role].label[lang]}</option>
                  ))}
                </Select>
              }
            />
            <div className="mt-4 max-h-[420px] overflow-auto border-t border-line">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle">
                    <th className="px-5 py-2.5 font-semibold">#</th>
                    <th className="px-2 py-2.5 font-semibold">{rank.dimColumn}</th>
                    <th className="px-2 py-2.5 text-right font-semibold">{l(rank.measureLabel)}</th>
                    <th className="w-[22%] px-2 py-2.5 font-semibold">{tr('Tỷ trọng', 'Share')}</th>
                    <th className="px-5 py-2.5 text-right font-semibold">{tr('Kỳ gần nhất', 'Latest')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rank.items.slice(0, 20).map((it, i) => (
                    <tr key={it.label} className="border-b border-line last:border-0 hover:bg-surface-2">
                      <td className="tabular px-5 py-2.5 text-subtle">{i + 1}</td>
                      <td className="max-w-[220px] truncate px-2 py-2.5 font-medium">{it.label}</td>
                      <td className="tabular px-2 py-2.5 text-right">{formatValue(it.value, rank.format, { lang })}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={it.share / (rank.items[0].share || 1)} className="flex-1" />
                          <span className="tabular w-12 text-right text-[12px] text-muted">{formatValue(it.share, 'percent', { lang })}</span>
                        </div>
                      </td>
                      <td className={cx('tabular px-5 py-2.5 text-right text-[12.5px] font-semibold', it.change === null || it.change === undefined ? 'text-subtle' : it.change >= 0 ? 'text-positive' : 'text-negative')}>
                        {it.change === null || it.change === undefined ? '—' : formatValue(it.change, 'percent', { lang, signed: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <Card>
          <CardHeader icon={Sparkle} title="Insights" subtitle={tr(`${a.insights.length} nhận định từ ${a.stats.rulesEvaluated} quy tắc được đánh giá`, `${a.insights.length} findings from ${a.stats.rulesEvaluated} evaluated rules`)} right={<Segmented size="sm" value={sev} onChange={setSev} options={[{ value: 'all', label: tr('Tất cả', 'All') }, { value: 'risk', label: tr('Rủi ro', 'Risks') }, { value: 'positive', label: tr('Tích cực', 'Positive') }]} />} />
          <div className="max-h-[440px] overflow-y-auto p-2">
            {insights.map((i) => (
              <InsightRow key={i.id} i={i} dense />
            ))}
            {!insights.length && <p className="px-3 py-6 text-[13px] text-muted">{tr('Không có nhận định trong nhóm này.', 'No findings in this group.')}</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader icon={TrendingUp} title={tr('Dự phóng thống kê', 'Statistical Projection')} subtitle={tr('Hồi quy tuyến tính + trung bình trượt có trọng số · không phải dự báo AI', 'Linear regression + weighted moving average · not an AI forecast')} right={fc?.ok ? <Badge tone={fc.quality === 'high' ? 'positive' : fc.quality === 'medium' ? 'warning' : 'negative'}>{tr('Chất lượng', 'Quality')} {fc.qualityScore}/100</Badge> : undefined} />
          <div className="p-5 pt-3">
            {fcSpec ? (
              <>
                <Chart spec={fcSpec} height={240} />
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {fc!.projection.map((p) => (
                    <div key={p.label} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                      <div className="text-[12px] text-subtle">{periodLabel(p.label, lang)}</div>
                      <div className="tabular text-[15px] font-semibold">{formatValue(p.value, fc!.format, { lang })}</div>
                      <div className="tabular text-[11.5px] text-muted">{formatValue(p.low, fc!.format, { lang })} – {formatValue(p.high, fc!.format, { lang })}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12.5px] text-subtle">{fc!.qualityNotes.map((n) => l(n)).join(' · ')}</p>
              </>
            ) : (
              <p className="py-8 text-center text-[14px] text-muted">{fc?.reason ? l(fc.reason) : tr('Insufficient data for reliable projection.', 'Insufficient data for reliable projection.')}</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader icon={Activity} title={tr('Ma trận tương quan', 'Correlation matrix')} subtitle={tr('Hệ số Pearson r · chỉ thể hiện liên hệ thống kê, không phải nhân quả', 'Pearson r · statistical association only, not causation')} />
          <div className="overflow-x-auto p-5 pt-4">
            {a.correlation ? (
              <>
                <table className="text-[12px]">
                  <thead>
                    <tr>
                      <th />
                      {a.correlation.keys.map((k) => (
                        <th key={k} className="px-1 pb-2 text-center font-medium text-subtle"><div className="w-16 truncate">{ROLE_META[k as Role].label[lang]}</div></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a.correlation.matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap pr-3 text-right font-medium text-muted">{ROLE_META[a.correlation!.keys[i] as Role].label[lang]}</td>
                        {row.map((r, j) => (
                          <td key={j} className="p-0.5">
                            <div className="tabular flex h-9 w-16 items-center justify-center rounded-md text-[12px] font-semibold" style={{ background: Number.isFinite(r) ? `color-mix(in srgb, ${r >= 0 ? '#3987e5' : '#d95926'} ${Math.round(Math.abs(r) * 70)}%, var(--surface-2))` : 'var(--surface-2)', color: Math.abs(r) > 0.55 ? '#fff' : 'var(--fg)' }}>
                              {Number.isFinite(r) ? r.toFixed(2) : '—'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="mt-4 space-y-1.5 text-[13px]">
                  {a.correlation.pairs.slice(0, 3).map((p) => (
                    <li key={p.a + p.b} className="flex justify-between gap-3"><span className="text-muted">{ROLE_META[p.a as Role].label[lang]} ↔ {ROLE_META[p.b as Role].label[lang]}</span><span className="font-medium">{l(p.strength)} · r = {p.r.toFixed(2)}</span></li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="py-8 text-center text-[14px] text-muted">{tr('Cần ít nhất 2 trường số để tính tương quan.', 'At least two numeric fields are needed.')}</p>
            )}
          </div>
        </Card>
      </div>
      {a.pareto.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-[14px] font-semibold"><BarChart3 size={16} className="text-accent" /> Pareto</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {a.pareto.slice(0, 4).map((p) => (
              <div key={p.dimRole} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="text-[12.5px] text-muted">{ROLE_META[p.dimRole].label[lang]}</div>
                <div className="tabular mt-1 text-[22px] font-semibold">{formatValue(p.entityShareFor80, 'percent', { lang })}</div>
                <div className="text-[12.5px] text-muted">{tr(`số ${ROLE_META[p.dimRole].label.vi.toLowerCase()} tạo ra 80% giá trị (${p.distinct} nhóm)`, `of ${ROLE_META[p.dimRole].label.en.toLowerCase()} generate 80% of value (${p.distinct} groups)`)}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-[12px]" style={{ color: p.entityShareFor80 <= 0.2 ? 'var(--warning)' : 'var(--positive)' }}>
                  {p.entityShareFor80 <= 0.2 ? <SEVERITY_META.watch.icon size={13} /> : <SEVERITY_META.positive.icon size={13} />}
                  {p.entityShareFor80 <= 0.2 ? tr('Tập trung cao', 'Highly concentrated') : tr('Phân tán hợp lý', 'Reasonably spread')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
