import { db } from './config'
import {
  doc, getDoc, setDoc, serverTimestamp, onSnapshot,
  collection, getDocs, updateDoc, deleteDoc, deleteField, writeBatch
} from 'firebase/firestore'

const rosterDocId = (year, month) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}`
}

const appsRef = (year, month) =>
  collection(db, 'rosters', rosterDocId(year, month), 'applications')

// Deterministic doc ID: one application per user per day+shift+location.
// Sanitise location name so it can be used in a Firestore doc ID.
const sanitiseLoc = (loc) => (loc || '').replace(/[\s/\\#%]/g, '_')
const appDocId = (uid, day, shift, location) =>
  `${uid}-${day}-${shift}-${sanitiseLoc(location)}`

// Expose ID helpers so callers can build optimistic application objects.
export { appDocId, sanitiseLoc }

export const rosterService = {
  async getRoster(year, month) {
    try {
      const docRef = doc(db, 'rosters', rosterDocId(year, month))
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return null
      return docSnap.data()
    } catch (err) {
      console.error('Failed to fetch roster:', err)
      return null
    }
  },

  // Real-time listener. Returns an unsubscribe function.
  subscribeToRoster(year, month, onData, onError) {
    const docRef = doc(db, 'rosters', rosterDocId(year, month))
    return onSnapshot(docRef, (snap) => {
      onData(snap.exists() ? snap.data() : null)
    }, (err) => {
      console.error('Roster subscription error:', err)
      if (onError) onError(err)
    })
  },

  // slotData = { uid, displayName, notes } or null (to clear)
  // locationName is the key — one slot per location per shift.
  async saveRosterSlot(year, month, day, shift, locationName, slotData, updatedByUid) {
    try {
      const docRef = doc(db, 'rosters', rosterDocId(year, month))
      await setDoc(docRef, {
        month: rosterDocId(year, month),
        days: {
          [day]: {
            [shift]: {
              [locationName]: slotData == null ? deleteField() : slotData
            }
          }
        },
        updatedAt: serverTimestamp(),
        updatedBy: updatedByUid
      }, { merge: true })
    } catch (err) {
      console.error('Failed to save roster slot:', err)
      throw err
    }
  },

  async clearRosterSlot(year, month, day, shift, locationName, updatedByUid) {
    return this.saveRosterSlot(year, month, day, shift, locationName, null, updatedByUid)
  },

  // --- Shift Applications ---

  // applicationData = { uid, displayName, day, shift, location, notes }
  // location is required — it determines which slot the application targets.
  async applyForShift(year, month, applicationData) {
    const { uid, displayName, day, shift, location, notes } = applicationData
    if (!location) throw new Error('Location is required')
    const appRef = doc(appsRef(year, month), appDocId(uid, day, shift, location))
    const existing = await getDoc(appRef)
    if (existing.exists() && existing.data().status === 'pending') {
      throw new Error('Already applied for this shift at this location')
    }
    await setDoc(appRef, {
      uid,
      displayName,
      day,
      shift,
      location,
      notes: notes || '',
      status: 'pending',
      appliedAt: serverTimestamp()
    })
  },

  async getApplications(year, month) {
    try {
      const snap = await getDocs(appsRef(year, month))
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (err) {
      console.error('Failed to fetch applications:', err)
      return []
    }
  },

  // Approves one application, auto-rejects all other pending apps for the same
  // day+shift+location, and atomically saves the roster slot — all in one batch.
  // Filters in memory to avoid needing a Firestore composite index.
  async approveApplication(year, month, applicationId, slotData, day, shift, location) {
    const snap = await getDocs(appsRef(year, month))
    const batch = writeBatch(db)
    snap.docs
      .filter(d => {
        const data = d.data()
        return data.day === day && data.shift === shift &&
               data.location === location && data.status === 'pending'
      })
      .forEach(d => {
        batch.update(d.ref, { status: d.id === applicationId ? 'approved' : 'rejected' })
      })
    const rosterRef = doc(db, 'rosters', rosterDocId(year, month))
    batch.set(rosterRef, {
      month: rosterDocId(year, month),
      days: { [day]: { [shift]: { [location]: slotData } } },
      updatedAt: serverTimestamp()
    }, { merge: true })
    await batch.commit()
  },

  async rejectApplication(year, month, applicationId) {
    await updateDoc(doc(appsRef(year, month), applicationId), { status: 'rejected' })
  },

  async cancelApplication(year, month, applicationId) {
    await deleteDoc(doc(appsRef(year, month), applicationId))
  },

  // Batch: apply for multiple shifts in one write (avoids N sequential round-trips).
  // items = [{ uid, displayName, day, shift, location, notes }]
  async applyForShifts(year, month, items) {
    if (!items.length) return
    const batch = writeBatch(db)
    for (const { uid, displayName, day, shift, location, notes } of items) {
      if (!location) throw new Error('Location is required')
      const appRef = doc(appsRef(year, month), appDocId(uid, day, shift, location))
      batch.set(appRef, {
        uid,
        displayName,
        day,
        shift,
        location,
        notes: notes || '',
        status: 'pending',
        appliedAt: serverTimestamp()
      })
    }
    await batch.commit()
  },

  // Batch: assign multiple day/shift/location slots in one Firestore write.
  // updates = [{ day, shift, locationName, slotData }]
  // slotData = null means "clear this slot" (uses deleteField()).
  async saveBulkRosterSlots(year, month, updates, updatedByUid) {
    if (!updates.length) return
    const days = {}
    for (const { day, shift, locationName, slotData } of updates) {
      if (!days[day]) days[day] = {}
      if (!days[day][shift]) days[day][shift] = {}
      days[day][shift][locationName] = slotData == null ? deleteField() : slotData
    }
    const docRef = doc(db, 'rosters', rosterDocId(year, month))
    await setDoc(docRef, {
      month: rosterDocId(year, month),
      days,
      updatedAt: serverTimestamp(),
      updatedBy: updatedByUid
    }, { merge: true })
  },

  // Batch: cancel multiple applications in one write.
  async cancelApplications(year, month, applicationIds) {
    if (!applicationIds.length) return
    const batch = writeBatch(db)
    for (const id of applicationIds) {
      batch.delete(doc(appsRef(year, month), id))
    }
    await batch.commit()
  }
}
