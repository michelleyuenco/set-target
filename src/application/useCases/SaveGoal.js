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

    return goal
  }
}
