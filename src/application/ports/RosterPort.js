export class RosterPort {
  getRoster(year, month) {
    throw new Error('Method not implemented')
  }

  subscribeToRoster(year, month, onData, onError) {
    throw new Error('Method not implemented')
  }

  saveRosterSlot(year, month, day, shift, locationName, slotData, updatedByUid) {
    throw new Error('Method not implemented')
  }

  clearRosterSlot(year, month, day, shift, locationName, updatedByUid) {
    throw new Error('Method not implemented')
  }

  applyForShift(year, month, applicationData) {
    throw new Error('Method not implemented')
  }

  getApplications(year, month) {
    throw new Error('Method not implemented')
  }

  approveApplication(year, month, applicationId, slotData, day, shift, location) {
    throw new Error('Method not implemented')
  }

  rejectApplication(year, month, applicationId) {
    throw new Error('Method not implemented')
  }

  cancelApplication(year, month, applicationId) {
    throw new Error('Method not implemented')
  }

  applyForShifts(year, month, items) {
    throw new Error('Method not implemented')
  }

  saveBulkRosterSlots(year, month, updates, updatedByUid) {
    throw new Error('Method not implemented')
  }

  cancelApplications(year, month, applicationIds) {
    throw new Error('Method not implemented')
  }
}
