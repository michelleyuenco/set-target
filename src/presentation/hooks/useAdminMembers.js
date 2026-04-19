import { useState, useEffect, useCallback } from 'react'
import { memberService } from '../../di/container'

export function useAdminMembers(isAdmin, isAuthenticated = false) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin && !isAuthenticated) {
      setMembers([])
      return
    }

    setLoading(true)
    memberService.getAllMembers()
      .then((enriched) => {
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
    await memberService.updateDisplayName(uid, newDisplayName)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, displayName: newDisplayName } : m)
    )
  }, [])

  const toggleMemberDisabled = useCallback(async (uid, disabled) => {
    await memberService.setDisabled(uid, disabled)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, disabled } : m)
    )
  }, [])

  const updateMemberColor = useCallback(async (uid, colorIndex) => {
    await memberService.updateColor(uid, colorIndex)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, colorIndex } : m)
    )
  }, [])

  const updateMemberEmail = useCallback(async (uid, newEmail) => {
    await memberService.updateEmail(uid, newEmail)
    setMembers((prev) =>
      prev.map((m) => m.uid === uid ? { ...m, email: newEmail } : m)
    )
  }, [])

  return { members, loading, updateMemberDisplayName, toggleMemberDisabled, updateMemberColor, updateMemberEmail }
}
