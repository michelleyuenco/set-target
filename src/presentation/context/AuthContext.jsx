import { createContext, useState, useEffect } from 'react'
import { authService } from '../../infrastructure/firebase/authService'
import { adminService } from '../../infrastructure/firebase/adminService'
import { userProfileService } from '../../infrastructure/firebase/userProfileService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileDisplayName, setProfileDisplayName] = useState(null)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        // Save user profile and check admin status in parallel
        const [adminResult] = await Promise.all([
          adminService.checkIsAdmin(firebaseUser.email),
          userProfileService.saveProfile(firebaseUser).catch((err) => {
            console.error('Failed to save user profile:', err)
          })
        ])
        setIsAdmin(adminResult)
        // Fetch stored displayName from Firestore profile (may differ from Firebase Auth)
        try {
          const profile = await userProfileService.getProfile(firebaseUser.uid)
          setProfileDisplayName(profile?.displayName || null)
        } catch (err) {
          console.error('Failed to fetch user profile:', err)
        }
      } else {
        setIsAdmin(false)
        setProfileDisplayName(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signUpWithEmail = async (email, password) => {
    return authService.signUpWithEmail(email, password)
  }

  const signInWithEmail = async (email, password) => {
    return authService.signInWithEmail(email, password)
  }

  const signInWithGoogle = async () => {
    return authService.signInWithGoogle()
  }

  const signOut = async () => {
    return authService.signOut()
  }

  const changeEmail = async (currentPassword, newEmail) => {
    return authService.changeEmail(currentPassword, newEmail)
  }

  const changePassword = async (currentPassword, newPassword) => {
    return authService.changePassword(currentPassword, newPassword)
  }

  const setPassword = async (newPassword) => {
    return authService.setPassword(newPassword)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      profileDisplayName,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      changeEmail,
      changePassword,
      setPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}
