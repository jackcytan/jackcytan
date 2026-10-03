import type { ReactNode } from 'react'
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { Button, PageHeader, SEVERITY_META, cx, toneColor } from '@/components/ui/primitives'
import { Chart } from '@/components/charts/Chart'
import { BrandMark } from '@/components/layout/Sidebar'
import { DOMAIN_LABELS } from '@/intelligence/semantic/domain'
import { fmtDate, fmtNumber, formatValue } from '@/lib/format'
import { insightText, insightTitle, recommendationText } from '@/intelligence/insights/insightEngine'
import { periodLabel } from '@/intelligence/analysis/time'
import { exportSummaryCsv, exportSummaryXlsx, safeFileName } from '@/lib/export'
import { ROLE_META } from '@/intelligence/dictionaries/roles'
import { APP_VERSION } from '@/app/nav'
import { scoreTone } from '@/components/ui/ScoreRing'

function Section({ n, title, children, className }: { n: number; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx('report-section border-t border-line py-7', className)}>
      <h2 className="mb-4 flex items-baseline gap-3 text-[18px] font-semibold tracking-tight">
        <span className="tabular text-[13px] font-semibold text-accent">{String(n).padStart(2, '0')}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function Report() {
  const { tr, lang, l } = useT()
  const a = useStore((s) => s.analysis)!
  const ds = useStore((s) => s.dataset)!
  const crit = a.insights.filter((i) => i.severity === 'critical')
  const warn = a.insights.filter((i) => i.severity === 'warning' || i.severity === 'watch')
  const pos = a.insights.filter((i) => i.severity === 'positive')
  const opp = a.insights.filter((i) => i.severity === 'opportunity')
  const risks = [...crit, ...warn]
  const mainKpi = a.kpis.find((k) => k.id !== 'records')
  const healthStatus = { good: 'GOOD', watch: 'WATCH', risk: 'RISK' }[a.health.status]
  const recs: { id: string; text: string; from: string }[] = []
  for (const i of [...crit, ...warn, ...opp]) {
    for (const r of i.recommendationIds) {
      const text = recommendationText(r, i.params, lang)
      if (!recs.some((x) => x.text === text)) recs.push({ id: r, text, from: insightTitle(i, lang) })
    }
  }
  const trend = a.charts.find((c) => c.id === 'trend_main')
  const second = a.charts.find((c) => c.id !== 'trend_main' && c.kind !== 'heatmap' && c.kind !== 'scatter')
  const range = a.time ? `${fmtDate(a.time.min, lang)} – ${fmtDate(a.time.max, lang)}` : tr('không có cột thời gian', 'no time column')
  const summary = lang === 'vi'
    ? `Bộ dữ liệu "${ds.name}" gồm ${fmtNumber(ds.rowCount, 0, 'vi')} dòng và ${ds.columns.length} cột (${range}), được nhận diện thuộc bối cảnh ${DOMAIN_LABELS[a.domain.domain].vi.toLowerCase()} (độ tin cậy ${Math.round(a.domain.confidence * 100)}%). Điểm sức khỏe kinh doanh đạt ${a.health.score}/100 (${healthStatus}); chất lượng dữ liệu ${a.quality.score}/100.${mainKpi ? ` ${mainKpi.name.vi} đạt ${formatValue(mainKpi.value, mainKpi.format, { lang: 'vi' })}${mainKpi.change !== null && a.time?.currentLabel ? `, kỳ ${periodLabel(a.time.currentLabel, 'vi')} thay đổi ${formatValue(mainKpi.change, mainKpi.changeKind === 'pp' ? 'pp' : 'percent', { lang: 'vi', signed: true })} so với kỳ trước` : ''}.` : ''} Hệ thống đánh giá ${a.stats.rulesEvaluated} quy tắc nghiệp vụ, ghi nhận ${crit.length} vấn đề nghiêm trọng, ${warn.length} điểm cần cảnh báo/theo dõi, ${pos.length + opp.length} tín hiệu tích cực/cơ hội và ${a.anomalies.anomalies.length} điểm bất thường.${risks[0] ? ` Vấn đề nổi bật nhất: ${insightTitle(risks[0], 'vi').toLowerCase()}.` : ''}${(pos[0] ?? opp[0]) ? ` Điểm sáng: ${insightTitle((pos[0] ?? opp[0])!, 'vi').toLowerCase()}.` : ''}`
    : `The dataset "${ds.name}" contains ${fmtNumber(ds.rowCount, 0, 'en')} rows and ${ds.columns.length} columns (${range}) and was identified as ${DOMAIN_LABELS[a.domain.domain].en} (confidence ${Math.round(a.domain.confidence * 100)}%). Business health scores ${a.health.score}/100 (${healthStatus}); data quality ${a.quality.score}/100.${mainKpi ? ` ${mainKpi.name.en} is ${formatValue(mainKpi.value, mainKpi.format, { lang: 'en' })}${mainKpi.change !== null && a.time?.currentLabel ? `, with ${periodLabel(a.time.currentLabel, 'en')} changing ${formatValue(mainKpi.change, mainKpi.changeKind === 'pp' ? 'pp' : 'percent', { lang: 'en', signed: true })} versus the previous period` : ''}.` : ''} ${a.stats.rulesEvaluated} business rules were evaluated: ${crit.length} critical issues, ${warn.length} warnings/watch items, ${pos.length + opp.length} positive signals/opportunities and ${a.anomalies.anomalies.length} anomalies.${risks[0] ? ` Most important issue: ${insightTitle(risks[0], 'en').toLowerCase()}.` : ''}${(pos[0] ?? opp[0]) ? ` Bright spot: ${insightTitle((pos[0] ?? opp[0])!, 'en').toLowerCase()}.` : ''}`
  const List = ({ items, empty }: { items: typeof a.insights; empty: string }) =>
    items.length ? (
      <ul className="space-y-3">
        {items.slice(0, 8).map((i) => {
          const m = SEVERITY_META[i.severity]
          return (
            <li key={i.id} className="flex gap-3">
              <m.icon size={16} className="mt-0.5 shrink-0" style={{ color: toneColor(m.tone) }} aria-hidden />
              <div>
                <div className="text-[14px] font-semibold">{insightTitle(i, lang)} <span className="text-[11.5px] font-medium text-subtle">· {m[lang]}</span></div>
                <div className="text-[13.5px] leading-relaxed text-muted">{insightText(i, lang)}</div>
              </div>
            </li>
          )
        })}
      </ul>
    ) : (
      <p className="text-[13.5px] text-muted">{empty}</p>
    )
  let n = 0
  return (
    <div>
      <div className="no-print">
        <PageHeader
          eyebrow="Executive Report"
          icon={FileText}
          title={tr('Báo cáo điều hành tự động', 'Automated executive report')}
          subtitle={tr('Mọi câu trong báo cáo được tạo từ số liệu đã tính — không dùng LLM. Bấm PRINT REPORT → "Save as PDF" để xuất PDF.', 'Every sentence is generated from computed figures — no LLM. Click PRINT REPORT → "Save as PDF" to export a PDF.')}
          right={
            <>
              <Button icon={Download} onClick={() => exportSummaryCsv(a, lang, safeFileName(ds.name))}>CSV</Button>
              <Button icon={FileSpreadsheet} onClick={() => exportSummaryXlsx(a, lang, safeFileName(ds.name))}>XLSX</Button>
              <Button variant="primary" icon={Printer} onClick={() => window.print()}>PRINT REPORT</Button>
            </>
          }
        />
      </div>
      <article className="card mx-auto max-w-[920px] px-6 py-8 md:px-12 md:py-12 print:max-w-none print:border-0 print:px-0 print:py-0">
        <header className="flex items-start justify-between gap-6 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark size={36} />
              <div>
                <div className="text-[13px] font-bold tracking-[0.08em]">ANH TÂN AI</div>
                <div className="text-[12px] text-muted">Business Intelligence Lab</div>
              </div>
            </div>
            <h1 className="mt-8 text-[30px] font-bold leading-tight tracking-[-0.02em]">{tr('Báo cáo điều hành', 'Executive Report')}</h1>
            <p className="mt-1 text-[16px] text-muted">{ds.name}</p>
          </div>
          <div className="text-right text-[12.5px] text-muted">
            <div>{tr('Ngày lập', 'Generated')}: {fmtDate(Date.now(), lang)}</div>
            <div>{l(DOMAIN_LABELS[a.domain.domain])}</div>
            <div className="mt-3 inline-flex items-baseline gap-1 rounded-lg border border-line px-3 py-1.5">
              <span className="tabular text-[22px] font-semibold" style={{ color: scoreTone(a.health.score) }}>{a.health.score}</span>
              <span className="text-[11px]">/100 Health</span>
            </div>
          </div>
        </header>

        <Section n={++n} title={tr('Tóm tắt điều hành', 'Executive Summary')}>
          <p className="text-[15px] leading-[1.75]">{summary}</p>
        </Section>

        <Section n={++n} title={tr('Tổng quan dữ liệu', 'Dataset Overview')}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              [tr('Số dòng', 'Rows'), fmtNumber(ds.rowCount, 0, lang)],
              [tr('Số cột', 'Columns'), String(ds.columns.length)],
              [tr('Khoảng thời gian', 'Period'), range],
              [tr('Chu kỳ phân tích', 'Granularity'), a.time?.granularity ?? '—'],
            ].map(([k, v]) => (
              <div key={k}><div className="text-[12px] text-subtle">{k}</div><div className="mt-0.5 text-[14px] font-semibold">{v}</div></div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-muted">{tr('Trường được nhận diện', 'Recognised fields')}: {Object.entries(a.roleColumns).map(([r, c]) => `${ROLE_META[r as keyof typeof ROLE_META].label[lang]} (${c})`).join(' · ')}</p>
        </Section>

        <Section n={++n} title={tr('Sức khỏe kinh doanh', 'Business Health')}>
          <p className="mb-4 text-[14px] text-muted">{l(a.health.summary)}</p>
          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
            {a.health.components.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 border-b border-line py-2 text-[13.5px]">
                <span>{l(c.name)}</span>
                <span className="tabular font-semibold" style={{ color: scoreTone(c.score) }}>{c.score}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section n={++n} title={tr('Chỉ số chính', 'Key KPIs')}>
          <table className="w-full text-[13.5px]">
            <thead><tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle"><th className="py-2 font-semibold">KPI</th><th className="py-2 text-right font-semibold">{tr('Giá trị', 'Value')}</th><th className="py-2 text-right font-semibold">{tr('Kỳ gần nhất', 'Latest period')}</th><th className="py-2 text-right font-semibold">{tr('Thay đổi', 'Change')}</th></tr></thead>
            <tbody>
              {a.kpis.filter((k) => k.id !== 'records').slice(0, 12).map((k) => (
                <tr key={k.id} className="border-b border-line last:border-0">
                  <td className="py-2">{l(k.name)}</td>
                  <td className="tabular py-2 text-right font-semibold">{formatValue(k.value, k.format, { lang })}</td>
                  <td className="tabular py-2 text-right">{k.current !== null ? formatValue(k.current, k.format, { lang }) : '—'}</td>
                  <td className="tabular py-2 text-right">{k.change !== null ? formatValue(k.change, k.changeKind === 'pp' ? 'pp' : 'percent', { lang, signed: true }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {(trend || second) && (
          <Section n={++n} title={tr('Diễn biến hiệu quả', 'Performance Trends')}>
            {trend && (<><div className="mb-1 text-[13.5px] font-semibold">{l(trend.title)}</div><Chart spec={trend} height={260} animate={false} /></>)}
            {second && (<><div className="mb-1 mt-6 text-[13.5px] font-semibold">{l(second.title)}</div><Chart spec={second} height={240} animate={false} /></>)}
          </Section>
        )}

        <Section n={++n} title={tr('Tín hiệu tích cực', 'Positive Signals')}><List items={pos} empty={tr('Chưa ghi nhận tín hiệu tích cực nổi bật.', 'No standout positive signals.')} /></Section>
        <Section n={++n} title={tr('Rủi ro', 'Risks')}><List items={risks} empty={tr('Không ghi nhận rủi ro mức cảnh báo.', 'No warning-level risks recorded.')} /></Section>

        <Section n={++n} title={tr('Bất thường', 'Anomalies')}>
          {a.anomalies.anomalies.length ? (
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle"><th className="py-2 font-semibold">{tr('Chỉ số', 'Metric')}</th><th className="py-2 font-semibold">{tr('Thời điểm / nhóm', 'When / group')}</th><th className="py-2 text-right font-semibold">{tr('Thực tế', 'Actual')}</th><th className="py-2 text-right font-semibold">{tr('Kỳ vọng', 'Expected')}</th><th className="py-2 text-right font-semibold">{tr('Độ lệch', 'Deviation')}</th></tr></thead>
              <tbody>
                {a.anomalies.anomalies.slice(0, 8).map((x) => (
                  <tr key={x.id} className="border-b border-line last:border-0">
                    <td className="py-2">{l(x.metricLabel)}</td>
                    <td className="py-2">{x.scope === 'series' ? periodLabel(x.label, lang) : x.label}</td>
                    <td className="tabular py-2 text-right font-semibold">{formatValue(x.actual, x.format, { lang })}</td>
                    <td className="tabular py-2 text-right">{formatValue(x.expectedLow, x.format, { lang })} – {formatValue(x.expectedHigh, x.format, { lang })}</td>
                    <td className="tabular py-2 text-right">{formatValue(x.deviation, 'percent', { lang, signed: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13.5px] text-muted">{tr('Không phát hiện bất thường đáng kể.', 'No significant anomalies detected.')}</p>
          )}
        </Section>

        <Section n={++n} title={tr('Mức độ tập trung', 'Concentration')}>
          {a.pareto.length ? (
            <ul className="space-y-2 text-[14px]">
              {a.pareto.slice(0, 4).map((p) => (
                <li key={p.dimRole}>
                  {lang === 'vi'
                    ? `${formatValue(p.entityShareFor80, 'percent', { lang })} số ${ROLE_META[p.dimRole].label.vi.toLowerCase()} (trên ${p.distinct}) tạo ra 80% giá trị; 20% hàng đầu đóng góp ${formatValue(p.top20Share, 'percent', { lang })}.`
                    : `${formatValue(p.entityShareFor80, 'percent', { lang })} of ${ROLE_META[p.dimRole].label.en.toLowerCase()} (of ${p.distinct}) generate 80% of value; the top 20% contribute ${formatValue(p.top20Share, 'percent', { lang })}.`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13.5px] text-muted">{tr('Không đủ nhóm để phân tích mức độ tập trung.', 'Not enough groups for concentration analysis.')}</p>
          )}
        </Section>

        <Section n={++n} title={tr('Cơ hội', 'Opportunities')}><List items={opp} empty={tr('Chưa xác định cơ hội nổi bật từ dữ liệu.', 'No standout opportunities identified.')} /></Section>

        <Section n={++n} title={tr('Hành động đề xuất', 'Recommended Actions')}>
          {recs.length ? (
            <ol className="space-y-2.5">
              {recs.slice(0, 8).map((r, i) => (
                <li key={r.id + i} className="flex gap-3 text-[14px]">
                  <span className="tabular mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">{i + 1}</span>
                  <div><div className="leading-relaxed">{r.text}</div><div className="text-[12px] text-subtle">{tr('Căn cứ', 'Based on')}: {r.from}</div></div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13.5px] text-muted">{tr('Không có hành động cần ưu tiên.', 'No priority actions.')}</p>
          )}
        </Section>

        <Section n={++n} title={tr('Chất lượng dữ liệu', 'Data Quality')}>
          <p className="text-[14px]">{tr(`Điểm chất lượng ${a.quality.score}/100 — Đầy đủ ${a.quality.completeness}, Nhất quán ${a.quality.consistency}, Duy nhất ${a.quality.uniqueness}, Hợp lệ ${a.quality.validity}.`, `Quality score ${a.quality.score}/100 — Completeness ${a.quality.completeness}, Consistency ${a.quality.consistency}, Uniqueness ${a.quality.uniqueness}, Validity ${a.quality.validity}.`)}</p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
            {a.quality.issues.slice(0, 6).map((i, k) => <li key={k}>• {l(i.message)}</li>)}
          </ul>
        </Section>

        <Section n={n + 1} title={tr('Phương pháp', 'Methodology')}>
          <p className="text-[13px] leading-relaxed text-muted">
            {tr(
              `Phân tích chạy hoàn toàn trên thiết bị (Local Intelligence Engine v${APP_VERSION}), không gửi dữ liệu ra ngoài và không dùng mô hình ngôn ngữ. Các bước: đọc file → hồ sơ dữ liệu → nhận diện trường bằng từ điển ngữ nghĩa → tính ${a.stats.kpisCalculated} KPI → đánh giá ${a.stats.rulesEvaluated}/${a.stats.rulesTotal} quy tắc nghiệp vụ → phát hiện bất thường (Robust Z-score/MAD, IQR, Z-score, độ lệch trung bình trượt; cần ≥ 2 phương pháp đồng thuận) → điểm sức khỏe từ các thành phần có đủ dữ liệu. Dự phóng (nếu có) là dự phóng thống kê (hồi quy tuyến tính + trung bình trượt có trọng số), không phải dự báo AI. Tương quan chỉ thể hiện liên hệ thống kê, không khẳng định quan hệ nhân quả.`,
              `Analysis ran entirely on-device (Local Intelligence Engine v${APP_VERSION}); no data was sent anywhere and no language model was used. Steps: file reading → profiling → semantic field detection → ${a.stats.kpisCalculated} KPIs → ${a.stats.rulesEvaluated}/${a.stats.rulesTotal} business rules evaluated → anomaly detection (Robust Z-score/MAD, IQR, Z-score, moving-average deviation; ≥ 2 methods must agree) → health score from components with sufficient data. Projections are statistical (linear regression + weighted moving average), not AI forecasts. Correlations describe statistical association, not causation.`,
            )}
          </p>
        </Section>
        <footer className="mt-4 flex items-center justify-between border-t border-line pt-5 text-[12px] text-subtle">
          <span>ANH TÂN AI · Business Intelligence Lab</span>
          <span>{tr('Phát triển bởi Anh Tân AI', 'Developed by Anh Tân AI')} · 100% Local Processing</span>
        </footer>
      </article>
    </div>
  )
}
