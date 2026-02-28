import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'

/**
 * Pure function to compute monthly earnings for a single member.
 * Extracted from App.jsx calculateMonthlyEarnings + MonthlySalaryModal logic.
 */
export function calculateMemberMonthlyEarnings(goals, year, month, teamBonusShare = 0, miscTotal = 0) {
  let wages = 0
  let commission45 = 0
  let commission35 = 0
  let commissionCustom = 0
  let totalAllowance = 0
  let totalHours = 0
  let totalShifts = 0
  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
    const goal = goals[dateStr]
    if (!goal?.hasGoals) continue

    for (const shift of ['morning', 'afternoon']) {
      const confirmed = shift === 'morning' ? goal.morningConfirmed : goal.afternoonConfirmed
      if (!confirmed) continue

      totalShifts++
      const hours = (shift === 'morning' ? goal.morningShiftHours : goal.afternoonShiftHours) ?? DEFAULT_SHIFT_HOURS
      totalHours += hours

      const wage = (shift === 'morning' ? goal.morningWage : goal.afternoonWage) || 65
      wages += Math.round(wage * hours * 100) / 100

      const calculatedWage = shift === 'morning' ? goal.morningCalculatedWage : goal.afternoonCalculatedWage
      const amount = shift === 'morning' ? goal.morningAmount : goal.afternoonAmount
      const actual = shift === 'morning' ? goal.morningActual : goal.afternoonActual
      const boughtBack = shift === 'morning' ? goal.morningBoughtBack : goal.afternoonBoughtBack
      const customRate = shift === 'morning' ? goal.morningCustomRate : goal.afternoonCustomRate
      const customAmount = shift === 'morning' ? goal.morningCustomAmount : goal.afternoonCustomAmount
      const allowance = (shift === 'morning' ? goal.morningAllowance : goal.afternoonAllowance) || 0

      if (calculatedWage === 80 && actual > 0) {
        commission45 += amount * 0.045
      } else if (boughtBack && amount) {
        commission35 += amount * 0.035
      }

      if (customRate && customAmount) {
        commissionCustom += customAmount * (customRate / 100)
      }

      totalAllowance += allowance
    }
  }

  wages = Math.round(wages * 100) / 100
  commission45 = Math.round(commission45 * 100) / 100
  commission35 = Math.round(commission35 * 100) / 100
  commissionCustom = Math.round(commissionCustom * 100) / 100
  totalAllowance = Math.round(totalAllowance * 100) / 100
  totalHours = Math.round(totalHours * 100) / 100

  const grossTotal = Math.round((wages + commission45 + commission35 + commissionCustom + totalAllowance + teamBonusShare + miscTotal) * 100) / 100
  const effectiveHourlyWage = totalHours > 0 ? Math.round((grossTotal / totalHours) * 100) / 100 : null

  return {
    wages, commission45, commission35, commissionCustom,
    totalAllowance, totalHours, totalShifts, grossTotal, effectiveHourlyWage
  }
}
