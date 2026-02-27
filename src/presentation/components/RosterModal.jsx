import { useState, useEffect } from 'react'
import { useRoster } from '../hooks/useRoster'
import { useRosterApplications } from '../hooks/useRosterApplications'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EMPTY_SHIFT = { uid: '', notes: '' }

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function RosterModal({
  isAdmin,
  currentUserUid,
  currentUserDisplayName,
  members,
  locations,
  onClose
}) {
  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth() + 1
  const nextMonthMonth = todayMonth === 12 ? 1 : todayMonth + 1
  const nextMonthYear  = todayMonth === 12 ? todayYear + 1 : todayYear

  const [rosterYear,  setRosterYear]  = useState(nextMonthYear)
  const [rosterMonth, setRosterMonth] = useState(nextMonthMonth)

  // Shared location tab state for both admin and member views
  const [activeLocation, setActiveLocation] = useState(() => locations?.[0]?.name || '')

  // Sync activeLocation when locations load after mount
  useEffect(() => {
    if (!activeLocation && locations?.length > 0) {
      setActiveLocation(locations[0].name)
    }
  }, [locations, activeLocation])

  const [selectedDay, setSelectedDay] = useState(null)
  const [assignBothMode, setAssignBothMode] = useState(false)
  const [bothForm, setBothForm] = useState({ ...EMPTY_SHIFT })
  const [dayForm, setDayForm] = useState({
    morning:   { ...EMPTY_SHIFT },
    afternoon: { ...EMPTY_SHIFT }
  })
  const [saving, setSaving] = useState(false)

  // Member cell loading state (sign-up or withdraw in progress)
  const [busyDay, setBusyDay] = useState(null)

  // Admin action state
  const [actioningAppId, setActioningAppId] = useState(null)

  const { roster, loading, myShifts, saveSlot, clearSlot } =
    useRoster(rosterYear, rosterMonth, currentUserUid)

  const {
    applications,
    applyForShifts,
    cancelApplications,
    approveApplication,
    rejectApplication
  } = useRosterApplications(rosterYear, rosterMonth, currentUserUid, isAdmin)

  // Current user's own applications (for canApply checks and own status display)
  const myApplications = applications.filter(a => a.uid === currentUserUid)

  const canGoPrev = rosterYear > todayYear || (rosterYear === todayYear && rosterMonth > todayMonth)
  const canGoNext = rosterYear < nextMonthYear || (rosterYear === nextMonthYear && rosterMonth < nextMonthMonth)

  const handlePrev = () => {
    if (!canGoPrev) return
    if (rosterMonth === 1) { setRosterYear(y => y - 1); setRosterMonth(12) }
    else { setRosterMonth(m => m - 1) }
  }

  const handleNext = () => {
    if (!canGoNext) return
    if (rosterMonth === 12) { setRosterYear(y => y + 1); setRosterMonth(1) }
    else { setRosterMonth(m => m + 1) }
  }

  const daysInMonth = new Date(rosterYear, rosterMonth, 0).getDate()
  const firstDayOfWeek = new Date(rosterYear, rosterMonth - 1, 1).getDay()

  // ---- Admin day panel ----

  const openDayPanel = (day, bothMode = false) => {
    if (!activeLocation) return
    const dayData = roster?.days?.[day] || {}
    const amSlot  = dayData.morning?.[activeLocation]
    const pmSlot  = dayData.afternoon?.[activeLocation]
    setDayForm({
      morning:   { uid: amSlot?.uid || '', notes: amSlot?.notes || '' },
      afternoon: { uid: pmSlot?.uid || '', notes: pmSlot?.notes || '' }
    })
    setAssignBothMode(bothMode)
    if (bothMode) {
      const existing = amSlot || pmSlot || {}
      setBothForm({ uid: existing.uid || '', notes: existing.notes || '' })
    }
    setSelectedDay(day)
  }

  const closeDayPanel = () => {
    setSelectedDay(null)
    setDayForm({ morning: { ...EMPTY_SHIFT }, afternoon: { ...EMPTY_SHIFT } })
    setAssignBothMode(false)
    setBothForm({ ...EMPTY_SHIFT })
  }

  const handleAssignBoth = async () => {
    if (!bothForm.uid || !selectedDay || !activeLocation) return
    const member = members.find(m => m.uid === bothForm.uid)
    if (!member) return
    setSaving(true)
    try {
      const slotData = {
        uid: bothForm.uid,
        displayName: member.displayName || member.email,
        notes: bothForm.notes
      }
      await saveSlot(selectedDay, 'morning',   activeLocation, slotData)
      await saveSlot(selectedDay, 'afternoon', activeLocation, slotData)
      closeDayPanel()
    } catch (err) {
      console.error('Failed to assign both shifts:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateShift = (shift, field, value) => {
    setDayForm(f => ({ ...f, [shift]: { ...f[shift], [field]: value } }))
  }

  const copyAmToPm = () => {
    setDayForm(f => ({ ...f, afternoon: { ...f.morning } }))
  }

  const handleSaveDay = async () => {
    if (!activeLocation) return
    setSaving(true)
    try {
      for (const shift of ['morning', 'afternoon']) {
        const form     = dayForm[shift]
        const existing = roster?.days?.[selectedDay]?.[shift]?.[activeLocation]
        if (form.uid) {
          const member = members.find(m => m.uid === form.uid)
          if (member) {
            await saveSlot(selectedDay, shift, activeLocation, {
              uid: form.uid,
              displayName: member.displayName || member.email,
              notes: form.notes
            })
          }
        } else if (existing) {
          await clearSlot(selectedDay, shift, activeLocation)
        }
      }
      closeDayPanel()
    } catch (err) {
      console.error('Failed to save day:', err)
    } finally {
      setSaving(false)
    }
  }

  // ---- Member quick sign-up ----

  const handleQuickSignUp = async (day, canAM, canPM) => {
    if (!activeLocation || (!canAM && !canPM) || busyDay) return
    setBusyDay(day)
    const shifts = canAM && canPM
      ? ['morning', 'afternoon']
      : canAM ? ['morning'] : ['afternoon']
    try {
      await applyForShifts(shifts.map(shift => ({
        uid: currentUserUid,
        displayName: currentUserDisplayName || '',
        day,
        shift,
        location: activeLocation,
        notes: ''
      })))
    } catch (err) {
      console.error('Failed to sign up:', err)
    } finally {
      setBusyDay(null)
    }
  }

  const handleWithdrawDay = async (day) => {
    if (busyDay) return
    const myDayApps = myApplications.filter(
      a => a.day === day && a.location === activeLocation && a.status === 'pending'
    )
    if (myDayApps.length === 0) return
    setBusyDay(day)
    try {
      await cancelApplications(myDayApps.map(a => a.id))
    } catch (err) {
      console.error('Failed to withdraw:', err)
    } finally {
      setBusyDay(null)
    }
  }

  // ---- Admin approve/reject ----

  const handleApproveApplication = async (app, shift) => {
    setActioningAppId(app.id)
    try {
      const slotData = {
        uid: app.uid,
        displayName: app.displayName,
        notes: app.notes
      }
      await approveApplication(app.id, slotData, app.day, shift, app.location)
    } catch (err) {
      console.error('Failed to approve application:', err)
    } finally {
      setActioningAppId(null)
    }
  }

  const handleRejectApplication = async (id) => {
    setActioningAppId(id)
    try {
      await rejectApplication(id)
    } catch (err) {
      console.error('Failed to reject application:', err)
    } finally {
      setActioningAppId(null)
    }
  }

  const getDayLabel = (day) => {
    if (!day) return ''
    return new Date(rosterYear, rosterMonth - 1, Number(day))
      .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  }

  // ---- Render helpers ----

  // Resolve display name from members array, falling back to stored name
  const resolveDisplayName = (uid, fallbackName) => {
    const member = members.find(m => m.uid === uid)
    return member?.displayName || fallbackName || '?'
  }

  // Compact day cell — renders the day's status without AM/PM breakdown
  const renderCompactDayCell = (day, amSlot, pmSlot, myAmStatus, myPmStatus) => {
    // Both assigned to me
    if (myAmStatus === 'assigned' && myPmStatus === 'assigned') {
      return <span className="roster-mine-badge">Mine ✓</span>
    }
    // Both pending — cell click handles withdrawal
    if (myAmStatus === 'pending' && myPmStatus === 'pending') {
      return (
        <span className="roster-pending-status roster-pending-indicator">
          {getInitials(currentUserDisplayName)}
        </span>
      )
    }
    // Both rejected
    if (myAmStatus === 'rejected' && myPmStatus === 'rejected') {
      return <span className="roster-rejected-status">Not selected</span>
    }

    // Collect assigned people with resolved display names
    const assigned = new Map()
    for (const slot of [amSlot, pmSlot]) {
      if (slot?.uid) assigned.set(slot.uid, resolveDisplayName(slot.uid, slot.displayName))
    }

    if (isAdmin) {
      // Admin view: show assigned names + pending applicant names
      const pendingApps = applications.filter(
        a => a.day === day && a.location === activeLocation && a.status === 'pending'
      )
      const applicants = [...new Map(pendingApps.map(a => [a.uid, a])).values()]
        .filter(a => !assigned.has(a.uid))

      const assignedNames = [...assigned.values()]
      const applicantNames = applicants.map(a => resolveDisplayName(a.uid, a.displayName))

      if (assignedNames.length === 0 && applicantNames.length === 0) {
        return <span className="roster-unassigned">—</span>
      }

      return (
        <>
          {assignedNames.length > 0 && (
            <span className="roster-initials-badge" title={assignedNames.join(', ')}>
              {assignedNames.join(', ')}
            </span>
          )}
          {applicantNames.length > 0 && (
            <span className="roster-initials-pending" title={applicantNames.join(', ')}>
              {applicantNames.join(', ')}
            </span>
          )}
        </>
      )
    }

    // Member view: show counts
    if (assigned.size > 0) {
      return (
        <span className="roster-others-badge" title={`${assigned.size} assigned`}>
          {assigned.size}
        </span>
      )
    }

    const otherApps = applications.filter(
      a => a.day === day && a.location === activeLocation
        && a.uid !== currentUserUid && a.status === 'pending'
    )
    const otherApplicants = [...new Map(otherApps.map(a => [a.uid, a])).values()]
    if (otherApplicants.length > 0) {
      return (
        <span className="roster-others-pending" title={`${otherApplicants.length} applied`}>
          {otherApplicants.length}
        </span>
      )
    }

    return <span className="roster-unassigned">—</span>
  }

  // Location tab bar — shared between admin and member views
  const renderLocationTabs = () => (
    locations?.length > 0 && (
      <div className="roster-location-tabs">
        {locations.map(l => (
          <button
            key={l.id}
            className={`roster-loc-tab${activeLocation === l.name ? ' active' : ''}`}
            onClick={() => setActiveLocation(l.name)}
          >
            {l.name}
          </button>
        ))}
      </div>
    )
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal roster-modal" onClick={e => e.stopPropagation()}>

        <div className="roster-header">
          {canGoPrev ? <button className="nav-btn" onClick={handlePrev}>&larr;</button> : <span />}
          <h2>{MONTH_NAMES[rosterMonth - 1]} {rosterYear} Roster</h2>
          {canGoNext ? <button className="nav-btn" onClick={handleNext}>&rarr;</button> : <span />}
          <button className="roster-close-btn" onClick={onClose} title="Close">&times;</button>
        </div>

        <div className="roster-content-area">
          {loading && <div className="roster-loading-overlay" />}

          {/* ── ADMIN VIEW ── */}
          {isAdmin ? (
          <>
            {renderLocationTabs()}
            <div className="roster-member-calendar-section">
              <div className="roster-weekdays">
                {WEEKDAYS.map(d => (
                  <div key={d} className="roster-weekday-header">{d}</div>
                ))}
              </div>
              <div className="roster-calendar">
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`empty-${i}`} className="roster-day-cell roster-day-empty" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNum = i + 1
                  const day = String(dayNum).padStart(2, '0')
                  const dayData = roster?.days?.[day] || {}
                  const amSlot = activeLocation ? dayData.morning?.[activeLocation] : null
                  const pmSlot = activeLocation ? dayData.afternoon?.[activeLocation] : null
                  return (
                    <div
                      key={day}
                      className="roster-day-cell roster-member-day-cell roster-admin-day-cell"
                      onClick={() => openDayPanel(day, true)}
                    >
                      <div className="roster-day-number">{dayNum}</div>
                      <div className="roster-compact-status">
                        {renderCompactDayCell(day, amSlot, pmSlot, null, null)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>

          ) : (

          /* ── MEMBER VIEW ── */
          <div className="roster-list-view">
            {renderLocationTabs()}

            {/* Member calendar — browse & apply */}
            <div className="roster-member-calendar-section">
              <div className="roster-weekdays">
                {WEEKDAYS.map(d => (
                  <div key={d} className="roster-weekday-header">{d}</div>
                ))}
              </div>
              <div className="roster-calendar">
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`empty-${i}`} className="roster-day-cell roster-day-empty" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNum = i + 1
                  const day = String(dayNum).padStart(2, '0')
                  const dayData = roster?.days?.[day] || {}
                  const today = new Date(); today.setHours(0, 0, 0, 0)
                  const isPast = new Date(rosterYear, rosterMonth - 1, dayNum) < today
                  const canApplyAM = !isPast && activeLocation
                    && !dayData.morning?.[activeLocation]
                    && !myApplications.find(
                        a => a.day === day && a.shift === 'morning' && a.location === activeLocation
                      )
                  const canApplyPM = !isPast && activeLocation
                    && !dayData.afternoon?.[activeLocation]
                    && !myApplications.find(
                        a => a.day === day && a.shift === 'afternoon' && a.location === activeLocation
                      )
                  const amSlot = activeLocation ? dayData.morning?.[activeLocation] : null
                  const pmSlot = activeLocation ? dayData.afternoon?.[activeLocation] : null
                  const myAmApp = myApplications.find(
                    a => a.day === day && a.shift === 'morning' && a.location === activeLocation
                  )
                  const myPmApp = myApplications.find(
                    a => a.day === day && a.shift === 'afternoon' && a.location === activeLocation
                  )
                  const myAmStatus = amSlot?.uid === currentUserUid ? 'assigned'
                    : myAmApp?.status || null
                  const myPmStatus = pmSlot?.uid === currentUserUid ? 'assigned'
                    : myPmApp?.status || null

                  const canApply = canApplyAM || canApplyPM
                  const isBusy = busyDay === day
                  const hasPendingApps = myApplications.some(
                    a => a.day === day && a.location === activeLocation && a.status === 'pending'
                  )

                  // Cell click: sign up if available, withdraw if pending
                  const handleCellClick = () => {
                    if (isBusy) return
                    if (canApply) return handleQuickSignUp(day, canApplyAM, canApplyPM)
                    if (hasPendingApps) return handleWithdrawDay(day)
                  }
                  const isClickable = !isBusy && (canApply || hasPendingApps)

                  return (
                    <div
                      key={day}
                      className={`roster-day-cell roster-member-day-cell${canApply ? ' roster-day-available' : ''}${hasPendingApps && !canApply ? ' roster-day-pending' : ''}${isBusy ? ' roster-day-busy' : ''}`}
                      onClick={isClickable ? handleCellClick : undefined}
                    >
                      <div className="roster-day-number">{dayNum}</div>
                      {isBusy ? (
                        <div className="roster-compact-status">
                          <span className="roster-busy-indicator">…</span>
                        </div>
                      ) : (
                        <div className="roster-compact-status">
                          {renderCompactDayCell(day, amSlot, pmSlot, myAmStatus, myPmStatus)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* My confirmed shifts list */}
            {myShifts.length > 0 && (
              <div className="roster-my-shifts-section">
                <div className="roster-section-title">My Confirmed Shifts</div>
                {myShifts.map(({ day, shift, locationName, slot }) => {
                  const dateObj = new Date(rosterYear, rosterMonth - 1, Number(day))
                  const dateLabel = dateObj.toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })
                  return (
                    <div key={`${day}-${shift}-${locationName}`} className="roster-list-item">
                      <div className="roster-list-date">{dateLabel}</div>
                      <div className={`roster-list-shift-badge ${shift}`}>
                        {shift === 'morning' ? 'AM' : 'PM'}
                      </div>
                      <div className="roster-list-location-cell">
                        <span className="roster-list-location-name">{locationName}</span>
                      </div>
                      {slot.notes && (
                        <div className="roster-list-notes">{slot.notes}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {myShifts.length === 0 && applications.length === 0 && (
              <div className="roster-empty-message">
                No confirmed shifts yet for {MONTH_NAMES[rosterMonth - 1]} {rosterYear}.
                <br />Use "Sign Up" on any shift above to join the team.
              </div>
            )}
          </div>
          )}
        </div>{/* roster-content-area */}

      </div>

      {/* ── Admin Day Assignment Panel ── */}
      {isAdmin && selectedDay && (
        <div
          className="roster-day-panel-overlay"
          onClick={e => { e.stopPropagation(); closeDayPanel() }}
        >
          <div className="roster-day-panel" onClick={e => e.stopPropagation()}>

            <div className="roster-day-panel-header">
              <div>
                <h3>{getDayLabel(selectedDay)}</h3>
                {activeLocation && (
                  <p className="roster-panel-subtitle">📍 {activeLocation}</p>
                )}
              </div>
              <button className="roster-close-btn" onClick={closeDayPanel} title="Close">
                &times;
              </button>
            </div>

            {assignBothMode ? (
              <>
                <div className="roster-quick-assign">
                  <p className="roster-quick-assign-hint">
                    Assigns the same person to both AM &amp; PM
                  </p>

                  <div className="roster-panel-field-row">
                    <label className="roster-panel-label">Member</label>
                    <select
                      className="roster-panel-select"
                      value={bothForm.uid}
                      onChange={e => setBothForm(f => ({ ...f, uid: e.target.value }))}
                    >
                      <option value="">— Select member —</option>
                      {members.map(m => (
                        <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
                      ))}
                    </select>
                  </div>

                  <div className="roster-panel-field-row">
                    <label className="roster-panel-label">Notes</label>
                    <input
                      className="roster-panel-input"
                      type="text"
                      placeholder="Optional notes..."
                      value={bothForm.notes}
                      onChange={e => setBothForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="roster-day-panel-actions">
                  <button
                    className="roster-save-btn"
                    onClick={handleAssignBoth}
                    disabled={!bothForm.uid || saving}
                  >
                    {saving ? 'Saving…' : '✓ Assign AM & PM'}
                  </button>
                  <button className="roster-cancel-btn" onClick={closeDayPanel}>Cancel</button>
                </div>

                <button
                  className="roster-mode-switch-btn"
                  onClick={() => setAssignBothMode(false)}
                >
                  Edit shifts individually →
                </button>
              </>
            ) : (
              <>
                {['morning', 'afternoon'].map(shift => {
                  const shiftApps = applications.filter(
                    a => a.day === selectedDay && a.shift === shift &&
                         a.location === activeLocation && a.status === 'pending'
                  )
                  return (
                    <div key={shift} className="roster-shift-section">
                      <div className="roster-shift-section-header">
                        <span className={`roster-shift-section-badge ${shift}`}>
                          {shift === 'morning' ? '☀️  Morning (AM)' : '🌤  Afternoon (PM)'}
                        </span>
                        {shift === 'morning' && (
                          <button
                            className="roster-copy-btn"
                            onClick={copyAmToPm}
                            disabled={!dayForm.morning.uid}
                            title="Copy AM assignment to PM"
                          >
                            Copy to PM ↓
                          </button>
                        )}
                      </div>

                      <div className="roster-panel-field-row">
                        <label className="roster-panel-label">Member</label>
                        <select
                          className="roster-panel-select"
                          value={dayForm[shift].uid}
                          onChange={e => updateShift(shift, 'uid', e.target.value)}
                        >
                          <option value="">— Unassigned —</option>
                          {members.map(m => (
                            <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
                          ))}
                        </select>
                      </div>

                      <div className="roster-panel-field-row">
                        <label className="roster-panel-label">Notes</label>
                        <input
                          className="roster-panel-input"
                          type="text"
                          placeholder="Optional notes..."
                          value={dayForm[shift].notes}
                          onChange={e => updateShift(shift, 'notes', e.target.value)}
                        />
                      </div>

                      {/* Shift sign-up requests for this location */}
                      {shiftApps.length > 0 && (
                        <div className="roster-applications-section">
                          <div className="roster-applications-header">
                            Sign-up Requests ({shiftApps.length})
                          </div>
                          {shiftApps.map(app => (
                            <div key={app.id} className="roster-application-card">
                              <div className="roster-application-info">
                                <span className="roster-application-name">{resolveDisplayName(app.uid, app.displayName)}</span>
                                {app.notes && (
                                  <span className="roster-application-notes">"{app.notes}"</span>
                                )}
                              </div>
                              <div className="roster-application-actions">
                                <button
                                  className="roster-approve-btn"
                                  onClick={() => handleApproveApplication(app, shift)}
                                  disabled={actioningAppId === app.id}
                                  title="Confirm"
                                >
                                  {actioningAppId === app.id ? '…' : '✓'}
                                </button>
                                <button
                                  className="roster-reject-btn"
                                  onClick={() => handleRejectApplication(app.id)}
                                  disabled={actioningAppId === app.id}
                                  title="Decline"
                                >
                                  ✗
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="roster-day-panel-actions">
                  <button
                    className="roster-save-btn"
                    onClick={handleSaveDay}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Day'}
                  </button>
                  <button className="roster-cancel-btn" onClick={closeDayPanel}>Cancel</button>
                </div>

                <button
                  className="roster-mode-switch-btn"
                  onClick={() => setAssignBothMode(true)}
                >
                  ← Assign both shifts to one person
                </button>
              </>
            )}

          </div>
        </div>
      )}


    </div>
  )
}
