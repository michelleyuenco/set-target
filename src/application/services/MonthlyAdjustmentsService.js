export class MonthlyAdjustmentsService {
  constructor(monthlyAdjustmentsPort) {
    this.monthlyAdjustmentsPort = monthlyAdjustmentsPort
  }

  getAdjustments(monthKey) {
    return this.monthlyAdjustmentsPort.getAdjustments(monthKey)
  }

  getUserAdjustments(monthKey, uid) {
    return this.monthlyAdjustmentsPort.getUserAdjustments(monthKey, uid)
  }

  saveUserAdjustments(monthKey, uid, items, adminUid) {
    return this.monthlyAdjustmentsPort.saveUserAdjustments(monthKey, uid, items, adminUid)
  }
}
