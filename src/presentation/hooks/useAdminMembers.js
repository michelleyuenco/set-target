import { useState, useEffect, useCallback } from 'react'
import { userProfileService } from '../../infrastructure/firebase/userProfileService'
import { adminService } from '../../infrastructure/firebase/adminService'

export function useAdminMembers(isAdmin, isAuthenticated = false) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin && !isAuthenticated) {
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
  }, [isAdmin, isAuthenticated])

  const updateMemberDisplayName = useCallback(async (uid, newDisplayName) => {
    await userProfileService.updateDisplayName(uid, newDisplayName)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, displayName: newDisplayName } : m)
    )
  }, [])

  const toggleMemberDisabled = useCallback(async (uid, disabled) => {
    await userProfileService.setDisabled(uid, disabled)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, disabled } : m)
    )
  }, [])

  const updateMemberColor = useCallback(async (uid, colorIndex) => {
    await userProfileService.updateColor(uid, colorIndex)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, colorIndex } : m)
    )
  }, [])

  const updateMemberEmail = useCallback(async (uid, newEmail) => {
    await userProfileService.updateEmail(uid, newEmail)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, email: newEmail } : m)
    )
  }, [])

  return { members, loading, updateMemberDisplayName, toggleMemberDisabled, updateMemberColor, updateMemberEmail }
}
