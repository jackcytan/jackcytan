/**
 * Chart palette — validated categorical order (blue, orange, aqua, yellow, magenta, green, violet, red),
 * stepped separately for light and dark surfaces. Status colors are reserved for good/warning/critical.
 */
export const CATEGORICAL = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
}

export interface ChartTheme {
  mode: 'light' | 'dark'
  text: string
  muted: string
  subtle: string
  line: string
  surface: string
  categorical: string[]
  positive: string
  negative: string
  warning: string
  heat: [string, string]
}

const LIGHT_VARS: Record<string, string> = { '--fg': '#0d1526', '--muted': '#4b5a72', '--subtle': '#8391a7', '--surface': '#ffffff', '--positive': '#059669', '--negative': '#dc2645', '--warning': '#c27a06' }

export function readTheme(force?: 'light'): ChartTheme {
  const cs = getComputedStyle(document.documentElement)
  const v = (n: string) => (force === 'light' ? LIGHT_VARS[n] : cs.getPropertyValue(n).trim())
  const mode = force ?? (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  return {
    mode,
    text: v('--fg'),
    muted: v('--muted'),
    subtle: v('--subtle'),
    line: mode === 'dark' ? 'rgba(148,163,184,0.12)' : '#e6ebf2',
    surface: v('--surface'),
    categorical: CATEGORICAL[mode],
    positive: v('--positive'),
    negative: v('--negative'),
    warning: v('--warning'),
    heat: mode === 'dark' ? ['#15213a', '#5b9cf0'] : ['#eaf1fc', '#1d5fb8'],
  }
}
