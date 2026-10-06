import { getCachedImageUrl, getImageUrl, isIdbRef } from '../services/imageStore'
import { mediaUrl } from './utils'

// Module-level set of image URLs that have finished loading at least once in
// this session. LazyImage checks it on mount so a picture that was already
// shown appears instantly (no skeleton, no fade) when a page is revisited.
const loaded = new Set()
const pending = new Map()

export const isImageLoaded = (src) => !!src && loaded.has(src)

export function markImageLoaded(src) {
  if (src) loaded.add(src)
}

/** Warm the browser cache for an image (deduplicated). */
export function preloadImage(src) {
  if (!src || loaded.has(src)) return Promise.resolve(src)
  if (pending.has(src)) return pending.get(src)
  const p = new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => { loaded.add(src); pending.delete(src); resolve(src) }
    img.onerror = () => { pending.delete(src); resolve(null) }
    img.src = src
  })
  pending.set(src, p)
  return p
}

/** Synchronously resolve a media reference, or null if it needs an async IndexedDB read. */
export function resolveMediaSync(src) {
  if (!isIdbRef(src)) return src
  return getCachedImageUrl(src)
}

export const resolveMedia = (src) => getImageUrl(src)

/** Resolve (IndexedDB uploads included) and preload a product photo. */
export function warmMedia(src) {
  const url = mediaUrl(src)
  return isIdbRef(url) ? getImageUrl(url).then((u) => (u ? preloadImage(u) : null)) : preloadImage(url)
}
