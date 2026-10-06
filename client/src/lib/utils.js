import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPKR(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-PK')}`
}

export const FALLBACK_IMAGE = '/products/w01.webp'

// Bundled catalogue photos live in /public/products as <name>.jpg (original),
// <name>.webp (800px) and <name>-400.webp (400px). Old references (cart items,
// owner products saved in localStorage) still point at .jpg, so we upgrade them here.
const PRODUCT_JPG = /^\/products\/([\w-]+)\.jpg$/
const PRODUCT_WEBP = /^\/products\/([a-z]\d+)\.webp$/

export function mediaUrl(path) {
  if (!path) return FALLBACK_IMAGE
  const m = PRODUCT_JPG.exec(path)
  if (m) return `/products/${m[1]}.webp`
  return path
}

/** Responsive srcset for bundled catalogue photos (400w + 800w WebP). */
export function srcSetFor(url) {
  const m = PRODUCT_WEBP.exec(url || '')
  if (!m) return undefined
  return `/products/${m[1]}-400.webp 400w, /products/${m[1]}.webp 800w`
}

/** If a WebP fails for any reason, fall back to the original JPG. */
export function jpgFallback(url) {
  const m = PRODUCT_WEBP.exec(url || '')
  return m ? `/products/${m[1]}.jpg` : null
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}
