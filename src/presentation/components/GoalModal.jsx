import { useState, useEffect } from 'react'
import { Goal, DEFAULT_MORNING_START, DEFAULT_MORNING_END, DEFAULT_AFTERNOON_START, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'
import { ProofImages } from './ProofImages'

export function GoalModal({
  day,
  initialMorning,
  initialAfternoon,
  initialMorningActual,
  initialAfternoonActual,
  initialMorningCustomRate,
  initialAfternoonCustomRate,
  initialMorningCustomAmount,
  initialAfternoonCustomAmount,
  initialMorningStartTime,
  initialMorningEndTime,
  initialAfternoonStartTime,
  initialAfternoonEndTime,
  initialMorningConfirmed,
  initialAfternoonConfirmed,
  initialMorningAdminConfirmed,
  initialAfternoonAdminConfirmed,
  initialMorningLocation,
  initialAfternoonLocation,
  initialMorningProofImages,
  initialAfternoonProofImages,
  initialMorningAllowance,
  initialAfternoonAllowance,
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
  const [morningCustomRate, setMorningCustomRate] = useState('')
  const [afternoonCustomRate, setAfternoonCustomRate] = useState('')
  const [morningCustomAmount, setMorningCustomAmount] = useState('')
  const [afternoonCustomAmount, setAfternoonCustomAmount] = useState('')
  const [showMorningCustom, setShowMorningCustom] = useState(false)
  const [showAfternoonCustom, setShowAfternoonCustom] = useState(false)
  const [morningStartTime, setMorningStartTime] = useState(DEFAULT_MORNING_START)
  const [morningEndTime, setMorningEndTime] = useState(DEFAULT_MORNING_END)
  const [afternoonStartTime, setAfternoonStartTime] = useState(DEFAULT_AFTERNOON_START)
  const [afternoonEndTime, setAfternoonEndTime] = useState(DEFAULT_AFTERNOON_END)
  const [morningConfirmed, setMorningConfirmed] = useState(false)
  const [afternoonConfirmed, setAfternoonConfirmed] = useState(false)
  const [morningLocationId, setMorningLocationId] = useState('')
  const [afternoonLocationId, setAfternoonLocationId] = useState('')
  const [morningProofImages, setMorningProofImages] = useState([])
  const [afternoonProofImages, setAfternoonProofImages] = useState([])
  const [morningAllowance, setMorningAllowance] = useState('')
  const [afternoonAllowance, setAfternoonAllowance] = useState('')
  const [pendingMorningFiles, setPendingMorningFiles] = useState([])
  const [pendingAfternoonFiles, setPendingAfternoonFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    // Revoke any pending object URLs from the previous open
    setPendingMorningFiles(prev => { prev.forEach(p => URL.revokeObjectURL(p.localUrl)); return [] })
    setPendingAfternoonFiles(prev => { prev.forEach(p => URL.revokeObjectURL(p.localUrl)); return [] })
    setSaveError(null)

    setMorningGoal(initialMorning || '')
    setAfternoonGoal(initialAfternoon || '')
    setMorningActual(initialMorningActual || '')
    setAfternoonActual(initialAfternoonActual || '')
    setMorningCustomRate(initialMorningCustomRate || '')
    setAfternoonCustomRate(initialAfternoonCustomRate || '')
    setMorningCustomAmount(initialMorningCustomAmount || '')
    setAfternoonCustomAmount(initialAfternoonCustomAmount || '')
    setShowMorningCustom(!!(initialMorningCustomRate || initialMorningCustomAmount))
    setShowAfternoonCustom(!!(initialAfternoonCustomRate || initialAfternoonCustomAmount))
    setMorningStartTime(initialMorningStartTime || DEFAULT_MORNING_START)
    setMorningEndTime(initialMorningEndTime || DEFAULT_MORNING_END)
    setAfternoonStartTime(initialAfternoonStartTime || DEFAULT_AFTERNOON_START)
    setAfternoonEndTime(initialAfternoonEndTime || DEFAULT_AFTERNOON_END)
    setMorningConfirmed(!!initialMorningConfirmed)
    setAfternoonConfirmed(!!initialAfternoonConfirmed)
    setMorningLocationId('')
    setAfternoonLocationId('')
    setMorningProofImages(initialMorningProofImages || [])
    setAfternoonProofImages(initialAfternoonProofImages || [])
    setMorningAllowance(initialMorningAllowance ?? '')
    setAfternoonAllowance(initialAfternoonAllowance ?? '')
  }, [
    initialMorning, initialAfternoon,
    initialMorningActual, initialAfternoonActual,
    initialMorningCustomRate, initialAfternoonCustomRate,
    initialMorningCustomAmount, initialAfternoonCustomAmount,
    initialMorningStartTime, initialMorningEndTime,
    initialAfternoonStartTime, initialAfternoonEndTime,
    initialMorningConfirmed, initialAfternoonConfirmed,
    initialMorningProofImages, initialAfternoonProofImages,
    initialMorningAllowance, initialAfternoonAllowance
  ])

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

      onSave(
        morningGoal, afternoonGoal,
        morningActual, afternoonActual,
        morningCustomRate, afternoonCustomRate,
        morningCustomAmount, afternoonCustomAmount,
        morningStartTime, morningEndTime,
        afternoonStartTime, afternoonEndTime,
        morningConfirmed, afternoonConfirmed,
        finalMorningImages, finalAfternoonImages,
        morningAllowance, afternoonAllowance
      )
    } catch (err) {
      setSaveError(err.message || 'Failed to upload images')
      setSaving(false)
    }
  }

  // Detect whether any value has changed from initial state
  const norm = (v) => v == null ? '' : String(v)
  const hasChanges = (
    norm(morningGoal) !== norm(initialMorning) ||
    norm(afternoonGoal) !== norm(initialAfternoon) ||
    norm(morningActual) !== norm(initialMorningActual) ||
    norm(afternoonActual) !== norm(initialAfternoonActual) ||
    norm(morningCustomRate) !== norm(initialMorningCustomRate) ||
    norm(afternoonCustomRate) !== norm(initialAfternoonCustomRate) ||
    norm(morningCustomAmount) !== norm(initialMorningCustomAmount) ||
    norm(afternoonCustomAmount) !== norm(initialAfternoonCustomAmount) ||
    morningStartTime !== (initialMorningStartTime || DEFAULT_MORNING_START) ||
    morningEndTime !== (initialMorningEndTime || DEFAULT_MORNING_END) ||
    afternoonStartTime !== (initialAfternoonStartTime || DEFAULT_AFTERNOON_START) ||
    afternoonEndTime !== (initialAfternoonEndTime || DEFAULT_AFTERNOON_END) ||
    morningConfirmed !== !!initialMorningConfirmed ||
    afternoonConfirmed !== !!initialAfternoonConfirmed ||
    pendingMorningFiles.length > 0 ||
    pendingAfternoonFiles.length > 0 ||
    morningProofImages.length !== (initialMorningProofImages?.length || 0) ||
    afternoonProofImages.length !== (initialAfternoonProofImages?.length || 0) ||
    norm(morningAllowance) !== norm(initialMorningAllowance) ||
    norm(afternoonAllowance) !== norm(initialAfternoonAllowance)
  )

  const getWage = (target, actual) => {
    const t = target === '' ? null : Number(target)
    const a = actual === '' ? null : Number(actual)
    return Goal.calculateWage(t, a)
  }

  const morningWage = getWage(morningGoal, morningActual)
  const afternoonWage = getWage(afternoonGoal, afternoonActual)

  const morningHours = Goal.calculateHoursFromTimes(morningStartTime, morningEndTime)
  const afternoonHours = Goal.calculateHoursFromTimes(afternoonStartTime, afternoonEndTime)

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const wageClass = (wage) => {
    if (wage === 80) return 'wage-hit'
    if (wage === 75) return 'wage-partial'
    return 'wage-none'
  }

  const renderShiftAdminSection = (shift) => {
    const isConfirmed = shift === 'morning' ? initialMorningAdminConfirmed : initialAfternoonAdminConfirmed
    const shiftUserConfirmed = shift === 'morning' ? morningConfirmed : afternoonConfirmed
    const locationName = shift === 'morning' ? initialMorningLocation : initialAfternoonLocation
    const selectedLocationId = shift === 'morning' ? morningLocationId : afternoonLocationId
    const setSelectedLocationId = shift === 'morning' ? setMorningLocationId : setAfternoonLocationId
    const allowanceVal = shift === 'morning' ? morningAllowance : afternoonAllowance
    const setAllowanceVal = shift === 'morning' ? setMorningAllowance : setAfternoonAllowance

    if (!shiftUserConfirmed) return null

    return (
      <div className="shift-admin-section">
        {isConfirmed ? (
          <div className="shift-admin-confirm confirmed">
            <span className="shift-admin-icon">&#10003;</span>
            <span className="shift-admin-location">{locationName || 'Verified'}</span>
            <button className="admin-unconfirm-btn" onClick={() => onUnconfirmShift(shift)}>Undo</button>
          </div>
        ) : (
          <div className="shift-admin-confirm pending">
            <button
              className="admin-confirm-btn shift-verify-btn"
              onClick={() => onConfirmShift(shift, selectedLocationId)}
            >
              ✓ Verify
            </button>
            <select
              className="location-select"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
            >
              <option value="">Location (optional)</option>
              {(locations || []).map((loc) => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="allowance-row">
          <label className="allowance-label">Allowance ($)</label>
          <input
            className="allowance-input"
            type="number"
            step="0.01"
            min="0"
            value={allowanceVal}
            onChange={(e) => setAllowanceVal(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal modal-compact" onClick={e => e.stopPropagation()}>
        <h2>{day}</h2>

        {readOnly && (
          <div className="read-only-badge">View Only</div>
        )}

        {!isAdminViewing && initialMorningAdminConfirmed && morningConfirmed && (
          <div className="admin-confirmed-badge">Shift A: Admin Verified{initialMorningLocation ? ` - ${initialMorningLocation}` : ''}</div>
        )}
        {!isAdminViewing && initialAfternoonAdminConfirmed && afternoonConfirmed && (
          <div className="admin-confirmed-badge">Shift B: Admin Verified{initialAfternoonLocation ? ` - ${initialAfternoonLocation}` : ''}</div>
        )}

        <div className="shifts-compact">
          <div className={`shift-section-wrapper ${!morningConfirmed ? 'shift-unconfirmed' : ''}`}>
            <div className="shift-confirm-toggle">
              <label className="shift-confirm">
                <input
                  type="checkbox"
                  checked={morningConfirmed}
                  onChange={(e) => setMorningConfirmed(e.target.checked)}
                  disabled={readOnly}
                />
                <span>Shift A (Morning)</span>
              </label>
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
                    disabled={readOnly || !morningConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="number"
                    value={morningActual}
                    onChange={(e) => setMorningActual(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !morningConfirmed}
                  />
                </div>
                <div className={`wage-compact ${wageClass(morningWage)}`}>
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
                  disabled={readOnly || !morningConfirmed}
                />
              </div>
              <div className="time-input-group">
                <label>End</label>
                <input
                  type="time"
                  value={morningEndTime}
                  onChange={(e) => setMorningEndTime(e.target.value)}
                  disabled={readOnly || !morningConfirmed}
                />
              </div>
              <div className="shift-duration">
                {formatHours(morningHours)}
              </div>
            </div>
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showMorningCustom}
                  disabled={readOnly || !morningConfirmed}
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
                    disabled={readOnly || !morningConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={morningCustomAmount}
                    onChange={(e) => setMorningCustomAmount(e.target.value)}
                    placeholder="1000"
                    disabled={readOnly || !morningConfirmed}
                  />
                </div>
              </div>
            )}
            <ProofImages
              images={morningProofImages}
              pendingFiles={pendingMorningFiles}
              onUpload={(files) => handleStageFiles('morning', files)}
              onDelete={(image) => handleDeleteUploadedImage('morning', image)}
              onRemovePending={(index) => handleRemovePending('morning', index)}
              uploading={proofUploadingShift === 'morning'}
              disabled={!morningConfirmed}
              readOnly={readOnly}
            />
            {isAdminViewing && renderShiftAdminSection('morning')}
          </div>

          <div className={`shift-section-wrapper ${!afternoonConfirmed ? 'shift-unconfirmed' : ''}`}>
            <div className="shift-confirm-toggle">
              <label className="shift-confirm">
                <input
                  type="checkbox"
                  checked={afternoonConfirmed}
                  onChange={(e) => setAfternoonConfirmed(e.target.checked)}
                  disabled={readOnly}
                />
                <span>Shift B (Afternoon)</span>
              </label>
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
                    disabled={readOnly || !afternoonConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Actual</label>
                  <input
                    type="number"
                    value={afternoonActual}
                    onChange={(e) => setAfternoonActual(e.target.value)}
                    placeholder="0"
                    disabled={readOnly || !afternoonConfirmed}
                  />
                </div>
                <div className={`wage-compact ${wageClass(afternoonWage)}`}>
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
                  disabled={readOnly || !afternoonConfirmed}
                />
              </div>
              <div className="time-input-group">
                <label>End</label>
                <input
                  type="time"
                  value={afternoonEndTime}
                  onChange={(e) => setAfternoonEndTime(e.target.value)}
                  disabled={readOnly || !afternoonConfirmed}
                />
              </div>
              <div className="shift-duration">
                {formatHours(afternoonHours)}
              </div>
            </div>
            <div className="custom-commission-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showAfternoonCustom}
                  disabled={readOnly || !afternoonConfirmed}
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
                    disabled={readOnly || !afternoonConfirmed}
                  />
                </div>
                <div className="input-compact">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={afternoonCustomAmount}
                    onChange={(e) => setAfternoonCustomAmount(e.target.value)}
                    placeholder="1000"
                    disabled={readOnly || !afternoonConfirmed}
                  />
                </div>
              </div>
            )}
            <ProofImages
              images={afternoonProofImages}
              pendingFiles={pendingAfternoonFiles}
              onUpload={(files) => handleStageFiles('afternoon', files)}
              onDelete={(image) => handleDeleteUploadedImage('afternoon', image)}
              onRemovePending={(index) => handleRemovePending('afternoon', index)}
              uploading={proofUploadingShift === 'afternoon'}
              disabled={!afternoonConfirmed}
              readOnly={readOnly}
            />
            {isAdminViewing && renderShiftAdminSection('afternoon')}
          </div>
        </div>

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
