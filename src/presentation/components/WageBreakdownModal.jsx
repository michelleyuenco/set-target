import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'

export function WageBreakdownModal({ day, goal, onClose }) {
  if (!goal?.hasGoals) return null

  const hasMorning = goal.morningConfirmed
  const hasAfternoon = goal.afternoonConfirmed

  if (!hasMorning && !hasAfternoon) return null

  // Use actual shift hours from goal, falling back to default
  const morningHours = goal.morningShiftHours ?? DEFAULT_SHIFT_HOURS
  const afternoonHours = goal.afternoonShiftHours ?? DEFAULT_SHIFT_HOURS

  const formatTime12 = (time24) => {
    const [h, m] = time24.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  }

  const formatHoursLabel = (hours) => {
    return Math.round(hours * 100) / 100
  }

  const morningTimeLabel = `${formatTime12(goal.morningStartTime)} - ${formatTime12(goal.morningEndTime)}`
  const afternoonTimeLabel = `${formatTime12(goal.afternoonStartTime)} - ${formatTime12(goal.afternoonEndTime)}`

  const morningWage = goal.morningWage || 65
  const afternoonWage = goal.afternoonWage || 65
  const morningLabor = hasMorning ? Math.round(morningWage * morningHours * 100) / 100 : 0
  const afternoonLabor = hasAfternoon ? Math.round(afternoonWage * afternoonHours * 100) / 100 : 0

  // IG detection
  const morningHasIg = hasMorning && ((goal.morningIgFeaturedAmount || 0) > 0 || (goal.morningIgOtherAmount || 0) > 0)
  const afternoonHasIg = hasAfternoon && ((goal.afternoonIgFeaturedAmount || 0) > 0 || (goal.afternoonIgOtherAmount || 0) > 0)

  const getMorningIgCommission = () => {
    if (!morningHasIg) return { featured: 0, other: 0, featuredCommission: 0, otherCommission: 0, total: 0 }
    const featured = goal.morningIgFeaturedAmount || 0
    const other = goal.morningIgOtherAmount || 0
    return {
      featured, other,
      featuredCommission: Math.round(featured * 0.07 * 100) / 100,
      otherCommission: Math.round(other * 0.05 * 100) / 100,
      total: Math.round((featured * 0.07 + other * 0.05) * 100) / 100
    }
  }

  const getAfternoonIgCommission = () => {
    if (!afternoonHasIg) return { featured: 0, other: 0, featuredCommission: 0, otherCommission: 0, total: 0 }
    const featured = goal.afternoonIgFeaturedAmount || 0
    const other = goal.afternoonIgOtherAmount || 0
    return {
      featured, other,
      featuredCommission: Math.round(featured * 0.07 * 100) / 100,
      otherCommission: Math.round(other * 0.05 * 100) / 100,
      total: Math.round((featured * 0.07 + other * 0.05) * 100) / 100
    }
  }

  const getMorningCommission = () => {
    if (morningHasIg) return 0
    if (hasMorning && goal.morningCalculatedWage === 80 && goal.morningActual > 0) {
      return Math.round(goal.morningAmount * 0.045 * 100) / 100
    }
    return 0
  }

  const getAfternoonCommission = () => {
    if (afternoonHasIg) return 0
    if (hasAfternoon && goal.afternoonCalculatedWage === 80 && goal.afternoonActual > 0) {
      return Math.round(goal.afternoonAmount * 0.045 * 100) / 100
    }
    return 0
  }

  const getMorningBuyback = () => {
    if (hasMorning && goal.morningBoughtBack && goal.morningAmount) {
      return {
        amount: goal.morningAmount,
        commission: morningHasIg ? 0 : Math.round(goal.morningAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  const getAfternoonBuyback = () => {
    if (hasAfternoon && goal.afternoonBoughtBack && goal.afternoonAmount) {
      return {
        amount: goal.afternoonAmount,
        commission: afternoonHasIg ? 0 : Math.round(goal.afternoonAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  const getMorningCustomCommission = () => {
    if (hasMorning && goal.morningCustomRate && goal.morningCustomAmount) {
      return {
        rate: goal.morningCustomRate,
        amount: goal.morningCustomAmount,
        commission: Math.round(goal.morningCustomAmount * (goal.morningCustomRate / 100) * 100) / 100
      }
    }
    return { rate: 0, amount: 0, commission: 0 }
  }

  const getAfternoonCustomCommission = () => {
    if (hasAfternoon && goal.afternoonCustomRate && goal.afternoonCustomAmount) {
      return {
        rate: goal.afternoonCustomRate,
        amount: goal.afternoonCustomAmount,
        commission: Math.round(goal.afternoonCustomAmount * (goal.afternoonCustomRate / 100) * 100) / 100
      }
    }
    return { rate: 0, amount: 0, commission: 0 }
  }

  const morningCommission = getMorningCommission()
  const afternoonCommission = getAfternoonCommission()
  const morningIg = getMorningIgCommission()
  const afternoonIg = getAfternoonIgCommission()
  const morningBuyback = getMorningBuyback()
  const afternoonBuyback = getAfternoonBuyback()
  const morningCustom = getMorningCustomCommission()
  const afternoonCustom = getAfternoonCustomCommission()

  const morningAllowance = (hasMorning && goal.morningAllowance) ? goal.morningAllowance : 0
  const afternoonAllowance = (hasAfternoon && goal.afternoonAllowance) ? goal.afternoonAllowance : 0
  const totalAllowance = Math.round((morningAllowance + afternoonAllowance) * 100) / 100

  const totalLabor = Math.round((morningLabor + afternoonLabor) * 100) / 100
  const totalCommission45 = Math.round((morningCommission + afternoonCommission) * 100) / 100
  const totalIgCommission = Math.round((morningIg.total + afternoonIg.total) * 100) / 100
  const totalBuybackCommission = Math.round((morningBuyback.commission + afternoonBuyback.commission) * 100) / 100
  const totalCustomCommission = Math.round((morningCustom.commission + afternoonCustom.commission) * 100) / 100
  const grandTotal = Math.round((totalLabor + totalCommission45 + totalIgCommission + totalBuybackCommission + totalCustomCommission + totalAllowance) * 100) / 100

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wage-breakdown-modal" onClick={e => e.stopPropagation()}>
        <h2>Wage Breakdown</h2>
        <div className="breakdown-date">{day}</div>

        <div className="breakdown-sections">
          {hasMorning && (
            <div className="breakdown-section">
              <div className="section-header">Shift A ({morningTimeLabel})</div>
              <div className="breakdown-row">
                <span className="breakdown-label">{goal.morningCustomWage !== null ? <span className="custom-wage-tag">Custom</span> : null}${morningWage}/hr × {formatHoursLabel(morningHours)} hours</span>
                <span className="breakdown-value">${morningLabor.toFixed(2)}</span>
              </div>
              {morningIg.total > 0 && (
                <>
                  {morningIg.featuredCommission > 0 && (
                    <div className="breakdown-row commission-row ig-commission-row">
                      <span className="breakdown-label">IG Featured (7%)</span>
                      <span className="breakdown-value commission">+${morningIg.featuredCommission.toFixed(2)}</span>
                    </div>
                  )}
                  {morningIg.otherCommission > 0 && (
                    <div className="breakdown-row commission-row ig-commission-row">
                      <span className="breakdown-label">IG Other (5%)</span>
                      <span className="breakdown-value commission">+${morningIg.otherCommission.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {morningCommission > 0 && (
                <div className="breakdown-row commission-row">
                  <span className="breakdown-label">Commission (4.5%)</span>
                  <span className="breakdown-value commission">+${morningCommission.toFixed(2)}</span>
                </div>
              )}
              {morningBuyback.amount > 0 && (
                <>
                  <div className="breakdown-row buyback-row">
                    <span className="breakdown-label">Target Bought Back</span>
                    <span className="breakdown-value buyback-info">${morningBuyback.amount.toFixed(2)}</span>
                  </div>
                  {morningBuyback.commission > 0 && (
                    <div className="breakdown-row commission-row">
                      <span className="breakdown-label">Buyback Commission (3.5%)</span>
                      <span className="breakdown-value commission">+${morningBuyback.commission.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {morningCustom.commission > 0 && (
                <div className="breakdown-row commission-row">
                  <span className="breakdown-label">Custom Commission ({morningCustom.rate}%)</span>
                  <span className="breakdown-value commission">+${morningCustom.commission.toFixed(2)}</span>
                </div>
              )}
              {morningAllowance > 0 && (
                <div className="breakdown-row allowance-row">
                  <span className="breakdown-label">Allowance</span>
                  <span className="breakdown-value allowance">+${morningAllowance.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {hasAfternoon && (
            <div className="breakdown-section">
              <div className="section-header">Shift B ({afternoonTimeLabel})</div>
              <div className="breakdown-row">
                <span className="breakdown-label">{goal.afternoonCustomWage !== null ? <span className="custom-wage-tag">Custom</span> : null}${afternoonWage}/hr × {formatHoursLabel(afternoonHours)} hours</span>
                <span className="breakdown-value">${afternoonLabor.toFixed(2)}</span>
              </div>
              {afternoonIg.total > 0 && (
                <>
                  {afternoonIg.featuredCommission > 0 && (
                    <div className="breakdown-row commission-row ig-commission-row">
                      <span className="breakdown-label">IG Featured (7%)</span>
                      <span className="breakdown-value commission">+${afternoonIg.featuredCommission.toFixed(2)}</span>
                    </div>
                  )}
                  {afternoonIg.otherCommission > 0 && (
                    <div className="breakdown-row commission-row ig-commission-row">
                      <span className="breakdown-label">IG Other (5%)</span>
                      <span className="breakdown-value commission">+${afternoonIg.otherCommission.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {afternoonCommission > 0 && (
                <div className="breakdown-row commission-row">
                  <span className="breakdown-label">Commission (4.5%)</span>
                  <span className="breakdown-value commission">+${afternoonCommission.toFixed(2)}</span>
                </div>
              )}
              {afternoonBuyback.amount > 0 && (
                <>
                  <div className="breakdown-row buyback-row">
                    <span className="breakdown-label">Target Bought Back</span>
                    <span className="breakdown-value buyback-info">${afternoonBuyback.amount.toFixed(2)}</span>
                  </div>
                  {afternoonBuyback.commission > 0 && (
                    <div className="breakdown-row commission-row">
                      <span className="breakdown-label">Buyback Commission (3.5%)</span>
                      <span className="breakdown-value commission">+${afternoonBuyback.commission.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {afternoonCustom.commission > 0 && (
                <div className="breakdown-row commission-row">
                  <span className="breakdown-label">Custom Commission ({afternoonCustom.rate}%)</span>
                  <span className="breakdown-value commission">+${afternoonCustom.commission.toFixed(2)}</span>
                </div>
              )}
              {afternoonAllowance > 0 && (
                <div className="breakdown-row allowance-row">
                  <span className="breakdown-label">Allowance</span>
                  <span className="breakdown-value allowance">+${afternoonAllowance.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="breakdown-summary">
            <div className="summary-row">
              <span className="summary-label">Labor Total:</span>
              <span className="summary-value">${totalLabor.toFixed(2)}</span>
            </div>
            {totalIgCommission > 0 && (
              <div className="summary-row">
                <span className="summary-label">IG Commission (7%/5%):</span>
                <span className="summary-value commission">+${totalIgCommission.toFixed(2)}</span>
              </div>
            )}
            {totalCommission45 > 0 && (
              <div className="summary-row">
                <span className="summary-label">Commission (4.5%):</span>
                <span className="summary-value commission">+${totalCommission45.toFixed(2)}</span>
              </div>
            )}
            {totalBuybackCommission > 0 && (
              <div className="summary-row">
                <span className="summary-label">Buyback Commission (3.5%):</span>
                <span className="summary-value commission">+${totalBuybackCommission.toFixed(2)}</span>
              </div>
            )}
            {totalCustomCommission > 0 && (
              <div className="summary-row">
                <span className="summary-label">Custom Commission:</span>
                <span className="summary-value commission">+${totalCustomCommission.toFixed(2)}</span>
              </div>
            )}
            {totalAllowance > 0 && (
              <div className="summary-row">
                <span className="summary-label">Allowance:</span>
                <span className="summary-value allowance">+${totalAllowance.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-total">
              <span className="total-label">Daily Total:</span>
              <span className="total-value">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="button-group">
          <button className="save-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
