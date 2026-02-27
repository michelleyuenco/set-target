import { db } from './config'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { Goal } from '../../domain/entities/Goal'

export const teamBonusService = {
  async getTeamBonus(monthKey) {
    try {
      const docRef = doc(db, 'teamBonus', monthKey)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return null
      return docSnap.data()
    } catch (err) {
      console.error('Failed to fetch team bonus:', err)
      return null
    }
  },

  async saveTeamBonus(monthKey, data) {
    try {
      const docRef = doc(db, 'teamBonus', monthKey)
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to save team bonus:', err)
      throw err
    }
  },

  async getMemberMonthlyHours(uid, year, month) {
    try {
      const goalsRef = collection(db, 'users', uid, 'goals')
      const snapshot = await getDocs(goalsRef)
      const pad = (n) => String(n).padStart(2, '0')
      const monthPrefix = `${year}-${pad(month + 1)}`
      let totalHours = 0

      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data._deleted) return
        if (!data.day || !data.day.startsWith(monthPrefix)) return

        const goal = Goal.fromJSON(data)
        if (goal.morningConfirmed) {
          totalHours += goal.morningShiftHours
        }
        if (goal.afternoonConfirmed) {
          totalHours += goal.afternoonShiftHours
        }
      })

      return Math.round(totalHours * 100) / 100
    } catch (err) {
      console.error(`Failed to fetch hours for member ${uid}:`, err)
      return 0
    }
  },

  async getAllMembersMonthlyHours(members, year, month) {
    const results = await Promise.all(
      members.map(async (member) => {
        const hours = await this.getMemberMonthlyHours(member.uid, year, month)
        return {
          uid: member.uid,
          displayName: member.displayName || member.email || `Member (${member.uid.slice(0, 8)})`,
          hours
        }
      })
    )
    return results
  },

  // Returns location-grouped performance stats for all members for a month.
  // month is 0-based (same convention as getMemberMonthlyHours).
  // Result shape: { [locationName]: { totalActual, totalTarget, shiftCount, members: [...] } }
  async getAllMembersLocationStats(members, year, month) {
    const pad = (n) => String(n).padStart(2, '0')
    const monthPrefix = `${year}-${pad(month + 1)}`
    const locationMap = {}

    await Promise.all(
      members.map(async (member) => {
        try {
          const goalsRef = collection(db, 'users', member.uid, 'goals')
          const snapshot = await getDocs(goalsRef)
          const displayName = member.displayName || member.email || `Member (${member.uid.slice(0, 8)})`

          snapshot.forEach((docSnap) => {
            const data = docSnap.data()
            if (data._deleted) return
            if (!data.day || !data.day.startsWith(monthPrefix)) return

            const goal = Goal.fromJSON(data)

            for (const shift of ['morning', 'afternoon']) {
              const userConfirmed = shift === 'morning' ? goal.morningConfirmed : goal.afternoonConfirmed
              if (!userConfirmed) continue

              // Use admin-assigned location when available, otherwise bucket as unset
              const adminConfirmed = shift === 'morning' ? goal.morningAdminConfirmed : goal.afternoonAdminConfirmed
              const rawLocation = adminConfirmed ? (shift === 'morning' ? goal.morningLocation : goal.afternoonLocation) : null
              const locationKey = rawLocation || '(No Location)'

              const actual = (shift === 'morning' ? goal.morningActual : goal.afternoonActual) || 0
              const target = (shift === 'morning' ? goal.morningAmount : goal.afternoonAmount) || 0

              if (!locationMap[locationKey]) {
                locationMap[locationKey] = { totalActual: 0, totalTarget: 0, shiftCount: 0, members: {} }
              }
              const loc = locationMap[locationKey]
              loc.totalActual += actual
              loc.totalTarget += target
              loc.shiftCount += 1

              if (!loc.members[member.uid]) {
                loc.members[member.uid] = { uid: member.uid, displayName, shifts: [] }
              }
              loc.members[member.uid].shifts.push({ date: goal.day, shift, actual, target })
            }
          })
        } catch (err) {
          console.error(`Failed to fetch location stats for member ${member.uid}:`, err)
        }
      })
    )

    // Round totals and convert members map to array
    for (const loc of Object.values(locationMap)) {
      loc.totalActual = Math.round(loc.totalActual * 100) / 100
      loc.totalTarget = Math.round(loc.totalTarget * 100) / 100
      loc.members = Object.values(loc.members)
        .map(m => ({
          ...m,
          totalActual: Math.round(m.shifts.reduce((s, sh) => s + sh.actual, 0) * 100) / 100,
          totalTarget: Math.round(m.shifts.reduce((s, sh) => s + sh.target, 0) * 100) / 100
        }))
        .sort((a, b) => b.totalActual - a.totalActual)
    }

    return locationMap
  }
}
