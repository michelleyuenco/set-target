import { DEFAULT_SHIFT_HOURS } from '../../domain/entities/Goal'

/**
 * Single source of truth for all wage / commission / earnings math.
 * Pure functions — no React, no Firebase, no I/O.
 *
 * Domain rules encoded here:
 *   - Standard commission (4.5%) is paid only when the shift hit target (calculatedWage === 80) AND has actual revenue.
 *   - Buyback commission (3.5%) is paid when an unmet target was bought back.
 *   - IG commission (7% featured / 5% other) replaces standard + buyback commission for the shift.
 *   - Custom commission applies regardless of IG.
 *   - MPF (5%) is deducted only when gross monthly total exceeds the threshold.
 */

export const COMMISSION_RATES = Object.freeze({
  standard: 0.045,
  buyback: 0.035,
  igFeatured: 0.07,
  igOther: 0.05,
})

export const DEFAULT_HOURLY_WAGE = 65
export const TARGET_HIT_WAGE = 80
export const MPF_RATE = 0.05
export const MPF_THRESHOLD = 7000

const round2 = (n) => Math.round(n * 100) / 100

/**
 * Normalize the morning/afternoon half of a goal into a flat shift object.
 * Returns null if `goal` is falsy.
 */
export function getShiftData(goal, shift) {
  if (!goal) return null
  const p = shift
  return {
    shift,
    confirmed: !!goal[`${p}Confirmed`],
    adminConfirmed: !!goal[`${p}AdminConfirmed`],
    hours: goal[`${p}ShiftHours`] ?? DEFAULT_SHIFT_HOURS,
    wage: goal[`${p}Wage`] || DEFAULT_HOURLY_WAGE,
    customWage: goal[`${p}CustomWage`],
    calculatedWage: goal[`${p}CalculatedWage`],
    amount: goal[`${p}Amount`] || 0,
    actual: goal[`${p}Actual`] || 0,
    boughtBack: !!goal[`${p}BoughtBack`],
    customRate: goal[`${p}CustomRate`],
    customAmount: goal[`${p}CustomAmount`] || 0,
    allowance: goal[`${p}Allowance`] || 0,
    igFeaturedAmount: goal[`${p}IgFeaturedAmount`] || 0,
    igOtherAmount: goal[`${p}IgOtherAmount`] || 0,
    location: goal[`${p}Location`],
    startTime: goal[`${p}StartTime`],
    endTime: goal[`${p}EndTime`],
  }
}

export function shiftHasIg(s) {
  return s.igFeaturedAmount > 0 || s.igOtherAmount > 0
}

/** Effective actual revenue including IG amounts (used for excess calculations). */
export function effectiveActual(s) {
  return s.actual + s.igFeaturedAmount + s.igOtherAmount
}

export function calculateShiftLabor(s) {
  if (!s.confirmed) return 0
  return round2(s.wage * s.hours)
}

/** IG commission breakdown for a shift. Returns zeroed structure when not applicable. */
export function calculateIgCommission(s) {
  const empty = { featured: 0, other: 0, featuredCommission: 0, otherCommission: 0, total: 0 }
  if (!s.confirmed || !shiftHasIg(s)) return empty
  const featured = s.igFeaturedAmount
  const other = s.igOtherAmount
  const featuredCommission = round2(featured * COMMISSION_RATES.igFeatured)
  const otherCommission = round2(other * COMMISSION_RATES.igOther)
  return {
    featured,
    other,
    featuredCommission,
    otherCommission,
    total: round2(featuredCommission + otherCommission),
  }
}

/** 4.5% — only when target hit AND has actual revenue, suppressed by IG. */
export function calculateStandardCommission(s) {
  if (!s.confirmed) return 0
  if (shiftHasIg(s)) return 0
  if (s.calculatedWage !== TARGET_HIT_WAGE) return 0
  if (s.actual <= 0) return 0
  return round2(s.amount * COMMISSION_RATES.standard)
}

/** 3.5% — paid on bought-back unmet targets, suppressed by IG. */
export function calculateBuybackCommission(s) {
  if (!s.confirmed || !s.boughtBack || !s.amount) return 0
  if (shiftHasIg(s)) return 0
  return round2(s.amount * COMMISSION_RATES.buyback)
}

/** Custom commission — applies regardless of IG. */
export function calculateCustomCommission(s) {
  if (!s.confirmed || !s.customRate || !s.customAmount) return 0
  return round2(s.customAmount * (s.customRate / 100))
}

/** Whether the shift was unmet (target not hit and not bought back) — used for buyback eligibility. */
export function isShiftUnmet(s) {
  return s.confirmed && s.amount > 0 && s.calculatedWage !== TARGET_HIT_WAGE && !s.boughtBack
}

/** Has the wall-clock time passed the shift's end? `now` is a Date; `dateStr` is YYYY-MM-DD. */
export function isShiftEnded(dateStr, endTime, now) {
  if (!endTime) return false
  const [endH, endM] = endTime.split(':').map(Number)
  const [y, m, d] = dateStr.split('-').map(Number)
  const shiftEnd = new Date(y, m - 1, d, endH, endM, 0, 0)
  return now >= shiftEnd
}

/**
 * Full earnings breakdown for one shift (zeros if unconfirmed).
 * Buyback `amount` is independent of IG; only the commission is suppressed when IG applies.
 */
export function calculateShiftEarnings(s) {
  if (!s || !s.confirmed) {
    return {
      labor: 0,
      standardCommission: 0,
      buybackCommission: 0,
      buybackAmount: 0,
      customCommission: 0,
      customRate: 0,
      customAmount: 0,
      ig: { featured: 0, other: 0, featuredCommission: 0, otherCommission: 0, total: 0 },
      allowance: 0,
      total: 0,
    }
  }
  const labor = calculateShiftLabor(s)
  const ig = calculateIgCommission(s)
  const standardCommission = calculateStandardCommission(s)
  const buybackCommission = calculateBuybackCommission(s)
  const customCommission = calculateCustomCommission(s)
  const buybackAmount = s.boughtBack && s.amount ? s.amount : 0
  const allowance = s.allowance
  const total = round2(
    labor + ig.total + standardCommission + buybackCommission + customCommission + allowance
  )
  return {
    labor,
    standardCommission,
    buybackCommission,
    buybackAmount,
    customCommission,
    customRate: s.customRate || 0,
    customAmount: s.customAmount || 0,
    ig,
    allowance,
    total,
  }
}

/** Aggregate the two shifts of a day. */
export function calculateDayEarnings(goal) {
  const morning = calculateShiftEarnings(getShiftData(goal, 'morning'))
  const afternoon = calculateShiftEarnings(getShiftData(goal, 'afternoon'))
  return {
    morning,
    afternoon,
    totals: {
      labor: round2(morning.labor + afternoon.labor),
      standardCommission: round2(morning.standardCommission + afternoon.standardCommission),
      buybackCommission: round2(morning.buybackCommission + afternoon.buybackCommission),
      customCommission: round2(morning.customCommission + afternoon.customCommission),
      igCommission: round2(morning.ig.total + afternoon.ig.total),
      allowance: round2(morning.allowance + afternoon.allowance),
      total: round2(morning.total + afternoon.total),
    },
  }
}

/** Hong Kong MPF deduction — 5% of gross above threshold. */
export function calculateMpf(grossTotal) {
  const hasMpf = grossTotal > MPF_THRESHOLD
  const deduction = hasMpf ? round2(grossTotal * MPF_RATE) : 0
  const takeHome = round2(grossTotal - deduction)
  return { hasMpf, deduction, takeHome }
}

/** YYYY-MM-DD for a (year, zero-indexed month, day). */
function dateKey(year, month, day) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/**
 * Iterate confirmed shifts of a member's monthly goals.
 * Yields { dateStr, day, shift, shiftData } for each confirmed shift.
 */
export function* iterateConfirmedShifts(goals, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = dateKey(year, month, day)
    const goal = goals[dateStr]
    if (!goal?.hasGoals) continue
    for (const shift of ['morning', 'afternoon']) {
      const shiftData = getShiftData(goal, shift)
      if (!shiftData.confirmed) continue
      yield { dateStr, day, shift, shiftData, goal }
    }
  }
}

/**
 * Monthly earnings aggregate for a single member. Public, stable signature.
 * Backwards-compatible with prior implementation.
 */
export function calculateMemberMonthlyEarnings(goals, year, month, teamBonusShare = 0, miscTotal = 0) {
  let wages = 0
  let commission45 = 0
  let commission35 = 0
  let commissionCustom = 0
  let commissionIg = 0
  let totalAllowance = 0
  let totalHours = 0
  let totalShifts = 0
  const customRates = new Set()

  for (const { shiftData: s } of iterateConfirmedShifts(goals, year, month)) {
    totalShifts++
    totalHours += s.hours
    wages += calculateShiftLabor(s)
    commissionIg += calculateIgCommission(s).total
    commission45 += calculateStandardCommission(s)
    commission35 += calculateBuybackCommission(s)
    const custom = calculateCustomCommission(s)
    if (custom > 0) {
      commissionCustom += custom
      customRates.add(Number(s.customRate))
    }
    totalAllowance += s.allowance
  }

  wages = round2(wages)
  commission45 = round2(commission45)
  commission35 = round2(commission35)
  commissionCustom = round2(commissionCustom)
  commissionIg = round2(commissionIg)
  totalAllowance = round2(totalAllowance)
  totalHours = round2(totalHours)

  const grossTotal = round2(
    wages + commission45 + commission35 + commissionCustom + commissionIg + totalAllowance + teamBonusShare + miscTotal
  )
  const effectiveHourlyWage = totalHours > 0 ? round2(grossTotal / totalHours) : null

  return {
    wages,
    commission45,
    commission35,
    commissionCustom,
    commissionIg,
    customRates: Array.from(customRates).sort((a, b) => a - b),
    totalAllowance,
    totalHours,
    totalShifts,
    grossTotal,
    effectiveHourlyWage,
  }
}
