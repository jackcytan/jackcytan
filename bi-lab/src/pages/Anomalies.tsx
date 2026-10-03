import { useMemo, useState } from 'react'
import { ChevronRight, Radar } from 'lucide-react'
import { setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { reanalyze } from '@/app/actions'
import { Badge, Card, CardHeader, EmptyState, PageHeader, Segmented, Select, cx } from '@/components/ui/primitives'
import { Chart } from '@/components/charts/Chart'
import { formatValue } from '@/lib/format'
import { periodLabel } from '@/intelligence/analysis/time'
import type { Sensitivity } from '@/types/core'
import type { ChartSpec } from '@/types/analysis'

export default function Anomalies() {
  const { tr, lang, l } = useT()
  const a = useStore((s) => s.analysis)!
  const sens = useStore((s) => s.settings.sensitivity)
  const list = a.anomalies.anomalies
  const seriesMetrics = a.series.map((s) => s.measure)
  const [metric, setMetric] = useState<string>(a.charts.find((c) => c.id === 'trend_main')?.insightKey ?? seriesMetrics[0] ?? '')
  const [scope, setScope] = useState<'all' | 'series' | 'segment' | 'record'>('all')
  const s = a.series.find((x) => x.measure === metric)
  const spec: ChartSpec | null = useMemo(
    () =>
      s
        ? {
            id: 'anom_series',
            kind: 'line',
            title: s.label,
            categories: s.points.map((p) => p.label),
            series: [
              { name: s.label, values: s.points.map((p) => p.value), format: s.format, tone: 'primary', kind: 'line' },
              { name: { vi: 'Trung bình trượt', en: 'Moving average' }, values: s.movingAvg, format: s.format, tone: 'muted', kind: 'line', dashed: true },
            ],
            zoom: s.points.length > 30,
          }
        : null,
    [s],
  )
  const marks = list.filter((x) => x.scope === 'series' && x.metric === metric).map((x) => x.label)
  const shown = list.filter((x) => scope === 'all' || x.scope === scope)
  const high = list.filter((x) => x.severity === 'high').length
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Anomaly Engine"
        icon={Radar}
        title={tr('Phát hiện bất thường', 'Anomaly detection')}
        subtitle={tr('Kết hợp Robust Z-score (MAD), IQR, Z-score, độ lệch so với trung bình trượt và biến động theo kỳ. Một điểm chỉ bị đánh dấu khi ít nhất hai phương pháp đồng thuận.', 'Combines Robust Z-score (MAD), IQR, Z-score, moving-average deviation and period-over-period change. A point is flagged only when at least two methods agree.')}
        right={
          <Segmented<Sensitivity>
            ariaLabel={tr('Độ nhạy', 'Sensitivity')}
            value={sens}
            onChange={(v) => reanalyze({ settings: { sensitivity: v } })}
            options={[
              { value: 'sensitive', label: 'Sensitive' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'conservative', label: 'Conservative' },
            ]}
          />
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['ANOMALIES FOUND', list.length],
          [tr('Mức cao', 'High severity'), high],
          [tr('Chuỗi được phân tích', 'Series analysed'), a.anomalies.seriesAnalysed],
          [tr('Kiểm tra đã chạy', 'Checks run'), a.anomalies.checksRun],
        ].map(([k, v]) => (
          <Card key={String(k)} className="p-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-subtle">{k}</div>
            <div className="tabular mt-1 text-[28px] font-semibold">{v}</div>
          </Card>
        ))}
      </div>
      {spec && (
        <Card>
          <CardHeader
            icon={Radar}
            title={tr('Chuỗi thời gian & điểm bất thường', 'Time series & anomalies')}
            subtitle={tr('Chấm đỏ = kỳ bất thường', 'Red dots = anomalous periods')}
            right={
              <Select value={metric} onChange={(e) => setMetric(e.target.value)} aria-label={tr('Chỉ số', 'Metric')}>
                {a.series.map((x) => (
                  <option key={x.measure} value={x.measure}>{l(x.label)}</option>
                ))}
              </Select>
            }
          />
          <div className="p-4 pt-2"><Chart spec={spec} height={300} highlight={marks} /></div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <CardHeader title={tr('Danh sách bất thường', 'Anomaly list')} right={<Segmented size="sm" value={scope} onChange={setScope} options={[{ value: 'all', label: tr('Tất cả', 'All') }, { value: 'series', label: tr('Theo thời gian', 'Time') }, { value: 'segment', label: tr('Theo nhóm', 'Segment') }, { value: 'record', label: tr('Giao dịch', 'Record') }]} />} />
        {shown.length ? (
          <div className="mt-4 overflow-x-auto border-t border-line">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle">
                  <th className="px-5 py-3 font-semibold">{tr('Thời điểm / nhóm', 'Date / group')}</th>
                  <th className="px-3 py-3 font-semibold">{tr('Chỉ số', 'Metric')}</th>
                  <th className="px-3 py-3 text-right font-semibold">Expected Range</th>
                  <th className="px-3 py-3 text-right font-semibold">Actual</th>
                  <th className="px-3 py-3 text-right font-semibold">Deviation</th>
                  <th className="px-3 py-3 font-semibold">Severity</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {shown.map((x) => (
                  <tr key={x.id} onClick={() => setState({ drawer: { kind: 'anomaly', id: x.id } })} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 font-medium">{x.scope === 'series' ? periodLabel(x.label, lang) : x.label}{x.scope === 'record' && x.periodStart ? <span className="ml-1 text-subtle">· {new Date(x.periodStart).toISOString().slice(0, 10)}</span> : null}</td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-muted">{l(x.metricLabel)}</td>
                    <td className="tabular px-3 py-3 text-right text-muted">{formatValue(x.expectedLow, x.format, { lang })} – {formatValue(x.expectedHigh, x.format, { lang })}</td>
                    <td className="tabular px-3 py-3 text-right font-semibold">{formatValue(x.actual, x.format, { lang })}</td>
                    <td className={cx('tabular px-3 py-3 text-right font-semibold', x.deviation >= 0 ? 'text-positive' : 'text-negative')}>{formatValue(x.deviation, 'percent', { lang, signed: true })}</td>
                    <td className="px-3 py-3"><Badge tone={x.severity === 'high' ? 'negative' : x.severity === 'medium' ? 'warning' : 'neutral'}>{x.severity === 'high' ? 'High' : x.severity === 'medium' ? 'Medium' : 'Low'}</Badge></td>
                    <td className="px-5 py-3 text-right text-accent"><ChevronRight size={16} className="inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Radar} title={tr('Không phát hiện bất thường', 'No anomalies detected')} text={tr('Với độ nhạy hiện tại, dữ liệu nằm trong khoảng kỳ vọng thống kê. Thử chế độ Sensitive để rà soát kỹ hơn.', 'At the current sensitivity, data stays within the expected statistical range. Try Sensitive mode for a closer look.')} />
        )}
      </Card>
    </div>
  )
}
