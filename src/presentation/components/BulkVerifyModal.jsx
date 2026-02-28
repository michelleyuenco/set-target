import { useState } from 'react'

export function BulkVerifyModal({ goals, viewYear, viewMonth, onApply, onClose }) {
  const [selectedDays, setSelectedDays] = useState(new Set())

  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Eligible: at least one user-confirmed shift that is NOT yet admin-verified
  const eligibleDays = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
    const goal = goals[dateStr]
    if (!goal?.hasGoals) continue

    const pendingMorning = goal.morningConfirmed && !goal.morningAdminConfirmed
    const pendingAfternoon = goal.afternoonConfirmed && !goal.afternoonAdminConfirmed
    if (!pendingMorning && !pendingAfternoon) continue

    const pending = []
    const verified = []
    if (goal.morningConfirmed) (goal.morningAdminConfirmed ? verified : pending).push('A')
    if (goal.afternoonConfirmed) (goal.afternoonAdminConfirmed ? verified : pending).push('B')

    eligibleDays.push({ dateStr, day, label: `${viewMonth + 1}/${day}`, pending, verified })
  }

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

  const handleApply = () => {
    if (selectedDays.size === 0) return
    onApply([...selectedDays])
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-bulk-location" onClick={e => e.stopPropagation()}>
        <h2>Bulk Verify Shifts</h2>

        {eligibleDays.length === 0 ? (
          <div className="no-targets">
            <p>No unverified shifts this month.</p>
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
                      <span className="bulk-shifts-badge bulk-shifts-pending">
                        {item.pending.join(' + ')}
                      </span>
                    </div>
                    {item.verified.length > 0 && (
                      <div className="target-details">
                        <span className="bulk-already-verified">&#10003; {item.verified.join(' + ')}</span>
                      </div>
                    )}
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
            disabled={selectedDays.size === 0}
          >
            Verify {selectedDays.size} Day{selectedDays.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
