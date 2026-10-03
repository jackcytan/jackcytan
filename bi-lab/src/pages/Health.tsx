import { CheckCircle2, ChevronRight, Database, HeartPulse, ShieldAlert } from 'lucide-react'
import { setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { Badge, Card, CardHeader, PageHeader, ProgressBar, cx } from '@/components/ui/primitives'
import { ScoreRing, scoreTone } from '@/components/ui/ScoreRing'
import { fmtNumber, formatValue } from '@/lib/format'

export default function Health() {
  const { tr, lang, l } = useT()
  const a = useStore((s) => s.analysis)!
  const h = a.health
  const q = a.quality
  const statusLabel = { good: 'GOOD', watch: 'WATCH', risk: 'RISK' }[h.status]
  const statusText = { good: tr('Hoạt động kinh doanh đang ở trạng thái tốt', 'The business is in good shape'), watch: tr('Cần theo dõi một số chỉ số', 'Some metrics need watching'), risk: tr('Có rủi ro cần xử lý', 'There are risks to address') }[h.status]
  const sevTone = { critical: 'negative', warning: 'warning', watch: 'violet', info: 'neutral' } as const
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Business Health" icon={HeartPulse} title={tr('Sức khỏe kinh doanh & chất lượng dữ liệu', 'Business health & data quality')} subtitle={tr('Điểm số chỉ được tính từ các chỉ số thực sự tồn tại trong dữ liệu. Thành phần thiếu dữ liệu không được giả định.', 'Scores are computed only from metrics that exist in the data. Missing components are never assumed.')} />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="flex flex-col items-center p-7 text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">Overall Health</div>
          <div className="mt-4"><ScoreRing score={h.score} size={176} stroke={13} sublabel={statusLabel} label="Overall Health" /></div>
          <div className="mt-4 text-[16px] font-semibold" style={{ color: scoreTone(h.score) }}>{statusText}</div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{l(h.summary)}</p>
          <div className="mt-5 flex gap-4 text-[12px] text-subtle">
            <span>≥ 75 GOOD</span><span>55–74 WATCH</span><span>&lt; 55 RISK</span>
          </div>
        </Card>
        <Card>
          <CardHeader icon={HeartPulse} title={tr('Thành phần điểm', 'Score components')} subtitle={tr('Bấm vào từng thành phần để xem bằng chứng (WHY)', 'Click a component for its evidence (WHY)')} />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {h.components.map((c) => (
              <button key={c.id} onClick={() => setState({ drawer: { kind: 'health', id: c.id } })} className="card-hover rounded-xl border border-line bg-surface-2 p-4 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold">{l(c.name)}</span>
                  <span className="tabular text-[18px] font-semibold" style={{ color: scoreTone(c.score) }}>{c.score}</span>
                </div>
                <ProgressBar value={c.score / 100} tone={c.status === 'good' ? 'positive' : c.status === 'watch' ? 'warning' : 'negative'} className="mt-2" />
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{l(c.explanation)}</p>
                <div className="mt-2 flex items-center justify-between text-[11.5px] text-subtle">
                  <span>{tr('Trọng số', 'Weight')} {c.weight}</span>
                  <span className="inline-flex items-center font-semibold text-accent">WHY <ChevronRight size={13} /></span>
                </div>
              </button>
            ))}
            {!h.components.length && <p className="text-[14px] text-muted">{l(h.summary)}</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="p-7">
          <div className="text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">Data Quality</div>
          <div className="mt-4 flex justify-center"><ScoreRing score={q.score} size={150} stroke={12} label="Data Quality" /></div>
          <div className="mt-6 space-y-3">
            {[
              ['Completeness', tr('Độ đầy đủ', 'Completeness'), q.completeness],
              ['Consistency', tr('Tính nhất quán', 'Consistency'), q.consistency],
              ['Uniqueness', tr('Tính duy nhất', 'Uniqueness'), q.uniqueness],
              ['Validity', tr('Tính hợp lệ', 'Validity'), q.validity],
            ].map(([k, label, v]) => (
              <div key={k as string}>
                <div className="mb-1 flex justify-between text-[13px]"><span className="text-muted">{label}</span><span className="tabular font-semibold">{v}</span></div>
                <ProgressBar value={(v as number) / 100} tone={(v as number) >= 85 ? 'positive' : (v as number) >= 65 ? 'warning' : 'negative'} />
              </div>
            ))}
          </div>
          <p className="mt-5 text-[12px] text-subtle">{tr(`${q.checksRun} kiểm tra chất lượng dữ liệu · ${q.issues.length} vấn đề được ghi nhận`, `${q.checksRun} data-quality checks · ${q.issues.length} issues recorded`)}</p>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader icon={Database} title={tr('Vấn đề dữ liệu & khuyến nghị', 'Data issues & recommendations')} />
          <div className="mt-3 divide-y divide-line border-t border-line">
            {q.issues.map((i, idx) => (
              <div key={idx} className="flex items-start gap-3 px-5 py-3.5">
                <span className={cx('mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', i.severity === 'info' ? 'bg-surface-3 text-muted' : 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning')}>
                  <ShieldAlert size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-medium">{l(i.message)}</span>
                    <Badge tone={sevTone[i.severity]}>{i.checkId}</Badge>
                  </div>
                  <p className="mt-1 text-[12.5px] text-muted">→ {l(i.recommendation)}</p>
                </div>
                {i.affected > 0 && <span className="tabular shrink-0 text-[12px] text-subtle">{fmtNumber(i.affected, 0, lang)}{i.pct > 0 && i.pct < 1 ? ` · ${formatValue(i.pct, 'percent', { lang })}` : ''}</span>}
              </div>
            ))}
            {!q.issues.length && (
              <div className="flex items-center gap-2 px-5 py-8 text-[14px] text-positive"><CheckCircle2 size={18} /> {tr('Không phát hiện vấn đề chất lượng dữ liệu.', 'No data quality issues detected.')}</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
