/**
 * Central app store (tiny, dependency-free). Holds ONE copy of the dataset and analysis;
 * components subscribe to slices via useStore(selector).
 */
import { useSyncExternalStore } from 'react'
import type { AnalysisSettings, Dataset, FieldMatch, Lang, Mapping } from '@/types/core'
import type { Analysis } from '@/types/analysis'
import type { SheetInfo, StageId, ErrorCode } from '@/workers/protocol'
import { DEFAULT_SETTINGS } from '@/intelligence/analysis/analyze'

export type Route =
  | 'overview' | 'import' | 'dashboard' | 'explorer' | 'health' | 'anomalies' | 'ask' | 'scenario' | 'roi' | 'report' | 'demo' | 'privacy' | 'settings'

export const ROUTES: Route[] = ['overview', 'import', 'dashboard', 'explorer', 'health', 'anomalies', 'ask', 'scenario', 'roi', 'report', 'demo', 'privacy', 'settings']

export interface ImportDraft {
  fileName: string
  size: number
  kind: 'xlsx' | 'csv'
  sheets: SheetInfo[]
  sheet: string
  headerRow: number
}

export interface Processing {
  active: boolean
  title: string
  stage: StageId
  stagePct: number
  done: StageId[]
  detail?: string
  startedAt: number
  error?: { code: ErrorCode; detail?: string } | null
}

export interface DrawerState {
  kind: 'kpi' | 'insight' | 'anomaly' | 'health' | 'quality' | 'column'
  id: string
}

export interface Toast {
  id: number
  tone: 'success' | 'info' | 'warning' | 'error'
  text: string
}

export interface AppState {
  route: Route
  lang: Lang
  theme: 'dark' | 'light'
  sidebarCollapsed: boolean
  dataset: Dataset | null
  fields: FieldMatch[]
  mapping: Mapping
  analysis: Analysis | null
  settings: AnalysisSettings
  processing: Processing | null
  draft: ImportDraft | null
  showMapping: boolean
  drawer: DrawerState | null
  toasts: Toast[]
  paletteOpen: boolean
  aboutOpen: boolean
  onboardingOpen: boolean
  rememberSettings: boolean
  pendingQuery: string | null
  explorerColumn: string | null
}

const PREFS_KEY = 'bilab.prefs.v1'

function loadPrefs(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw)
    if (!p || p.rememberSettings !== true) return { rememberSettings: false, onboardingOpen: !p?.onboardingSeen }
    return {
      lang: p.lang === 'en' ? 'en' : 'vi',
      theme: p.theme === 'light' ? 'light' : 'dark',
      sidebarCollapsed: !!p.sidebarCollapsed,
      rememberSettings: true,
      onboardingOpen: !p.onboardingSeen,
      settings: { ...DEFAULT_SETTINGS, sensitivity: ['sensitive', 'balanced', 'conservative'].includes(p.sensitivity) ? p.sensitivity : 'balanced', currencyOverride: p.currencyOverride ?? null },
    }
  } catch {
    return {}
  }
}

const routeFromHash = (): Route => {
  try {
    const h = location.hash.replace(/^#\/?/, '') as Route
    return ROUTES.includes(h) ? h : 'overview'
  } catch {
    return 'overview'
  }
}

let state: AppState = {
  route: routeFromHash(),
  lang: 'vi',
  theme: 'dark',
  sidebarCollapsed: false,
  dataset: null,
  fields: [],
  mapping: {},
  analysis: null,
  settings: DEFAULT_SETTINGS,
  processing: null,
  draft: null,
  showMapping: false,
  drawer: null,
  toasts: [],
  paletteOpen: false,
  aboutOpen: false,
  onboardingOpen: true,
  rememberSettings: false,
  pendingQuery: null,
  explorerColumn: null,
  ...loadPrefs(),
}

const listeners = new Set<() => void>()

export function getState(): AppState {
  return state
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...p }
  listeners.forEach((l) => l())
  if ('lang' in p || 'theme' in p || 'sidebarCollapsed' in p || 'rememberSettings' in p || 'settings' in p) persistPrefs()
}

export function persistPrefs(extra: Record<string, unknown> = {}) {
  try {
    const prev = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
    const base = { onboardingSeen: prev.onboardingSeen ?? false, rememberSettings: state.rememberSettings, ...extra }
    const data = state.rememberSettings ? { ...base, lang: state.lang, theme: state.theme, sidebarCollapsed: state.sidebarCollapsed, sensitivity: state.settings.sensitivity, currencyOverride: state.settings.currencyOverride } : base
    localStorage.setItem(PREFS_KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable: settings simply aren't remembered */
  }
}

export function clearLocalData() {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('bilab.')) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    sessionStorage.clear()
  } catch {
    /* ignore */
  }
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

export function navigate(route: Route) {
  if (state.route === route) return
  setState({ route, paletteOpen: false })
  try {
    history.replaceState(null, '', `#/${route}`)
  } catch {
    /* ignore */
  }
  window.scrollTo?.({ top: 0 })
}

let toastSeq = 0
export function toast(text: string, tone: Toast['tone'] = 'info') {
  const id = ++toastSeq
  setState((s) => ({ toasts: [...s.toasts.slice(-3), { id, tone, text }] }))
  setTimeout(() => setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200)
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const r = routeFromHash()
    if (r !== state.route) setState({ route: r })
  })
}
