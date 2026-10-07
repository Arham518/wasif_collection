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
  login: () => import('./pages/Login'),
  account: () => import('./pages/Account'),
  forgotPassword: () => import('./pages/ForgotPassword'),
  resetPassword: () => import('./pages/ResetPassword'),
  adminSettings: () => import('./pages/admin/Settings'),
  adminLogin: () => import('./pages/admin/AdminLogin'),
  adminLayout: () => import('./pages/admin/AdminLayout'),
  adminStatistics: () => import('./pages/admin/Statistics'),
  adminProducts: () => import('./pages/admin/Products'),
  adminProductForm: () => import('./pages/admin/ProductForm'),
  adminCategories: () => import('./pages/admin/Categories'),
  adminOrders: () => import('./pages/admin/Orders'),
  adminCustomers: () => import('./pages/admin/Customers'),
  notFound: () => import('./pages/NotFound'),
}

export const Pages = {
  Collection: lazy(loaders.collection),
  Brand: lazy(loaders.brand),
  Product: lazy(loaders.product),
  Cart: lazy(loaders.cart),
  Checkout: lazy(loaders.checkout),
  Wishlist: lazy(loaders.wishlist),
  Login: lazy(loaders.login),
  Account: lazy(loaders.account),
  ForgotPassword: lazy(loaders.forgotPassword),
  ResetPassword: lazy(loaders.resetPassword),
  AdminSettings: lazy(loaders.adminSettings),
  AdminLogin: lazy(loaders.adminLogin),
  AdminLayout: lazy(loaders.adminLayout),
  AdminStatistics: lazy(loaders.adminStatistics),
  AdminProducts: lazy(loaders.adminProducts),
  AdminProductForm: lazy(loaders.adminProductForm),
  AdminCategories: lazy(loaders.adminCategories),
  AdminOrders: lazy(loaders.adminOrders),
  AdminCustomers: lazy(loaders.adminCustomers),
  NotFound: lazy(loaders.notFound),
}

const prefetched = new Set()
export function prefetch(name) {
  if (prefetched.has(name) || !loaders[name]) return
  prefetched.add(name)
  loaders[name]().catch(() => prefetched.delete(name))
}