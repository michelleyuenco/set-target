export class Goal {
  constructor(day, morningAmount = null, afternoonAmount = null) {
    this.day = day
    this.morningAmount = this.parseAmount(morningAmount)
    this.afternoonAmount = this.parseAmount(afternoonAmount)
  }

  parseAmount(value) {
    if (value === null || value === undefined || value === '') {
      return null
    }
    const num = Number(value)
    return isNaN(num) || num < 0 ? null : num
  }

  hasGoals() {
    return this.morningAmount !== null || this.afternoonAmount !== null
  }

  toJSON() {
    return {
      day: this.day,
      morningAmount: this.morningAmount,
      afternoonAmount: this.afternoonAmount
    }
  }

  static fromJSON(data) {
    return new Goal(data.day, data.morningAmount, data.afternoonAmount)
  }
}
