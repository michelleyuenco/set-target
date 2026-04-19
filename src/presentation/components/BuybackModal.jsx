import { useState, useEffect } from 'react'
import { DEFAULT_MORNING_END, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'

export function BuybackModal({ goals, viewYear, viewMonth, availableExcess, onBuyback, onClose }) {
  const [selectedTargets, setSelectedTargets] = useState(new Set())
  const [now, setNow] = useState(() => new Date())

  // Real-time clock for shift-end gating
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const isShiftEnded = (dateStr, endTime) => {
    const [endH, endM] = endTime.split(':').map(Number)
    const [y, m, d] = dateStr.split('-').map(Number)
    const shiftEnd = new Date(y, m - 1, d, endH, endM, 0, 0)
    return now >= shiftEnd
  }

  // Get all unmet targets - only for confirmed shifts whose shift has ended
  const unmetTargets = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
    const goal = goals[dateStr]

    if (goal?.hasGoals) {
      // Morning shift: confirmed, unmet, not bought back, and shift has ended
      if (goal.morningConfirmed && goal.morningAmount && goal.morningCalculatedWage !== 80 && !goal.morningBoughtBack
        && isShiftEnded(dateStr, goal.morningEndTime || DEFAULT_MORNING_END)) {
        unmetTargets.push({
          dateStr,
          shift: 'morning',
          amount: goal.morningAmount,
          label: `${viewMonth + 1}/${day} Shift A`,
          displayAmount: `$${goal.morningAmount.toLocaleString()}`
        })
      }

      // Afternoon shift: confirmed, unmet, not bought back, and shift has ended
      if (goal.afternoonConfirmed && goal.afternoonAmount && goal.afternoonCalculatedWage !== 80 && !goal.afternoonBoughtBack
        && isShiftEnded(dateStr, goal.afternoonEndTime || DEFAULT_AFTERNOON_END)) {
        unmetTargets.push({
          dateStr,
          shift: 'afternoon',
          amount: goal.afternoonAmount,
          label: `${viewMonth + 1}/${day} Shift B`,
          displayAmount: `$${goal.afternoonAmount.toLocaleString()}`
        })
      }
    }
  }

  const toggleTarget = (target) => {
    const key = `${target.dateStr}-${target.shift}`
    const newSelected = new Set(selectedTargets)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedTargets(newSelected)
  }

  const calculateTotalCost = () => {
    let total = 0
    unmetTargets.forEach(target => {
      const key = `${target.dateStr}-${target.shift}`
      if (selectedTargets.has(key)) {
        total += target.amount
      }
    })
    return total
  }

  const calculateCommission = () => {
    return calculateTotalCost() * 0.035
  }

  const totalCost = calculateTotalCost()
  const commission = calculateCommission()
  const canAfford = totalCost <= availableExcess

  const handleBuyback = () => {
    if (!canAfford || totalCost === 0) return

    const purchases = []
    unmetTargets.forEach(target => {
      const key = `${target.dateStr}-${target.shift}`
      if (selectedTargets.has(key)) {
        purchases.push({ dateStr: target.dateStr, shift: target.shift })
      }
    })

    onBuyback(purchases)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-buyback" onClick={e => e.stopPropagation()}>
        <h2>Buyback Unmet Targets</h2>
        <div className="buyback-info">
          <div className="info-row">
            <span>Available Excess Revenue:</span>
            <span className="info-value">${availableExcess.toLocaleString()}</span>
          </div>
        </div>

        {unmetTargets.length === 0 ? (
          <div className="no-targets">
            <p>No unmet targets available for buyback.</p>
          </div>
        ) : (
          <>
            <div className="targets-list">
              {unmetTargets.map((target) => {
                const key = `${target.dateStr}-${target.shift}`
                const isSelected = selectedTargets.has(key)
                return (
                  <div
                    key={key}
                    className={`target-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTarget(target)}
                  >
                    <div className="target-label">{target.label}</div>
                    <div className="target-details">
                      <div className="target-amount">{target.displayAmount}</div>
                      <div className="target-commission">
                        +${(target.amount * 0.035).toFixed(2)} (3.5%)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="buyback-summary">
              <div className="summary-row">
                <span>Total Cost:</span>
                <span className="summary-value">${totalCost.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Commission Earned (3.5%):</span>
                <span className="summary-value commission">+${commission.toFixed(2)}</span>
              </div>
              {!canAfford && totalCost > 0 && (
                <div className="warning">Insufficient excess revenue!</div>
              )}
            </div>
          </>
        )}

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="save-btn"
            onClick={handleBuyback}
            disabled={!canAfford || totalCost === 0}
          >
            Buy Selected ({selectedTargets.size})
          </button>
        </div>
      </div>
    </div>
  )
}
