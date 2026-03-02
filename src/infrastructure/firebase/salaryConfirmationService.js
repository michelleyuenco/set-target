import { db } from './config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const salaryConfirmationService = {
  async getConfirmation(monthKey, uid) {
    try {
      const docRef = doc(db, 'salaryConfirmations', monthKey)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return null
      return docSnap.data()?.[uid] || null
    } catch (err) {
      console.error('Failed to fetch salary confirmation:', err)
      return null
    }
  },

  async getAllConfirmations(monthKey) {
    try {
      const docRef = doc(db, 'salaryConfirmations', monthKey)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return {}
      return docSnap.data() || {}
    } catch (err) {
      console.error('Failed to fetch all salary confirmations:', err)
      return {}
    }
  },

  async publishSalary(monthKey, uid, adminUid, data) {
    try {
      const docRef = doc(db, 'salaryConfirmations', monthKey)
      const docSnap = await getDoc(docRef)
      const existing = docSnap.exists() ? docSnap.data()?.[uid] || {} : {}
      await setDoc(docRef, {
        [uid]: {
          ...existing,
          adminConfirmedAt: new Date().toISOString(),
          adminConfirmedBy: adminUid,
          grossTotal: data.grossTotal,
          takeHome: data.takeHome
        }
      }, { merge: true })
    } catch (err) {
      console.error('Failed to publish salary:', err)
      throw err
    }
  },

  async confirmSalary(monthKey, uid) {
    try {
      const docRef = doc(db, 'salaryConfirmations', monthKey)
      const docSnap = await getDoc(docRef)
      const existing = docSnap.exists() ? docSnap.data()?.[uid] || {} : {}
      await setDoc(docRef, {
        [uid]: {
          ...existing,
          memberConfirmedAt: new Date().toISOString()
        }
      }, { merge: true })
    } catch (err) {
      console.error('Failed to confirm salary:', err)
      throw err
    }
  }
}
