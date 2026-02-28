import { useState, useCallback } from 'react'
import { memberEarningsService } from '../../infrastructure/firebase/memberEarningsService'

export function useMemberEarnings() {
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadEarnings = useCallback(async (members) => {
    if (!members || members.length === 0) return
    setLoading(true)
    try {
      const now = new Date()
      const monthSpecs = []
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        monthSpecs.push({ year: d.getFullYear(), month: d.getMonth() })
      }
      const data = await memberEarningsService.getMembersEffectiveWages(members, monthSpecs)
      setEarnings(data)
    } catch (err) {
      console.error('Failed to load member earnings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { earnings, loading, loadEarnings }
}
