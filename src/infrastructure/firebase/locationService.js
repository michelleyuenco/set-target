import { db } from './config'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'

export const locationService = {
  // Returns ALL locations (visible and hidden) sorted by order, for admin management.
  async getAll() {
    try {
      const snapshot = await getDocs(collection(db, 'locations'))
      const locations = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.name) {
          locations.push({
            id: docSnap.id,
            name: data.name,
            abbr: data.abbr || '',
            order: data.order ?? 9999,
            visible: data.visible !== false  // default true for legacy docs
          })
        }
      })
      return locations.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    } catch (err) {
      console.error('Failed to fetch locations:', err)
      return []
    }
  },

  async add(name, abbr, currentCount) {
    try {
      const docRef = await addDoc(collection(db, 'locations'), {
        name,
        abbr: abbr || '',
        order: currentCount,
        visible: true
      })
      return { id: docRef.id, name, abbr: abbr || '', order: currentCount, visible: true }
    } catch (err) {
      console.error('Failed to add location:', err)
      throw err
    }
  },

  async update(id, name, abbr) {
    try {
      await updateDoc(doc(db, 'locations', id), { name, abbr: abbr || '' })
      return { id, name, abbr: abbr || '' }
    } catch (err) {
      console.error('Failed to update location:', err)
      throw err
    }
  },

  async remove(id) {
    try {
      await deleteDoc(doc(db, 'locations', id))
    } catch (err) {
      console.error('Failed to remove location:', err)
      throw err
    }
  },

  // Batch-writes the order field for all locations in the given array.
  async updateOrder(orderedLocations) {
    try {
      const batch = writeBatch(db)
      orderedLocations.forEach((loc, index) => {
        batch.update(doc(db, 'locations', loc.id), { order: index })
      })
      await batch.commit()
    } catch (err) {
      console.error('Failed to update location order:', err)
      throw err
    }
  },

  async setVisibility(id, visible) {
    try {
      await updateDoc(doc(db, 'locations', id), { visible })
    } catch (err) {
      console.error('Failed to set location visibility:', err)
      throw err
    }
  }
}
