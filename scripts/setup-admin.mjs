/**
 * One-time setup script to create the config/admins document in Firestore.
 * Run with: node scripts/setup-admin.mjs
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDxfdGnMKCgqnBopS1BKsOOEjKv9bb2MrY",
  authDomain: "set-target.firebaseapp.com",
  projectId: "set-target",
  storageBucket: "set-target.firebasestorage.app",
  messagingSenderId: "957384391041",
  appId: "1:957384391041:web:98430c75403ac468c95080"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const ADMIN_EMAILS = [
  'michelleyuenco@gmail.com'
]

async function setupAdmins() {
  console.log('Setting up admin config document...')
  console.log('Admin emails:', ADMIN_EMAILS)

  try {
    await setDoc(doc(db, 'config', 'admins'), {
      emails: ADMIN_EMAILS
    })
    console.log('Successfully created config/admins document!')
    console.log('Done.')
    process.exit(0)
  } catch (err) {
    console.error('Failed to create admin config:', err.message)
    console.log('\nIf this failed due to permissions, you can manually create the document:')
    console.log('1. Go to https://console.firebase.google.com/project/set-target/firestore')
    console.log('2. Create collection "config", document "admins"')
    console.log('3. Add field "emails" (array) with value:', ADMIN_EMAILS)
    process.exit(1)
  }
}

setupAdmins()
