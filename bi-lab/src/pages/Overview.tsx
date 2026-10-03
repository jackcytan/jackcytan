import { m } from 'motion/react'
import { Activity, ArrowRight, BarChart3, Binary, Boxes, Compass, Cpu, FileSpreadsheet, Gauge, HeartPulse, Layers, Lock, PlayCircle, Radar, ScanSearch, ShieldCheck, Sparkle, Target, Upload, Workflow, WifiOff } from 'lucide-react'
import { navigate, setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { Badge, Button, Card, CardHeader, SEVERITY_META, cx, toneColor } from '@/components/ui/primitives'
import { NetworkBackground } from '@/components/layout/NetworkBackground'
import { KpiCard, InsightRow } from '@/components/insight/cards'
import { Chart } from '@/components/charts/Chart'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { DOMAIN_LABELS } from '@/intelligence/semantic/domain'
import { fmtDate, fmtNumber, formatValue } from '@/lib/format'
import { insightTitle, insightText } from '@/intelligence/insights/insightEngine'
import { periodLabel } from '@/intelligence/analysis/time'
import { DEMOS } from '@/demo/generator'
import { loadDemo } from '@/app/actions'

function Landing() {
  const { tr, lang } = useT()
  const trust = [
    { icon: ShieldCheck, t: '100% Local Processing', d: tr('Dữ liệu được xử lý trực tiếp trên thiết bị của bạn.', 'Your data never leaves your device.') },
    { icon: Cpu, t: 'No API Required', d: tr('Không API key, không máy chủ, không gọi mô hình AI bên ngoài.', 'No API key, no server, no external AI model calls.') },
    { icon: Lock, t: 'Enterprise Data Privacy', d: tr('Không tải dữ liệu lên đám mây. Có thể chạy offline sau lần tải đầu.', 'No cloud upload. Works offline after the first load.') },
  ]
  const pipeline = [
    { icon: FileSpreadsheet, t: 'Parser' },
    { icon: Binary, t: 'Profiling' },
    { icon: Layers, t: 'Semantic' },
    { icon: Activity, t: 'Statistics' },
    { icon: Workflow, t: 'Rules' },
    { icon: Target, t: 'KPI' },
    { icon: Radar, t: 'Anomaly' },
    { icon: Sparkle, t: 'Insight' },
    { icon: BarChart3, t: 'Dashboard' },
  ]
  return (
    <div>
      <section className="relative -mx-4 -mt-6 overflow-hidden border-b border-line px-4 md:-mx-8 md:-mt-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[-20%] h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, var(--hero-glow), transparent)' }} />
        <NetworkBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
        <div className="relative mx-auto max-w-5xl pb-16 pt-16 text-center md:pb-20 md:pt-24">
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[12px] font-semibold tracking-[0.18em] text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-positive pulse-dot" /> ANH TÂN AI
            </div>
            <h1 className="mt-6 text-[38px] font-bold leading-[1.05] tracking-[-0.035em] md:text-[64px]">
              <span className="text-gradient">BUSINESS INTELLIGENCE LAB</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[18px] font-medium leading-relaxed text-fg md:text-[21px]">Turn Business Data Into Actionable Intelligence.</p>
            <p className="mx-auto mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
              {tr('Local Business Data Intelligence & Decision Support — biến file Excel/CSV thành KPI, xu hướng, cảnh báo rủi ro và báo cáo điều hành ngay trên trình duyệt.', 'Local Business Data Intelligence & Decision Support — turn Excel/CSV files into KPIs, trends, risk alerts and executive reports right in your browser.')}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="primary" size="lg" icon={Upload} onClick={() => navigate('import')} className="min-w-[220px] tracking-wide">
                ANALYZE YOUR DATA
              </Button>
              <Button size="lg" icon={PlayCircle} onClick={() => navigate('demo')} className="min-w-[220px] tracking-wide">
                TRY DEMO DATA
              </Button>
            </div>
            <div className="mt-4 text-[12.5px] text-subtle">{tr('Phát triển bởi Anh Tân AI', 'Developed by Anh Tân AI')}</div>
          </m.div>
          <div className="mt-14 grid gap-4 text-left md:grid-cols-3">
            {trust.map((x, i) => (
              <m.div key={x.t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }} className="card glass p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <x.icon size={19} aria-hidden />
                  </span>
                  <div className="text-[15px] font-semibold text-fg">{x.t}</div>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{x.d}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent">Local Intelligence Engine</div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">{tr('Toàn bộ quy trình phân tích chạy trên thiết bị', 'The whole analysis pipeline runs on your device')}</h2>
          </div>
          <Badge tone="positive" icon={WifiOff}>{tr('Không cần mạng sau khi tải', 'No network needed after load')}</Badge>
        </div>
        <Card className="overflow-x-auto p-5">
          <div className="flex min-w-[860px] items-center justify-between gap-2">
            {pipeline.map((p, i) => (
              <div key={p.t} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-accent">
                    <p.icon size={19} aria-hidden />
                  </span>
                  <span className="text-[12px] font-medium text-muted">{p.t}</span>
                </div>
                {i < pipeline.length - 1 && <ArrowRight size={15} className="mb-6 text-subtle" aria-hidden />}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight">{tr('Demo theo ngành — mở trong vài giây', 'Industry demos — ready in seconds')}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('demo')}>{tr('Tất cả demo', 'All demos')} <ArrowRight size={14} /></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMOS.slice(0, 4).map((d) => (
            <button key={d.id} onClick={() => loadDemo(d.id)} className="card card-hover p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold">{d.name[lang]}</span>
                <PlayCircle size={18} className="text-accent" aria-hidden />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{d.description[lang]}</p>
              <div className="mt-3 text-[12px] text-subtle">~{fmtNumber(d.rowsHint, 0, lang)} {tr('dòng', 'rows')}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function CommandCenter() {
  const { tr, lang, l } = useT()
  const a = useStore((s) => s.analysis)!
  const ds = useStore((s) => s.dataset)!
  const kpis = a.kpis.filter((k) => k.id !== 'records').slice(0, 6)
  const negatives = a.insights.filter((i) => ['critical', 'warning'].includes(i.severity)).slice(0, 4)
  const positives = a.insights.filter((i) => ['positive', 'opportunity'].includes(i.severity)).slice(0, 4)
  const trend = a.charts.find((c) => c.id === 'trend_main')
  const healthLabel = a.health.status === 'good' ? 'GOOD' : a.health.status === 'watch' ? 'WATCH' : 'RISK'
  const recommended = [
    a.time && tr('Doanh thu theo tháng', 'Revenue by month'),
    a.roles.product && tr('Top 5 sản phẩm doanh thu cao nhất', 'Top 5 products by revenue'),
    (a.roles.branch || a.roles.region) && tr(`${a.roles.branch ? 'Chi nhánh' : 'Khu vực'} nào giảm mạnh nhất`, `Which ${a.roles.branch ? 'branch' : 'region'} declined the most`),
    tr('Có gì bất thường', 'Any anomalies'),
  ].filter(Boolean) as string[]
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent">Command Center</div>
          <h1 className="mt-1.5 truncate text-[26px] font-semibold tracking-[-0.02em] md:text-[30px]">{ds.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <Badge tone="accent" icon={Compass}>{l(DOMAIN_LABELS[a.domain.domain])} · {Math.round(a.domain.confidence * 100)}%</Badge>
            <Badge>{fmtNumber(ds.rowCount, 0, lang)} {tr('dòng', 'rows')}</Badge>
            <Badge>{ds.columns.length} {tr('cột', 'columns')}</Badge>
            {a.time && <Badge>{fmtDate(a.time.min, lang)} – {fmtDate(a.time.max, lang)}</Badge>}
            <Badge tone="positive" icon={ShieldCheck}>{tr('Xử lý cục bộ', 'Local')} · {a.stats.durationMs} ms</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button icon={ScanSearch} onClick={() => navigate('ask')}>{tr('Hỏi dữ liệu', 'Ask your data')}</Button>
          <Button variant="primary" icon={BarChart3} onClick={() => navigate('dashboard')}>{tr('Mở Smart Dashboard', 'Open Smart Dashboard')}</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
        <Card className="flex items-center gap-5 p-5">
          <ScoreRing score={a.health.score} size={112} sublabel={healthLabel} label="Business Health" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-muted"><HeartPulse size={15} className="text-accent" /> Business Health</div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted line-clamp-4">{l(a.health.summary)}</p>
            <button onClick={() => navigate('health')} className="mt-2 text-[12.5px] font-semibold text-accent">{tr('Xem chi tiết', 'View details')} →</button>
          </div>
        </Card>
        <Card className="flex items-center gap-5 p-5">
          <ScoreRing score={a.quality.score} size={112} label="Data Quality" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-muted"><Gauge size={15} className="text-accent" /> Data Quality</div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px]">
              <span className="text-subtle">{tr('Đầy đủ', 'Complete')}</span><span className="tabular text-right font-semibold">{a.quality.completeness}</span>
              <span className="text-subtle">{tr('Nhất quán', 'Consistent')}</span><span className="tabular text-right font-semibold">{a.quality.consistency}</span>
              <span className="text-subtle">{tr('Duy nhất', 'Unique')}</span><span className="tabular text-right font-semibold">{a.quality.uniqueness}</span>
              <span className="text-subtle">{tr('Hợp lệ', 'Valid')}</span><span className="tabular text-right font-semibold">{a.quality.validity}</span>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-muted"><Cpu size={15} className="text-accent" /> Business Analysis Engine</div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              [a.stats.kpisCalculated, tr('KPI đã tính', 'KPIs computed')],
              [a.stats.rulesEvaluated, tr('Kiểm tra nghiệp vụ', 'Business checks')],
              [a.insights.length, 'Insights'],
              [a.anomalies.anomalies.length, tr('Bất thường', 'Anomalies')],
              [a.quality.checksRun, tr('Kiểm tra chất lượng', 'Quality checks')],
              [a.charts.length, tr('Biểu đồ tự động', 'Auto charts')],
            ].map(([v, t]) => (
              <div key={String(t)} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                <div className="tabular text-[19px] font-semibold">{fmtNumber(v as number, 0, lang)}</div>
                <div className="text-[11.5px] leading-tight text-muted">{t}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard key={k.id} k={k} compact />
        ))}
      </div>

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-60" style={{ background: 'radial-gradient(ellipse at top right, var(--hero-glow), transparent 60%)' }} />
        <CardHeader icon={Compass} title="WHAT SHOULD I LOOK AT?" subtitle={tr('Các điểm cần chú ý được tự động xếp hạng theo mức độ và độ lớn của số liệu', 'Focus items ranked automatically by severity and magnitude')} />
        <div className="relative grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {a.focus.length === 0 && <p className="text-[14px] text-muted">{tr('Không có điểm nào cần cảnh báo — các chỉ số ổn định.', 'Nothing needs urgent attention — metrics are stable.')}</p>}
          {a.focus.map((f, idx) => {
            const ins = f.insightId ? a.insights.find((i) => i.id === f.insightId) : null
            const meta = SEVERITY_META[f.severity]
            return (
              <button
                key={f.id}
                onClick={() => (ins ? setState({ drawer: { kind: 'insight', id: ins.id } }) : navigate(f.page))}
                className="card-hover group flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-4 text-left"
              >
                <span className="tabular inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold" style={{ background: `color-mix(in srgb, ${toneColor(meta.tone)} 14%, transparent)`, color: toneColor(meta.tone) }}>{idx + 1}</span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold leading-snug">{ins ? insightTitle(ins, lang) : l(f.title)}</div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-muted line-clamp-2">{ins ? insightText(ins, lang) : l(f.detail)}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: toneColor(meta.tone) }}>
                    <meta.icon size={13} aria-hidden /> {meta[lang]}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {trend ? (
          <Card>
            <CardHeader icon={Activity} title={l(trend.title)} subtitle={l(trend.subtitle)} right={<Button size="sm" variant="ghost" onClick={() => navigate('dashboard')}>{tr('Dashboard', 'Dashboard')} →</Button>} />
            <div className="p-4 pt-2">
              <Chart spec={trend} height={300} highlight={a.anomalies.anomalies.filter((x) => x.scope === 'series' && x.metric === trend.insightKey).map((x) => x.label)} />
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-[14px] text-muted">{tr('Không có cột ngày — xu hướng theo thời gian không khả dụng.', 'No date column — time trends are unavailable.')}</Card>
        )}
        <Card>
          <CardHeader icon={Radar} title={tr('Bất thường gần đây', 'Recent anomalies')} right={<Button size="sm" variant="ghost" onClick={() => navigate('anomalies')}>{tr('Tất cả', 'All')} →</Button>} />
          <div className="space-y-1 p-3">
            {a.anomalies.anomalies.slice(0, 5).map((x) => (
              <button key={x.id} onClick={() => setState({ drawer: { kind: 'anomaly', id: x.id } })} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2">
                <span className={cx('h-2 w-2 shrink-0 rounded-full', x.severity === 'high' ? 'bg-negative' : x.severity === 'medium' ? 'bg-warning' : 'bg-subtle')} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{l(x.metricLabel)} · {x.scope === 'series' ? periodLabel(x.label, lang) : x.label}</div>
                  <div className="tabular text-[12px] text-muted">{formatValue(x.actual, x.format, { lang })} · {formatValue(x.deviation, 'percent', { lang, signed: true })}</div>
                </div>
                <Badge tone={x.severity === 'high' ? 'negative' : x.severity === 'medium' ? 'warning' : 'neutral'}>{x.severity}</Badge>
              </button>
            ))}
            {!a.anomalies.anomalies.length && <p className="px-2 py-4 text-[13px] text-muted">{tr('Không phát hiện bất thường đáng kể.', 'No significant anomalies detected.')}</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={SEVERITY_META.warning.icon} title={tr('Rủi ro quan trọng', 'Critical risks')} />
          <div className="p-2">
            {negatives.map((i) => (
              <InsightRow key={i.id} i={i} dense />
            ))}
            {!negatives.length && <p className="px-3 py-4 text-[13px] text-muted">{tr('Không có rủi ro mức cảnh báo.', 'No warning-level risks.')}</p>}
          </div>
        </Card>
        <Card>
          <CardHeader icon={SEVERITY_META.positive.icon} title={tr('Tín hiệu tích cực & cơ hội', 'Positive signals & opportunities')} />
          <div className="p-2">
            {positives.map((i) => (
              <InsightRow key={i.id} i={i} dense />
            ))}
            {!positives.length && <p className="px-3 py-4 text-[13px] text-muted">{tr('Chưa ghi nhận tín hiệu tích cực nổi bật.', 'No standout positive signals yet.')}</p>}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 flex items-center gap-2 text-[13px] font-semibold text-muted"><Boxes size={15} className="text-accent" /> {tr('Phân tích đề xuất', 'Recommended analysis')}</span>
          {recommended.map((q) => (
            <button key={q} onClick={() => { setState({ pendingQuery: q }); navigate('ask') }} className="h-8 rounded-lg border border-line bg-surface-2 px-3 text-[12.5px] text-fg hover:border-accent hover:text-accent">
              {q}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function Overview() {
  const hasData = useStore((s) => !!s.analysis)
  return hasData ? <CommandCenter /> : <Landing />
}
