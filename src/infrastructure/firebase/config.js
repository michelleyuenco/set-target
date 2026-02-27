import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDxfdGnMKCgqnBopS1BKsOOEjKv9bb2MrY",
  authDomain: "set-target.firebaseapp.com",
  projectId: "set-target",
  storageBucket: "set-target.firebasestorage.app",
  messagingSenderId: "957384391041",
  appId: "1:957384391041:web:98430c75403ac468c95080"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
