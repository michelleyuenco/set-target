export class Money {
  constructor(amount) {
    this.amount = amount
  }

  format() {
    if (this.amount === null || this.amount === undefined) {
      return ''
    }
    return `$${Number(this.amount).toLocaleString()}`
  }

  static of(amount) {
    return new Money(amount)
  }
}
