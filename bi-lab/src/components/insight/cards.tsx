import { ArrowDownRight, ArrowUpRight, ChevronRight, HelpCircle, Minus } from 'lucide-react'
import type { Insight, KpiResult } from '@/types/analysis'
import { setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { formatValue } from '@/lib/format'
import { insightText, insightTitle } from '@/intelligence/insights/insightEngine'
import { SEVERITY_META, SeverityBadge, cx, toneColor } from '../ui/primitives'
import { Sparkline } from '../ui/Sparkline'
import { useCountUp } from '../ui/useCountUp'
import { periodLabel } from '@/intelligence/analysis/time'

export function KpiCard({ k, compact }: { k: KpiResult; compact?: boolean }) {
  const { tr, lang, l } = useT()
  const largeMode = useStore((s) => (s.dataset?.rowCount ?? 0) > 50000)
  const time = useStore((s) => s.analysis?.time)
  const period = time?.currentLabel && time.previousLabel ? `${periodLabel(time.currentLabel, lang)} ${tr('so với', 'vs')} ${periodLabel(time.previousLabel, lang)}` : ''
  const v = useCountUp(k.value, largeMode ? 0 : 700)
  const good = k.change === null ? null : k.direction === 'neutral' ? null : (k.change > 0) === (k.direction === 'up')
  const tone = good === null ? 'neutral' : good ? 'positive' : 'negative'
  const ChangeIcon = k.change === null ? Minus : k.change > 0 ? ArrowUpRight : k.change < 0 ? ArrowDownRight : Minus
  return (
    <button onClick={() => setState({ drawer: { kind: 'kpi', id: k.id } })} className="card card-hover group flex min-w-0 flex-col p-5 text-left" aria-label={`${l(k.name)} — ${tr('xem giải thích', 'view explanation')}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12.5px] font-medium leading-snug text-muted">{l(k.name)}</div>
        <HelpCircle size={14} className="shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </div>
      <div className="tabular mt-2 truncate text-[25px] font-semibold leading-tight tracking-[-0.02em] text-fg">{formatValue(Number.isFinite(k.value) ? v : k.value, k.format, { lang, compact: true })}</div>
      <div className="mt-2 flex min-h-[20px] items-center gap-2 text-[12px]">
        {k.change !== null ? (
          <>
            <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: toneColor(tone) }}>
              <ChangeIcon size={14} aria-hidden />
              {formatValue(k.change, k.changeKind === 'pp' ? 'pp' : 'percent', { lang, signed: true })}
            </span>
            <span className="truncate text-subtle">{tr('kỳ gần nhất', 'latest period')}</span>
          </>
        ) : k.periodBased && period ? (
          <span className="truncate text-subtle">{period}</span>
        ) : (
          <span className="text-subtle">{tr('Toàn bộ dữ liệu', 'Full dataset')}</span>
        )}
      </div>
      {!compact && k.spark.length > 2 && (
        <div className="mt-3" title={k.sparkLabels.length ? `${periodLabel(k.sparkLabels[0], lang)} – ${periodLabel(k.sparkLabels[k.sparkLabels.length - 1], lang)}` : undefined}>
          <Sparkline values={k.spark} color={tone === 'negative' ? 'var(--negative)' : 'var(--accent)'} height={34} />
        </div>
      )}
    </button>
  )
}

export function InsightRow({ i, dense }: { i: Insight; dense?: boolean }) {
  const { tr, lang } = useT()
  const m = SEVERITY_META[i.severity]
  return (
    <button onClick={() => setState({ drawer: { kind: 'insight', id: i.id } })} className={cx('group flex w-full items-start gap-3.5 rounded-xl border border-transparent text-left transition-colors hover:border-line hover:bg-surface-2', dense ? 'px-3 py-2.5' : 'px-4 py-3.5')}>
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${toneColor(m.tone)} 13%, transparent)`, color: toneColor(m.tone) }}>
        <m.icon size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold leading-snug text-fg">{insightTitle(i, lang)}</span>
          {!dense && <SeverityBadge severity={i.severity} />}
        </div>
        <p className={cx('mt-1 text-[13px] leading-relaxed text-muted', dense && 'line-clamp-2')}>{insightText(i, lang)}</p>
      </div>
      <span className="mt-1 inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-accent opacity-80 group-hover:opacity-100">
        {tr('WHY?', 'WHY?')} <ChevronRight size={14} aria-hidden />
      </span>
    </button>
  )
}
