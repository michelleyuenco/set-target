import { useState, useEffect } from 'react'
import { useGoals } from './hooks/useGoals'
import { useAuth } from './hooks/useAuth'
import { useAdminMembers } from './hooks/useAdminMembers'
import { useLocations } from './hooks/useLocations'
import { CalendarGrid } from './components/CalendarGrid'
import { GoalModal } from './components/GoalModal'
import { BuybackModal } from './components/BuybackModal'
import { BulkLocationModal } from './components/BulkLocationModal'
import { WageBreakdownModal } from './components/WageBreakdownModal'
import { LoginModal } from './components/LoginModal'
import { ChangeEmailModal } from './components/ChangeEmailModal'
import { AuthButton } from './components/AuthButton'
import { AdminBar } from './components/AdminBar'
import { TeamBonusModal } from './components/TeamBonusModal'
import { LocationManagerModal } from './components/LocationManagerModal'
import { RosterModal } from './components/RosterModal'
import { LocationPerformanceModal } from './components/LocationPerformanceModal'
import { MemberManagerModal } from './components/MemberManagerModal'
import { AdminDashboard } from './components/AdminDashboard'
import { DataMigrationModal } from './components/DataMigrationModal'
import { useTeamBonus } from './hooks/useTeamBonus'
import { useProofImages } from './hooks/useProofImages'
import { useLocationPerformance } from './hooks/useLocationPerformance'
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

  const { user, loading: authLoading, isAdmin, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, changeEmail } = useAuth()
  const { members, loading: membersLoading, updateMemberDisplayName } = useAdminMembers(isAdmin)
  const [viewYear, setViewYear] = useState(currentYear)
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const [firestoreReady, setFirestoreReady] = useState(false)
  const { locations, visibleLocations, addLocation, updateLocation, removeLocation, reorderLocations, setLocationVisibility, loadLocations } = useLocations(firestoreReady)
  const [syncing, setSyncing] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false)
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [showLocationManager, setShowLocationManager] = useState(false)
  const [showMemberManager, setShowMemberManager] = useState(false)
  const [showRoster, setShowRoster] = useState(false)
  const [showLocPerf, setShowLocPerf] = useState(false)
  const { stats: locPerfStats, loading: locPerfLoading, loadedKey: locPerfLoadedKey, loadStats: loadLocPerf } = useLocationPerformance()

  // Admin state
  const [showAdminDashboard, setShowAdminDashboard] = useState(true)
  const [adminViewingUid, setAdminViewingUid] = useState(null)
  const [adminSwitching, setAdminSwitching] = useState(false)
  const [adminEditMode, setAdminEditMode] = useState(false)
  const [showConfirmSave, setShowConfirmSave] = useState(null)
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [displayNameSaving, setDisplayNameSaving] = useState(false)

  const { goals, saveGoal, getGoalByDay, buybackTarget, confirmShift, unconfirmShift, bulkUpdateLocations, exportData, loadGoals } = useGoals(user)
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [showBuybackModal, setShowBuybackModal] = useState(false)
  const [showBulkLocationModal, setShowBulkLocationModal] = useState(false)
  const [breakdownDay, setBreakdownDay] = useState(null)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [excessExpanded, setExcessExpanded] = useState(false)
  const [showTeamBonusModal, setShowTeamBonusModal] = useState(false)

  // Team bonus - determine whose bonus share to show
  const bonusViewUid = adminViewingUid || user?.uid
  const { teamBonus, myBonusShare, loadTeamBonus, saveTeamBonus } = useTeamBonus(viewYear, viewMonth, bonusViewUid)

  // Proof images - use the active UID (member being viewed by admin, or own UID)
  const proofImageUid = adminViewingUid || user?.uid
  const { uploadingShift: proofUploadingShift, uploadImages: uploadProofImages, deleteImage: deleteProofImage } = useProofImages(proofImageUid)

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
    setEditingDisplayName(false)
    setShowAdminDashboard(false)
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

  const handleStartEditDisplayName = () => {
    if (viewingMember) {
      setDisplayNameDraft(viewingMember.displayName || '')
      setEditingDisplayName(true)
    }
  }

  const handleSaveDisplayName = async () => {
    if (!adminViewingUid || !displayNameDraft.trim()) return
    setDisplayNameSaving(true)
    try {
      await updateMemberDisplayName(adminViewingUid, displayNameDraft.trim())
      setEditingDisplayName(false)
    } catch (err) {
      console.error('Failed to update display name:', err)
    } finally {
      setDisplayNameSaving(false)
    }
  }

  const handleCancelEditDisplayName = () => {
    setEditingDisplayName(false)
  }

  const handleBackToDashboard = () => {
    clearAdminMemberService()
    setAdminViewingUid(null)
    setAdminEditMode(false)
    setEditingDisplayName(false)
    setShowAdminDashboard(true)
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
    // When member edits their own data, clear admin confirmations (requires re-verification)
    // When admin edits member data, preserve existing admin confirmations
    const morningAdminVal = adminViewingUid ? undefined : false
    const afternoonAdminVal = adminViewingUid ? undefined : false
    const morningLocVal = undefined
    const afternoonLocVal = undefined
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
      morningAdminVal,
      afternoonAdminVal,
      morningLocVal,
      afternoonLocVal,
      args.morningImages,
      args.afternoonImages,
      adminViewingUid ? (args.morningAllowance !== '' ? args.morningAllowance : undefined) : undefined,
      adminViewingUid ? (args.afternoonAllowance !== '' ? args.afternoonAllowance : undefined) : undefined
    )
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const handleAdminConfirmShift = (shift, location) => {
    if (selectedDay && adminViewingUid) {
      confirmShift(selectedDay, shift, location)
      const updated = getGoalByDay(selectedDay)
      setEditingGoal(updated)
    }
  }

  const handleAdminUnconfirmShift = (shift) => {
    if (selectedDay && adminViewingUid) {
      unconfirmShift(selectedDay, shift)
      const updated = getGoalByDay(selectedDay)
      setEditingGoal(updated)
    }
  }

  // Upload files to Firebase Storage only (no Firestore save) — called from GoalModal on Save
  const handleUploadFilesOnly = async (shift, files, existingImages) => {
    if (!selectedDay) return existingImages || []
    return uploadProofImages(selectedDay, shift, files, existingImages || [])
  }

  // Delete an image from Firebase Storage only (no Firestore save) — called from GoalModal on X click
  const handleDeleteFromStorage = async (image) => {
    await deleteProofImage(image, [])
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
    afternoonConfirmed,
    morningImages,
    afternoonImages,
    morningAllowance,
    afternoonAllowance
  ) => {
    const args = {
      day: selectedDay,
      morningAmount, afternoonAmount,
      morningActual, afternoonActual,
      morningCustomRate, afternoonCustomRate,
      morningCustomAmount, afternoonCustomAmount,
      morningStartTime, morningEndTime,
      afternoonStartTime, afternoonEndTime,
      morningConfirmed, afternoonConfirmed,
      morningImages, afternoonImages,
      morningAllowance, afternoonAllowance
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

  const handleBulkLocationApply = (dateStrs, location) => {
    bulkUpdateLocations(dateStrs, location)
    setShowBulkLocationModal(false)
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
    setShowAdminDashboard(true)
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
    let totalActual = 0
    let totalAllowance = 0
    const customRates = new Set()
    const excessSources = []
    const pad = (n) => String(n).padStart(2, '0')
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
      const goal = goals[dateStr]
      if (goal?.hasGoals) {
        if (goal.morningActual) totalActual += goal.morningActual
        if (goal.afternoonActual) totalActual += goal.afternoonActual

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
          if (goal.morningAllowance) totalAllowance += goal.morningAllowance
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
          if (goal.afternoonAllowance) totalAllowance += goal.afternoonAllowance
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
      excessAllocation,
      totalActual: Math.round(totalActual * 100) / 100,
      totalAllowance: Math.round(totalAllowance * 100) / 100
    }
  }

  const { wages: monthlyWages, commission45, commission35, commissionCustom, customRates, excessRevenue: monthlyExcess, totalBuybackCost: monthlyBuybackCost, availableExcess, excessAllocation, totalActual: monthlyTotalActual, totalAllowance: monthlyTotalAllowance } = calculateMonthlyEarnings()
  const monthlyTotal = Math.round((monthlyWages + commission45 + commission35 + commissionCustom + myBonusShare + monthlyTotalAllowance) * 100) / 100

  // Calculate admin confirmation progress for the viewing month (per-shift)
  const getConfirmationProgress = () => {
    const pad = (n) => String(n).padStart(2, '0')
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    let totalShifts = 0
    let confirmedShifts = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
      const goal = goals[dateStr]
      if (goal?.hasGoals) {
        if (goal.morningConfirmed) {
          totalShifts++
          if (goal.morningAdminConfirmed) confirmedShifts++
        }
        if (goal.afternoonConfirmed) {
          totalShifts++
          if (goal.afternoonAdminConfirmed) confirmedShifts++
        }
      }
    }
    return { confirmed: confirmedShifts, total: totalShifts }
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
        {user && !isAdmin && (
          <>
            <button className="roster-trigger-btn" onClick={() => setShowRoster(true)}>
              My Roster
            </button>
            <button className="roster-trigger-btn" onClick={() => setShowBulkLocationModal(true)}>
              Set Locations
            </button>
          </>
        )}
        <AuthButton
          user={user}
          onSignInClick={() => setShowLoginModal(true)}
          onSignOut={handleSignOut}
          onChangeEmail={() => setShowChangeEmailModal(true)}
        />
      </div>

      {isAdmin && (showAdminDashboard || !adminViewingUid) ? (
        <AdminDashboard
          members={members}
          membersLoading={membersLoading}
          currentUserUid={user?.uid}
          onSelectMember={handleAdminSelectMember}
          onTeamBonus={() => setShowTeamBonusModal(true)}
          onManageLocations={() => { loadLocations(); setShowLocationManager(true) }}
          onManageMembers={() => setShowMemberManager(true)}
          onOpenRoster={() => setShowRoster(true)}
          onLocationPerformance={() => {
            const key = `${viewYear}-${viewMonth}`
            if (locPerfLoadedKey !== key) loadLocPerf(members, viewYear, viewMonth)
            setShowLocPerf(true)
          }}
        />
      ) : (
        <>
          {isAdmin && (
            <AdminBar
              members={members}
              membersLoading={membersLoading}
              selectedUid={adminViewingUid}
              currentUserUid={user?.uid}
              editMode={adminEditMode}
              onSelectMember={handleAdminSelectMember}
              onToggleEditMode={() => setAdminEditMode(!adminEditMode)}
              onTeamBonus={() => setShowTeamBonusModal(true)}
              onManageLocations={() => { loadLocations(); setShowLocationManager(true) }}
              onManageMembers={() => setShowMemberManager(true)}
              onOpenRoster={() => setShowRoster(true)}
              onLocationPerformance={() => {
                const key = `${viewYear}-${viewMonth}`
                if (locPerfLoadedKey !== key) loadLocPerf(members, viewYear, viewMonth)
                setShowLocPerf(true)
              }}
              onBackToDashboard={handleBackToDashboard}
            />
          )}

          {adminViewingUid && viewingMember && (
            <div className="admin-viewing-banner">
              {editingDisplayName ? (
                <span className="display-name-edit">
                  <span>Viewing: </span>
                  <input
                    className="display-name-input"
                    value={displayNameDraft}
                    onChange={(e) => setDisplayNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDisplayName()
                      if (e.key === 'Escape') handleCancelEditDisplayName()
                    }}
                    disabled={displayNameSaving}
                    autoFocus
                  />
                  <button className="display-name-save-btn" onClick={handleSaveDisplayName} disabled={displayNameSaving || !displayNameDraft.trim()}>
                    {displayNameSaving ? '...' : 'Save'}
                  </button>
                  <button className="display-name-cancel-btn" onClick={handleCancelEditDisplayName} disabled={displayNameSaving}>
                    Cancel
                  </button>
                </span>
              ) : (
                <span>
                  Viewing: {viewingMember.displayName || viewingMember.email}
                  {!viewingMember.isAdmin && (
                    <button className="display-name-edit-btn" onClick={handleStartEditDisplayName} title="Edit display name">&#9998;</button>
                  )}
                </span>
              )}
              {monthlyTotalActual > 0 && (
                <span className="actual-revenue-pill">
                  Actual: ${monthlyTotalActual.toLocaleString()}
                </span>
              )}
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
            locations={visibleLocations}
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
                {monthlyTotalAllowance > 0 && (
                  <div className="monthly-row allowance-row">
                    <span className="monthly-label">Allowance:</span>
                    <span className="monthly-value">+${monthlyTotalAllowance.toLocaleString()}</span>
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
        </>
      )}

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
          initialMorningAdminConfirmed={editingGoal?.morningAdminConfirmed}
          initialAfternoonAdminConfirmed={editingGoal?.afternoonAdminConfirmed}
          initialMorningLocation={editingGoal?.morningLocation}
          initialAfternoonLocation={editingGoal?.afternoonLocation}
          initialMorningProofImages={editingGoal?.morningProofImages}
          initialAfternoonProofImages={editingGoal?.afternoonProofImages}
          initialMorningAllowance={editingGoal?.morningAllowance}
          initialAfternoonAllowance={editingGoal?.afternoonAllowance}
          isAdminViewing={!!adminViewingUid}
          locations={visibleLocations}
          onSave={handleSave}
          onCancel={handleCancel}
          onConfirmShift={handleAdminConfirmShift}
          onUnconfirmShift={handleAdminUnconfirmShift}
          onUploadFiles={handleUploadFilesOnly}
          onDeleteFromStorage={handleDeleteFromStorage}
          proofUploadingShift={proofUploadingShift}
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

      {showBulkLocationModal && (
        <BulkLocationModal
          goals={goals}
          viewYear={viewYear}
          viewMonth={viewMonth}
          locations={visibleLocations}
          onApply={handleBulkLocationApply}
          onClose={() => setShowBulkLocationModal(false)}
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

      {showChangeEmailModal && user && (
        <ChangeEmailModal
          currentEmail={user.email}
          onChangeEmail={changeEmail}
          onClose={() => setShowChangeEmailModal(false)}
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

      {showLocationManager && (
        <LocationManagerModal
          locations={locations}
          onAdd={addLocation}
          onUpdate={updateLocation}
          onRemove={removeLocation}
          onReorder={reorderLocations}
          onToggleVisible={setLocationVisibility}
          onClose={() => setShowLocationManager(false)}
        />
      )}

      {showMemberManager && (
        <MemberManagerModal
          members={members}
          onUpdateDisplayName={updateMemberDisplayName}
          onClose={() => setShowMemberManager(false)}
        />
      )}

      {showRoster && user && (
        <RosterModal
          isAdmin={isAdmin}
          currentUserUid={user.uid}
          currentUserDisplayName={user.displayName || user.email}
          members={members}
          locations={visibleLocations}
          onClose={() => setShowRoster(false)}
        />
      )}

      {showLocPerf && (
        <LocationPerformanceModal
          stats={locPerfStats}
          loading={locPerfLoading}
          year={viewYear}
          month={viewMonth}
          onClose={() => setShowLocPerf(false)}
        />
      )}
    </div>
  )
}
