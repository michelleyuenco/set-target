import { useState, useEffect, useCallback } from 'react'
import { rosterService } from '../../infrastructure/firebase/rosterService'

// year and month are 1-based (e.g., month=3 for March)
export function useRoster(year, month, currentUserUid) {
  const [roster, setRoster] = useState(null)
  const [loading, setLoading] = useState(false)

  const pad = (n) => String(n).padStart(2, '0')
  const monthKey = `${year}-${pad(month)}`

  const loadRoster = useCallback(async () => {
    setLoading(true)
    try {
      const data = await rosterService.getRoster(year, month)
      setRoster(data)
    } catch (err) {
      console.error('Failed to load roster:', err)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    loadRoster()
  }, [loadRoster])

  // slotData = { uid, displayName, notes } or null
  // locationName is the slot key — each location gets its own slot per shift.
  const saveSlot = useCallback(async (day, shift, locationName, slotData) => {
    try {
      await rosterService.saveRosterSlot(year, month, day, shift, locationName, slotData, currentUserUid)
      setRoster((prev) => {
        const prevDays = prev?.days || {}
        const prevDay = prevDays[day] || {}
        const prevShift = prevDay[shift] || {}
        return {
          ...prev,
          month: monthKey,
          days: {
            ...prevDays,
            [day]: {
              ...prevDay,
              [shift]: {
                ...prevShift,
                [locationName]: slotData
              }
            }
          }
        }
      })
    } catch (err) {
      console.error('Failed to save slot:', err)
      throw err
    }
  }, [year, month, currentUserUid, monthKey])

  const clearSlot = useCallback(async (day, shift, locationName) => {
    return saveSlot(day, shift, locationName, null)
  }, [saveSlot])

  // Derived: only current user's confirmed shifts, across all locations, sorted by day.
  // Returns { day, shift, locationName, slot } objects.
  const myShifts = roster
    ? Object.entries(roster.days || {})
        .flatMap(([day, dayData]) =>
          ['morning', 'afternoon'].flatMap(shift => {
            const shiftData = dayData?.[shift] || {}
            return Object.entries(shiftData)
              .filter(([, slot]) => slot?.uid === currentUserUid)
              .map(([locationName, slot]) => ({ day, shift, locationName, slot }))
          })
        )
        .sort((a, b) => a.day.localeCompare(b.day))
    : []

  return { roster, loading, myShifts, loadRoster, saveSlot, clearSlot }
}
