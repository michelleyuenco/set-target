import { useState, useCallback } from 'react'
import { teamBonusService } from '../../infrastructure/firebase/teamBonusService'

// Returns location performance stats for all members for a given month.
// year/month follow the same 0-based month convention as the rest of App.jsx.
export function useLocationPerformance() {
  const [stats, setStats] = useState(null)   // { [locationName]: { totalActual, totalTarget, shiftCount, members } }
  const [loading, setLoading] = useState(false)
  const [loadedKey, setLoadedKey] = useState(null) // "YYYY-M" of last successful load

  const loadStats = useCallback(async (members, year, month) => {
    setLoading(true)
    try {
      const data = await teamBonusService.getAllMembersLocationStats(members, year, month)
      setStats(data)
      setLoadedKey(`${year}-${month}`)
    } catch (err) {
      console.error('Failed to load location performance:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, loading, loadedKey, loadStats }
}
