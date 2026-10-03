import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { AlertOctagon, AlertTriangle, Eye, Info, Lightbulb, TrendingUp, type LucideIcon } from 'lucide-react'
import type { Severity } from '@/types/analysis'
import { useT } from '@/i18n/useT'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export function Button({ variant = 'secondary', size = 'md', icon: Icon, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; icon?: LucideIcon }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-accent text-white hover:brightness-110 shadow-[0_6px_20px_-8px_var(--accent)] border border-transparent',
    secondary: 'bg-surface-2 text-fg border border-line hover:border-line-strong hover:bg-surface-3',
    outline: 'bg-transparent text-fg border border-line-strong hover:bg-surface-2',
    ghost: 'bg-transparent text-muted hover:text-fg hover:bg-surface-2 border border-transparent',
    danger: 'bg-transparent text-negative border border-[color-mix(in_srgb,var(--negative)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--negative)_10%,transparent)]',
  }
  const s = { sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg', md: 'h-10 px-4 text-sm gap-2 rounded-xl', lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl' }[size]
  return (
    <button className={cx('inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap', v[variant], s, className)} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, label, className, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <button aria-label={label} data-tip={label} data-tip-pos="bottom" className={cx('inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors', active ? 'border-line-strong bg-surface-3 text-fg' : 'border-transparent text-muted hover:text-fg hover:bg-surface-2', className)} {...rest}>
      <Icon size={18} strokeWidth={1.9} aria-hidden />
    </button>
  )
}

export function Card({ children, className, hover, ...rest }: { children: ReactNode; className?: string; hover?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('card', hover && 'card-hover', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, right, className }: { title: ReactNode; subtitle?: ReactNode; icon?: LucideIcon; right?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon size={17} strokeWidth={2} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-fg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-muted">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'neutral', className, icon: Icon }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'positive' | 'warning' | 'negative' | 'violet' | 'cyan'; className?: string; icon?: LucideIcon }) {
  const map = {
    neutral: 'text-muted bg-surface-2 border-line',
    accent: 'text-accent bg-accent-soft border-[color-mix(in_srgb,var(--accent)_25%,transparent)]',
    positive: 'text-positive bg-[color-mix(in_srgb,var(--positive)_10%,transparent)] border-[color-mix(in_srgb,var(--positive)_25%,transparent)]',
    warning: 'text-warning bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] border-[color-mix(in_srgb,var(--warning)_28%,transparent)]',
    negative: 'text-negative bg-[color-mix(in_srgb,var(--negative)_10%,transparent)] border-[color-mix(in_srgb,var(--negative)_28%,transparent)]',
    violet: 'text-violet bg-[color-mix(in_srgb,var(--violet)_10%,transparent)] border-[color-mix(in_srgb,var(--violet)_25%,transparent)]',
    cyan: 'text-cyan bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)] border-[color-mix(in_srgb,var(--cyan)_25%,transparent)]',
  }
  return (
    <span className={cx('inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border px-2 text-[11.5px] font-semibold tracking-wide', map[tone], className)}>
      {Icon && <Icon size={12.5} strokeWidth={2.2} aria-hidden />}
      {children}
    </span>
  )
}

export const SEVERITY_META: Record<Severity, { icon: LucideIcon; tone: 'negative' | 'warning' | 'violet' | 'cyan' | 'positive' | 'neutral'; vi: string; en: string }> = {
  critical: { icon: AlertOctagon, tone: 'negative', vi: 'Nghiêm trọng', en: 'Critical' },
  warning: { icon: AlertTriangle, tone: 'warning', vi: 'Cảnh báo', en: 'Warning' },
  watch: { icon: Eye, tone: 'violet', vi: 'Theo dõi', en: 'Watch' },
  opportunity: { icon: Lightbulb, tone: 'cyan', vi: 'Cơ hội', en: 'Opportunity' },
  positive: { icon: TrendingUp, tone: 'positive', vi: 'Tích cực', en: 'Positive' },
  info: { icon: Info, tone: 'neutral', vi: 'Thông tin', en: 'Info' },
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { lang } = useT()
  const m = SEVERITY_META[severity]
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {m[lang]}
    </Badge>
  )
}

export function toneColor(tone: string): string {
  return ({ negative: 'var(--negative)', warning: 'var(--warning)', violet: 'var(--violet)', cyan: 'var(--cyan)', positive: 'var(--positive)', neutral: 'var(--muted)', accent: 'var(--accent)' } as Record<string, string>)[tone] ?? 'var(--muted)'
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md', ariaLabel }: { value: T; options: { value: T; label: ReactNode; icon?: LucideIcon }[]; onChange: (v: T) => void; size?: 'sm' | 'md'; ariaLabel?: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx('inline-flex items-center gap-1.5 rounded-lg font-medium transition-all', size === 'sm' ? 'h-7 px-2.5 text-[12.5px]' : 'h-8 px-3 text-[13px]', value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg')}
        >
          {o.icon && <o.icon size={14} aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx('h-9 rounded-lg border border-line bg-surface-2 px-2.5 text-[13px] text-fg outline-none transition-colors hover:border-line-strong focus:border-accent', className)} {...rest}>
      {children}
    </select>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors', checked ? 'border-transparent bg-accent' : 'border-line-strong bg-surface-3')}>
      <span className={cx('inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-[3px]')} style={{ width: 18, height: 18 }} />
    </button>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} aria-hidden />
}

export function ProgressBar({ value, tone = 'accent', className }: { value: number; tone?: string; className?: string }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: toneColor(tone) }} />
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface-2 px-1 font-mono text-[10.5px] font-medium text-muted">{children}</kbd>
}

export function PageHeader({ title, subtitle, eyebrow, right, icon: Icon }: { title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; right?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 lg:max-w-[62%]">
        {eyebrow && <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</div>}
        <h1 className="flex items-center gap-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-fg md:text-[28px]">
          {Icon && <Icon size={26} className="text-accent" strokeWidth={1.8} aria-hidden />}
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-[14.5px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{right}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, actions }: { icon: LucideIcon; title: ReactNode; text?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-accent">
        <Icon size={26} strokeWidth={1.7} aria-hidden />
      </span>
      <h3 className="text-[17px] font-semibold text-fg">{title}</h3>
      {text && <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-muted">{text}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cx('h-px w-full bg-line', className)} />
}

export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-subtle">{label}</div>
      <div className="tabular mt-1 truncate text-[20px] font-semibold tracking-[-0.01em] text-fg">{value}</div>
      {sub && <div className="mt-0.5 text-[12.5px] text-muted">{sub}</div>}
    </div>
  )
}
