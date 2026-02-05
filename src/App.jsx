import { useState } from 'react'
import './App.css'

function App() {
  const [goals, setGoals] = useState({})
  const [selectedDay, setSelectedDay] = useState(null)
  const [morningGoal, setMorningGoal] = useState('')
  const [afternoonGoal, setAfternoonGoal] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const handleDayClick = (day) => {
    setSelectedDay(day)
    const dayGoals = goals[day] || {}
    setMorningGoal(dayGoals.morning || '')
    setAfternoonGoal(dayGoals.afternoon || '')
    setHourlyRate(dayGoals.rate || '')
  }

  const handleSave = () => {
    if (selectedDay) {
      setGoals(prev => ({
        ...prev,
        [selectedDay]: {
          morning: morningGoal,
          afternoon: afternoonGoal,
          rate: hourlyRate
        }
      }))
      setSelectedDay(null)
      setMorningGoal('')
      setAfternoonGoal('')
      setHourlyRate('')
    }
  }

  const handleCancel = () => {
    setSelectedDay(null)
    setMorningGoal('')
    setAfternoonGoal('')
    setHourlyRate('')
  }

  const formatCurrency = (value) => {
    if (!value) return ''
    return `$${Number(value).toLocaleString()}`
  }

  return (
    <div className="app">
      <h1>Daily Goals Tracker</h1>

      <div className="calendar-grid">
        {days.map(day => {
          const dayGoals = goals[day]
          return (
            <div
              key={day}
              className={`day-cell ${dayGoals ? 'has-goals' : ''} ${selectedDay === day ? 'selected' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="day-number">{day}</div>
              {dayGoals && (
                <div className="goals-display">
                  {dayGoals.morning && (
                    <div className="goal morning">
                      <span className="label">AM:</span> {formatCurrency(dayGoals.morning)}
                    </div>
                  )}
                  {dayGoals.afternoon && (
                    <div className="goal afternoon">
                      <span className="label">PM:</span> {formatCurrency(dayGoals.afternoon)}
                    </div>
                  )}
                  {dayGoals.rate && (
                    <div className="goal rate">
                      <span className="label">Rate:</span> ${dayGoals.rate}/hr
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Set Goals for Day {selectedDay}</h2>
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
            <div className="input-group">
              <label>Hourly Rate ($)</label>
              <div className="rate-selector">
                {[65, 75, 80].map(rate => (
                  <button
                    key={rate}
                    className={hourlyRate === rate ? 'active' : ''}
                    onClick={() => setHourlyRate(hourlyRate === rate ? '' : rate)}
                  >
                    ${rate}
                  </button>
                ))}
              </div>
            </div>
            <div className="button-group">
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
