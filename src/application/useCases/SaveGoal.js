import { Goal } from '../../domain/entities/Goal'

export class SaveGoal {
  constructor(goalRepository) {
    this.goalRepository = goalRepository
  }

  execute(day, morningAmount, afternoonAmount, morningActual, afternoonActual) {
    const goal = new Goal(day, morningAmount, afternoonAmount, morningActual, afternoonActual)

    if (goal.hasGoals()) {
      this.goalRepository.save(goal)
    } else {
      this.goalRepository.delete(day)
    }

    return goal
  }
}
