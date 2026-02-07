import { useState } from 'react'
import { useGoals } from './hooks/useGoals'
import { CalendarGrid } from './components/CalendarGrid'
import { GoalModal } from './components/GoalModal'
import { BuybackModal } from './components/BuybackModal'
import { WageBreakdownModal } from './components/WageBreakdownModal'
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
  const { goals, saveGoal, getGoalByDay, buybackTarget } = useGoals()
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [showBuybackModal, setShowBuybackModal] = useState(false)
  const [breakdownDay, setBreakdownDay] = useState(null)

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

  const handleSave = (
    morningAmount,
    afternoonAmount,
    morningActual,
    afternoonActual,
    morningCustomRate,
    afternoonCustomRate,
    morningCustomAmount,
    afternoonCustomAmount
  ) => {
    saveGoal(
      selectedDay,
      morningAmount,
      afternoonAmount,
      morningActual,
      afternoonActual,
      undefined,
      undefined,
      morningCustomRate,
      afternoonCustomRate,
      morningCustomAmount,
      afternoonCustomAmount
    )
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const handleCancel = () => {
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const handleBuyback = (purchases) => {
    purchases.forEach(({ dateStr, shift }) => {
      buybackTarget(dateStr, shift)
    })
    setShowBuybackModal(false)
  }

  const handleQuickBuyback = (dateStr, shift) => {
    buybackTarget(dateStr, shift)
  }

  const handleWageClick = (dateStr) => {
    setBreakdownDay(dateStr)
  }

  const formatSelectedDay = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Calculate total monthly salary and commission
  const calculateMonthlyEarnings = () => {
    const SHIFT_HOURS = 4 + (10 / 60) // 4.167 hours (4h 10m)
    let wages = 0
    let commission45 = 0  // 4.5% commission for naturally met targets
    let commission35 = 0  // 3.5% commission for bought back targets
    let commissionCustom = 0  // Custom commission percentages
    let excessRevenue = 0
    let totalBuybackCost = 0
    const customRates = new Set()  // Track unique custom rates used
    const pad = (n) => String(n).padStart(2, '0')
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
      const goal = goals[dateStr]
      if (goal?.hasGoals) {
        const morningWage = goal.morningWage || 65
        const afternoonWage = goal.afternoonWage || 65
        wages += Math.round((morningWage * SHIFT_HOURS + afternoonWage * SHIFT_HOURS) * 100) / 100

        // Morning shift calculations
        if (morningWage === 80 && goal.morningActual > 0) {
          // 4.5% commission when target is naturally met
          commission45 += goal.morningActual * 0.045
          // Calculate excess revenue (actual - target)
          if (goal.morningAmount && goal.morningActual > goal.morningAmount) {
            excessRevenue += goal.morningActual - goal.morningAmount
          }
        } else if (goal.morningBoughtBack && goal.morningAmount) {
          // 3.5% commission for bought back targets
          commission35 += goal.morningAmount * 0.035
          totalBuybackCost += goal.morningAmount
        }

        // Morning custom commission
        if (goal.morningCustomRate && goal.morningCustomAmount) {
          commissionCustom += goal.morningCustomAmount * (goal.morningCustomRate / 100)
          customRates.add(Number(goal.morningCustomRate))
        }

        // Afternoon shift calculations
        if (afternoonWage === 80 && goal.afternoonActual > 0) {
          // 4.5% commission when target is naturally met
          commission45 += goal.afternoonActual * 0.045
          // Calculate excess revenue (actual - target)
          if (goal.afternoonAmount && goal.afternoonActual > goal.afternoonAmount) {
            excessRevenue += goal.afternoonActual - goal.afternoonAmount
          }
        } else if (goal.afternoonBoughtBack && goal.afternoonAmount) {
          // 3.5% commission for bought back targets
          commission35 += goal.afternoonAmount * 0.035
          totalBuybackCost += goal.afternoonAmount
        }

        // Afternoon custom commission
        if (goal.afternoonCustomRate && goal.afternoonCustomAmount) {
          commissionCustom += goal.afternoonCustomAmount * (goal.afternoonCustomRate / 100)
          customRates.add(Number(goal.afternoonCustomRate))
        }
      }
    }

    // Deduct buyback costs from excess revenue
    const availableExcess = Math.max(0, excessRevenue - totalBuybackCost)

    return {
      wages,
      commission45: Math.round(commission45 * 100) / 100,
      commission35: Math.round(commission35 * 100) / 100,
      commissionCustom: Math.round(commissionCustom * 100) / 100,
      customRates: Array.from(customRates).sort((a, b) => a - b),
      excessRevenue: Math.round(excessRevenue * 100) / 100,
      availableExcess: Math.round(availableExcess * 100) / 100
    }
  }

  const { wages: monthlyWages, commission45, commission35, commissionCustom, customRates, excessRevenue: monthlyExcess, availableExcess } = calculateMonthlyEarnings()
  const monthlyTotal = monthlyWages + commission45 + commission35 + commissionCustom

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
        availableExcess={availableExcess}
        onDayClick={handleDayClick}
        onBuyback={handleQuickBuyback}
        onWageClick={handleWageClick}
      />

      <div className="monthly-summary">
        <div className="monthly-row">
          <span className="monthly-label">Wages:</span>
          <span className="monthly-value">${monthlyWages.toLocaleString()}</span>
        </div>
        {commission45 > 0 && (
          <div className="monthly-row commission-row">
            <span className="monthly-label">Commission (4.5%):</span>
            <span className="monthly-value">+${commission45.toLocaleString()}</span>
          </div>
        )}
        {commission35 > 0 && (
          <div className="monthly-row commission35-row">
            <span className="monthly-label">Commission (3.5%):</span>
            <span className="monthly-value">+${commission35.toLocaleString()}</span>
          </div>
        )}
        {commissionCustom > 0 && (
          <div className="monthly-row commission-custom-row">
            <span className="monthly-label">
              Commission ({customRates.length === 1 ? `${customRates[0]}%` : customRates.map(r => `${r}%`).join(', ')}):
            </span>
            <span className="monthly-value">+${commissionCustom.toLocaleString()}</span>
          </div>
        )}
        {availableExcess > 0 && (
          <div className="monthly-row excess-row">
            <span className="monthly-label">Excess Revenue:</span>
            <span className="monthly-value">${availableExcess.toLocaleString()}</span>
          </div>
        )}
        <div className="monthly-total">
          <span className="monthly-label">Total:</span>
          <span className="monthly-amount">${monthlyTotal.toLocaleString()}</span>
        </div>
      </div>

      {selectedDay && (
        <GoalModal
          day={formatSelectedDay(selectedDay)}
          initialMorning={editingGoal?.morningAmount}
          initialAfternoon={editingGoal?.afternoonAmount}
          initialMorningActual={editingGoal?.morningActual}
          initialAfternoonActual={editingGoal?.afternoonActual}
          initialMorningCustomRate={editingGoal?.morningCustomRate}
          initialAfternoonCustomRate={editingGoal?.afternoonCustomRate}
          initialMorningCustomAmount={editingGoal?.morningCustomAmount}
          initialAfternoonCustomAmount={editingGoal?.afternoonCustomAmount}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {showBuybackModal && (
        <BuybackModal
          goals={goals}
          viewYear={viewYear}
          viewMonth={viewMonth}
          availableExcess={availableExcess}
          onBuyback={handleBuyback}
          onClose={() => setShowBuybackModal(false)}
        />
      )}

      {breakdownDay && (
        <WageBreakdownModal
          day={formatSelectedDay(breakdownDay)}
          goal={getGoalByDay(breakdownDay)}
          onClose={() => setBreakdownDay(null)}
        />
      )}
    </div>
  )
}
