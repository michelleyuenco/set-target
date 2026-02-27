import { useState } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function fmt(n) {
  return '$' + Math.round(n).toLocaleString()
}

export function LocationPerformanceModal({ stats, loading, year, month, onClose }) {
  const [expanded, setExpanded] = useState({}) // { [locationName]: bool }

  const toggle = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }))

  const sorted = stats
    ? Object.entries(stats).sort(([nameA, a], [nameB, b]) => {
        if (nameA === '(No Location)') return 1
        if (nameB === '(No Location)') return -1
        return b.totalActual - a.totalActual
      })
    : []

  const grandActual = sorted.reduce((s, [, v]) => s + v.totalActual, 0)
  const grandShifts = sorted.reduce((s, [, v]) => s + v.shiftCount, 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal loc-perf-modal" onClick={e => e.stopPropagation()}>

        <h2 className="loc-perf-title">
          Location Performance
          <span className="loc-perf-month">{MONTH_NAMES[month]} {year}</span>
        </h2>

        {loading && <div className="loc-perf-loading">Loading...</div>}

        {!loading && stats && (
          <>
            {sorted.length === 0 ? (
              <div className="loc-perf-empty">
                No admin-confirmed shifts found for this month.
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div className="loc-perf-summary-row">
                  <span className="loc-perf-summary-label">All Locations</span>
                  <span className="loc-perf-summary-stat">{grandShifts} shifts</span>
                  <span className="loc-perf-summary-stat actual">{fmt(grandActual)} actual</span>
                </div>

                <div className="loc-perf-list">
                  {sorted.map(([name, loc]) => (
                    <div key={name} className="loc-perf-item">
                      {/* Location header row */}
                      <button
                        className="loc-perf-row"
                        onClick={() => toggle(name)}
                      >
                        <span className={`loc-perf-name ${name === '(No Location)' ? 'loc-perf-name-unset' : ''}`}>{name}</span>
                        <span className="loc-perf-shifts">{loc.shiftCount} shift{loc.shiftCount !== 1 ? 's' : ''}</span>
                        <span className="loc-perf-actual">{fmt(loc.totalActual)}</span>
                        <span className="loc-perf-chevron">{expanded[name] ? '▲' : '▼'}</span>
                      </button>

                      {/* Expanded: per-member breakdown */}
                      {expanded[name] && (
                        <div className="loc-perf-members">
                          {loc.members.map(member => (
                            <div key={member.uid} className="loc-perf-member-row">
                              <span className="loc-perf-member-name">{member.displayName}</span>
                              <span className="loc-perf-member-shifts">
                                {member.shifts.length} shift{member.shifts.length !== 1 ? 's' : ''}
                              </span>
                              <span className="loc-perf-member-actual">{fmt(member.totalActual)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
