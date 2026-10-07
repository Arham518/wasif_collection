// localStorage helpers for per-user data. Guests use the original key (e.g. "pkf-cart"),
// logged-in users get "pkf-cart:<user id>", so one person's cart/wishlist never shows for another.

export const keyFor = (base, owner) => (owner ? `${base}:${owner}` : base)

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage full or blocked */ }
}

export function removeKey(key) {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

/** User id of the saved Supabase session, read synchronously so the right cart shows on first paint. */
export function initialOwner() {
  const s = readJSON('rana-auth', null)
  return s?.user?.id || null
}

/** zustand persist used to wrap state as { state: {...}, version } - accept both shapes. */
export function unwrap(saved, field) {
  if (!saved) return null
  if (Array.isArray(saved[field])) return saved[field]
  if (saved.state && Array.isArray(saved.state[field])) return saved.state[field]
  return null
}