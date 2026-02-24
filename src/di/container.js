import { LocalStorageGoalRepository } from '../infrastructure/repositories/LocalStorageGoalRepository'
import { CachedFirestoreGoalRepository } from '../infrastructure/repositories/CachedFirestoreGoalRepository'
import { GoalService } from '../application/services/GoalService'

// localStorage-based service (always available)
const localRepository = new LocalStorageGoalRepository()
const localGoalService = new GoalService(localRepository)

// Firestore-based service (created on login)
let firestoreRepository = null
let firestoreGoalService = null

// Admin member viewing (created when admin selects a member)
let adminMemberRepository = null
let adminMemberGoalService = null
let viewingAsMember = false

export async function initFirestoreService(uid) {
  firestoreRepository = new CachedFirestoreGoalRepository(uid)
  await firestoreRepository.initialize()
  firestoreGoalService = new GoalService(firestoreRepository)
  return firestoreGoalService
}

export function clearFirestoreService() {
  firestoreRepository = null
  firestoreGoalService = null
}

export async function initAdminMemberService(uid) {
  adminMemberRepository = new CachedFirestoreGoalRepository(uid)
  await adminMemberRepository.initialize()
  adminMemberGoalService = new GoalService(adminMemberRepository)
  viewingAsMember = true
  return adminMemberGoalService
}

export function clearAdminMemberService() {
  adminMemberRepository = null
  adminMemberGoalService = null
  viewingAsMember = false
}

export function getActiveGoalService() {
  if (viewingAsMember && adminMemberGoalService) {
    return adminMemberGoalService
  }
  return firestoreGoalService || localGoalService
}

export function getFirestoreRepository() {
  return firestoreRepository
}

export function getLocalGoalService() {
  return localGoalService
}

// Default export for backward compatibility
export const goalService = localGoalService
