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
    afternoonCustomAmount
  ) {
    // Preserve existing buyback status if not provided
    const existingGoal = this.goalRepository.getByDay(day)
    const finalMorningBoughtBack = morningBoughtBack !== undefined ? morningBoughtBack : existingGoal?.morningBoughtBack
    const finalAfternoonBoughtBack = afternoonBoughtBack !== undefined ? afternoonBoughtBack : existingGoal?.afternoonBoughtBack

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
      afternoonCustomAmount
    )

    if (goal.hasGoals()) {
      this.goalRepository.save(goal)
    } else {
      this.goalRepository.delete(day)
    }

    return goal
  }
}
