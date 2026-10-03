import { useEffect, useRef } from 'react'

/** Lightweight animated data-network background (canvas, ~40 nodes, pauses when hidden). */
export function NetworkBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      w = cv.clientWidth
      h = cv.clientHeight
      cv.width = w * dpr
      cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const N = Math.min(46, Math.floor((w * h) / 22000) + 18)
    const nodes = Array.from({ length: N }, () => ({ x: rnd() * w, y: rnd() * h, vx: (rnd() - 0.5) * 0.22, vy: (rnd() - 0.5) * 0.22, r: 1 + rnd() * 1.6 }))
    let raf = 0
    let running = true
    const color = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4f8cff'
    let c = color()
    let frame = 0
    const draw = () => {
      if (!running) return
      frame++
      if (frame % 120 === 0) c = color()
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }
      ctx.strokeStyle = c
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = dx * dx + dy * dy
          if (d < 140 * 140) {
            ctx.globalAlpha = (1 - Math.sqrt(d) / 140) * 0.22
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.fillStyle = c
      for (const n of nodes) {
        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()
    const vis = () => {
      running = !document.hidden
      if (running && !reduce) {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('resize', resize)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} className={className} aria-hidden />
}
