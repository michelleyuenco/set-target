import { useState, useEffect } from 'react'
import { teamBonusService } from '../../infrastructure/firebase/teamBonusService'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function TeamBonusModal({ year, month, members, adminUid, existingBonus, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [memberHours, setMemberHours] = useState([])
  const [loadingHours, setLoadingHours] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setAmount(existingBonus?.amount || '')
  }, [existingBonus])

  useEffect(() => {
    const loadHours = async () => {
      setLoadingHours(true)
      try {
        const results = await teamBonusService.getAllMembersMonthlyHours(members, year, month)
        setMemberHours(results)
      } catch (err) {
        console.error('Failed to load member hours:', err)
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

  const totalHours = memberHours.reduce((sum, m) => sum + m.hours, 0)
  const bonusAmount = Number(amount) || 0

  const allocations = memberHours.map((m) => {
    const percentage = totalHours > 0 ? (m.hours / totalHours) * 100 : 0
    const share = totalHours > 0 ? Math.round((m.hours / totalHours) * bonusAmount * 100) / 100 : 0
    return {
      ...m,
      percentage: Math.round(percentage * 10) / 10,
      share
    }
  }).sort((a, b) => b.hours - a.hours)

  const totalShare = allocations.reduce((sum, a) => sum + a.share, 0)

  const handleSave = async () => {
    if (!bonusAmount || bonusAmount <= 0) return
    setSaving(true)
    try {
      const allocationMap = {}
      allocations.forEach((a) => {
        allocationMap[a.uid] = {
          displayName: a.displayName,
          hours: a.hours,
          percentage: a.percentage,
          share: a.share
        }
      })
      await onSave(bonusAmount, allocationMap, totalHours, adminUid)
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal team-bonus-modal" onClick={e => e.stopPropagation()}>
        <h2>Team Bonus - {MONTH_NAMES[month]} {year}</h2>

        <div className="team-bonus-input-section">
          <label className="team-bonus-label">Total Bonus Pool ($)</label>
          <input
            type="number"
            className="team-bonus-amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter bonus amount"
            min="0"
          />
        </div>

        {loadingHours ? (
          <div className="team-bonus-loading">Loading member hours...</div>
        ) : (
          <>
            <div className="team-bonus-table-wrapper">
              <table className="team-bonus-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Hours</th>
                    <th>%</th>
                    <th>Bonus Share</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((a) => (
                    <tr key={a.uid} className={a.hours === 0 ? 'zero-hours' : ''}>
                      <td className="member-name">{a.displayName}</td>
                      <td className="member-hours">{formatHours(a.hours)}</td>
                      <td className="member-percentage">{a.percentage}%</td>
                      <td className="member-share">${a.share.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{formatHours(totalHours)}</strong></td>
                    <td><strong>100%</strong></td>
                    <td><strong>${totalShare.toLocaleString()}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {existingBonus && (
              <div className="team-bonus-last-saved">
                Last saved: {new Date(existingBonus.updatedAt).toLocaleString()}
              </div>
            )}
          </>
        )}

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!bonusAmount || bonusAmount <= 0 || loadingHours || saving}
          >
            {saving ? 'Saving...' : 'Save Team Bonus'}
          </button>
        </div>
      </div>
    </div>
  )
}
