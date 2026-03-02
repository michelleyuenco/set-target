import { useState, useEffect, useCallback } from 'react'
import { salaryConfirmationService } from '../../infrastructure/firebase/salaryConfirmationService'

export function useSalaryConfirmation(year, month, uid) {
  const [adminConfirmed, setAdminConfirmed] = useState(false)
  const [adminConfirmedAt, setAdminConfirmedAt] = useState(null)
  const [memberConfirmed, setMemberConfirmed] = useState(false)
  const [memberConfirmedAt, setMemberConfirmedAt] = useState(null)
  const [loading, setLoading] = useState(false)

  const pad = (n) => String(n).padStart(2, '0')
  const monthKey = `${year}-${pad(month + 1)}`

  const loadConfirmation = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await salaryConfirmationService.getConfirmation(monthKey, uid)
      if (data) {
        setAdminConfirmed(!!data.adminConfirmedAt)
        setAdminConfirmedAt(data.adminConfirmedAt || null)
        setMemberConfirmed(!!data.memberConfirmedAt)
        setMemberConfirmedAt(data.memberConfirmedAt || null)
      } else {
        setAdminConfirmed(false)
        setAdminConfirmedAt(null)
        setMemberConfirmed(false)
        setMemberConfirmedAt(null)
      }
    } catch (err) {
      console.error('Failed to load salary confirmation:', err)
    } finally {
      setLoading(false)
    }
  }, [monthKey, uid])

  useEffect(() => {
    loadConfirmation()
  }, [loadConfirmation])

  const publishSalary = useCallback(async (adminUid, grossTotal, takeHome) => {
    if (!uid) return
    await salaryConfirmationService.publishSalary(monthKey, uid, adminUid, { grossTotal, takeHome })
    const now = new Date().toISOString()
    setAdminConfirmed(true)
    setAdminConfirmedAt(now)
  }, [monthKey, uid])

  const confirmSalary = useCallback(async () => {
    if (!uid) return
    await salaryConfirmationService.confirmSalary(monthKey, uid)
    const now = new Date().toISOString()
    setMemberConfirmed(true)
    setMemberConfirmedAt(now)
  }, [monthKey, uid])

  return {
    adminConfirmed,
    adminConfirmedAt,
    memberConfirmed,
    memberConfirmedAt,
    loading,
    publishSalary,
    confirmSalary
  }
}
