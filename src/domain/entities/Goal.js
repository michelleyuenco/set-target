export class Goal {
  constructor(day, morningAmount = null, afternoonAmount = null, morningActual = null, afternoonActual = null) {
    this.day = day
    this.morningAmount = this.parseAmount(morningAmount)
    this.afternoonAmount = this.parseAmount(afternoonAmount)
    this.morningActual = this.parseAmount(morningActual)
    this.afternoonActual = this.parseAmount(afternoonActual)
  }

  parseAmount(value) {
    if (value === null || value === undefined || value === '') {
      return null
    }
    const num = Number(value)
    return isNaN(num) || num < 0 ? null : num
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
    return this.morningAmount !== null || this.afternoonAmount !== null
  }

  toJSON() {
    return {
      day: this.day,
      morningAmount: this.morningAmount,
      afternoonAmount: this.afternoonAmount,
      morningActual: this.morningActual,
      afternoonActual: this.afternoonActual
    }
  }

  static fromJSON(data) {
    return new Goal(data.day, data.morningAmount, data.afternoonAmount, data.morningActual, data.afternoonActual)
  }
}
