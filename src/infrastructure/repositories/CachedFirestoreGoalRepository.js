import { GoalRepository } from '../../application/ports/GoalRepository'
import { Goal } from '../../domain/entities/Goal'
import { db } from '../firebase/config'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore'

export class CachedFirestoreGoalRepository extends GoalRepository {
  constructor(uid) {
    super()
    this.uid = uid
    this.cache = {}
    this.goalsCollection = collection(db, 'users', uid, 'goals')
    this._unsubscribe = null
    this._onChange = null
    // Track local writes to suppress echo from onSnapshot
    this._localWrites = new Set()
  }

  async initialize() {
    const snapshot = await getDocs(this.goalsCollection)
    this.cache = {}
    snapshot.forEach((docSnap) => {
      this.cache[docSnap.id] = docSnap.data()
    })
  }

  subscribe(onChange) {
    this._onChange = onChange
    this._unsubscribe = onSnapshot(this.goalsCollection, (snapshot) => {
      let changed = false
      snapshot.docChanges().forEach((change) => {
        const id = change.doc.id
        // Skip echoes from our own writes
        if (this._localWrites.has(id)) {
          this._localWrites.delete(id)
          return
        }
        if (change.type === 'removed' || change.doc.data()?._deleted) {
          if (this.cache[id]) {
            delete this.cache[id]
            changed = true
          }
        } else {
          this.cache[id] = change.doc.data()
          changed = true
        }
      })
      if (changed && this._onChange) {
        this._onChange()
      }
    })
  }

  unsubscribe() {
    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = null
    }
    this._onChange = null
  }

  save(goal) {
    const json = goal.toJSON()
    this.cache[goal.day] = json
    this._localWrites.add(goal.day)

    // Fire-and-forget write to Firestore
    const docRef = doc(this.goalsCollection, goal.day)
    setDoc(docRef, json).catch((err) => {
      console.error('Firestore write failed:', err)
    })
  }

  getAll() {
    const goals = {}
    for (const [day, goalData] of Object.entries(this.cache)) {
      goals[day] = Goal.fromJSON(goalData)
    }
    return goals
  }

  getByDay(day) {
    const goalData = this.cache[day]
    if (!goalData) return null
    return Goal.fromJSON(goalData)
  }

  delete(day) {
    delete this.cache[day]
    this._localWrites.add(day)

    const docRef = doc(this.goalsCollection, day)
    deleteDoc(docRef).catch((err) => {
      console.error('Firestore delete failed:', err)
    })
  }

  getRawData() {
    return { ...this.cache }
  }

  async batchWriteGoals(goalsMap) {
    const entries = Object.entries(goalsMap)

    // Firestore batch limit is 500 operations
    for (let i = 0; i < entries.length; i += 500) {
      const chunk = entries.slice(i, i + 500)
      const batch = writeBatch(db)

      for (const [day, goalData] of chunk) {
        const docRef = doc(this.goalsCollection, day)
        const data = goalData.day ? goalData : { ...goalData, day }
        batch.set(docRef, data)
        this.cache[day] = data
      }

      await batch.commit()
    }
  }

  hasData() {
    return Object.keys(this.cache).length > 0
  }

  async refresh() {
    await this.initialize()
  }
}
