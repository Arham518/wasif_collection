import { create } from 'zustand'
import { keyFor, readJSON, writeJSON, removeKey, initialOwner, unwrap } from '../lib/userStorage'

const BASE = 'pkf-wish'

function load(owner) {
  const ids = unwrap(readJSON(keyFor(BASE, owner), null), 'ids') || []
  return [...new Set(ids.map(String))]
}

const startOwner = initialOwner()

export const useWishlist = create((set, get) => ({
  owner: startOwner,
  ids: load(startOwner),
  toggle: (id) => {
    const ids = get().ids.includes(id) ? get().ids.filter((x) => x !== id) : [...get().ids, id]
    set({ ids })
    writeJSON(keyFor(BASE, get().owner), { ids })
  },
  has: (id) => get().ids.includes(id),
  /** Per-user wishlist; the guest list is merged in on login. */
  setOwner: (owner) => {
    owner = owner || null
    if (owner === get().owner) return
    if (owner) {
      const ids = [...new Set([...load(owner), ...load(null)])]
      removeKey(keyFor(BASE, null))
      set({ owner, ids })
      writeJSON(keyFor(BASE, owner), { ids })
    } else {
      set({ owner: null, ids: load(null) })
    }
  },
}))