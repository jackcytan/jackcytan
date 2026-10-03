import { Command, Database, Languages, Menu, Moon, ShieldCheck, Sun } from 'lucide-react'
import { NAV } from '@/app/nav'
import { navigate, setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { applyFormatContext } from '@/app/actions'
import { fmtNumber } from '@/lib/format'
import { IconButton, Kbd } from '../ui/primitives'
import { BrandMark } from './Sidebar'

export function Header({ onMenu }: { onMenu: () => void }) {
  const { tr, lang } = useT()
  const route = useStore((s) => s.route)
  const ds = useStore((s) => s.dataset)
  const processing = useStore((s) => s.processing)
  const theme = useStore((s) => s.theme)
  const item = NAV.find((n) => n.route === route)
  const setTheme = (t: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', t)
    setState({ theme: t })
  }
  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-4 backdrop-blur-md md:px-6">
      <IconButton icon={Menu} label={tr('Mở menu', 'Open menu')} onClick={onMenu} className="lg:hidden" />
      <button onClick={() => navigate('overview')} className="flex items-center gap-2 sm:hidden" aria-label="Anh Tân AI">
        <BrandMark size={26} />
        <span className="text-[12.5px] font-bold tracking-[0.06em]">ANH TÂN AI</span>
      </button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 whitespace-nowrap text-[13px] xl:flex">
        <span className="text-subtle">{tr('Không gian', 'Workspace')}</span>
        <span className="text-subtle">/</span>
        <span className="truncate font-medium text-muted">Anh Tân AI Lab</span>
        <span className="text-subtle">/</span>
        <span className="truncate font-semibold text-fg">{item ? (lang === 'vi' ? item.vi : item.en) : ''}</span>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => navigate(ds ? 'explorer' : 'import')} className="hidden h-8 min-w-0 max-w-[300px] items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[12.5px] md:flex" data-tip={tr('Trạng thái dữ liệu', 'Dataset status')} data-tip-pos="bottom">
          <Database size={14} className={ds ? 'text-accent' : 'text-subtle'} aria-hidden />
          {processing?.active ? (
            <span className="text-muted">{tr('Đang xử lý…', 'Processing…')}</span>
          ) : ds ? (
            <>
              <span className="truncate font-medium text-fg">{ds.name}</span>
              <span className="tabular shrink-0 text-subtle">· {fmtNumber(ds.rowCount, 0, lang)} {tr('dòng', 'rows')}</span>
            </>
          ) : (
            <span className="text-subtle">{tr('Chưa có dữ liệu', 'No dataset')}</span>
          )}
        </button>
        <button onClick={() => navigate('privacy')} className="hidden h-8 items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--positive)_30%,transparent)] bg-[color-mix(in_srgb,var(--positive)_9%,transparent)] px-2.5 text-[12px] font-semibold text-positive sm:flex" data-tip={tr('Dữ liệu được xử lý trực tiếp trên thiết bị của bạn', 'Your data never leaves your device')} data-tip-pos="bottom">
          <ShieldCheck size={14} aria-hidden />
          <span className="hidden lg:inline">{tr('Xử lý cục bộ', 'Local Processing')}</span>
          <span className="lg:hidden">Local</span>
        </button>
        <button onClick={() => setState({ paletteOpen: true })} className="hidden h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] text-muted hover:text-fg md:flex" aria-label={tr('Mở bảng lệnh', 'Open command palette')}>
          <Command size={14} aria-hidden />
          <span className="hidden whitespace-nowrap xl:inline">{tr('Tìm & lệnh', 'Search')}</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <IconButton
          icon={Languages}
          label={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          onClick={() => {
            const next = lang === 'vi' ? 'en' : 'vi'
            setState({ lang: next })
            document.documentElement.setAttribute('lang', next)
            applyFormatContext()
          }}
        />
        <IconButton icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? tr('Giao diện sáng', 'Light theme') : tr('Giao diện tối', 'Dark theme')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      </div>
    </header>
  )
}
