import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'

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

  // Only check unmet for confirmed shifts
  const isMorningUnmet = goal?.morningConfirmed && goal?.morningAmount && goal?.morningWage !== 80 && !goal?.morningBoughtBack
  const isAfternoonUnmet = goal?.afternoonConfirmed && goal?.afternoonAmount && goal?.afternoonWage !== 80 && !goal?.afternoonBoughtBack

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

  // Use actual shift hours from goal, falling back to default
  const morningShiftHours = goal?.morningShiftHours ?? DEFAULT_SHIFT_HOURS
  const afternoonShiftHours = goal?.afternoonShiftHours ?? DEFAULT_SHIFT_HOURS

  const calculateLaborCost = () => {
    if (!goal?.hasGoals) return 0
    let cost = 0
    if (goal.morningConfirmed) {
      cost += Math.round((goal.morningWage || 65) * morningShiftHours * 100) / 100
    }
    if (goal.afternoonConfirmed) {
      cost += Math.round((goal.afternoonWage || 65) * afternoonShiftHours * 100) / 100
    }
    return cost
  }

  // Calculate commission per shift (4.5% when target is met) - only for confirmed shifts
  const getMorningCommission = () => {
    if (goal?.morningConfirmed && goal?.morningWage === 80 && goal?.morningActual > 0) {
      return Math.round(goal.morningActual * 0.045 * 100) / 100
    }
    return 0
  }

  const getAfternoonCommission = () => {
    if (goal?.afternoonConfirmed && goal?.afternoonWage === 80 && goal?.afternoonActual > 0) {
      return Math.round(goal.afternoonActual * 0.045 * 100) / 100
    }
    return 0
  }

  // Calculate buyback amounts and commissions (3.5%) - only for confirmed shifts
  const getMorningBuyback = () => {
    if (goal?.morningConfirmed && goal?.morningBoughtBack && goal?.morningAmount) {
      return {
        amount: goal.morningAmount,
        commission: Math.round(goal.morningAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  const getAfternoonBuyback = () => {
    if (goal?.afternoonConfirmed && goal?.afternoonBoughtBack && goal?.afternoonAmount) {
      return {
        amount: goal.afternoonAmount,
        commission: Math.round(goal.afternoonAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  // Calculate custom commissions - only for confirmed shifts
  const getMorningCustomCommission = () => {
    if (goal?.morningConfirmed && goal?.morningCustomRate && goal?.morningCustomAmount) {
      return Math.round(goal.morningCustomAmount * (goal.morningCustomRate / 100) * 100) / 100
    }
    return 0
  }

  const getAfternoonCustomCommission = () => {
    if (goal?.afternoonConfirmed && goal?.afternoonCustomRate && goal?.afternoonCustomAmount) {
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
  const totalEarnings = Math.round((laborCost + totalCommission) * 100) / 100

  const hasAnyConfirmed = goal?.morningConfirmed || goal?.afternoonConfirmed

  return (
    <div className={cellClass} onClick={onClick}>
      <div className="day-number">{day}</div>
      {goal?.hasGoals && hasAnyConfirmed && (
        <div className="goals-display">
          <div className="shift-wages">
            {goal.morningConfirmed && (
              <div className="shift">
                <span className="shift-label">A</span>
                <span className="shift-details">
                  <span className={`wage-value ${wageClass(goal.morningWage)}`}>${goal.morningWage}/hr</span>
                  {isMorningUnmet ? (
                    <span
                      className={`unmet-badge ${canBuyMorning ? 'buyable' : ''}`}
                      onClick={(e) => canBuyMorning && handleBuyback('morning', e)}
                      title={canBuyMorning ? 'Click to buy back' : `Unmet target: $${goal.morningAmount}`}
                    >
                      <span className="unmet-badge-label">Unmet</span>
                      <span className="unmet-badge-amount">${goal.morningAmount}</span>
                      {canBuyMorning && <span className="buyback-star">★</span>}
                    </span>
                  ) : (
                    <>
                      {morningCommission > 0 && (
                        <span className="commission-inline" title="Standard 4.5%">+${morningCommission}</span>
                      )}
                      {morningBuyback.commission > 0 && (
                        <span className="commission-inline buyback-commission" title="Buyback 3.5%">+${morningBuyback.commission}</span>
                      )}
                      {morningCustomCommission > 0 && (
                        <span className="commission-inline custom-commission" title={`Custom ${goal.morningCustomRate}%`}>+${morningCustomCommission}</span>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
            {goal.afternoonConfirmed && (
              <div className="shift">
                <span className="shift-label">B</span>
                <span className="shift-details">
                  <span className={`wage-value ${wageClass(goal.afternoonWage)}`}>${goal.afternoonWage}/hr</span>
                  {isAfternoonUnmet ? (
                    <span
                      className={`unmet-badge ${canBuyAfternoon ? 'buyable' : ''}`}
                      onClick={(e) => canBuyAfternoon && handleBuyback('afternoon', e)}
                      title={canBuyAfternoon ? 'Click to buy back' : `Unmet target: $${goal.afternoonAmount}`}
                    >
                      <span className="unmet-badge-label">Unmet</span>
                      <span className="unmet-badge-amount">${goal.afternoonAmount}</span>
                      {canBuyAfternoon && <span className="buyback-star">★</span>}
                    </span>
                  ) : (
                    <>
                      {afternoonCommission > 0 && (
                        <span className="commission-inline" title="Standard 4.5%">+${afternoonCommission}</span>
                      )}
                      {afternoonBuyback.commission > 0 && (
                        <span className="commission-inline buyback-commission" title="Buyback 3.5%">+${afternoonBuyback.commission}</span>
                      )}
                      {afternoonCustomCommission > 0 && (
                        <span className="commission-inline custom-commission" title={`Custom ${goal.afternoonCustomRate}%`}>+${afternoonCustomCommission}</span>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="labor-total" onClick={handleWageClick} style={{ cursor: 'pointer' }}>
            ${totalEarnings.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
