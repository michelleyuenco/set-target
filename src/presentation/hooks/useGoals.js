import { useState, useEffect, useCallback } from 'react'
import { getActiveGoalService } from '../../di/container'
import { GoalViewModel } from '../viewModels/GoalViewModel'

export function useGoals(authUser) {
  const [goals, setGoals] = useState({})

  const loadGoals = useCallback(() => {
    const service = getActiveGoalService()
    const allGoals = service.getAllGoals()
    setGoals(GoalViewModel.fromGoalsMap(allGoals))
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals, authUser])

  const saveGoal = useCallback((
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
  ) => {
    const service = getActiveGoalService()
    service.saveGoal(
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
    loadGoals()
  }, [loadGoals])

  const getGoalByDay = useCallback((day) => {
    const service = getActiveGoalService()
    const goal = service.getGoalByDay(day)
    return GoalViewModel.fromGoal(goal)
  }, [])

  const buybackTarget = useCallback((day, shift) => {
    const service = getActiveGoalService()
    service.buybackTarget(day, shift)
    loadGoals()
  }, [loadGoals])

  const exportData = useCallback(() => {
    const service = getActiveGoalService()
    return service.exportData()
  }, [])

  return {
    goals,
    saveGoal,
    getGoalByDay,
    buybackTarget,
    exportData,
    loadGoals
  }
}
