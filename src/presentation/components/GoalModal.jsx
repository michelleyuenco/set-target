import { useState, useEffect } from 'react'
import { Goal, DEFAULT_MORNING_START, DEFAULT_MORNING_END, DEFAULT_AFTERNOON_START, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'

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
  initialMorningStartTime,
  initialMorningEndTime,
  initialAfternoonStartTime,
  initialAfternoonEndTime,
  initialMorningConfirmed,
  initialAfternoonConfirmed,
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
  const [morningStartTime, setMorningStartTime] = useState(DEFAULT_MORNING_START)
  const [morningEndTime, setMorningEndTime] = useState(DEFAULT_MORNING_END)
  const [afternoonStartTime, setAfternoonStartTime] = useState(DEFAULT_AFTERNOON_START)
  const [afternoonEndTime, setAfternoonEndTime] = useState(DEFAULT_AFTERNOON_END)
  const [morningConfirmed, setMorningConfirmed] = useState(false)
  const [afternoonConfirmed, setAfternoonConfirmed] = useState(false)

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
    setMorningStartTime(initialMorningStartTime || DEFAULT_MORNING_START)
    setMorningEndTime(initialMorningEndTime || DEFAULT_MORNING_END)
    setAfternoonStartTime(initialAfternoonStartTime || DEFAULT_AFTERNOON_START)
    setAfternoonEndTime(initialAfternoonEndTime || DEFAULT_AFTERNOON_END)
    setMorningConfirmed(!!initialMorningConfirmed)
    setAfternoonConfirmed(!!initialAfternoonConfirmed)
  }, [
    initialMorning,
    initialAfternoon,
    initialMorningActual,
    initialAfternoonActual,
    initialMorningCustomRate,
    initialAfternoonCustomRate,
    initialMorningCustomAmount,
    initialAfternoonCustomAmount,
    initialMorningStartTime,
    initialMorningEndTime,
    initialAfternoonStartTime,
    initialAfternoonEndTime,
    initialMorningConfirmed,
    initialAfternoonConfirmed
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
      afternoonCustomAmount,
      morningStartTime,
      morningEndTime,
      afternoonStartTime,
      afternoonEndTime,
      morningConfirmed,
      afternoonConfirmed
    )
  }

  const getWage = (target, actual) => {
    const t = target === '' ? null : Number(target)
    const a = actual === '' ? null : Number(actual)
    return Goal.calculateWage(t, a)
  }

  const morningWage = getWage(morningGoal, morningActual)
  const afternoonWage = getWage(afternoonGoal, afternoonActual)

  const morningHours = Goal.calculateHoursFromTimes(morningStartTime, morningEndTime)
  const afternoonHours = Goal.calculateHoursFromTimes(afternoonStartTime, afternoonEndTime)

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

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
          <div className={`shift-section-wrapper ${!morningConfirmed ? 'shift-unconfirmed' : ''}`}>
            <div className="shift-confirm-toggle">
              <label className="shift-confirm">
                <input
                  type="checkbox"
                  checked={morningConfirmed}
                  onChange={(e) => setMorningConfirmed(e.target.checked)}
                />
                <span>Shift A (Morning)</span>
              </label>
            </div>
            <div className="shift-row">
              <div className="shift-inputs">
                <div className="input-compact">
                  <label>Target</label>
                  <input
                    type="number"
                    value={morningGoal}
                    onChange={(e) => setMorningGoal(e.target.value)}
                    placeholder="0"
                    disabled={!morningConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="number"
                    value={morningActual}
                    onChange={(e) => setMorningActual(e.target.value)}
                    placeholder="0"
                    disabled={!morningConfirmed}
                  />
                </div>
                <div className={`wage-compact ${wageClass(morningWage)}`}>
                  ${morningWage}/hr
                </div>
              </div>
            </div>
            <div className="shift-time-row">
              <div className="time-input-group">
                <label>Start</label>
                <input
                  type="time"
                  value={morningStartTime}
                  onChange={(e) => setMorningStartTime(e.target.value)}
                  disabled={!morningConfirmed}
                />
              </div>
              <div className="time-input-group">
                <label>End</label>
                <input
                  type="time"
                  value={morningEndTime}
                  onChange={(e) => setMorningEndTime(e.target.value)}
                  disabled={!morningConfirmed}
                />
              </div>
              <div className="shift-duration">
                {formatHours(morningHours)}
              </div>
            </div>
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showMorningCustom}
                  disabled={!morningConfirmed}
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
                    disabled={!morningConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={morningCustomAmount}
                    onChange={(e) => setMorningCustomAmount(e.target.value)}
                    placeholder="1000"
                    disabled={!morningConfirmed}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={`shift-section-wrapper ${!afternoonConfirmed ? 'shift-unconfirmed' : ''}`}>
            <div className="shift-confirm-toggle">
              <label className="shift-confirm">
                <input
                  type="checkbox"
                  checked={afternoonConfirmed}
                  onChange={(e) => setAfternoonConfirmed(e.target.checked)}
                />
                <span>Shift B (Afternoon)</span>
              </label>
            </div>
            <div className="shift-row">
              <div className="shift-inputs">
                <div className="input-compact">
                  <label>Target</label>
                  <input
                    type="number"
                    value={afternoonGoal}
                    onChange={(e) => setAfternoonGoal(e.target.value)}
                    placeholder="0"
                    disabled={!afternoonConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="number"
                    value={afternoonActual}
                    onChange={(e) => setAfternoonActual(e.target.value)}
                    placeholder="0"
                    disabled={!afternoonConfirmed}
                  />
                </div>
                <div className={`wage-compact ${wageClass(afternoonWage)}`}>
                  ${afternoonWage}/hr
                </div>
              </div>
            </div>
            <div className="shift-time-row">
              <div className="time-input-group">
                <label>Start</label>
                <input
                  type="time"
                  value={afternoonStartTime}
                  onChange={(e) => setAfternoonStartTime(e.target.value)}
                  disabled={!afternoonConfirmed}
                />
              </div>
              <div className="time-input-group">
                <label>End</label>
                <input
                  type="time"
                  value={afternoonEndTime}
                  onChange={(e) => setAfternoonEndTime(e.target.value)}
                  disabled={!afternoonConfirmed}
                />
              </div>
              <div className="shift-duration">
                {formatHours(afternoonHours)}
              </div>
            </div>
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showAfternoonCustom}
                  disabled={!afternoonConfirmed}
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
                    disabled={!afternoonConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={afternoonCustomAmount}
                    onChange={(e) => setAfternoonCustomAmount(e.target.value)}
                    placeholder="1000"
                    disabled={!afternoonConfirmed}
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
