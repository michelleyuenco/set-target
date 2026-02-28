import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth'
import { auth } from './config'
import { userProfileService } from './userProfileService'

const googleProvider = new GoogleAuthProvider()

export const authService = {
  signUpWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  },

  signInWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  },

  signInWithGoogle() {
    return signInWithPopup(auth, googleProvider)
  },

  signOut() {
    return signOut(auth)
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  },

  async changeEmail(currentPassword, newEmail) {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')

    const isEmailProvider = user.providerData.some(p => p.providerId === 'password')
    if (!isEmailProvider) {
      throw new Error('Email change is not available for accounts signed in with Google')
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updateEmail(user, newEmail)
    await userProfileService.updateEmail(user.uid, newEmail)
  },

  async changePassword(currentPassword, newPassword) {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')

    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
  },

  async setPassword(newPassword) {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')

    const credential = EmailAuthProvider.credential(user.email, newPassword)
    await linkWithCredential(user, credential)
  }
}
