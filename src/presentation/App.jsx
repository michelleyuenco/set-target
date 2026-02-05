import { useState } from 'react'
import { useGoals } from './hooks/useGoals'
import { CalendarGrid } from './components/CalendarGrid'
import { GoalModal } from './components/GoalModal'
import '../App.css'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function App() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const { goals, saveGoal, getGoalByDay } = useGoals()
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)

  const isCurrentMonth = viewYear === currentYear && viewMonth === currentMonth
  const minYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const minMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const canGoPrev = viewYear > minYear || (viewYear === minYear && viewMonth > minMonth)
  const canGoNext = !isCurrentMonth

  const handlePrev = () => {
    if (!canGoPrev) return
    const pm = viewMonth === 0 ? 11 : viewMonth - 1
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    setViewYear(py)
    setViewMonth(pm)
  }

  const handleNext = () => {
    if (!canGoNext) return
    const nm = viewMonth === 11 ? 0 : viewMonth + 1
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear
    setViewYear(ny)
    setViewMonth(nm)
  }

  const handleDayClick = (dateStr) => {
    const goal = getGoalByDay(dateStr)
    setSelectedDay(dateStr)
    setEditingGoal(goal)
  }

  const handleSave = (morningAmount, afternoonAmount, morningActual, afternoonActual) => {
    saveGoal(selectedDay, morningAmount, afternoonAmount, morningActual, afternoonActual)
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const handleCancel = () => {
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const formatSelectedDay = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="app">
      <div className="month-nav">
        <button className="nav-btn" onClick={handlePrev} disabled={!canGoPrev}>&larr;</button>
        <h1>{MONTH_NAMES[viewMonth]} {viewYear}</h1>
        <button className="nav-btn" onClick={handleNext} disabled={!canGoNext}>&rarr;</button>
      </div>

      <CalendarGrid
        year={viewYear}
        month={viewMonth}
        goals={goals}
        selectedDay={selectedDay}
        onDayClick={handleDayClick}
      />

      {selectedDay && (
        <GoalModal
          day={formatSelectedDay(selectedDay)}
          initialMorning={editingGoal?.morningAmount}
          initialAfternoon={editingGoal?.afternoonAmount}
          initialMorningActual={editingGoal?.morningActual}
          initialAfternoonActual={editingGoal?.afternoonActual}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
