/** Promise-based client for the engine worker with progress callbacks. */
import type { WorkerRequest, WorkerResponse, StageId, ErrorCode } from './protocol'

type Pending = { resolve: (v: WorkerResponse) => void; reject: (e: EngineError) => void; onProgress?: (stage: StageId, pct: number, detail?: string) => void }

export class EngineError extends Error {
  code: ErrorCode
  detail?: string
  constructor(code: ErrorCode, detail?: string) {
    super(code)
    this.code = code
    this.detail = detail
  }
}

let worker: Worker | null = null
let seq = 0
const pending = new Map<number, Pending>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module', name: 'bi-engine' })
  worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
    const m = ev.data
    const p = pending.get(m.id)
    if (!p) return
    if (m.type === 'progress') {
      p.onProgress?.(m.stage, m.pct, m.detail)
      return
    }
    pending.delete(m.id)
    if (m.type === 'error') p.reject(new EngineError(m.code, m.detail))
    else p.resolve(m)
  }
  worker.onerror = (e) => {
    for (const [, p] of pending) p.reject(new EngineError('internal', e.message))
    pending.clear()
    worker?.terminate()
    worker = null
  }
  return worker
}

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never

export function callEngine<T extends WorkerResponse['type']>(req: DistributiveOmit<WorkerRequest, 'id'>, onProgress?: Pending['onProgress'], transfer?: Transferable[]): Promise<Extract<WorkerResponse, { type: T }>> {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: WorkerResponse) => void, reject, onProgress })
    getWorker().postMessage({ ...req, id }, transfer ?? [])
  })
}

export function resetEngine() {
  worker?.terminate()
  worker = null
  for (const [, p] of pending) p.reject(new EngineError('internal', 'reset'))
  pending.clear()
}
