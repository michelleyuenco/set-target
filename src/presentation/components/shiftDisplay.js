// Pure display helpers for the day dialog (GoalModal). No React, no I/O.

const shiftStatus = (goal, prefix) => ({
  confirmed: !!goal?.[prefix + 'Confirmed'],
  verified: !!goal?.[prefix + 'AdminConfirmed'],
  hasActual: String(goal?.[prefix + 'Actual'] ?? '').trim() !== ''
})

const needsAttention = (status, isAdminViewing) =>
  status.confirmed && (isAdminViewing ? !status.verified : !status.hasActual)

export function getDefaultShiftKey(goal, isAdminViewing) {
  if (needsAttention(shiftStatus(goal, 'morning'), isAdminViewing)) return 'morning'
  if (needsAttention(shiftStatus(goal, 'afternoon'), isAdminViewing)) return 'afternoon'
  return 'morning'
}

export function getShiftBadge(status, isAdminViewing) {
  if (status.verified) return 'verified'
  if (needsAttention(status, isAdminViewing)) return 'attention'
  return null
}

export function buildExtrasChips({ igFeatured, igOther, customRate, customAmount, allowance, customWage, isAdminViewing }) {
  const num = (v) => (v === '' || v === null || v === undefined) ? 0 : (Number(v) || 0)
  const isSet = (v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v))

  const chips = []
  const ig = num(igFeatured) + num(igOther)
  if (ig > 0) chips.push(`IG $${ig}`)
  if (num(customRate) > 0) chips.push(`Comm ${num(customRate)}%`)
  else if (num(customAmount) > 0) chips.push(`Comm $${num(customAmount)}`)
  if (isAdminViewing && num(allowance) > 0) chips.push(`Allowance $${num(allowance)}`)
  if (isAdminViewing && isSet(customWage) && Number(customWage) >= 0) chips.push(`Wage $${Number(customWage)}/hr`)
  return chips
}
