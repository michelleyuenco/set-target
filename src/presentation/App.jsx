import { useState, useEffect } from 'react'
import { useGoals } from './hooks/useGoals'
import { useAuth } from './hooks/useAuth'
import { useAdminMembers } from './hooks/useAdminMembers'
import { CalendarGrid } from './components/CalendarGrid'
import { GoalModal } from './components/GoalModal'
import { BuybackModal } from './components/BuybackModal'
import { WageBreakdownModal } from './components/WageBreakdownModal'
import { LoginModal } from './components/LoginModal'
import { AuthButton } from './components/AuthButton'
import { AdminBar } from './components/AdminBar'
import { TeamBonusModal } from './components/TeamBonusModal'
import { DataMigrationModal } from './components/DataMigrationModal'
import { useTeamBonus } from './hooks/useTeamBonus'
import { initFirestoreService, clearFirestoreService, getLocalGoalService, getFirestoreRepository, initAdminMemberService, clearAdminMemberService } from '../di/container'
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

  const { user, loading: authLoading, isAdmin, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } = useAuth()
  const { members, loading: membersLoading } = useAdminMembers(isAdmin)
  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const [firestoreReady, setFirestoreReady] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMigrationModal, setShowMigrationModal] = useState(false)

  // Admin state
  const [adminViewingUid, setAdminViewingUid] = useState(null)
  const [adminSwitching, setAdminSwitching] = useState(false)
  const [adminEditMode, setAdminEditMode] = useState(false)
  const [showConfirmSave, setShowConfirmSave] = useState(null)

  const { goals, saveGoal, getGoalByDay, buybackTarget, confirmGoal, unconfirmGoal, exportData, loadGoals } = useGoals(user)
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [showBuybackModal, setShowBuybackModal] = useState(false)
  const [breakdownDay, setBreakdownDay] = useState(null)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [excessExpanded, setExcessExpanded] = useState(false)
  const [showTeamBonusModal, setShowTeamBonusModal] = useState(false)

  // Team bonus - determine whose bonus share to show
  const bonusViewUid = adminViewingUid || user?.uid
  const { teamBonus, myBonusShare, loadTeamBonus, saveTeamBonus } = useTeamBonus(viewYear, viewMonth, bonusViewUid)

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
      clearAdminMemberService()
      setAdminViewingUid(null)
      setFirestoreReady(false)
      loadGoals()
    }
  }, [user, authLoading])

  // Admin: switch to viewing a member's data
  const handleAdminSelectMember = async (memberUid) => {
    setAdminSwitching(true)
    setAdminEditMode(false)
    try {
      await initAdminMemberService(memberUid)
      setAdminViewingUid(memberUid)
      loadGoals()
    } catch (err) {
      console.error('Failed to load member data:', err)
    } finally {
      setAdminSwitching(false)
    }
  }

  // Admin: return to own data
  const handleAdminBackToMyData = () => {
    clearAdminMemberService()
    setAdminViewingUid(null)
    setAdminEditMode(false)
    loadGoals()
  }

  // Find the member being viewed (for display purposes)
  const viewingMember = adminViewingUid
    ? members.find((m) => m.uid === adminViewingUid)
    : null

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

  const doSaveGoal = (args) => {
    // When member edits their own data, clear adminConfirmed (requires re-verification)
    // When admin edits member data, preserve existing adminConfirmed
    const adminConfirmedValue = adminViewingUid ? undefined : false
    saveGoal(
      args.day,
      args.morningAmount,
      args.afternoonAmount,
      args.morningActual,
      args.afternoonActual,
      undefined,
      undefined,
      args.morningCustomRate,
      args.afternoonCustomRate,
      args.morningCustomAmount,
      args.afternoonCustomAmount,
      args.morningStartTime,
      args.morningEndTime,
      args.afternoonStartTime,
      args.afternoonEndTime,
      args.morningConfirmed,
      args.afternoonConfirmed,
      adminConfirmedValue
    )
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const handleAdminConfirm = () => {
    if (selectedDay && adminViewingUid) {
      confirmGoal(selectedDay)
      // Refresh the editing goal to reflect the change
      const updated = getGoalByDay(selectedDay)
      setEditingGoal(updated)
    }
  }

  const handleAdminUnconfirm = () => {
    if (selectedDay && adminViewingUid) {
      unconfirmGoal(selectedDay)
      const updated = getGoalByDay(selectedDay)
      setEditingGoal(updated)
    }
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
    const args = {
      day: selectedDay,
      morningAmount, afternoonAmount,
      morningActual, afternoonActual,
      morningCustomRate, afternoonCustomRate,
      morningCustomAmount, afternoonCustomAmount,
      morningStartTime, morningEndTime,
      afternoonStartTime, afternoonEndTime,
      morningConfirmed, afternoonConfirmed
    }

    // If editing a member's data, show confirmation first
    if (adminViewingUid) {
      setShowConfirmSave(args)
    } else {
      doSaveGoal(args)
    }
  }

  const handleConfirmSave = () => {
    if (showConfirmSave) {
      doSaveGoal(showConfirmSave)
    }
    setShowConfirmSave(null)
  }

  const handleCancelConfirm = () => {
    setShowConfirmSave(null)
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
    // Block buyback when viewing a member in read-only mode
    if (adminViewingUid && !adminEditMode) return
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
    clearAdminMemberService()
    setAdminViewingUid(null)
    setAdminEditMode(false)
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
    const excessSources = []
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
            commission45 += goal.morningAmount * 0.045
            if (goal.morningAmount && goal.morningActual > goal.morningAmount) {
              const excess = goal.morningActual - goal.morningAmount
              excessRevenue += excess
              excessSources.push({ key: `${dateStr}:morning`, excess })
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
            commission45 += goal.afternoonAmount * 0.045
            if (goal.afternoonAmount && goal.afternoonActual > goal.afternoonAmount) {
              const excess = goal.afternoonActual - goal.afternoonAmount
              excessRevenue += excess
              excessSources.push({ key: `${dateStr}:afternoon`, excess })
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

    // FIFO allocation: consume excess from earliest shifts first
    const excessAllocation = {}
    let remaining = totalBuybackCost
    for (const source of excessSources) {
      const used = Math.min(remaining, source.excess)
      remaining -= used
      excessAllocation[source.key] = {
        excess: Math.round(source.excess * 100) / 100,
        used: Math.round(used * 100) / 100
      }
    }

    return {
      wages: Math.round(wages * 100) / 100,
      commission45: Math.round(commission45 * 100) / 100,
      commission35: Math.round(commission35 * 100) / 100,
      commissionCustom: Math.round(commissionCustom * 100) / 100,
      customRates: Array.from(customRates).sort((a, b) => a - b),
      excessRevenue: Math.round(excessRevenue * 100) / 100,
      totalBuybackCost: Math.round(totalBuybackCost * 100) / 100,
      availableExcess: Math.round(availableExcess * 100) / 100,
      excessAllocation
    }
  }

  const { wages: monthlyWages, commission45, commission35, commissionCustom, customRates, excessRevenue: monthlyExcess, totalBuybackCost: monthlyBuybackCost, availableExcess, excessAllocation } = calculateMonthlyEarnings()
  const monthlyTotal = Math.round((monthlyWages + commission45 + commission35 + commissionCustom + myBonusShare) * 100) / 100

  // Calculate admin confirmation progress for the viewing month
  const getConfirmationProgress = () => {
    const pad = (n) => String(n).padStart(2, '0')
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    let totalWithData = 0
    let confirmed = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
      const goal = goals[dateStr]
      if (goal?.hasGoals && (goal.morningConfirmed || goal.afternoonConfirmed)) {
        totalWithData++
        if (goal.adminConfirmed) confirmed++
      }
    }
    return { confirmed, total: totalWithData }
  }
  const confirmationProgress = adminViewingUid ? getConfirmationProgress() : null

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

      {isAdmin && (
        <AdminBar
          members={members}
          membersLoading={membersLoading}
          selectedUid={adminViewingUid}
          currentUserUid={user?.uid}
          editMode={adminEditMode}
          onSelectMember={handleAdminSelectMember}
          onBackToMyData={handleAdminBackToMyData}
          onToggleEditMode={() => setAdminEditMode(!adminEditMode)}
          onTeamBonus={() => setShowTeamBonusModal(true)}
        />
      )}

      {adminViewingUid && viewingMember && (
        <div className="admin-viewing-banner">
          <span>Viewing: {viewingMember.displayName || viewingMember.email}</span>
          {confirmationProgress && confirmationProgress.total > 0 && (
            <span className={`confirmation-progress ${confirmationProgress.confirmed === confirmationProgress.total ? 'all-confirmed' : ''}`}>
              Verified: {confirmationProgress.confirmed}/{confirmationProgress.total}
            </span>
          )}
        </div>
      )}

      {(syncing || adminSwitching) && (
        <div className="syncing-banner">{adminSwitching ? 'Loading member data...' : 'Syncing data...'}</div>
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
        excessAllocation={excessAllocation}
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
            {monthlyExcess > 0 && (
              <div className="excess-section">
                <div
                  className="excess-header excess-clickable"
                  onClick={() => setExcessExpanded(!excessExpanded)}
                >
                  <span className="excess-label">
                    Excess Balance: <span className="excess-toggle-hint">{excessExpanded ? '\u25B2' : '\u25BC'}</span>
                  </span>
                  <span className="excess-value">${availableExcess.toLocaleString()}</span>
                </div>
                {excessExpanded && (
                  <>
                    <div className="excess-detail-row">
                      <span className="excess-detail-label">Total Excess:</span>
                      <span className="excess-detail-value">${monthlyExcess.toLocaleString()}</span>
                    </div>
                    {monthlyBuybackCost > 0 && (
                      <div className="excess-detail-row excess-used">
                        <span className="excess-detail-label">Used for Buybacks:</span>
                        <span className="excess-detail-value">-${monthlyBuybackCost.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
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
            {myBonusShare > 0 && (
              <div className="monthly-row team-bonus-row">
                <span className="monthly-label">Team Bonus:</span>
                <span className="monthly-value">+${myBonusShare.toLocaleString()}</span>
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
            {user && firestoreReady && !adminViewingUid && (
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
          initialAdminConfirmed={editingGoal?.adminConfirmed}
          isAdminViewing={!!adminViewingUid}
          onSave={handleSave}
          onCancel={handleCancel}
          onConfirm={handleAdminConfirm}
          onUnconfirm={handleAdminUnconfirm}
          readOnly={!!adminViewingUid && !adminEditMode}
        />
      )}

      {showConfirmSave && (
        <div className="modal-overlay" onClick={handleCancelConfirm}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h2>Confirm Changes</h2>
            <p className="confirm-message">
              You are about to modify <strong>{viewingMember?.displayName || viewingMember?.email || 'this member'}</strong>'s shift data. This action cannot be undone.
            </p>
            <div className="button-group">
              <button className="cancel-btn" onClick={handleCancelConfirm}>Cancel</button>
              <button className="save-btn confirm-save-btn" onClick={handleConfirmSave}>Confirm Save</button>
            </div>
          </div>
        </div>
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

      {showTeamBonusModal && (
        <TeamBonusModal
          year={viewYear}
          month={viewMonth}
          members={members}
          adminUid={user?.uid}
          existingBonus={teamBonus}
          onSave={async (amount, allocations, totalHours, adminUid) => {
            await saveTeamBonus(amount, allocations, totalHours, adminUid)
          }}
          onClose={() => setShowTeamBonusModal(false)}
        />
      )}
    </div>
  )
}
