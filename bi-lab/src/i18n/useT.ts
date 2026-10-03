import { useStore, getState } from '@/app/store'
import type { L10n } from '@/types/core'

/** tr('Tiếng Việt', 'English') — both languages live next to each other in the component. */
export function useT() {
  const lang = useStore((s) => s.lang)
  const tr = (vi: string, en: string) => (lang === 'vi' ? vi : en)
  const l = (x: L10n | undefined | null) => (x ? x[lang] : '')
  return { lang, tr, l }
}

export function trNow(vi: string, en: string) {
  return getState().lang === 'vi' ? vi : en
}
