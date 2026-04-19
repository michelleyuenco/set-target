export class MemberService {
  constructor(userProfilePort, adminPort) {
    this.userProfilePort = userProfilePort
    this.adminPort = adminPort
  }

  async getAllMembers() {
    const [profiles, adminEmails] = await Promise.all([
      this.userProfilePort.getAllProfiles(),
      this.adminPort.getAdminEmails()
    ])
    return profiles.map((p) => ({
      ...p,
      isAdmin: adminEmails.includes(p.email)
    }))
  }

  updateDisplayName(uid, newDisplayName) {
    return this.userProfilePort.updateDisplayName(uid, newDisplayName)
  }

  setDisabled(uid, disabled) {
    return this.userProfilePort.setDisabled(uid, disabled)
  }

  updateColor(uid, colorIndex) {
    return this.userProfilePort.updateColor(uid, colorIndex)
  }

  updateEmail(uid, newEmail) {
    return this.userProfilePort.updateEmail(uid, newEmail)
  }
}
