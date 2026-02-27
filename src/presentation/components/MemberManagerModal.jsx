import { useState } from 'react'

export function MemberManagerModal({ members, onUpdateDisplayName, onClose }) {
  const [editingUid, setEditingUid] = useState(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const nonAdminMembers = members.filter((m) => !m.isAdmin)

  const startEdit = (member) => {
    setEditingUid(member.uid)
    setDraft(member.displayName || '')
  }

  const cancelEdit = () => {
    setEditingUid(null)
    setDraft('')
  }

  const handleSave = async () => {
    if (!editingUid || !draft.trim()) return
    setSaving(true)
    try {
      await onUpdateDisplayName(editingUid, draft.trim())
      setEditingUid(null)
      setDraft('')
    } catch (err) {
      console.error('Failed to update display name:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') cancelEdit()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal member-manager-modal" onClick={e => e.stopPropagation()}>
        <h2>Manage Members</h2>

        <div className="member-manager-list">
          {nonAdminMembers.length === 0 && (
            <div className="member-manager-empty">No members found</div>
          )}
          {nonAdminMembers.map((member) => (
            <div key={member.uid} className="member-manager-item">
              {editingUid === member.uid ? (
                <div className="member-manager-edit-row">
                  <input
                    className="member-manager-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                    autoFocus
                    placeholder="Display name"
                  />
                  <button
                    className="member-manager-save-btn"
                    onClick={handleSave}
                    disabled={saving || !draft.trim()}
                    title="Save"
                  >
                    {saving ? '...' : '\u2713'}
                  </button>
                  <button
                    className="member-manager-cancel-btn"
                    onClick={cancelEdit}
                    disabled={saving}
                    title="Cancel"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div className="member-manager-row">
                  <div className="member-manager-info">
                    <span className="member-manager-name">
                      {member.displayName || <span className="member-manager-no-name">No name set</span>}
                    </span>
                    <span className="member-manager-email">{member.email}</span>
                  </div>
                  <button
                    className="member-manager-edit-btn"
                    onClick={() => startEdit(member)}
                    title="Edit display name"
                  >
                    &#9998;
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
