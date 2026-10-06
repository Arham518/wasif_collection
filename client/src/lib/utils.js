import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPKR(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-PK')}`
}

export function mediaUrl(path) {
  if (!path) return '/products/w01.jpg'
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('/')) return path
  return path
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}
