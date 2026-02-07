import { useState, useEffect, useCallback } from 'react'
import { goalService } from '../../di/container'
import { GoalViewModel } from '../viewModels/GoalViewModel'

export function useGoals() {
  const [goals, setGoals] = useState({})

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = useCallback(() => {
    const allGoals = goalService.getAllGoals()
    setGoals(GoalViewModel.fromGoalsMap(allGoals))
  }, [])

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
    afternoonCustomAmount
  ) => {
    goalService.saveGoal(
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
    loadGoals()
  }, [loadGoals])

  const getGoalByDay = useCallback((day) => {
    const goal = goalService.getGoalByDay(day)
    return GoalViewModel.fromGoal(goal)
  }, [])

  const buybackTarget = useCallback((day, shift) => {
    goalService.buybackTarget(day, shift)
    loadGoals()
  }, [loadGoals])

  return {
    goals,
    saveGoal,
    getGoalByDay,
    buybackTarget
  }
}
