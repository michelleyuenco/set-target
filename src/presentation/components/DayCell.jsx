export function DayCell({ day, goal, isSelected, onClick }) {
  const cellClass = [
    'day-cell',
    goal?.hasGoals ? 'has-goals' : '',
    isSelected ? 'selected' : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={cellClass} onClick={onClick}>
      <div className="day-number">{day}</div>
      {goal?.hasGoals && (
        <div className="goals-display">
          {goal.formattedMorning && (
            <div className="goal morning">
              <span className="label">AM:</span> {goal.formattedMorning}
            </div>
          )}
          {goal.formattedAfternoon && (
            <div className="goal afternoon">
              <span className="label">PM:</span> {goal.formattedAfternoon}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
