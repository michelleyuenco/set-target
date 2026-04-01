import { useState, useEffect } from 'react'
import { useRoster } from '../hooks/useRoster'
import { useRosterApplications } from '../hooks/useRosterApplications'
import { MEMBER_COLORS, getMemberColor } from '../utils/memberColors'
import {
  DEFAULT_MORNING_START, DEFAULT_MORNING_END,
  DEFAULT_AFTERNOON_START, DEFAULT_AFTERNOON_END
} from '../../domain/entities/Goal'

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

const formatTime12 = (time24) => {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')}${period}`
}

const SHIFT_TIMES = {
  morning: `${formatTime12(DEFAULT_MORNING_START)} – ${formatTime12(DEFAULT_MORNING_END)}`,
  afternoon: `${formatTime12(DEFAULT_AFTERNOON_START)} – ${formatTime12(DEFAULT_AFTERNOON_END)}`,
  allday: `${formatTime12(DEFAULT_MORNING_START)} – ${formatTime12(DEFAULT_AFTERNOON_END)}`,
}


export function RosterModal({
  isAdmin,
  currentUserUid,
  currentUserDisplayName,
  members,
  locations,
  onUpdateMyColor,
  onClose
}) {
  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth() + 1
  const nextMonthMonth = todayMonth === 12 ? 1 : todayMonth + 1
  const nextMonthYear  = todayMonth === 12 ? todayYear + 1 : todayYear

  const [rosterYear,  setRosterYear]  = useState(todayYear)
  const [rosterMonth, setRosterMonth] = useState(todayMonth)

  // Look up location abbreviation from the locations array
  const getLocationAbbr = (locationName) => {
    if (!locationName || !locations) return null
    const loc = locations.find(l => l.name === locationName)
    return loc?.abbr || locationName
  }

  // Shared location tab state for both admin and member views
  const [activeLocation, setActiveLocation] = useState(() => locations?.[0]?.name || '')

  // Sync activeLocation when locations load after mount
  useEffect(() => {
    if (!activeLocation && locations?.length > 0) {
      setActiveLocation(locations[0].name)
    }
  }, [locations, activeLocation])

  // Member shift transfer state
  const [transferDay, setTransferDay] = useState(null)
  const [transferTarget, setTransferTarget] = useState('')
  const [transferSaving, setTransferSaving] = useState(false)

  const [scheduleExpanded, setScheduleExpanded] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [assignBothMode, setAssignBothMode] = useState(false)
  const [bothForm, setBothForm] = useState({ ...EMPTY_SHIFT })
  const [dayForm, setDayForm] = useState({
    morning:   { ...EMPTY_SHIFT },
    afternoon: { ...EMPTY_SHIFT }
  })
  const [saving, setSaving] = useState(false)

  // Admin bulk assign state
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkSelectedDays, setBulkSelectedDays] = useState(new Set())
  const [bulkMember, setBulkMember] = useState('')
  const [bulkNotes, setBulkNotes] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  // Admin member filter (empty = all)
  const [filterMember, setFilterMember] = useState('')

  // Admin action state
  const [actioningAppId, setActioningAppId] = useState(null)

  const { roster, loading, myShifts, saveSlot, clearSlot, saveBulkSlots } =
    useRoster(rosterYear, rosterMonth, currentUserUid)

  const {
    applications,
    approveApplication,
    rejectApplication
  } = useRosterApplications(rosterYear, rosterMonth, currentUserUid, isAdmin)

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

  // ---- Admin bulk assign ----

  const exitBulkMode = () => {
    setBulkMode(false)
    setBulkSelectedDays(new Set())
    setBulkMember('')
    setBulkNotes('')
  }

  const toggleBulkDay = (day) => {
    setBulkSelectedDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const toggleBulkAll = () => {
    if (bulkSelectedDays.size === daysInMonth) {
      setBulkSelectedDays(new Set())
    } else {
      const all = new Set()
      for (let i = 1; i <= daysInMonth; i++) all.add(String(i).padStart(2, '0'))
      setBulkSelectedDays(all)
    }
  }

  const handleBulkAssign = async () => {
    if (!bulkMember || bulkSelectedDays.size === 0 || !activeLocation) return
    const member = members.find(m => m.uid === bulkMember)
    if (!member) return
    setBulkSaving(true)
    try {
      const slotData = {
        uid: bulkMember,
        displayName: member.displayName || member.email,
        notes: bulkNotes
      }
      const updates = []
      for (const day of bulkSelectedDays) {
        updates.push({ day, shift: 'morning', locationName: activeLocation, slotData })
        updates.push({ day, shift: 'afternoon', locationName: activeLocation, slotData })
      }
      await saveBulkSlots(updates)
      exitBulkMode()
    } catch (err) {
      console.error('Failed to bulk assign:', err)
    } finally {
      setBulkSaving(false)
    }
  }

  const handleBulkClear = async () => {
    if (bulkSelectedDays.size === 0 || !activeLocation) return
    setBulkSaving(true)
    try {
      const updates = []
      for (const day of bulkSelectedDays) {
        updates.push({ day, shift: 'morning', locationName: activeLocation, slotData: null })
        updates.push({ day, shift: 'afternoon', locationName: activeLocation, slotData: null })
      }
      await saveBulkSlots(updates)
      exitBulkMode()
    } catch (err) {
      console.error('Failed to bulk clear:', err)
    } finally {
      setBulkSaving(false)
    }
  }

  const handleClearBoth = async () => {
    if (!selectedDay || !activeLocation) return
    setSaving(true)
    try {
      await clearSlot(selectedDay, 'morning', activeLocation)
      await clearSlot(selectedDay, 'afternoon', activeLocation)
      closeDayPanel()
    } catch (err) {
      console.error('Failed to clear both shifts:', err)
    } finally {
      setSaving(false)
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

  // Look up a member's custom colorIndex (null if not set)
  const getColorIndex = (uid) => {
    const member = members.find(m => m.uid === uid)
    return member?.colorIndex ?? null
  }

  // Compact day cell — renders the day's status without AM/PM breakdown
  const renderCompactDayCell = (day, amSlot, pmSlot, myAmStatus, myPmStatus) => {
    if (isAdmin) {
      // ── Admin view: show per-member colored badges ──
      const assignedUids = new Map()
      for (const slot of [amSlot, pmSlot]) {
        if (slot?.uid && !assignedUids.has(slot.uid)) {
          if (!filterMember || slot.uid === filterMember) {
            assignedUids.set(slot.uid, resolveDisplayName(slot.uid, slot.displayName))
          }
        }
      }

      const pendingApps = applications.filter(
        a => a.day === day && a.location === activeLocation && a.status === 'pending'
          && (!filterMember || a.uid === filterMember)
      )
      const applicants = [...new Map(pendingApps.map(a => [a.uid, a])).values()]
        .filter(a => !assignedUids.has(a.uid))

      if (assignedUids.size === 0 && applicants.length === 0) {
        return <span className="roster-unassigned">—</span>
      }

      return (
        <div className="roster-color-badges">
          {[...assignedUids.entries()].map(([uid, name]) => {
            const color = getMemberColor(uid, getColorIndex(uid))
            return (
              <span
                key={uid}
                className="roster-color-badge"
                style={{ background: color.bg, color: color.text }}
                title={name}
              >
                {name}
              </span>
            )
          })}
          {applicants.map(a => {
            const color = getMemberColor(a.uid, getColorIndex(a.uid))
            const name = resolveDisplayName(a.uid, a.displayName)
            return (
              <span
                key={a.uid}
                className="roster-color-badge roster-color-badge-pending"
                style={{ borderColor: color.text, color: color.text }}
                title={`${name} (pending)`}
              >
                {name}
              </span>
            )
          })}
        </div>
      )
    }

    // ── Member view: highlight own shifts, hide other names ──

    // Own statuses
    if (myAmStatus === 'assigned' && myPmStatus === 'assigned') {
      return <span className="roster-mine-badge">Mine ✓</span>
    }
    if (myAmStatus === 'pending' && myPmStatus === 'pending') {
      return (
        <span className="roster-pending-status roster-pending-indicator">
          {getInitials(currentUserDisplayName)}
        </span>
      )
    }
    if (myAmStatus === 'rejected' && myPmStatus === 'rejected') {
      return <span className="roster-rejected-status">Not selected</span>
    }

    // Mixed own statuses (one shift mine, other not)
    const hasMyAssignment = myAmStatus === 'assigned' || myPmStatus === 'assigned'
    const hasMyPending = myAmStatus === 'pending' || myPmStatus === 'pending'
    if (hasMyAssignment || hasMyPending) {
      return (
        <div className="roster-color-badges">
          {hasMyAssignment && <span className="roster-mine-badge">Mine ✓</span>}
          {hasMyPending && (
            <span className="roster-pending-status">
              {getInitials(currentUserDisplayName)}
            </span>
          )}
        </div>
      )
    }

    // Other members — no names, just a generic indicator
    const otherAssigned = [amSlot, pmSlot].some(s => s?.uid && s.uid !== currentUserUid)
    if (otherAssigned) {
      return <span className="roster-others-badge">Taken</span>
    }

    const otherApps = applications.filter(
      a => a.day === day && a.location === activeLocation
        && a.uid !== currentUserUid && a.status === 'pending'
    )
    if (otherApps.length > 0) {
      return <span className="roster-others-pending">Pending</span>
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
          {isAdmin && (
            bulkMode
              ? <button className="roster-bulk-toggle active" onClick={exitBulkMode}>Cancel</button>
              : <button className="roster-bulk-toggle" onClick={() => setBulkMode(true)}>Bulk Assign</button>
          )}
          <button className="roster-close-btn" onClick={onClose} title="Close">&times;</button>
        </div>

        {onUpdateMyColor && (
          <div className="roster-my-color">
            <span className="roster-my-color-label">My color:</span>
            {MEMBER_COLORS.map((c, i) => {
              const current = getMemberColor(currentUserUid, getColorIndex(currentUserUid))
              const isSelected = c.bg === current.bg && c.text === current.text
              return (
                <button
                  key={i}
                  className={`member-color-dot ${isSelected ? 'selected' : ''}`}
                  style={{ background: c.bg, borderColor: c.text }}
                  onClick={() => onUpdateMyColor(i)}
                  title={`Color ${i + 1}`}
                />
              )
            })}
          </div>
        )}

        <div className="roster-content-area">
          {loading && <div className="roster-loading-overlay" />}

          {/* ── ADMIN VIEW ── */}
          {isAdmin ? (
          <>
            <div className="roster-filter-bar">
              {renderLocationTabs()}
              <select
                className="roster-member-filter"
                value={filterMember}
                onChange={e => setFilterMember(e.target.value)}
              >
                <option value="">All Members</option>
                {members.map(m => (
                  <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
                ))}
              </select>
            </div>

            {bulkMode && (
              <div className="roster-bulk-header">
                <button className="roster-bulk-select-all" onClick={toggleBulkAll}>
                  {bulkSelectedDays.size === daysInMonth ? 'Deselect All' : 'Select All'}
                </button>
                <span className="roster-bulk-count">
                  {bulkSelectedDays.size} day{bulkSelectedDays.size !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}

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
                  const isBulkSelected = bulkMode && bulkSelectedDays.has(day)
                  return (
                    <div
                      key={day}
                      className={`roster-day-cell roster-member-day-cell roster-admin-day-cell${isBulkSelected ? ' roster-day-selected' : ''}`}
                      onClick={() => bulkMode ? toggleBulkDay(day) : openDayPanel(day, true)}
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

            {bulkMode && (
              <div className="roster-bulk-bar">
                <div className="roster-bulk-bar-row">
                  <label className="roster-panel-label">Member</label>
                  <select
                    className="roster-panel-select"
                    value={bulkMember}
                    onChange={e => setBulkMember(e.target.value)}
                  >
                    <option value="">— Select member —</option>
                    {members.map(m => (
                      <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
                    ))}
                  </select>
                </div>
                <div className="roster-bulk-bar-row">
                  <label className="roster-panel-label">Notes</label>
                  <input
                    className="roster-panel-input"
                    type="text"
                    placeholder="Optional notes..."
                    value={bulkNotes}
                    onChange={e => setBulkNotes(e.target.value)}
                  />
                </div>
                <div className="roster-bulk-bar-actions">
                  <button
                    className="roster-save-btn"
                    onClick={handleBulkAssign}
                    disabled={!bulkMember || bulkSelectedDays.size === 0 || bulkSaving}
                  >
                    {bulkSaving ? 'Saving…' : 'Assign'}
                  </button>
                  <button
                    className="roster-clear-btn"
                    onClick={handleBulkClear}
                    disabled={bulkSelectedDays.size === 0 || bulkSaving}
                  >
                    {bulkSaving ? 'Saving…' : 'Clear'}
                  </button>
                </div>
              </div>
            )}
          </>

          ) : (

          /* ── MEMBER VIEW (read-only, redesigned) ── */
          (() => {
            // Derive today string for highlighting
            const todayStr = `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
            const viewMonthStr = `${rosterYear}-${String(rosterMonth).padStart(2, '0')}`

            // Build per-day shift info across ALL locations for the user
            const myDayMap = {}  // day -> [{ shift, locationName, notes }]
            if (roster?.days) {
              for (const [day, dayData] of Object.entries(roster.days)) {
                for (const shift of ['morning', 'afternoon']) {
                  const shiftData = dayData?.[shift] || {}
                  for (const [locName, slot] of Object.entries(shiftData)) {
                    if (slot?.uid === currentUserUid) {
                      if (!myDayMap[day]) myDayMap[day] = []
                      myDayMap[day].push({ shift, locationName: locName, notes: slot.notes })
                    }
                  }
                }
              }
            }

            const totalShifts = myShifts.length
            // Count unique days
            const uniqueDays = new Set(myShifts.map(s => s.day)).size

            // Merge AM+PM at the same day+location into a single "All Day" entry
            const mergedShifts = []
            const shiftMap = new Map() // key: day-locationName
            for (const s of myShifts) {
              const key = `${s.day}-${s.locationName}`
              if (shiftMap.has(key)) {
                const existing = shiftMap.get(key)
                existing.shift = 'allday'
                existing.slot = { ...existing.slot, notes: existing.slot.notes || s.slot.notes }
              } else {
                const entry = { ...s, slot: { ...s.slot } }
                shiftMap.set(key, entry)
                mergedShifts.push(entry)
              }
            }

            // Next upcoming shift (using merged entries)
            const todayDay = String(now.getDate()).padStart(2, '0')
            const isCurrentMonth = rosterYear === todayYear && rosterMonth === todayMonth
            const upcomingShifts = isCurrentMonth
              ? mergedShifts.filter(s => s.day >= todayDay)
              : (rosterYear > todayYear || (rosterYear === todayYear && rosterMonth > todayMonth))
                ? mergedShifts
                : []
            const nextShift = upcomingShifts[0] || null

            // Group shifts by week for the timeline
            const shiftsByWeek = []
            let currentWeek = null
            for (const s of mergedShifts) {
              const dateObj = new Date(rosterYear, rosterMonth - 1, Number(s.day))
              const weekStart = new Date(dateObj)
              weekStart.setDate(weekStart.getDate() - weekStart.getDay())
              const weekKey = weekStart.toISOString().slice(0, 10)
              if (!currentWeek || currentWeek.key !== weekKey) {
                currentWeek = {
                  key: weekKey,
                  label: `Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
                  shifts: []
                }
                shiftsByWeek.push(currentWeek)
              }
              currentWeek.shifts.push(s)
            }

            return (
            <div className="roster-member-view">
              {/* ── Summary Stats ── */}
              <div className="rmv-stats">
                <div className="rmv-stat-card rmv-stat-primary">
                  <div className="rmv-stat-number">{totalShifts}</div>
                  <div className="rmv-stat-label">{totalShifts === 1 ? 'Shift' : 'Shifts'}</div>
                </div>
                <div className="rmv-stat-card">
                  <div className="rmv-stat-number">{uniqueDays}</div>
                  <div className="rmv-stat-label">{uniqueDays === 1 ? 'Day' : 'Days'}</div>
                </div>
                {nextShift && (
                  <div className="rmv-stat-card rmv-stat-next">
                    <div className="rmv-stat-label">Next</div>
                    <div className="rmv-stat-next-date">
                      {new Date(rosterYear, rosterMonth - 1, Number(nextShift.day))
                        .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="rmv-stat-next-shift">
                      <span className={`rmv-pill ${nextShift.shift}`}>
                        {SHIFT_TIMES[nextShift.shift]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Calendar ── */}
              <div className="rmv-calendar-section">
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
                    const dateStr = `${viewMonthStr}-${day}`
                    const isToday = dateStr === todayStr
                    const isPast = isCurrentMonth && day < todayDay
                    const mySlots = myDayMap[day] || []
                    const hasMyShift = mySlots.length > 0
                    const hasAm = mySlots.some(s => s.shift === 'morning')
                    const hasPm = mySlots.some(s => s.shift === 'afternoon')
                    const dayOfWeek = new Date(rosterYear, rosterMonth - 1, dayNum).getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                    const isClickable = hasMyShift && !isPast

                    return (
                      <div
                        key={day}
                        className={[
                          'roster-day-cell rmv-day-cell',
                          hasMyShift ? 'rmv-day-mine' : '',
                          isToday ? 'rmv-day-today' : '',
                          isPast ? 'rmv-day-past' : '',
                          isWeekend ? 'rmv-day-weekend' : '',
                          isClickable ? 'rmv-day-clickable' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={isClickable ? () => { setTransferDay(day); setTransferTarget('') } : undefined}
                      >
                        <div className={`roster-day-number${isToday ? ' rmv-today-number' : ''}`}>
                          {dayNum}
                          {isToday && <span className="rmv-today-dot" />}
                        </div>
                        {hasMyShift ? (
                          <div className="rmv-day-pills">
                            {(hasAm && hasPm) ? (
                              <span className="rmv-pill allday">All Day</span>
                            ) : hasAm ? (
                              <span className="rmv-pill morning">AM</span>
                            ) : (
                              <span className="rmv-pill afternoon">PM</span>
                            )}
                            {mySlots.length > 0 && (
                              <span className="rmv-day-loc" title={mySlots[0].locationName}>
                                {getLocationAbbr(mySlots[0].locationName)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="rmv-day-empty-indicator" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Shift Timeline ── */}
              {myShifts.length > 0 ? (
                <div className={`rmv-timeline${scheduleExpanded ? '' : ' rmv-timeline-collapsed'}`}>
                  <div className="rmv-timeline-title" onClick={() => setScheduleExpanded(!scheduleExpanded)}>
                    <span className="rmv-timeline-toggle">{scheduleExpanded ? '\u25BC' : '\u25B6'}</span>
                    My Schedule
                  </div>
                  {scheduleExpanded && shiftsByWeek.map(week => (
                    <div key={week.key} className="rmv-week-group">
                      <div className="rmv-week-label">{week.label}</div>
                      <div className="rmv-week-cards">
                        {week.shifts.map(({ day, shift, locationName, slot }) => {
                          const dateObj = new Date(rosterYear, rosterMonth - 1, Number(day))
                          const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short' })
                          const dateLabel = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          const dateFullStr = `${viewMonthStr}-${day}`
                          const isUpcoming = isCurrentMonth ? day >= todayDay : rosterMonth > todayMonth || rosterYear > todayYear
                          const isShiftToday = dateFullStr === todayStr

                          return (
                            <div
                              key={`${day}-${shift}-${locationName}`}
                              className={[
                                'rmv-shift-card',
                                isShiftToday ? 'rmv-shift-today' : '',
                                !isUpcoming ? 'rmv-shift-past' : '',
                                isUpcoming ? 'rmv-shift-clickable' : '',
                              ].filter(Boolean).join(' ')}
                              onClick={isUpcoming ? () => { setTransferDay(day); setTransferTarget('') } : undefined}
                            >
                              <div className="rmv-shift-date-col">
                                <span className="rmv-shift-day-name">{dayLabel}</span>
                                <span className="rmv-shift-date-num">{dateLabel}</span>
                              </div>
                              <div className="rmv-shift-info-col">
                                <span className={`rmv-pill ${shift}`}>
                                  {SHIFT_TIMES[shift]}
                                </span>
                                <span className="rmv-shift-location">{locationName}</span>
                              </div>
                              {slot.notes && (
                                <div className="rmv-shift-notes">{slot.notes}</div>
                              )}
                              {isShiftToday && <span className="rmv-today-tag">Today</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rmv-empty-state">
                  <div className="rmv-empty-icon">📋</div>
                  <div className="rmv-empty-title">No shifts scheduled</div>
                  <div className="rmv-empty-subtitle">
                    Your roster for {MONTH_NAMES[rosterMonth - 1]} {rosterYear} hasn't been set yet.
                  </div>
                </div>
              )}
            </div>
            )
          })()
          )}
        </div>{/* roster-content-area */}

      </div>

      {/* ── Member Shift Transfer Panel ── */}
      {!isAdmin && transferDay && (() => {
        const daySlots = []
        const dayData = roster?.days?.[transferDay] || {}
        for (const shift of ['morning', 'afternoon']) {
          const shiftData = dayData?.[shift] || {}
          for (const [locName, slot] of Object.entries(shiftData)) {
            if (slot?.uid === currentUserUid) {
              daySlots.push({ shift, locationName: locName, slot })
            }
          }
        }
        if (daySlots.length === 0) return null

        const transferDateLabel = new Date(rosterYear, rosterMonth - 1, Number(transferDay))
          .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

        const eligibleMembers = members.filter(m => m.uid !== currentUserUid && !m.isAdmin && !m.disabled)

        const handleTransfer = async () => {
          if (!transferTarget || daySlots.length === 0) return
          const target = members.find(m => m.uid === transferTarget)
          if (!target) return
          setTransferSaving(true)
          try {
            const updates = daySlots.map(({ shift, locationName }) => ({
              day: transferDay,
              shift,
              locationName,
              slotData: {
                uid: target.uid,
                displayName: target.displayName || target.email,
                notes: ''
              }
            }))
            await saveBulkSlots(updates)
            setTransferDay(null)
            setTransferTarget('')
          } catch (err) {
            console.error('Failed to transfer shift:', err)
          } finally {
            setTransferSaving(false)
          }
        }

        return (
          <div
            className="roster-day-panel-overlay rmv-transfer-overlay"
            onClick={e => { e.stopPropagation(); setTransferDay(null) }}
          >
            <div className="roster-day-panel rmv-transfer-panel" onClick={e => e.stopPropagation()}>
              <div className="roster-day-panel-header">
                <h3>{transferDateLabel}</h3>
                <button className="roster-close-btn" onClick={() => setTransferDay(null)} title="Close">
                  &times;
                </button>
              </div>

              <div className="rmv-transfer-summary">
                <div className="rmv-transfer-summary-title">My Shift</div>
                {daySlots.map(({ shift, locationName }) => (
                  <div key={`${shift}-${locationName}`} className="rmv-transfer-summary-row">
                    <span className={`rmv-pill ${shift}`}>
                      {SHIFT_TIMES[shift]}
                    </span>
                    <span className="rmv-transfer-summary-loc">{locationName}</span>
                  </div>
                ))}
              </div>

              <div className="rmv-transfer-section">
                <div className="rmv-transfer-section-title">Transfer To</div>
                <select
                  className="roster-panel-select"
                  value={transferTarget}
                  onChange={e => setTransferTarget(e.target.value)}
                >
                  <option value="">— Select teammate —</option>
                  {eligibleMembers.map(m => (
                    <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
                  ))}
                </select>
              </div>

              <div className="roster-day-panel-actions">
                <button
                  className="roster-save-btn"
                  onClick={handleTransfer}
                  disabled={!transferTarget || transferSaving}
                >
                  {transferSaving ? 'Transferring…' : 'Transfer Shift'}
                </button>
                <button className="roster-cancel-btn" onClick={() => setTransferDay(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
                    {saving ? 'Saving…' : 'Assign'}
                  </button>
                  {(roster?.days?.[selectedDay]?.morning?.[activeLocation] ||
                    roster?.days?.[selectedDay]?.afternoon?.[activeLocation]) && (
                    <button
                      className="roster-clear-btn"
                      onClick={handleClearBoth}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Clear'}
                    </button>
                  )}
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
