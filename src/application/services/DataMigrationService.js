export class DataMigrationService {
  /**
   * Migrate localStorage goals to Firestore repository.
   * @param {LocalStorageGoalRepository} localRepo
   * @param {CachedFirestoreGoalRepository} firestoreRepo
   */
  static async syncLocalToFirestore(localRepo, firestoreRepo) {
    const rawData = localRepo.getRawData()
    if (Object.keys(rawData).length === 0) return 0

    await firestoreRepo.batchWriteGoals(rawData)
    return Object.keys(rawData).length
  }

  /**
   * Import goals from an exported JSON file into Firestore repository.
   * @param {File} file - The JSON file to import
   * @param {CachedFirestoreGoalRepository} firestoreRepo
   */
  static async importFileToFirestore(file, firestoreRepo) {
    const text = await file.text()
    const data = JSON.parse(text)

    // Support both wrapped export format and raw goals object
    const goals = data.goals || data
    if (typeof goals !== 'object' || Array.isArray(goals)) {
      throw new Error('Invalid file format')
    }

    await firestoreRepo.batchWriteGoals(goals)
    return Object.keys(goals).length
  }
}
