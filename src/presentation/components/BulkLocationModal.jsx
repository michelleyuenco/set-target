import { useState } from 'react'

export function BulkLocationModal({ goals, viewYear, viewMonth, locations, onApply, onClose }) {
  const [selectedDays, setSelectedDays] = useState(new Set())
  const [selectedLocation, setSelectedLocation] = useState('')

  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Build list of days that have at least one confirmed shift
  const eligibleDays = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
    const goal = goals[dateStr]
    if (goal?.hasGoals && (goal.morningConfirmed || goal.afternoonConfirmed)) {
      const shifts = []
      if (goal.morningConfirmed) shifts.push('A')
      if (goal.afternoonConfirmed) shifts.push('B')
      const morningLoc = goal.morningConfirmed ? goal.morningLocation : null
      const afternoonLoc = goal.afternoonConfirmed ? goal.afternoonLocation : null
      let currentLocation = null
      if (goal.morningConfirmed && goal.afternoonConfirmed) {
        if (morningLoc && afternoonLoc && morningLoc === afternoonLoc) {
          currentLocation = morningLoc
        } else if (morningLoc || afternoonLoc) {
          currentLocation = `A: ${morningLoc || '—'} / B: ${afternoonLoc || '—'}`
        }
      } else {
        currentLocation = morningLoc || afternoonLoc
      }

      eligibleDays.push({
        dateStr,
        day,
        shifts,
        label: `${viewMonth + 1}/${day}`,
        currentLocation
      })
    }
  }

  // Sort days with missing locations to the top
  eligibleDays.sort((a, b) => {
    const aMissing = !a.currentLocation || a.currentLocation.includes('—') ? 0 : 1
    const bMissing = !b.currentLocation || b.currentLocation.includes('—') ? 0 : 1
    return aMissing - bMissing
  })

  const toggleDay = (dateStr) => {
    const newSelected = new Set(selectedDays)
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr)
    } else {
      newSelected.add(dateStr)
    }
    setSelectedDays(newSelected)
  }

  const toggleAll = () => {
    if (selectedDays.size === eligibleDays.length) {
      setSelectedDays(new Set())
    } else {
      setSelectedDays(new Set(eligibleDays.map(d => d.dateStr)))
    }
  }

  const handleApply = () => {
    if (selectedDays.size === 0 || !selectedLocation) return
    onApply([...selectedDays], selectedLocation)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-bulk-location" onClick={e => e.stopPropagation()}>
        <h2>Set Shift Locations</h2>

        <div className="bulk-location-picker">
          <label>Location</label>
          <select
            className="location-select"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">-- Select location --</option>
            {(locations || []).map((loc) => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
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
                      <span className="bulk-shifts-badge">
                        {item.shifts.join(' + ')}
                      </span>
                    </div>
                    <div className="target-details">
                      {item.currentLocation && (
                        <div className="bulk-current-location">{item.currentLocation}</div>
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
            disabled={selectedDays.size === 0 || !selectedLocation}
          >
            Apply to {selectedDays.size} Day{selectedDays.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
