import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Goal, DEFAULT_MORNING_START, DEFAULT_MORNING_END, DEFAULT_AFTERNOON_START, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'
import { ShiftSection } from './ShiftSection'
import { buildExtrasChips } from './shiftDisplay'

export function GoalModal({
  day,
  goal,
  isAdminViewing,
  locations,
  autoLocation,
  onSave,
  onCancel,
  onConfirmShift,
  onUnconfirmShift,
  onUploadFiles,
  onDeleteFromStorage,
  proofUploadingShift,
  readOnly = false
}) {
  const [morningGoal, setMorningGoal] = useState('')
  const [afternoonGoal, setAfternoonGoal] = useState('')
  const [morningActual, setMorningActual] = useState('')
  const [afternoonActual, setAfternoonActual] = useState('')
  const [morningActualInput, setMorningActualInput] = useState('')
  const [afternoonActualInput, setAfternoonActualInput] = useState('')
  const [morningCustomRate, setMorningCustomRate] = useState('')
  const [afternoonCustomRate, setAfternoonCustomRate] = useState('')
  const [morningCustomAmount, setMorningCustomAmount] = useState('')
  const [afternoonCustomAmount, setAfternoonCustomAmount] = useState('')
  const [showMorningCustom, setShowMorningCustom] = useState(false)
  const [showAfternoonCustom, setShowAfternoonCustom] = useState(false)
  const [morningIgFeatured, setMorningIgFeatured] = useState('')
  const [morningIgOther, setMorningIgOther] = useState('')
  const [afternoonIgFeatured, setAfternoonIgFeatured] = useState('')
  const [afternoonIgOther, setAfternoonIgOther] = useState('')
  const [showMorningIg, setShowMorningIg] = useState(false)
  const [showAfternoonIg, setShowAfternoonIg] = useState(false)
  const [morningStartTime, setMorningStartTime] = useState(DEFAULT_MORNING_START)
  const [morningEndTime, setMorningEndTime] = useState(DEFAULT_MORNING_END)
  const [afternoonStartTime, setAfternoonStartTime] = useState(DEFAULT_AFTERNOON_START)
  const [afternoonEndTime, setAfternoonEndTime] = useState(DEFAULT_AFTERNOON_END)
  const [morningConfirmed, setMorningConfirmed] = useState(false)
  const [afternoonConfirmed, setAfternoonConfirmed] = useState(false)
  const [morningProofImages, setMorningProofImages] = useState([])
  const [afternoonProofImages, setAfternoonProofImages] = useState([])
  const [morningAllowance, setMorningAllowance] = useState('')
  const [afternoonAllowance, setAfternoonAllowance] = useState('')
  const [morningCustomWage, setMorningCustomWage] = useState('')
  const [afternoonCustomWage, setAfternoonCustomWage] = useState('')
  const [morningLocation, setMorningLocation] = useState(null)
  const [afternoonLocation, setAfternoonLocation] = useState(null)
  const [pendingMorningFiles, setPendingMorningFiles] = useState([])
  const [pendingAfternoonFiles, setPendingAfternoonFiles] = useState([])
  const [morningPendingDeletes, setMorningPendingDeletes] = useState([])
  const [afternoonPendingDeletes, setAfternoonPendingDeletes] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [previewIndex, setPreviewIndex] = useState(null)
  const [extrasExpanded, setExtrasExpanded] = useState({ morning: false, afternoon: false })

  useEffect(() => {
    // Revoke any pending object URLs from the previous open
    setPendingMorningFiles(prev => { prev.forEach(p => URL.revokeObjectURL(p.localUrl)); return [] })
    setPendingAfternoonFiles(prev => { prev.forEach(p => URL.revokeObjectURL(p.localUrl)); return [] })
    setMorningPendingDeletes([])
    setAfternoonPendingDeletes([])
    setSaveError(null)
    setExtrasExpanded({ morning: false, afternoon: false })

    setMorningGoal(goal?.morningAmount || '')
    setAfternoonGoal(goal?.afternoonAmount || '')
    setMorningActual(goal?.morningActual || '')
    setAfternoonActual(goal?.afternoonActual || '')
    setMorningActualInput(goal?.morningActual || '')
    setAfternoonActualInput(goal?.afternoonActual || '')
    setMorningCustomRate(goal?.morningCustomRate || '')
    setAfternoonCustomRate(goal?.afternoonCustomRate || '')
    setMorningCustomAmount(goal?.morningCustomAmount || '')
    setAfternoonCustomAmount(goal?.afternoonCustomAmount || '')
    setShowMorningCustom(!!(goal?.morningCustomRate || goal?.morningCustomAmount))
    setShowAfternoonCustom(!!(goal?.afternoonCustomRate || goal?.afternoonCustomAmount))
    setMorningIgFeatured(goal?.morningIgFeaturedAmount ?? '')
    setMorningIgOther(goal?.morningIgOtherAmount ?? '')
    setAfternoonIgFeatured(goal?.afternoonIgFeaturedAmount ?? '')
    setAfternoonIgOther(goal?.afternoonIgOtherAmount ?? '')
    setShowMorningIg(!!(goal?.morningIgFeaturedAmount || goal?.morningIgOtherAmount))
    setShowAfternoonIg(!!(goal?.afternoonIgFeaturedAmount || goal?.afternoonIgOtherAmount))
    setMorningStartTime(goal?.morningStartTime || DEFAULT_MORNING_START)
    setMorningEndTime(goal?.morningEndTime || DEFAULT_MORNING_END)
    setAfternoonStartTime(goal?.afternoonStartTime || DEFAULT_AFTERNOON_START)
    setAfternoonEndTime(goal?.afternoonEndTime || DEFAULT_AFTERNOON_END)
    setMorningConfirmed(!!goal?.morningConfirmed)
    setAfternoonConfirmed(!!goal?.afternoonConfirmed)
    setMorningProofImages(goal?.morningProofImages || [])
    setAfternoonProofImages(goal?.afternoonProofImages || [])
    setMorningAllowance(goal?.morningAllowance ?? '')
    setAfternoonAllowance(goal?.afternoonAllowance ?? '')
    setMorningCustomWage(goal?.morningCustomWage ?? '')
    setAfternoonCustomWage(goal?.afternoonCustomWage ?? '')
    setMorningLocation(goal?.morningLocation || autoLocation || null)
    setAfternoonLocation(goal?.afternoonLocation || autoLocation || null)
  }, [goal, autoLocation])

  // Stage files locally — no upload until Save
  const handleStageFiles = (shift, files) => {
    const staged = Array.from(files).map(file => ({
      file,
      localUrl: URL.createObjectURL(file),
      name: file.name
    }))
    if (shift === 'morning') {
      setPendingMorningFiles(prev => [...prev, ...staged])
    } else {
      setPendingAfternoonFiles(prev => [...prev, ...staged])
    }
  }

  // Toggle pending deletion for an already-uploaded image. Storage isn't
  // touched until Save — Cancel discards the mark and restores the image.
  // If the image has a pending replacement, marking for deletion also clears
  // the replacement (deletion supersedes replacement).
  const handleDeleteUploadedImage = (shift, image) => {
    const currentDeletes = shift === 'morning' ? morningPendingDeletes : afternoonPendingDeletes
    const deleteSetter = shift === 'morning' ? setMorningPendingDeletes : setAfternoonPendingDeletes
    const pendingSetter = shift === 'morning' ? setPendingMorningFiles : setPendingAfternoonFiles
    const isAlreadyMarked = currentDeletes.includes(image.path)

    deleteSetter(prev => (
      prev.includes(image.path) ? prev.filter(p => p !== image.path) : [...prev, image.path]
    ))

    if (!isAlreadyMarked) {
      pendingSetter(prev => {
        const idx = prev.findIndex(p => p.replacingPath === image.path)
        if (idx < 0) return prev
        URL.revokeObjectURL(prev[idx].localUrl)
        return prev.filter((_, i) => i !== idx)
      })
    }
  }

  // Stage a replacement for an already-uploaded image. We don't touch storage
  // until Save — that way the original is restored on Cancel and the pending
  // tile can sit in the original's position via `replacingPath`.
  const handleReplaceImage = (shift, oldImage, newFile) => {
    const setter = shift === 'morning' ? setPendingMorningFiles : setPendingAfternoonFiles
    setter(prev => {
      const staged = {
        file: newFile,
        localUrl: URL.createObjectURL(newFile),
        name: newFile.name,
        replacingPath: oldImage.path
      }
      const existingIdx = prev.findIndex(p => p.replacingPath === oldImage.path)
      if (existingIdx >= 0) {
        URL.revokeObjectURL(prev[existingIdx].localUrl)
        const next = [...prev]
        next[existingIdx] = staged
        return next
      }
      return [...prev, staged]
    })
  }

  // Remove a pending (not yet uploaded) file
  const handleRemovePending = (shift, index) => {
    if (shift === 'morning') {
      setPendingMorningFiles(prev => {
        URL.revokeObjectURL(prev[index].localUrl)
        return prev.filter((_, i) => i !== index)
      })
    } else {
      setPendingAfternoonFiles(prev => {
        URL.revokeObjectURL(prev[index].localUrl)
        return prev.filter((_, i) => i !== index)
      })
    }
  }

  const handleCancel = () => {
    pendingMorningFiles.forEach(p => URL.revokeObjectURL(p.localUrl))
    pendingAfternoonFiles.forEach(p => URL.revokeObjectURL(p.localUrl))
    setPendingMorningFiles([])
    setPendingAfternoonFiles([])
    setMorningPendingDeletes([])
    setAfternoonPendingDeletes([])
    setPreviewIndex(null)
    onCancel()
  }

  // Combined preview list across both shifts — enables arrow-key navigation from
  // Shift A images into Shift B images within the same day. Originals stay in
  // their slot tagged with pendingDelete/pendingReplace; pending replacements
  // appear right after the original they replace; pure additions go at the end.
  const buildShiftItems = (images, pendingFiles, pendingDeletes, shiftLabel) => {
    const replacementsByPath = new Map()
    const additions = []
    pendingFiles.forEach(pf => {
      if (pf.replacingPath) replacementsByPath.set(pf.replacingPath, pf)
      else additions.push(pf)
    })
    const items = []
    images.forEach(img => {
      const pendingDelete = pendingDeletes.includes(img.path)
      const r = replacementsByPath.get(img.path)
      items.push({
        url: img.url,
        name: img.name,
        isPending: false,
        pendingDelete,
        pendingReplace: !!r && !pendingDelete,
        shiftLabel
      })
      if (r && !pendingDelete) {
        items.push({ url: r.localUrl, name: r.name, isPending: true, isReplacement: true, shiftLabel })
      }
    })
    additions.forEach(pf => {
      items.push({ url: pf.localUrl, name: pf.name, isPending: true, shiftLabel })
    })
    return items
  }

  const morningItems = useMemo(
    () => buildShiftItems(morningProofImages, pendingMorningFiles, morningPendingDeletes, 'A'),
    [morningProofImages, pendingMorningFiles, morningPendingDeletes]
  )

  const afternoonItems = useMemo(
    () => buildShiftItems(afternoonProofImages, pendingAfternoonFiles, afternoonPendingDeletes, 'B'),
    [afternoonProofImages, pendingAfternoonFiles, afternoonPendingDeletes]
  )

  const combinedItems = useMemo(() => [...morningItems, ...afternoonItems], [morningItems, afternoonItems])
  const afternoonOffset = morningItems.length

  useEffect(() => {
    if (previewIndex !== null && previewIndex >= combinedItems.length) {
      setPreviewIndex(null)
    }
  }, [previewIndex, combinedItems.length])

  useEffect(() => {
    if (previewIndex === null || combinedItems.length <= 1) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        setPreviewIndex(prev => (prev > 0 ? prev - 1 : combinedItems.length - 1))
      } else if (e.key === 'ArrowRight') {
        setPreviewIndex(prev => (prev < combinedItems.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'Escape') {
        setPreviewIndex(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewIndex, combinedItems.length])

  const goPrev = (e) => { e.stopPropagation(); setPreviewIndex(prev => (prev > 0 ? prev - 1 : combinedItems.length - 1)) }
  const goNext = (e) => { e.stopPropagation(); setPreviewIndex(prev => (prev < combinedItems.length - 1 ? prev + 1 : 0)) }
  const previewItem = previewIndex !== null ? combinedItems[previewIndex] : null

  const evaluateFormula = (expr) => {
    if (!expr || String(expr).trim() === '') return null
    const str = String(expr).trim()
    // Only allow digits, decimal points, spaces, and basic operators
    if (!/^[\d\s+\-*/().]+$/.test(str)) return null
    // Must contain at least one digit
    if (!/\d/.test(str)) return null
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + str + ')')()
      if (typeof result !== 'number' || !isFinite(result)) return null
      return Math.round(result * 100) / 100
    } catch {
      return null
    }
  }

  const formulaPreview = (input) => {
    const str = String(input || '').trim()
    if (!/[+\-*/]/.test(str)) return null
    return evaluateFormula(str)
  }

  const handleActualBlur = (input, setActual) => {
    const str = String(input || '').trim()
    if (str === '') { setActual(''); return }
    const result = evaluateFormula(str)
    if (result !== null) setActual(String(result))
  }

  const autoResize = (el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  // Resolve pending changes for a shift on Save: delete from storage every
  // image marked for deletion + every replaced original, upload all pending
  // files (skipping replacements whose target was also marked for deletion),
  // then weave new uploads into original positions or append at end.
  const resolveShiftPending = async (shift, existingImages, pendingFiles, pendingDeletes) => {
    const deletePaths = new Set(pendingDeletes)
    const replacements = pendingFiles.filter(p => p.replacingPath)

    const toDeleteFromStorage = new Map()
    existingImages.forEach(img => {
      if (deletePaths.has(img.path)) toDeleteFromStorage.set(img.path, img)
    })
    replacements.forEach(r => {
      if (deletePaths.has(r.replacingPath)) return
      const old = existingImages.find(img => img.path === r.replacingPath)
      if (old) toDeleteFromStorage.set(old.path, old)
    })

    if (onDeleteFromStorage && toDeleteFromStorage.size > 0) {
      // Failed deletes leave an orphaned file in storage but should not block save.
      await Promise.all([...toDeleteFromStorage.values()].map(img =>
        Promise.resolve(onDeleteFromStorage(img)).catch(() => {})
      ))
    }

    const filesToUpload = pendingFiles.filter(p => !(p.replacingPath && deletePaths.has(p.replacingPath)))
    const uploaded = (filesToUpload.length > 0 && onUploadFiles)
      ? await onUploadFiles(shift, filesToUpload.map(p => p.file))
      : []

    const uploadedByReplacingPath = new Map()
    const newAdditions = []
    filesToUpload.forEach((pf, idx) => {
      if (pf.replacingPath) uploadedByReplacingPath.set(pf.replacingPath, uploaded[idx])
      else newAdditions.push(uploaded[idx])
    })

    const finalImages = existingImages
      .filter(img => !deletePaths.has(img.path))
      .map(img => uploadedByReplacingPath.get(img.path) || img)

    return [...finalImages, ...newAdditions]
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const finalMorningImages = await resolveShiftPending('morning', morningProofImages, pendingMorningFiles, morningPendingDeletes)
      const finalAfternoonImages = await resolveShiftPending('afternoon', afternoonProofImages, pendingAfternoonFiles, afternoonPendingDeletes)

      pendingMorningFiles.forEach(p => URL.revokeObjectURL(p.localUrl))
      pendingAfternoonFiles.forEach(p => URL.revokeObjectURL(p.localUrl))
      setPendingMorningFiles([])
      setPendingAfternoonFiles([])
      setMorningPendingDeletes([])
      setAfternoonPendingDeletes([])

      onSave({
        morningAmount: morningGoal,
        afternoonAmount: afternoonGoal,
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
        morningProofImages: finalMorningImages,
        afternoonProofImages: finalAfternoonImages,
        morningAllowance,
        afternoonAllowance,
        morningCustomWage,
        afternoonCustomWage,
        morningIgFeaturedAmount: morningIgFeatured,
        morningIgOtherAmount: morningIgOther,
        afternoonIgFeaturedAmount: afternoonIgFeatured,
        afternoonIgOtherAmount: afternoonIgOther,
        morningLocation,
        afternoonLocation
      })
    } catch (err) {
      setSaveError(err.message || 'Failed to upload images')
      setSaving(false)
    }
  }

  // Detect whether any value has changed from initial state
  const norm = (v) => v == null ? '' : String(v)
  const hasChanges = (
    norm(morningGoal) !== norm(goal?.morningAmount) ||
    norm(afternoonGoal) !== norm(goal?.afternoonAmount) ||
    norm(morningActual) !== norm(goal?.morningActual) ||
    norm(afternoonActual) !== norm(goal?.afternoonActual) ||
    norm(morningCustomRate) !== norm(goal?.morningCustomRate) ||
    norm(afternoonCustomRate) !== norm(goal?.afternoonCustomRate) ||
    norm(morningCustomAmount) !== norm(goal?.morningCustomAmount) ||
    norm(afternoonCustomAmount) !== norm(goal?.afternoonCustomAmount) ||
    morningStartTime !== (goal?.morningStartTime || DEFAULT_MORNING_START) ||
    morningEndTime !== (goal?.morningEndTime || DEFAULT_MORNING_END) ||
    afternoonStartTime !== (goal?.afternoonStartTime || DEFAULT_AFTERNOON_START) ||
    afternoonEndTime !== (goal?.afternoonEndTime || DEFAULT_AFTERNOON_END) ||
    morningConfirmed !== !!goal?.morningConfirmed ||
    afternoonConfirmed !== !!goal?.afternoonConfirmed ||
    pendingMorningFiles.length > 0 ||
    pendingAfternoonFiles.length > 0 ||
    morningPendingDeletes.length > 0 ||
    afternoonPendingDeletes.length > 0 ||
    morningProofImages.length !== (goal?.morningProofImages?.length || 0) ||
    afternoonProofImages.length !== (goal?.afternoonProofImages?.length || 0) ||
    norm(morningAllowance) !== norm(goal?.morningAllowance) ||
    norm(afternoonAllowance) !== norm(goal?.afternoonAllowance) ||
    norm(morningCustomWage) !== norm(goal?.morningCustomWage) ||
    norm(afternoonCustomWage) !== norm(goal?.afternoonCustomWage) ||
    norm(morningIgFeatured) !== norm(goal?.morningIgFeaturedAmount) ||
    norm(morningIgOther) !== norm(goal?.morningIgOtherAmount) ||
    norm(afternoonIgFeatured) !== norm(goal?.afternoonIgFeaturedAmount) ||
    norm(afternoonIgOther) !== norm(goal?.afternoonIgOtherAmount) ||
    norm(morningLocation) !== norm(goal?.morningLocation || autoLocation) ||
    norm(afternoonLocation) !== norm(goal?.afternoonLocation || autoLocation)
  )

  const getWage = (target, actual, customWage, igFeatured, igOther) => {
    const cw = customWage === '' ? null : Number(customWage)
    if (cw !== null && !isNaN(cw) && cw >= 0) return cw
    const t = target === '' ? null : Number(target)
    const a = actual === '' ? 0 : (Number(actual) || 0)
    const igF = igFeatured === '' ? 0 : (Number(igFeatured) || 0)
    const igO = igOther === '' ? 0 : (Number(igOther) || 0)
    const effectiveActual = a + igF + igO
    return Goal.calculateWage(t, effectiveActual > 0 ? effectiveActual : null)
  }

  const morningWage = getWage(morningGoal, morningActual, morningCustomWage, morningIgFeatured, morningIgOther)
  const afternoonWage = getWage(afternoonGoal, afternoonActual, afternoonCustomWage, afternoonIgFeatured, afternoonIgOther)

  const morningHours = Goal.calculateHoursFromTimes(morningStartTime, morningEndTime)
  const afternoonHours = Goal.calculateHoursFromTimes(afternoonStartTime, afternoonEndTime)

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  // Lock shifts that have been admin-verified (for everyone, including admins)
  const morningLocked = !!goal?.morningAdminConfirmed
  const afternoonLocked = !!goal?.afternoonAdminConfirmed

  const wageClass = (wage, customWage) => {
    const cw = customWage === '' ? null : Number(customWage)
    if (cw !== null && !isNaN(cw) && cw >= 0) return 'wage-custom'
    if (wage === 80) return 'wage-hit'
    if (wage === 75) return 'wage-partial'
    return 'wage-none'
  }

  // ── Detect whether modal content overflows (needs top Save btn) ──
  const [contentOverflows, setContentOverflows] = useState(false)
  const overflowLocked = useRef(false)

  // ── Swipe-down-to-dismiss ──
  const modalRef = useRef(null)
  const dragStartY = useRef(null)
  const dragOffset = useRef(0)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600

  const handleTouchStartRef = useRef()
  const handleTouchMoveRef = useRef()
  const handleTouchEndRef = useRef()

  handleTouchStartRef.current = (e) => {
    if (modalRef.current && modalRef.current.scrollTop > 0) return
    dragStartY.current = e.touches[0].clientY
    dragOffset.current = 0
    if (modalRef.current) modalRef.current.style.transition = 'none'
  }

  handleTouchMoveRef.current = (e) => {
    if (dragStartY.current === null) return
    const dy = e.touches[0].clientY - dragStartY.current
    if (dy < 0) { dragOffset.current = 0; return }
    dragOffset.current = dy
    if (modalRef.current) {
      modalRef.current.style.transform = `translateY(${dy}px)`
    }
    if (dy > 10) e.preventDefault()
  }

  handleTouchEndRef.current = () => {
    if (dragStartY.current === null) return
    const dy = dragOffset.current
    dragStartY.current = null
    if (modalRef.current) {
      modalRef.current.style.transition = 'transform 0.25s ease'
      if (dy > 120) {
        modalRef.current.style.transform = 'translateY(100%)'
        setTimeout(handleCancel, 200)
      } else {
        modalRef.current.style.transform = 'translateY(0)'
      }
    }
  }

  useEffect(() => {
    if (!isMobile) return
    const el = modalRef.current
    if (!el) return
    const onStart = (e) => handleTouchStartRef.current(e)
    const onMove = (e) => handleTouchMoveRef.current(e)
    const onEnd = () => handleTouchEndRef.current()
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [isMobile])

  // ── Show top Save only when modal content overflows its visible area ──
  // Once locked to overflowing, stay locked to avoid layout oscillation.
  // Only unlock when the modal is clearly non-overflowing (e.g. content shrinks a lot).
  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    let raf = 0
    const check = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const overflows = el.scrollHeight > el.clientHeight + 20
        if (overflows) {
          overflowLocked.current = true
          setContentOverflows(true)
        } else if (overflowLocked.current) {
          // Only unlock if clearly not overflowing (with generous margin)
          if (el.scrollHeight + 60 < el.clientHeight) {
            overflowLocked.current = false
            setContentOverflows(false)
          }
        } else {
          setContentOverflows(false)
        }
      })
    }
    // Delay initial check to let the first paint settle
    setTimeout(check, 50)
    const ro = new ResizeObserver(check)
    ro.observe(el)
    // Also watch child size changes (e.g. sections expanding/collapsing)
    for (const child of el.children) ro.observe(child)
    return () => { ro.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  const morningShift = {
    key: 'morning',
    label: 'Shift A (Morning)',
    stickyClass: 'shift-confirm-sticky-a',
    confirmed: morningConfirmed, setConfirmed: setMorningConfirmed,
    locked: morningLocked,
    adminConfirmed: !!goal?.morningAdminConfirmed,
    goalValue: morningGoal, setGoalValue: setMorningGoal,
    setActual: setMorningActual,
    actualInput: morningActualInput, setActualInput: setMorningActualInput,
    startTime: morningStartTime, setStartTime: setMorningStartTime,
    endTime: morningEndTime, setEndTime: setMorningEndTime,
    location: morningLocation, setLocation: setMorningLocation,
    fallbackLocation: afternoonLocation,
    showIg: showMorningIg, setShowIg: setShowMorningIg,
    igFeatured: morningIgFeatured, setIgFeatured: setMorningIgFeatured,
    igOther: morningIgOther, setIgOther: setMorningIgOther,
    showCustom: showMorningCustom, setShowCustom: setShowMorningCustom,
    customRate: morningCustomRate, setCustomRate: setMorningCustomRate,
    customAmount: morningCustomAmount, setCustomAmount: setMorningCustomAmount,
    allowance: morningAllowance, setAllowance: setMorningAllowance,
    customWage: morningCustomWage, setCustomWage: setMorningCustomWage,
    wage: morningWage,
    hours: morningHours,
    proofImages: morningProofImages,
    pendingFiles: pendingMorningFiles,
    pendingDeletes: morningPendingDeletes,
    previewOffset: 0,
    extrasExpanded: extrasExpanded.morning,
    onToggleExtras: () => setExtrasExpanded(prev => ({ ...prev, morning: !prev.morning })),
    extrasChips: buildExtrasChips({
      igFeatured: morningIgFeatured, igOther: morningIgOther,
      customRate: morningCustomRate, customAmount: morningCustomAmount,
      allowance: morningAllowance, customWage: morningCustomWage,
      isAdminViewing: isAdminViewing && morningConfirmed
    })
  }

  const afternoonShift = {
    key: 'afternoon',
    label: 'Shift B (Afternoon)',
    stickyClass: 'shift-confirm-sticky-b',
    confirmed: afternoonConfirmed, setConfirmed: setAfternoonConfirmed,
    locked: afternoonLocked,
    adminConfirmed: !!goal?.afternoonAdminConfirmed,
    goalValue: afternoonGoal, setGoalValue: setAfternoonGoal,
    setActual: setAfternoonActual,
    actualInput: afternoonActualInput, setActualInput: setAfternoonActualInput,
    startTime: afternoonStartTime, setStartTime: setAfternoonStartTime,
    endTime: afternoonEndTime, setEndTime: setAfternoonEndTime,
    location: afternoonLocation, setLocation: setAfternoonLocation,
    fallbackLocation: morningLocation,
    showIg: showAfternoonIg, setShowIg: setShowAfternoonIg,
    igFeatured: afternoonIgFeatured, setIgFeatured: setAfternoonIgFeatured,
    igOther: afternoonIgOther, setIgOther: setAfternoonIgOther,
    showCustom: showAfternoonCustom, setShowCustom: setShowAfternoonCustom,
    customRate: afternoonCustomRate, setCustomRate: setAfternoonCustomRate,
    customAmount: afternoonCustomAmount, setCustomAmount: setAfternoonCustomAmount,
    allowance: afternoonAllowance, setAllowance: setAfternoonAllowance,
    customWage: afternoonCustomWage, setCustomWage: setAfternoonCustomWage,
    wage: afternoonWage,
    hours: afternoonHours,
    proofImages: afternoonProofImages,
    pendingFiles: pendingAfternoonFiles,
    pendingDeletes: afternoonPendingDeletes,
    previewOffset: afternoonOffset,
    extrasExpanded: extrasExpanded.afternoon,
    onToggleExtras: () => setExtrasExpanded(prev => ({ ...prev, afternoon: !prev.afternoon })),
    extrasChips: buildExtrasChips({
      igFeatured: afternoonIgFeatured, igOther: afternoonIgOther,
      customRate: afternoonCustomRate, customAmount: afternoonCustomAmount,
      allowance: afternoonAllowance, customWage: afternoonCustomWage,
      isAdminViewing: isAdminViewing && afternoonConfirmed
    })
  }

  const shiftCtx = {
    readOnly, isAdminViewing, locations, autoLocation,
    hasChanges, contentOverflows, modalRef,
    onSave: handleSave,
    onConfirmShift, onUnconfirmShift,
    evaluateFormula, formulaPreview, handleActualBlur, autoResize, formatHours, wageClass,
    onStageFiles: handleStageFiles,
    onDeleteUploadedImage: handleDeleteUploadedImage,
    onReplaceImage: handleReplaceImage,
    onRemovePending: handleRemovePending,
    proofUploadingShift, setPreviewIndex
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className={`modal modal-compact${contentOverflows ? ' modal-scrollable' : ''}`}
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-sticky-header">
          {isMobile && <div className="modal-drag-handle" />}
          <div className="modal-header-row">
            <h2>{day}{readOnly && <span className="read-only-badge-inline">View Only</span>}</h2>
            {!readOnly && (hasChanges || saving) && contentOverflows ? (
              <button className="modal-save-btn-top" onClick={handleSave} disabled={saving}>
                {saving ? '...' : 'Save'}
              </button>
            ) : (
              <span className="modal-header-spacer" />
            )}
            <button className="modal-close-btn" onClick={handleCancel} disabled={saving} aria-label="Close">&#x2715;</button>
          </div>
        </div>

        <div className="shifts-compact">
          <ShiftSection shift={morningShift} ctx={shiftCtx} />
          <div className="shift-group-divider" />
          <ShiftSection shift={afternoonShift} ctx={shiftCtx} />
        </div>

        {saveError && <div className="login-error" style={{ margin: '8px 0 0' }}>{saveError}</div>}

        {!contentOverflows && (
          <div className="button-group">
            {readOnly ? (
              <button className="cancel-btn" onClick={handleCancel}>Close</button>
            ) : (
              <>
                {(hasChanges || saving) && (
                  <>
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
                  </>
                )}
                {!hasChanges && !saving && (
                  <button className="cancel-btn" onClick={handleCancel}>Close</button>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {previewItem && createPortal(
        <div className="proof-preview-overlay" onClick={() => setPreviewIndex(null)}>
          <div className="proof-preview-content" onClick={e => e.stopPropagation()}>
            <button className="proof-preview-close" onClick={() => setPreviewIndex(null)}>&times;</button>
            {combinedItems.length > 1 && (
              <>
                <button className="proof-preview-nav proof-preview-prev" onClick={goPrev}>&#8249;</button>
                <button className="proof-preview-nav proof-preview-next" onClick={goNext}>&#8250;</button>
              </>
            )}
            <img src={previewItem.url} alt={previewItem.name} />
            <div className="proof-preview-info">
              <div className="proof-preview-info-row">
                <span className={`proof-preview-shift-label shift-${previewItem.shiftLabel === 'A' ? 'a' : 'b'}`}>Shift {previewItem.shiftLabel}</span>
                {combinedItems.length > 1 && (
                  <span className="proof-preview-counter">{previewIndex + 1} / {combinedItems.length}</span>
                )}
              </div>
              <span>{previewItem.name}</span>
              {previewItem.pendingDelete && <span className="proof-preview-pending-note">Will be deleted on save</span>}
              {previewItem.pendingReplace && <span className="proof-preview-pending-note">Will be replaced on save</span>}
              {previewItem.isReplacement && <span className="proof-preview-pending-note">New replacement — not saved yet</span>}
              {previewItem.isPending && !previewItem.isReplacement && <span className="proof-preview-pending-note">Not saved yet</span>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
