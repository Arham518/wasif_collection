import { create } from 'zustand'
import {
  addItem, removeItem, updateQty, mergeItems, normalizeItems, reconcileItems, countItems, subtotalOf,
} from '../lib/cartLogic'
import { keyFor, readJSON, writeJSON, removeKey, initialOwner, unwrap } from '../lib/userStorage'

const BASE = 'pkf-cart'

function load(owner) {
  return normalizeItems(unwrap(readJSON(keyFor(BASE, owner), null), 'items') || [])
}

const startOwner = initialOwner()

export const useCart = create((set, get) => {
  // Every change goes through here: immutable update + save under the current owner's key.
  const commit = (items) => {
    if (items === get().items) return
    set({ items })
    writeJSON(keyFor(BASE, get().owner), { items })
  }
  return {
    owner: startOwner,
    items: load(startOwner),
    add: (product, opts) => commit(addItem(get().items, product, opts)),
    remove: (productId, size) => commit(removeItem(get().items, productId, size)),
    setQty: (productId, size, qty) => commit(updateQty(get().items, productId, size, qty)),
    clear: () => commit([]),
    reconcile: (getProduct) => commit(reconcileItems(get().items, getProduct)),
    count: () => countItems(get().items),
    subtotal: () => subtotalOf(get().items),

    /** Switch carts on login / logout / account switch. The guest cart is merged into the user's cart. */
    setOwner: (owner) => {
      owner = owner || null
      if (owner === get().owner) return
      if (owner) {
        const guest = load(null)
        const merged = mergeItems(load(owner), guest)
        removeKey(keyFor(BASE, null))
        set({ owner, items: merged })
        writeJSON(keyFor(BASE, owner), { items: merged })
      } else {
        set({ owner: null, items: load(null) })
      }
    },

    /** Another tab changed this cart. */
    reloadFromStorage: () => set({ items: load(get().owner) }),
  }
})

export const useCartCount = () => useCart((s) => countItems(s.items))
export const useCartSubtotal = () => useCart((s) => subtotalOf(s.items))

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === keyFor(BASE, useCart.getState().owner)) useCart.getState().reloadFromStorage()
  })
}