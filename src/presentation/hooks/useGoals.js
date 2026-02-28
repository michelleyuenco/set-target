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

  const saveGoal = useCallback((data) => {
    const service = getActiveGoalService()
    service.saveGoal(data)
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

  const confirmShift = useCallback((day, shift, location) => {
    const service = getActiveGoalService()
    service.confirmShift(day, shift, location)
    loadGoals()
  }, [loadGoals])

  const unconfirmShift = useCallback((day, shift) => {
    const service = getActiveGoalService()
    service.unconfirmShift(day, shift)
    loadGoals()
  }, [loadGoals])

  const bulkUpdateLocations = useCallback((dateStrs, location) => {
    const service = getActiveGoalService()
    dateStrs.forEach(dateStr => {
      service.updateShiftLocations(dateStr, location)
    })
    loadGoals()
  }, [loadGoals])

  const bulkVerifyShifts = useCallback((dateStrs) => {
    const service = getActiveGoalService()
    dateStrs.forEach(dateStr => {
      service.verifyAllConfirmedShifts(dateStr)
    })
    loadGoals()
  }, [loadGoals])

  const bulkUpdateAllowances = useCallback((dateStrs, amount, dayShiftMap) => {
    const service = getActiveGoalService()
    dateStrs.forEach(dateStr => {
      const shift = dayShiftMap?.[dateStr] || 'morning'
      if (shift === 'afternoon') {
        service.saveGoal({ day: dateStr, afternoonAllowance: amount })
      } else {
        service.saveGoal({ day: dateStr, morningAllowance: amount })
      }
    })
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
    confirmShift,
    unconfirmShift,
    bulkUpdateLocations,
    bulkVerifyShifts,
    bulkUpdateAllowances,
    exportData,
    loadGoals
  }
}
