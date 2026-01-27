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

  const saveGoal = useCallback((day, morningAmount, afternoonAmount) => {
    goalService.saveGoal(day, morningAmount, afternoonAmount)
    loadGoals()
  }, [loadGoals])

  const getGoalByDay = useCallback((day) => {
    const goal = goalService.getGoalByDay(day)
    return GoalViewModel.fromGoal(goal)
  }, [])

  return {
    goals,
    saveGoal,
    getGoalByDay
  }
}
