import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, CornerDownLeft, Info, Moon, PlayCircle, Search, ShieldCheck, Sun, Upload, XCircle, AlertTriangle, BarChart3, Lock, Cpu } from 'lucide-react'
import { NAV } from '@/app/nav'
import { getState, navigate, persistPrefs, setState, useStore } from '@/app/store'
import { useT } from '@/i18n/useT'
import { DEMOS } from '@/demo/generator'
import { loadDemo } from '@/app/actions'
import { Modal } from '../ui/Overlay'
import { Button, Kbd, cx } from '../ui/primitives'
import { BrandMark } from './Sidebar'
import { APP_VERSION } from '@/app/nav'

interface Cmd {
  id: string
  label: string
  hint?: string
  icon: typeof Search
  run: () => void
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen)
  const { tr, lang } = useT()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const hasData = useStore((s) => !!s.analysis)
  const cmds = useMemo<Cmd[]>(() => {
    const c: Cmd[] = NAV.map((n) => ({ id: 'nav:' + n.route, label: lang === 'vi' ? n.vi : n.en, hint: tr('Đi tới', 'Go to'), icon: n.icon, run: () => navigate(n.route) }))
    c.push(...DEMOS.map((d) => ({ id: 'demo:' + d.id, label: `${tr('Mở', 'Open')} ${d.name[lang]}`, hint: 'Demo', icon: PlayCircle, run: () => loadDemo(d.id) })))
    c.push({ id: 'theme', label: tr('Đổi giao diện sáng / tối', 'Toggle light / dark theme'), icon: getState().theme === 'dark' ? Sun : Moon, run: () => { const t = getState().theme === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); setState({ theme: t }) } })
    c.push({ id: 'about', label: tr('Giới thiệu Anh Tân AI', 'About Anh Tân AI'), icon: Info, run: () => setState({ aboutOpen: true }) })
    if (hasData) c.push({ id: 'ask', label: tr('Hỏi dữ liệu: ', 'Ask your data: ') + (q || '…'), hint: 'Enter', icon: Search, run: () => { setState({ pendingQuery: q }); navigate('ask') } })
    return c
  }, [lang, tr, hasData, q])
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    if (!n) return cmds.filter((c) => c.id !== 'ask')
    const hits = cmds.filter((c) => c.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').includes(n))
    const ask = cmds.find((c) => c.id === 'ask')
    return ask && !hits.includes(ask) ? [...hits, ask] : hits
  }, [cmds, q])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setState((s) => ({ paletteOpen: !s.paletteOpen }))
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
    }
  }, [open])
  const close = () => setState({ paletteOpen: false })
  const run = (c: Cmd | undefined) => {
    if (!c) return
    close()
    c.run()
  }
  return (
    <Modal open={open} onClose={close} label={tr('Bảng lệnh', 'Command palette')} className="max-w-xl">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} className="text-subtle" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setSel(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSel((s) => Math.min(filtered.length - 1, s + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSel((s) => Math.max(0, s - 1))
            } else if (e.key === 'Enter') run(filtered[sel])
          }}
          placeholder={tr('Tìm trang, demo, lệnh — hoặc gõ câu hỏi về dữ liệu…', 'Search pages, demos, commands — or type a data question…')}
          className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-subtle"
          aria-label={tr('Tìm kiếm', 'Search')}
        />
        <Kbd>Esc</Kbd>
      </div>
      <ul className="max-h-[360px] overflow-y-auto p-2" role="listbox">
        {filtered.map((c, i) => (
          <li key={c.id} role="option" aria-selected={i === sel}>
            <button onMouseEnter={() => setSel(i)} onClick={() => run(c)} className={cx('flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px]', i === sel ? 'bg-surface-3 text-fg' : 'text-muted')}>
              <c.icon size={17} className={i === sel ? 'text-accent' : ''} aria-hidden />
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && <span className="text-[12px] text-subtle">{c.hint}</span>}
              {i === sel && <CornerDownLeft size={14} className="text-subtle" aria-hidden />}
            </button>
          </li>
        ))}
        {!filtered.length && <li className="px-3 py-6 text-center text-[13px] text-subtle">{tr('Không có kết quả', 'No results')}</li>}
      </ul>
    </Modal>
  )
}

export function AboutDialog() {
  const open = useStore((s) => s.aboutOpen)
  const { tr } = useT()
  return (
    <Modal open={open} onClose={() => setState({ aboutOpen: false })} label="About">
      <div className="relative overflow-hidden px-7 pb-7 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="relative">
          <BrandMark size={52} />
          <div className="mt-5 text-[22px] font-bold tracking-[0.06em] text-fg">ANH TÂN AI</div>
          <div className="text-[15px] font-medium text-muted">Business Intelligence Lab</div>
          <div className="mt-1 text-[13px] text-subtle">Enterprise Data Intelligence · v{APP_VERSION}</div>
          <div className="mt-5 space-y-2 text-[14px] text-muted">
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-positive" /> 100% Local Processing — {tr('không máy chủ, không API, không AI bên thứ ba', 'no server, no API, no third-party AI')}</div>
            <div className="flex items-center gap-2"><Cpu size={16} className="text-accent" /> {tr('Phân tích thống kê & quy tắc nghiệp vụ chạy ngay trong trình duyệt', 'Statistics & business rules run inside your browser')}</div>
          </div>
          <p className="mt-5 text-[14px] leading-relaxed text-fg">{tr('Thiết kế & phát triển cho phân tích doanh nghiệp thực tiễn.', 'Designed & developed for practical enterprise analytics.')}</p>
          <p className="mt-1 text-[13px] text-subtle">{tr('Phát triển bởi Anh Tân AI', 'Developed by Anh Tân AI')}</p>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => setState({ aboutOpen: false })}>{tr('Đóng', 'Close')}</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function Onboarding() {
  const open = useStore((s) => s.onboardingOpen)
  const { tr } = useT()
  const close = () => {
    setState({ onboardingOpen: false })
    persistPrefs({ onboardingSeen: true })
  }
  const steps = [
    { icon: Upload, t: tr('Tải dữ liệu kinh doanh', 'Upload business data'), d: tr('Excel hoặc CSV — tiêu đề tiếng Việt hay tiếng Anh đều được.', 'Excel or CSV — Vietnamese or English headers.') },
    { icon: Lock, t: tr('Phân tích cục bộ', 'We analyze locally'), d: tr('Mọi tính toán chạy trên thiết bị của bạn. Không gửi đi đâu.', 'Every calculation runs on your device. Nothing is sent anywhere.') },
    { icon: BarChart3, t: tr('Khám phá dashboard & insight', 'Explore dashboard & insights'), d: tr('KPI, xu hướng, bất thường, rủi ro — kèm bằng chứng số liệu.', 'KPIs, trends, anomalies, risks — with numeric evidence.') },
  ]
  return (
    <Modal open={open} onClose={close} label="Onboarding" className="max-w-md">
      <div className="px-7 pb-6 pt-7">
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{tr('Bắt đầu trong 3 bước', 'Get started in 3 steps')}</div>
        <ol className="mt-5 space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-accent">
                <s.icon size={18} aria-hidden />
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">{i + 1}</span>
              </span>
              <div>
                <div className="text-[15px] font-semibold text-fg">{s.t}</div>
                <div className="text-[13.5px] leading-relaxed text-muted">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex items-center justify-between">
          <button onClick={close} className="text-[13px] font-medium text-subtle hover:text-fg">{tr('Bỏ qua', 'Skip')}</button>
          <Button variant="primary" icon={ArrowRight} onClick={close}>{tr('Bắt đầu', 'Get started')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const icon = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: XCircle }
  const color = { success: 'text-positive', info: 'text-accent', warning: 'text-warning', error: 'text-negative' }
  return (
    <div className="no-print pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(380px,calc(100vw-40px))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const I = icon[t.tone]
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px] text-fg shadow-[var(--shadow-pop)]" style={{ animation: 'toast-in .2s ease-out' }}>
            <I size={18} className={cx('mt-0.5 shrink-0', color[t.tone])} aria-hidden />
            <span className="leading-snug">{t.text}</span>
          </div>
        )
      })}
      <style>{'@keyframes toast-in{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}'}</style>
    </div>
  )
}
