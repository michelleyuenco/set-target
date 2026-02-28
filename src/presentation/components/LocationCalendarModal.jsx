import { useState, useEffect } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function LocationCalendarModal({
  membersGoals,
  loading,
  year,
  month,
  locations,
  onLoad,
  onClose,
}) {
  const [activeLocation, setActiveLocation] = useState(() => locations?.[0]?.name || '')

  useEffect(() => {
    if (!activeLocation && locations?.length > 0) {
      setActiveLocation(locations[0].name)
    }
  }, [locations, activeLocation])

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const getDayMembers = (dateStr) => {
    if (!membersGoals || !activeLocation) return []
    const result = []
    for (const [, memberData] of Object.entries(membersGoals)) {
      const goal = memberData.goals[dateStr]
      if (!goal) continue
      const hasAM = goal.morningConfirmed && goal.morningLocation === activeLocation
      const hasPM = goal.afternoonConfirmed && goal.afternoonLocation === activeLocation
      if (hasAM || hasPM) {
        result.push({
          uid: memberData.uid,
          displayName: memberData.displayName,
          hasAM,
          hasPM,
        })
      }
    }
    return result.sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal loc-cal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="loc-cal-header">
          <h2 className="loc-cal-title">
            Location Calendar
            <span className="loc-cal-month-label">{MONTH_NAMES[month]} {year}</span>
          </h2>
          <button
            className="loc-perf-refresh-btn"
            onClick={onLoad}
            disabled={loading}
            title="Reload data"
          >
            &#8635;
          </button>
        </div>

        {locations.length === 0 ? (
          <div className="loc-cal-empty">No locations configured.</div>
        ) : (
          <div className="loc-cal-tabs">
            {locations.map((loc) => (
              <button
                key={loc.name}
                className={`loc-cal-tab ${activeLocation === loc.name ? 'active' : ''}`}
                onClick={() => setActiveLocation(loc.name)}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="loc-cal-loading">Loading...</div>}

        {!loading && (
          <>
            <div className="loc-cal-weekdays">
              {WEEKDAYS.map((d) => (
                <div key={d} className="loc-cal-weekday">{d}</div>
              ))}
            </div>

            <div className="loc-cal-grid">
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} className="loc-cal-cell empty" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1
                const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`
                const isToday = dateStr === todayStr
                const dayMembers = getDayMembers(dateStr)

                return (
                  <div
                    key={dateStr}
                    className={[
                      'loc-cal-cell',
                      isToday ? 'today' : '',
                      dayMembers.length > 0 ? 'has-members' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <div className="loc-cal-day-num">{dayNum}</div>
                    <div className="loc-cal-members">
                      {dayMembers.map((m) => (
                        <div key={m.uid} className="loc-cal-member-row">
                          <span className="loc-cal-member-name">{m.displayName}</span>
                          <span className="loc-cal-shift-badges">
                            {m.hasAM && <span className="loc-cal-shift-badge am">AM</span>}
                            {m.hasPM && <span className="loc-cal-shift-badge pm">PM</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {!loading && membersGoals && !activeLocation && (
          <div className="loc-cal-empty">Select a location to view the calendar.</div>
        )}

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
