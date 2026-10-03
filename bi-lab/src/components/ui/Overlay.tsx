import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from './primitives'

function useEscape(onClose: () => void, open: boolean) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, open])
}

export function Drawer({ open, onClose, title, subtitle, children, width = 520 }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; width?: number }) {
  useEscape(onClose, open)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 no-print" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-line bg-surface shadow-[var(--shadow-pop)] outline-none" style={{ maxWidth: width, animation: 'drawer-in .22s ease-out' }}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-snug text-fg">{title}</h2>
            {subtitle && <div className="mt-1 text-[13px] text-muted">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
      <style>{'@keyframes drawer-in{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}'}</style>
    </div>
  )
}

export function Modal({ open, onClose, children, className, label }: { open: boolean; onClose: () => void; children: ReactNode; className?: string; label?: string }) {
  useEscape(onClose, open)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] no-print" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
      <div className={cx('relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-pop)]', className)} style={{ animation: 'modal-in .18s ease-out' }}>
        {children}
      </div>
      <style>{'@keyframes modal-in{from{transform:translateY(8px) scale(.985);opacity:0}to{transform:none;opacity:1}}'}</style>
    </div>
  )
}
