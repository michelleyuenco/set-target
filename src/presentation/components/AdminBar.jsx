export function AdminBar({ members, membersLoading, selectedUid, currentUserUid, editMode, onSelectMember, onToggleEditMode, onBackToDashboard }) {
  const isViewingMember = selectedUid && selectedUid !== currentUserUid

  return (
    <div className="admin-bar">
      <button className="admin-dashboard-back-btn" onClick={onBackToDashboard}>
        Dashboard
      </button>
      <div className="admin-member-select-wrapper">
        <label className="admin-select-label">View as:</label>
        <select
          className="admin-member-select"
          value={selectedUid || ''}
          onChange={(e) => {
            const uid = e.target.value
            if (!uid) {
              onBackToDashboard()
            } else {
              onSelectMember(uid)
            }
          }}
          disabled={membersLoading}
        >
          <option value="">Select member...</option>
          {members
            .filter((m) => m.uid !== currentUserUid && !m.isAdmin)
            .map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.displayName || member.email}
              </option>
            ))}
        </select>
      </div>
      {isViewingMember && (
        <button
          className={`admin-edit-toggle ${editMode ? 'active' : ''}`}
          onClick={onToggleEditMode}
        >
          {editMode ? 'Editing ON' : 'Enable Edit'}
        </button>
      )}
    </div>
  )
}
