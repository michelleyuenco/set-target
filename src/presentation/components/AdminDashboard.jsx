import { useState } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function AdminDashboard({
  members,
  membersLoading,
  currentUserUid,
  onSelectMember,
  onTeamBonus,
  onManageLocations,
  onManageMembers,
  onOpenRoster,
  onLocationPerformance,
  onLocationCalendar,
  workingMonth,
  workingYear,
  currentMonth,
  currentYear,
  onSaveWorkingMonth,
}) {
  const teamMembers = members.filter((m) => m.uid !== currentUserUid && !m.isAdmin && !m.disabled)

  const [pickerYear, setPickerYear] = useState(workingYear ?? currentYear)
  const [pickerMonth, setPickerMonth] = useState(workingMonth ?? currentMonth)
  const [saving, setSaving] = useState(false)

  const pickerIsCurrentMonth = pickerYear === currentYear && pickerMonth === currentMonth

  const handlePickerPrev = () => {
    const pm = pickerMonth === 0 ? 11 : pickerMonth - 1
    const py = pickerMonth === 0 ? pickerYear - 1 : pickerYear
    setPickerYear(py)
    setPickerMonth(pm)
  }

  const handlePickerNext = () => {
    if (pickerIsCurrentMonth) return
    const nm = pickerMonth === 11 ? 0 : pickerMonth + 1
    const ny = pickerMonth === 11 ? pickerYear + 1 : pickerYear
    setPickerYear(ny)
    setPickerMonth(nm)
  }

  const handleSetWorkingMonth = async () => {
    setSaving(true)
    try {
      await onSaveWorkingMonth(pickerYear, pickerMonth)
    } catch (err) {
      console.error('Failed to save working month:', err)
    } finally {
      setSaving(false)
    }
  }

  const isAlreadySet = pickerYear === workingYear && pickerMonth === workingMonth

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <span className="admin-dashboard-badge">Admin Dashboard</span>
      </div>

      <div className="admin-dashboard-actions">
        <button className="admin-action-btn" onClick={onManageMembers}>
          <span className="action-icon">&#128101;</span>
          <span className="action-label">Members</span>
        </button>
        <button className="admin-action-btn" onClick={onOpenRoster}>
          <span className="action-icon">&#128197;</span>
          <span className="action-label">Roster</span>
        </button>
        <button className="admin-action-btn" onClick={onManageLocations}>
          <span className="action-icon">&#128205;</span>
          <span className="action-label">Locations</span>
        </button>
        <button className="admin-action-btn" onClick={onTeamBonus}>
          <span className="action-icon">&#128176;</span>
          <span className="action-label">Team Bonus</span>
        </button>
        <button className="admin-action-btn" onClick={onLocationPerformance}>
          <span className="action-icon">&#128200;</span>
          <span className="action-label">Performance</span>
        </button>
        <button className="admin-action-btn" onClick={onLocationCalendar}>
          <span className="action-icon">&#128205;</span>
          <span className="action-label">Loc Calendar</span>
        </button>
      </div>

      <div className="admin-dashboard-working-month">
        <h3 className="dashboard-section-title">Working Month</h3>
        <div className="working-month-picker">
          <button className="nav-btn" onClick={handlePickerPrev}>&larr;</button>
          <span className="working-month-label">
            {MONTH_NAMES[pickerMonth]} {pickerYear}
          </span>
          <button className="nav-btn" onClick={handlePickerNext} disabled={pickerIsCurrentMonth}>&rarr;</button>
          <button
            className="working-month-set-btn"
            onClick={handleSetWorkingMonth}
            disabled={saving || isAlreadySet}
          >
            {saving ? 'Saving...' : 'Set'}
          </button>
        </div>
        {workingMonth !== null && workingMonth !== undefined && (
          <div className="working-month-current">
            Currently set to: {MONTH_NAMES[workingMonth]} {workingYear}
          </div>
        )}
      </div>

      <div className="admin-dashboard-members">
        <h3 className="dashboard-section-title">Team Members</h3>
        {membersLoading ? (
          <div className="dashboard-loading">Loading members...</div>
        ) : teamMembers.length === 0 ? (
          <div className="dashboard-empty">No team members found</div>
        ) : (
          <div className="dashboard-member-list">
            {teamMembers.map((member) => (
              <button
                key={member.uid}
                className="dashboard-member-item"
                onClick={() => onSelectMember(member.uid)}
              >
                <span className="dashboard-member-avatar">
                  {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
                </span>
                <span className="dashboard-member-info">
                  <span className="dashboard-member-name">
                    {member.displayName || member.email}
                  </span>
                  {member.displayName && (
                    <span className="dashboard-member-email">{member.email}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
