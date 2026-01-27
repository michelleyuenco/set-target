import { GoalRepository } from '../../application/ports/GoalRepository'
import { Goal } from '../../domain/entities/Goal'

const STORAGE_KEY = 'daily-goals-tracker'

export class LocalStorageGoalRepository extends GoalRepository {
  save(goal) {
    const goals = this.loadFromStorage()
    goals[goal.day] = goal.toJSON()
    this.saveToStorage(goals)
  }

  getAll() {
    const data = this.loadFromStorage()
    const goals = {}

    for (const [day, goalData] of Object.entries(data)) {
      goals[day] = Goal.fromJSON(goalData)
    }

    return goals
  }

  getByDay(day) {
    const goals = this.loadFromStorage()
    const goalData = goals[day]

    if (!goalData) {
      return null
    }

    return Goal.fromJSON(goalData)
  }

  delete(day) {
    const goals = this.loadFromStorage()
    delete goals[day]
    this.saveToStorage(goals)
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }

  saveToStorage(goals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  }
}
