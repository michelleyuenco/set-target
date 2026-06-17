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

  saveGoal(data) {
    return this.saveGoalUseCase.execute(data)
  }

  confirmShift(day, shift, location) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    return this.saveGoalUseCase.execute({
      day,
      [`${shift}AdminConfirmed`]: true,
      [`${shift}Location`]: location
    })
  }

  verifyAllConfirmedShifts(day) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    return this.saveGoalUseCase.execute({
      day,
      morningAdminConfirmed: goal.morningConfirmed ? true : goal.morningAdminConfirmed,
      afternoonAdminConfirmed: goal.afternoonConfirmed ? true : goal.afternoonAdminConfirmed
    })
  }

  unconfirmShift(day, shift) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    return this.saveGoalUseCase.execute({
      day,
      [`${shift}AdminConfirmed`]: false,
      [`${shift}Location`]: null
    })
  }

  updateShiftLocations(day, location) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    const overrides = { day }
    if (goal.morningConfirmed) overrides.morningLocation = location
    if (goal.afternoonConfirmed) overrides.afternoonLocation = location
    if (!overrides.morningLocation && !overrides.afternoonLocation) return null

    return this.saveGoalUseCase.execute(overrides)
  }

  buybackTarget(day, shift) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    return this.saveGoalUseCase.execute({
      day,
      [`${shift}BoughtBack`]: true
    })
  }

  getAllGoals() {
    return this.getGoalsUseCase.execute()
  }

  getGoalByDay(day) {
    return this.getGoalByDayUseCase.execute(day)
  }

  // Carry-forward defaults: the most recent activated shift's target before
  // `beforeDay`, resolved independently per shift. Used to pre-fill the target
  // when a shift is newly activated on a day that has no target yet.
  getLatestActivatedShiftTargets(beforeDay) {
    const allGoals = this.getGoalsUseCase.execute()
    const sortedDays = Object.keys(allGoals)
      .filter(day => day < beforeDay)
      .sort((a, b) => b.localeCompare(a))

    let morningAmount = null
    let afternoonAmount = null
    for (const day of sortedDays) {
      const goal = allGoals[day]
      if (!morningAmount && goal.morningConfirmed && goal.morningAmount) morningAmount = goal.morningAmount
      if (!afternoonAmount && goal.afternoonConfirmed && goal.afternoonAmount) afternoonAmount = goal.afternoonAmount
      if (morningAmount && afternoonAmount) break
    }
    return { morningAmount, afternoonAmount }
  }

  getLastLockedLocation(upToDay) {
    const allGoals = this.getGoalsUseCase.execute()
    const sortedDays = Object.keys(allGoals)
      .filter(day => day <= upToDay)
      .sort((a, b) => b.localeCompare(a))

    for (const day of sortedDays) {
      const goal = allGoals[day]
      if (goal.afternoonConfirmed && goal.afternoonLocation) return goal.afternoonLocation
      if (goal.morningConfirmed && goal.morningLocation) return goal.morningLocation
    }
    return null
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
