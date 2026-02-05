import { DayCell } from './DayCell'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({ year, month, goals, selectedDay, onDayClick }) {
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
    <div className="calendar-grid">
      {WEEKDAYS.map(d => (
        <div key={d} className="calendar-header">{d}</div>
      ))}
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
          onClick={() => onDayClick(dateStr)}
        />
      ))}
    </div>
  )
}
