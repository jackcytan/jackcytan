import type { ReactNode } from 'react'
import { Info, Settings as SettingsIcon } from 'lucide-react'
import { setState, useStore, persistPrefs } from '@/app/store'
import { useT } from '@/i18n/useT'
import { applyFormatContext, reanalyze, closeDataset } from '@/app/actions'
import { Button, Card, PageHeader, Segmented, Toggle } from '@/components/ui/primitives'
import type { Sensitivity } from '@/types/core'
import { APP_VERSION } from '@/app/nav'
import { aliasCount } from '@/intelligence/semantic/detect'
import { KPI_LIBRARY } from '@/intelligence/metrics/kpiLibrary'
import { RULE_LIBRARY } from '@/intelligence/rules/ruleLibrary'
import { INSIGHT_TEMPLATES } from '@/intelligence/insights/templates'
import { recommendationCount } from '@/intelligence/insights/recommendations'
import { QUALITY_CHECKS } from '@/intelligence/quality/qualityEngine'
import { ALL_OPS, queryVocabularySize } from '@/intelligence/query/lexicon'

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-6 py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[14.5px] font-semibold">{title}</div>
        {desc && <p className="mt-0.5 max-w-xl text-[13px] text-muted">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { tr, lang } = useT()
  const theme = useStore((s) => s.theme)
  const remember = useStore((s) => s.rememberSettings)
  const settings = useStore((s) => s.settings)
  const hasData = useStore((s) => !!s.analysis)
  const lib = [
    [tr('Bí danh trường (semantic aliases)', 'Field aliases'), aliasCount()],
    [tr('Định nghĩa KPI', 'KPI definitions'), KPI_LIBRARY.length],
    [tr('Quy tắc nghiệp vụ', 'Business rules'), RULE_LIBRARY.length],
    [tr('Mẫu insight', 'Insight templates'), INSIGHT_TEMPLATES.length],
    [tr('Mẫu hành động đề xuất', 'Recommendation templates'), recommendationCount()],
    [tr('Kiểm tra chất lượng dữ liệu', 'Data-quality checks'), QUALITY_CHECKS.length],
    [tr('Phép phân tích truy vấn', 'Query operations'), ALL_OPS.length],
    [tr('Từ vựng truy vấn', 'Query vocabulary'), queryVocabularySize()],
  ]
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" icon={SettingsIcon} title={tr('Cài đặt', 'Settings')} />
      <Card>
        <Row title={tr('Ngôn ngữ', 'Language')}>
          <Segmented value={lang} onChange={(v) => { setState({ lang: v }); document.documentElement.setAttribute('lang', v); applyFormatContext() }} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
        </Row>
        <Row title={tr('Giao diện', 'Theme')}>
          <Segmented value={theme} onChange={(v) => { document.documentElement.setAttribute('data-theme', v); setState({ theme: v }) }} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
        </Row>
        <Row title={tr('Đơn vị tiền tệ', 'Currency')} desc={tr('Tự nhận diện từ dữ liệu (₫/VND/USD). Có thể ghi đè.', 'Detected from the data (₫/VND/USD). You can override it.')}>
          <Segmented value={settings.currencyOverride ?? 'auto'} onChange={(v) => { const cur = v === 'auto' ? null : (v as 'VND' | 'USD' | 'none'); setState({ settings: { ...settings, currencyOverride: cur } }); applyFormatContext() }} options={[{ value: 'auto', label: 'Auto' }, { value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }, { value: 'none', label: tr('Số', 'Number') }]} />
        </Row>
        <Row title={tr('Độ nhạy phát hiện bất thường', 'Anomaly sensitivity')}>
          <Segmented<Sensitivity> value={settings.sensitivity} onChange={(v) => (hasData ? reanalyze({ settings: { sensitivity: v } }) : setState({ settings: { ...settings, sensitivity: v } }))} options={[{ value: 'sensitive', label: 'Sensitive' }, { value: 'balanced', label: 'Balanced' }, { value: 'conservative', label: 'Conservative' }]} />
        </Row>
        <Row title={tr('Ghi nhớ cài đặt trên thiết bị này', 'Remember settings locally')} desc={tr('Chỉ lưu ngôn ngữ, giao diện, độ nhạy và tiền tệ — không bao giờ lưu dữ liệu tải lên.', 'Stores language, theme, sensitivity and currency only — never uploaded data.')}>
          <Toggle checked={remember} onChange={(v) => { setState({ rememberSettings: v }); persistPrefs() }} label={tr('Ghi nhớ cài đặt', 'Remember settings')} />
        </Row>
        <Row title={tr('Hướng dẫn nhanh', 'Quick tour')}>
          <Button size="sm" onClick={() => setState({ onboardingOpen: true })}>{tr('Mở lại', 'Show again')}</Button>
        </Row>
        {hasData && (
          <Row title={tr('Đóng bộ dữ liệu hiện tại', 'Close current dataset')} desc={tr('Giải phóng bộ nhớ. Dữ liệu chưa từng rời khỏi thiết bị.', 'Frees memory. The data never left this device.')}>
            <Button size="sm" variant="danger" onClick={closeDataset}>{tr('Đóng dữ liệu', 'Close dataset')}</Button>
          </Row>
        )}
      </Card>
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-[14px] font-semibold"><Info size={16} className="text-accent" /> {tr('Thư viện tri thức nội bộ', 'Built-in intelligence library')}</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {lib.map(([k, v]) => (
            <div key={k as string} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
              <div className="tabular text-[22px] font-semibold">{v as number}</div>
              <div className="text-[12px] text-muted">{k as string}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12.5px] text-subtle">Anh Tân AI · Business Intelligence Lab v{APP_VERSION} · {tr('Phát triển bởi Anh Tân AI', 'Developed by Anh Tân AI')}</p>
      </Card>
    </div>
  )
}
