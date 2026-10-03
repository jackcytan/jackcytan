import { BarChart3, Calculator, FileText, Gauge, HeartPulse, PlayCircle, Radar, ScanSearch, Settings, ShieldCheck, SlidersHorizontal, Table2, Upload, type LucideIcon } from 'lucide-react'
import type { Route } from './store'

export interface NavItem {
  route: Route
  icon: LucideIcon
  vi: string
  en: string
  group: 'analyze' | 'decide' | 'workspace'
  needsData?: boolean
  shortcut?: string
}

export const NAV: NavItem[] = [
  { route: 'overview', icon: Gauge, vi: 'Tổng quan', en: 'Overview', group: 'analyze' },
  { route: 'import', icon: Upload, vi: 'Nhập dữ liệu', en: 'Import Data', group: 'analyze', shortcut: 'I' },
  { route: 'dashboard', icon: BarChart3, vi: 'Smart Dashboard', en: 'Smart Dashboard', group: 'analyze', needsData: true, shortcut: 'D' },
  { route: 'explorer', icon: Table2, vi: 'Khám phá dữ liệu', en: 'Data Explorer', group: 'analyze', needsData: true },
  { route: 'health', icon: HeartPulse, vi: 'Sức khỏe kinh doanh', en: 'Business Health', group: 'analyze', needsData: true },
  { route: 'anomalies', icon: Radar, vi: 'Bất thường', en: 'Anomalies', group: 'analyze', needsData: true },
  { route: 'ask', icon: ScanSearch, vi: 'Hỏi dữ liệu', en: 'Ask Your Data', group: 'analyze', needsData: true, shortcut: 'A' },
  { route: 'scenario', icon: SlidersHorizontal, vi: 'Scenario Lab', en: 'Scenario Lab', group: 'decide', needsData: true, shortcut: 'S' },
  { route: 'roi', icon: Calculator, vi: 'ROI Tự động hóa', en: 'Automation ROI', group: 'decide', shortcut: 'R' },
  { route: 'report', icon: FileText, vi: 'Báo cáo điều hành', en: 'Executive Report', group: 'decide', needsData: true },
  { route: 'demo', icon: PlayCircle, vi: 'Demo Center', en: 'Demo Center', group: 'workspace' },
  { route: 'privacy', icon: ShieldCheck, vi: 'Quyền riêng tư', en: 'Privacy', group: 'workspace' },
  { route: 'settings', icon: Settings, vi: 'Cài đặt', en: 'Settings', group: 'workspace' },
]

export const APP_VERSION = '1.0.0'
