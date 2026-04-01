import { AuthButton } from './AuthButton'

export function AdminBar({ members, membersLoading, selectedUid, currentUserUid, editMode, viewAllMode, onSelectMember, onToggleEditMode, onBackToDashboard, onExitViewAll, user, profileDisplayName, onSignOut, onChangeEmail, onChangePassword, onSetPassword }) {
  const isViewingMember = selectedUid && selectedUid !== currentUserUid

  return (
    <div className="admin-bar">
      <button className="admin-dashboard-back-btn" onClick={viewAllMode ? onExitViewAll : onBackToDashboard}>
        {viewAllMode ? '← Back' : 'Dashboard'}
      </button>
      {viewAllMode ? (
        <span className="admin-view-all-label">All Members</span>
      ) : (
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
              .filter((m) => m.uid !== currentUserUid && !m.isAdmin && !m.disabled)
              .map((member) => (
                <option key={member.uid} value={member.uid}>
                  {member.displayName || member.email}
                </option>
              ))}
          </select>
        </div>
      )}
      {isViewingMember && !viewAllMode && (
        <button
          className={`admin-edit-toggle ${editMode ? 'active' : ''}`}
          onClick={onToggleEditMode}
        >
          {editMode ? 'Editing ON' : 'Enable Edit'}
        </button>
      )}
      <AuthButton
        user={user}
        profileDisplayName={profileDisplayName}
        onSignOut={onSignOut}
        onChangeEmail={onChangeEmail}
        onChangePassword={onChangePassword}
        onSetPassword={onSetPassword}
      />
    </div>
  )
}
