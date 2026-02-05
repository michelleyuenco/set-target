import { useState, useEffect } from 'react'
import { Goal } from '../../domain/entities/Goal'

export function GoalModal({ day, initialMorning, initialAfternoon, initialMorningActual, initialAfternoonActual, onSave, onCancel }) {
  const [morningGoal, setMorningGoal] = useState('')
  const [afternoonGoal, setAfternoonGoal] = useState('')
  const [morningActual, setMorningActual] = useState('')
  const [afternoonActual, setAfternoonActual] = useState('')

  useEffect(() => {
    setMorningGoal(initialMorning || '')
    setAfternoonGoal(initialAfternoon || '')
    setMorningActual(initialMorningActual || '')
    setAfternoonActual(initialAfternoonActual || '')
  }, [initialMorning, initialAfternoon, initialMorningActual, initialAfternoonActual])

  const handleSave = () => {
    onSave(morningGoal, afternoonGoal, morningActual, afternoonActual)
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
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Goals for {day}</h2>

        <div className="shift-section">
          <h3>Morning Shift</h3>
          <div className="input-group">
            <label>Revenue Target ($)</label>
            <input
              type="number"
              value={morningGoal}
              onChange={(e) => setMorningGoal(e.target.value)}
              placeholder="e.g., 1000"
            />
          </div>
          <div className="input-group">
            <label>Actual Revenue ($)</label>
            <input
              type="number"
              value={morningActual}
              onChange={(e) => setMorningActual(e.target.value)}
              placeholder="e.g., 800"
            />
          </div>
          <div className={`wage-display ${wageClass(morningWage)}`}>
            Hourly Wage: ${morningWage}/hr
          </div>
        </div>

        <div className="shift-section">
          <h3>Afternoon Shift</h3>
          <div className="input-group">
            <label>Revenue Target ($)</label>
            <input
              type="number"
              value={afternoonGoal}
              onChange={(e) => setAfternoonGoal(e.target.value)}
              placeholder="e.g., 3000"
            />
          </div>
          <div className="input-group">
            <label>Actual Revenue ($)</label>
            <input
              type="number"
              value={afternoonActual}
              onChange={(e) => setAfternoonActual(e.target.value)}
              placeholder="e.g., 2500"
            />
          </div>
          <div className={`wage-display ${wageClass(afternoonWage)}`}>
            Hourly Wage: ${afternoonWage}/hr
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
