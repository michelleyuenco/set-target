import { useState, useEffect } from 'react'
import { Goal, DEFAULT_MORNING_START, DEFAULT_MORNING_END, DEFAULT_AFTERNOON_START, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'
import { ProofImages } from './ProofImages'

export function GoalModal({
  day,
  goal,
  isAdminViewing,
  locations,
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
  const [pendingMorningFiles, setPendingMorningFiles] = useState([])
  const [pendingAfternoonFiles, setPendingAfternoonFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    // Revoke any pending object URLs from the previous open
    setPendingMorningFiles(prev => { prev.forEach(p => URL.revokeObjectURL(p.localUrl)); return [] })
    setPendingAfternoonFiles(prev => { prev.forEach(p => URL.revokeObjectURL(p.localUrl)); return [] })
    setSaveError(null)

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
  }, [goal])

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

  // Delete an already-uploaded image from Firebase Storage immediately
  const handleDeleteUploadedImage = async (shift, image) => {
    if (onDeleteFromStorage) {
      await onDeleteFromStorage(image)
    }
    if (shift === 'morning') {
      setMorningProofImages(prev => prev.filter(img => img.path !== image.path))
    } else {
      setAfternoonProofImages(prev => prev.filter(img => img.path !== image.path))
    }
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
    onCancel()
  }

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

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      let finalMorningImages = morningProofImages
      let finalAfternoonImages = afternoonProofImages

      if (pendingMorningFiles.length > 0 && onUploadFiles) {
        const files = pendingMorningFiles.map(p => p.file)
        finalMorningImages = await onUploadFiles('morning', files, morningProofImages)
        pendingMorningFiles.forEach(p => URL.revokeObjectURL(p.localUrl))
        setPendingMorningFiles([])
      }

      if (pendingAfternoonFiles.length > 0 && onUploadFiles) {
        const files = pendingAfternoonFiles.map(p => p.file)
        finalAfternoonImages = await onUploadFiles('afternoon', files, afternoonProofImages)
        pendingAfternoonFiles.forEach(p => URL.revokeObjectURL(p.localUrl))
        setPendingAfternoonFiles([])
      }

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
        afternoonIgOtherAmount: afternoonIgOther
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
    morningProofImages.length !== (goal?.morningProofImages?.length || 0) ||
    afternoonProofImages.length !== (goal?.afternoonProofImages?.length || 0) ||
    norm(morningAllowance) !== norm(goal?.morningAllowance) ||
    norm(afternoonAllowance) !== norm(goal?.afternoonAllowance) ||
    norm(morningCustomWage) !== norm(goal?.morningCustomWage) ||
    norm(afternoonCustomWage) !== norm(goal?.afternoonCustomWage) ||
    norm(morningIgFeatured) !== norm(goal?.morningIgFeaturedAmount) ||
    norm(morningIgOther) !== norm(goal?.morningIgOtherAmount) ||
    norm(afternoonIgFeatured) !== norm(goal?.afternoonIgFeaturedAmount) ||
    norm(afternoonIgOther) !== norm(goal?.afternoonIgOtherAmount)
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

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal modal-compact" onClick={e => e.stopPropagation()}>
        <h2>{day}</h2>

        {readOnly && (
          <div className="read-only-badge">View Only</div>
        )}

        <div className="shifts-compact">
          <div className={`shift-section-wrapper ${!morningConfirmed ? 'shift-unconfirmed' : ''}`}>
            <div className="shift-confirm-toggle">
              <label className="shift-confirm">
                <input
                  type="checkbox"
                  checked={morningConfirmed}
                  onChange={(e) => setMorningConfirmed(e.target.checked)}
                  disabled={readOnly || morningLocked}
                />
                <span>Shift A (Morning)</span>
              </label>
              {morningConfirmed && goal?.morningAdminConfirmed && (
                <span className="shift-verified-tag">&#10003; Verified</span>
              )}
              {isAdminViewing && morningConfirmed && (
                goal?.morningAdminConfirmed ? (
                  <button className="admin-unconfirm-btn" onClick={() => onUnconfirmShift('morning')}>Undo</button>
                ) : (
                  <button className="admin-confirm-btn shift-verify-btn" onClick={() => onConfirmShift('morning')}>&#10003; Verify</button>
                )
              )}
            </div>
            <div className="shift-row">
              <div className="shift-inputs">
                <div className="input-compact">
                  <label>Target</label>
                  <input
                    type="number"
                    value={morningGoal}
                    onChange={(e) => setMorningGoal(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !morningConfirmed || morningLocked}
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={morningActualInput}
                    onChange={(e) => {
                      setMorningActualInput(e.target.value)
                      const result = evaluateFormula(e.target.value)
                      if (result !== null) setMorningActual(String(result))
                    }}
                    onBlur={() => handleActualBlur(morningActualInput, setMorningActual)}
                    placeholder="0"
                    disabled={readOnly || !morningConfirmed || morningLocked}
                  />
                  {formulaPreview(morningActualInput) !== null && (
                    <div className="formula-preview">= {formulaPreview(morningActualInput)}</div>
                  )}
                </div>
                <div className={`wage-compact ${wageClass(morningWage, morningCustomWage)}`}>
                  ${morningWage}/hr
                </div>
              </div>
            </div>
            <div className="shift-time-row">
              <div className="time-input-group">
                <label>Start</label>
                <input
                  type="time"
                  value={morningStartTime}
                  onChange={(e) => setMorningStartTime(e.target.value)}
                  disabled={readOnly || !morningConfirmed || morningLocked}
                />
              </div>
              <div className="time-input-group">
                <label>End</label>
                <input
                  type="time"
                  value={morningEndTime}
                  onChange={(e) => setMorningEndTime(e.target.value)}
                  disabled={readOnly || !morningConfirmed || morningLocked}
                />
              </div>
              <div className="shift-duration">
                {formatHours(morningHours)}
              </div>
            </div>
            <div className="custom-commission-toggle ig-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showMorningIg}
                  disabled={readOnly || !morningConfirmed || morningLocked}
                  onChange={(e) => {
                    setShowMorningIg(e.target.checked)
                    if (!e.target.checked) {
                      setMorningIgFeatured('')
                      setMorningIgOther('')
                    }
                  }}
                />
                <span>IG Story Sales</span>
              </label>
            </div>
            {showMorningIg && (
              <div className="custom-commission-inputs ig-commission-inputs">
                <div className="input-compact">
                  <label>Featured ($)</label>
                  <input
                    type="number"
                    value={morningIgFeatured}
                    onChange={(e) => setMorningIgFeatured(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !morningConfirmed || morningLocked}
                  />
                </div>
                <div className="input-compact">
                  <label>Other ($)</label>
                  <input
                    type="number"
                    value={morningIgOther}
                    onChange={(e) => setMorningIgOther(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !morningConfirmed || morningLocked}
                  />
                </div>
              </div>
            )}
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showMorningCustom}
                  disabled={readOnly || !morningConfirmed || morningLocked}
                  onChange={(e) => {
                    setShowMorningCustom(e.target.checked)
                    if (!e.target.checked) {
                      setMorningCustomRate('')
                      setMorningCustomAmount('')
                    }
                  }}
                />
                <span>Custom Commission</span>
              </label>
            </div>
            {showMorningCustom && (
              <div className="custom-commission-inputs">
                <div className="input-compact">
                  <label>Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={morningCustomRate}
                    onChange={(e) => setMorningCustomRate(e.target.value)}
                    placeholder="5"
                    disabled={readOnly || !morningConfirmed || morningLocked}
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={morningCustomAmount}
                    onChange={(e) => setMorningCustomAmount(e.target.value)}
                    placeholder="1000"
                    disabled={readOnly || !morningConfirmed || morningLocked}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={`shift-section-wrapper ${!afternoonConfirmed ? 'shift-unconfirmed' : ''}`}>
            <div className="shift-confirm-toggle">
              <label className="shift-confirm">
                <input
                  type="checkbox"
                  checked={afternoonConfirmed}
                  onChange={(e) => setAfternoonConfirmed(e.target.checked)}
                  disabled={readOnly || afternoonLocked}
                />
                <span>Shift B (Afternoon)</span>
              </label>
              {afternoonConfirmed && goal?.afternoonAdminConfirmed && (
                <span className="shift-verified-tag">&#10003; Verified</span>
              )}
              {isAdminViewing && afternoonConfirmed && (
                goal?.afternoonAdminConfirmed ? (
                  <button className="admin-unconfirm-btn" onClick={() => onUnconfirmShift('afternoon')}>Undo</button>
                ) : (
                  <button className="admin-confirm-btn shift-verify-btn" onClick={() => onConfirmShift('afternoon')}>&#10003; Verify</button>
                )
              )}
            </div>
            <div className="shift-row">
              <div className="shift-inputs">
                <div className="input-compact">
                  <label>Target</label>
                  <input
                    type="number"
                    value={afternoonGoal}
                    onChange={(e) => setAfternoonGoal(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={afternoonActualInput}
                    onChange={(e) => {
                      setAfternoonActualInput(e.target.value)
                      const result = evaluateFormula(e.target.value)
                      if (result !== null) setAfternoonActual(String(result))
                    }}
                    onBlur={() => handleActualBlur(afternoonActualInput, setAfternoonActual)}
                    placeholder="0"
                    disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  />
                  {formulaPreview(afternoonActualInput) !== null && (
                    <div className="formula-preview">= {formulaPreview(afternoonActualInput)}</div>
                  )}
                </div>
                <div className={`wage-compact ${wageClass(afternoonWage, afternoonCustomWage)}`}>
                  ${afternoonWage}/hr
                </div>
              </div>
            </div>
            <div className="shift-time-row">
              <div className="time-input-group">
                <label>Start</label>
                <input
                  type="time"
                  value={afternoonStartTime}
                  onChange={(e) => setAfternoonStartTime(e.target.value)}
                  disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                />
              </div>
              <div className="time-input-group">
                <label>End</label>
                <input
                  type="time"
                  value={afternoonEndTime}
                  onChange={(e) => setAfternoonEndTime(e.target.value)}
                  disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                />
              </div>
              <div className="shift-duration">
                {formatHours(afternoonHours)}
              </div>
            </div>
            <div className="custom-commission-toggle ig-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showAfternoonIg}
                  disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  onChange={(e) => {
                    setShowAfternoonIg(e.target.checked)
                    if (!e.target.checked) {
                      setAfternoonIgFeatured('')
                      setAfternoonIgOther('')
                    }
                  }}
                />
                <span>IG Story Sales</span>
              </label>
            </div>
            {showAfternoonIg && (
              <div className="custom-commission-inputs ig-commission-inputs">
                <div className="input-compact">
                  <label>Featured ($)</label>
                  <input
                    type="number"
                    value={afternoonIgFeatured}
                    onChange={(e) => setAfternoonIgFeatured(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  />
                </div>
                <div className="input-compact">
                  <label>Other ($)</label>
                  <input
                    type="number"
                    value={afternoonIgOther}
                    onChange={(e) => setAfternoonIgOther(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  />
                </div>
              </div>
            )}
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showAfternoonCustom}
                  disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  onChange={(e) => {
                    setShowAfternoonCustom(e.target.checked)
                    if (!e.target.checked) {
                      setAfternoonCustomRate('')
                      setAfternoonCustomAmount('')
                    }
                  }}
                />
                <span>Custom Commission</span>
              </label>
            </div>
            {showAfternoonCustom && (
              <div className="custom-commission-inputs">
                <div className="input-compact">
                  <label>Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={afternoonCustomRate}
                    onChange={(e) => setAfternoonCustomRate(e.target.value)}
                    placeholder="5"
                    disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={afternoonCustomAmount}
                    onChange={(e) => setAfternoonCustomAmount(e.target.value)}
                    placeholder="1000"
                    disabled={readOnly || !afternoonConfirmed || afternoonLocked}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shifts-proof-row">
          <div className={`shift-proof-col${!morningConfirmed ? ' shift-unconfirmed' : ''}`}>
            <ProofImages
              images={morningProofImages}
              pendingFiles={pendingMorningFiles}
              onUpload={(files) => handleStageFiles('morning', files)}
              onDelete={(image) => handleDeleteUploadedImage('morning', image)}
              onRemovePending={(index) => handleRemovePending('morning', index)}
              uploading={proofUploadingShift === 'morning'}
              disabled={!morningConfirmed || morningLocked}
              readOnly={readOnly}
            />
          </div>
          <div className={`shift-proof-col${!afternoonConfirmed ? ' shift-unconfirmed' : ''}`}>
            <ProofImages
              images={afternoonProofImages}
              pendingFiles={pendingAfternoonFiles}
              onUpload={(files) => handleStageFiles('afternoon', files)}
              onDelete={(image) => handleDeleteUploadedImage('afternoon', image)}
              onRemovePending={(index) => handleRemovePending('afternoon', index)}
              uploading={proofUploadingShift === 'afternoon'}
              disabled={!afternoonConfirmed || afternoonLocked}
              readOnly={readOnly}
            />
          </div>
        </div>

        {isAdminViewing && (morningConfirmed || afternoonConfirmed) && (
          <div className="admin-allowance-row">
            <div className="admin-allowance-row-inner">
              {morningConfirmed ? (
                <div className="admin-allowance-field">
                  <label>A Allowance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={morningAllowance}
                    onChange={(e) => setMorningAllowance(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || morningLocked}
                  />
                </div>
              ) : <div className="admin-allowance-field" />}
              {afternoonConfirmed ? (
                <div className="admin-allowance-field">
                  <label>B Allowance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={afternoonAllowance}
                    onChange={(e) => setAfternoonAllowance(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || afternoonLocked}
                  />
                </div>
              ) : <div className="admin-allowance-field" />}
            </div>
            <div className="admin-allowance-row-inner">
              {morningConfirmed ? (
                <div className="admin-allowance-field">
                  <label>A Custom Wage ($/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={morningCustomWage}
                    onChange={(e) => setMorningCustomWage(e.target.value)}
                    placeholder="Auto"
                    disabled={readOnly || morningLocked}
                  />
                </div>
              ) : <div className="admin-allowance-field" />}
              {afternoonConfirmed ? (
                <div className="admin-allowance-field">
                  <label>B Custom Wage ($/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={afternoonCustomWage}
                    onChange={(e) => setAfternoonCustomWage(e.target.value)}
                    placeholder="Auto"
                    disabled={readOnly || afternoonLocked}
                  />
                </div>
              ) : <div className="admin-allowance-field" />}
            </div>
          </div>
        )}

        {saveError && <div className="login-error" style={{ margin: '8px 0 0' }}>{saveError}</div>}

        <div className="button-group">
          {readOnly ? (
            <button className="cancel-btn" onClick={handleCancel}>Close</button>
          ) : (
            <>
              {(hasChanges || saving) && (
                <>
                  <button className="cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
                  <button className="save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
              {!hasChanges && !saving && (
                <button className="cancel-btn" onClick={handleCancel}>Close</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
