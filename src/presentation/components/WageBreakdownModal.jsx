export function WageBreakdownModal({ day, goal, onClose }) {
  if (!goal?.hasGoals) return null

  // Shift hours: 11:50 AM - 4:00 PM and 4:00 PM - 8:10 PM = 4h 10m each
  const SHIFT_HOURS = 4 + (10 / 60) // 4.167 hours

  const morningWage = goal.morningWage || 65
  const afternoonWage = goal.afternoonWage || 65
  const morningLabor = Math.round(morningWage * SHIFT_HOURS * 100) / 100
  const afternoonLabor = Math.round(afternoonWage * SHIFT_HOURS * 100) / 100

  // Calculate 4.5% commissions (naturally met targets)
  const getMorningCommission = () => {
    if (goal.morningWage === 80 && goal.morningActual > 0) {
      return Math.round(goal.morningActual * 0.045 * 100) / 100
    }
    return 0
  }

  const getAfternoonCommission = () => {
    if (goal.afternoonWage === 80 && goal.afternoonActual > 0) {
      return Math.round(goal.afternoonActual * 0.045 * 100) / 100
    }
    return 0
  }

  // Calculate buyback amounts and 3.5% commissions
  const getMorningBuyback = () => {
    if (goal.morningBoughtBack && goal.morningAmount) {
      return {
        amount: goal.morningAmount,
        commission: Math.round(goal.morningAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  const getAfternoonBuyback = () => {
    if (goal.afternoonBoughtBack && goal.afternoonAmount) {
      return {
        amount: goal.afternoonAmount,
        commission: Math.round(goal.afternoonAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  // Calculate custom commissions
  const getMorningCustomCommission = () => {
    if (goal.morningCustomRate && goal.morningCustomAmount) {
      return {
        rate: goal.morningCustomRate,
        amount: goal.morningCustomAmount,
        commission: Math.round(goal.morningCustomAmount * (goal.morningCustomRate / 100) * 100) / 100
      }
    }
    return { rate: 0, amount: 0, commission: 0 }
  }

  const getAfternoonCustomCommission = () => {
    if (goal.afternoonCustomRate && goal.afternoonCustomAmount) {
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
  const morningBuyback = getMorningBuyback()
  const afternoonBuyback = getAfternoonBuyback()
  const morningCustom = getMorningCustomCommission()
  const afternoonCustom = getAfternoonCustomCommission()

  const totalLabor = Math.round((morningLabor + afternoonLabor) * 100) / 100
  const totalCommission45 = Math.round((morningCommission + afternoonCommission) * 100) / 100
  const totalBuybackCommission = Math.round((morningBuyback.commission + afternoonBuyback.commission) * 100) / 100
  const totalCustomCommission = Math.round((morningCustom.commission + afternoonCustom.commission) * 100) / 100
  const grandTotal = Math.round((totalLabor + totalCommission45 + totalBuybackCommission + totalCustomCommission) * 100) / 100

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wage-breakdown-modal" onClick={e => e.stopPropagation()}>
        <h2>Wage Breakdown</h2>
        <div className="breakdown-date">{day}</div>

        <div className="breakdown-sections">
          {/* Morning Shift */}
          <div className="breakdown-section">
            <div className="section-header">Morning Shift (11:50 AM - 4:00 PM)</div>
            <div className="breakdown-row">
              <span className="breakdown-label">${morningWage}/hr × 4.17 hours</span>
              <span className="breakdown-value">${morningLabor.toFixed(2)}</span>
            </div>
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
                <div className="breakdown-row commission-row">
                  <span className="breakdown-label">Buyback Commission (3.5%)</span>
                  <span className="breakdown-value commission">+${morningBuyback.commission.toFixed(2)}</span>
                </div>
              </>
            )}
            {morningCustom.commission > 0 && (
              <div className="breakdown-row commission-row">
                <span className="breakdown-label">Custom Commission ({morningCustom.rate}%)</span>
                <span className="breakdown-value commission">+${morningCustom.commission.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Afternoon Shift */}
          <div className="breakdown-section">
            <div className="section-header">Afternoon Shift (4:00 PM - 8:10 PM)</div>
            <div className="breakdown-row">
              <span className="breakdown-label">${afternoonWage}/hr × 4.17 hours</span>
              <span className="breakdown-value">${afternoonLabor.toFixed(2)}</span>
            </div>
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
                <div className="breakdown-row commission-row">
                  <span className="breakdown-label">Buyback Commission (3.5%)</span>
                  <span className="breakdown-value commission">+${afternoonBuyback.commission.toFixed(2)}</span>
                </div>
              </>
            )}
            {afternoonCustom.commission > 0 && (
              <div className="breakdown-row commission-row">
                <span className="breakdown-label">Custom Commission ({afternoonCustom.rate}%)</span>
                <span className="breakdown-value commission">+${afternoonCustom.commission.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="breakdown-summary">
            <div className="summary-row">
              <span className="summary-label">Labor Total:</span>
              <span className="summary-value">${totalLabor.toFixed(2)}</span>
            </div>
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
