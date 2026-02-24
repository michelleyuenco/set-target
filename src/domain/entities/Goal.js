export const DEFAULT_MORNING_START = '11:50'
export const DEFAULT_MORNING_END = '16:00'
export const DEFAULT_AFTERNOON_START = '16:00'
export const DEFAULT_AFTERNOON_END = '20:10'
export const DEFAULT_SHIFT_HOURS = 4 + (10 / 60) // 4.167 hours

export class Goal {
  constructor(
    day,
    morningAmount = null,
    afternoonAmount = null,
    morningActual = null,
    afternoonActual = null,
    morningBoughtBack = false,
    afternoonBoughtBack = false,
    morningCustomRate = null,
    afternoonCustomRate = null,
    morningCustomAmount = null,
    afternoonCustomAmount = null,
    morningStartTime = null,
    morningEndTime = null,
    afternoonStartTime = null,
    afternoonEndTime = null,
    morningConfirmed = false,
    afternoonConfirmed = false,
    adminConfirmed = false
  ) {
    this.day = day
    this.morningAmount = this.parseAmount(morningAmount)
    this.afternoonAmount = this.parseAmount(afternoonAmount)
    this.morningActual = this.parseAmount(morningActual)
    this.afternoonActual = this.parseAmount(afternoonActual)
    this.morningBoughtBack = morningBoughtBack || false
    this.afternoonBoughtBack = afternoonBoughtBack || false
    this.morningCustomRate = this.parseAmount(morningCustomRate)
    this.afternoonCustomRate = this.parseAmount(afternoonCustomRate)
    this.morningCustomAmount = this.parseAmount(morningCustomAmount)
    this.afternoonCustomAmount = this.parseAmount(afternoonCustomAmount)
    this.morningStartTime = morningStartTime || DEFAULT_MORNING_START
    this.morningEndTime = morningEndTime || DEFAULT_MORNING_END
    this.afternoonStartTime = afternoonStartTime || DEFAULT_AFTERNOON_START
    this.afternoonEndTime = afternoonEndTime || DEFAULT_AFTERNOON_END
    this.morningConfirmed = !!morningConfirmed
    this.afternoonConfirmed = !!afternoonConfirmed
    this.adminConfirmed = !!adminConfirmed
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

  get morningWage() {
    return Goal.calculateWage(this.morningAmount, this.morningActual)
  }

  get afternoonWage() {
    return Goal.calculateWage(this.afternoonAmount, this.afternoonActual)
  }

  hasGoals() {
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
      adminConfirmed: this.adminConfirmed
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

    return new Goal(
      data.day,
      data.morningAmount,
      data.afternoonAmount,
      data.morningActual,
      data.afternoonActual,
      data.morningBoughtBack,
      data.afternoonBoughtBack,
      data.morningCustomRate,
      data.afternoonCustomRate,
      data.morningCustomAmount,
      data.afternoonCustomAmount,
      data.morningStartTime,
      data.morningEndTime,
      data.afternoonStartTime,
      data.afternoonEndTime,
      morningConfirmed,
      afternoonConfirmed,
      data.adminConfirmed || false
    )
  }
}
