/**
 * SEMANTIC FIELD DETECTION
 * Combines header-name matching (Vietnamese with/without accents + English) with value-based evidence
 * and type compatibility. Produces a role + confidence + human-readable reason for every column.
 */
import type { ColumnProfile, Dataset, FieldMatch, Mapping, Role } from '@/types/core'
import { ABBREVIATIONS, ACTUAL_MODIFIERS, FIELD_ALIASES, PLAN_MODIFIERS } from '../dictionaries/fieldAliases'
import { ROLE_META } from '../dictionaries/roles'
import { VALUE_HINTS } from '../dictionaries/valueHints'
import { containsPhrase, normalizeKey, normalizeValue } from '@/lib/text'

interface AliasEntry {
  role: Role
  alias: string
  tokens: number
}

/** Aliases that are too generic to be trusted on their own. */
const WEAK_ALIASES = new Set([
  'name', 'ten', 'value', 'amount', 'gia tri', 'type', 'score', 'rate', 'day', 'time', 'chi', 'ban', 'ca', 'may', 'loai', 'ton',
  'so tien', 'owner', 'agent', 'rep', 'title', 'level', 'code', 'gia', 'phong', 'nhom', 'cell', 'tool', 'bin', 'case', 'order',
  'unit', 'class', 'site', 'line', 'state', 'source', 'model', 'sale', 'plan', 'pay', 'cong', 'nghi', 'loi', 'ng', 'ky', 'period', 'role',
  'account', 'company', 'cong ty', 'shop', 'market', 'area', 'office', 'store', 'contacts', 'views', 'reach', 'item',
])

let INDEX: AliasEntry[] | null = null
function aliasIndex(): AliasEntry[] {
  if (INDEX) return INDEX
  const list: AliasEntry[] = []
  const seen = new Set<string>()
  for (const [role, aliases] of Object.entries(FIELD_ALIASES) as [Role, string[]][]) {
    for (const a of aliases) {
      const alias = normalizeKey(a)
      const k = role + '|' + alias
      if (!alias || seen.has(k)) continue
      seen.add(k)
      list.push({ role, alias, tokens: alias.split(' ').length })
    }
  }
  // longest first so specific phrases win
  list.sort((a, b) => b.alias.length - a.alias.length)
  INDEX = list
  return list
}

export function aliasCount(): number {
  return aliasIndex().length + Object.keys(ABBREVIATIONS).length
}

function typeCompatible(role: Role, col: ColumnProfile): boolean {
  const meta = ROLE_META[role]
  if (col.type === 'empty') return role === 'other'
  if (meta.kind === 'measure') return col.storage === 'num' && col.type !== 'date' && col.type !== 'id'
  if (meta.kind === 'date') return col.type === 'date'
  if (meta.kind === 'dimension') return col.storage === 'str' || (col.type === 'id' && col.storage === 'num')
  if (meta.kind === 'id') return col.type === 'id' || col.storage === 'str' || col.type === 'number'
  return true
}

interface Candidate {
  role: Role
  confidence: number
  reason: string
}

/** Score header text against the dictionary. */
export function matchHeader(header: string): Candidate[] {
  const h = normalizeKey(header)
  if (!h) return []
  const out = new Map<Role, Candidate>()
  const put = (c: Candidate) => {
    const prev = out.get(c.role)
    if (!prev || prev.confidence < c.confidence) out.set(c.role, c)
  }
  const hasPlan = PLAN_MODIFIERS.some((m) => containsPhrase(h, m))
  const hasActual = ACTUAL_MODIFIERS.some((m) => containsPhrase(h, m))
  for (const e of aliasIndex()) {
    if (h === e.alias) {
      const weak = WEAK_ALIASES.has(e.alias)
      put({ role: e.role, confidence: weak ? 0.66 : 0.97, reason: `exact:"${e.alias}"` })
    } else if (containsPhrase(h, e.alias)) {
      const coverage = e.alias.length / h.length
      const weak = WEAK_ALIASES.has(e.alias)
      const conf = Math.min(0.93, (weak ? 0.38 : 0.62) + coverage * 0.35 + (e.tokens > 1 ? 0.06 : 0))
      put({ role: e.role, confidence: conf, reason: `contains:"${e.alias}"` })
    }
  }
  // abbreviations ("DT", "SL", "KH")
  for (const tok of h.split(' ')) {
    const r = ABBREVIATIONS[tok]
    if (r) put({ role: r, confidence: h === tok ? 0.72 : 0.55, reason: `abbreviation:"${tok}"` })
  }
  // plan / actual modifiers adjust money measures ("Doanh thu kế hoạch" -> target)
  if (hasPlan) {
    const moneyHit = [...out.values()].some((c) => ['revenue', 'cost', 'profit', 'expense', 'quantity', 'output', 'spend'].includes(c.role))
    if (moneyHit) {
      const isBudget = /ngan sach|budget|du toan/.test(h)
      const isOutput = [...out.values()].some((c) => c.role === 'output' || c.role === 'quantity') && /san luong|output|production|san xuat/.test(h)
      put({ role: isOutput ? 'planned_output' : isBudget ? 'budget' : 'target', confidence: 0.9, reason: 'plan-modifier' })
      for (const c of out.values()) if (['revenue', 'cost', 'expense', 'quantity', 'output'].includes(c.role)) c.confidence -= 0.35
    }
  }
  if (hasActual && out.has('budget') === false && out.has('target') === false) {
    const a = out.get('actual')
    if (a) a.confidence = Math.max(a.confidence, 0.75)
  }
  // code vs name: "Mã KH" is still the customer dimension; "Mã đơn" is order id
  return [...out.values()].sort((a, b) => b.confidence - a.confidence)
}

function valueEvidence(col: ColumnProfile, values: (string | null)[] | undefined): Candidate[] {
  if (!values || col.storage !== 'str') return []
  const top = col.topValues ?? []
  if (!top.length) return []
  const out: Candidate[] = []
  const total = top.reduce((s, t) => s + t.count, 0)
  for (const hint of VALUE_HINTS) {
    const set = new Set(hint.values)
    let hit = 0
    for (const t of top) if (set.has(normalizeValue(t.value)) || set.has(normalizeValue(t.value).replace(/^(tp|chi nhanh|cn|kho|mien)\s+/, ''))) hit += t.count
    const share = total ? hit / total : 0
    if (share >= hint.minShare) out.push({ role: hint.role, confidence: Math.min(0.82, 0.5 + share * 0.3), reason: `values:${Math.round(share * 100)}%` })
  }
  return out
}

/** Detect semantic roles for all columns of a dataset. */
export function detectFields(ds: Dataset): FieldMatch[] {
  const matches: FieldMatch[] = []
  for (const col of ds.columns) {
    let cands = matchHeader(col.name).filter((c) => typeCompatible(c.role, col))
    const ve = valueEvidence(col, ds.str[col.key])
    for (const v of ve) {
      const ex = cands.find((c) => c.role === v.role)
      if (ex) {
        ex.confidence = Math.min(0.99, ex.confidence + 0.1)
        ex.reason += ` + ${v.reason}`
      } else cands.push(v)
    }
    // type-driven fallbacks
    if (!cands.length || cands[0].confidence < 0.5) {
      if (col.type === 'date') cands.push({ role: 'date', confidence: 0.62, reason: 'type:date' })
      else if (col.type === 'percent') cands.push({ role: 'conversion', confidence: 0.3, reason: 'type:percent' })
    }
    cands = cands.sort((a, b) => b.confidence - a.confidence)
    const best = cands[0]
    const role: Role = best && best.confidence >= 0.45 ? best.role : 'other'
    matches.push({
      key: col.key,
      column: col.name,
      role,
      confidence: role === 'other' ? (best ? Math.max(0.2, 1 - best.confidence) : 0.5) : best.confidence,
      reason: role === 'other' ? 'no-confident-match' : best.reason,
      alternatives: cands.slice(role === 'other' ? 0 : 1, 4).map((c) => ({ role: c.role, confidence: c.confidence })),
    })
  }
  resolveConflicts(matches, ds)
  return matches
}

/**
 * When multiple columns claim the same single-valued role (e.g. two "date" columns), keep the most
 * confident one as primary. Others keep the role (they are still usable), except for measures where
 * a duplicate revenue column would double count — those fall back to their next alternative or 'other'.
 */
function resolveConflicts(matches: FieldMatch[], ds: Dataset) {
  const byRole = new Map<Role, FieldMatch[]>()
  for (const m of matches) {
    if (m.role === 'other') continue
    const arr = byRole.get(m.role) ?? []
    arr.push(m)
    byRole.set(m.role, arr)
  }
  for (const [role, list] of byRole) {
    if (list.length < 2) continue
    list.sort((a, b) => b.confidence - a.confidence)
    const kind = ROLE_META[role].kind
    for (const m of list.slice(1)) {
      const col = ds.columns.find((c) => c.key === m.key)!
      const alt = m.alternatives.find((a) => a.confidence >= 0.45 && !byRole.has(a.role) && typeCompatible(a.role, col))
      if (alt) {
        m.alternatives = [{ role: m.role, confidence: m.confidence }, ...m.alternatives.filter((a) => a.role !== alt.role)]
        m.role = alt.role
        m.confidence = alt.confidence
        m.reason = 'resolved-conflict'
        byRole.set(alt.role, [m])
      } else if (kind === 'measure' || kind === 'date') {
        m.alternatives = [{ role: m.role, confidence: m.confidence }, ...m.alternatives]
        m.role = 'other'
        m.confidence = 0.4
        m.reason = `duplicate-role:${role}`
      }
    }
  }
}

export function mappingFromMatches(matches: FieldMatch[]): Mapping {
  const m: Mapping = {}
  for (const f of matches) m[f.key] = f.role
  return m
}
