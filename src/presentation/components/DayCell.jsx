export function DayCell({ day, goal, isSelected, isToday, availableExcess, onClick, onBuyback, onWageClick }) {
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

  // Check if target is unmet and not bought back
  const isMorningUnmet = goal?.morningAmount && goal?.morningWage !== 80 && !goal?.morningBoughtBack
  const isAfternoonUnmet = goal?.afternoonAmount && goal?.afternoonWage !== 80 && !goal?.afternoonBoughtBack

  // Check if unmet target can be bought with available excess
  const canBuyMorning = isMorningUnmet && goal?.morningAmount <= availableExcess
  const canBuyAfternoon = isAfternoonUnmet && goal?.afternoonAmount <= availableExcess

  const handleBuyback = (shift, e) => {
    e.stopPropagation()
    onBuyback(shift)
  }

  const handleWageClick = (e) => {
    e.stopPropagation()
    if (onWageClick) {
      onWageClick()
    }
  }

  // Calculate total labor cost (wage * 4.167 hours per shift)
  // Morning: 11:50 AM - 4:00 PM = 4h 10m = 4.167 hours
  // Afternoon: 4:00 PM - 8:10 PM = 4h 10m = 4.167 hours
  const SHIFT_HOURS = 4 + (10 / 60) // 4.167 hours

  const calculateLaborCost = () => {
    if (!goal?.hasGoals) return 0
    const morningCost = Math.round((goal.morningWage || 65) * SHIFT_HOURS * 100) / 100
    const afternoonCost = Math.round((goal.afternoonWage || 65) * SHIFT_HOURS * 100) / 100
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

  // Calculate buyback amounts and commissions (3.5%)
  const getMorningBuyback = () => {
    if (goal?.morningBoughtBack && goal?.morningAmount) {
      return {
        amount: goal.morningAmount,
        commission: Math.round(goal.morningAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  const getAfternoonBuyback = () => {
    if (goal?.afternoonBoughtBack && goal?.afternoonAmount) {
      return {
        amount: goal.afternoonAmount,
        commission: Math.round(goal.afternoonAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  // Calculate custom commissions
  const getMorningCustomCommission = () => {
    if (goal?.morningCustomRate && goal?.morningCustomAmount) {
      return Math.round(goal.morningCustomAmount * (goal.morningCustomRate / 100) * 100) / 100
    }
    return 0
  }

  const getAfternoonCustomCommission = () => {
    if (goal?.afternoonCustomRate && goal?.afternoonCustomAmount) {
      return Math.round(goal.afternoonCustomAmount * (goal.afternoonCustomRate / 100) * 100) / 100
    }
    return 0
  }

  const laborCost = calculateLaborCost()
  const morningCommission = getMorningCommission()
  const afternoonCommission = getAfternoonCommission()
  const morningBuyback = getMorningBuyback()
  const afternoonBuyback = getAfternoonBuyback()
  const morningCustomCommission = getMorningCustomCommission()
  const afternoonCustomCommission = getAfternoonCustomCommission()
  const totalBuybackCommission = morningBuyback.commission + afternoonBuyback.commission
  const totalCustomCommission = morningCustomCommission + afternoonCustomCommission
  const totalCommission = morningCommission + afternoonCommission + totalBuybackCommission + totalCustomCommission
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
                {isMorningUnmet ? (
                  <div
                    className={`unmet-target ${canBuyMorning ? 'buyable' : ''}`}
                    onClick={(e) => canBuyMorning && handleBuyback('morning', e)}
                    title={canBuyMorning ? 'Click to buy back' : 'Insufficient excess revenue'}
                  >
                    <span className="unmet-label">Unmet</span>
                    <span className="unmet-amount">${goal.morningAmount}</span>
                    {canBuyMorning && <span className="buyback-star">★</span>}
                  </div>
                ) : (
                  <>
                    <span className={`wage-value ${wageClass(goal.morningWage)}`}>${goal.morningWage}/hr</span>
                    {morningCommission > 0 && (
                      <span className="commission-inline">+${morningCommission}</span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="shift">
              <span className="shift-label">PM</span>
              <span className="shift-details">
                {isAfternoonUnmet ? (
                  <div
                    className={`unmet-target ${canBuyAfternoon ? 'buyable' : ''}`}
                    onClick={(e) => canBuyAfternoon && handleBuyback('afternoon', e)}
                    title={canBuyAfternoon ? 'Click to buy back' : 'Insufficient excess revenue'}
                  >
                    <span className="unmet-label">Unmet</span>
                    <span className="unmet-amount">${goal.afternoonAmount}</span>
                    {canBuyAfternoon && <span className="buyback-star">★</span>}
                  </div>
                ) : (
                  <>
                    <span className={`wage-value ${wageClass(goal.afternoonWage)}`}>${goal.afternoonWage}/hr</span>
                    {afternoonCommission > 0 && (
                      <span className="commission-inline">+${afternoonCommission}</span>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="labor-total" onClick={handleWageClick} style={{ cursor: 'pointer' }}>
            ${totalEarnings.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
