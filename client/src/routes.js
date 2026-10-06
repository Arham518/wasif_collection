import { lazy } from 'react'

// Route-level code splitting: each page is its own chunk, downloaded on demand.
// The loaders are exported so we can prefetch likely next pages (idle time / hover).
export const loaders = {
  collection: () => import('./pages/Collection'),
  brand: () => import('./pages/Brand'),
  product: () => import('./pages/Product'),
  cart: () => import('./pages/Cart'),
  checkout: () => import('./pages/Checkout'),
  wishlist: () => import('./pages/Wishlist'),
  admin: () => import('./pages/Admin'),
  notFound: () => import('./pages/NotFound'),
}

export const Pages = {
  Collection: lazy(loaders.collection),
  Brand: lazy(loaders.brand),
  Product: lazy(loaders.product),
  Cart: lazy(loaders.cart),
  Checkout: lazy(loaders.checkout),
  Wishlist: lazy(loaders.wishlist),
  Admin: lazy(loaders.admin),
  NotFound: lazy(loaders.notFound),
}

const prefetched = new Set()
export function prefetch(name) {
  if (prefetched.has(name) || !loaders[name]) return
  prefetched.add(name)
  loaders[name]().catch(() => prefetched.delete(name))
}
