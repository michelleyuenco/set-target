export class AuthService {
  constructor(authPort, adminPort, userProfilePort) {
    this.authPort = authPort
    this.adminPort = adminPort
    this.userProfilePort = userProfilePort
  }

  signUpWithEmail(email, password) {
    return this.authPort.signUpWithEmail(email, password)
  }

  signInWithEmail(email, password) {
    return this.authPort.signInWithEmail(email, password)
  }

  signInWithGoogle() {
    return this.authPort.signInWithGoogle()
  }

  signOut() {
    return this.authPort.signOut()
  }

  onAuthStateChanged(callback) {
    return this.authPort.onAuthStateChanged(callback)
  }

  changeEmail(currentPassword, newEmail) {
    return this.authPort.changeEmail(currentPassword, newEmail)
  }

  changePassword(currentPassword, newPassword) {
    return this.authPort.changePassword(currentPassword, newPassword)
  }

  setPassword(newPassword) {
    return this.authPort.setPassword(newPassword)
  }

  adminResetPassword(uid, newPassword) {
    return this.authPort.adminResetPassword(uid, newPassword)
  }

  checkIsAdmin(email) {
    return this.adminPort.checkIsAdmin(email)
  }

  getAdminEmails() {
    return this.adminPort.getAdminEmails()
  }

  saveProfile(user) {
    return this.userProfilePort.saveProfile(user)
  }

  getProfile(uid) {
    return this.userProfilePort.getProfile(uid)
  }
}
