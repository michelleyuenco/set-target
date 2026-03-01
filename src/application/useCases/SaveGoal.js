import { Goal } from '../../domain/entities/Goal'

export class SaveGoal {
  constructor(goalRepository) {
    this.goalRepository = goalRepository
  }

  execute(data) {
    const existing = this.goalRepository.getByDay(data.day)
    const base = existing ? existing.toJSON() : {}

    // Merge: provided values override existing; undefined values preserve existing
    const overrides = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    )
    const goal = new Goal({ ...base, ...overrides })

    // Auto-clear buyback if actual now meets/exceeds the target —
    // the buyback is no longer needed and excess should be released
    if (goal.morningBoughtBack && goal.morningCalculatedWage === 80) {
      goal.morningBoughtBack = false
    }
    if (goal.afternoonBoughtBack && goal.afternoonCalculatedWage === 80) {
      goal.afternoonBoughtBack = false
    }

    if (goal.hasGoals) {
      this.goalRepository.save(goal)
    } else {
      this.goalRepository.delete(data.day)
    }

    // Rebalance: if this month's total buyback cost now exceeds total excess,
    // auto-clear the most recent buybacks until balanced
    this._rebalanceMonthBuybacks(data.day)

    return goal
  }

  _rebalanceMonthBuybacks(dayStr) {
    const [yearStr, monthStr] = dayStr.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr) // 1-based from date string
    const pad = (n) => String(n).padStart(2, '0')
    const daysInMonth = new Date(year, month, 0).getDate()

    const allGoals = this.goalRepository.getAll()

    // Calculate total excess and total buyback cost for this month
    let excessRevenue = 0
    let totalBuybackCost = 0
    const buybackShifts = [] // { dayStr, shift, amount } — for clearing in reverse order

    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${yearStr}-${pad(month)}-${pad(day)}`
      const goal = allGoals[ds]
      if (!goal?.hasGoals) continue

      for (const shift of ['morning', 'afternoon']) {
        const confirmed = shift === 'morning' ? goal.morningConfirmed : goal.afternoonConfirmed
        if (!confirmed) continue

        const calculatedWage = shift === 'morning' ? goal.morningCalculatedWage : goal.afternoonCalculatedWage
        const amount = shift === 'morning' ? goal.morningAmount : goal.afternoonAmount
        const actual = shift === 'morning' ? goal.morningActual : goal.afternoonActual
        const boughtBack = shift === 'morning' ? goal.morningBoughtBack : goal.afternoonBoughtBack

        if (calculatedWage === 80 && actual > 0) {
          if (amount && actual > amount) {
            excessRevenue += actual - amount
          }
        } else if (boughtBack && amount) {
          totalBuybackCost += amount
          buybackShifts.push({ dayStr: ds, shift, amount })
        }
      }
    }

    if (totalBuybackCost <= excessRevenue) return

    // Over-allocated — clear buybacks from latest dates first
    let overBy = totalBuybackCost - excessRevenue
    for (let i = buybackShifts.length - 1; i >= 0 && overBy > 0; i--) {
      const { dayStr: bDay, shift, amount } = buybackShifts[i]
      const bGoal = allGoals[bDay]
      if (!bGoal) continue

      if (shift === 'morning') {
        bGoal.morningBoughtBack = false
      } else {
        bGoal.afternoonBoughtBack = false
      }
      this.goalRepository.save(bGoal)
      overBy -= amount
    }
  }
}
