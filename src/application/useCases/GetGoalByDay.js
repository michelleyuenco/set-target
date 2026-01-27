export class GetGoalByDay {
  constructor(goalRepository) {
    this.goalRepository = goalRepository
  }

  execute(day) {
    return this.goalRepository.getByDay(day)
  }
}
