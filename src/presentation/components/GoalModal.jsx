import { useState, useEffect } from 'react'
import { Goal } from '../../domain/entities/Goal'

export function GoalModal({
  day,
  initialMorning,
  initialAfternoon,
  initialMorningActual,
  initialAfternoonActual,
  initialMorningCustomRate,
  initialAfternoonCustomRate,
  initialMorningCustomAmount,
  initialAfternoonCustomAmount,
  onSave,
  onCancel
}) {
  const [morningGoal, setMorningGoal] = useState('')
  const [afternoonGoal, setAfternoonGoal] = useState('')
  const [morningActual, setMorningActual] = useState('')
  const [afternoonActual, setAfternoonActual] = useState('')
  const [morningCustomRate, setMorningCustomRate] = useState('')
  const [afternoonCustomRate, setAfternoonCustomRate] = useState('')
  const [morningCustomAmount, setMorningCustomAmount] = useState('')
  const [afternoonCustomAmount, setAfternoonCustomAmount] = useState('')
  const [showMorningCustom, setShowMorningCustom] = useState(false)
  const [showAfternoonCustom, setShowAfternoonCustom] = useState(false)

  useEffect(() => {
    setMorningGoal(initialMorning || '')
    setAfternoonGoal(initialAfternoon || '')
    setMorningActual(initialMorningActual || '')
    setAfternoonActual(initialAfternoonActual || '')
    setMorningCustomRate(initialMorningCustomRate || '')
    setAfternoonCustomRate(initialAfternoonCustomRate || '')
    setMorningCustomAmount(initialMorningCustomAmount || '')
    setAfternoonCustomAmount(initialAfternoonCustomAmount || '')
    setShowMorningCustom(!!(initialMorningCustomRate || initialMorningCustomAmount))
    setShowAfternoonCustom(!!(initialAfternoonCustomRate || initialAfternoonCustomAmount))
  }, [
    initialMorning,
    initialAfternoon,
    initialMorningActual,
    initialAfternoonActual,
    initialMorningCustomRate,
    initialAfternoonCustomRate,
    initialMorningCustomAmount,
    initialAfternoonCustomAmount
  ])

  const handleSave = () => {
    onSave(
      morningGoal,
      afternoonGoal,
      morningActual,
      afternoonActual,
      morningCustomRate,
      afternoonCustomRate,
      morningCustomAmount,
      afternoonCustomAmount
    )
  }

  const getWage = (target, actual) => {
    const t = target === '' ? null : Number(target)
    const a = actual === '' ? null : Number(actual)
    return Goal.calculateWage(t, a)
  }

  const morningWage = getWage(morningGoal, morningActual)
  const afternoonWage = getWage(afternoonGoal, afternoonActual)

  const wageClass = (wage) => {
    if (wage === 80) return 'wage-hit'
    if (wage === 75) return 'wage-partial'
    return 'wage-none'
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-compact" onClick={e => e.stopPropagation()}>
        <h2>{day}</h2>

        <div className="shifts-compact">
          <div className="shift-section-wrapper">
            <div className="shift-row">
              <div className="shift-label">Morning</div>
              <div className="shift-inputs">
                <div className="input-compact">
                  <label>Target</label>
                  <input
                    type="number"
                    value={morningGoal}
                    onChange={(e) => setMorningGoal(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="number"
                    value={morningActual}
                    onChange={(e) => setMorningActual(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className={`wage-compact ${wageClass(morningWage)}`}>
                  ${morningWage}/hr
                </div>
              </div>
            </div>
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showMorningCustom}
                  onChange={(e) => {
                    setShowMorningCustom(e.target.checked)
                    if (!e.target.checked) {
                      setMorningCustomRate('')
                      setMorningCustomAmount('')
                    }
                  }}
                />
                <span>Custom Commission</span>
              </label>
            </div>
            {showMorningCustom && (
              <div className="custom-commission-inputs">
                <div className="input-compact">
                  <label>Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={morningCustomRate}
                    onChange={(e) => setMorningCustomRate(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={morningCustomAmount}
                    onChange={(e) => setMorningCustomAmount(e.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="shift-section-wrapper">
            <div className="shift-row">
              <div className="shift-label">Afternoon</div>
              <div className="shift-inputs">
                <div className="input-compact">
                  <label>Target</label>
                  <input
                    type="number"
                    value={afternoonGoal}
                    onChange={(e) => setAfternoonGoal(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="number"
                    value={afternoonActual}
                    onChange={(e) => setAfternoonActual(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className={`wage-compact ${wageClass(afternoonWage)}`}>
                  ${afternoonWage}/hr
                </div>
              </div>
            </div>
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showAfternoonCustom}
                  onChange={(e) => {
                    setShowAfternoonCustom(e.target.checked)
                    if (!e.target.checked) {
                      setAfternoonCustomRate('')
                      setAfternoonCustomAmount('')
                    }
                  }}
                />
                <span>Custom Commission</span>
              </label>
            </div>
            {showAfternoonCustom && (
              <div className="custom-commission-inputs">
                <div className="input-compact">
                  <label>Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={afternoonCustomRate}
                    onChange={(e) => setAfternoonCustomRate(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={afternoonCustomAmount}
                    onChange={(e) => setAfternoonCustomAmount(e.target.value)}
                    placeholder="1000"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="button-group">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
