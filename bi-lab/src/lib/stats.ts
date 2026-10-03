/**
 * Small, allocation-conscious statistics helpers.
 * simple-statistics is used for well-known estimators (imported per function for tree shaking).
 */
import { linearRegression, linearRegressionLine, rSquared } from 'simple-statistics'

export { linearRegression, linearRegressionLine, rSquared }

export function finiteValues(arr: ArrayLike<number>, idx?: ArrayLike<number> | null): Float64Array {
  const n = idx ? idx.length : arr.length
  const out = new Float64Array(n)
  let k = 0
  for (let i = 0; i < n; i++) {
    const v = arr[idx ? idx[i] : i]
    if (v === v) out[k++] = v
  }
  return out.subarray(0, k)
}

export function sum(a: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i]
  return s
}
export function mean(a: ArrayLike<number>): number {
  return a.length ? sum(a) / a.length : NaN
}
export function variance(a: ArrayLike<number>): number {
  const n = a.length
  if (n < 2) return 0
  const m = mean(a)
  let s = 0
  for (let i = 0; i < n; i++) s += (a[i] - m) * (a[i] - m)
  return s / (n - 1)
}
export function std(a: ArrayLike<number>): number {
  return Math.sqrt(variance(a))
}

/** Quantile on a sorted array (linear interpolation, type 7). */
export function quantileSorted(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length
  if (!n) return NaN
  if (n === 1) return sorted[0]
  const h = (n - 1) * p
  const lo = Math.floor(h)
  const hi = Math.min(n - 1, lo + 1)
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo])
}

export function sortedCopy(a: ArrayLike<number>): Float64Array {
  const s = Float64Array.from(a as ArrayLike<number>)
  s.sort()
  return s
}

export function median(a: ArrayLike<number>): number {
  return quantileSorted(sortedCopy(a), 0.5)
}

/** Median absolute deviation (scaled to be consistent with sigma). */
export function mad(a: ArrayLike<number>): number {
  const m = median(a)
  const dev = new Float64Array(a.length)
  for (let i = 0; i < a.length; i++) dev[i] = Math.abs(a[i] - m)
  return median(dev) * 1.4826
}

export function coefficientOfVariation(a: ArrayLike<number>): number {
  const m = mean(a)
  if (!m) return NaN
  return std(a) / Math.abs(m)
}

export function pearson(x: ArrayLike<number>, y: ArrayLike<number>): { r: number; n: number } {
  let n = 0
  let sx = 0
  let sy = 0
  for (let i = 0; i < x.length; i++) {
    const a = x[i]
    const b = y[i]
    if (a === a && b === b) {
      n++
      sx += a
      sy += b
    }
  }
  if (n < 3) return { r: NaN, n }
  const mx = sx / n
  const my = sy / n
  let cov = 0
  let vx = 0
  let vy = 0
  for (let i = 0; i < x.length; i++) {
    const a = x[i]
    const b = y[i]
    if (a === a && b === b) {
      cov += (a - mx) * (b - my)
      vx += (a - mx) * (a - mx)
      vy += (b - my) * (b - my)
    }
  }
  if (vx === 0 || vy === 0) return { r: NaN, n }
  return { r: cov / Math.sqrt(vx * vy), n }
}

/** Simple least squares on (0..n-1, y). Returns slope, intercept, r2. */
export function trendLine(y: number[]): { slope: number; intercept: number; r2: number } {
  if (y.length < 2) return { slope: 0, intercept: y[0] ?? 0, r2: 0 }
  const pts = y.map((v, i) => [i, v] as [number, number])
  const lr = linearRegression(pts)
  const line = linearRegressionLine(lr)
  const r2 = y.length > 2 ? rSquared(pts, line) : 1
  return { slope: lr.m, intercept: lr.b, r2: Number.isFinite(r2) ? r2 : 0 }
}

export function movingAverage(y: number[], window: number): number[] {
  const out: number[] = []
  for (let i = 0; i < y.length; i++) {
    const from = Math.max(0, i - window + 1)
    let s = 0
    for (let j = from; j <= i; j++) s += y[j]
    out.push(s / (i - from + 1))
  }
  return out
}

/** Centered moving average excluding the point itself (leave-one-out) for anomaly baselines. */
export function looMovingAverage(y: number[], half: number): number[] {
  const out: number[] = []
  for (let i = 0; i < y.length; i++) {
    let s = 0
    let c = 0
    for (let j = Math.max(0, i - half); j <= Math.min(y.length - 1, i + half); j++) {
      if (j === i) continue
      s += y[j]
      c++
    }
    out.push(c ? s / c : y[i])
  }
  return out
}

export function weightedMovingAverage(y: number[], window: number): number {
  const n = Math.min(window, y.length)
  let s = 0
  let w = 0
  for (let i = 0; i < n; i++) {
    const weight = n - i
    s += y[y.length - 1 - i] * weight
    w += weight
  }
  return w ? s / w : NaN
}

export function pctChange(cur: number, prev: number): number | null {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) return null
  return (cur - prev) / Math.abs(prev)
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
