import { createContext, useState, useEffect } from 'react'
import { authAppService } from '../../di/container'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileDisplayName, setProfileDisplayName] = useState(null)

  useEffect(() => {
    const unsubscribe = authAppService.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        // Save user profile and check admin status in parallel
        const [adminResult] = await Promise.all([
          authAppService.checkIsAdmin(firebaseUser.email),
          authAppService.saveProfile(firebaseUser).catch((err) => {
            console.error('Failed to save user profile:', err)
          })
        ])
        setIsAdmin(adminResult)
        // Fetch stored displayName from Firestore profile (may differ from Firebase Auth)
        try {
          const profile = await authAppService.getProfile(firebaseUser.uid)
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
    return authAppService.signUpWithEmail(email, password)
  }

  const signInWithEmail = async (email, password) => {
    return authAppService.signInWithEmail(email, password)
  }

  const signInWithGoogle = async () => {
    return authAppService.signInWithGoogle()
  }

  const signOut = async () => {
    return authAppService.signOut()
  }

  const changeEmail = async (currentPassword, newEmail) => {
    return authAppService.changeEmail(currentPassword, newEmail)
  }

  const changePassword = async (currentPassword, newPassword) => {
    return authAppService.changePassword(currentPassword, newPassword)
  }

  const setPassword = async (newPassword) => {
    return authAppService.setPassword(newPassword)
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
