import { describe, it, expect } from 'vitest'
import { getDefaultShiftKey, getShiftBadge, buildExtrasChips } from './shiftDisplay'

describe('getDefaultShiftKey', () => {
  it('returns morning when there is no goal', () => {
    expect(getDefaultShiftKey(null, false)).toBe('morning')
    expect(getDefaultShiftKey(undefined, true)).toBe('morning')
  })

  it('admin: picks the first confirmed-but-unverified shift', () => {
    const goal = { morningConfirmed: true, morningAdminConfirmed: false, afternoonConfirmed: true, afternoonAdminConfirmed: false }
    expect(getDefaultShiftKey(goal, true)).toBe('morning')
  })

  it('admin: skips a verified morning and lands on unverified afternoon', () => {
    const goal = { morningConfirmed: true, morningAdminConfirmed: true, afternoonConfirmed: true, afternoonAdminConfirmed: false }
    expect(getDefaultShiftKey(goal, true)).toBe('afternoon')
  })

  it('admin: ignores unconfirmed shifts', () => {
    const goal = { morningConfirmed: false, afternoonConfirmed: true, afternoonAdminConfirmed: false }
    expect(getDefaultShiftKey(goal, true)).toBe('afternoon')
  })

  it('member: picks the first confirmed shift missing an actual', () => {
    const goal = { morningConfirmed: true, morningActual: '5000', afternoonConfirmed: true, afternoonActual: '' }
    expect(getDefaultShiftKey(goal, false)).toBe('afternoon')
  })

  it("member: treats actual='0' as entered", () => {
    const goal = { morningConfirmed: true, morningActual: '0', afternoonConfirmed: true, afternoonActual: '' }
    expect(getDefaultShiftKey(goal, false)).toBe('afternoon')
  })

  it('falls back to morning when nothing needs attention', () => {
    const goal = {
      morningConfirmed: true, morningAdminConfirmed: true, morningActual: '5000',
      afternoonConfirmed: true, afternoonAdminConfirmed: true, afternoonActual: '6000'
    }
    expect(getDefaultShiftKey(goal, true)).toBe('morning')
    expect(getDefaultShiftKey(goal, false)).toBe('morning')
  })
})

describe('getShiftBadge', () => {
  it('returns verified for an admin-verified shift', () => {
    expect(getShiftBadge({ confirmed: true, verified: true, hasActual: true }, true)).toBe('verified')
  })

  it('returns null for an unconfirmed shift', () => {
    expect(getShiftBadge({ confirmed: false, verified: false, hasActual: false }, true)).toBe(null)
  })

  it('admin: returns attention for confirmed but unverified', () => {
    expect(getShiftBadge({ confirmed: true, verified: false, hasActual: true }, true)).toBe('attention')
  })

  it('member: returns attention for confirmed without actual', () => {
    expect(getShiftBadge({ confirmed: true, verified: false, hasActual: false }, false)).toBe('attention')
  })

  it('member: returns null for confirmed with actual', () => {
    expect(getShiftBadge({ confirmed: true, verified: false, hasActual: true }, false)).toBe(null)
  })
})

describe('buildExtrasChips', () => {
  const empty = { igFeatured: '', igOther: '', customRate: '', customAmount: '', allowance: '', customWage: '', isAdminViewing: true }

  it('returns no chips when everything is default', () => {
    expect(buildExtrasChips(empty)).toEqual([])
  })

  it('sums IG featured + other into one chip', () => {
    expect(buildExtrasChips({ ...empty, igFeatured: '100', igOther: '20' })).toEqual(['IG $120'])
  })

  it('shows custom commission rate', () => {
    expect(buildExtrasChips({ ...empty, customRate: '5' })).toEqual(['Comm 5%'])
  })

  it('shows custom commission amount when there is no rate', () => {
    expect(buildExtrasChips({ ...empty, customAmount: '1000' })).toEqual(['Comm $1000'])
  })

  it('shows allowance and custom wage for admins', () => {
    expect(buildExtrasChips({ ...empty, allowance: '50', customWage: '70' }))
      .toEqual(['Allowance $50', 'Wage $70/hr'])
  })

  it('hides allowance and custom wage from non-admins', () => {
    expect(buildExtrasChips({ ...empty, allowance: '50', customWage: '70', isAdminViewing: false }))
      .toEqual([])
  })

  it('treats a custom wage of 0 as set', () => {
    expect(buildExtrasChips({ ...empty, customWage: '0' })).toEqual(['Wage $0/hr'])
  })

  it('orders chips IG, Comm, Allowance, Wage', () => {
    expect(buildExtrasChips({ ...empty, igFeatured: '120', customRate: '5', allowance: '50', customWage: '70' }))
      .toEqual(['IG $120', 'Comm 5%', 'Allowance $50', 'Wage $70/hr'])
  })

  it('rounds fractional IG sums for display', () => {
    expect(buildExtrasChips({ ...empty, igFeatured: '1.1', igOther: '2.2' })).toEqual(['IG $3.3'])
  })

  it('ignores non-numeric strings', () => {
    expect(buildExtrasChips({ ...empty, igFeatured: 'abc', customRate: 'xyz' })).toEqual([])
  })
})
