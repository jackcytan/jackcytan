import { cx } from './primitives'

export function Slider({ label, value, onChange, min = -50, max = 50, step = 1, suffix = '%', hint, disabled }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; hint?: string; disabled?: boolean }) {
  const pct = ((value - min) / (max - min)) * 100
  const zero = ((0 - min) / (max - min)) * 100
  const left = Math.min(pct, zero)
  const width = Math.abs(pct - zero)
  return (
    <div className={cx(disabled && 'opacity-40')}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-[13.5px] font-medium text-fg">{label}</label>
        <span className={cx('tabular text-[14px] font-semibold', value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-muted')}>{value > 0 ? '+' : ''}{value}{suffix}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-surface-3" />
        {min < 0 && <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent" style={{ left: `${left}%`, width: `${width}%` }} />}
        {min >= 0 && <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent" style={{ left: 0, width: `${pct}%` }} />}
        {min < 0 && <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-line-strong" style={{ left: `${zero}%` }} />}
        <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&:focus-visible::-webkit-slider-thumb]:shadow-[0_0_0_5px_color-mix(in_srgb,var(--accent)_35%,transparent)] [&:focus-visible::-moz-range-thumb]:shadow-[0_0_0_5px_color-mix(in_srgb,var(--accent)_35%,transparent)] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-accent [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,.35)]" />
      </div>
      {hint && <p className="mt-1 text-[11.5px] text-subtle">{hint}</p>}
    </div>
  )
}
