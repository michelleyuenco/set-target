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

  // Calculate total labor cost (wage * 4 hours per shift)
  const calculateLaborCost = () => {
    if (!goal?.hasGoals) return 0
    const morningCost = (goal.morningWage || 65) * 4
    const afternoonCost = (goal.afternoonWage || 65) * 4
    return morningCost + afternoonCost
  }

  // Calculate commission per shift (4.5% when target is met)
  const getMorningCommission = () => {
    if (goal?.morningWage === 80 && goal?.morningActual > 0) {
      return Math.round(goal.morningActual * 0.045 * 100) / 100
    }
    return 0
  }

  const getAfternoonCommission = () => {
    if (goal?.afternoonWage === 80 && goal?.afternoonActual > 0) {
      return Math.round(goal.afternoonActual * 0.045 * 100) / 100
    }
    return 0
  }

  const laborCost = calculateLaborCost()
  const morningCommission = getMorningCommission()
  const afternoonCommission = getAfternoonCommission()
  const totalCommission = morningCommission + afternoonCommission
  const totalEarnings = laborCost + totalCommission

  return (
    <div className={cellClass} onClick={onClick}>
      <div className="day-number">{day}</div>
      {goal?.hasGoals && (
        <div className="goals-display">
          <div className="shift-wages">
            <div className="shift">
              <span className="shift-label">AM</span>
              <span className="shift-details">
                <span className={`wage-value ${wageClass(goal.morningWage)}`}>${goal.morningWage}/hr</span>
                {morningCommission > 0 && (
                  <span className="commission-inline">+${morningCommission}</span>
                )}
              </span>
            </div>
            <div className="shift">
              <span className="shift-label">PM</span>
              <span className="shift-details">
                <span className={`wage-value ${wageClass(goal.afternoonWage)}`}>${goal.afternoonWage}/hr</span>
                {afternoonCommission > 0 && (
                  <span className="commission-inline">+${afternoonCommission}</span>
                )}
              </span>
            </div>
          </div>
          <div className="labor-total">
            ${totalEarnings.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
