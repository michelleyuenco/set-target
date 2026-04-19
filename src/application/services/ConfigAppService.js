export class ConfigAppService {
  constructor(configPort) {
    this.configPort = configPort
  }

  getAppSettings() {
    return this.configPort.getAppSettings()
  }

  setWorkingMonth(year, month, adminUid) {
    return this.configPort.setWorkingMonth(year, month, adminUid)
  }
}
