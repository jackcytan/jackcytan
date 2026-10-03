import { useEffect, useRef, useState } from 'react'
import type { ChartSpec } from '@/types/analysis'
import { useStore } from '@/app/store'
import { readTheme } from './palette'
import { buildOption } from './options'
import { Skeleton } from '../ui/primitives'

type EChartsMod = typeof import('./echartsSetup')
let modPromise: Promise<EChartsMod> | null = null
export function loadEcharts() {
  if (!modPromise) modPromise = import('./echartsSetup')
  return modPromise
}

export interface ChartHandle {
  toDataURL: () => string | null
}

/** Lazy ECharts renderer. Charts re-theme on theme/language change and resize with their container. */
export function Chart({ spec, height = 280, highlight, onReady, animate = true }: { spec: ChartSpec; height?: number; highlight?: string[]; onReady?: (h: ChartHandle) => void; animate?: boolean }) {
  const el = useRef<HTMLDivElement>(null)
  const inst = useRef<import('echarts/core').ECharts | null>(null)
  const [ready, setReady] = useState(false)
  const theme = useStore((s) => s.theme)
  const lang = useStore((s) => s.lang)

  useEffect(() => {
    let disposed = false
    let ro: ResizeObserver | null = null
    loadEcharts().then(({ echarts }) => {
      if (disposed || !el.current) return
      inst.current = echarts.init(el.current, undefined, { renderer: 'canvas' })
      ro = new ResizeObserver(() => inst.current?.resize())
      ro.observe(el.current)
      setReady(true)
      onReady?.({ toDataURL: () => inst.current?.getDataURL({ pixelRatio: 2, backgroundColor: readTheme().surface }) ?? null })
    })
    return () => {
      disposed = true
      ro?.disconnect()
      inst.current?.dispose()
      inst.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready || !inst.current) return
    const t = readTheme()
    inst.current.setOption(buildOption(spec, t, lang, { highlight, animate }), { notMerge: true })
  }, [ready, spec, theme, lang, highlight, animate])

  return (
    <div className="relative w-full" style={{ height }}>
      {!ready && <Skeleton className="absolute inset-0" />}
      <div ref={el} className="h-full w-full" role="img" aria-label={spec.title.en} />
    </div>
  )
}
