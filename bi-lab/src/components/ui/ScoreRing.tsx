import { useCountUp } from './useCountUp'

export function scoreTone(score: number) {
  return score >= 75 ? 'var(--positive)' : score >= 55 ? 'var(--warning)' : 'var(--negative)'
}

export function ScoreRing({ score, size = 132, stroke = 10, label, sublabel }: { score: number; size?: number; stroke?: number; label?: string; sublabel?: string }) {
  const shown = useCountUp(score, 900)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = scoreTone(score)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? ''} ${Math.round(score)}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, shown)) / 100)} style={{ transition: 'stroke 0.3s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="tabular text-[30px] font-semibold leading-none tracking-[-0.03em] text-fg" style={{ fontSize: size * 0.24 }}>
          {Math.round(shown)}
        </div>
        <div className="mt-1 text-[11px] font-medium text-subtle">/ 100</div>
        {sublabel && <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>{sublabel}</div>}
      </div>
    </div>
  )
}
