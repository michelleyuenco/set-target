import { useState, useEffect, useCallback } from 'react'
import { teamBonusService } from '../../infrastructure/firebase/teamBonusService'

function extractBonusData(teamBonus, userUid) {
  if (!teamBonus) return { totalShare: 0, locationBreakdown: [] }

  // New format: per-location
  if (teamBonus.locations) {
    let totalShare = 0
    const locationBreakdown = []
    for (const [locName, locData] of Object.entries(teamBonus.locations)) {
      const share = locData.allocations?.[userUid]?.share || 0
      if (share > 0) {
        locationBreakdown.push({ location: locName, share })
        totalShare += share
      }
    }
    return { totalShare: Math.round(totalShare * 100) / 100, locationBreakdown }
  }

  // Legacy format: flat allocations
  const share = teamBonus.allocations?.[userUid]?.share || 0
  return {
    totalShare: share,
    locationBreakdown: share > 0 ? [{ location: 'Team Bonus', share }] : []
  }
}

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

  const saveTeamBonus = useCallback(async (locationsData, adminUid) => {
    const data = {
      locations: locationsData,
      updatedBy: adminUid
    }
    await teamBonusService.saveTeamBonus(monthKey, data)
    setTeamBonus({ ...data, updatedAt: new Date().toISOString() })
  }, [monthKey])

  const { totalShare: myBonusShare, locationBreakdown: myBonusBreakdown } = extractBonusData(teamBonus, userUid)

  return {
    teamBonus,
    loading,
    myBonusShare,
    myBonusBreakdown,
    loadTeamBonus,
    saveTeamBonus
  }
}
