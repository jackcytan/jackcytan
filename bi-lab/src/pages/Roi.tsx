import { useMemo, useState } from 'react'
import { Calculator, Clock, RotateCcw, Timer, TrendingUp, Users, Wallet } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { Badge, Button, Card, CardHeader, PageHeader, cx } from '@/components/ui/primitives'
import { Chart } from '@/components/charts/Chart'
import { calcRoi, DEFAULT_ROI, type RoiInputs } from '@/intelligence/roi/roi'
import { fmtCurrency, formatValue, fmtNumber } from '@/lib/format'
import type { ChartSpec } from '@/types/analysis'

function NumField({ label, value, onChange, suffix, step = 1, min = 0 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number; min?: number }) {
  const { lang } = useT()
  const [text, setText] = useState<string | null>(null)
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">{label}</span>
      <div className="flex h-10 items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent">
        <input
          inputMode="decimal"
          value={text ?? fmtNumber(value, 2, lang)}
          onFocus={() => setText(String(value))}
          onBlur={() => setText(null)}
          onChange={(e) => {
            setText(e.target.value)
            const n = Number(e.target.value.replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
            if (Number.isFinite(n)) onChange(Math.max(min, n))
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') onChange(value + step)
            if (e.key === 'ArrowDown') onChange(Math.max(min, value - step))
          }}
          className="tabular h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none"
          aria-label={label}
        />
        {suffix && <span className="pr-3 text-[12.5px] text-subtle">{suffix}</span>}
      </div>
    </label>
  )
}

export default function Roi() {
  const { tr, lang } = useT()
  const [i, setI] = useState<RoiInputs>(DEFAULT_ROI)
  const r = useMemo(() => calcRoi(i), [i])
  const set = (k: keyof RoiInputs) => (v: number) => setI((s) => ({ ...s, [k]: v }))
  const fm = (v: number) => fmtCurrency(v, { lang, currency: 'VND' })
  const hoursChart: ChartSpec = {
    id: 'roi_hours', kind: 'bar', title: { vi: 'Giờ công thủ công / tháng', en: 'Manual hours / month' },
    categories: [tr('TRƯỚC', 'BEFORE'), tr('SAU', 'AFTER')],
    series: [
      { name: { vi: 'Giờ thủ công', en: 'Manual hours' }, values: [r.manualHoursMonth, r.remainingHoursMonth], format: 'hours', tone: 'primary' },
    ],
  }
  const cashChart: ChartSpec = {
    id: 'roi_cash', kind: 'area', title: { vi: 'Lợi ích lũy kế 36 tháng', en: 'Cumulative benefit over 36 months' },
    categories: r.cumulative.map((c) => `${tr('Tháng', 'Month')} ${c.month}`),
    series: [{ name: { vi: 'Lợi ích ròng lũy kế', en: 'Cumulative net benefit' }, values: r.cumulative.map((c) => c.value), format: 'currency', tone: 'primary', kind: 'area' }],
  }
  const Out = ({ icon: I, label, value, unit, sub, tone }: { icon: typeof Clock; label: string; value: string; unit?: string; sub?: string; tone?: 'positive' | 'negative' }) => (
    <Card className="p-5">
      <div className="flex min-h-[34px] items-start gap-2 text-[12.5px] font-medium leading-snug text-muted"><I size={15} className="mt-0.5 shrink-0 text-accent" />{label}</div>
      <div className={cx('tabular mt-2 truncate text-[22px] font-semibold tracking-tight', tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-fg')}>{value}{unit && <span className="ml-1 text-[13px] font-medium text-muted">{unit}</span>}</div>
      {sub && <div className="mt-0.5 text-[12px] text-subtle">{sub}</div>}
    </Card>
  )
  const payback = Number.isFinite(r.paybackMonths) ? fmtNumber(r.paybackMonths, 1, lang) : tr('Không hoàn vốn', 'No payback')
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automation ROI"
        icon={Calculator}
        title={tr('Tính ROI tự động hóa quy trình', 'Process automation ROI')}
        subtitle={tr('Ước tính giờ công tiết kiệm, FTE tương đương, thời gian hoàn vốn và lợi ích 3 năm — công thức minh bạch, chạy cục bộ.', 'Estimate hours saved, equivalent FTE, payback and 3-year benefit — transparent formulas, computed locally.')}
        right={<Button icon={RotateCcw} onClick={() => setI(DEFAULT_ROI)}>Reset</Button>}
      />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit p-6">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">{tr('Tên quy trình', 'Process name')}</span>
            <input value={i.processName} onChange={(e) => setI((s) => ({ ...s, processName: e.target.value.slice(0, 120) }))} className="h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-[14px] outline-none focus:border-accent" />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <NumField label={tr('Số nhân sự tham gia', 'Employees involved')} value={i.employees} onChange={set('employees')} />
            <NumField label={tr('Lương bình quân / tháng', 'Avg. monthly salary')} value={i.avgMonthlySalary} onChange={set('avgMonthlySalary')} step={500000} suffix="₫" />
            <NumField label={tr('Số tác vụ / ngày / người', 'Tasks per day / person')} value={i.tasksPerDay} onChange={set('tasksPerDay')} />
            <NumField label={tr('Phút / tác vụ', 'Minutes per task')} value={i.minutesPerTask} onChange={set('minutesPerTask')} step={0.25} />
            <NumField label={tr('Ngày làm việc / tháng', 'Working days / month')} value={i.workingDays} onChange={set('workingDays')} />
            <NumField label={tr('Giờ làm / ngày', 'Hours per day')} value={i.hoursPerDay} onChange={set('hoursPerDay')} />
            <NumField label={tr('Tỷ lệ tự động hóa', 'Expected automation')} value={Math.round(i.automationPct * 100)} onChange={(v) => set('automationPct')(Math.min(100, v) / 100)} suffix="%" />
            <NumField label={tr('Chi phí triển khai', 'Implementation cost')} value={i.implementationCost} onChange={set('implementationCost')} step={1000000} suffix="₫" />
            <NumField label={tr('Chi phí duy trì / tháng', 'Maintenance / month')} value={i.monthlyMaintenance} onChange={set('monthlyMaintenance')} step={100000} suffix="₫" />
          </div>
          <div className="mt-5 rounded-xl border border-line bg-surface-2 p-3.5 text-[12px] leading-relaxed text-muted">
            {tr('Giờ thủ công = nhân sự × tác vụ/ngày × phút/tác vụ ÷ 60 × ngày làm việc. Chi phí giờ = lương ÷ (ngày × giờ). Hoàn vốn = chi phí triển khai ÷ tiết kiệm ròng/tháng.', 'Manual hours = employees × tasks/day × minutes/task ÷ 60 × working days. Hourly cost = salary ÷ (days × hours). Payback = implementation ÷ monthly net saving.')}
          </div>
          {r.warnings.includes('workload_exceeds_capacity') && <p className="mt-3 text-[12.5px] text-warning">{tr('Khối lượng công việc vượt quá số giờ làm việc của nhân sự — hãy kiểm tra lại đầu vào.', 'Workload exceeds available working hours — please check the inputs.')}</p>}
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="accent">{i.processName || tr('Quy trình', 'Process')}</Badge>
              <span className="text-[13.5px] text-muted">{tr('Tự động hóa', 'Automating')} {formatValue(i.automationPct, 'percent', { lang })} {tr('khối lượng công việc thủ công', 'of manual workload')}</span>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Out icon={Clock} label={tr('Khối lượng thủ công', 'Manual workload')} value={fmtNumber(r.manualHoursMonth, 0, lang)} unit={tr('giờ/tháng', 'h/month')} sub={`${fm(r.annualLaborCost)} / ${tr('năm', 'year')}`} />
            <Out icon={Timer} label={tr('Có thể tự động hóa', 'Automatable')} value={fmtNumber(r.hoursSavedMonth, 0, lang)} unit={tr('giờ/tháng', 'h/month')} />
            <Out icon={Users} label={tr('Tương đương', 'Equivalent')} value={fmtNumber(r.fte, 2, lang)} unit="FTE" />
            <Out icon={Wallet} label={tr('Tiết kiệm gộp / năm', 'Gross annual saving')} value={fm(r.grossAnnualSaving)} sub={`${tr('Ròng', 'Net')}: ${fm(r.netAnnualSaving)}`} />
            <Out icon={Calculator} label={tr('Chi phí triển khai', 'Implementation')} value={fm(i.implementationCost)} />
            <Out icon={Timer} label={tr('Thời gian hoàn vốn', 'Payback period')} value={payback} unit={Number.isFinite(r.paybackMonths) ? tr('tháng', 'months') : undefined} tone={Number.isFinite(r.paybackMonths) ? 'positive' : 'negative'} />
            <Out icon={TrendingUp} label={tr('ROI năm đầu', 'First-year ROI')} value={formatValue(r.roiFirstYear, 'percent', { lang })} sub={`${tr('Lợi ích ròng năm đầu', 'Net first-year benefit')}: ${fm(r.netFirstYear)}`} tone={r.roiFirstYear >= 0 ? 'positive' : 'negative'} />
            <Out icon={TrendingUp} label={tr('Lợi ích 3 năm', '3-year benefit')} value={fm(r.threeYearBenefit)} sub={`ROI 3 ${tr('năm', 'yr')}: ${formatValue(r.roi3Year, 'percent', { lang })}`} tone={r.threeYearBenefit >= 0 ? 'positive' : 'negative'} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="BEFORE vs AFTER" subtitle={tr('Giờ công thủ công mỗi tháng', 'Manual hours per month')} />
              <div className="p-4"><Chart spec={hoursChart} height={240} animate={false} /></div>
            </Card>
            <Card>
              <CardHeader title={tr('Dòng lợi ích lũy kế', 'Cumulative benefit')} subtitle={tr('Điểm cắt trục 0 = thời điểm hoàn vốn', 'Crossing zero = payback point')} />
              <div className="p-4"><Chart spec={cashChart} height={240} animate={false} /></div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
