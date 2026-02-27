import { useState, useEffect, useCallback } from 'react'
import { userProfileService } from '../../infrastructure/firebase/userProfileService'
import { adminService } from '../../infrastructure/firebase/adminService'

export function useAdminMembers(isAdmin) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      setMembers([])
      return
    }

    setLoading(true)
    Promise.all([
      userProfileService.getAllProfiles(),
      adminService.getAdminEmails()
    ])
      .then(([profiles, adminEmails]) => {
        const enriched = profiles.map((p) => ({
          ...p,
          isAdmin: adminEmails.includes(p.email)
        }))
        setMembers(enriched)
      })
      .catch((err) => {
        console.error('Failed to load members:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isAdmin])

  const updateMemberDisplayName = useCallback(async (uid, newDisplayName) => {
    await userProfileService.updateDisplayName(uid, newDisplayName)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, displayName: newDisplayName } : m)
    )
  }, [])

  return { members, loading, updateMemberDisplayName }
}
