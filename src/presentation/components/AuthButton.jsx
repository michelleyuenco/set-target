export function AuthButton({ user, onSignInClick, onSignOut }) {
  if (user) {
    return (
      <div className="auth-button-group">
        <span className="auth-user-email">{user.email}</span>
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
