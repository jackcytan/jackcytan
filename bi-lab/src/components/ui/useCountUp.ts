import { useEffect, useRef, useState } from 'react'

/** Light count-up animation for KPI numbers (respects reduced motion). */
export function useCountUp(target: number, duration = 700): number {
  const [v, setV] = useState(Number.isFinite(target) ? target : 0)
  const from = useRef(0)
  useEffect(() => {
    if (!Number.isFinite(target)) return
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || duration <= 0) {
      setV(target)
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = 1 - Math.pow(1 - t, 3)
      setV(a + (target - a) * e)
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}
