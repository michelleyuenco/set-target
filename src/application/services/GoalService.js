import { SaveGoal } from '../useCases/SaveGoal'
import { GetGoals } from '../useCases/GetGoals'
import { GetGoalByDay } from '../useCases/GetGoalByDay'

export class GoalService {
  constructor(goalRepository) {
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
    afternoonCustomAmount
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
      afternoonCustomAmount
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
      goal.afternoonCustomAmount
    )
  }

  getAllGoals() {
    return this.getGoalsUseCase.execute()
  }

  getGoalByDay(day) {
    return this.getGoalByDayUseCase.execute(day)
  }
}
