import { DayCell } from './DayCell'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({ year, month, goals, selectedDay, availableExcess, onDayClick, onBuyback, onWageClick }) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const pad = (n) => String(n).padStart(2, '0')

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1
    const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`
    return { dayNum, dateStr }
  })

  return (
    <>
      <div className="calendar-weekdays">
        {WEEKDAYS.map(d => (
          <div key={d} className="weekday-header">{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="day-cell empty" />
        ))}
        {days.map(({ dayNum, dateStr }) => (
          <DayCell
            key={dateStr}
            day={dayNum}
            dateStr={dateStr}
            goal={goals[dateStr]}
            isSelected={selectedDay === dateStr}
            isToday={dateStr === todayStr}
            availableExcess={availableExcess}
            onClick={() => onDayClick(dateStr)}
            onBuyback={(shift) => onBuyback(dateStr, shift)}
            onWageClick={() => onWageClick(dateStr)}
          />
        ))}
      </div>
    </>
  )
}
