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
    afternoonCustomAmount = null
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
      afternoonActual: this.afternoonActual,
      morningBoughtBack: this.morningBoughtBack,
      afternoonBoughtBack: this.afternoonBoughtBack,
      morningCustomRate: this.morningCustomRate,
      afternoonCustomRate: this.afternoonCustomRate,
      morningCustomAmount: this.morningCustomAmount,
      afternoonCustomAmount: this.afternoonCustomAmount
    }
  }

  static fromJSON(data) {
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
      data.afternoonCustomAmount
    )
  }
}
