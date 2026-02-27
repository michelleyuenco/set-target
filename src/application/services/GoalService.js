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
    afternoonConfirmed,
    morningAdminConfirmed,
    afternoonAdminConfirmed,
    morningLocation,
    afternoonLocation,
    morningProofImages,
    afternoonProofImages,
    morningAllowance,
    afternoonAllowance
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
      afternoonConfirmed,
      morningAdminConfirmed,
      afternoonAdminConfirmed,
      morningLocation,
      afternoonLocation,
      morningProofImages,
      afternoonProofImages,
      morningAllowance,
      afternoonAllowance
    )
  }

  confirmShift(day, shift, location) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    const morningAdminConfirmed = shift === 'morning' ? true : goal.morningAdminConfirmed
    const afternoonAdminConfirmed = shift === 'afternoon' ? true : goal.afternoonAdminConfirmed
    const morningLocation = shift === 'morning' ? location : goal.morningLocation
    const afternoonLocation = shift === 'afternoon' ? location : goal.afternoonLocation

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
      goal.afternoonConfirmed,
      morningAdminConfirmed,
      afternoonAdminConfirmed,
      morningLocation,
      afternoonLocation,
      undefined,
      undefined,
      goal.morningAllowance,
      goal.afternoonAllowance
    )
  }

  unconfirmShift(day, shift) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    const morningAdminConfirmed = shift === 'morning' ? false : goal.morningAdminConfirmed
    const afternoonAdminConfirmed = shift === 'afternoon' ? false : goal.afternoonAdminConfirmed
    const morningLocation = shift === 'morning' ? null : goal.morningLocation
    const afternoonLocation = shift === 'afternoon' ? null : goal.afternoonLocation

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
      goal.afternoonConfirmed,
      morningAdminConfirmed,
      afternoonAdminConfirmed,
      morningLocation,
      afternoonLocation,
      undefined,
      undefined,
      goal.morningAllowance,
      goal.afternoonAllowance
    )
  }

  updateShiftLocations(day, location) {
    const goal = this.getGoalByDayUseCase.execute(day)
    if (!goal) return null

    const morningLocation = goal.morningConfirmed ? location : undefined
    const afternoonLocation = goal.afternoonConfirmed ? location : undefined

    if (morningLocation === undefined && afternoonLocation === undefined) return null

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
      goal.afternoonConfirmed,
      undefined,
      undefined,
      morningLocation,
      afternoonLocation,
      undefined,
      undefined,
      goal.morningAllowance,
      goal.afternoonAllowance
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
