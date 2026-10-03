/** Vietnamese-aware text normalization helpers (pure, no dependencies). */

const ACCENT_RE = /[̀-ͯ]/g

/** Remove Vietnamese diacritics, map đ -> d. */
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(ACCENT_RE, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
}

/** Normalize a header or query: lowercase, no accents, split camelCase, punctuation -> spaces. */
export function normalizeKey(s: string): string {
  return stripAccents(
    String(s)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase(),
  )
    .replace(/[_\-./\\|,;:()[\]{}#*+=!?"'`~<>@&^%$]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalize a category value for consistency checks / matching. */
export function normalizeValue(s: string): string {
  return stripAccents(s.toLowerCase()).replace(/[\s._-]+/g, ' ').trim()
}

export function tokenize(s: string): string[] {
  const n = normalizeKey(s)
  return n ? n.split(' ') : []
}

/** Escape a string to use in a RegExp. */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Whole-phrase containment on normalized text (word boundaries are spaces). */
export function containsPhrase(haystack: string, phrase: string): boolean {
  if (!phrase) return false
  if (haystack === phrase) return true
  return (' ' + haystack + ' ').includes(' ' + phrase + ' ')
}

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Simple Levenshtein distance for fuzzy matching short tokens. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = new Array(b.length + 1)
  let cur = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[b.length]
}
