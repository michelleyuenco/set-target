export class GetGoals {
  constructor(goalRepository) {
    this.goalRepository = goalRepository
  }

  execute() {
    return this.goalRepository.getAll()
  }
}
