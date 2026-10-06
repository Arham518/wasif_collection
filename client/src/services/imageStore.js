// Owner-uploaded photos are stored as Blobs in IndexedDB and referenced from
// product JSON as "idb:<key>". This keeps localStorage small (it has a ~5 MB cap).

const DB_NAME = 'pk_fashion_store'
const STORE = 'images'
let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not available'))
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  dbPromise.catch(() => { dbPromise = null })
  return dbPromise
}

export async function saveImageBlob(id, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

// In-memory cache: "idb:key" -> object URL (or pending Promise). Each blob is
// read from IndexedDB once per session and the same object URL is reused.
const urlCache = new Map()

export const isIdbRef = (src) => typeof src === 'string' && src.startsWith('idb:')

export function getCachedImageUrl(src) {
  const v = urlCache.get(src)
  return typeof v === 'string' ? v : null
}

export function getImageUrl(src) {
  if (!isIdbRef(src)) return Promise.resolve(src)
  const hit = urlCache.get(src)
  if (hit) return typeof hit === 'string' ? Promise.resolve(hit) : hit
  const key = src.slice(4)
  const p = openDB()
    .then((db) => new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ? URL.createObjectURL(req.result) : null)
      req.onerror = () => reject(req.error)
    }))
    .then((url) => {
      if (url) urlCache.set(src, url)
      else urlCache.delete(src)
      return url
    })
    .catch(() => { urlCache.delete(src); return null })
  urlCache.set(src, p)
  return p
}

/** Downscale + re-encode an uploaded photo so it stays light (max 1200px, WebP). */
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
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
