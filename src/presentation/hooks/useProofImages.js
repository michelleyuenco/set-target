import { useState, useCallback } from 'react'
import { storageAppService as storageService } from '../../di/container'

// Cap parallel uploads. Compression runs on the main thread (canvas), so too many
// in flight at once thrashes CPU and Firebase ends up serializing them anyway.
const UPLOAD_CONCURRENCY = 3

async function mapWithConcurrency(items, fn, concurrency) {
  const results = new Array(items.length)
  let cursor = 0
  const workerCount = Math.min(concurrency, items.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

export function useProofImages(uid) {
  const [uploadingShift, setUploadingShift] = useState(null)
  const [error, setError] = useState(null)

  // Returns the newly uploaded images in the same order as `files`. Caller
  // is responsible for merging them with any existing images.
  const uploadImages = useCallback(async (day, shift, files) => {
    if (!uid) throw new Error('User not authenticated')
    setUploadingShift(shift)
    setError(null)
    try {
      return await mapWithConcurrency(
        Array.from(files),
        (file) => storageService.uploadImage(uid, day, shift, file),
        UPLOAD_CONCURRENCY
      )
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploadingShift(null)
    }
  }, [uid])

  const deleteImage = useCallback(async (image, existingImages) => {
    setError(null)
    try {
      await storageService.deleteImage(image.path)
      return existingImages.filter((img) => img.path !== image.path)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return { uploadingShift, error, uploadImages, deleteImage }
}
