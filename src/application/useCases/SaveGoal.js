import { Goal } from '../../domain/entities/Goal'

export class SaveGoal {
  constructor(goalRepository) {
    this.goalRepository = goalRepository
  }

  execute(day, morningAmount, afternoonAmount) {
    const goal = new Goal(day, morningAmount, afternoonAmount)

    if (goal.hasGoals()) {
      this.goalRepository.save(goal)
    } else {
      this.goalRepository.delete(day)
    }

    return goal
  }
}
