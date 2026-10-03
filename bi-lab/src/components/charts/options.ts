/** ChartSpec (data-only, produced by the engine) → ECharts option. */
import type { ChartSeries, ChartSpec } from '@/types/analysis'
import type { Lang, NumberFormat } from '@/types/core'
import { formatValue } from '@/lib/format'
import { periodShort, periodLabel } from '@/intelligence/analysis/time'
import type { ChartTheme } from './palette'

const PERIOD_RE = /^\d{4}(-\d{2}(-\d{2})?|-W\d{2}|-Q\d)?$/

function seriesColor(s: ChartSeries, i: number, t: ChartTheme): string {
  switch (s.tone) {
    case 'primary':
    case 'projection':
      return t.categorical[0]
    case 'secondary':
      return t.categorical[1]
    case 'muted':
      return t.subtle
    case 'positive':
      return t.positive
    case 'negative':
      return t.negative
    case 'warning':
      return t.warning
    default:
      return t.categorical[i % t.categorical.length]
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function buildOption(spec: ChartSpec, t: ChartTheme, lang: Lang, opts: { highlight?: string[]; compact?: boolean; animate?: boolean } = {}): Record<string, unknown> {
  const isPeriod = spec.categories.length > 0 && spec.categories.every((c) => PERIOD_RE.test(c))
  const catLabel = (c: string) => (isPeriod ? periodShort(c, lang) : c)
  const catFull = (c: string) => (isPeriod ? periodLabel(c, lang) : c)
  const fmt = (v: number, f: NumberFormat) => formatValue(v, f, { lang, compact: true })
  const axisFormat: NumberFormat = spec.series[0]?.format ?? 'number'
  const axisLabel = { color: t.muted, fontSize: 11, fontFamily: 'Inter Variable, system-ui, sans-serif' }
  const base: Record<string, unknown> = {
    animation: opts.animate !== false,
    animationDuration: 600,
    textStyle: { fontFamily: 'Inter Variable, system-ui, sans-serif', color: t.text },
    aria: { enabled: true },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: t.surface,
      borderColor: t.line,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: t.text, fontSize: 12 },
      extraCssText: 'border-radius:10px;box-shadow:0 12px 32px -12px rgba(0,0,0,.45);',
      axisPointer: { type: 'line', lineStyle: { color: t.subtle, type: 'dashed' } },
      formatter: (ps: { axisValue?: string; name?: string; seriesName: string; value: number; color: string; seriesIndex: number }[]) => {
        const arr = Array.isArray(ps) ? ps : [ps]
        const head = esc(catFull(String(arr[0]?.axisValue ?? arr[0]?.name ?? '')))
        const rows = arr
          .filter((p) => p.value !== null && p.value !== undefined && !Number.isNaN(p.value as number))
          .map((p) => `<div style="display:flex;align-items:center;gap:8px;margin-top:3px"><span style="width:8px;height:8px;border-radius:2px;background:${p.color}"></span><span style="color:${t.muted}">${esc(p.seriesName)}</span><b style="margin-left:auto;padding-left:12px">${esc(fmt(p.value as number, spec.series[p.seriesIndex]?.format ?? axisFormat))}</b></div>`)
          .join('')
        return `<div style="font-weight:600;margin-bottom:2px">${head}</div>${rows}`
      },
    },
  }
  const multi = spec.series.length > 1
  const legend = multi ? { top: 0, right: 0, itemWidth: 10, itemHeight: 10, icon: 'roundRect', textStyle: { color: t.muted, fontSize: 12 } } : undefined
  const grid = { left: 8, right: 16, top: multi ? 34 : 14, bottom: spec.zoom ? 44 : 8, containLabel: true }

  if (spec.kind === 'donut') {
    const s = spec.series[0]
    const total = s.values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
    return {
      ...base,
      tooltip: { ...(base.tooltip as object), trigger: 'item', formatter: (p: { name: string; value: number; percent: number }) => `<b>${esc(p.name)}</b><br/>${esc(fmt(p.value, s.format))} · ${p.percent.toFixed(1)}%` },
      legend: { type: 'scroll', orient: 'vertical', right: 0, top: 'middle', itemWidth: 10, itemHeight: 10, icon: 'roundRect', textStyle: { color: t.muted, fontSize: 12, width: 130, overflow: 'truncate' } },
      color: t.categorical,
      series: [
        {
          type: 'pie',
          radius: ['56%', '80%'],
          center: ['32%', '50%'],
          padAngle: 1.5,
          itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 4 },
          label: { show: true, position: 'center', formatter: () => `{a|${fmt(total, s.format)}}\n{b|${lang === 'vi' ? 'Tổng' : 'Total'}}`, rich: { a: { fontSize: 17, fontWeight: 600, color: t.text }, b: { fontSize: 11, color: t.muted, padding: [4, 0, 0, 0] } } },
          labelLine: { show: false },
          emphasis: { scale: true, scaleSize: 4, label: { show: true } },
          data: spec.categories.map((c, i) => ({ name: c, value: s.values[i] })),
        },
      ],
    }
  }

  if (spec.kind === 'scatter') {
    const pts = spec.points ?? []
    return {
      ...base,
      tooltip: { ...(base.tooltip as object), trigger: 'item', formatter: (p: { data: [number, number, string] }) => `<b>${esc(p.data[2])}</b><br/>X: ${esc(fmt(p.data[0], spec.xFormat ?? 'number'))}<br/>Y: ${esc(fmt(p.data[1], spec.yFormat ?? 'number'))}` },
      grid: { left: 8, right: 20, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: 'value', scale: true, axisLabel: { ...axisLabel, formatter: (v: number) => fmt(v, spec.xFormat ?? 'number') }, splitLine: { lineStyle: { color: t.line } }, axisLine: { show: false } },
      yAxis: { type: 'value', scale: true, axisLabel: { ...axisLabel, formatter: (v: number) => fmt(v, spec.yFormat ?? 'number') }, splitLine: { lineStyle: { color: t.line } } },
      series: [{ type: 'scatter', symbolSize: pts.length > 200 ? 6 : 10, itemStyle: { color: t.categorical[0], opacity: 0.75, borderColor: t.surface, borderWidth: 1 }, data: pts.map((p) => [p.x, p.y, p.label]) }],
    }
  }

  if (spec.kind === 'heatmap' && spec.heat) {
    const h = spec.heat
    const max = Math.max(...h.values.map((v) => v[2]), 1)
    return {
      ...base,
      tooltip: { ...(base.tooltip as object), trigger: 'item', formatter: (p: { data: [number, number, number] }) => `<b>${esc(h.y[p.data[1]])}</b> · ${esc(catFull(h.x[p.data[0]]))}<br/>${esc(fmt(p.data[2], h.format))}` },
      grid: { left: 8, right: 12, top: 8, bottom: 40, containLabel: true },
      xAxis: { type: 'category', data: h.x.map(catLabel), axisLabel, axisTick: { show: false }, axisLine: { show: false }, splitArea: { show: false } },
      yAxis: { type: 'category', data: h.y, axisLabel: { ...axisLabel, width: 120, overflow: 'truncate' }, axisTick: { show: false }, axisLine: { show: false } },
      visualMap: { min: 0, max, calculable: false, orient: 'horizontal', left: 'center', bottom: 0, itemWidth: 10, itemHeight: 120, inRange: { color: t.heat }, textStyle: { color: t.muted, fontSize: 11 }, formatter: (v: number) => fmt(v, h.format) },
      series: [{ type: 'heatmap', data: h.values, itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 3 }, emphasis: { itemStyle: { borderColor: t.text, borderWidth: 1 } } }],
    }
  }

  const horizontal = spec.kind === 'hbar'
  const cats = spec.categories.map(catLabel)
  const valueAxis = {
    type: 'value',
    axisLabel: { ...axisLabel, formatter: (v: number) => fmt(v, axisFormat) },
    splitLine: { lineStyle: { color: t.line } },
    axisLine: { show: false },
    axisTick: { show: false },
    max: spec.kind === 'pareto' ? 1 : undefined,
  }
  const catAxis = {
    type: 'category',
    data: horizontal ? [...cats].reverse() : cats,
    axisLabel: { ...axisLabel, width: horizontal ? 130 : undefined, overflow: 'truncate', hideOverlap: true, interval: horizontal ? 0 : 'auto' },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: t.line } },
    boundaryGap: spec.kind !== 'line' && spec.kind !== 'area',
  }
  const hl = new Set(opts.highlight ?? [])
  const series = spec.series.map((s, i) => {
    const color = seriesColor(s, i, t)
    const kind = s.kind ?? (spec.kind === 'area' ? 'area' : spec.kind === 'line' ? 'line' : 'bar')
    const data = horizontal ? [...s.values].reverse() : s.values
    const clean = data.map((v) => (Number.isFinite(v) ? v : null))
    if (kind === 'bar') {
      return {
        type: 'bar',
        name: s.name[lang],
        data: clean,
        barMaxWidth: horizontal ? 18 : 28,
        barGap: '18%',
        itemStyle: { color, borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        emphasis: { focus: 'series' },
      }
    }
    const markPoint = hl.size && i === 0
      ? { symbol: 'circle', symbolSize: 12, itemStyle: { color: t.negative, borderColor: t.surface, borderWidth: 2 }, label: { show: false }, data: spec.categories.map((c, j) => (hl.has(c) ? { coord: [cats[j], s.values[j]] } : null)).filter(Boolean) }
      : undefined
    return {
      type: 'line',
      name: s.name[lang],
      data: clean,
      smooth: 0.25,
      showSymbol: clean.length <= 24,
      symbolSize: 6,
      connectNulls: s.tone === 'projection',
      lineStyle: { width: 2, color, type: s.dashed ? 'dashed' : 'solid' },
      itemStyle: { color, borderColor: t.surface, borderWidth: 1.5 },
      areaStyle: kind === 'area' ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '00' }] } } : undefined,
      emphasis: { focus: 'series' },
      markPoint,
    }
  })
  return {
    ...base,
    legend,
    grid,
    xAxis: horizontal ? valueAxis : catAxis,
    yAxis: horizontal ? catAxis : valueAxis,
    dataZoom: spec.zoom && !horizontal ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 6, borderColor: t.line, fillerColor: t.categorical[0] + '22', handleSize: 14, textStyle: { color: t.muted, fontSize: 10 }, showDetail: false }] : undefined,
    series,
  }
}
