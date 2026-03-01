import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function MonthlySalaryModal({
  year,
  month,
  goals,
  monthlyEarnings,
  myBonusShare,
  myBonusBreakdown,
  miscItems,
  miscTotal,
  viewingMember,
  fullScreen,
  onClose
}) {
  const { wages, commission45, commission35, commissionCustom, customRates, totalAllowance } = monthlyEarnings

  // Build per-day details
  const pad = (n) => String(n).padStart(2, '0')
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const workedDays = []
  let totalShifts = 0
  let totalHours = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
    const goal = goals[dateStr]
    if (!goal?.hasGoals) continue

    const hasMorning = goal.morningConfirmed
    const hasAfternoon = goal.afternoonConfirmed
    if (!hasMorning && !hasAfternoon) continue

    const morningHours = hasMorning ? (goal.morningShiftHours ?? DEFAULT_SHIFT_HOURS) : 0
    const afternoonHours = hasAfternoon ? (goal.afternoonShiftHours ?? DEFAULT_SHIFT_HOURS) : 0
    const dayHours = morningHours + afternoonHours

    // Labor
    let dayLabor = 0
    if (hasMorning) dayLabor += Math.round((goal.morningWage || 65) * morningHours * 100) / 100
    if (hasAfternoon) dayLabor += Math.round((goal.afternoonWage || 65) * afternoonHours * 100) / 100

    // Commissions
    let dayCommission = 0
    if (hasMorning && goal.morningCalculatedWage === 80 && goal.morningActual > 0) {
      dayCommission += Math.round(goal.morningAmount * 0.045 * 100) / 100
    }
    if (hasAfternoon && goal.afternoonCalculatedWage === 80 && goal.afternoonActual > 0) {
      dayCommission += Math.round(goal.afternoonAmount * 0.045 * 100) / 100
    }
    if (hasMorning && goal.morningBoughtBack && goal.morningAmount) {
      dayCommission += Math.round(goal.morningAmount * 0.035 * 100) / 100
    }
    if (hasAfternoon && goal.afternoonBoughtBack && goal.afternoonAmount) {
      dayCommission += Math.round(goal.afternoonAmount * 0.035 * 100) / 100
    }
    if (hasMorning && goal.morningCustomRate && goal.morningCustomAmount) {
      dayCommission += Math.round(goal.morningCustomAmount * (goal.morningCustomRate / 100) * 100) / 100
    }
    if (hasAfternoon && goal.afternoonCustomRate && goal.afternoonCustomAmount) {
      dayCommission += Math.round(goal.afternoonCustomAmount * (goal.afternoonCustomRate / 100) * 100) / 100
    }

    // Allowance
    const dayAllowance = (hasMorning && goal.morningAllowance ? goal.morningAllowance : 0)
      + (hasAfternoon && goal.afternoonAllowance ? goal.afternoonAllowance : 0)

    const dayTotal = Math.round((dayLabor + dayCommission + dayAllowance) * 100) / 100

    const shifts = hasMorning && hasAfternoon ? 'A+B' : hasMorning ? 'A' : 'B'
    const shiftCount = (hasMorning ? 1 : 0) + (hasAfternoon ? 1 : 0)

    totalShifts += shiftCount
    totalHours += dayHours

    const date = new Date(year, month, day)
    const formatted = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

    // Location
    const morningLoc = hasMorning ? goal.morningLocation : null
    const afternoonLoc = hasAfternoon ? goal.afternoonLocation : null
    let location = null
    if (hasMorning && hasAfternoon) {
      // Both shifts — need to show per-shift detail if they differ or one is missing
      if (morningLoc && afternoonLoc && morningLoc === afternoonLoc) {
        location = morningLoc
      } else {
        location = `A: ${morningLoc || '—'} / B: ${afternoonLoc || '—'}`
      }
    } else {
      // Single shift — show location directly or nothing
      location = morningLoc || afternoonLoc
    }

    workedDays.push({ dateStr, formatted, shifts, hours: dayHours, total: dayTotal, location })
  }

  totalHours = Math.round(totalHours * 100) / 100

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const grossTotal = Math.round((wages + commission45 + commission35 + commissionCustom + totalAllowance + myBonusShare + miscTotal) * 100) / 100
  const hasMpf = grossTotal > 7000
  const mpfDeduction = hasMpf ? Math.round(grossTotal * 0.05 * 100) / 100 : 0
  const takeHome = hasMpf ? Math.round((grossTotal - mpfDeduction) * 100) / 100 : grossTotal

  const content = (
    <>
        <h2>Monthly Salary</h2>
        <div className="salary-month-header">
          {MONTH_NAMES[month]} {year}
          {viewingMember && (
            <span className="salary-member-name">{viewingMember.displayName || viewingMember.email}</span>
          )}
        </div>

        {/* Work Summary */}
        <div className="salary-section">
          <div className="salary-section-title">Work Summary</div>
          <div className="salary-row">
            <span>Confirmed Shifts</span>
            <span>{totalShifts}</span>
          </div>
          <div className="salary-row">
            <span>Total Hours</span>
            <span>{formatHours(totalHours)}</span>
          </div>
          {totalHours > 0 && (
            <div className="salary-row">
              <span>Effective Hourly Wage</span>
              <span>${(grossTotal / totalHours).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Earnings Breakdown */}
        <div className="salary-section">
          <div className="salary-section-title">Earnings</div>
          <div className="salary-row">
            <span>Base Wages</span>
            <span>${wages.toLocaleString()}</span>
          </div>
          {commission45 > 0 && (
            <div className="salary-row positive">
              <span>Commission (4.5%)</span>
              <span>+${commission45.toLocaleString()}</span>
            </div>
          )}
          {commission35 > 0 && (
            <div className="salary-row positive">
              <span>Buyback Commission (3.5%)</span>
              <span>+${commission35.toLocaleString()}</span>
            </div>
          )}
          {commissionCustom > 0 && (
            <div className="salary-row positive">
              <span>Custom Commission ({customRates.length === 1 ? `${customRates[0]}%` : customRates.map(r => `${r}%`).join(', ')})</span>
              <span>+${commissionCustom.toLocaleString()}</span>
            </div>
          )}
          {totalAllowance > 0 && (
            <div className="salary-row positive">
              <span>Allowance</span>
              <span>+${totalAllowance.toLocaleString()}</span>
            </div>
          )}
          {myBonusBreakdown && myBonusBreakdown.length > 0 ? myBonusBreakdown.map((b, i) => (
            <div className="salary-row positive" key={`bonus-${i}`}>
              <span>{b.location} Bonus</span>
              <span>+${b.share.toLocaleString()}</span>
            </div>
          )) : myBonusShare > 0 && (
            <div className="salary-row positive">
              <span>Team Bonus</span>
              <span>+${myBonusShare.toLocaleString()}</span>
            </div>
          )}
          {miscItems.length > 0 && miscItems.map(item => (
            <div className={`salary-row ${item.amount >= 0 ? 'positive' : 'negative'}`} key={item.id}>
              <span>{item.label}</span>
              <span>{item.amount >= 0 ? '+' : '-'}${Math.abs(item.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="salary-totals">
          <div className="salary-gross-row">
            <span>Gross Total</span>
            <span>${grossTotal.toLocaleString()}</span>
          </div>
          {hasMpf && (
            <div className="salary-row negative">
              <span>MPF (5%)</span>
              <span>-${mpfDeduction.toLocaleString()}</span>
            </div>
          )}
          <div className="salary-take-home">
            <span>Take Home</span>
            <span>${takeHome.toLocaleString()}</span>
          </div>
        </div>

        {/* Per-Day Details */}
        {workedDays.length > 0 && (
          <div className="salary-section">
            <div className="salary-section-title">Daily Details</div>
            <div className="salary-daily-list">
              {workedDays.map(day => (
                <div className="salary-day-row" key={day.dateStr}>
                  <div className="salary-day-info">
                    <span className="salary-day-date">{day.formatted}</span>
                    {day.location && <span className="salary-day-location">{day.location}</span>}
                  </div>
                  <span className="salary-day-shifts">{day.shifts}</span>
                  <span className="salary-day-hours">{formatHours(day.hours)}</span>
                  <span className="salary-day-total">${day.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="button-group">
          <button className="save-btn" onClick={onClose}>Close</button>
        </div>
    </>
  )

  if (fullScreen) {
    return (
      <div className="monthly-salary-fullscreen">
        <div className="monthly-salary-fullscreen-content">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal monthly-salary-modal" onClick={e => e.stopPropagation()}>
        {content}
      </div>
    </div>
  )
}
