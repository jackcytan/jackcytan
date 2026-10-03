import { useMemo, useState } from 'react'
import { ArrowRight, Bookmark, FlaskConical, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { toast, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Segmented, cx } from '@/components/ui/primitives'
import { Slider } from '@/components/ui/Slider'
import { Chart } from '@/components/charts/Chart'
import { Ctx } from '@/intelligence/analysis/context'
import { priceForTargetProfit, runScenario, scenarioBase, ZERO_INPUTS, type ScenarioInputs } from '@/intelligence/scenario/scenario'
import { formatValue } from '@/lib/format'
import { periodLabel } from '@/intelligence/analysis/time'
import type { ChartSpec } from '@/types/analysis'

interface Saved {
  name: string
  inputs: ScenarioInputs
}
const KEY = 'bilab.scenarios.v1'
function loadSaved(): Saved[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export default function Scenario() {
  const { tr, lang } = useT()
  const ds = useStore((s) => s.dataset)!
  const a = useStore((s) => s.analysis)!
  const [basis, setBasis] = useState<'all' | 'latest'>('all')
  const [inp, setInp] = useState<ScenarioInputs>(ZERO_INPUTS)
  const [saved, setSaved] = useState<Saved[]>(loadSaved)
  const [cmp, setCmp] = useState<number[]>([])
  const base = useMemo(() => {
    const root = new Ctx(ds, a.roles)
    if (basis === 'latest' && a.time?.currentLabel && a.roles.date) {
      const p = a.time.periods.find((x) => x.label === a.time!.currentLabel)!
      const d = ds.num[a.roles.date]
      const idx: number[] = []
      for (let i = 0; i < ds.rowCount; i++) if (d[i] >= p.start && d[i] < p.end) idx.push(i)
      return scenarioBase(root.subset(Int32Array.from(idx)))
    }
    return scenarioBase(root)
  }, [ds, a, basis])
  if (!base) {
    return (
      <div>
        <PageHeader eyebrow="WHAT-IF SCENARIO LAB" icon={FlaskConical} title="Scenario Lab" />
        <Card><EmptyState icon={FlaskConical} title={tr('Cần dữ liệu doanh thu để mô phỏng', 'Revenue data is needed for simulation')} text={tr('Scenario Lab hoạt động với dữ liệu Sales / Finance có trường doanh thu (và tốt nhất là chi phí). Hãy gán vai trò "Doanh thu" trong màn hình Mapping hoặc mở Sales Demo.', 'Scenario Lab works with Sales / Finance data that has a revenue field (ideally cost too). Assign the "Revenue" role on the Mapping screen or open the Sales Demo.')} /></Card>
      </div>
    )
  }
  const out = runScenario(base, inp)
  const set = (k: keyof ScenarioInputs) => (v: number) => setInp((s) => ({ ...s, [k]: k === 'variableShare' ? v / 100 : v / 100 }))
  const pctOf = (v: number) => Math.round(v * 100)
  const fm = (v: number) => formatValue(v, 'currency', { lang })
  const priceFor10 = priceForTargetProfit(base, inp, base.profit * 1.1)
  const chart: ChartSpec = {
    id: 'scn', kind: 'bar', title: { vi: 'Hiện tại so với kịch bản', en: 'Current vs scenario' },
    categories: [tr('Doanh thu', 'Revenue'), tr('Chi phí', 'Cost'), ...(base.marketing ? [tr('Marketing', 'Marketing')] : []), ...(base.personnel ? [tr('Nhân sự', 'Personnel')] : []), tr('Lợi nhuận', 'Profit')],
    series: [
      { name: { vi: 'Hiện tại', en: 'Current' }, values: [base.revenue, base.cost, ...(base.marketing ? [base.marketing] : []), ...(base.personnel ? [base.personnel] : []), base.profit], format: 'currency', tone: 'muted' },
      { name: { vi: 'Kịch bản', en: 'Scenario' }, values: [out.revenue, out.cost, ...(base.marketing ? [out.marketing] : []), ...(base.personnel ? [out.personnel] : []), out.profit], format: 'currency', tone: 'primary' },
    ],
  }
  const save = () => {
    const name = `${tr('Kịch bản', 'Scenario')} ${String.fromCharCode(65 + (saved.length % 26))}`
    const next = [...saved, { name, inputs: inp }].slice(-8)
    setSaved(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    toast(tr(`Đã lưu ${name} trên thiết bị này`, `${name} saved on this device`), 'success')
  }
  const remove = (i: number) => {
    const next = saved.filter((_, j) => j !== i)
    setSaved(next)
    setCmp([])
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  const compareCols = [{ name: tr('Hiện tại (Base)', 'Base'), o: { revenue: base.revenue, cost: base.cost + base.marketing + base.personnel + base.otherCosts, profit: base.profit, margin: base.margin } }, ...cmp.map((i) => { const r = runScenario(base, saved[i].inputs); return { name: saved[i].name, o: { revenue: r.revenue, cost: r.cost + r.marketing + r.personnel + base.otherCosts, profit: r.profit, margin: r.margin } } })]
  const Block = ({ title, tone, rev, profit, margin }: { title: string; tone: string; rev: number; profit: number; margin: number }) => (
    <Card className="p-5">
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: tone }}>{title}</div>
      <div className="mt-3 space-y-3">
        <div><div className="text-[12px] text-subtle">{tr('Doanh thu', 'Revenue')}</div><div className="tabular text-[22px] font-semibold">{fm(rev)}</div></div>
        <div><div className="text-[12px] text-subtle">{tr('Lợi nhuận', 'Profit')}</div><div className="tabular text-[22px] font-semibold">{fm(profit)}</div></div>
        <div><div className="text-[12px] text-subtle">{tr('Biên lợi nhuận', 'Margin')}</div><div className="tabular text-[22px] font-semibold">{formatValue(margin, 'percent', { lang })}</div></div>
      </div>
    </Card>
  )
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WHAT-IF SCENARIO LAB"
        icon={FlaskConical}
        title={tr('Mô phỏng kịch bản kinh doanh', 'Business scenario simulation')}
        subtitle={tr('Kéo các biến số — kết quả được tính lại tức thì từ số liệu thực tế của bạn. Mô hình minh bạch, không phải dự đoán.', 'Drag the drivers — results recalculate instantly from your actual figures. A transparent model, not a prediction.')}
        right={
          <>
            {a.time?.currentLabel && <Segmented value={basis} onChange={setBasis} options={[{ value: 'all', label: tr('Toàn bộ dữ liệu', 'All data') }, { value: 'latest', label: periodLabel(a.time.currentLabel, lang) }]} />}
            <Button icon={RotateCcw} onClick={() => setInp(ZERO_INPUTS)}>Reset</Button>
            <Button variant="primary" icon={Bookmark} onClick={save}>{tr('Lưu kịch bản', 'Save scenario')}</Button>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <Card className="h-fit p-6">
          <div className="mb-5 flex items-center gap-2 text-[14px] font-semibold"><SlidersHorizontal size={16} className="text-accent" /> {tr('Biến số', 'Drivers')}</div>
          <div className="space-y-6">
            <Slider label={tr('Doanh thu (theo sản lượng)', 'Revenue (volume-driven)')} value={pctOf(inp.revenuePct)} onChange={set('revenuePct')} hint={tr('Chi phí biến đổi tăng theo', 'Variable costs scale with it')} />
            <Slider label={tr('Giá bán', 'Price')} value={pctOf(inp.pricePct)} onChange={set('pricePct')} min={-30} max={30} hint={tr('Doanh thu thay đổi, chi phí giữ nguyên', 'Revenue changes, costs unchanged')} />
            <Slider label={tr('Sản lượng / số đơn', 'Volume')} value={pctOf(inp.volumePct)} onChange={set('volumePct')} />
            {base.available.cost && <Slider label={tr('Chi phí đơn vị', 'Unit cost')} value={pctOf(inp.costPct)} onChange={set('costPct')} min={-30} max={30} />}
            {base.available.marketing && <Slider label={tr('Chi phí marketing', 'Marketing spend')} value={pctOf(inp.marketingPct)} onChange={set('marketingPct')} />}
            {base.available.personnel && <Slider label={tr('Chi phí nhân sự', 'Personnel cost')} value={pctOf(inp.personnelPct)} onChange={set('personnelPct')} min={-30} max={30} />}
            {base.available.conversion && <Slider label={tr('Tỷ lệ chuyển đổi', 'Conversion rate')} value={pctOf(inp.conversionPct)} onChange={set('conversionPct')} min={-30} max={30} />}
            {base.available.cost && <Slider label={tr('Giả định: tỷ lệ chi phí biến đổi', 'Assumption: variable cost share')} value={pctOf(inp.variableShare)} onChange={set('variableShare')} min={0} max={100} hint={tr('Phần chi phí thay đổi theo sản lượng', 'Share of cost that moves with volume')} />}
          </div>
          <div className="mt-6 rounded-xl border border-line bg-surface-2 p-3.5 text-[12px] leading-relaxed text-muted">
            <b className="text-fg">{tr('Mô hình', 'Model')}:</b> Revenue′ = Revenue × (1+price) × (1+revenue)(1+volume)(1+conversion) · Cost′ = (Cost × variable × volume + Cost × fixed) × (1+unit cost)
          </div>
        </Card>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Block title="CURRENT" tone="var(--muted)" rev={base.revenue} profit={base.profit} margin={base.margin} />
            <Block title="SCENARIO" tone="var(--accent)" rev={out.revenue} profit={out.profit} margin={out.margin} />
            <Card className="relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(ellipse at top right, ${out.deltaProfit >= 0 ? 'color-mix(in srgb, var(--positive) 18%, transparent)' : 'color-mix(in srgb, var(--negative) 18%, transparent)'}, transparent 70%)` }} />
              <div className="relative">
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">IMPACT</div>
                <div className={cx('tabular mt-3 text-[28px] font-semibold', out.deltaProfit >= 0 ? 'text-positive' : 'text-negative')}>{formatValue(out.deltaProfit, 'currency', { lang, signed: true })}</div>
                <div className="text-[13px] text-muted">{tr('Lợi nhuận', 'Profit')} ({formatValue(base.profit ? out.deltaProfit / Math.abs(base.profit) : NaN, 'percent', { lang, signed: true })})</div>
                <div className="mt-4 space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-muted">{tr('Doanh thu', 'Revenue')}</span><span className="tabular font-semibold">{formatValue(out.deltaRevenue, 'currency', { lang, signed: true })}</span></div>
                  <div className="flex justify-between"><span className="text-muted">{tr('Biên lợi nhuận', 'Margin')}</span><span className="tabular font-semibold">{formatValue(out.deltaMarginPp, 'pp', { lang, signed: true })}</span></div>
                </div>
              </div>
            </Card>
          </div>
          <Card>
            <CardHeader title={tr('So sánh trực quan', 'Visual comparison')} subtitle={basis === 'all' ? tr('Cơ sở: toàn bộ dữ liệu', 'Basis: full dataset') : tr('Cơ sở: kỳ gần nhất', 'Basis: latest period')} />
            <div className="p-4"><Chart spec={chart} height={260} animate={false} /></div>
          </Card>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3 text-[13.5px]">
              <Badge tone="cyan">Goal seek</Badge>
              <span className="text-muted">{tr('Để lợi nhuận cao hơn hiện tại 10% (giữ các giả định khác), giá bán cần thay đổi', 'To reach +10% profit versus today (other assumptions unchanged), price needs to change by')}</span>
              <span className="tabular font-semibold text-fg">{formatValue(priceFor10, 'percent', { lang, signed: true })}</span>
              <Button size="sm" variant="ghost" icon={ArrowRight} onClick={() => setInp((s) => ({ ...s, pricePct: Math.round(priceFor10 * 1000) / 1000 }))}>{tr('Áp dụng', 'Apply')}</Button>
            </div>
          </Card>
        </div>
      </div>
      <Card className="overflow-hidden">
        <CardHeader icon={Bookmark} title={tr('So sánh kịch bản', 'Compare scenarios')} subtitle={tr('Chọn tối đa 2 kịch bản đã lưu (lưu cục bộ trên thiết bị này)', 'Pick up to 2 saved scenarios (stored locally on this device)')} />
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {saved.map((sv, i) => (
            <span key={i} className={cx('inline-flex items-center gap-1 rounded-lg border pl-3 text-[13px]', cmp.includes(i) ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2')}>
              <button onClick={() => setCmp((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i].slice(-2)))} className="py-1.5 font-medium">{sv.name}</button>
              <button onClick={() => setInp(sv.inputs)} className="px-1.5 text-[12px] text-accent">{tr('Mở', 'Load')}</button>
              <button onClick={() => remove(i)} className="pr-2 text-subtle hover:text-negative" aria-label={tr('Xóa', 'Delete')}><Trash2 size={13} /></button>
            </span>
          ))}
          {!saved.length && <span className="text-[13px] text-subtle">{tr('Chưa có kịch bản nào được lưu.', 'No saved scenarios yet.')}</span>}
        </div>
        <div className="mt-4 overflow-x-auto border-t border-line">
          <table className="w-full min-w-[560px] text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.08em] text-subtle">
                <th className="px-5 py-3 font-semibold" />
                {compareCols.map((c) => <th key={c.name} className="px-5 py-3 text-right font-semibold">{c.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {(['revenue', 'cost', 'profit', 'margin'] as const).map((k) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-muted">{{ revenue: tr('Doanh thu', 'Revenue'), cost: tr('Tổng chi phí', 'Total cost'), profit: tr('Lợi nhuận', 'Profit'), margin: tr('Biên lợi nhuận', 'Margin') }[k]}</td>
                  {compareCols.map((c) => <td key={c.name} className="tabular px-5 py-3 text-right font-semibold">{k === 'margin' ? formatValue(c.o[k], 'percent', { lang }) : fm(c.o[k])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
