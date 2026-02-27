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
    // Preserve existing buyback status if not provided
    const existingGoal = this.goalRepository.getByDay(day)
    const finalMorningBoughtBack = morningBoughtBack !== undefined ? morningBoughtBack : existingGoal?.morningBoughtBack
    const finalAfternoonBoughtBack = afternoonBoughtBack !== undefined ? afternoonBoughtBack : existingGoal?.afternoonBoughtBack

    // Preserve existing per-shift admin state if not explicitly provided
    const finalMorningAdminConfirmed = morningAdminConfirmed !== undefined ? morningAdminConfirmed : (existingGoal?.morningAdminConfirmed || false)
    const finalAfternoonAdminConfirmed = afternoonAdminConfirmed !== undefined ? afternoonAdminConfirmed : (existingGoal?.afternoonAdminConfirmed || false)
    const finalMorningLocation = morningLocation !== undefined ? morningLocation : (existingGoal?.morningLocation || null)
    const finalAfternoonLocation = afternoonLocation !== undefined ? afternoonLocation : (existingGoal?.afternoonLocation || null)
    const finalMorningProofImages = morningProofImages !== undefined ? morningProofImages : (existingGoal?.morningProofImages || [])
    const finalAfternoonProofImages = afternoonProofImages !== undefined ? afternoonProofImages : (existingGoal?.afternoonProofImages || [])
    const finalMorningAllowance = morningAllowance !== undefined ? morningAllowance : (existingGoal?.morningAllowance ?? null)
    const finalAfternoonAllowance = afternoonAllowance !== undefined ? afternoonAllowance : (existingGoal?.afternoonAllowance ?? null)

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
      afternoonCustomAmount,
      morningStartTime,
      morningEndTime,
      afternoonStartTime,
      afternoonEndTime,
      morningConfirmed,
      afternoonConfirmed,
      finalMorningAdminConfirmed,
      finalAfternoonAdminConfirmed,
      finalMorningLocation,
      finalAfternoonLocation,
      finalMorningProofImages,
      finalAfternoonProofImages,
      finalMorningAllowance,
      finalAfternoonAllowance
    )

    // Auto-clear buyback if actual now meets/exceeds the target —
    // the buyback is no longer needed and excess should be released
    if (goal.morningBoughtBack && goal.morningWage === 80) {
      goal.morningBoughtBack = false
    }
    if (goal.afternoonBoughtBack && goal.afternoonWage === 80) {
      goal.afternoonBoughtBack = false
    }

    if (goal.hasGoals()) {
      this.goalRepository.save(goal)
    } else {
      this.goalRepository.delete(day)
    }

    return goal
  }
}
