import { useState, useCallback } from 'react'
import { teamBonusService } from '../../infrastructure/firebase/teamBonusService'

export function useLocationCalendar() {
  const [membersGoals, setMembersGoals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadedKey, setLoadedKey] = useState(null)

  const loadGoals = useCallback(async (members, year, month) => {
    if (members.length === 0) return
    setLoading(true)
    try {
      const data = await teamBonusService.getAllMembersGoalsForMonth(members, year, month)
      setMembersGoals(data)
      setLoadedKey(`${year}-${month}`)
    } catch (err) {
      console.error('Failed to load location calendar:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { membersGoals, loading, loadedKey, loadGoals }
}
