/**
 * Standardise an uploaded photo: max 1200px on the long side, re-encoded as WebP
 * (JPEG when the browser can't encode WebP). Display uses 3:4 object-cover boxes.
 */
export async function compressImage(file, { maxSize = 1200, quality = 0.82 } = {}) {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const encode = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))
    let blob = await encode('image/webp')
    if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg')
    return blob || file
  } catch {
    return file
  }
}