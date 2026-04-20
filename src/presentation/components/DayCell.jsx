import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DEFAULT_SHIFT_HOURS, DEFAULT_MORNING_END, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'

export function DayCell({ day, dateStr, goal, isSelected, isToday, availableExcess, excessAllocation, locations, onClick, onBuyback, onWageClick }) {
  const [proofPreview, setProofPreview] = useState(null) // { images, index }
  const [now, setNow] = useState(() => new Date())

  // Real-time clock for shift-end gating (re-render every minute)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getLocationAbbr = (locationName) => {
    if (!locationName || !locations) return null
    const loc = locations.find(l => l.name === locationName)
    return loc?.abbr || locationName
  }

  // Combined proof image list across both shifts — arrow keys navigate across shifts.
  const combinedProofImages = [
    ...(goal?.morningProofImages || []).map(img => ({ ...img, shiftLabel: 'A' })),
    ...(goal?.afternoonProofImages || []).map(img => ({ ...img, shiftLabel: 'B' }))
  ]
  const afternoonProofOffset = (goal?.morningProofImages || []).length

  const openProofPreview = (shift, index, e) => {
    e.stopPropagation()
    const offset = shift === 'morning' ? 0 : afternoonProofOffset
    setProofPreview({ index: offset + index })
  }

  const closeProofPreview = () => setProofPreview(null)

  const prevProof = (e) => {
    e.stopPropagation()
    setProofPreview(p => ({ ...p, index: p.index > 0 ? p.index - 1 : combinedProofImages.length - 1 }))
  }

  const nextProof = (e) => {
    e.stopPropagation()
    setProofPreview(p => ({ ...p, index: p.index < combinedProofImages.length - 1 ? p.index + 1 : 0 }))
  }
  useEffect(() => {
    if (!proofPreview || combinedProofImages.length <= 1) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setProofPreview(p => ({ ...p, index: p.index > 0 ? p.index - 1 : combinedProofImages.length - 1 }))
      } else if (e.key === 'ArrowRight') {
        setProofPreview(p => ({ ...p, index: p.index < combinedProofImages.length - 1 ? p.index + 1 : 0 }))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [proofPreview, combinedProofImages.length])

  const bothShiftsVerified = goal?.morningConfirmed && goal?.morningAdminConfirmed &&
    goal?.afternoonConfirmed && goal?.afternoonAdminConfirmed

  const hasActualRevenue = (goal?.morningActual > 0) || (goal?.afternoonActual > 0)

  const cellClass = [
    'day-cell',
    goal?.hasGoals ? 'has-goals' : '',
    hasActualRevenue ? 'has-actual' : (goal?.hasGoals ? 'no-actual' : ''),
    isSelected ? 'selected' : '',
    isToday ? 'today' : '',
    bothShiftsVerified ? 'day-verified' : ''
  ].filter(Boolean).join(' ')

  const wageClass = (wage, customWage) => {
    if (customWage !== null && customWage !== undefined) return 'wage-custom'
    if (wage === 80) return 'wage-hit'
    if (wage === 75) return 'wage-partial'
    return 'wage-none'
  }

  // Only check unmet for confirmed shifts (use calculated wage, ignoring custom overrides)
  const isMorningUnmet = goal?.morningConfirmed && goal?.morningAmount && goal?.morningCalculatedWage !== 80 && !goal?.morningBoughtBack
  const isAfternoonUnmet = goal?.afternoonConfirmed && goal?.afternoonAmount && goal?.afternoonCalculatedWage !== 80 && !goal?.afternoonBoughtBack

  // Only allow buyback after the shift has ended
  const isShiftEnded = (endTime) => {
    const [endH, endM] = endTime.split(':').map(Number)
    const [y, m, d] = dateStr.split('-').map(Number)
    const shiftEnd = new Date(y, m - 1, d, endH, endM, 0, 0)
    return now >= shiftEnd
  }
  const morningEnded = isShiftEnded(goal?.morningEndTime || DEFAULT_MORNING_END)
  const afternoonEnded = isShiftEnded(goal?.afternoonEndTime || DEFAULT_AFTERNOON_END)

  const canBuyMorning = isMorningUnmet && goal?.morningAmount <= availableExcess && morningEnded
  const canBuyAfternoon = isAfternoonUnmet && goal?.afternoonAmount <= availableExcess && afternoonEnded

  const handleBuyback = (shift, e) => {
    e.stopPropagation()
    onBuyback(shift)
  }

  const handleWageClick = (e) => {
    e.stopPropagation()
    if (onWageClick) {
      onWageClick()
    }
  }

  // Use actual shift hours from goal, falling back to default
  const morningShiftHours = goal?.morningShiftHours ?? DEFAULT_SHIFT_HOURS
  const afternoonShiftHours = goal?.afternoonShiftHours ?? DEFAULT_SHIFT_HOURS

  const calculateLaborCost = () => {
    if (!goal?.hasGoals) return 0
    let cost = 0
    if (goal.morningConfirmed) {
      cost += Math.round((goal.morningWage || 65) * morningShiftHours * 100) / 100
    }
    if (goal.afternoonConfirmed) {
      cost += Math.round((goal.afternoonWage || 65) * afternoonShiftHours * 100) / 100
    }
    return cost
  }

  // IG detection
  const morningHasIg = goal?.morningConfirmed && ((goal?.morningIgFeaturedAmount || 0) > 0 || (goal?.morningIgOtherAmount || 0) > 0)
  const afternoonHasIg = goal?.afternoonConfirmed && ((goal?.afternoonIgFeaturedAmount || 0) > 0 || (goal?.afternoonIgOtherAmount || 0) > 0)

  const getMorningIgCommission = () => {
    if (!morningHasIg) return 0
    return Math.round(((goal.morningIgFeaturedAmount || 0) * 0.07 + (goal.morningIgOtherAmount || 0) * 0.05) * 100) / 100
  }

  const getAfternoonIgCommission = () => {
    if (!afternoonHasIg) return 0
    return Math.round(((goal.afternoonIgFeaturedAmount || 0) * 0.07 + (goal.afternoonIgOtherAmount || 0) * 0.05) * 100) / 100
  }

  const getMorningCommission = () => {
    if (morningHasIg) return 0 // IG replaces standard commission
    if (goal?.morningConfirmed && goal?.morningCalculatedWage === 80 && goal?.morningActual > 0) {
      return Math.round(goal.morningAmount * 0.045 * 100) / 100
    }
    return 0
  }

  const getAfternoonCommission = () => {
    if (afternoonHasIg) return 0 // IG replaces standard commission
    if (goal?.afternoonConfirmed && goal?.afternoonCalculatedWage === 80 && goal?.afternoonActual > 0) {
      return Math.round(goal.afternoonAmount * 0.045 * 100) / 100
    }
    return 0
  }

  const getMorningBuyback = () => {
    if (goal?.morningConfirmed && goal?.morningBoughtBack && goal?.morningAmount) {
      return {
        amount: goal.morningAmount,
        commission: morningHasIg ? 0 : Math.round(goal.morningAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  const getAfternoonBuyback = () => {
    if (goal?.afternoonConfirmed && goal?.afternoonBoughtBack && goal?.afternoonAmount) {
      return {
        amount: goal.afternoonAmount,
        commission: afternoonHasIg ? 0 : Math.round(goal.afternoonAmount * 0.035 * 100) / 100
      }
    }
    return { amount: 0, commission: 0 }
  }

  const getMorningCustomCommission = () => {
    if (goal?.morningConfirmed && goal?.morningCustomRate && goal?.morningCustomAmount) {
      return Math.round(goal.morningCustomAmount * (goal.morningCustomRate / 100) * 100) / 100
    }
    return 0
  }

  const getAfternoonCustomCommission = () => {
    if (goal?.afternoonConfirmed && goal?.afternoonCustomRate && goal?.afternoonCustomAmount) {
      return Math.round(goal.afternoonCustomAmount * (goal.afternoonCustomRate / 100) * 100) / 100
    }
    return 0
  }

  const laborCost = calculateLaborCost()
  const morningCommission = getMorningCommission()
  const afternoonCommission = getAfternoonCommission()
  const morningIgCommission = getMorningIgCommission()
  const afternoonIgCommission = getAfternoonIgCommission()
  const morningBuyback = getMorningBuyback()
  const afternoonBuyback = getAfternoonBuyback()
  const morningCustomCommission = getMorningCustomCommission()
  const afternoonCustomCommission = getAfternoonCustomCommission()
  const totalBuybackCommission = morningBuyback.commission + afternoonBuyback.commission
  const totalCustomCommission = morningCustomCommission + afternoonCustomCommission
  const totalIgCommission = morningIgCommission + afternoonIgCommission
  const totalCommission = morningCommission + afternoonCommission + totalBuybackCommission + totalCustomCommission + totalIgCommission
  const morningAllowance = goal?.morningConfirmed && goal?.morningAllowance ? goal.morningAllowance : 0
  const afternoonAllowance = goal?.afternoonConfirmed && goal?.afternoonAllowance ? goal.afternoonAllowance : 0
  const totalAllowance = morningAllowance + afternoonAllowance
  const totalEarnings = Math.round((laborCost + totalCommission + totalAllowance) * 100) / 100

  // Shift state detection (use calculated wage, ignoring custom overrides)
  const isMorningMet = goal?.morningConfirmed && goal?.morningCalculatedWage === 80 && !goal?.morningBoughtBack
  const isAfternoonMet = goal?.afternoonConfirmed && goal?.afternoonCalculatedWage === 80 && !goal?.afternoonBoughtBack
  const isMorningBoughtBack = goal?.morningConfirmed && goal?.morningBoughtBack
  const isAfternoonBoughtBack = goal?.afternoonConfirmed && goal?.afternoonBoughtBack

  // Per-shift excess from allocation map (FIFO)
  const morningAlloc = excessAllocation?.[`${dateStr}:morning`]
  const afternoonAlloc = excessAllocation?.[`${dateStr}:afternoon`]
  const morningExcess = morningAlloc?.excess || 0
  const afternoonExcess = afternoonAlloc?.excess || 0
  const morningExcessUsed = morningAlloc?.used || 0
  const afternoonExcessUsed = afternoonAlloc?.used || 0

  // Pill class for shift label (colored by state)
  const pillClass = (shift) => {
    if (shift === 'morning') {
      if (isMorningBoughtBack) return 'pill-bought-back'
      if (isMorningMet) return 'pill-met'
      if (isMorningUnmet && canBuyMorning) return 'pill-unmet-buyable'
      if (isMorningUnmet) return 'pill-unmet'
    } else {
      if (isAfternoonBoughtBack) return 'pill-bought-back'
      if (isAfternoonMet) return 'pill-met'
      if (isAfternoonUnmet && canBuyAfternoon) return 'pill-unmet-buyable'
      if (isAfternoonUnmet) return 'pill-unmet'
    }
    return ''
  }

  // Shift state class for subtle background tint
  const shiftStateClass = (shift) => {
    if (shift === 'morning') {
      if (isMorningBoughtBack) return 'shift-bought-back'
      if (isMorningMet) return 'shift-met'
      if (isMorningUnmet && canBuyMorning) return 'shift-unmet-buyable'
      if (isMorningUnmet) return 'shift-unmet'
    } else {
      if (isAfternoonBoughtBack) return 'shift-bought-back'
      if (isAfternoonMet) return 'shift-met'
      if (isAfternoonUnmet && canBuyAfternoon) return 'shift-unmet-buyable'
      if (isAfternoonUnmet) return 'shift-unmet'
    }
    return ''
  }

  const hasAnyConfirmed = goal?.morningConfirmed || goal?.afternoonConfirmed

  // Location abbreviation display
  const morningLocAbbr = goal?.morningConfirmed ? getLocationAbbr(goal?.morningLocation) : null
  const afternoonLocAbbr = goal?.afternoonConfirmed ? getLocationAbbr(goal?.afternoonLocation) : null
  const bothConfirmed = goal?.morningConfirmed && goal?.afternoonConfirmed
  const sameLocation = bothConfirmed && morningLocAbbr && afternoonLocAbbr && morningLocAbbr === afternoonLocAbbr
    ? morningLocAbbr : null

  // Check if shift has secondary info (excess, commission, unmet)
  const hasMorningMeta = morningExcess > 0
    || (isMorningMet && morningCommission > 0)
    || (isMorningBoughtBack && morningBuyback.commission > 0)
    || morningCustomCommission > 0
    || morningAllowance > 0
    || morningIgCommission > 0

  const hasAfternoonMeta = afternoonExcess > 0
    || (isAfternoonMet && afternoonCommission > 0)
    || (isAfternoonBoughtBack && afternoonBuyback.commission > 0)
    || afternoonCustomCommission > 0
    || afternoonAllowance > 0
    || afternoonIgCommission > 0

  return (
    <div className={cellClass} onClick={onClick}>
      <div className="day-header-row">
        <span className="day-number">{day}</span>
        {sameLocation && (
          <span className="day-location-badge" title={goal.morningLocation}>{sameLocation}</span>
        )}
      </div>
      {goal?.hasGoals && hasAnyConfirmed && (
        <div className="goals-display">
          <div className="shift-wages">
            {goal.morningConfirmed && (
              <div className={`shift ${shiftStateClass('morning')}${goal.morningAdminConfirmed && !bothShiftsVerified ? ' shift-verified' : ''}`}>
                <div className="shift-primary">
                  <span className={`shift-pill ${pillClass('morning')}`} title={goal.morningAdminConfirmed ? `Verified${goal.morningLocation ? ` - ${goal.morningLocation}` : ''}` : (goal.morningLocation || undefined)}>A</span>
                  {!sameLocation && morningLocAbbr && (
                    <span className="shift-location-badge" title={goal.morningLocation}>{morningLocAbbr}</span>
                  )}
                  {!sameLocation && !morningLocAbbr && (
                    <span className="shift-location-badge no-location" title="No location set">?</span>
                  )}
                  {goal.morningAmount > 0 ? (
                    <span className="shift-target">${goal.morningAmount.toLocaleString()}</span>
                  ) : goal.morningActual > 0 ? (
                    <span className="shift-actual-no-target">${goal.morningActual.toLocaleString()}</span>
                  ) : (
                    <span className="no-target-badge">No Target Yet</span>
                  )}
                  {isMorningUnmet && (
                    <span
                      className={`unmet-badge unmet-badge-inline ${canBuyMorning ? 'buyable' : ''}`}
                      onClick={(e) => canBuyMorning && handleBuyback('morning', e)}
                      title={canBuyMorning ? `${Math.round((goal.morningActual || 0) / goal.morningAmount * 100)}% — Click to buy back` : `Unmet: ${Math.round((goal.morningActual || 0) / goal.morningAmount * 100)}% of $${goal.morningAmount}`}
                      style={{ backgroundImage: `linear-gradient(to right, ${canBuyMorning ? '#6ee7b7' : '#fca5a5'} ${Math.min(100, Math.round((goal.morningActual || 0) / goal.morningAmount * 100))}%, transparent ${Math.min(100, Math.round((goal.morningActual || 0) / goal.morningAmount * 100))}%)` }}
                    >
                      <span className="unmet-badge-label">Unmet</span>
                      {canBuyMorning && <span className="buyback-star">★</span>}
                    </span>
                  )}
                  {goal.morningProofImages?.length > 0 && (
                    <span className="proof-icon proof-icon-clickable" title={`${goal.morningProofImages.length} proof image${goal.morningProofImages.length > 1 ? 's' : ''} — click to preview`} onClick={(e) => openProofPreview('morning', 0, e)}>&#128247;</span>
                  )}
                  <span className={`shift-wage ${wageClass(goal.morningWage, goal.morningCustomWage)}`}>${goal.morningWage}<span className="wage-suffix">/hr</span></span>
                </div>
                {hasMorningMeta && (
                  <div className="shift-meta">
                    {morningExcess > 0 && (
                      <span
                        className={`excess-badge ${morningExcessUsed >= morningExcess ? 'excess-consumed' : morningExcessUsed > 0 ? 'excess-partial' : 'excess-available'}`}
                        title={morningExcessUsed > 0
                          ? `Excess: $${morningExcess.toLocaleString()} | Used: $${morningExcessUsed.toLocaleString()} | Remaining: $${(morningExcess - morningExcessUsed).toLocaleString()}`
                          : `Excess from this shift: $${morningExcess.toLocaleString()}`}
                      >
                        <span className="excess-badge-label">Excess</span>
                        <span className="excess-badge-amount">${morningExcess.toLocaleString()}</span>
                        {morningExcessUsed >= morningExcess && (
                          <span className="excess-badge-suffix">used</span>
                        )}
                        {morningExcessUsed > 0 && morningExcessUsed < morningExcess && (
                          <span className="excess-badge-detail">
                            <span className="excess-detail-used">−${morningExcessUsed.toLocaleString()}</span>
                            <span className="excess-detail-sep">&middot;</span>
                            <span className="excess-detail-remaining">${(morningExcess - morningExcessUsed).toLocaleString()} left</span>
                          </span>
                        )}
                        {morningExcessUsed > 0 && morningExcessUsed < morningExcess && (
                          <span className="excess-usage-bar">
                            <span className="excess-usage-fill" style={{ width: `${Math.min(100, Math.round(morningExcessUsed / morningExcess * 100))}%` }} />
                          </span>
                        )}
                      </span>
                    )}
                    {morningIgCommission > 0 && (
                      <span className="commission-inline ig-commission" title={`IG 7%/5%`}>+${morningIgCommission}</span>
                    )}
                    {isMorningMet && morningCommission > 0 && (
                      <span className="commission-inline" title="Standard 4.5%">+${morningCommission}</span>
                    )}
                    {isMorningBoughtBack && morningBuyback.commission > 0 && (
                      <span className="commission-inline buyback-commission" title="Buyback 3.5%">+${morningBuyback.commission}</span>
                    )}
                    {morningCustomCommission > 0 && (
                      <span className="commission-inline custom-commission" title={`Custom ${goal.morningCustomRate}%`}>+${morningCustomCommission}</span>
                    )}
                    {morningAllowance > 0 && (
                      <span className="commission-inline allowance-badge" title="Allowance">+${morningAllowance}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            {goal.afternoonConfirmed && (
              <div className={`shift ${shiftStateClass('afternoon')}${goal.afternoonAdminConfirmed && !bothShiftsVerified ? ' shift-verified' : ''}`}>
                <div className="shift-primary">
                  <span className={`shift-pill ${pillClass('afternoon')}`} title={goal.afternoonAdminConfirmed ? `Verified${goal.afternoonLocation ? ` - ${goal.afternoonLocation}` : ''}` : (goal.afternoonLocation || undefined)}>B</span>
                  {!sameLocation && afternoonLocAbbr && (
                    <span className="shift-location-badge" title={goal.afternoonLocation}>{afternoonLocAbbr}</span>
                  )}
                  {!sameLocation && !afternoonLocAbbr && (
                    <span className="shift-location-badge no-location" title="No location set">?</span>
                  )}
                  {goal.afternoonAmount > 0 ? (
                    <span className="shift-target">${goal.afternoonAmount.toLocaleString()}</span>
                  ) : goal.afternoonActual > 0 ? (
                    <span className="shift-actual-no-target">${goal.afternoonActual.toLocaleString()}</span>
                  ) : (
                    <span className="no-target-badge">No Target Yet</span>
                  )}
                  {isAfternoonUnmet && (
                    <span
                      className={`unmet-badge unmet-badge-inline ${canBuyAfternoon ? 'buyable' : ''}`}
                      onClick={(e) => canBuyAfternoon && handleBuyback('afternoon', e)}
                      title={canBuyAfternoon ? `${Math.round((goal.afternoonActual || 0) / goal.afternoonAmount * 100)}% — Click to buy back` : `Unmet: ${Math.round((goal.afternoonActual || 0) / goal.afternoonAmount * 100)}% of $${goal.afternoonAmount}`}
                      style={{ backgroundImage: `linear-gradient(to right, ${canBuyAfternoon ? '#6ee7b7' : '#fca5a5'} ${Math.min(100, Math.round((goal.afternoonActual || 0) / goal.afternoonAmount * 100))}%, transparent ${Math.min(100, Math.round((goal.afternoonActual || 0) / goal.afternoonAmount * 100))}%)` }}
                    >
                      <span className="unmet-badge-label">Unmet</span>
                      {canBuyAfternoon && <span className="buyback-star">★</span>}
                    </span>
                  )}
                  {goal.afternoonProofImages?.length > 0 && (
                    <span className="proof-icon proof-icon-clickable" title={`${goal.afternoonProofImages.length} proof image${goal.afternoonProofImages.length > 1 ? 's' : ''} — click to preview`} onClick={(e) => openProofPreview('afternoon', 0, e)}>&#128247;</span>
                  )}
                  <span className={`shift-wage ${wageClass(goal.afternoonWage, goal.afternoonCustomWage)}`}>${goal.afternoonWage}<span className="wage-suffix">/hr</span></span>
                </div>
                {hasAfternoonMeta && (
                  <div className="shift-meta">
                    {afternoonExcess > 0 && (
                      <span
                        className={`excess-badge ${afternoonExcessUsed >= afternoonExcess ? 'excess-consumed' : afternoonExcessUsed > 0 ? 'excess-partial' : 'excess-available'}`}
                        title={afternoonExcessUsed > 0
                          ? `Excess: $${afternoonExcess.toLocaleString()} | Used: $${afternoonExcessUsed.toLocaleString()} | Remaining: $${(afternoonExcess - afternoonExcessUsed).toLocaleString()}`
                          : `Excess from this shift: $${afternoonExcess.toLocaleString()}`}
                      >
                        <span className="excess-badge-label">Excess</span>
                        <span className="excess-badge-amount">${afternoonExcess.toLocaleString()}</span>
                        {afternoonExcessUsed >= afternoonExcess && (
                          <span className="excess-badge-suffix">used</span>
                        )}
                        {afternoonExcessUsed > 0 && afternoonExcessUsed < afternoonExcess && (
                          <span className="excess-badge-detail">
                            <span className="excess-detail-used">−${afternoonExcessUsed.toLocaleString()}</span>
                            <span className="excess-detail-sep">&middot;</span>
                            <span className="excess-detail-remaining">${(afternoonExcess - afternoonExcessUsed).toLocaleString()} left</span>
                          </span>
                        )}
                        {afternoonExcessUsed > 0 && afternoonExcessUsed < afternoonExcess && (
                          <span className="excess-usage-bar">
                            <span className="excess-usage-fill" style={{ width: `${Math.min(100, Math.round(afternoonExcessUsed / afternoonExcess * 100))}%` }} />
                          </span>
                        )}
                      </span>
                    )}
                    {afternoonIgCommission > 0 && (
                      <span className="commission-inline ig-commission" title={`IG 7%/5%`}>+${afternoonIgCommission}</span>
                    )}
                    {isAfternoonMet && afternoonCommission > 0 && (
                      <span className="commission-inline" title="Standard 4.5%">+${afternoonCommission}</span>
                    )}
                    {isAfternoonBoughtBack && afternoonBuyback.commission > 0 && (
                      <span className="commission-inline buyback-commission" title="Buyback 3.5%">+${afternoonBuyback.commission}</span>
                    )}
                    {afternoonCustomCommission > 0 && (
                      <span className="commission-inline custom-commission" title={`Custom ${goal.afternoonCustomRate}%`}>+${afternoonCustomCommission}</span>
                    )}
                    {afternoonAllowance > 0 && (
                      <span className="commission-inline allowance-badge" title="Allowance">+${afternoonAllowance}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="labor-total" onClick={handleWageClick} style={{ cursor: 'pointer' }}>
            ${totalEarnings.toLocaleString()}
          </div>
        </div>
      )}

      {proofPreview && combinedProofImages[proofPreview.index] && createPortal(
        <div className="proof-preview-overlay" onClick={closeProofPreview}>
          <div className="proof-preview-content" onClick={e => e.stopPropagation()}>
            <button className="proof-preview-close" onClick={closeProofPreview}>&times;</button>
            {combinedProofImages.length > 1 && (
              <>
                <button className="proof-preview-nav proof-preview-prev" onClick={prevProof}>&#8249;</button>
                <button className="proof-preview-nav proof-preview-next" onClick={nextProof}>&#8250;</button>
              </>
            )}
            <img src={combinedProofImages[proofPreview.index].url} alt={combinedProofImages[proofPreview.index].name} />
            <div className="proof-preview-info">
              <div className="proof-preview-info-row">
                <span className={`proof-preview-shift-label shift-${combinedProofImages[proofPreview.index].shiftLabel === 'A' ? 'a' : 'b'}`}>Shift {combinedProofImages[proofPreview.index].shiftLabel}</span>
                {combinedProofImages.length > 1 && (
                  <span className="proof-preview-counter">{proofPreview.index + 1} / {combinedProofImages.length}</span>
                )}
              </div>
              <span>{combinedProofImages[proofPreview.index].name}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
