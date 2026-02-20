import { LocalStorageGoalRepository } from '../infrastructure/repositories/LocalStorageGoalRepository'
import { CachedFirestoreGoalRepository } from '../infrastructure/repositories/CachedFirestoreGoalRepository'
import { GoalService } from '../application/services/GoalService'

// localStorage-based service (always available)
const localRepository = new LocalStorageGoalRepository()
const localGoalService = new GoalService(localRepository)

// Firestore-based service (created on login)
let firestoreRepository = null
let firestoreGoalService = null

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

export function getActiveGoalService() {
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
