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
  }
}
