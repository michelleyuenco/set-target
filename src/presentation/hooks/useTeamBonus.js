import { useState, useEffect, useCallback } from 'react'
import { teamBonusService } from '../../infrastructure/firebase/teamBonusService'

export function useTeamBonus(year, month, userUid) {
  const [teamBonus, setTeamBonus] = useState(null)
  const [loading, setLoading] = useState(false)

  const pad = (n) => String(n).padStart(2, '0')
  const monthKey = `${year}-${pad(month + 1)}`

  const loadTeamBonus = useCallback(async () => {
    setLoading(true)
    try {
      const data = await teamBonusService.getTeamBonus(monthKey)
      setTeamBonus(data)
    } catch (err) {
      console.error('Failed to load team bonus:', err)
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => {
    loadTeamBonus()
  }, [loadTeamBonus])

  const saveTeamBonus = useCallback(async (amount, allocations, totalHours, adminUid) => {
    const data = {
      amount,
      allocations,
      totalHours,
      updatedBy: adminUid
    }
    await teamBonusService.saveTeamBonus(monthKey, data)
    setTeamBonus({ ...data, updatedAt: new Date().toISOString() })
  }, [monthKey])

  // Get the current user's bonus share from saved allocations
  const myBonusShare = teamBonus?.allocations?.[userUid]?.share || 0

  return {
    teamBonus,
    loading,
    myBonusShare,
    loadTeamBonus,
    saveTeamBonus
  }
}
