import { useState, useEffect, useCallback } from 'react'
import { rosterAppService as rosterService } from '../../di/container'

// year and month are 1-based (e.g., month=3 for March)
export function useRoster(year, month, currentUserUid) {
  const [roster, setRoster] = useState(null)
  const [loading, setLoading] = useState(true)

  // Real-time subscription — auto-updates when any user writes to the roster doc
  useEffect(() => {
    setLoading(true)
    const unsubscribe = rosterService.subscribeToRoster(year, month, (data) => {
      setRoster(data)
      setLoading(false)
    }, () => {
      setLoading(false)
    })
    return unsubscribe
  }, [year, month])

  // slotData = { uid, displayName, notes } or null
  // locationName is the slot key — each location gets its own slot per shift.
  const saveSlot = useCallback(async (day, shift, locationName, slotData) => {
    try {
      await rosterService.saveRosterSlot(year, month, day, shift, locationName, slotData, currentUserUid)
      // No manual reload needed — onSnapshot will update roster automatically
    } catch (err) {
      console.error('Failed to save slot:', err)
      throw err
    }
  }, [year, month, currentUserUid])

  const clearSlot = useCallback(async (day, shift, locationName) => {
    return saveSlot(day, shift, locationName, null)
  }, [saveSlot])

  // Bulk assign: save multiple day/shift/location slots in one Firestore write.
  // updates = [{ day, shift, locationName, slotData }]
  const saveBulkSlots = useCallback(async (updates) => {
    try {
      await rosterService.saveBulkRosterSlots(year, month, updates, currentUserUid)
      // No manual reload needed — onSnapshot will update roster automatically
    } catch (err) {
      console.error('Failed to save bulk slots:', err)
      throw err
    }
  }, [year, month, currentUserUid])

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

  return { roster, loading, myShifts, saveSlot, clearSlot, saveBulkSlots }
}
