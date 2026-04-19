export class RosterService {
  constructor(rosterPort) {
    this.rosterPort = rosterPort
  }

  getRoster(year, month) {
    return this.rosterPort.getRoster(year, month)
  }

  subscribeToRoster(year, month, onData, onError) {
    return this.rosterPort.subscribeToRoster(year, month, onData, onError)
  }

  saveRosterSlot(year, month, day, shift, locationName, slotData, updatedByUid) {
    return this.rosterPort.saveRosterSlot(year, month, day, shift, locationName, slotData, updatedByUid)
  }

  clearRosterSlot(year, month, day, shift, locationName, updatedByUid) {
    return this.rosterPort.clearRosterSlot(year, month, day, shift, locationName, updatedByUid)
  }

  applyForShift(year, month, applicationData) {
    return this.rosterPort.applyForShift(year, month, applicationData)
  }

  getApplications(year, month) {
    return this.rosterPort.getApplications(year, month)
  }

  approveApplication(year, month, applicationId, slotData, day, shift, location) {
    return this.rosterPort.approveApplication(year, month, applicationId, slotData, day, shift, location)
  }

  rejectApplication(year, month, applicationId) {
    return this.rosterPort.rejectApplication(year, month, applicationId)
  }

  cancelApplication(year, month, applicationId) {
    return this.rosterPort.cancelApplication(year, month, applicationId)
  }

  applyForShifts(year, month, items) {
    return this.rosterPort.applyForShifts(year, month, items)
  }

  saveBulkRosterSlots(year, month, updates, updatedByUid) {
    return this.rosterPort.saveBulkRosterSlots(year, month, updates, updatedByUid)
  }

  cancelApplications(year, month, applicationIds) {
    return this.rosterPort.cancelApplications(year, month, applicationIds)
  }
}
