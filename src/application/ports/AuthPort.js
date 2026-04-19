export class AuthPort {
  signUpWithEmail(email, password) {
    throw new Error('Method not implemented')
  }

  signInWithEmail(email, password) {
    throw new Error('Method not implemented')
  }

  signInWithGoogle() {
    throw new Error('Method not implemented')
  }

  signOut() {
    throw new Error('Method not implemented')
  }

  onAuthStateChanged(callback) {
    throw new Error('Method not implemented')
  }

  changeEmail(currentPassword, newEmail) {
    throw new Error('Method not implemented')
  }

  changePassword(currentPassword, newPassword) {
    throw new Error('Method not implemented')
  }

  setPassword(newPassword) {
    throw new Error('Method not implemented')
  }

  adminResetPassword(uid, newPassword) {
    throw new Error('Method not implemented')
  }
}
