import { db } from './config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const monthlyAdjustmentsService = {
  async getAdjustments(monthKey) {
    try {
      const docRef = doc(db, 'monthlyAdjustments', monthKey)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return null
      return docSnap.data()
    } catch (err) {
      console.error('Failed to fetch monthly adjustments:', err)
      return null
    }
  },

  async getUserAdjustments(monthKey, uid) {
    const data = await this.getAdjustments(monthKey)
    if (!data?.adjustments?.[uid]) return []
    return data.adjustments[uid].items || []
  },

  async saveUserAdjustments(monthKey, uid, items, adminUid) {
    try {
      const docRef = doc(db, 'monthlyAdjustments', monthKey)
      const docSnap = await getDoc(docRef)
      const existing = docSnap.exists() ? docSnap.data() : { adjustments: {} }

      existing.adjustments[uid] = {
        items,
        updatedAt: new Date().toISOString(),
        updatedBy: adminUid
      }
      existing.updatedAt = new Date().toISOString()

      await setDoc(docRef, existing)
    } catch (err) {
      console.error('Failed to save monthly adjustments:', err)
      throw err
    }
  }
}
