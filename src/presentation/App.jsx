import { useState } from 'react'
import { useGoals } from './hooks/useGoals'
import { CalendarGrid } from './components/CalendarGrid'
import { GoalModal } from './components/GoalModal'
import '../App.css'

export function App() {
  const { goals, saveGoal, getGoalByDay } = useGoals()
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)

  const handleDayClick = (day) => {
    const goal = getGoalByDay(day)
    setSelectedDay(day)
    setEditingGoal(goal)
  }

  const handleSave = (morningAmount, afternoonAmount) => {
    saveGoal(selectedDay, morningAmount, afternoonAmount)
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const handleCancel = () => {
    setSelectedDay(null)
    setEditingGoal(null)
  }

  return (
    <div className="app">
      <h1>Daily Goals Tracker</h1>

      <CalendarGrid
        goals={goals}
        selectedDay={selectedDay}
        onDayClick={handleDayClick}
      />

      {selectedDay && (
        <GoalModal
          day={selectedDay}
          initialMorning={editingGoal?.morningAmount}
          initialAfternoon={editingGoal?.afternoonAmount}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
