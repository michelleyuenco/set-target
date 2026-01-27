import { useState, useEffect } from 'react'

export function GoalModal({ day, initialMorning, initialAfternoon, onSave, onCancel }) {
  const [morningGoal, setMorningGoal] = useState('')
  const [afternoonGoal, setAfternoonGoal] = useState('')

  useEffect(() => {
    setMorningGoal(initialMorning || '')
    setAfternoonGoal(initialAfternoon || '')
  }, [initialMorning, initialAfternoon])

  const handleSave = () => {
    onSave(morningGoal, afternoonGoal)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Set Goals for Day {day}</h2>
        <div className="input-group">
          <label>Morning Goal ($)</label>
          <input
            type="number"
            value={morningGoal}
            onChange={(e) => setMorningGoal(e.target.value)}
            placeholder="e.g., 1000"
          />
        </div>
        <div className="input-group">
          <label>Afternoon Goal ($)</label>
          <input
            type="number"
            value={afternoonGoal}
            onChange={(e) => setAfternoonGoal(e.target.value)}
            placeholder="e.g., 3000"
          />
        </div>
        <div className="button-group">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
