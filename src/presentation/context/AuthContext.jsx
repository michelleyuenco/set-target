import { createContext, useState, useEffect } from 'react'
import { authService } from '../../infrastructure/firebase/authService'
import { adminService } from '../../infrastructure/firebase/adminService'
import { userProfileService } from '../../infrastructure/firebase/userProfileService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
      } else {
        setIsAdmin(false)
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

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      changeEmail
    }}>
      {children}
    </AuthContext.Provider>
  )
}
