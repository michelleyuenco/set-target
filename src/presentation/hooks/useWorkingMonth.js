import { useState, useEffect, useCallback } from 'react'
import { configService } from '../../infrastructure/firebase/configService'

export function useWorkingMonth() {
  const [workingMonth, setWorkingMonth] = useState(null)
  const [workingYear, setWorkingYear] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const settings = await configService.getAppSettings()
        if (cancelled) return
        if (settings && typeof settings.workingMonth === 'number' && typeof settings.workingYear === 'number') {
          setWorkingMonth(settings.workingMonth)
          setWorkingYear(settings.workingYear)
        }
      } catch (err) {
        console.error('Failed to load working month:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const saveWorkingMonth = useCallback(async (year, month, adminUid) => {
    await configService.setWorkingMonth(year, month, adminUid)
    setWorkingYear(year)
    setWorkingMonth(month)
  }, [])

  return { workingMonth, workingYear, loading, saveWorkingMonth }
}
