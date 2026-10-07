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

// Product photos are plain URLs now (bundled /products/... files or Supabase Storage
// public URLs), so they resolve synchronously.
export function resolveMediaSync(src) {
  return src
}

export const resolveMedia = (src) => Promise.resolve(src)

/** Preload a product photo. */
export function warmMedia(src) {
  return preloadImage(mediaUrl(src))
}