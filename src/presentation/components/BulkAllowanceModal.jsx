import { useState } from 'react'

export function BulkAllowanceModal({ goals, viewYear, viewMonth, onApply, onClose }) {
  const [selectedDays, setSelectedDays] = useState(new Set())
  const [allowanceAmount, setAllowanceAmount] = useState('')

  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Eligible: days with at least one confirmed shift
  // Determine which shift gets the allowance: A if available, otherwise B
  const eligibleDays = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
    const goal = goals[dateStr]
    if (goal?.hasGoals && (goal.morningConfirmed || goal.afternoonConfirmed)) {
      const targetShift = goal.morningConfirmed ? 'morning' : 'afternoon'
      const shiftLabel = targetShift === 'morning' ? 'A' : 'B'
      const currentAllowance = targetShift === 'morning'
        ? (goal.morningAllowance || null)
        : (goal.afternoonAllowance || null)
      eligibleDays.push({
        dateStr,
        day,
        label: `${viewMonth + 1}/${day}`,
        targetShift,
        shiftLabel,
        currentAllowance
      })
    }
  }

  // Sort days without an allowance to the top
  eligibleDays.sort((a, b) => {
    const aHas = a.currentAllowance ? 1 : 0
    const bHas = b.currentAllowance ? 1 : 0
    return aHas - bHas
  })

  const toggleDay = (dateStr) => {
    const next = new Set(selectedDays)
    if (next.has(dateStr)) next.delete(dateStr)
    else next.add(dateStr)
    setSelectedDays(next)
  }

  const toggleAll = () => {
    setSelectedDays(
      selectedDays.size === eligibleDays.length
        ? new Set()
        : new Set(eligibleDays.map(d => d.dateStr))
    )
  }

  const parsedAmount = allowanceAmount === '' ? null : Number(allowanceAmount)
  const isValidAmount = parsedAmount !== null && !isNaN(parsedAmount) && parsedAmount >= 0

  const handleApply = () => {
    if (selectedDays.size === 0 || !isValidAmount) return
    // Build per-day shift map so the hook knows which shift to assign
    const dayShiftMap = {}
    for (const item of eligibleDays) {
      if (selectedDays.has(item.dateStr)) {
        dayShiftMap[item.dateStr] = item.targetShift
      }
    }
    onApply([...selectedDays], parsedAmount, dayShiftMap)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-bulk-location" onClick={e => e.stopPropagation()}>
        <h2>Set Shift Allowance</h2>

        <div className="bulk-location-picker">
          <label>Allowance ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="location-select"
            value={allowanceAmount}
            onChange={(e) => setAllowanceAmount(e.target.value)}
            placeholder="0"
          />
        </div>

        {eligibleDays.length === 0 ? (
          <div className="no-targets">
            <p>No confirmed shifts this month.</p>
          </div>
        ) : (
          <>
            <div className="bulk-select-all" onClick={toggleAll}>
              <span>{selectedDays.size === eligibleDays.length ? 'Deselect All' : 'Select All'}</span>
            </div>

            <div className="targets-list">
              {eligibleDays.map((item) => {
                const isSelected = selectedDays.has(item.dateStr)
                return (
                  <div
                    key={item.dateStr}
                    className={`target-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleDay(item.dateStr)}
                  >
                    <div className="target-label">
                      {item.label}
                      <span className="bulk-shifts-badge">{item.shiftLabel}</span>
                    </div>
                    <div className="target-details">
                      {item.currentAllowance != null && item.currentAllowance > 0 && (
                        <div className="bulk-current-location">${item.currentAllowance}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="save-btn"
            onClick={handleApply}
            disabled={selectedDays.size === 0 || !isValidAmount}
          >
            Apply to {selectedDays.size} Day{selectedDays.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
