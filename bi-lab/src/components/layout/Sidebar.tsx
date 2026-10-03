import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { NAV, APP_VERSION } from '@/app/nav'
import { navigate, setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { cx } from '../ui/primitives'

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f8cff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0b1224" />
      <rect x="1" y="1" width="62" height="62" rx="14" fill="none" stroke="url(#bm)" strokeOpacity=".6" strokeWidth="2" />
      <path d="M16 44V30M26 44V22M36 44V27M46 44V16" stroke="url(#bm)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="46" cy="16" r="3.5" fill="#5eead4" />
    </svg>
  )
}

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { tr, lang } = useT()
  const route = useStore((s) => s.route)
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const hasData = useStore((s) => !!s.analysis)
  const groups: { id: string; vi: string; en: string }[] = [
    { id: 'analyze', vi: 'Phân tích', en: 'Analyze' },
    { id: 'decide', vi: 'Ra quyết định', en: 'Decide' },
    { id: 'workspace', vi: 'Không gian làm việc', en: 'Workspace' },
  ]
  const wide = !collapsed || mobileOpen
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden no-print" onClick={onCloseMobile} />}
      <aside
        className={cx(
          'no-print fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-[width,transform] duration-200',
          wide ? 'w-[248px]' : 'w-[72px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Sidebar"
      >
        <div className={cx('flex h-16 items-center gap-3 border-b border-line', wide ? 'px-5' : 'justify-center px-0')}>
          <button onClick={() => navigate('overview')} className="flex items-center gap-3 text-left" aria-label="Anh Tân AI">
            <BrandMark size={32} />
            {wide && (
              <div className="leading-tight">
                <div className="text-[13.5px] font-bold tracking-[0.06em] text-fg">ANH TÂN AI</div>
                <div className="text-[11px] font-medium tracking-wide text-muted">Business Intelligence Lab</div>
              </div>
            )}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <div key={g.id} className="mb-5">
              {wide ? <div className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-subtle">{lang === 'vi' ? g.vi : g.en}</div> : <div className="mx-auto mb-2 h-px w-6 bg-line" />}
              <ul className="space-y-0.5">
                {NAV.filter((n) => n.group === g.id).map((n) => {
                  const active = route === n.route
                  const label = lang === 'vi' ? n.vi : n.en
                  const dim = n.needsData && !hasData
                  return (
                    <li key={n.route}>
                      <button
                        onClick={() => {
                          navigate(n.route)
                          onCloseMobile()
                        }}
                        aria-current={active ? 'page' : undefined}
                        data-tip={!wide ? label : undefined}
                        data-tip-pos="right"
                        className={cx(
                          'group relative flex h-9 w-full items-center gap-3 rounded-lg text-[13.5px] font-medium transition-colors',
                          wide ? 'px-3' : 'justify-center',
                          active ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                          dim && !active && 'opacity-60',
                        )}
                      >
                        {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent" />}
                        <n.icon size={18} strokeWidth={active ? 2.1 : 1.8} className={active ? 'text-accent' : ''} aria-hidden />
                        {wide && <span className="truncate">{label}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className={cx('border-t border-line', wide ? 'px-5 py-4' : 'px-2 py-3')}>
          {wide ? (
            <button onClick={() => setState({ aboutOpen: true })} className="w-full text-left">
              <div className="text-[12px] font-semibold tracking-[0.06em] text-fg">ANH TÂN AI</div>
              <div className="text-[11.5px] text-muted">{tr('Phát triển bởi Anh Tân AI', 'Developed by Anh Tân AI')}</div>
              <div className="mt-0.5 text-[11px] text-subtle">v{APP_VERSION} · {tr('Xử lý cục bộ 100%', '100% local processing')}</div>
            </button>
          ) : (
            <div className="text-center text-[10px] text-subtle">v{APP_VERSION}</div>
          )}
          <button onClick={() => setState((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))} className={cx('mt-3 hidden h-8 items-center gap-2 rounded-lg text-[12px] text-muted hover:bg-surface-2 hover:text-fg lg:flex', wide ? 'w-full px-2' : 'w-full justify-center')} aria-label={collapsed ? tr('Mở rộng thanh bên', 'Expand sidebar') : tr('Thu gọn thanh bên', 'Collapse sidebar')}>
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            {wide && tr('Thu gọn', 'Collapse')}
          </button>
        </div>
      </aside>
    </>
  )
}
