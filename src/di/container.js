import { LocalStorageGoalRepository } from '../infrastructure/repositories/LocalStorageGoalRepository'
import { GoalService } from '../application/services/GoalService'

const goalRepository = new LocalStorageGoalRepository()
const goalService = new GoalService(goalRepository)

export { goalService }
