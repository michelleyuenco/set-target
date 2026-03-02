import { db } from './config'
import { doc, setDoc, getDocs, collection } from 'firebase/firestore'

export const userProfileService = {
  async saveProfile(user) {
    const profileRef = doc(db, 'users', user.uid)
    const data = {
      email: user.email || '',
      lastLogin: new Date().toISOString()
    }
    // Only write displayName from Firebase Auth if the user actually has one,
    // so we don't overwrite an admin-set display name with an empty string
    if (user.displayName) {
      data.displayName = user.displayName
    }
    await setDoc(profileRef, data, { merge: true })
  },

  async getProfile(uid) {
    const { getDoc } = await import('firebase/firestore')
    const profileRef = doc(db, 'users', uid)
    const snap = await getDoc(profileRef)
    if (snap.exists()) {
      return snap.data()
    }
    return null
  },

  async updateEmail(uid, newEmail) {
    const profileRef = doc(db, 'users', uid)
    await setDoc(profileRef, { email: newEmail }, { merge: true })
  },

  async updateDisplayName(uid, newDisplayName) {
    const profileRef = doc(db, 'users', uid)
    await setDoc(profileRef, { displayName: newDisplayName }, { merge: true })
  },

  async setDisabled(uid, disabled) {
    const profileRef = doc(db, 'users', uid)
    await setDoc(profileRef, { disabled: !!disabled }, { merge: true })
  },

  async updateColor(uid, colorIndex) {
    const profileRef = doc(db, 'users', uid)
    await setDoc(profileRef, { colorIndex }, { merge: true })
  },

  async getAllProfiles() {
    const profiles = new Map()

    // Step 1: Get users who have profile documents
    try {
      const profileSnapshot = await getDocs(collection(db, 'users'))
      profileSnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const email = data.email || ''
        const displayName = data.displayName || ''
        const disabled = !!data.disabled
        const colorIndex = data.colorIndex ?? null
        profiles.set(docSnap.id, {
          uid: docSnap.id,
          email,
          displayName,
          disabled,
          colorIndex
        })
      })
    } catch (err) {
      console.error('Failed to query user profiles:', err)
    }

    return Array.from(profiles.values())
  }
}
