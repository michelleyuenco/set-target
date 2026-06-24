import { useState } from 'react'
import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'
import styles from './AllMembersCalendar.module.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKEND = new Set([0, 6])

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
    return <div className={styles.loading}>Loading all members data...</div>
  }

  return (
    <div>
      {locations && locations.length > 0 && (
        <div className={styles.locTabs}>
          <button
            className={`${styles.locTab}${!selectedLocation ? ` ${styles.active}` : ''}`}
            onClick={() => setSelectedLocation(null)}
          >All</button>
          {locations.map((loc) => (
            <button
              key={loc.name}
              className={`${styles.locTab}${selectedLocation === loc.name ? ` ${styles.active}` : ''}`}
              onClick={() => setSelectedLocation(loc.name)}
            >{loc.abbr || loc.name}</button>
          ))}
        </div>
      )}

      <div className={styles.weekdays}>
        {WEEKDAYS.map((d) => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className={`${styles.cell} ${styles.empty}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`
          const isToday = dateStr === todayStr
          const isWeekend = WEEKEND.has((firstDayOfWeek + i) % 7)
          const dayMembers = getDayMembers(dateStr)

          const dayActualTotal = dayMembers.reduce((sum, m) => {
            if (m.hasAM) sum += (m.goal.morningEffectiveActual || 0)
            if (m.hasPM) sum += (m.goal.afternoonEffectiveActual || 0)
            return sum
          }, 0)

          return (
            <div
              key={dateStr}
              className={[
                styles.cell,
                isToday ? styles.today : '',
                isWeekend ? styles.weekend : '',
                dayMembers.length > 0 ? styles.hasMembers : '',
              ].filter(Boolean).join(' ')}
            >
              <div className={styles.dayNum}>{dayNum}</div>
              <div className={styles.list}>
                {dayMembers.map((m) => (
                  <div key={m.uid} className={styles.entry}>
                    <span className={styles.name}>{m.displayName}</span>
                    <span className={styles.pills}>
                      {m.hasAM && (
                        <span
                          className={`shift-pill ${styles.pill} ${shiftPillClass(m.goal, 'morning')}${m.goal.morningAdminConfirmed ? ' pill-verified' : ''}`}
                          title={m.goal.morningLocation || ''}
                        >A</span>
                      )}
                      {m.hasPM && (
                        <span
                          className={`shift-pill ${styles.pill} ${shiftPillClass(m.goal, 'afternoon')}${m.goal.afternoonAdminConfirmed ? ' pill-verified' : ''}`}
                          title={m.goal.afternoonLocation || ''}
                        >B</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {dayActualTotal > 0 && (
                <div className={styles.dayRevenue}>
                  <span className={styles.dayRevenueLabel}>Rev</span>
                  <span className={styles.dayRevenueValue}>
                    ${Math.round(dayActualTotal).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {memberTotals.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryTitle}>
            Monthly Wages{selectedLocation ? ` — ${selectedLocation}` : ''}
          </div>
          {memberTotals.map((m) => (
            <div key={m.uid} className={styles.summaryRow}>
              <span className={styles.summaryName}>{m.displayName}</span>
              <span className={styles.summaryShifts}>{m.shifts} shift{m.shifts !== 1 ? 's' : ''}</span>
              <span className={styles.summaryWages}>${m.wages.toLocaleString()}</span>
            </div>
          ))}
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {!membersGoals && !loading && (
        <div className={styles.emptyState}>No data loaded yet.</div>
      )}
    </div>
  )
}
