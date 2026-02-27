import { useState, useEffect, useCallback } from 'react'
import { locationService } from '../../infrastructure/firebase/locationService'

export function useLocations(ready) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)

  const loadLocations = useCallback(async () => {
    if (!ready) return
    setLoading(true)
    try {
      const result = await locationService.getAll()
      setLocations(result)
    } catch (err) {
      console.error('Failed to load locations:', err)
    } finally {
      setLoading(false)
    }
  }, [ready])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  const addLocation = useCallback(async (name, abbr) => {
    const loc = await locationService.add(name, abbr, locations.length)
    setLocations(prev => [...prev, loc])
    return loc
  }, [locations.length])

  const updateLocation = useCallback(async (id, name, abbr) => {
    const updated = await locationService.update(id, name, abbr)
    setLocations(prev => prev.map(l => l.id === id ? { ...l, name: updated.name, abbr: updated.abbr } : l))
    return updated
  }, [])

  const removeLocation = useCallback(async (id) => {
    await locationService.remove(id)
    setLocations(prev => {
      const next = prev.filter(l => l.id !== id)
      // Re-assign order values so there are no gaps
      locationService.updateOrder(next).catch(() => {})
      return next.map((l, i) => ({ ...l, order: i }))
    })
  }, [])

  const reorderLocations = useCallback(async (newOrderedLocations) => {
    // Optimistically update state, then persist
    const withOrder = newOrderedLocations.map((l, i) => ({ ...l, order: i }))
    setLocations(withOrder)
    await locationService.updateOrder(withOrder)
  }, [])

  const setLocationVisibility = useCallback(async (id, visible) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, visible } : l))
    await locationService.setVisibility(id, visible)
  }, [])

  // Only visible locations for use in dropdowns throughout the app
  const visibleLocations = locations.filter(l => l.visible !== false)

  return {
    locations,         // all (visible + hidden) — for admin management
    visibleLocations,  // only visible — for dropdowns in GoalModal, RosterModal, etc.
    loading,
    addLocation,
    updateLocation,
    removeLocation,
    reorderLocations,
    setLocationVisibility,
    loadLocations
  }
}
