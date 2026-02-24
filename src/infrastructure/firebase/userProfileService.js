import { db } from './config'
import { doc, setDoc, getDocs, collection, collectionGroup } from 'firebase/firestore'

export const userProfileService = {
  async saveProfile(user) {
    const profileRef = doc(db, 'users', user.uid)
    await setDoc(profileRef, {
      email: user.email || '',
      displayName: user.displayName || '',
      lastLogin: new Date().toISOString()
    }, { merge: true })
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
        profiles.set(docSnap.id, {
          uid: docSnap.id,
          email,
          displayName: displayName || email || `Member (${docSnap.id.slice(0, 8)})`
        })
      })
    } catch (err) {
      console.error('Failed to query user profiles:', err)
    }

    // Step 2: Discover additional users via their goals (for users without profile docs)
    try {
      const goalsSnapshot = await getDocs(collectionGroup(db, 'goals'))
      goalsSnapshot.forEach((docSnap) => {
        const userRef = docSnap.ref.parent.parent
        if (userRef && !profiles.has(userRef.id)) {
          profiles.set(userRef.id, {
            uid: userRef.id,
            email: '',
            displayName: `Member (${userRef.id.slice(0, 8)})`
          })
        }
      })
    } catch (err) {
      console.error('Failed to query goals for user discovery:', err)
    }

    return Array.from(profiles.values())
  }
}
