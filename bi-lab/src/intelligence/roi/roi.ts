/**
 * AUTOMATION ROI CALCULATOR — pure, documented formulas.
 *   Manual hours / month   = employees × tasks/day/employee × minutes/task ÷ 60 × working days
 *   Hourly cost            = monthly salary ÷ (working days × hours per day)
 *   Hours saved / month    = manual hours × automation %
 *   Equivalent FTE         = hours saved ÷ (working days × hours per day)
 *   Gross annual saving    = hours saved × hourly cost × 12
 *   Net annual saving      = gross saving − maintenance × 12
 *   Net first-year benefit = net annual saving − implementation cost
 *   ROI (first year)       = net first-year benefit ÷ implementation cost
 *   Payback (months)       = implementation cost ÷ monthly net saving
 *   3-year benefit         = 3 × net annual saving − implementation cost
 */
export interface RoiInputs {
  processName: string
  employees: number
  avgMonthlySalary: number
  tasksPerDay: number
  minutesPerTask: number
  workingDays: number
  automationPct: number
  implementationCost: number
  monthlyMaintenance: number
  hoursPerDay: number
}

export interface RoiResult {
  manualHoursMonth: number
  hourlyCost: number
  monthlyLaborCost: number
  annualLaborCost: number
  hoursSavedMonth: number
  remainingHoursMonth: number
  fte: number
  grossAnnualSaving: number
  netAnnualSaving: number
  netFirstYear: number
  roiFirstYear: number
  roi3Year: number
  paybackMonths: number
  threeYearBenefit: number
  monthlyNetSaving: number
  cumulative: { month: number; value: number }[]
  valid: boolean
  warnings: string[]
}

export const DEFAULT_ROI: RoiInputs = {
  processName: 'Đối soát hóa đơn & nhập liệu kế toán',
  employees: 4,
  avgMonthlySalary: 20_500_000,
  tasksPerDay: 40,
  minutesPerTask: 3.75,
  workingDays: 22,
  automationPct: 0.7,
  implementationCost: 80_000_000,
  monthlyMaintenance: 1_500_000,
  hoursPerDay: 8,
}

export function calcRoi(i: RoiInputs): RoiResult {
  const warnings: string[] = []
  const nz = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0)
  const employees = nz(i.employees)
  const days = nz(i.workingDays) || 22
  const hpd = nz(i.hoursPerDay) || 8
  const auto = Math.max(0, Math.min(1, Number.isFinite(i.automationPct) ? i.automationPct : 0))
  const manualHoursMonth = (employees * nz(i.tasksPerDay) * nz(i.minutesPerTask)) / 60 * days
  const hourlyCost = nz(i.avgMonthlySalary) / (days * hpd)
  const monthlyLaborCost = manualHoursMonth * hourlyCost
  const hoursSavedMonth = manualHoursMonth * auto
  const fte = hoursSavedMonth / (days * hpd)
  const grossAnnualSaving = hoursSavedMonth * hourlyCost * 12
  const netAnnualSaving = grossAnnualSaving - nz(i.monthlyMaintenance) * 12
  const impl = nz(i.implementationCost)
  const netFirstYear = netAnnualSaving - impl
  const monthlyNetSaving = netAnnualSaving / 12
  const paybackMonths = monthlyNetSaving > 0 ? impl / monthlyNetSaving : Infinity
  const threeYearBenefit = netAnnualSaving * 3 - impl
  if (employees * hpd * days < manualHoursMonth) warnings.push('workload_exceeds_capacity')
  if (monthlyNetSaving <= 0) warnings.push('no_payback')
  const cumulative: { month: number; value: number }[] = []
  for (let m = 0; m <= 36; m++) cumulative.push({ month: m, value: -impl + monthlyNetSaving * m })
  return {
    manualHoursMonth,
    hourlyCost,
    monthlyLaborCost,
    annualLaborCost: monthlyLaborCost * 12,
    hoursSavedMonth,
    remainingHoursMonth: manualHoursMonth - hoursSavedMonth,
    fte,
    grossAnnualSaving,
    netAnnualSaving,
    netFirstYear,
    roiFirstYear: impl > 0 ? netFirstYear / impl : NaN,
    roi3Year: impl > 0 ? threeYearBenefit / impl : NaN,
    paybackMonths,
    threeYearBenefit,
    monthlyNetSaving,
    cumulative,
    valid: manualHoursMonth > 0 && hourlyCost > 0,
    warnings,
  }
}
