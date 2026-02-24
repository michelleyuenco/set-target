import { useState, useEffect } from 'react'
import { userProfileService } from '../../infrastructure/firebase/userProfileService'

export function useAdminMembers(isAdmin) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      setMembers([])
      return
    }

    setLoading(true)
    userProfileService.getAllProfiles()
      .then((profiles) => {
        setMembers(profiles)
      })
      .catch((err) => {
        console.error('Failed to load members:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isAdmin])

  return { members, loading }
}
