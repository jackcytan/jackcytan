import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { Database, PlayCircle, Upload } from 'lucide-react'
import { navigate, useStore, type Route } from './store'
import { NAV } from './nav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AboutDialog, CommandPalette, Onboarding, Toasts } from '@/components/layout/Overlays'
import { ExplainDrawer } from '@/components/insight/ExplainDrawer'
import { Button, Card, EmptyState, Skeleton, cx } from '@/components/ui/primitives'
import { useT } from '@/i18n/useT'
import { applyFormatContext } from './actions'
import Overview from '@/pages/Overview'

const PAGES: Record<Exclude<Route, 'overview'>, ComponentType> = {
  import: lazy(() => import('@/pages/Import')),
  dashboard: lazy(() => import('@/pages/Dashboard')),
  explorer: lazy(() => import('@/pages/Explorer')),
  health: lazy(() => import('@/pages/Health')),
  anomalies: lazy(() => import('@/pages/Anomalies')),
  ask: lazy(() => import('@/pages/Ask')),
  scenario: lazy(() => import('@/pages/Scenario')),
  roi: lazy(() => import('@/pages/Roi')),
  report: lazy(() => import('@/pages/Report')),
  demo: lazy(() => import('@/pages/Demo')),
  privacy: lazy(() => import('@/pages/Privacy')),
  settings: lazy(() => import('@/pages/Settings')),
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  )
}

function NeedsData() {
  const { tr } = useT()
  return (
    <Card className="mx-auto mt-10 max-w-2xl">
      <EmptyState
        icon={Database}
        title={tr('Bắt đầu với dữ liệu kinh doanh của bạn', 'Start with your business data')}
        text={tr('Tải lên file Excel/CSV hoặc mở một bộ dữ liệu demo. Mọi phân tích chạy ngay trên thiết bị này.', 'Upload an Excel/CSV file or open a demo dataset. All analysis runs on this device.')}
        actions={
          <>
            <Button variant="primary" icon={Upload} onClick={() => navigate('import')}>{tr('Tải dữ liệu lên', 'Upload data')}</Button>
            <Button icon={PlayCircle} onClick={() => navigate('demo')}>{tr('Khám phá Demo', 'Explore demos')}</Button>
          </>
        }
      />
    </Card>
  )
}

export function App() {
  const route = useStore((s) => s.route)
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const hasData = useStore((s) => !!s.analysis)
  const lang = useStore((s) => s.lang)
  const [mobileNav, setMobileNav] = useState(false)
  useEffect(() => {
    applyFormatContext()
  }, [lang])
  useEffect(() => {
    // keyboard shortcuts: g + letter
    let g = false
    let timer = 0
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'g') {
        g = true
        clearTimeout(timer)
        timer = window.setTimeout(() => (g = false), 900)
        return
      }
      if (g) {
        const n = NAV.find((x) => x.shortcut?.toLowerCase() === e.key.toLowerCase())
        if (n) navigate(n.route)
        g = false
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const item = NAV.find((n) => n.route === route)
  const Page = route === 'overview' ? Overview : PAGES[route]
  const blocked = item?.needsData && !hasData
  return (
    <LazyMotion features={domAnimation} strict>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
      <Sidebar mobileOpen={mobileNav} onCloseMobile={() => setMobileNav(false)} />
      <div className={cx('min-h-full transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-[248px]')}>
        <Header onMenu={() => setMobileNav(true)} />
        <main id="main" className="print-root mx-auto w-full max-w-[1480px] px-4 pb-16 pt-6 md:px-8 md:pt-8">
          <m.div key={route} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
            <Suspense fallback={<PageSkeleton />}>{blocked ? <NeedsData /> : <Page />}</Suspense>
          </m.div>
        </main>
      </div>
      <ExplainDrawer />
      <CommandPalette />
      <AboutDialog />
      <Onboarding />
      <Toasts />
    </LazyMotion>
  )
}
