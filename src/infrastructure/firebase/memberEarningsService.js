import { teamBonusService } from './teamBonusService'
import { monthlyAdjustmentsService } from './monthlyAdjustmentsService'
import { calculateMemberMonthlyEarnings } from '../../application/services/earningsCalculator'

export const memberEarningsService = {
  /**
   * Compute effective hourly wages for all members across multiple months.
   * @param {Array} members - [{ uid, displayName, email }]
   * @param {Array} monthSpecs - [{ year, month }] with 0-based month
   * @returns {{ [uid]: { [monthKey]: { effectiveHourlyWage, grossTotal, totalHours, totalShifts } } }}
   */
  async getMembersEffectiveWages(members, monthSpecs) {
    const pad = (n) => String(n).padStart(2, '0')
    const result = {}

    // Fetch all months in parallel
    const monthDataList = await Promise.all(
      monthSpecs.map(async ({ year, month }) => {
        const monthKey = `${year}-${pad(month + 1)}`
        const [membersGoals, teamBonus, adjustmentsDoc] = await Promise.all([
          teamBonusService.getAllMembersGoalsForMonth(members, year, month),
          teamBonusService.getTeamBonus(monthKey),
          monthlyAdjustmentsService.getAdjustments(monthKey)
        ])
        return { year, month, monthKey, membersGoals, teamBonus, adjustmentsDoc }
      })
    )

    for (const member of members) {
      result[member.uid] = {}
      for (const { year, month, monthKey, membersGoals, teamBonus, adjustmentsDoc } of monthDataList) {
        const goals = membersGoals[member.uid]?.goals || {}
        const bonusShare = teamBonus?.allocations?.[member.uid]?.share || 0
        const miscItems = adjustmentsDoc?.adjustments?.[member.uid]?.items || []
        const miscTotal = miscItems.reduce((sum, item) => sum + (item.amount || 0), 0)

        const earnings = calculateMemberMonthlyEarnings(goals, year, month, bonusShare, miscTotal)
        result[member.uid][monthKey] = {
          effectiveHourlyWage: earnings.effectiveHourlyWage,
          grossTotal: earnings.grossTotal,
          totalHours: earnings.totalHours,
          totalShifts: earnings.totalShifts
        }
      }
    }

    return result
  }
}
