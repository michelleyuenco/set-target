import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'

export function DayCell({ day, dateStr, goal, isSelected, isToday, availableExcess, excessAllocation, onClick, onBuyback, onWageClick }) {
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
      return Math.round(goal.morningAmount * 0.045 * 100) / 100
    }
    return 0
  }

  const getAfternoonCommission = () => {
    if (goal?.afternoonConfirmed && goal?.afternoonWage === 80 && goal?.afternoonActual > 0) {
      return Math.round(goal.afternoonAmount * 0.045 * 100) / 100
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

  // Shift state detection
  const isMorningMet = goal?.morningConfirmed && goal?.morningWage === 80 && !goal?.morningBoughtBack
  const isAfternoonMet = goal?.afternoonConfirmed && goal?.afternoonWage === 80 && !goal?.afternoonBoughtBack
  const isMorningBoughtBack = goal?.morningConfirmed && goal?.morningBoughtBack
  const isAfternoonBoughtBack = goal?.afternoonConfirmed && goal?.afternoonBoughtBack

  // Per-shift excess from allocation map (FIFO)
  const morningAlloc = excessAllocation?.[`${dateStr}:morning`]
  const afternoonAlloc = excessAllocation?.[`${dateStr}:afternoon`]
  const morningExcess = morningAlloc?.excess || 0
  const afternoonExcess = afternoonAlloc?.excess || 0
  const morningExcessUsed = morningAlloc?.used || 0
  const afternoonExcessUsed = afternoonAlloc?.used || 0

  const shiftStateClass = (shift) => {
    if (shift === 'morning') {
      if (isMorningBoughtBack) return 'shift-bought-back'
      if (isMorningMet) return 'shift-met'
      if (isMorningUnmet && canBuyMorning) return 'shift-unmet-buyable'
      if (isMorningUnmet) return 'shift-unmet'
    } else {
      if (isAfternoonBoughtBack) return 'shift-bought-back'
      if (isAfternoonMet) return 'shift-met'
      if (isAfternoonUnmet && canBuyAfternoon) return 'shift-unmet-buyable'
      if (isAfternoonUnmet) return 'shift-unmet'
    }
    return ''
  }

  const hasAnyConfirmed = goal?.morningConfirmed || goal?.afternoonConfirmed

  return (
    <div className={cellClass} onClick={onClick}>
      <div className="day-number">
        {day}
        {goal?.adminConfirmed && hasAnyConfirmed && (
          <span className="admin-confirmed-check" title="Admin Verified">&#10003;</span>
        )}
      </div>
      {goal?.hasGoals && hasAnyConfirmed && (
        <div className="goals-display">
          <div className="shift-wages">
            {goal.morningConfirmed && (
              <div className={`shift ${shiftStateClass('morning')}`}>
                <span className="shift-label">A</span>
                {goal.morningAmount > 0 ? (
                  <span className="shift-target" title="Target">${goal.morningAmount.toLocaleString()}</span>
                ) : (
                  <span className="no-target-badge" title="No revenue target set">No Target Yet</span>
                )}
                <span className="shift-details">
                  <span className={`wage-value ${wageClass(goal.morningWage)}`}>${goal.morningWage}<span className="wage-suffix">/hr</span></span>
                  {isMorningMet && morningCommission > 0 && (
                    <span className="commission-inline" title="Standard 4.5%">+${morningCommission}</span>
                  )}
                  {morningExcess > 0 && (
                    <span
                      className={`excess-badge ${morningExcessUsed >= morningExcess ? 'excess-consumed' : morningExcessUsed > 0 ? 'excess-partial' : 'excess-available'}`}
                      title={morningExcessUsed > 0
                        ? `Excess: $${morningExcess.toLocaleString()} | Used: $${morningExcessUsed.toLocaleString()} | Remaining: $${(morningExcess - morningExcessUsed).toLocaleString()}`
                        : `Excess from this shift: $${morningExcess.toLocaleString()}`}
                    >
                      <span className="excess-badge-label">Excess</span>
                      <span className="excess-badge-amount">${morningExcess.toLocaleString()}</span>
                      {morningExcessUsed >= morningExcess && (
                        <span className="excess-badge-suffix">used</span>
                      )}
                      {morningExcessUsed > 0 && morningExcessUsed < morningExcess && (
                        <span className="excess-badge-detail">
                          <span className="excess-detail-used">−${morningExcessUsed.toLocaleString()}</span>
                          <span className="excess-detail-sep">&middot;</span>
                          <span className="excess-detail-remaining">${(morningExcess - morningExcessUsed).toLocaleString()} left</span>
                        </span>
                      )}
                      {morningExcessUsed > 0 && morningExcessUsed < morningExcess && (
                        <span className="excess-usage-bar">
                          <span className="excess-usage-fill" style={{ width: `${Math.min(100, Math.round(morningExcessUsed / morningExcess * 100))}%` }} />
                        </span>
                      )}
                    </span>
                  )}
                  {isMorningBoughtBack && morningBuyback.commission > 0 && (
                    <span className="commission-inline buyback-commission" title="Buyback 3.5%">+${morningBuyback.commission}</span>
                  )}
                  {isMorningUnmet && (
                    <span
                      className={`unmet-badge ${canBuyMorning ? 'buyable' : ''}`}
                      onClick={(e) => canBuyMorning && handleBuyback('morning', e)}
                      title={canBuyMorning ? 'Click to buy back' : `Unmet target: $${goal.morningAmount}`}
                    >
                      <span className="unmet-badge-label">Unmet</span>
                      <span className="unmet-badge-amount">${goal.morningAmount}</span>
                      {canBuyMorning && <span className="buyback-star">★</span>}
                    </span>
                  )}
                  {morningCustomCommission > 0 && (
                    <span className="commission-inline custom-commission" title={`Custom ${goal.morningCustomRate}%`}>+${morningCustomCommission}</span>
                  )}
                </span>
              </div>
            )}
            {goal.afternoonConfirmed && (
              <div className={`shift ${shiftStateClass('afternoon')}`}>
                <span className="shift-label">B</span>
                {goal.afternoonAmount > 0 ? (
                  <span className="shift-target" title="Target">${goal.afternoonAmount.toLocaleString()}</span>
                ) : (
                  <span className="no-target-badge" title="No revenue target set">No Target Yet</span>
                )}
                <span className="shift-details">
                  <span className={`wage-value ${wageClass(goal.afternoonWage)}`}>${goal.afternoonWage}<span className="wage-suffix">/hr</span></span>
                  {isAfternoonMet && afternoonCommission > 0 && (
                    <span className="commission-inline" title="Standard 4.5%">+${afternoonCommission}</span>
                  )}
                  {afternoonExcess > 0 && (
                    <span
                      className={`excess-badge ${afternoonExcessUsed >= afternoonExcess ? 'excess-consumed' : afternoonExcessUsed > 0 ? 'excess-partial' : 'excess-available'}`}
                      title={afternoonExcessUsed > 0
                        ? `Excess: $${afternoonExcess.toLocaleString()} | Used: $${afternoonExcessUsed.toLocaleString()} | Remaining: $${(afternoonExcess - afternoonExcessUsed).toLocaleString()}`
                        : `Excess from this shift: $${afternoonExcess.toLocaleString()}`}
                    >
                      <span className="excess-badge-label">Excess</span>
                      <span className="excess-badge-amount">${afternoonExcess.toLocaleString()}</span>
                      {afternoonExcessUsed >= afternoonExcess && (
                        <span className="excess-badge-suffix">used</span>
                      )}
                      {afternoonExcessUsed > 0 && afternoonExcessUsed < afternoonExcess && (
                        <span className="excess-badge-detail">
                          <span className="excess-detail-used">−${afternoonExcessUsed.toLocaleString()}</span>
                          <span className="excess-detail-sep">&middot;</span>
                          <span className="excess-detail-remaining">${(afternoonExcess - afternoonExcessUsed).toLocaleString()} left</span>
                        </span>
                      )}
                      {afternoonExcessUsed > 0 && afternoonExcessUsed < afternoonExcess && (
                        <span className="excess-usage-bar">
                          <span className="excess-usage-fill" style={{ width: `${Math.min(100, Math.round(afternoonExcessUsed / afternoonExcess * 100))}%` }} />
                        </span>
                      )}
                    </span>
                  )}
                  {isAfternoonBoughtBack && afternoonBuyback.commission > 0 && (
                    <span className="commission-inline buyback-commission" title="Buyback 3.5%">+${afternoonBuyback.commission}</span>
                  )}
                  {isAfternoonUnmet && (
                    <span
                      className={`unmet-badge ${canBuyAfternoon ? 'buyable' : ''}`}
                      onClick={(e) => canBuyAfternoon && handleBuyback('afternoon', e)}
                      title={canBuyAfternoon ? 'Click to buy back' : `Unmet target: $${goal.afternoonAmount}`}
                    >
                      <span className="unmet-badge-label">Unmet</span>
                      <span className="unmet-badge-amount">${goal.afternoonAmount}</span>
                      {canBuyAfternoon && <span className="buyback-star">★</span>}
                    </span>
                  )}
                  {afternoonCustomCommission > 0 && (
                    <span className="commission-inline custom-commission" title={`Custom ${goal.afternoonCustomRate}%`}>+${afternoonCustomCommission}</span>
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
