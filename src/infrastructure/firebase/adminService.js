import { db } from './config'
import { doc, getDoc } from 'firebase/firestore'

export const adminService = {
  async checkIsAdmin(email) {
    if (!email) return false
    try {
      const adminsDoc = await getDoc(doc(db, 'config', 'admins'))
      if (!adminsDoc.exists()) return false
      const data = adminsDoc.data()
      const emails = data.emails || []
      return emails.includes(email)
    } catch (err) {
      console.error('Admin check failed:', err)
      return false
    }
  }
}
