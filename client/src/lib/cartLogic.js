// Pure cart logic (no React, no storage): every function returns a NEW items array.
// Lines are unique per product code + size; a Map keyed by that pair gives O(1) lookups.

export const MAX_QTY = 99
export const DEFAULT_DELIVERY = Object.freeze({ flatFee: 250, freeOver: 5000 })

export const lineKey = (productId, size) => `${productId}::${size ?? ''}`

const clampQty = (n) => Math.max(0, Math.min(MAX_QTY, Math.floor(Number(n) || 0)))

function toMap(items) {
  const map = new Map()
  for (const it of items || []) {
    if (!it || it.productId == null) continue
    const qty = clampQty(it.qty)
    if (!qty) continue
    const key = lineKey(it.productId, it.size)
    const prev = map.get(key)
    map.set(key, prev ? { ...prev, qty: clampQty(prev.qty + qty) } : { ...it, qty })
  }
  return map
}

const fromMap = (map) => [...map.values()]

/** Clean up any stored list: drops invalid lines and merges duplicates. */
export const normalizeItems = (items) => fromMap(toMap(Array.isArray(items) ? items : []))

export function addItem(items, product, { size = 'M', qty = 1 } = {}) {
  if (!product || product.id == null) return items
  const map = toMap(items)
  const key = lineKey(product.id, size)
  const prev = map.get(key)
  const add = clampQty(qty) || 1
  if (prev) {
    map.set(key, { ...prev, qty: clampQty(prev.qty + add) })
  } else {
    map.set(key, {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: Number(product.price) || 0,
      image: product.images?.[0],
      size,
      color: product.color,
      qty: add,
    })
  }
  return fromMap(map)
}

export function removeItem(items, productId, size) {
  const map = toMap(items)
  map.delete(lineKey(productId, size))
  return fromMap(map)
}

export function updateQty(items, productId, size, qty) {
  const map = toMap(items)
  const key = lineKey(productId, size)
  const prev = map.get(key)
  if (!prev) return fromMap(map)
  const next = clampQty(qty)
  if (next < 1) map.delete(key)
  else map.set(key, { ...prev, qty: next })
  return fromMap(map)
}

/** Guest cart + user cart on login: same lines add up their quantities. */
export const mergeItems = (a, b) => normalizeItems([...(a || []), ...(b || [])])

/** Refresh name/price/image from the live catalogue; drop lines whose product is gone. */
export function reconcileItems(items, getProduct) {
  let changed = false
  const out = []
  for (const it of items) {
    const p = getProduct(it.productId)
    if (!p) { changed = true; continue }
    const price = Number(p.price) || 0
    const image = p.images?.[0] || it.image
    if (price !== it.price || p.name !== it.name || image !== it.image || p.brand !== it.brand) {
      changed = true
      out.push({ ...it, price, name: p.name, brand: p.brand, image })
    } else out.push(it)
  }
  return changed ? out : items
}

export const countItems = (items) => (items || []).reduce((n, x) => n + x.qty, 0)
export const subtotalOf = (items) => (items || []).reduce((s, x) => s + (Number(x.price) || 0) * x.qty, 0)

export function shippingFor(subtotal, delivery = DEFAULT_DELIVERY) {
  if (!(subtotal > 0)) return 0
  const freeOver = Number(delivery?.freeOver ?? DEFAULT_DELIVERY.freeOver)
  const flat = Number(delivery?.flatFee ?? DEFAULT_DELIVERY.flatFee)
  return freeOver > 0 && subtotal >= freeOver ? 0 : Math.max(0, flat)
}