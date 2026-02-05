import { SaveGoal } from '../useCases/SaveGoal'
import { GetGoals } from '../useCases/GetGoals'
import { GetGoalByDay } from '../useCases/GetGoalByDay'

export class GoalService {
  constructor(goalRepository) {
    this.saveGoalUseCase = new SaveGoal(goalRepository)
    this.getGoalsUseCase = new GetGoals(goalRepository)
    this.getGoalByDayUseCase = new GetGoalByDay(goalRepository)
  }

  saveGoal(day, morningAmount, afternoonAmount, morningActual, afternoonActual) {
    return this.saveGoalUseCase.execute(day, morningAmount, afternoonAmount, morningActual, afternoonActual)
  }

  getAllGoals() {
    return this.getGoalsUseCase.execute()
  }

  getGoalByDay(day) {
    return this.getGoalByDayUseCase.execute(day)
  }
}
