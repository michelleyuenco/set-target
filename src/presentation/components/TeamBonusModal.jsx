import { useState, useEffect } from 'react'
import { teamBonusService } from '../../infrastructure/firebase/teamBonusService'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function TeamBonusModal({ year, month, members, locations, adminUid, existingBonus, onSave, onClose }) {
  const [locationAmounts, setLocationAmounts] = useState({})
  const [locationHours, setLocationHours] = useState({})
  const [loadingHours, setLoadingHours] = useState(true)
  const [saving, setSaving] = useState(false)

  // Initialize amounts from existing bonus (new per-location format)
  useEffect(() => {
    if (existingBonus?.locations) {
      const amounts = {}
      for (const [loc, data] of Object.entries(existingBonus.locations)) {
        amounts[loc] = data.amount || ''
      }
      setLocationAmounts(amounts)
    }
  }, [existingBonus])

  // Load per-location hours
  useEffect(() => {
    const loadHours = async () => {
      setLoadingHours(true)
      try {
        const results = await teamBonusService.getAllMembersLocationHours(members, year, month)
        setLocationHours(results)
      } catch (err) {
        console.error('Failed to load location hours:', err)
      } finally {
        setLoadingHours(false)
      }
    }
    if (members.length > 0) {
      loadHours()
    } else {
      setLoadingHours(false)
    }
  }, [members, year, month])

  // Sort locations: follow locations prop order, then extras, then (No Location) last
  const sortedLocationNames = (() => {
    const allNames = Object.keys(locationHours)
    const ordered = locations
      .filter(l => allNames.includes(l.name))
      .map(l => l.name)
    const extras = allNames.filter(n => !ordered.includes(n) && n !== '(No Location)')
    const result = [...ordered, ...extras]
    if (allNames.includes('(No Location)')) result.push('(No Location)')
    return result
  })()

  // Compute grand total revenue across all locations
  const grandTotalRevenue = sortedLocationNames.reduce(
    (sum, loc) => sum + (locationHours[loc]?.totalRevenue || 0), 0
  )

  // Compute allocations per location
  const getLocationAllocations = (loc) => {
    const locMembers = locationHours[loc]?.members || []
    const locAmount = Number(locationAmounts[loc]) || 0
    const totalHrs = locMembers.reduce((sum, m) => sum + m.hours, 0)
    return locMembers.map(m => {
      const percentage = totalHrs > 0 ? (m.hours / totalHrs) * 100 : 0
      const share = totalHrs > 0 ? Math.round((m.hours / totalHrs) * locAmount * 100) / 100 : 0
      return { ...m, percentage: Math.round(percentage * 10) / 10, share }
    })
  }

  const grandTotal = Object.values(locationAmounts).reduce((sum, a) => sum + (Number(a) || 0), 0)
  const hasAnyAmount = grandTotal > 0

  const handleSave = async () => {
    if (!hasAnyAmount) return
    setSaving(true)
    try {
      const locationsData = {}
      for (const loc of sortedLocationNames) {
        const locMembers = locationHours[loc]?.members || []
        const locAmount = Number(locationAmounts[loc]) || 0
        const totalHrs = locMembers.reduce((sum, m) => sum + m.hours, 0)
        const allocations = getLocationAllocations(loc)
        const allocationMap = {}
        allocations.forEach(a => {
          allocationMap[a.uid] = {
            displayName: a.displayName,
            hours: a.hours,
            percentage: a.percentage,
            share: a.share
          }
        })
        locationsData[loc] = { amount: locAmount, allocations: allocationMap, totalHours: totalHrs }
      }
      await onSave(locationsData, adminUid)
      onClose()
    } catch (err) {
      console.error('Failed to save team bonus:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const updateAmount = (loc, value) => {
    setLocationAmounts(prev => ({ ...prev, [loc]: value }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal team-bonus-modal" onClick={e => e.stopPropagation()}>
        <h2>Team Bonus - {MONTH_NAMES[month]} {year}</h2>

        {loadingHours ? (
          <div className="team-bonus-loading">Loading member hours...</div>
        ) : sortedLocationNames.length === 0 ? (
          <div className="team-bonus-loading">No confirmed shifts found for this month.</div>
        ) : (
          <div className="team-bonus-locations-scroll">
            {sortedLocationNames.map(loc => {
              const locData = locationHours[loc] || { members: [], totalRevenue: 0 }
              const locMembers = locData.members
              const locAmount = Number(locationAmounts[loc]) || 0
              const totalHrs = locMembers.reduce((sum, m) => sum + m.hours, 0)
              const totalRevenue = locData.totalRevenue
              const allocations = getLocationAllocations(loc)
              const totalShare = allocations.reduce((sum, a) => sum + a.share, 0)

              return (
                <div key={loc} className="team-bonus-location-card">
                  <div className="team-bonus-location-header">
                    <span className="team-bonus-location-name">{loc}</span>
                    <span className="team-bonus-location-meta">
                      <span className="team-bonus-location-revenue">Revenue: ${totalRevenue.toLocaleString()}</span>
                      <span className="team-bonus-location-hours">{formatHours(totalHrs)}</span>
                    </span>
                  </div>

                  <div className="team-bonus-input-section">
                    <input
                      type="number"
                      className="team-bonus-amount-input"
                      value={locationAmounts[loc] || ''}
                      onChange={e => updateAmount(loc, e.target.value)}
                      placeholder="Bonus amount"
                      min="0"
                    />
                  </div>

                  {locAmount > 0 && (
                    <div className="team-bonus-table-wrapper">
                      <table className="team-bonus-table">
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Hours</th>
                            <th>%</th>
                            <th>Share</th>
                            <th>$/hr</th>
                            <th>$/hr+</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocations.map(a => {
                            const baseRate = a.hours > 0 ? Math.round((a.salaryCost || 0) / a.hours * 100) / 100 : 0
                            const withBonusRate = a.hours > 0 ? Math.round(((a.salaryCost || 0) + a.share) / a.hours * 100) / 100 : 0
                            return (
                              <tr key={a.uid} className={a.hours === 0 ? 'zero-hours' : ''}>
                                <td className="member-name">{a.displayName}</td>
                                <td className="member-hours">{formatHours(a.hours)}</td>
                                <td className="member-percentage">{a.percentage}%</td>
                                <td className="member-share">${a.share.toLocaleString()}</td>
                                <td className="member-rate">${baseRate.toFixed(2)}</td>
                                <td className="member-rate-bonus">${withBonusRate.toFixed(2)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          {(() => {
                            const totalSalaryCost = allocations.reduce((sum, a) => sum + (a.salaryCost || 0), 0)
                            const avgBaseRate = totalHrs > 0 ? Math.round(totalSalaryCost / totalHrs * 100) / 100 : 0
                            const avgWithBonusRate = totalHrs > 0 ? Math.round((totalSalaryCost + totalShare) / totalHrs * 100) / 100 : 0
                            return (
                              <tr>
                                <td><strong>Total</strong></td>
                                <td><strong>{formatHours(totalHrs)}</strong></td>
                                <td><strong>100%</strong></td>
                                <td><strong>${totalShare.toLocaleString()}</strong></td>
                                <td><strong>${avgBaseRate.toFixed(2)}</strong></td>
                                <td><strong>${avgWithBonusRate.toFixed(2)}</strong></td>
                              </tr>
                            )
                          })()}
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="team-bonus-grand-total">
              <div>Total Revenue: ${Math.round(grandTotalRevenue).toLocaleString()}</div>
              <div>Total Bonus Pool: ${grandTotal.toLocaleString()}</div>
            </div>
          </div>
        )}

        {existingBonus?.updatedAt && (
          <div className="team-bonus-last-saved">
            Last saved: {new Date(existingBonus.updatedAt).toLocaleString()}
          </div>
        )}

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!hasAnyAmount || loadingHours || saving}
          >
            {saving ? 'Saving...' : 'Save Team Bonus'}
          </button>
        </div>
      </div>
    </div>
  )
}
