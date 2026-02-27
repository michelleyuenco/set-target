import { useState } from 'react'

export function ChangeEmailModal({ currentEmail, onChangeEmail, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newEmail !== confirmEmail) {
      setError('Email addresses do not match')
      return
    }
    if (newEmail === currentEmail) {
      setError('New email must be different from your current email')
      return
    }

    setLoading(true)
    try {
      await onChangeEmail(currentPassword, newEmail)
      setSuccess(true)
    } catch (err) {
      const code = err.code || ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect password')
      } else if (code === 'auth/email-already-in-use') {
        setError('This email is already in use by another account')
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in before changing your email')
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
        <h2 className="change-email-title">Change Email</h2>

        {success ? (
          <div className="change-email-success">
            <p>Your email has been updated to <strong>{newEmail}</strong>.</p>
            <div className="button-group">
              <button className="save-btn" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Current Email</label>
              <input type="email" value={currentEmail} disabled />
            </div>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your password"
              />
            </div>

            <div className="form-group">
              <label>New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="new@email.com"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Email</label>
              <input
                type="email"
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="new@email.com"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="button-group">
              <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
