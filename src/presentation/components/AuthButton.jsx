export function AuthButton({ user, onSignInClick, onSignOut, onChangeEmail }) {
  const isEmailUser = user?.providerData?.some(p => p.providerId === 'password')

  if (user) {
    return (
      <div className="auth-button-group">
        <span className="auth-user-email">{user.email}</span>
        {isEmailUser && (
          <button className="auth-btn change-email-btn" onClick={onChangeEmail}>
            Change Email
          </button>
        )}
        <button className="auth-btn sign-out-btn" onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button className="auth-btn sign-in-btn" onClick={onSignInClick}>
      Sign In
    </button>
  )
}
