import { useState } from 'react'

export function ChangePasswordModal({ mode = 'change', onChangePassword, onSetPassword, onClose }) {
  const isSetMode = mode === 'set'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!isSetMode && newPassword === currentPassword) {
      setError('New password must be different from your current password')
      return
    }

    setLoading(true)
    try {
      if (isSetMode) {
        await onSetPassword(newPassword)
      } else {
        await onChangePassword(currentPassword, newPassword)
      }
      setSuccess(true)
    } catch (err) {
      const code = err.code || ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect current password')
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters')
      } else if (code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in before changing your password')
      } else if (code === 'auth/provider-already-linked') {
        setError('A password is already set for this account')
      } else {
        setError(err.message || 'An error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal login-modal" onClick={e => e.stopPropagation()}>
        <h2 className="change-email-title">{isSetMode ? 'Set Password' : 'Change Password'}</h2>

        {success ? (
          <div className="change-email-success">
            <p>Your password has been {isSetMode ? 'set' : 'updated'} successfully.</p>
            <p className="change-email-hint">You can now sign in with your email and this password.</p>
            <div className="button-group">
              <button className="save-btn" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {!isSetMode && (
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter current password"
                />
              </div>
            )}

            <div className="form-group">
              <label>{isSetMode ? 'Password' : 'New Password'}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Re-enter password"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="button-group">
              <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? (isSetMode ? 'Setting...' : 'Updating...') : (isSetMode ? 'Set Password' : 'Update Password')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
