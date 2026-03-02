import { useState, useCallback } from 'react'
import { teamBonusService } from '../../infrastructure/firebase/teamBonusService'

// Returns location performance stats for all members for a given month.
// year/month follow the same 0-based month convention as the rest of App.jsx.
export function useLocationPerformance() {
  const [stats, setStats] = useState(null)   // { [locationName]: { totalActual, totalTarget, shiftCount, members } }
  const [teamBonus, setTeamBonus] = useState(null) // { locations: { [locName]: { amount, allocations } } }
  const [loading, setLoading] = useState(false)
  const [loadedKey, setLoadedKey] = useState(null) // "YYYY-M" of last successful load

  const loadStats = useCallback(async (members, year, month) => {
    if (members.length === 0) return   // nothing to load yet
    setLoading(true)
    try {
      const pad = (n) => String(n).padStart(2, '0')
      const monthKey = `${year}-${pad(month + 1)}`
      const [data, bonus] = await Promise.all([
        teamBonusService.getAllMembersLocationStats(members, year, month),
        teamBonusService.getTeamBonus(monthKey)
      ])
      setStats(data)
      setTeamBonus(bonus)
      setLoadedKey(`${year}-${month}`)
    } catch (err) {
      console.error('Failed to load location performance:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, teamBonus, loading, loadedKey, loadStats }
}
