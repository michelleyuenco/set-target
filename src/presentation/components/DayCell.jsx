export function DayCell({ day, goal, isSelected, isToday, onClick }) {
  const cellClass = [
    'day-cell',
    goal?.hasGoals ? 'has-goals' : '',
    isSelected ? 'selected' : '',
    isToday ? 'today' : ''
  ].filter(Boolean).join(' ')

  const wageClass = (wage) => {
    if (wage === 80) return 'wage-hit'
    if (wage === 75) return 'wage-partial'
    return 'wage-none'
  }

  return (
    <div className={cellClass} onClick={onClick}>
      <div className="day-number">{day}</div>
      {goal?.hasGoals && (
        <div className="goals-display">
          {goal.formattedMorning && (
            <div className="goal morning">
              <span className="label">AM:</span>
              <span className="goal-amounts">
                {goal.formattedMorning}
                {goal.formattedMorningActual && <span className="actual"> → {goal.formattedMorningActual}</span>}
              </span>
              <span className={`wage-badge ${wageClass(goal.morningWage)}`}>${goal.morningWage}/hr</span>
            </div>
          )}
          {goal.formattedAfternoon && (
            <div className="goal afternoon">
              <span className="label">PM:</span>
              <span className="goal-amounts">
                {goal.formattedAfternoon}
                {goal.formattedAfternoonActual && <span className="actual"> → {goal.formattedAfternoonActual}</span>}
              </span>
              <span className={`wage-badge ${wageClass(goal.afternoonWage)}`}>${goal.afternoonWage}/hr</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
