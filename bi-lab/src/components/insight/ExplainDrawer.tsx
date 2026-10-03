import type { ReactNode } from 'react'
import { BookOpen, Calculator, Database, FlaskConical, ListChecks, Scale, Target } from 'lucide-react'
import { setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { Drawer } from '../ui/Overlay'
import { SeverityBadge, Badge } from '../ui/primitives'
import { formatParam, formatValue, fmtNumber } from '@/lib/format'
import { insightText, insightTitle, recommendationText } from '@/intelligence/insights/insightEngine'
import { RULE_LIBRARY } from '@/intelligence/rules/ruleLibrary'
import { periodLabel } from '@/intelligence/analysis/time'

function Section({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">
        <Icon size={14} aria-hidden /> {title}
      </h3>
      <div className="text-[14px] leading-relaxed text-fg">{children}</div>
    </section>
  )
}

function Row({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-0">
      <span className="text-[13px] text-muted">{k}</span>
      <span className="tabular text-right text-[13.5px] font-semibold text-fg">{v}</span>
    </div>
  )
}

export function ExplainDrawer() {
  const drawer = useStore((s) => s.drawer)
  const a = useStore((s) => s.analysis)
  const ds = useStore((s) => s.dataset)
  const { tr, lang, l } = useT()
  const close = () => setState({ drawer: null })
  if (!drawer || !a || !ds) return null
  const period = a.time?.currentLabel ? `${periodLabel(a.time.currentLabel, lang)}${a.time.previousLabel ? ` ${tr('so với', 'vs')} ${periodLabel(a.time.previousLabel, lang)}` : ''}` : tr('Toàn bộ dữ liệu', 'Full dataset')

  if (drawer.kind === 'kpi') {
    const k = a.kpis.find((x) => x.id === drawer.id)
    if (!k) return null
    return (
      <Drawer open onClose={close} title={l(k.name)} subtitle={tr('Giải thích chỉ số — WHY', 'Metric explanation — WHY')}>
        <div className="mb-6 rounded-xl border border-line bg-surface-2 p-4">
          <div className="text-[12px] text-subtle">{tr('Giá trị (toàn bộ dữ liệu)', 'Value (full dataset)')}</div>
          <div className="tabular mt-1 text-[28px] font-semibold tracking-tight">{formatValue(k.value, k.format, { lang })}</div>
        </div>
        <Section icon={BookOpen} title={tr('Định nghĩa', 'Definition')}>{l(k.description)}</Section>
        <Section icon={Calculator} title={tr('Cách tính', 'Calculation')}>
          <code className="block rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[12.5px] text-fg">{k.formula}</code>
        </Section>
        <Section icon={Database} title={tr('Trường dữ liệu sử dụng', 'Fields used')}>
          {k.requiredFields.map((f) => (
            <Row key={f.role} k={f.role} v={f.column} />
          ))}
          <Row k={tr('Số dòng tham gia', 'Rows involved')} v={fmtNumber(k.rowsUsed, 0, lang)} />
        </Section>
        {k.current !== null && (
          <Section icon={Scale} title={tr('Bằng chứng theo kỳ', 'Period evidence')}>
            <Row k={tr('Kỳ', 'Period')} v={period} />
            <Row k={tr('Kỳ gần nhất', 'Latest period')} v={formatValue(k.current, k.format, { lang })} />
            <Row k={tr('Kỳ trước', 'Previous period')} v={formatValue(k.previous, k.format, { lang })} />
            {k.change !== null && <Row k={tr('Thay đổi', 'Change')} v={formatValue(k.change, k.changeKind === 'pp' ? 'pp' : 'percent', { lang, signed: true })} />}
          </Section>
        )}
        <Section icon={Target} title={tr('Ý nghĩa kinh doanh', 'Business meaning')}>
          {k.direction === 'up' ? tr('Chỉ số này càng cao càng tốt.', 'Higher is better for this metric.') : k.direction === 'down' ? tr('Chỉ số này càng thấp càng tốt.', 'Lower is better for this metric.') : tr('Chỉ số mô tả quy mô — đánh giá tùy theo bối cảnh.', 'Descriptive metric — interpret in context.')}
        </Section>
      </Drawer>
    )
  }

  if (drawer.kind === 'insight') {
    const i = a.insights.find((x) => x.id === drawer.id)
    if (!i) return null
    const rule = RULE_LIBRARY.find((r) => r.id === i.ruleId)
    return (
      <Drawer open onClose={close} title={insightTitle(i, lang)} subtitle={<div className="flex items-center gap-2"><SeverityBadge severity={i.severity} /><Badge>{i.ruleId}</Badge></div>}>
        <Section icon={BookOpen} title={tr('Nhận định', 'Finding')}>{insightText(i, lang)}</Section>
        <Section icon={Scale} title={tr('Bằng chứng số liệu — WHY', 'Numeric evidence — WHY')}>
          {i.evidence.map((e, j) => (
            <Row key={j} k={l(e.label)} v={formatParam(e.value, lang)} />
          ))}
          {i.current && <Row k={tr('Hiện tại', 'Current')} v={formatParam(i.current, lang)} />}
          {i.comparison && <Row k={tr('So sánh', 'Comparison')} v={formatParam(i.comparison, lang)} />}
          <Row k={tr('Kỳ phân tích', 'Period')} v={period} />
        </Section>
        {rule && (
          <Section icon={FlaskConical} title={tr('Quy tắc kích hoạt', 'Triggered rule')}>
            <code className="block rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[12.5px]">{rule.condition}</code>
            <p className="mt-2 text-[13px] text-muted">{tr('Quy tắc nghiệp vụ cố định, đánh giá trên số liệu đã tính — không dùng mô hình ngôn ngữ.', 'A fixed business rule evaluated on computed figures — no language model involved.')}</p>
          </Section>
        )}
        <Section icon={ListChecks} title={tr('Gợi ý hành động', 'Recommended actions')}>
          <ul className="space-y-2">
            {i.recommendationIds.map((r) => (
              <li key={r} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{recommendationText(r, i.params, lang)}</li>
            ))}
          </ul>
        </Section>
      </Drawer>
    )
  }

  if (drawer.kind === 'anomaly') {
    const x = a.anomalies.anomalies.find((y) => y.id === drawer.id)
    if (!x) return null
    const when = x.scope === 'series' ? periodLabel(x.label, lang) : x.label
    return (
      <Drawer open onClose={close} title={`${l(x.metricLabel)} — ${when}`} subtitle={tr('Giải thích điểm bất thường', 'Anomaly explanation')}>
        <Section icon={Scale} title={tr('Bằng chứng', 'Evidence')}>
          <Row k={tr('Thực tế', 'Actual')} v={formatValue(x.actual, x.format, { lang })} />
          <Row k={tr('Kỳ vọng', 'Expected')} v={formatValue(x.expected, x.format, { lang })} />
          <Row k={tr('Khoảng kỳ vọng', 'Expected range')} v={`${formatValue(x.expectedLow, x.format, { lang })} – ${formatValue(x.expectedHigh, x.format, { lang })}`} />
          <Row k={tr('Độ lệch', 'Deviation')} v={formatValue(x.deviation, 'percent', { lang, signed: true })} />
          <Row k={tr('Số dòng liên quan', 'Rows involved')} v={fmtNumber(x.rowsInvolved, 0, lang)} />
          <Row k={tr('Mức độ', 'Severity')} v={x.severity.toUpperCase()} />
        </Section>
        <Section icon={FlaskConical} title={tr('Phương pháp', 'Method')}>
          {l(x.methodDetail)}
          <p className="mt-2 text-[13px] text-muted">{tr(`Độ nhạy: ${a.anomalies.sensitivity}. Một điểm chỉ bị đánh dấu khi phương pháp chính (Robust Z) và ít nhất một phương pháp khác cùng xác nhận.`, `Sensitivity: ${a.anomalies.sensitivity}. A point is flagged only when the primary method (Robust Z) and at least one other method agree.`)}</p>
        </Section>
        <Section icon={Target} title={tr('Ý nghĩa kinh doanh', 'Business meaning')}>
          {x.direction === 'spike' ? tr('Giá trị cao bất thường — có thể là đơn hàng lớn, chiến dịch, hoặc lỗi nhập liệu. Nên kiểm tra các dòng liên quan.', 'Unusually high — could be a large order, a campaign, or a data-entry error. Review the related rows.') : tr('Giá trị thấp bất thường — có thể do gián đoạn hoạt động, thiếu dữ liệu hoặc sự kiện bất lợi. Nên kiểm tra nguyên nhân.', 'Unusually low — could be an operational disruption, missing data, or an adverse event. Investigate the cause.')}
        </Section>
      </Drawer>
    )
  }

  if (drawer.kind === 'health') {
    const c = a.health.components.find((x) => x.id === drawer.id)
    if (!c) return null
    return (
      <Drawer open onClose={close} title={`${l(c.name)} · ${c.score}/100`} subtitle={tr('Thành phần điểm sức khỏe', 'Health score component')}>
        <Section icon={BookOpen} title={tr('Giải thích', 'Explanation')}>{l(c.explanation)}</Section>
        <Section icon={Scale} title={tr('Bằng chứng', 'Evidence')}>
          {c.evidence.map((e, j) => (
            <Row key={j} k={l(e.label)} v={formatParam(e.value, lang)} />
          ))}
          <Row k={tr('Trọng số', 'Weight')} v={c.weight.toFixed(1)} />
        </Section>
        <Section icon={FlaskConical} title={tr('Phương pháp', 'Method')}>
          {tr('Giá trị đo được được quy đổi sang thang 0–100 bằng hàm đơn điệu cố định. Điểm tổng là bình quân có trọng số của các thành phần có đủ dữ liệu — thành phần thiếu dữ liệu không được tính, không bị giả định.', 'The measured value maps to 0–100 through a fixed monotonic scale. The overall score is the weighted mean of components with sufficient data — missing components are excluded, never assumed.')}
        </Section>
      </Drawer>
    )
  }
  return null
}
