import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from './config'

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
  }
}
