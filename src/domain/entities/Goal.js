export const DEFAULT_MORNING_START = '11:50'
export const DEFAULT_MORNING_END = '16:00'
export const DEFAULT_AFTERNOON_START = '16:00'
export const DEFAULT_AFTERNOON_END = '20:10'
export const DEFAULT_SHIFT_HOURS = 4 + (10 / 60) // 4.167 hours

export class Goal {
  constructor(data = {}) {
    this.day = data.day
    this.morningAmount = this.parseAmount(data.morningAmount)
    this.afternoonAmount = this.parseAmount(data.afternoonAmount)
    this.morningActual = this.parseAmount(data.morningActual)
    this.afternoonActual = this.parseAmount(data.afternoonActual)
    this.morningBoughtBack = data.morningBoughtBack || false
    this.afternoonBoughtBack = data.afternoonBoughtBack || false
    this.morningCustomRate = this.parseAmount(data.morningCustomRate)
    this.afternoonCustomRate = this.parseAmount(data.afternoonCustomRate)
    this.morningCustomAmount = this.parseAmount(data.morningCustomAmount)
    this.afternoonCustomAmount = this.parseAmount(data.afternoonCustomAmount)
    this.morningStartTime = data.morningStartTime || DEFAULT_MORNING_START
    this.morningEndTime = data.morningEndTime || DEFAULT_MORNING_END
    this.afternoonStartTime = data.afternoonStartTime || DEFAULT_AFTERNOON_START
    this.afternoonEndTime = data.afternoonEndTime || DEFAULT_AFTERNOON_END
    this.morningConfirmed = !!data.morningConfirmed
    this.afternoonConfirmed = !!data.afternoonConfirmed
    this.morningAdminConfirmed = !!data.morningAdminConfirmed
    this.afternoonAdminConfirmed = !!data.afternoonAdminConfirmed
    this.morningLocation = data.morningLocation || null
    this.afternoonLocation = data.afternoonLocation || null
    this.morningProofImages = Array.isArray(data.morningProofImages) ? data.morningProofImages : []
    this.afternoonProofImages = Array.isArray(data.afternoonProofImages) ? data.afternoonProofImages : []
    this.morningAllowance = this.parseAmount(data.morningAllowance)
    this.afternoonAllowance = this.parseAmount(data.afternoonAllowance)
    this.morningCustomWage = this.parseAmount(data.morningCustomWage)
    this.afternoonCustomWage = this.parseAmount(data.afternoonCustomWage)
    this.morningIgFeaturedAmount = this.parseAmount(data.morningIgFeaturedAmount)
    this.morningIgOtherAmount = this.parseAmount(data.morningIgOtherAmount)
    this.afternoonIgFeaturedAmount = this.parseAmount(data.afternoonIgFeaturedAmount)
    this.afternoonIgOtherAmount = this.parseAmount(data.afternoonIgOtherAmount)
  }

  parseAmount(value) {
    if (value === null || value === undefined || value === '') {
      return null
    }
    const num = Number(value)
    return isNaN(num) || num < 0 ? null : num
  }

  static calculateHoursFromTimes(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const diff = endMinutes - startMinutes
    return diff > 0 ? diff / 60 : 0
  }

  get morningShiftHours() {
    return Goal.calculateHoursFromTimes(this.morningStartTime, this.morningEndTime)
  }

  get afternoonShiftHours() {
    return Goal.calculateHoursFromTimes(this.afternoonStartTime, this.afternoonEndTime)
  }

  static calculateWage(target, actual) {
    if (actual === null || actual === 0) return 65
    if (target !== null && actual >= target) return 80
    return 75
  }

  get morningEffectiveActual() {
    const total = (this.morningActual || 0) + (this.morningIgFeaturedAmount || 0) + (this.morningIgOtherAmount || 0)
    return total > 0 ? total : null
  }

  get afternoonEffectiveActual() {
    const total = (this.afternoonActual || 0) + (this.afternoonIgFeaturedAmount || 0) + (this.afternoonIgOtherAmount || 0)
    return total > 0 ? total : null
  }

  get morningCalculatedWage() {
    return Goal.calculateWage(this.morningAmount, this.morningEffectiveActual)
  }

  get afternoonCalculatedWage() {
    return Goal.calculateWage(this.afternoonAmount, this.afternoonEffectiveActual)
  }

  get morningWage() {
    if (this.morningCustomWage !== null) return this.morningCustomWage
    return this.morningCalculatedWage
  }

  get afternoonWage() {
    if (this.afternoonCustomWage !== null) return this.afternoonCustomWage
    return this.afternoonCalculatedWage
  }

  get hasGoals() {
    return this.morningConfirmed || this.afternoonConfirmed ||
      this.morningAmount !== null || this.afternoonAmount !== null
  }

  toJSON() {
    return {
      day: this.day,
      morningAmount: this.morningAmount,
      afternoonAmount: this.afternoonAmount,
      morningActual: this.morningActual,
      afternoonActual: this.afternoonActual,
      morningBoughtBack: this.morningBoughtBack,
      afternoonBoughtBack: this.afternoonBoughtBack,
      morningCustomRate: this.morningCustomRate,
      afternoonCustomRate: this.afternoonCustomRate,
      morningCustomAmount: this.morningCustomAmount,
      afternoonCustomAmount: this.afternoonCustomAmount,
      morningStartTime: this.morningStartTime,
      morningEndTime: this.morningEndTime,
      afternoonStartTime: this.afternoonStartTime,
      afternoonEndTime: this.afternoonEndTime,
      morningConfirmed: this.morningConfirmed,
      afternoonConfirmed: this.afternoonConfirmed,
      morningAdminConfirmed: this.morningAdminConfirmed,
      afternoonAdminConfirmed: this.afternoonAdminConfirmed,
      morningLocation: this.morningLocation,
      afternoonLocation: this.afternoonLocation,
      morningProofImages: this.morningProofImages,
      afternoonProofImages: this.afternoonProofImages,
      morningAllowance: this.morningAllowance,
      afternoonAllowance: this.afternoonAllowance,
      morningCustomWage: this.morningCustomWage,
      afternoonCustomWage: this.afternoonCustomWage,
      morningIgFeaturedAmount: this.morningIgFeaturedAmount,
      morningIgOtherAmount: this.morningIgOtherAmount,
      afternoonIgFeaturedAmount: this.afternoonIgFeaturedAmount,
      afternoonIgOtherAmount: this.afternoonIgOtherAmount
    }
  }

  static fromJSON(data) {
    // Backward compat: old data without confirmed fields defaults to confirmed
    // if the shift has any data (amount or actual set)
    const morningConfirmed = data.morningConfirmed !== undefined
      ? data.morningConfirmed
      : (data.morningAmount != null || data.morningActual != null)
    const afternoonConfirmed = data.afternoonConfirmed !== undefined
      ? data.afternoonConfirmed
      : (data.afternoonAmount != null || data.afternoonActual != null)

    // Backward compat: migrate old single adminConfirmed to per-shift fields
    let morningAdminConfirmed = false
    let afternoonAdminConfirmed = false
    if (data.morningAdminConfirmed !== undefined) {
      morningAdminConfirmed = data.morningAdminConfirmed
    } else if (data.adminConfirmed) {
      morningAdminConfirmed = true
    }
    if (data.afternoonAdminConfirmed !== undefined) {
      afternoonAdminConfirmed = data.afternoonAdminConfirmed
    } else if (data.adminConfirmed) {
      afternoonAdminConfirmed = true
    }

    return new Goal({
      ...data,
      morningConfirmed,
      afternoonConfirmed,
      morningAdminConfirmed,
      afternoonAdminConfirmed,
      morningLocation: data.morningLocation || null,
      morningProofImages: data.morningProofImages || [],
      afternoonProofImages: data.afternoonProofImages || [],
      morningAllowance: data.morningAllowance ?? null,
      afternoonAllowance: data.afternoonAllowance ?? null,
      morningCustomWage: data.morningCustomWage ?? null,
      afternoonCustomWage: data.afternoonCustomWage ?? null,
      morningIgFeaturedAmount: data.morningIgFeaturedAmount ?? null,
      morningIgOtherAmount: data.morningIgOtherAmount ?? null,
      afternoonIgFeaturedAmount: data.afternoonIgFeaturedAmount ?? null,
      afternoonIgOtherAmount: data.afternoonIgOtherAmount ?? null
    })
  }
}
