import { storage } from './config'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { compressImage } from './imageCompression'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_INPUT_SIZE = 20 * 1024 * 1024 // 20 MB pre-compression ceiling

export const storageService = {
  async uploadImage(uid, day, shift, file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Allowed: jpg, png, heic, webp.`)
    }
    if (file.size > MAX_INPUT_SIZE) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: 20 MB.`)
    }

    const processedFile = await compressImage(file)

    if (processedFile.size > MAX_FILE_SIZE) {
      throw new Error(`File too large after compression (${(processedFile.size / 1024 / 1024).toFixed(1)} MB). Max: 5 MB.`)
    }

    const timestamp = Date.now()
    const safeName = processedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `users/${uid}/shifts/${day}/${shift}/${timestamp}_${safeName}`
    const fileRef = ref(storage, storagePath)

    await uploadBytes(fileRef, processedFile, {
      contentType: processedFile.type,
      customMetadata: { originalName: file.name }
    })

    const url = await getDownloadURL(fileRef)

    return {
      url,
      name: file.name,
      path: storagePath,
      uploadedAt: new Date().toISOString()
    }
  },

  async deleteImage(storagePath) {
    const fileRef = ref(storage, storagePath)
    await deleteObject(fileRef)
  }
}
