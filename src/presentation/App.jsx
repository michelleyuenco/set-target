import { useState, useEffect } from 'react'
import { useGoals } from './hooks/useGoals'
import { useAuth } from './hooks/useAuth'
import { CalendarGrid } from './components/CalendarGrid'
import { GoalModal } from './components/GoalModal'
import { BuybackModal } from './components/BuybackModal'
import { WageBreakdownModal } from './components/WageBreakdownModal'
import { LoginModal } from './components/LoginModal'
import { AuthButton } from './components/AuthButton'
import { DataMigrationModal } from './components/DataMigrationModal'
import { initFirestoreService, clearFirestoreService, getLocalGoalService, getFirestoreRepository } from '../di/container'
import { DataMigrationService } from '../application/services/DataMigrationService'
import { DEFAULT_SHIFT_HOURS } from '../domain/entities/Goal'
import '../App.css'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function App() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const { user, loading: authLoading, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } = useAuth()
  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const [firestoreReady, setFirestoreReady] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMigrationModal, setShowMigrationModal] = useState(false)

  const { goals, saveGoal, getGoalByDay, buybackTarget, exportData, loadGoals } = useGoals(user)
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [showBuybackModal, setShowBuybackModal] = useState(false)
  const [breakdownDay, setBreakdownDay] = useState(null)
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  // Initialize or clear Firestore service when auth state changes
  useEffect(() => {
    if (authLoading) return

    if (user) {
      setSyncing(true)
      initFirestoreService(user.uid)
        .then(async (service) => {
          const firestoreRepo = service.goalRepository
          const localService = getLocalGoalService()
          const localData = localService.goalRepository.getRawData()
          const hasLocalData = Object.keys(localData).length > 0

          // Auto-sync: if Firestore is empty and localStorage has data, sync automatically
          if (!firestoreRepo.hasData() && hasLocalData) {
            await DataMigrationService.syncLocalToFirestore(localService.goalRepository, firestoreRepo)
          }

          setFirestoreReady(true)
          setSyncing(false)
          loadGoals()
        })
        .catch((err) => {
          console.error('Firestore init failed:', err)
          setSyncing(false)
        })
    } else {
      clearFirestoreService()
      setFirestoreReady(false)
      loadGoals()
    }
  }, [user, authLoading])

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
    afternoonCustomAmount,
    morningStartTime,
    morningEndTime,
    afternoonStartTime,
    afternoonEndTime,
    morningConfirmed,
    afternoonConfirmed
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
      afternoonCustomAmount,
      morningStartTime,
      morningEndTime,
      afternoonStartTime,
      afternoonEndTime,
      morningConfirmed,
      afternoonConfirmed
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

  const handleExport = () => {
    const data = exportData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shift-records-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleWageClick = (dateStr) => {
    setBreakdownDay(dateStr)
  }

  const handleSignIn = async (email, password) => {
    await signInWithEmail(email, password)
    setShowLoginModal(false)
  }

  const handleSignUp = async (email, password) => {
    await signUpWithEmail(email, password)
    setShowLoginModal(false)
  }

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
    setShowLoginModal(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleMigrationComplete = () => {
    setShowMigrationModal(false)
    loadGoals()
  }

  const formatSelectedDay = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Calculate total monthly salary and commission
  const calculateMonthlyEarnings = () => {
    let wages = 0
    let commission45 = 0
    let commission35 = 0
    let commissionCustom = 0
    let excessRevenue = 0
    let totalBuybackCost = 0
    const customRates = new Set()
    const pad = (n) => String(n).padStart(2, '0')
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
      const goal = goals[dateStr]
      if (goal?.hasGoals) {
        // Only calculate wages for confirmed shifts
        if (goal.morningConfirmed) {
          const morningWage = goal.morningWage || 65
          const morningHours = goal.morningShiftHours ?? DEFAULT_SHIFT_HOURS
          wages += Math.round(morningWage * morningHours * 100) / 100

          if (morningWage === 80 && goal.morningActual > 0) {
            commission45 += goal.morningActual * 0.045
            if (goal.morningAmount && goal.morningActual > goal.morningAmount) {
              excessRevenue += goal.morningActual - goal.morningAmount
            }
          } else if (goal.morningBoughtBack && goal.morningAmount) {
            commission35 += goal.morningAmount * 0.035
            totalBuybackCost += goal.morningAmount
          }

          if (goal.morningCustomRate && goal.morningCustomAmount) {
            commissionCustom += goal.morningCustomAmount * (goal.morningCustomRate / 100)
            customRates.add(Number(goal.morningCustomRate))
          }
        }

        if (goal.afternoonConfirmed) {
          const afternoonWage = goal.afternoonWage || 65
          const afternoonHours = goal.afternoonShiftHours ?? DEFAULT_SHIFT_HOURS
          wages += Math.round(afternoonWage * afternoonHours * 100) / 100

          if (afternoonWage === 80 && goal.afternoonActual > 0) {
            commission45 += goal.afternoonActual * 0.045
            if (goal.afternoonAmount && goal.afternoonActual > goal.afternoonAmount) {
              excessRevenue += goal.afternoonActual - goal.afternoonAmount
            }
          } else if (goal.afternoonBoughtBack && goal.afternoonAmount) {
            commission35 += goal.afternoonAmount * 0.035
            totalBuybackCost += goal.afternoonAmount
          }

          if (goal.afternoonCustomRate && goal.afternoonCustomAmount) {
            commissionCustom += goal.afternoonCustomAmount * (goal.afternoonCustomRate / 100)
            customRates.add(Number(goal.afternoonCustomRate))
          }
        }
      }
    }

    const availableExcess = Math.max(0, excessRevenue - totalBuybackCost)

    return {
      wages: Math.round(wages * 100) / 100,
      commission45: Math.round(commission45 * 100) / 100,
      commission35: Math.round(commission35 * 100) / 100,
      commissionCustom: Math.round(commissionCustom * 100) / 100,
      customRates: Array.from(customRates).sort((a, b) => a - b),
      excessRevenue: Math.round(excessRevenue * 100) / 100,
      availableExcess: Math.round(availableExcess * 100) / 100
    }
  }

  const { wages: monthlyWages, commission45, commission35, commissionCustom, customRates, excessRevenue: monthlyExcess, availableExcess } = calculateMonthlyEarnings()
  const monthlyTotal = Math.round((monthlyWages + commission45 + commission35 + commissionCustom) * 100) / 100

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-screen">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="app-header">
        <AuthButton
          user={user}
          onSignInClick={() => setShowLoginModal(true)}
          onSignOut={handleSignOut}
        />
      </div>

      {syncing && (
        <div className="syncing-banner">Syncing data...</div>
      )}

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

      <div className={`monthly-summary ${summaryExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="summary-toggle" onClick={() => setSummaryExpanded(!summaryExpanded)}>
          <span className="toggle-arrow">{summaryExpanded ? '\u25BC' : '\u25B2'}</span>
        </div>
        {summaryExpanded && (
          <>
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
          </>
        )}
        <div className="monthly-total">
          <span className="monthly-label">Total:</span>
          <span className="monthly-amount">${monthlyTotal.toLocaleString()}</span>
        </div>
        {summaryExpanded && (
          <>
            <button className="export-btn" onClick={handleExport}>
              Export All Records
            </button>
            {user && firestoreReady && (
              <button className="export-btn sync-cloud-btn" onClick={() => setShowMigrationModal(true)}>
                Sync / Import Data
              </button>
            )}
          </>
        )}
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
          initialMorningStartTime={editingGoal?.morningStartTime}
          initialMorningEndTime={editingGoal?.morningEndTime}
          initialAfternoonStartTime={editingGoal?.afternoonStartTime}
          initialAfternoonEndTime={editingGoal?.afternoonEndTime}
          initialMorningConfirmed={editingGoal?.morningConfirmed}
          initialAfternoonConfirmed={editingGoal?.afternoonConfirmed}
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

      {showLoginModal && (
        <LoginModal
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onGoogleSignIn={handleGoogleSignIn}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {showMigrationModal && (
        <DataMigrationModal
          onComplete={handleMigrationComplete}
          onClose={() => setShowMigrationModal(false)}
        />
      )}
    </div>
  )
}
