import { Goal } from '../../domain/entities/Goal'

export class SaveGoal {
  constructor(goalRepository) {
    this.goalRepository = goalRepository
  }

  execute(
    day,
    morningAmount,
    afternoonAmount,
    morningActual,
    afternoonActual,
    morningBoughtBack,
    afternoonBoughtBack,
    morningCustomRate,
    afternoonCustomRate,
    morningCustomAmount,
    afternoonCustomAmount,
    morningStartTime,
    morningEndTime,
    afternoonStartTime,
    afternoonEndTime,
    morningConfirmed,
    afternoonConfirmed,
    adminConfirmed
  ) {
    // Preserve existing buyback status if not provided
    const existingGoal = this.goalRepository.getByDay(day)
    const finalMorningBoughtBack = morningBoughtBack !== undefined ? morningBoughtBack : existingGoal?.morningBoughtBack
    const finalAfternoonBoughtBack = afternoonBoughtBack !== undefined ? afternoonBoughtBack : existingGoal?.afternoonBoughtBack

    // Preserve existing adminConfirmed if not explicitly provided
    const finalAdminConfirmed = adminConfirmed !== undefined ? adminConfirmed : (existingGoal?.adminConfirmed || false)

    const goal = new Goal(
      day,
      morningAmount,
      afternoonAmount,
      morningActual,
      afternoonActual,
      finalMorningBoughtBack,
      finalAfternoonBoughtBack,
      morningCustomRate,
      afternoonCustomRate,
      morningCustomAmount,
      afternoonCustomAmount,
      morningStartTime,
      morningEndTime,
      afternoonStartTime,
      afternoonEndTime,
      morningConfirmed,
      afternoonConfirmed,
      finalAdminConfirmed
    )

    // Auto-clear buyback if actual now meets/exceeds the target —
    // the buyback is no longer needed and excess should be released
    if (goal.morningBoughtBack && goal.morningWage === 80) {
      goal.morningBoughtBack = false
    }
    if (goal.afternoonBoughtBack && goal.afternoonWage === 80) {
      goal.afternoonBoughtBack = false
    }

    if (goal.hasGoals()) {
      this.goalRepository.save(goal)
    } else {
      this.goalRepository.delete(day)
    }

    return goal
  }
}
