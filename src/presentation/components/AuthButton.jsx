import { useState, useRef, useEffect } from 'react'

export function AuthButton({ user, profileDisplayName, onSignInClick, onSignOut, onChangeEmail, onChangePassword, onSetPassword, onSetLocations }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isEmailUser = user?.providerData?.some(p => p.providerId === 'password')
  const isGoogleOnlyUser = !isEmailUser && user?.providerData?.some(p => p.providerId === 'google.com')

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  if (!user) {
    return (
      <button className="auth-btn sign-in-btn" onClick={onSignInClick}>
        Sign In
      </button>
    )
  }

  return (
    <div className="auth-menu-wrapper" ref={menuRef}>
      <button
        className="auth-btn auth-menu-trigger"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {profileDisplayName || user.displayName || user.email}
      </button>
      {menuOpen && (
        <div className="auth-menu-dropdown">
          {onSetLocations && (
            <button className="auth-menu-item" onClick={() => { setMenuOpen(false); onSetLocations() }}>
              Set Locations
            </button>
          )}
          {isEmailUser && (
            <>
              <button className="auth-menu-item" onClick={() => { setMenuOpen(false); onChangeEmail() }}>
                Change Email
              </button>
              <button className="auth-menu-item" onClick={() => { setMenuOpen(false); onChangePassword() }}>
                Change Password
              </button>
            </>
          )}
          {isGoogleOnlyUser && (
            <button className="auth-menu-item" onClick={() => { setMenuOpen(false); onSetPassword() }}>
              Set Password
            </button>
          )}
          <button className="auth-menu-item auth-menu-signout" onClick={() => { setMenuOpen(false); onSignOut() }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
