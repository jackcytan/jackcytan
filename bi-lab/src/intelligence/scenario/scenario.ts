/**
 * WHAT-IF SCENARIO MODEL
 * Transparent driver model:
 *   volumeFactor = (1 + revenue%) × (1 + volume%) × (1 + conversion%)
 *   Revenue'     = Revenue × (1 + price%) × volumeFactor
 *   Cost'        = (Cost × variableShare × volumeFactor + Cost × (1 − variableShare)) × (1 + unitCost%)
 *   Marketing'   = Spend × (1 + marketing%)       Personnel' = Payroll × (1 + personnel%)
 *   Profit'      = Revenue' − Cost' − Marketing' − Personnel' − OtherCosts
 * "Revenue %" is treated as a volume-driven change (variable costs scale with it); "Price %" is not.
 */
import type { Ctx } from '../analysis/context'

export interface ScenarioBase {
  revenue: number
  cost: number
  marketing: number
  personnel: number
  otherCosts: number
  profit: number
  margin: number
  quantity: number | null
  available: { price: boolean; volume: boolean; cost: boolean; marketing: boolean; personnel: boolean; conversion: boolean }
  costSource: 'cost' | 'expense' | 'actual' | null
}

export interface ScenarioInputs {
  revenuePct: number
  pricePct: number
  volumePct: number
  costPct: number
  marketingPct: number
  personnelPct: number
  conversionPct: number
  variableShare: number
}

export const ZERO_INPUTS: ScenarioInputs = { revenuePct: 0, pricePct: 0, volumePct: 0, costPct: 0, marketingPct: 0, personnelPct: 0, conversionPct: 0, variableShare: 0.7 }

export interface ScenarioOutput {
  revenue: number
  cost: number
  marketing: number
  personnel: number
  profit: number
  margin: number
  deltaProfit: number
  deltaRevenue: number
  deltaMarginPp: number
  quantity: number | null
}

export function scenarioBase(ctx: Ctx): ScenarioBase | null {
  if (!ctx.has('revenue')) return null
  const revenue = ctx.sum('revenue')
  if (!Number.isFinite(revenue) || revenue <= 0) return null
  const costSource = ctx.has('cost') ? 'cost' : ctx.has('expense') ? 'expense' : ctx.has('actual') && ctx.has('budget') ? 'actual' : null
  const cost = costSource ? ctx.sum(costSource) || 0 : 0
  const marketing = ctx.has('spend') ? ctx.sum('spend') || 0 : 0
  const personnel = ctx.has('salary') ? ctx.sum('salary') || 0 : 0
  let otherCosts = 0
  if (ctx.key('profit')) {
    const pcol = ctx.sum('profit')
    const implied = revenue - cost - marketing - personnel
    if (Number.isFinite(pcol) && implied - pcol > revenue * 0.005) otherCosts = implied - pcol
  }
  const profit = revenue - cost - marketing - personnel - otherCosts
  return {
    revenue,
    cost,
    marketing,
    personnel,
    otherCosts,
    profit,
    margin: profit / revenue,
    quantity: ctx.has('quantity') ? ctx.sum('quantity') : null,
    available: { price: true, volume: true, cost: cost > 0, marketing: marketing > 0, personnel: personnel > 0, conversion: ctx.has('lead') || ctx.has('conversion') || ctx.has('orders') },
    costSource,
  }
}

export function runScenario(b: ScenarioBase, i: ScenarioInputs): ScenarioOutput {
  const vf = (1 + i.revenuePct) * (1 + i.volumePct) * (1 + i.conversionPct)
  const revenue = b.revenue * (1 + i.pricePct) * vf
  const vShare = Math.max(0, Math.min(1, i.variableShare))
  const cost = (b.cost * vShare * vf + b.cost * (1 - vShare)) * (1 + i.costPct)
  const marketing = b.marketing * (1 + i.marketingPct)
  const personnel = b.personnel * (1 + i.personnelPct)
  const profit = revenue - cost - marketing - personnel - b.otherCosts
  const margin = revenue ? profit / revenue : NaN
  return {
    revenue,
    cost,
    marketing,
    personnel,
    profit,
    margin,
    deltaProfit: profit - b.profit,
    deltaRevenue: revenue - b.revenue,
    deltaMarginPp: margin - b.margin,
    quantity: b.quantity !== null ? b.quantity * vf : null,
  }
}

/** Price change needed (all else equal) to reach a target profit — useful "goal seek" helper. */
export function priceForTargetProfit(b: ScenarioBase, i: ScenarioInputs, targetProfit: number): number {
  const vf = (1 + i.revenuePct) * (1 + i.volumePct) * (1 + i.conversionPct)
  const vShare = Math.max(0, Math.min(1, i.variableShare))
  const cost = (b.cost * vShare * vf + b.cost * (1 - vShare)) * (1 + i.costPct)
  const others = b.marketing * (1 + i.marketingPct) + b.personnel * (1 + i.personnelPct) + b.otherCosts
  const needRevenue = targetProfit + cost + others
  return needRevenue / (b.revenue * vf) - 1
}
