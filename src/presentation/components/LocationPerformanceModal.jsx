import { useState } from 'react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function fmt(n) {
  return '$' + Math.round(n).toLocaleString()
}

function pct(hit, total) {
  if (total === 0) return '0%'
  return Math.round((hit / total) * 100) + '%'
}

export function LocationPerformanceModal({ stats, teamBonus, loading, year, month, members, onLoadStats, onClose }) {
  const [expanded, setExpanded] = useState({ '(No Location)': true })
  const [modalYear, setModalYear] = useState(year)
  const [modalMonth, setModalMonth] = useState(month)

  const toggle = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }))

  const handlePrev = () => {
    const pm = modalMonth === 0 ? 11 : modalMonth - 1
    const py = modalMonth === 0 ? modalYear - 1 : modalYear
    setModalYear(py)
    setModalMonth(pm)
    onLoadStats(py, pm)
  }

  const handleNext = () => {
    const now = new Date()
    const isCurrentMonth = modalYear === now.getFullYear() && modalMonth === now.getMonth()
    if (isCurrentMonth) return
    const nm = modalMonth === 11 ? 0 : modalMonth + 1
    const ny = modalMonth === 11 ? modalYear + 1 : modalYear
    setModalYear(ny)
    setModalMonth(nm)
    onLoadStats(ny, nm)
  }

  const now = new Date()
  const canGoNext = !(modalYear === now.getFullYear() && modalMonth === now.getMonth())

  const sorted = stats
    ? Object.entries(stats).sort(([nameA, a], [nameB, b]) => {
        if (nameA === '(No Location)') return 1
        if (nameB === '(No Location)') return -1
        return b.totalActual - a.totalActual
      })
    : []

  const grandActual = sorted.reduce((s, [, v]) => s + v.totalActual, 0)
  const grandTarget = sorted.reduce((s, [, v]) => s + v.totalTarget, 0)
  const grandShifts = sorted.reduce((s, [, v]) => s + v.shiftCount, 0)
  const grandHits = sorted.reduce((s, [, v]) => s + (v.hitCount || 0), 0)
  const grandSalaryCost = sorted.reduce((s, [, v]) => s + (v.totalSalaryCost || 0), 0)
  const grandBonusCost = sorted.reduce((s, [name]) => s + (teamBonus?.locations?.[name]?.amount || 0), 0)
  const achievementPct = grandTarget > 0 ? Math.round((grandActual / grandTarget) * 100) : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal loc-perf-modal" onClick={e => e.stopPropagation()}>

        <div className="loc-perf-header">
          <h2 className="loc-perf-title">Monthly Performance</h2>
          {!loading && (
            <button className="loc-perf-refresh-btn" onClick={() => onLoadStats(modalYear, modalMonth)} title="Reload data">
              &#8635;
            </button>
          )}
        </div>

        <div className="loc-perf-month-nav">
          <button className="loc-perf-nav-btn" onClick={handlePrev}>&larr;</button>
          <span className="loc-perf-month-label">{MONTH_NAMES[modalMonth]} {modalYear}</span>
          <button className="loc-perf-nav-btn" onClick={handleNext} disabled={!canGoNext}>&rarr;</button>
        </div>

        {loading && <div className="loc-perf-loading">Loading...</div>}

        {!loading && !stats && (
          <div className="loc-perf-empty">No data loaded.</div>
        )}

        {!loading && stats && (
          <>
            {sorted.length === 0 ? (
              <div className="loc-perf-empty">
                No confirmed shifts found for this month.
              </div>
            ) : (
              <>
                {/* Overall monthly summary */}
                <div className="loc-perf-overall">
                  <div className="loc-perf-overall-title">Overall Performance</div>
                  <div className="loc-perf-overall-stats">
                    <div className="loc-perf-stat-box">
                      <span className="loc-perf-stat-value">{grandShifts}</span>
                      <span className="loc-perf-stat-label">Shifts</span>
                    </div>
                    <div className="loc-perf-stat-box">
                      <span className={`loc-perf-stat-value ${achievementPct >= 100 ? 'hit-perfect' : ''}`}>
                        {achievementPct}%
                      </span>
                      <span className="loc-perf-stat-label">Achievement</span>
                    </div>
                    <div className="loc-perf-stat-box">
                      <span className="loc-perf-stat-value">{fmt(grandActual)}</span>
                      <span className="loc-perf-stat-label">Actual</span>
                    </div>
                    <div className="loc-perf-stat-box">
                      <span className={`loc-perf-stat-value ${grandHits === grandShifts && grandShifts > 0 ? 'hit-perfect' : ''}`}>
                        {pct(grandHits, grandShifts)}
                      </span>
                      <span className="loc-perf-stat-label">Hit Rate</span>
                    </div>
                  </div>
                  {grandTarget > 0 && (
                    <>
                      <div className="loc-perf-progress-bar">
                        <div
                          className={`loc-perf-progress-fill ${grandActual >= grandTarget ? 'met' : ''}`}
                          style={{ width: `${Math.min(100, (grandActual / grandTarget) * 100)}%` }}
                        />
                      </div>
                      <div className="loc-perf-target-hint">
                        Target: {fmt(grandTarget)} &middot; Salary: {fmt(grandSalaryCost)}
                        {grandBonusCost > 0 && <> &middot; Bonus: {fmt(grandBonusCost)}</>}
                        {grandBonusCost > 0 && <> &middot; Total: {fmt(grandSalaryCost + grandBonusCost)}</>}
                      </div>
                    </>
                  )}
                </div>

                {/* Per-location breakdown */}
                <div className="loc-perf-list">
                  {sorted.map(([name, loc]) => {
                    const locHitRate = pct(loc.hitCount || 0, loc.shiftCount)
                    const locAchievement = loc.totalTarget > 0 ? Math.round((loc.totalActual / loc.totalTarget) * 100) + '%' : '—'
                    const locBonusAmount = teamBonus?.locations?.[name]?.amount || 0
                    const locBonusAllocations = teamBonus?.locations?.[name]?.allocations || {}
                    return (
                      <div key={name} className="loc-perf-item">
                        <button
                          className="loc-perf-row"
                          onClick={() => toggle(name)}
                        >
                          <span className={`loc-perf-name ${name === '(No Location)' ? 'loc-perf-name-unset' : ''}`}>
                            {name}
                            {name === '(No Location)' && loc.members.length > 0 && (
                              <span className="loc-perf-name-who"> — {loc.members.map(m => m.displayName).join(', ')}</span>
                            )}
                          </span>
                          <span className="loc-perf-meta">
                            <span className="loc-perf-shifts">{loc.shiftCount} shift{loc.shiftCount !== 1 ? 's' : ''}</span>
                            <span className="loc-perf-hit-badge">{locHitRate}</span>
                          </span>
                          <span className="loc-perf-chevron">{expanded[name] ? '▲' : '▼'}</span>
                        </button>

                        <div className="loc-perf-row-stats">
                          <span className="loc-perf-actual">Actual: {fmt(loc.totalActual)}</span>
                          <span className="loc-perf-achievement">{locAchievement}</span>
                        </div>

                        <div className="loc-perf-row-secondary">
                          <span className="loc-perf-target-subdued">Target: {fmt(loc.totalTarget)}</span>
                          <span className="loc-perf-salary-cost">
                            Salary: {fmt(loc.totalSalaryCost || 0)}
                            {locBonusAmount > 0 && <> + Bonus: {fmt(locBonusAmount)}</>}
                          </span>
                        </div>

                        {loc.totalTarget > 0 && (
                          <div className="loc-perf-progress-bar loc-perf-progress-sm">
                            <div
                              className={`loc-perf-progress-fill ${loc.totalActual >= loc.totalTarget ? 'met' : ''}`}
                              style={{ width: `${Math.min(100, (loc.totalActual / loc.totalTarget) * 100)}%` }}
                            />
                          </div>
                        )}

                        {expanded[name] && (
                          <div className="loc-perf-members">
                            {loc.members.map(member => {
                              const memberBonus = locBonusAllocations[member.uid]?.share || 0
                              return (
                                <div key={member.uid} className="loc-perf-member-row">
                                  <span className="loc-perf-member-name">{member.displayName}</span>
                                  <span className="loc-perf-member-detail">
                                    <span className="loc-perf-member-shifts">
                                      {member.shifts.length} shift{member.shifts.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="loc-perf-member-hit">{pct(member.hitCount || 0, member.shifts.length)}</span>
                                  </span>
                                  <span className="loc-perf-member-amounts">
                                    <span className="loc-perf-member-actual">{fmt(member.totalActual)}</span>
                                    <span className="loc-perf-member-salary">{fmt(member.totalSalaryCost || 0)}</span>
                                    {memberBonus > 0 && (
                                      <span className="loc-perf-member-bonus">+{fmt(memberBonus)}</span>
                                    )}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
