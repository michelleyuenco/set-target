import { db } from './config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const configService = {
  async getAppSettings() {
    try {
      const docSnap = await getDoc(doc(db, 'config', 'appSettings'))
      if (!docSnap.exists()) return null
      return docSnap.data()
    } catch (err) {
      console.error('Failed to fetch app settings:', err)
      return null
    }
  },

  async setWorkingMonth(year, month, adminUid) {
    try {
      const docRef = doc(db, 'config', 'appSettings')
      await setDoc(docRef, {
        workingYear: year,
        workingMonth: month,
        updatedBy: adminUid,
        updatedAt: new Date().toISOString()
      }, { merge: true })
    } catch (err) {
      console.error('Failed to save working month:', err)
      throw err
    }
  }
}
