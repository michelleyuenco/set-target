import { useState, useEffect, useCallback } from 'react'
import { monthlyAdjustmentsService } from '../../infrastructure/firebase/monthlyAdjustmentsService'

export function useMiscAdjustments(year, month, uid) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const pad = (n) => String(n).padStart(2, '0')
  const monthKey = `${year}-${pad(month + 1)}`

  const loadAdjustments = useCallback(async () => {
    if (!uid) { setItems([]); return }
    setLoading(true)
    try {
      const data = await monthlyAdjustmentsService.getUserAdjustments(monthKey, uid)
      setItems(data || [])
    } catch (err) {
      console.error('Failed to load adjustments:', err)
    } finally {
      setLoading(false)
    }
  }, [monthKey, uid])

  useEffect(() => {
    loadAdjustments()
  }, [loadAdjustments])

  const saveAdjustments = useCallback(async (newItems, adminUid) => {
    await monthlyAdjustmentsService.saveUserAdjustments(monthKey, uid, newItems, adminUid)
    setItems(newItems)
  }, [monthKey, uid])

  const miscTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  return {
    miscItems: items,
    miscTotal: Math.round(miscTotal * 100) / 100,
    loading,
    loadAdjustments,
    saveAdjustments
  }
}
