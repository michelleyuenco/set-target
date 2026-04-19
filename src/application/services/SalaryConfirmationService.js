export class SalaryConfirmationService {
  constructor(salaryConfirmationPort) {
    this.salaryConfirmationPort = salaryConfirmationPort
  }

  getConfirmation(monthKey, uid) {
    return this.salaryConfirmationPort.getConfirmation(monthKey, uid)
  }

  getAllConfirmations(monthKey) {
    return this.salaryConfirmationPort.getAllConfirmations(monthKey)
  }

  publishSalary(monthKey, uid, adminUid, data) {
    return this.salaryConfirmationPort.publishSalary(monthKey, uid, adminUid, data)
  }

  confirmSalary(monthKey, uid) {
    return this.salaryConfirmationPort.confirmSalary(monthKey, uid)
  }
}
