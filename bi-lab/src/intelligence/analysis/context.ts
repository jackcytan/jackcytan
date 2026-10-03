/**
 * ANALYSIS CONTEXT
 * Uniform, role-based access to the columnar dataset, optionally restricted to a row subset
 * (e.g. one period). KPIs, rules, and the query engine all read data through this layer.
 */
import type { Dataset, Mapping, Role } from '@/types/core'
import { ROLE_META } from '../dictionaries/roles'
import { normalizeValue } from '@/lib/text'

export type RoleMap = Partial<Record<Role, string>>

/** Choose a primary column per role from a mapping (first column with the highest data coverage). */
export function primaryRoles(ds: Dataset, mapping: Mapping): RoleMap {
  const out: RoleMap = {}
  for (const col of ds.columns) {
    const role = mapping[col.key]
    if (!role || role === 'other') continue
    const prev = out[role]
    if (!prev) out[role] = col.key
    else {
      const pc = ds.columns.find((c) => c.key === prev)!
      // prefer names over codes for dimensions, otherwise better coverage
      const isCode = (n: string) => /\b(ma|id|code)\b/.test(normalizeValue(n))
      if (ROLE_META[role].kind === 'dimension' && isCode(pc.name) && !isCode(col.name)) out[role] = col.key
      else if (col.count > pc.count * 1.2) out[role] = col.key
    }
  }
  return out
}

export class Ctx {
  readonly ds: Dataset
  readonly roles: RoleMap
  readonly idx: Int32Array | null
  private cache: Map<string, unknown>
  private shared: Map<string, Float64Array>

  constructor(ds: Dataset, roles: RoleMap, idx: Int32Array | null = null, shared?: Map<string, Float64Array>) {
    this.ds = ds
    this.roles = roles
    this.idx = idx
    this.cache = new Map()
    this.shared = shared ?? new Map()
  }

  /** Same dataset/roles restricted to a subset of row indices. */
  subset(idx: Int32Array): Ctx {
    return new Ctx(this.ds, this.roles, idx, this.shared)
  }

  get size(): number {
    return this.idx ? this.idx.length : this.ds.rowCount
  }

  key(role: Role): string | undefined {
    return this.roles[role]
  }

  has(role: Role): boolean {
    if (role === 'profit') return !!this.roles.profit || (!!this.roles.revenue && !!this.roles.cost)
    if (role === 'orders') return !!this.roles.orders
    return !!this.roles[role]
  }

  hasAll(roles: Role[]): boolean {
    return roles.every((r) => this.has(r))
  }

  /** Full-length numeric array for a measure role (derived profit; rate normalization). */
  measure(role: Role): Float64Array | null {
    const ck = 'm:' + role
    const hit = this.shared.get(ck)
    if (hit) return hit
    let arr: Float64Array | null = null
    const key = this.roles[role]
    if (key && this.ds.num[key]) {
      arr = this.ds.num[key]
      if (role === 'conversion' || role === 'attendance' || role === 'margin') arr = normalizeRate(arr)
    } else if (role === 'profit' && this.roles.revenue && this.roles.cost) {
      const r = this.ds.num[this.roles.revenue]
      const c = this.ds.num[this.roles.cost]
      arr = new Float64Array(r.length)
      for (let i = 0; i < r.length; i++) arr[i] = r[i] - (c[i] === c[i] ? c[i] : 0)
    }
    if (arr) this.shared.set(ck, arr)
    return arr
  }

  dim(role: Role): (string | null)[] | null {
    const key = this.roles[role]
    if (!key) return null
    if (this.ds.str[key]) return this.ds.str[key]
    const n = this.ds.num[key]
    if (!n) return null
    const ck = 'd:' + key
    const c = this.cache.get(ck) as (string | null)[] | undefined
    if (c) return c
    const out = Array.from(n, (v) => (v === v ? String(v) : null))
    this.cache.set(ck, out)
    return out
  }

  forEach(fn: (row: number) => void) {
    if (this.idx) for (let i = 0; i < this.idx.length; i++) fn(this.idx[i])
    else for (let i = 0; i < this.ds.rowCount; i++) fn(i)
  }

  private memo<T>(k: string, f: () => T): T {
    if (this.cache.has(k)) return this.cache.get(k) as T
    const v = f()
    this.cache.set(k, v)
    return v
  }

  sum(role: Role): number {
    return this.memo('sum:' + role, () => {
      const a = this.measure(role)
      if (!a) return NaN
      let s = 0
      let n = 0
      this.forEach((i) => {
        const v = a[i]
        if (v === v) {
          s += v
          n++
        }
      })
      return n ? s : NaN
    })
  }

  count(role: Role): number {
    return this.memo('cnt:' + role, () => {
      const a = this.measure(role)
      if (!a) return 0
      let n = 0
      this.forEach((i) => {
        if (a[i] === a[i]) n++
      })
      return n
    })
  }

  avg(role: Role): number {
    const n = this.count(role)
    return n ? this.sum(role) / n : NaN
  }

  minMax(role: Role): [number, number] {
    return this.memo('mm:' + role, () => {
      const a = this.measure(role)
      let mn = Infinity
      let mx = -Infinity
      if (a)
        this.forEach((i) => {
          const v = a[i]
          if (v === v) {
            if (v < mn) mn = v
            if (v > mx) mx = v
          }
        })
      return [mn, mx] as [number, number]
    })
  }

  /** Count of rows where the measure equals zero (e.g. stock-outs). */
  countWhere(role: Role, pred: (v: number) => boolean): number {
    const a = this.measure(role)
    if (!a) return 0
    let n = 0
    this.forEach((i) => {
      const v = a[i]
      if (v === v && pred(v)) n++
    })
    return n
  }

  distinct(role: Role): number {
    return this.memo('dc:' + role, () => {
      const d = this.dim(role)
      if (!d) return 0
      const s = new Set<string>()
      this.forEach((i) => {
        const v = d[i]
        if (v !== null) s.add(v)
      })
      return s.size
    })
  }

  /** Number of transactions: distinct order ids when available, else rows. */
  transactions(): number {
    return this.memo('tx', () => {
      if (this.roles.order_id) return this.distinct('order_id')
      return this.size
    })
  }

  groupSum(dimRole: Role, measureRole: Role | 'count'): Map<string, number> {
    return this.memo(`gs:${dimRole}:${measureRole}`, () => {
      const d = this.dim(dimRole)
      const out = new Map<string, number>()
      if (!d) return out
      const a = measureRole === 'count' ? null : this.measure(measureRole)
      if (measureRole !== 'count' && !a) return out
      this.forEach((i) => {
        const k = d[i]
        if (k === null) return
        const v = a ? a[i] : 1
        if (v !== v) return
        out.set(k, (out.get(k) ?? 0) + v)
      })
      return out
    })
  }

  /** Sorted desc [label, value] for a group-by. */
  ranked(dimRole: Role, measureRole: Role | 'count'): [string, number][] {
    return this.memo(`rk:${dimRole}:${measureRole}`, () => [...this.groupSum(dimRole, measureRole).entries()].sort((a, b) => b[1] - a[1]))
  }

  topShare(dimRole: Role, measureRole: Role, n: number): number {
    const r = this.ranked(dimRole, measureRole)
    if (r.length < 2) return NaN
    let total = 0
    for (const [, v] of r) total += Math.max(0, v)
    if (total <= 0) return NaN
    let top = 0
    for (let i = 0; i < Math.min(n, r.length); i++) top += Math.max(0, r[i][1])
    return top / total
  }

  /** Share of entities needed to reach `threshold` of the measure (Pareto). */
  paretoShare(dimRole: Role, measureRole: Role, threshold = 0.8): number {
    const r = this.ranked(dimRole, measureRole)
    if (r.length < 5) return NaN
    let total = 0
    for (const [, v] of r) total += Math.max(0, v)
    if (total <= 0) return NaN
    let cum = 0
    for (let i = 0; i < r.length; i++) {
      cum += Math.max(0, r[i][1])
      if (cum / total >= threshold) return (i + 1) / r.length
    }
    return 1
  }

  /** Share of rows whose status matches any of the given normalized fragments. */
  statusShare(patterns: string[]): number {
    const d = this.dim('status')
    if (!d) return NaN
    return this.memo('ss:' + patterns.join('|'), () => {
      let hit = 0
      let n = 0
      const cache = new Map<string, boolean>()
      this.forEach((i) => {
        const v = d[i]
        if (v === null) return
        n++
        let m = cache.get(v)
        if (m === undefined) {
          const nv = normalizeValue(v)
          m = patterns.some((p) => nv.includes(p))
          cache.set(v, m)
        }
        if (m) hit++
      })
      return n ? hit / n : NaN
    })
  }

  /** Average of a measure for rows after/before a time (used for tenure). */
  dateArray(role: Role): Float64Array | null {
    const k = this.roles[role]
    return k ? this.ds.num[k] ?? null : null
  }
}

/** Rates may be stored as 0..1, 0..100 or "12%" (already fraction). Normalize to 0..1. */
export function normalizeRate(arr: Float64Array): Float64Array {
  let mx = -Infinity
  for (let i = 0; i < arr.length; i++) if (arr[i] === arr[i] && arr[i] > mx) mx = arr[i]
  if (mx <= 1.5) return arr
  if (mx <= 100) {
    const out = new Float64Array(arr.length)
    for (let i = 0; i < arr.length; i++) out[i] = arr[i] / 100
    return out
  }
  return arr
}

/** Build row-index arrays per period from the time index. */
export function periodSubsets(rowPeriod: Int32Array, periods: number): Int32Array[] {
  const counts = new Int32Array(periods)
  for (let i = 0; i < rowPeriod.length; i++) if (rowPeriod[i] >= 0) counts[rowPeriod[i]]++
  const out = Array.from({ length: periods }, (_, p) => new Int32Array(counts[p]))
  const fill = new Int32Array(periods)
  for (let i = 0; i < rowPeriod.length; i++) {
    const p = rowPeriod[i]
    if (p >= 0) out[p][fill[p]++] = i
  }
  return out
}
