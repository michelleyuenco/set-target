import { Money } from '../../domain/valueObjects/Money'

export class GoalViewModel {
  constructor(goal) {
    this.day = goal.day
    this.morningAmount = goal.morningAmount
    this.afternoonAmount = goal.afternoonAmount
    this.morningActual = goal.morningActual
    this.afternoonActual = goal.afternoonActual
    this.morningWage = goal.morningWage
    this.afternoonWage = goal.afternoonWage
    this.hasGoals = goal.hasGoals()
  }

  get formattedMorning() {
    return Money.of(this.morningAmount).format()
  }

  get formattedAfternoon() {
    return Money.of(this.afternoonAmount).format()
  }

  get formattedMorningActual() {
    return Money.of(this.morningActual).format()
  }

  get formattedAfternoonActual() {
    return Money.of(this.afternoonActual).format()
  }

  get totalTarget() {
    const morning = this.morningAmount || 0
    const afternoon = this.afternoonAmount || 0
    return morning + afternoon
  }

  get totalActual() {
    const morning = this.morningActual || 0
    const afternoon = this.afternoonActual || 0
    return morning + afternoon
  }

  get formattedTotalTarget() {
    return Money.of(this.totalTarget).format()
  }

  get formattedTotalActual() {
    return Money.of(this.totalActual).format()
  }

  static fromGoal(goal) {
    if (!goal) return null
    return new GoalViewModel(goal)
  }

  static fromGoalsMap(goalsMap) {
    const viewModels = {}
    for (const [day, goal] of Object.entries(goalsMap)) {
      viewModels[day] = GoalViewModel.fromGoal(goal)
    }
    return viewModels
  }
}
