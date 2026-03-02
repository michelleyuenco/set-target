import { useState } from 'react'
import { MEMBER_COLORS, getMemberColor } from '../utils/memberColors'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function MemberManagerModal({ members, onUpdateDisplayName, onUpdateEmail, onUpdateColor, onToggleDisabled, earnings, earningsLoading, onClose }) {
  const [editingUid, setEditingUid] = useState(null)
  const [editingField, setEditingField] = useState(null) // 'name' or 'email'
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDisableUid, setConfirmDisableUid] = useState(null)
  const [toggling, setToggling] = useState(false)

  const nonAdminMembers = members.filter((m) => !m.isAdmin)
  const activeMembers = nonAdminMembers.filter((m) => !m.disabled)
  const disabledMembers = nonAdminMembers.filter((m) => m.disabled)

  const startEdit = (member, field = 'name') => {
    setEditingUid(member.uid)
    setEditingField(field)
    setDraft(field === 'email' ? (member.email || '') : (member.displayName || ''))
  }

  const cancelEdit = () => {
    setEditingUid(null)
    setEditingField(null)
    setDraft('')
  }

  const handleSave = async () => {
    if (!editingUid || !draft.trim()) return
    setSaving(true)
    try {
      if (editingField === 'email') {
        await onUpdateEmail(editingUid, draft.trim())
      } else {
        await onUpdateDisplayName(editingUid, draft.trim())
      }
      setEditingUid(null)
      setEditingField(null)
      setDraft('')
    } catch (err) {
      console.error(`Failed to update ${editingField}:`, err)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') cancelEdit()
  }

  const handleToggleDisabled = async (uid, disabled) => {
    setToggling(true)
    try {
      await onToggleDisabled(uid, disabled)
      setConfirmDisableUid(null)
    } catch (err) {
      console.error('Failed to toggle member:', err)
    } finally {
      setToggling(false)
    }
  }

  const renderWages = (uid) => {
    if (earningsLoading) return <div className="member-wages-loading">Loading wages...</div>
    if (!earnings || !earnings[uid]) return null

    const monthEntries = Object.entries(earnings[uid])
      .sort(([a], [b]) => b.localeCompare(a))

    if (monthEntries.length === 0) return null

    return (
      <div className="member-wages-row">
        {monthEntries.map(([monthKey, data]) => {
          const m = parseInt(monthKey.split('-')[1], 10)
          const label = MONTH_SHORT[m - 1]
          const wage = data.effectiveHourlyWage
          const noData = wage === null
          return (
            <div key={monthKey} className={`member-wage-pill ${noData ? 'no-data' : ''}`}>
              <span className="member-wage-value">{noData ? '--' : `$${wage.toFixed(0)}`}</span>
              <span className="member-wage-month">{label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMember = (member) => (
    <div key={member.uid} className={`member-manager-item ${member.disabled ? 'disabled' : ''}`}>
      {editingUid === member.uid ? (
        <div className="member-manager-edit-row">
          <input
            className="member-manager-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            autoFocus
            placeholder={editingField === 'email' ? 'Email address' : 'Display name'}
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
        <>
          <div className="member-manager-row">
            <div className="member-manager-info">
              <span className="member-manager-name">
                {member.displayName || <span className="member-manager-no-name">No name set</span>}
                {member.disabled && <span className="member-disabled-badge">Disabled</span>}
              </span>
              <span className="member-manager-email">{member.email}</span>
            </div>
            <div className="member-manager-edit-btns">
              <button
                className="member-manager-edit-btn"
                onClick={() => startEdit(member, 'name')}
                title="Edit display name"
              >
                &#9998;
              </button>
              <button
                className="member-manager-edit-btn member-manager-edit-email-btn"
                onClick={() => startEdit(member, 'email')}
                title="Edit email"
              >
                &#9993;
              </button>
            </div>
          </div>

          <div className="member-color-picker">
            {MEMBER_COLORS.map((c, i) => {
              const current = getMemberColor(member.uid, member.colorIndex)
              const isSelected = c.bg === current.bg && c.text === current.text
              return (
                <button
                  key={i}
                  className={`member-color-dot ${isSelected ? 'selected' : ''}`}
                  style={{ background: c.bg, borderColor: c.text }}
                  onClick={() => onUpdateColor(member.uid, i)}
                  title={`Color ${i + 1}`}
                />
              )
            })}
          </div>

          {renderWages(member.uid)}

          {member.disabled ? (
            <div className="member-manager-actions">
              <button
                className="member-enable-btn"
                onClick={() => handleToggleDisabled(member.uid, false)}
                disabled={toggling}
              >
                {toggling ? '...' : 'Enable Member'}
              </button>
            </div>
          ) : confirmDisableUid === member.uid ? (
            <div className="member-disable-confirm">
              <span>Hide from team lists?</span>
              <button
                className="member-disable-confirm-cancel"
                onClick={() => setConfirmDisableUid(null)}
                disabled={toggling}
              >
                Cancel
              </button>
              <button
                className="member-disable-confirm-btn"
                onClick={() => handleToggleDisabled(member.uid, true)}
                disabled={toggling}
              >
                {toggling ? '...' : 'Confirm'}
              </button>
            </div>
          ) : (
            <div className="member-manager-actions">
              <button
                className="member-disable-btn"
                onClick={() => setConfirmDisableUid(member.uid)}
              >
                Disable Member
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal member-manager-modal" onClick={e => e.stopPropagation()}>
        <h2>Manage Members</h2>

        <div className="member-manager-list">
          {activeMembers.length === 0 && disabledMembers.length === 0 && (
            <div className="member-manager-empty">No members found</div>
          )}
          {activeMembers.map(renderMember)}

          {disabledMembers.length > 0 && (
            <>
              <div className="member-manager-section-title">Disabled</div>
              {disabledMembers.map(renderMember)}
            </>
          )}
        </div>

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
