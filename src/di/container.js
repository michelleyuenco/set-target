import { LocalStorageGoalRepository } from '../infrastructure/repositories/LocalStorageGoalRepository'
import { CachedFirestoreGoalRepository } from '../infrastructure/repositories/CachedFirestoreGoalRepository'
import { GoalService } from '../application/services/GoalService'
import { AuthService } from '../application/services/AuthService'
import { MemberService } from '../application/services/MemberService'
import { RosterService } from '../application/services/RosterService'
import { TeamBonusService } from '../application/services/TeamBonusService'
import { LocationService } from '../application/services/LocationService'
import { StorageService } from '../application/services/StorageService'
import { MemberEarningsAppService } from '../application/services/MemberEarningsAppService'
import { SalaryConfirmationService } from '../application/services/SalaryConfirmationService'
import { MonthlyAdjustmentsService } from '../application/services/MonthlyAdjustmentsService'
import { ConfigAppService } from '../application/services/ConfigAppService'

// Infrastructure adapters (concrete implementations of ports)
import { authService as authAdapter } from '../infrastructure/firebase/authService'
import { adminService as adminAdapter } from '../infrastructure/firebase/adminService'
import { userProfileService as userProfileAdapter } from '../infrastructure/firebase/userProfileService'
import { rosterService as rosterAdapter } from '../infrastructure/firebase/rosterService'
import { teamBonusService as teamBonusAdapter } from '../infrastructure/firebase/teamBonusService'
import { locationService as locationAdapter } from '../infrastructure/firebase/locationService'
import { storageService as storageAdapter } from '../infrastructure/firebase/storageService'
import { memberEarningsService as memberEarningsAdapter } from '../infrastructure/firebase/memberEarningsService'
import { salaryConfirmationService as salaryConfirmationAdapter } from '../infrastructure/firebase/salaryConfirmationService'
import { monthlyAdjustmentsService as monthlyAdjustmentsAdapter } from '../infrastructure/firebase/monthlyAdjustmentsService'
import { configService as configAdapter } from '../infrastructure/firebase/configService'

// Re-export ID helpers from roster adapter for use in presentation
export { appDocId } from '../infrastructure/firebase/rosterService'

// --- Goal services (existing pattern) ---

const localRepository = new LocalStorageGoalRepository()
const localGoalService = new GoalService(localRepository)

let firestoreRepository = null
let firestoreGoalService = null

let adminMemberRepository = null
let adminMemberGoalService = null
let viewingAsMember = false

export async function initFirestoreService(uid) {
  firestoreRepository = new CachedFirestoreGoalRepository(uid)
  await firestoreRepository.initialize()
  firestoreGoalService = new GoalService(firestoreRepository)
  return firestoreGoalService
}

export function subscribeFirestoreGoals(onChange) {
  if (firestoreRepository) {
    firestoreRepository.subscribe(onChange)
  }
}

export function clearFirestoreService() {
  if (firestoreRepository) {
    firestoreRepository.unsubscribe()
  }
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

export function subscribeAdminMemberGoals(onChange) {
  if (adminMemberRepository) {
    adminMemberRepository.subscribe(onChange)
  }
}

export function clearAdminMemberService() {
  if (adminMemberRepository) {
    adminMemberRepository.unsubscribe()
  }
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

// --- Application services (wired with infrastructure adapters) ---

export const authAppService = new AuthService(authAdapter, adminAdapter, userProfileAdapter)
export const memberService = new MemberService(userProfileAdapter, adminAdapter)
export const rosterAppService = new RosterService(rosterAdapter)
export const teamBonusAppService = new TeamBonusService(teamBonusAdapter)
export const locationAppService = new LocationService(locationAdapter)
export const storageAppService = new StorageService(storageAdapter)
export const memberEarningsAppService = new MemberEarningsAppService(memberEarningsAdapter)
export const salaryConfirmationAppService = new SalaryConfirmationService(salaryConfirmationAdapter)
export const monthlyAdjustmentsAppService = new MonthlyAdjustmentsService(monthlyAdjustmentsAdapter)
export const configAppService = new ConfigAppService(configAdapter)
