const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.8
const COMPRESS_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SKIP_BELOW = 500 * 1024 // 500KB

/**
 * Compress and resize an image file using the browser Canvas API.
 * Returns a compressed File (JPEG) if beneficial, or the original file otherwise.
 */
export async function compressImage(file) {
  if (!COMPRESS_TYPES.includes(file.type)) {
    return file
  }

  if (file.size <= SKIP_BELOW) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }

          const compressedName = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], compressedName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }))
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}
