import { SaveGoal } from '../useCases/SaveGoal'
import { GetGoals } from '../useCases/GetGoals'
import { GetGoalByDay } from '../useCases/GetGoalByDay'

export class GoalService {
  constructor(goalRepository) {
    this.goalRepository = goalRepository
    this.saveGoalUseCase = new SaveGoal(goalRepository)
    this.getGoalsUseCase = new GetGoals(goalRepository)
    this.getGoalByDayUseCase = new GetGoalByDay(goalRepository)
  }

  saveGoal(
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
    afternoonConfirmed
  ) {
    return this.saveGoalUseCase.execute(
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
      afternoonConfirmed
    )
  }

  buybackTarget(day, shift) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    if (shift === 'morning') {
      goal.morningBoughtBack = true
    } else if (shift === 'afternoon') {
      goal.afternoonBoughtBack = true
    }

    return this.saveGoalUseCase.execute(
      day,
      goal.morningAmount,
      goal.afternoonAmount,
      goal.morningActual,
      goal.afternoonActual,
      goal.morningBoughtBack,
      goal.afternoonBoughtBack,
      goal.morningCustomRate,
      goal.afternoonCustomRate,
      goal.morningCustomAmount,
      goal.afternoonCustomAmount,
      goal.morningStartTime,
      goal.morningEndTime,
      goal.afternoonStartTime,
      goal.afternoonEndTime,
      goal.morningConfirmed,
      goal.afternoonConfirmed
    )
  }

  getAllGoals() {
    return this.getGoalsUseCase.execute()
  }

  getGoalByDay(day) {
    return this.getGoalByDayUseCase.execute(day)
  }

  exportData() {
    const rawGoals = this.goalRepository.getRawData()
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: 'local-storage',
      recordCount: Object.keys(rawGoals).length,
      goals: rawGoals
    }
  }
}
