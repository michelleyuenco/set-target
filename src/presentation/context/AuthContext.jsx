import { createContext, useState, useEffect } from 'react'
import { authService } from '../../infrastructure/firebase/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser)
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

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}
