/**
 * BUSINESS CONTEXT DETECTION
 * Each domain has a weighted signature of semantic roles. The dataset is scored against every
 * signature; low or ambiguous scores fall back to "Generic Business".
 */
import type { Domain, DomainDetection, L10n, Role } from '@/types/core'

export const DOMAIN_LABELS: Record<Domain, L10n> = {
  sales: { vi: 'Phân tích Bán hàng', en: 'Sales Analytics' },
  retail: { vi: 'Phân tích Bán lẻ', en: 'Retail Analytics' },
  finance: { vi: 'Phân tích Tài chính', en: 'Finance Analytics' },
  marketing: { vi: 'Phân tích Marketing', en: 'Marketing Analytics' },
  hr: { vi: 'Phân tích Nhân sự', en: 'HR Analytics' },
  manufacturing: { vi: 'Phân tích Sản xuất', en: 'Manufacturing Analytics' },
  operations: { vi: 'Phân tích Vận hành', en: 'Operations Analytics' },
  inventory: { vi: 'Phân tích Tồn kho', en: 'Inventory Analytics' },
  customer_service: { vi: 'Phân tích Chăm sóc khách hàng', en: 'Customer Service Analytics' },
  generic: { vi: 'Phân tích Kinh doanh tổng quát', en: 'Generic Business Analytics' },
}

export const DOMAIN_SIGNATURES: Record<Exclude<Domain, 'generic'>, Partial<Record<Role, number>>> = {
  sales: { revenue: 3, customer: 2.5, product: 2, salesperson: 3, quantity: 1, order_id: 1, region: 1, status: 1, target: 1.5, date: 0.5, cost: 0.5, profit: 0.5 },
  retail: { product: 2, category: 2, branch: 3, quantity: 2, price: 2, discount: 2, inventory: 1, returns: 2, revenue: 1.5, date: 0.5, order_id: 1 },
  finance: { budget: 3, expense: 3, actual: 2.5, category: 1, department: 1.5, revenue: 1, cost: 1, profit: 1, date: 0.5 },
  marketing: { spend: 3, impressions: 3, clicks: 3, campaign: 3, channel: 2, lead: 2.5, conversion: 2, orders: 1, revenue: 0.5, date: 0.5 },
  hr: { employee: 3, salary: 3, department: 2, position: 2, hire_date: 3, attendance: 2, absence: 2, performance: 2 },
  manufacturing: { machine: 3, line: 3, output: 3, planned_output: 2.5, defect: 3, downtime: 3, shift: 2, product: 0.5, date: 0.5 },
  operations: { duration: 3, status: 2, branch: 1, department: 1, hours: 2, shift: 1, downtime: 1, order_id: 1, date: 0.5, employee: 1 },
  inventory: { inventory: 3, warehouse: 3, product: 2, supplier: 2.5, quantity: 1, price: 1, cost: 1 },
  customer_service: { ticket: 3, satisfaction: 3, response_time: 3, channel: 1, status: 1.5, employee: 1, customer: 1, duration: 1 },
}

/** Roles that strongly imply a domain on their own (needed to claim that domain confidently). */
const ANCHORS: Record<Exclude<Domain, 'generic'>, Role[]> = {
  sales: ['revenue'],
  retail: ['branch', 'product'],
  finance: ['budget', 'expense', 'actual'],
  marketing: ['spend', 'impressions', 'clicks', 'campaign', 'lead'],
  hr: ['employee', 'salary', 'hire_date'],
  manufacturing: ['output', 'defect', 'downtime', 'machine', 'line'],
  operations: ['duration', 'hours'],
  inventory: ['inventory', 'warehouse'],
  customer_service: ['ticket', 'satisfaction', 'response_time'],
}

export function detectDomain(roles: Role[]): DomainDetection {
  const present = new Set<Role>(roles.filter((r) => r !== 'other'))
  const scores = {} as Record<Domain, number>
  let best: Domain = 'generic'
  let bestScore = 0
  let second = 0
  for (const [domain, sig] of Object.entries(DOMAIN_SIGNATURES) as [Exclude<Domain, 'generic'>, Partial<Record<Role, number>>][]) {
    let total = 0
    let got = 0
    for (const [role, w] of Object.entries(sig) as [Role, number][]) {
      total += w
      if (present.has(role)) got += w
    }
    const anchor = ANCHORS[domain].some((r) => present.has(r))
    // coverage of the signature, rewarded by absolute evidence
    const s = anchor ? (got / total) * 0.7 + Math.min(got, 9) / 9 * 0.3 : (got / total) * 0.25
    scores[domain] = Math.round(s * 1000) / 1000
    if (s > bestScore) {
      second = bestScore
      bestScore = s
      best = domain
    } else if (s > second) second = s
  }
  scores.generic = 0.25
  if (bestScore < 0.28) {
    return { domain: 'generic', confidence: Math.round((1 - bestScore) * 60) / 100, scores, matchedRoles: [...present] }
  }
  const separation = bestScore - second
  const confidence = Math.min(0.97, 0.45 + bestScore * 0.45 + separation * 0.6)
  return { domain: best, confidence: Math.round(confidence * 100) / 100, scores, matchedRoles: [...present] }
}
