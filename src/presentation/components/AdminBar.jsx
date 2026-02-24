export function AdminBar({ members, membersLoading, selectedUid, currentUserUid, editMode, onSelectMember, onBackToMyData, onToggleEditMode, onTeamBonus }) {
  const isViewingMember = selectedUid && selectedUid !== currentUserUid

  return (
    <div className="admin-bar">
      <div className="admin-badge">Admin</div>
      <div className="admin-member-select-wrapper">
        <label className="admin-select-label">View as:</label>
        <select
          className="admin-member-select"
          value={selectedUid || ''}
          onChange={(e) => {
            const uid = e.target.value
            if (!uid || uid === currentUserUid) {
              onBackToMyData()
            } else {
              onSelectMember(uid)
            }
          }}
          disabled={membersLoading}
        >
          <option value="">My Data</option>
          {members
            .filter((m) => m.uid !== currentUserUid)
            .map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.displayName || member.email}
              </option>
            ))}
        </select>
      </div>
      {isViewingMember && (
        <>
          <button
            className={`admin-edit-toggle ${editMode ? 'active' : ''}`}
            onClick={onToggleEditMode}
          >
            {editMode ? 'Editing ON' : 'Enable Edit'}
          </button>
          <button className="back-to-my-data-btn" onClick={onBackToMyData}>
            Back to My Data
          </button>
        </>
      )}
      <button className="team-bonus-btn" onClick={onTeamBonus}>
        Team Bonus
      </button>
    </div>
  )
}
