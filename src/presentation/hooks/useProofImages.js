import { useState, useCallback } from 'react'
import { storageAppService as storageService } from '../../di/container'

export function useProofImages(uid) {
  const [uploadingShift, setUploadingShift] = useState(null)
  const [error, setError] = useState(null)

  const uploadImages = useCallback(async (day, shift, files, existingImages = []) => {
    if (!uid) throw new Error('User not authenticated')
    setUploadingShift(shift)
    setError(null)
    try {
      const uploadPromises = Array.from(files).map((file) =>
        storageService.uploadImage(uid, day, shift, file)
      )
      const newImages = await Promise.all(uploadPromises)
      return [...existingImages, ...newImages]
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
