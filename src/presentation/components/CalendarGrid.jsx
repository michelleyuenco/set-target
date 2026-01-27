import { DayCell } from './DayCell'

export function CalendarGrid({ goals, selectedDay, onDayClick }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="calendar-grid">
      {days.map(day => (
        <DayCell
          key={day}
          day={day}
          goal={goals[day]}
          isSelected={selectedDay === day}
          onClick={() => onDayClick(day)}
        />
      ))}
    </div>
  )
}
