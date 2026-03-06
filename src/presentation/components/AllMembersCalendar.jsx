import { useState } from 'react'
import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function calcMemberWages(memberData, year, month, locationFilter) {
  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let wages = 0
  let shifts = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
    const goal = memberData.goals[dateStr]
    if (!goal) continue
    const morningOk = !locationFilter || goal.morningLocation === locationFilter
    const afternoonOk = !locationFilter || goal.afternoonLocation === locationFilter
    if (goal.morningConfirmed && morningOk) {
      wages += (goal.morningWage ?? 65) * (goal.morningShiftHours ?? DEFAULT_SHIFT_HOURS)
      shifts++
    }
    if (goal.afternoonConfirmed && afternoonOk) {
      wages += (goal.afternoonWage ?? 65) * (goal.afternoonShiftHours ?? DEFAULT_SHIFT_HOURS)
      shifts++
    }
  }
  return { wages: Math.round(wages * 100) / 100, shifts }
}

function shiftPillClass(goal, shift) {
  if (shift === 'morning') {
    if (goal.morningBoughtBack) return 'pill-bought-back'
    if (goal.morningCalculatedWage === 80) return 'pill-met'
    if (goal.morningConfirmed && goal.morningAmount) return 'pill-unmet'
    return ''
  } else {
    if (goal.afternoonBoughtBack) return 'pill-bought-back'
    if (goal.afternoonCalculatedWage === 80) return 'pill-met'
    if (goal.afternoonConfirmed && goal.afternoonAmount) return 'pill-unmet'
    return ''
  }
}

export function AllMembersCalendar({ membersGoals, loading, year, month, locations }) {
  const [selectedLocation, setSelectedLocation] = useState(null)

  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  const getDayMembers = (dateStr) => {
    if (!membersGoals) return []
    const result = []
    for (const [, memberData] of Object.entries(membersGoals)) {
      const goal = memberData.goals[dateStr]
      if (!goal) continue
      let hasAM = goal.morningConfirmed
      let hasPM = goal.afternoonConfirmed
      if (selectedLocation) {
        hasAM = hasAM && goal.morningLocation === selectedLocation
        hasPM = hasPM && goal.afternoonLocation === selectedLocation
      }
      if (hasAM || hasPM) {
        result.push({
          uid: memberData.uid,
          displayName: memberData.displayName,
          hasAM,
          hasPM,
          goal,
        })
      }
    }
    return result.sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  const memberTotals = membersGoals
    ? Object.values(membersGoals)
        .map((md) => ({ uid: md.uid, displayName: md.displayName, ...calcMemberWages(md, year, month, selectedLocation) }))
        .filter((m) => m.shifts > 0)
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
    : []

  const grandTotal = Math.round(memberTotals.reduce((s, m) => s + m.wages, 0) * 100) / 100

  if (loading) {
    return <div className="all-members-loading">Loading all members data...</div>
  }

  return (
    <div className="all-members-calendar">
      {locations && locations.length > 0 && (
        <div className="all-members-loc-tabs">
          <button
            className={`all-members-loc-tab${!selectedLocation ? ' active' : ''}`}
            onClick={() => setSelectedLocation(null)}
          >All</button>
          {locations.map((loc) => (
            <button
              key={loc.name}
              className={`all-members-loc-tab${selectedLocation === loc.name ? ' active' : ''}`}
              onClick={() => setSelectedLocation(loc.name)}
            >{loc.abbr || loc.name}</button>
          ))}
        </div>
      )}

      <div className="all-members-weekdays">
        {WEEKDAYS.map((d) => (
          <div key={d} className="all-members-weekday">{d}</div>
        ))}
      </div>

      <div className="all-members-grid">
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="all-members-cell empty" />
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
                'all-members-cell',
                isToday ? 'today' : '',
                dayMembers.length > 0 ? 'has-members' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="all-members-day-num">{dayNum}</div>
              <div className="all-members-list">
                {dayMembers.map((m) => (
                  <div key={m.uid} className="all-members-entry">
                    <span className="all-members-name">{m.displayName}</span>
                    <span className="all-members-shift-pills">
                      {m.hasAM && (
                        <span
                          className={`shift-pill all-members-pill ${shiftPillClass(m.goal, 'morning')}${m.goal.morningAdminConfirmed ? ' pill-verified' : ''}`}
                          title={m.goal.morningLocation || ''}
                        >A{m.goal.morningAdminConfirmed && <span className="pill-check">&#10003;</span>}</span>
                      )}
                      {m.hasPM && (
                        <span
                          className={`shift-pill all-members-pill ${shiftPillClass(m.goal, 'afternoon')}${m.goal.afternoonAdminConfirmed ? ' pill-verified' : ''}`}
                          title={m.goal.afternoonLocation || ''}
                        >B{m.goal.afternoonAdminConfirmed && <span className="pill-check">&#10003;</span>}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {memberTotals.length > 0 && (
        <div className="all-members-summary">
          <div className="all-members-summary-title">
            Monthly Wages{selectedLocation ? ` — ${selectedLocation}` : ''}
          </div>
          {memberTotals.map((m) => (
            <div key={m.uid} className="all-members-summary-row">
              <span className="all-members-summary-name">{m.displayName}</span>
              <span className="all-members-summary-shifts">{m.shifts} shift{m.shifts !== 1 ? 's' : ''}</span>
              <span className="all-members-summary-wages">${m.wages.toLocaleString()}</span>
            </div>
          ))}
          <div className="all-members-summary-total">
            <span>Total</span>
            <span>${grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {!membersGoals && !loading && (
        <div className="all-members-empty">No data loaded yet.</div>
      )}
    </div>
  )
}
