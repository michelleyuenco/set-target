import { useState, useEffect, useCallback, useRef } from 'react'
import { rosterAppService as rosterService, appDocId } from '../../di/container'

export function useRosterApplications(year, month, currentUserUid, isAdmin) {
  const [applications, setApplications] = useState([])
  const [loadingApps, setLoadingApps] = useState(false)
  const reloadTimerRef = useRef(null)

  const loadApplications = useCallback(async () => {
    setLoadingApps(true)
    try {
      const all = await rosterService.getApplications(year, month)
      // All users see all applications so members can view team coverage
      setApplications(all)
    } finally {
      setLoadingApps(false)
    }
  }, [year, month, currentUserUid, isAdmin])

  useEffect(() => { loadApplications() }, [loadApplications])

  // Schedule a background reload (deduped) to sync with server.
  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimerRef.current)
    reloadTimerRef.current = setTimeout(() => loadApplications(), 300)
  }, [loadApplications])

  // Batch apply: optimistic local insert + single batch write + background reload.
  const applyForShifts = async (items) => {
    // Optimistic: immediately add pending applications to local state
    const optimistic = items.map(({ uid, displayName, day, shift, location, notes }) => ({
      id: appDocId(uid, day, shift, location),
      uid,
      displayName,
      day,
      shift,
      location,
      notes: notes || '',
      status: 'pending',
      appliedAt: new Date()
    }))
    setApplications(prev => {
      const ids = new Set(optimistic.map(o => o.id))
      return [...prev.filter(a => !ids.has(a.id)), ...optimistic]
    })
    try {
      await rosterService.applyForShifts(year, month, items)
    } catch (err) {
      // Roll back on failure
      const ids = new Set(optimistic.map(o => o.id))
      setApplications(prev => prev.filter(a => !ids.has(a.id)))
      throw err
    } finally {
      scheduleReload()
    }
  }

  // Batch cancel: optimistic local removal + single batch delete + background reload.
  const cancelApplications = async (ids) => {
    const idSet = new Set(ids)
    // Snapshot for rollback
    const removed = applications.filter(a => idSet.has(a.id))
    setApplications(prev => prev.filter(a => !idSet.has(a.id)))
    try {
      await rosterService.cancelApplications(year, month, ids)
    } catch (err) {
      // Roll back on failure
      setApplications(prev => [...prev, ...removed])
      throw err
    } finally {
      scheduleReload()
    }
  }

  // Keep single-item versions for admin actions that still use them.
  const applyForShift = async (data) => {
    await applyForShifts([data])
  }

  const cancelApplication = async (id) => {
    await cancelApplications([id])
  }

  // location is now required — applications compete per day+shift+location slot.
  const approveApplication = async (id, slotData, day, shift, location) => {
    await rosterService.approveApplication(year, month, id, slotData, day, shift, location)
    await loadApplications()
  }

  const rejectApplication = async (id) => {
    await rosterService.rejectApplication(year, month, id)
    await loadApplications()
  }

  return {
    applications,
    loadingApps,
    loadApplications,
    applyForShift,
    applyForShifts,
    cancelApplication,
    cancelApplications,
    approveApplication,
    rejectApplication
  }
}
