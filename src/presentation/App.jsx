import { useState, useEffect } from 'react'
import { useGoals } from './hooks/useGoals'
import { useAuth } from './hooks/useAuth'
import { useAdminMembers } from './hooks/useAdminMembers'
import { useLocations } from './hooks/useLocations'
import { CalendarGrid } from './components/CalendarGrid'
import { GoalModal } from './components/GoalModal'
import { BuybackModal } from './components/BuybackModal'
import { BulkLocationModal } from './components/BulkLocationModal'
import { BulkVerifyModal } from './components/BulkVerifyModal'
import { BulkAllowanceModal } from './components/BulkAllowanceModal'
import { WageBreakdownModal } from './components/WageBreakdownModal'
import { LoginModal } from './components/LoginModal'
import { ChangeEmailModal } from './components/ChangeEmailModal'
import { ChangePasswordModal } from './components/ChangePasswordModal'
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
import { useLocationCalendar } from './hooks/useLocationCalendar'
import { LocationCalendarModal } from './components/LocationCalendarModal'
import { AllMembersCalendar } from './components/AllMembersCalendar'
import { MonthlySalaryModal } from './components/MonthlySalaryModal'
import { useMemberEarnings } from './hooks/useMemberEarnings'
import { MiscAdjustmentsSection } from './components/MiscAdjustmentsSection'
import { useMiscAdjustments } from './hooks/useMiscAdjustments'
import { useWorkingMonth } from './hooks/useWorkingMonth'
import { useSalaryConfirmation } from './hooks/useSalaryConfirmation'
import { useUpdateChecker } from './hooks/useUpdateChecker'
import { salaryConfirmationService } from '../infrastructure/firebase/salaryConfirmationService'
import { authService } from '../infrastructure/firebase/authService'
import { initFirestoreService, clearFirestoreService, getLocalGoalService, getFirestoreRepository, initAdminMemberService, clearAdminMemberService, subscribeAdminMemberGoals } from '../di/container'
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

  const { user, loading: authLoading, isAdmin, profileDisplayName, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, changeEmail, changePassword, setPassword } = useAuth()
  const { workingMonth: configMonth, workingYear: configYear, loading: workingMonthLoading, saveWorkingMonth } = useWorkingMonth()
  const { members, loading: membersLoading, updateMemberDisplayName, toggleMemberDisabled, updateMemberColor, updateMemberEmail } = useAdminMembers(isAdmin, !!user)
  const { earnings: memberEarnings, loading: memberEarningsLoading, loadEarnings: loadMemberEarnings } = useMemberEarnings()
  const [initialSalaryUrl] = useState(() => {
    const match = window.location.pathname.match(/^\/salary\/(\d{4})\/(\d{1,2})$/)
    return match ? { year: Number(match[1]), month: Number(match[2]) - 1 } : null
  })
  const [viewYear, setViewYear] = useState(initialSalaryUrl ? initialSalaryUrl.year : currentYear)
  const [viewMonth, setViewMonth] = useState(initialSalaryUrl ? initialSalaryUrl.month : currentMonth)
  const [initialMonthApplied, setInitialMonthApplied] = useState(false)
  const [firestoreReady, setFirestoreReady] = useState(false)
  const { locations, visibleLocations, addLocation, updateLocation, removeLocation, reorderLocations, setLocationVisibility, loadLocations } = useLocations(firestoreReady)
  const [syncing, setSyncing] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [showLocationManager, setShowLocationManager] = useState(false)
  const [showMemberManager, setShowMemberManager] = useState(false)
  const [showRoster, setShowRoster] = useState(() => window.location.pathname === '/roster')
  // Extract member UID from URL on initial load (e.g. /member/abc123)
  const [initialMemberUid] = useState(() => {
    const match = window.location.pathname.match(/^\/member\/(.+)$/)
    return match ? match[1] : null
  })
  const [showLocPerf, setShowLocPerf] = useState(false)
  const { stats: locPerfStats, teamBonus: locPerfBonus, loading: locPerfLoading, loadedKey: locPerfLoadedKey, loadStats: loadLocPerf } = useLocationPerformance()
  const { membersGoals: locCalGoals, loading: locCalLoading, loadedKey: locCalLoadedKey, loadGoals: loadLocCalGoals } = useLocationCalendar()
  const [showLocCalModal, setShowLocCalModal] = useState(false)

  // Admin state
  const [showAdminDashboard, setShowAdminDashboard] = useState(!initialMemberUid)
  const [adminViewingUid, setAdminViewingUid] = useState(null)
  const [adminSwitching, setAdminSwitching] = useState(false)
  const [adminEditMode, setAdminEditMode] = useState(false)
  const [viewAllMode, setViewAllMode] = useState(false)
  const [showConfirmSave, setShowConfirmSave] = useState(null)
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [displayNameSaving, setDisplayNameSaving] = useState(false)

  const { goals, saveGoal, getGoalByDay, buybackTarget, confirmShift, unconfirmShift, bulkUpdateLocations, bulkVerifyShifts, bulkUpdateAllowances, exportData, loadGoals, getLastLockedLocation } = useGoals(user)
  const [selectedDay, setSelectedDay] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [showBuybackModal, setShowBuybackModal] = useState(false)
  const [showBulkLocationModal, setShowBulkLocationModal] = useState(false)
  const [showBulkVerifyModal, setShowBulkVerifyModal] = useState(false)
  const [showBulkAllowanceModal, setShowBulkAllowanceModal] = useState(false)
  const [breakdownDay, setBreakdownDay] = useState(null)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [excessExpanded, setExcessExpanded] = useState(false)
  const [showTeamBonusModal, setShowTeamBonusModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(() => /^\/salary(\/\d{4}\/\d{1,2})?$/.test(window.location.pathname))

  // Team bonus - determine whose bonus share to show
  const bonusViewUid = adminViewingUid || user?.uid
  const { teamBonus, myBonusShare, myBonusBreakdown, loadTeamBonus, saveTeamBonus } = useTeamBonus(viewYear, viewMonth, bonusViewUid)

  // Misc adjustments - same uid pattern as team bonus
  const { miscItems, miscTotal, saveAdjustments: saveMiscAdjustments } = useMiscAdjustments(viewYear, viewMonth, bonusViewUid)

  // Salary confirmation
  const { adminConfirmed: salaryAdminConfirmed, adminConfirmedAt: salaryAdminConfirmedAt, memberConfirmed: salaryMemberConfirmed, memberConfirmedAt: salaryMemberConfirmedAt, publishSalary, confirmSalary } = useSalaryConfirmation(viewYear, viewMonth, bonusViewUid)

  // Update checker
  const { updateAvailable, reload: reloadForUpdate, dismiss: dismissUpdate } = useUpdateChecker()

  // All salary confirmations for the working month (admin dashboard indicators)
  const [salaryStatuses, setSalaryStatuses] = useState({})
  useEffect(() => {
    if (!isAdmin || configMonth === null || configMonth === undefined || configYear === null || configYear === undefined) return
    const pad = (n) => String(n).padStart(2, '0')
    const monthKey = `${configYear}-${pad(configMonth + 1)}`
    salaryConfirmationService.getAllConfirmations(monthKey).then(setSalaryStatuses)
  }, [isAdmin, configMonth, configYear])

  // Proof images - use the active UID (member being viewed by admin, or own UID)
  const proofImageUid = adminViewingUid || user?.uid
  const { uploadingShift: proofUploadingShift, uploadImages: uploadProofImages, deleteImage: deleteProofImage } = useProofImages(proofImageUid)

  // Reload all-members goals when year/month changes while in viewAllMode
  useEffect(() => {
    if (!viewAllMode || !isAdmin) return
    const teamMembers = members.filter(m => !m.isAdmin && !m.disabled)
    if (teamMembers.length === 0) return
    const key = `${viewYear}-${viewMonth}`
    if (locCalLoadedKey !== key) loadLocCalGoals(teamMembers, viewYear, viewMonth)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAllMode, viewYear, viewMonth])

  // Apply working month as initial view once loaded (only on first load, skip if URL specified a month)
  useEffect(() => {
    if (!workingMonthLoading && !initialMonthApplied) {
      if (!initialSalaryUrl && configYear !== null && configMonth !== null) {
        setViewYear(configYear)
        setViewMonth(configMonth)
      }
      setInitialMonthApplied(true)
    }
  }, [workingMonthLoading, initialMonthApplied, configYear, configMonth, initialSalaryUrl])

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
      subscribeAdminMemberGoals(() => loadGoals())
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

  // Sync URL with app state (roster / member views)
  useEffect(() => {
    const path = window.location.pathname
    if (showRoster && path !== '/roster') {
      window.history.pushState({ roster: true }, '', '/roster')
    } else if (!showRoster && path === '/roster') {
      window.history.pushState({}, '', '/')
    }
  }, [showRoster])

  useEffect(() => {
    const path = window.location.pathname
    const salaryPath = `/salary/${viewYear}/${String(viewMonth + 1).padStart(2, '0')}`
    if (showSalaryModal && path !== salaryPath) {
      window.history.pushState({ salary: true }, '', salaryPath)
    } else if (!showSalaryModal && path.startsWith('/salary')) {
      window.history.pushState({}, '', '/')
    }
  }, [showSalaryModal, viewYear, viewMonth])

  useEffect(() => {
    const path = window.location.pathname
    const expectedPath = adminViewingUid ? `/member/${adminViewingUid}` : null
    if (adminViewingUid && path !== expectedPath) {
      window.history.pushState({ member: adminViewingUid }, '', expectedPath)
    } else if (!adminViewingUid && path.startsWith('/member/')) {
      window.history.pushState({}, '', '/')
    }
  }, [adminViewingUid])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      setShowRoster(path === '/roster')
      const salaryMatch = path.match(/^\/salary\/(\d{4})\/(\d{1,2})$/)
      if (salaryMatch) {
        setViewYear(Number(salaryMatch[1]))
        setViewMonth(Number(salaryMatch[2]) - 1)
        setShowSalaryModal(true)
      } else {
        setShowSalaryModal(path.startsWith('/salary'))
      }
      const memberMatch = path.match(/^\/member\/(.+)$/)
      if (memberMatch) {
        const uid = memberMatch[1]
        if (uid !== adminViewingUid) {
          handleAdminSelectMember(uid)
        }
      } else if (adminViewingUid && !path.startsWith('/member/')) {
        handleBackToDashboard()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [adminViewingUid])

  // Restore member view from URL on initial load (after members are available)
  useEffect(() => {
    if (initialMemberUid && isAdmin && !membersLoading && members.length > 0 && !adminViewingUid && firestoreReady) {
      const memberExists = members.some(m => m.uid === initialMemberUid)
      if (memberExists) {
        handleAdminSelectMember(initialMemberUid)
      }
    }
  }, [initialMemberUid, isAdmin, membersLoading, members, firestoreReady])

  // Find the member being viewed (for display purposes)
  const viewingMember = adminViewingUid
    ? members.find((m) => m.uid === adminViewingUid)
    : null

  const isCurrentMonth = viewYear === currentYear && viewMonth === currentMonth
  // Admins can go back up to 12 months for retroactive salary calculations; members can go back 1 month
  const maxMonthsBack = isAdmin ? 12 : 1
  const minDate = new Date(currentYear, currentMonth - maxMonthsBack, 1)
  const minYear = minDate.getFullYear()
  const minMonth = minDate.getMonth()
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

  const doSaveGoal = (data) => {
    // When member edits their own data, clear admin confirmations (requires re-verification)
    // When admin edits member data, preserve existing admin confirmations
    const payload = {
      ...data,
      morningAdminConfirmed: adminViewingUid ? undefined : false,
      afternoonAdminConfirmed: adminViewingUid ? undefined : false,
      // Admin-only fields: pass through when admin is editing (empty → null via parseAmount),
      // set undefined when non-admin saves to preserve existing values
      morningAllowance: adminViewingUid ? data.morningAllowance : undefined,
      afternoonAllowance: adminViewingUid ? data.afternoonAllowance : undefined,
      morningCustomWage: adminViewingUid ? data.morningCustomWage : undefined,
      afternoonCustomWage: adminViewingUid ? data.afternoonCustomWage : undefined
    }
    saveGoal(payload)
    setSelectedDay(null)
    setEditingGoal(null)
  }

  const handleAdminConfirmShift = (shift) => {
    if (selectedDay && adminViewingUid) {
      confirmShift(selectedDay, shift)
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

  const handleSave = (data) => {
    const args = { day: selectedDay, ...data }

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

  const handleOpenLocPerf = () => {
    const teamMembers = members.filter(m => !m.isAdmin && !m.disabled)
    const key = `${viewYear}-${viewMonth}`
    if (locPerfLoadedKey !== key) loadLocPerf(teamMembers, viewYear, viewMonth)
    setShowLocPerf(true)
  }

  const handleOpenLocCal = () => {
    const teamMembers = members.filter(m => !m.isAdmin && !m.disabled)
    const key = `${viewYear}-${viewMonth}`
    if (locCalLoadedKey !== key) loadLocCalGoals(teamMembers, viewYear, viewMonth)
    setShowLocCalModal(true)
  }

  const handleEnterViewAll = () => {
    setViewAllMode(true)
    setShowAdminDashboard(false)
    setAdminViewingUid(null)
    const teamMembers = members.filter(m => !m.isAdmin && !m.disabled)
    const key = `${viewYear}-${viewMonth}`
    if (locCalLoadedKey !== key) loadLocCalGoals(teamMembers, viewYear, viewMonth)
  }

  const handleExitViewAll = () => {
    setViewAllMode(false)
    setShowAdminDashboard(true)
  }

  const handleBulkLocationApply = (dateStrs, location) => {
    bulkUpdateLocations(dateStrs, location)
    setShowBulkLocationModal(false)
  }

  const handleBulkVerifyApply = (dateStrs) => {
    bulkVerifyShifts(dateStrs)
    setShowBulkVerifyModal(false)
  }

  const handleBulkAllowanceApply = (dateStrs, amount, dayShiftMap) => {
    bulkUpdateAllowances(dateStrs, amount, dayShiftMap)
    setShowBulkAllowanceModal(false)
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
    let commissionIg = 0
    let excessRevenue = 0
    let totalBuybackCost = 0
    let totalActual = 0
    let totalAllowance = 0
    const customRates = new Set()
    const excessSources = []
    const buybackTargets = []
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

          const morningIgFeatured = goal.morningIgFeaturedAmount || 0
          const morningIgOther = goal.morningIgOtherAmount || 0
          const morningHasIg = morningIgFeatured > 0 || morningIgOther > 0
          const morningEffectiveActual = (goal.morningActual || 0) + morningIgFeatured + morningIgOther

          if (morningHasIg) {
            // IG commission replaces standard 4.5%/3.5%
            commissionIg += morningIgFeatured * 0.07 + morningIgOther * 0.05
            // Excess still tracked using effective actual
            if (goal.morningCalculatedWage === 80 && goal.morningAmount && morningEffectiveActual > goal.morningAmount) {
              const excess = morningEffectiveActual - goal.morningAmount
              excessRevenue += excess
              excessSources.push({ key: `${dateStr}:morning`, dateStr, day, shift: 'morning', shiftLabel: 'A', target: goal.morningAmount, actual: morningEffectiveActual, excess })
            }
            if (goal.morningBoughtBack && goal.morningAmount) {
              totalBuybackCost += goal.morningAmount
              buybackTargets.push({ key: `${dateStr}:morning`, dateStr, day, shift: 'morning', shiftLabel: 'A', amount: goal.morningAmount, actual: morningEffectiveActual })
            }
          } else {
            if (goal.morningCalculatedWage === 80 && goal.morningActual > 0) {
              commission45 += goal.morningAmount * 0.045
              if (goal.morningAmount && goal.morningActual > goal.morningAmount) {
                const excess = goal.morningActual - goal.morningAmount
                excessRevenue += excess
                excessSources.push({ key: `${dateStr}:morning`, dateStr, day, shift: 'morning', shiftLabel: 'A', target: goal.morningAmount, actual: goal.morningActual, excess })
              }
            } else if (goal.morningBoughtBack && goal.morningAmount) {
              commission35 += goal.morningAmount * 0.035
              totalBuybackCost += goal.morningAmount
              buybackTargets.push({ key: `${dateStr}:morning`, dateStr, day, shift: 'morning', shiftLabel: 'A', amount: goal.morningAmount, actual: goal.morningActual || 0 })
            }
          }

          if (goal.morningCustomRate && goal.morningCustomAmount) {
            commissionCustom += goal.morningCustomAmount * (goal.morningCustomRate / 100)
            customRates.add(Number(goal.morningCustomRate))
            totalActual += goal.morningCustomAmount
          }
          if (goal.morningAllowance) totalAllowance += goal.morningAllowance
        }

        if (goal.afternoonConfirmed) {
          const afternoonWage = goal.afternoonWage || 65
          const afternoonHours = goal.afternoonShiftHours ?? DEFAULT_SHIFT_HOURS
          wages += Math.round(afternoonWage * afternoonHours * 100) / 100

          const afternoonIgFeatured = goal.afternoonIgFeaturedAmount || 0
          const afternoonIgOther = goal.afternoonIgOtherAmount || 0
          const afternoonHasIg = afternoonIgFeatured > 0 || afternoonIgOther > 0
          const afternoonEffectiveActual = (goal.afternoonActual || 0) + afternoonIgFeatured + afternoonIgOther

          if (afternoonHasIg) {
            commissionIg += afternoonIgFeatured * 0.07 + afternoonIgOther * 0.05
            if (goal.afternoonCalculatedWage === 80 && goal.afternoonAmount && afternoonEffectiveActual > goal.afternoonAmount) {
              const excess = afternoonEffectiveActual - goal.afternoonAmount
              excessRevenue += excess
              excessSources.push({ key: `${dateStr}:afternoon`, dateStr, day, shift: 'afternoon', shiftLabel: 'B', target: goal.afternoonAmount, actual: afternoonEffectiveActual, excess })
            }
            if (goal.afternoonBoughtBack && goal.afternoonAmount) {
              totalBuybackCost += goal.afternoonAmount
              buybackTargets.push({ key: `${dateStr}:afternoon`, dateStr, day, shift: 'afternoon', shiftLabel: 'B', amount: goal.afternoonAmount, actual: afternoonEffectiveActual })
            }
          } else {
            if (goal.afternoonCalculatedWage === 80 && goal.afternoonActual > 0) {
              commission45 += goal.afternoonAmount * 0.045
              if (goal.afternoonAmount && goal.afternoonActual > goal.afternoonAmount) {
                const excess = goal.afternoonActual - goal.afternoonAmount
                excessRevenue += excess
                excessSources.push({ key: `${dateStr}:afternoon`, dateStr, day, shift: 'afternoon', shiftLabel: 'B', target: goal.afternoonAmount, actual: goal.afternoonActual, excess })
              }
            } else if (goal.afternoonBoughtBack && goal.afternoonAmount) {
              commission35 += goal.afternoonAmount * 0.035
              totalBuybackCost += goal.afternoonAmount
              buybackTargets.push({ key: `${dateStr}:afternoon`, dateStr, day, shift: 'afternoon', shiftLabel: 'B', amount: goal.afternoonAmount, actual: goal.afternoonActual || 0 })
            }
          }

          if (goal.afternoonCustomRate && goal.afternoonCustomAmount) {
            commissionCustom += goal.afternoonCustomAmount * (goal.afternoonCustomRate / 100)
            customRates.add(Number(goal.afternoonCustomRate))
            totalActual += goal.afternoonCustomAmount
          }
          if (goal.afternoonAllowance) totalAllowance += goal.afternoonAllowance
        }
      }
    }

    const availableExcess = Math.max(0, excessRevenue - totalBuybackCost)

    // FIFO allocation: consume excess from earliest shifts first
    // Track which sources fund which buyback targets
    const excessAllocation = {}
    const buybackFunding = [] // { source, target, amount }
    let remaining = totalBuybackCost
    for (const source of excessSources) {
      const used = Math.min(remaining, source.excess)
      remaining -= used
      excessAllocation[source.key] = {
        excess: Math.round(source.excess * 100) / 100,
        used: Math.round(used * 100) / 100
      }
    }

    // Build detailed funding map: for each buyback target, which sources funded it
    let buybackRemaining = [...buybackTargets.map(t => ({ ...t, remaining: t.amount, fundedBy: [] }))]
    const sourcePool = excessSources.map(s => ({ ...s, available: s.excess }))
    for (const bt of buybackRemaining) {
      for (const sp of sourcePool) {
        if (bt.remaining <= 0 || sp.available <= 0) continue
        const draw = Math.min(bt.remaining, sp.available)
        bt.remaining = Math.round((bt.remaining - draw) * 100) / 100
        sp.available = Math.round((sp.available - draw) * 100) / 100
        bt.fundedBy.push({ sourceKey: sp.key, day: sp.day, shiftLabel: sp.shiftLabel, amount: Math.round(draw * 100) / 100 })
      }
    }

    return {
      wages: Math.round(wages * 100) / 100,
      commission45: Math.round(commission45 * 100) / 100,
      commission35: Math.round(commission35 * 100) / 100,
      commissionCustom: Math.round(commissionCustom * 100) / 100,
      commissionIg: Math.round(commissionIg * 100) / 100,
      customRates: Array.from(customRates).sort((a, b) => a - b),
      excessRevenue: Math.round(excessRevenue * 100) / 100,
      totalBuybackCost: Math.round(totalBuybackCost * 100) / 100,
      availableExcess: Math.round(availableExcess * 100) / 100,
      excessAllocation,
      excessSources: excessSources.map(s => ({ ...s, excess: Math.round(s.excess * 100) / 100 })),
      buybackTargets: buybackRemaining.map(bt => ({ ...bt, amount: Math.round(bt.amount * 100) / 100 })),
      totalActual: Math.round(totalActual * 100) / 100,
      totalAllowance: Math.round(totalAllowance * 100) / 100
    }
  }

  const { wages: monthlyWages, commission45, commission35, commissionCustom, commissionIg, customRates, excessRevenue: monthlyExcess, totalBuybackCost: monthlyBuybackCost, availableExcess, excessAllocation, excessSources: monthlyExcessSources, buybackTargets: monthlyBuybackTargets, totalActual: monthlyTotalActual, totalAllowance: monthlyTotalAllowance } = calculateMonthlyEarnings()
  const monthlyTotal = Math.round((monthlyWages + commission45 + commission35 + commissionCustom + commissionIg + myBonusShare + monthlyTotalAllowance + miscTotal) * 100) / 100

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

  if (authLoading || (!initialMonthApplied && workingMonthLoading)) {
    return (
      <div className="app">
        <div className="loading-screen">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {(!user || !isAdmin) && (
        <div className="app-header">
          {user && !isAdmin && (
            <>
              <button className="roster-trigger-btn" onClick={() => setShowRoster(true)}>
                My Roster
              </button>
              <AuthButton
                user={user}
                profileDisplayName={profileDisplayName}
                onSignInClick={() => setShowLoginModal(true)}
                onSignOut={handleSignOut}
                onChangeEmail={() => setShowChangeEmailModal(true)}
                onChangePassword={() => setShowChangePasswordModal(true)}
                onSetPassword={() => setShowChangePasswordModal(true)}
                onSetLocations={() => setShowBulkLocationModal(true)}
              />
            </>
          )}
          {!user && (
            <AuthButton
              user={user}
              onSignInClick={() => setShowLoginModal(true)}
            />
          )}
        </div>
      )}

      {!user ? (
        <div className="auth-screen">
          <LoginModal
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onGoogleSignIn={handleGoogleSignIn}
            onClose={() => {}}
            inline
          />
        </div>
      ) : isAdmin && (showAdminDashboard || !adminViewingUid) && !viewAllMode ? (
        <AdminDashboard
          members={members}
          membersLoading={membersLoading}
          currentUserUid={user?.uid}
          onSelectMember={handleAdminSelectMember}
          onTeamBonus={() => setShowTeamBonusModal(true)}
          onManageLocations={() => { loadLocations(); setShowLocationManager(true) }}
          onManageMembers={() => {
            loadMemberEarnings(members.filter(m => !m.isAdmin))
            setShowMemberManager(true)
          }}
          onOpenRoster={() => setShowRoster(true)}
          onLocationPerformance={handleOpenLocPerf}
          onViewAll={handleEnterViewAll}
          workingMonth={configMonth}
          workingYear={configYear}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onSaveWorkingMonth={async (y, m) => { await saveWorkingMonth(y, m, user?.uid); setViewYear(y); setViewMonth(m) }}
          salaryStatuses={salaryStatuses}
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
              viewAllMode={viewAllMode}
              onSelectMember={handleAdminSelectMember}
              onToggleEditMode={() => setAdminEditMode(!adminEditMode)}
              onBackToDashboard={handleBackToDashboard}
              onExitViewAll={handleExitViewAll}
              user={user}
              profileDisplayName={profileDisplayName}
              onSignOut={handleSignOut}
              onChangeEmail={() => setShowChangeEmailModal(true)}
              onChangePassword={() => setShowChangePasswordModal(true)}
              onSetPassword={() => setShowChangePasswordModal(true)}
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
              {confirmationProgress && confirmationProgress.confirmed < confirmationProgress.total && (
                <button className="bulk-verify-trigger-btn" onClick={() => setShowBulkVerifyModal(true)}>
                  Bulk Verify
                </button>
              )}
              <button className="bulk-verify-trigger-btn bulk-location-trigger-btn" onClick={() => setShowBulkLocationModal(true)}>
                Set Locations
              </button>
              <button className="bulk-verify-trigger-btn bulk-location-trigger-btn" onClick={() => setShowBulkAllowanceModal(true)}>
                Set Allowance
              </button>
              <MiscAdjustmentsSection
                items={miscItems}
                miscTotal={miscTotal}
                onSave={saveMiscAdjustments}
                adminUid={user?.uid}
              />
            </div>
          )}

          {(syncing || adminSwitching) && (
            <div className="syncing-banner">{adminSwitching ? 'Loading member data...' : 'Syncing data...'}</div>
          )}

          <div className="month-nav">
            <button className="nav-btn" onClick={handlePrev} disabled={!canGoPrev}>&larr;</button>
            <h1>{MONTH_NAMES[viewMonth]} {viewYear}</h1>
            <button className="nav-btn" onClick={handleNext} disabled={!canGoNext}>&rarr;</button>
            {!viewAllMode && (isAdmin || salaryAdminConfirmed) && (
              <button className="salary-btn" onClick={() => setShowSalaryModal(true)} title="View Salary Details">Salary</button>
            )}
          </div>

          {viewAllMode ? (
            <AllMembersCalendar
              membersGoals={locCalGoals}
              loading={locCalLoading}
              year={viewYear}
              month={viewMonth}
              locations={visibleLocations}
            />
          ) : (
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
          )}

          {!viewAllMode && <div className={`monthly-summary ${summaryExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="summary-toggle" onClick={() => setSummaryExpanded(!summaryExpanded)}>
              <span className="toggle-arrow">{summaryExpanded ? '\u25BC' : '\u25B2'}</span>
            </div>
            {summaryExpanded && (
              <>
                <div className="monthly-row">
                  <span className="monthly-label">Wages:</span>
                  <span className="monthly-value">${monthlyWages.toLocaleString()}</span>
                </div>
                {commissionIg > 0 && (
                  <div className="monthly-row commission-ig-row">
                    <span className="monthly-label">IG Commission (7%/5%):</span>
                    <span className="monthly-value">+${commissionIg.toLocaleString()}</span>
                  </div>
                )}
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
                {(monthlyExcess > 0 || monthlyBuybackTargets.length > 0) && (
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

                        {/* Excess revenue sources */}
                        {monthlyExcessSources.length > 0 && (
                          <div className="excess-breakdown">
                            <div className="excess-breakdown-title">Excess Revenue Sources</div>
                            {monthlyExcessSources.map(src => {
                              const alloc = excessAllocation[src.key]
                              return (
                                <div key={src.key} className="excess-breakdown-row">
                                  <span className="excess-breakdown-date">{viewMonth + 1}/{src.day} {src.shiftLabel}</span>
                                  <span className="excess-breakdown-detail">
                                    ${src.target.toLocaleString()} → ${src.actual.toLocaleString()}
                                  </span>
                                  <span className="excess-breakdown-amount">+${src.excess.toLocaleString()}</span>
                                  {alloc && alloc.used > 0 && (
                                    <span className="excess-breakdown-used">({alloc.used === src.excess ? 'all' : `$${alloc.used.toLocaleString()}`} used)</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Buyback targets with funding sources */}
                        {monthlyBuybackTargets.length > 0 && (
                          <div className="excess-breakdown buyback-breakdown">
                            <div className="excess-breakdown-title buyback-title">Bought Back Targets</div>
                            {monthlyBuybackTargets.map(bt => (
                              <div key={bt.key} className="buyback-breakdown-item">
                                <div className="excess-breakdown-row buyback-row">
                                  <span className="excess-breakdown-date">{viewMonth + 1}/{bt.day} {bt.shiftLabel}</span>
                                  <span className="excess-breakdown-detail">
                                    actual: ${bt.actual.toLocaleString()}
                                  </span>
                                  <span className="buyback-breakdown-amount">${bt.amount.toLocaleString()}</span>
                                </div>
                                {bt.fundedBy.length > 0 && (
                                  <div className="buyback-funding">
                                    {bt.fundedBy.map((f, i) => (
                                      <span key={i} className="buyback-funding-tag">
                                        {viewMonth + 1}/{f.day} {f.shiftLabel}: ${f.amount.toLocaleString()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
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
                {miscTotal !== 0 && (
                  <div className="monthly-row misc-row">
                    <span className="monthly-label">Misc Adjustments:</span>
                    <span className="monthly-value">{miscTotal >= 0 ? '+' : ''}${miscTotal.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
            {(() => {
              const hasMpf = monthlyTotal > 7000
              const mpfDeduction = hasMpf ? Math.round(monthlyTotal * 0.05 * 100) / 100 : 0
              const takeHome = hasMpf ? Math.round((monthlyTotal - mpfDeduction) * 100) / 100 : 0
              return (
                <>
                  <div className="monthly-total" onClick={(isAdmin || salaryAdminConfirmed) ? () => setShowSalaryModal(true) : undefined} style={(isAdmin || salaryAdminConfirmed) ? { cursor: 'pointer' } : undefined}>
                    <span className="monthly-label">Total: {(isAdmin || salaryAdminConfirmed) && <span className="salary-details-hint">Tap for details</span>}</span>
                    <span className="monthly-amount">${monthlyTotal.toLocaleString()}</span>
                  </div>
                  {hasMpf && !summaryExpanded && (
                    <div className="monthly-total take-home-row">
                      <span className="monthly-label">Take Home (-5% MPF):</span>
                      <span className="monthly-amount">${takeHome.toLocaleString()}</span>
                    </div>
                  )}
                  {summaryExpanded && hasMpf && (
                    <>
                      <div className="monthly-row mpf-row">
                        <span className="monthly-label">MPF (5%):</span>
                        <span className="monthly-value">-${mpfDeduction.toLocaleString()}</span>
                      </div>
                      <div className="monthly-total take-home-row">
                        <span className="monthly-label">Take Home (-5% MPF):</span>
                        <span className="monthly-amount">${takeHome.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </>
              )
            })()}
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
          </div>}
        </>
      )}

      {selectedDay && (
        <GoalModal
          day={formatSelectedDay(selectedDay)}
          goal={editingGoal}
          isAdminViewing={!!adminViewingUid}
          locations={visibleLocations}
          autoLocation={getLastLockedLocation(selectedDay)}
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

      {showBulkVerifyModal && (
        <BulkVerifyModal
          goals={goals}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onApply={handleBulkVerifyApply}
          onClose={() => setShowBulkVerifyModal(false)}
        />
      )}

      {showBulkAllowanceModal && (
        <BulkAllowanceModal
          goals={goals}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onApply={handleBulkAllowanceApply}
          onClose={() => setShowBulkAllowanceModal(false)}
        />
      )}

      {breakdownDay && (
        <WageBreakdownModal
          day={formatSelectedDay(breakdownDay)}
          goal={getGoalByDay(breakdownDay)}
          onClose={() => setBreakdownDay(null)}
        />
      )}

      {showSalaryModal && user && (
        <MonthlySalaryModal
          year={viewYear}
          month={viewMonth}
          goals={goals}
          monthlyEarnings={calculateMonthlyEarnings()}
          myBonusShare={myBonusShare}
          myBonusBreakdown={myBonusBreakdown}
          miscItems={miscItems}
          miscTotal={miscTotal}
          viewingMember={adminViewingUid ? viewingMember : { displayName: profileDisplayName, email: user?.email }}
          fullScreen
          isAdmin={isAdmin && !!adminViewingUid}
          allShiftsVerified={confirmationProgress ? confirmationProgress.confirmed === confirmationProgress.total : true}
          verificationProgress={confirmationProgress}
          adminConfirmed={salaryAdminConfirmed}
          adminConfirmedAt={salaryAdminConfirmedAt}
          memberConfirmed={salaryMemberConfirmed}
          memberConfirmedAt={salaryMemberConfirmedAt}
          onPublishSalary={isAdmin && adminViewingUid ? async (grossTotal, takeHome) => {
            await publishSalary(user.uid, grossTotal, takeHome)
            const pad = (n) => String(n).padStart(2, '0')
            const monthKey = `${configYear}-${pad(configMonth + 1)}`
            salaryConfirmationService.getAllConfirmations(monthKey).then(setSalaryStatuses)
          } : undefined}
          onConfirmSalary={!isAdmin || !adminViewingUid ? confirmSalary : undefined}
          onClose={() => setShowSalaryModal(false)}
        />
      )}

      {(showLoginModal || (showSalaryModal && !user)) && (
        <LoginModal
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onGoogleSignIn={handleGoogleSignIn}
          onClose={() => { setShowLoginModal(false); if (!user) setShowSalaryModal(false) }}
        />
      )}

      {showChangeEmailModal && user && (
        <ChangeEmailModal
          currentEmail={user.email}
          onChangeEmail={changeEmail}
          onClose={() => setShowChangeEmailModal(false)}
        />
      )}

      {showChangePasswordModal && user && (
        <ChangePasswordModal
          mode={user.providerData?.some(p => p.providerId === 'password') ? 'change' : 'set'}
          onChangePassword={changePassword}
          onSetPassword={setPassword}
          onClose={() => setShowChangePasswordModal(false)}
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
          members={members.filter(m => !m.disabled)}
          locations={visibleLocations}
          adminUid={user?.uid}
          existingBonus={teamBonus}
          onSave={async (locationsData, adminUid) => {
            await saveTeamBonus(locationsData, adminUid)
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
          onUpdateEmail={updateMemberEmail}
          onUpdateColor={updateMemberColor}
          onToggleDisabled={toggleMemberDisabled}
          onResetPassword={(uid, newPassword) => authService.adminResetPassword(uid, newPassword)}
          earnings={memberEarnings}
          earningsLoading={memberEarningsLoading}
          onClose={() => setShowMemberManager(false)}
        />
      )}

      {showRoster && user && (
        <RosterModal
          isAdmin={isAdmin}
          currentUserUid={user.uid}
          currentUserDisplayName={profileDisplayName || user.displayName || user.email}
          members={members}
          locations={visibleLocations}
          onUpdateMyColor={(colorIndex) => updateMemberColor(user.uid, colorIndex)}
          onClose={() => setShowRoster(false)}
        />
      )}

      {showLocPerf && (
        <LocationPerformanceModal
          stats={locPerfStats}
          teamBonus={locPerfBonus}
          loading={locPerfLoading}
          year={viewYear}
          month={viewMonth}
          onLoadStats={(y, m) => loadLocPerf(members.filter(mem => !mem.isAdmin && !mem.disabled), y, m)}
          onClose={() => setShowLocPerf(false)}
        />
      )}

      {showLocCalModal && (
        <LocationCalendarModal
          membersGoals={locCalGoals}
          loading={locCalLoading}
          year={viewYear}
          month={viewMonth}
          locations={visibleLocations}
          onLoad={() => loadLocCalGoals(members.filter(m => !m.isAdmin && !m.disabled), viewYear, viewMonth)}
          onClose={() => setShowLocCalModal(false)}
        />
      )}

      {updateAvailable && (
        <div className="update-toast">
          <span>A new version is available</span>
          <button className="update-toast-btn" onClick={reloadForUpdate}>Refresh</button>
          <button className="update-toast-dismiss" onClick={dismissUpdate}>&times;</button>
        </div>
      )}
    </div>
  )
}
