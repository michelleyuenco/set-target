import { calculateDayEarnings, getShiftData } from '../../application/services/earningsCalculator'

export function WageBreakdownModal({ day, goal, onClose }) {
  if (!goal?.hasGoals) return null

  const hasMorning = goal.morningConfirmed
  const hasAfternoon = goal.afternoonConfirmed

  if (!hasMorning && !hasAfternoon) return null

  const morningShift = getShiftData(goal, 'morning')
  const afternoonShift = getShiftData(goal, 'afternoon')
  const { morning, afternoon, totals } = calculateDayEarnings(goal)

  const morningHours = morningShift.hours
  const afternoonHours = afternoonShift.hours
  const morningWage = morningShift.wage
  const afternoonWage = afternoonShift.wage

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

  const morningLabor = morning.labor
  const afternoonLabor = afternoon.labor
  const morningCommission = morning.standardCommission
  const afternoonCommission = afternoon.standardCommission
  const morningIg = morning.ig
  const afternoonIg = afternoon.ig
  const morningBuyback = { amount: morning.buybackAmount, commission: morning.buybackCommission }
  const afternoonBuyback = { amount: afternoon.buybackAmount, commission: afternoon.buybackCommission }
  const morningCustom = { rate: morning.customRate, amount: morning.customAmount, commission: morning.customCommission }
  const afternoonCustom = { rate: afternoon.customRate, amount: afternoon.customAmount, commission: afternoon.customCommission }
  const morningAllowance = morning.allowance
  const afternoonAllowance = afternoon.allowance

  const totalLabor = totals.labor
  const totalCommission45 = totals.standardCommission
  const totalIgCommission = totals.igCommission
  const totalBuybackCommission = totals.buybackCommission
  const totalCustomCommission = totals.customCommission
  const totalAllowance = totals.allowance
  const grandTotal = totals.total

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
