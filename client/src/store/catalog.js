import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_PRODUCTS, BRANDS, CATEGORIES, COLORS } from '../data/catalog'

const OWNER_KEY_IMAGES = 'pkf-owner-blobs' // IndexedDB-ish via idb-keyval pattern using localStorage base64 for simplicity; large images go to IDB

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pk_fashion_store', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveImageBlob(id, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite')
    tx.objectStore('images').put(blob, id)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getImageUrl(id) {
  if (!id || !String(id).startsWith('idb:')) return id
  const key = String(id).slice(4)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readonly')
    const req = tx.objectStore('images').get(key)
    req.onsuccess = () => {
      if (!req.result) return resolve(null)
      resolve(URL.createObjectURL(req.result))
    }
    req.onerror = () => reject(req.error)
  })
}

export function filterProducts(list, f = {}) {
  let out = [...list]
  if (f.gender) out = out.filter((p) => p.gender === f.gender)
  if (f.brand) out = out.filter((p) => p.brand.toLowerCase() === String(f.brand).toLowerCase())
  if (f.category) out = out.filter((p) => p.category.toLowerCase() === String(f.category).toLowerCase())
  if (f.subcategory) out = out.filter((p) => (p.subcategory || '').toLowerCase() === String(f.subcategory).toLowerCase())
  if (f.color) out = out.filter((p) => (p.color || '').toLowerCase() === String(f.color).toLowerCase())
  if (f.minPrice != null && f.minPrice !== '' && !Number.isNaN(Number(f.minPrice))) out = out.filter((p) => p.price >= Number(f.minPrice))
  if (f.maxPrice != null && f.maxPrice !== '' && !Number.isNaN(Number(f.maxPrice))) out = out.filter((p) => p.price <= Number(f.maxPrice))
  if (f.featured === true || f.featured === 'true') out = out.filter((p) => p.featured)
  if (f.q) {
    const words = String(f.q).toLowerCase().split(/\s+/).filter((w) => w && w.length > 1 && !/^\d+$/.test(w))
    if (words.length) {
      out = out.filter((p) => {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.subcategory} ${p.color} ${(p.tags || []).join(' ')} ${p.description}`.toLowerCase()
        return words.every((w) => hay.includes(w))
      })
    }
  }
  if (f.sort === 'price-asc') out.sort((a, b) => a.price - b.price)
  else if (f.sort === 'price-desc') out.sort((a, b) => b.price - a.price)
  else if (f.sort === 'newest') out.sort((a, b) => String(b.id).localeCompare(String(a.id)))
  else if (f.sort === 'rating') out.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  return out
}

export function runAssistant(message, products) {
  const lower = String(message || '').toLowerCase().trim()
  if (!lower) return { reply: 'Kuch poochhein — e.g. women lawn under 5000 Khaadi', products: [], filters: {} }
  const f = {}
  if (/\bwom[ae]n|ladies|girl|aurat|khawateen\b/.test(lower)) f.gender = 'women'
  if (/\bmen|gents|mard|boys?\b/.test(lower)) f.gender = 'men'
  for (const b of ['khaadi', 'gul ahmed', 'bonanza', 'satrangi', 'sana safinaz', 'sapphire', 'alkaram', 'j.']) {
    if (lower.includes(b.replace('.', ''))) {
      if (b === 'j.') f.brand = 'J.'
      else if (b === 'bonanza' || b === 'satrangi') f.brand = 'Bonanza Satrangi'
      else if (b === 'gul ahmed') f.brand = 'Gul Ahmed'
      else if (b === 'sana safinaz') f.brand = 'Sana Safinaz'
      else f.brand = b.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
    }
  }
  if (/lawn/.test(lower)) f.category = 'Lawn'
  if (/kurta|shalwar|ethnic/.test(lower)) { if (!f.category) f.category = 'Ethnic'; if (!f.gender) f.gender = 'men' }
  if (/pret|kurti|ready/.test(lower)) f.category = f.category || 'Pret'
  if (/formal|party|wedding/.test(lower)) f.category = f.category || 'Formal'
  if (/winter|khaddar|hoodie/.test(lower)) f.category = f.category || 'Winter'
  const under = lower.match(/under\s+(\d+)|neeche\s+(\d+)|below\s+(\d+)|<\s*(\d+)/)
  if (under) f.maxPrice = Number(under[1] || under[2] || under[3] || under[4])
  const over = lower.match(/above\s+(\d+)|over\s+(\d+)/)
  if (over) f.minPrice = Number(over[1] || over[2])
  for (const c of ['ivory', 'rose', 'navy', 'emerald', 'mustard', 'black', 'maroon', 'teal', 'coral', 'olive', 'sky blue', 'lilac', 'white']) {
    if (lower.includes(c)) f.color = c.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  }
  let matched = filterProducts(products, f).slice(0, 8)
  if (!matched.length) {
    const cleaned = lower.replace(/show|find|mujhe|chahiye|please|under|above|below|women|men|ladies|gents|\d+/gi, ' ').trim()
    matched = filterProducts(products, { q: cleaned }).slice(0, 6)
  }
  if (!matched.length) {
    return { reply: 'Koi matching product nahi mila. Brand, gender, category ya max price try karein.', products: [], filters: f }
  }
  const names = matched.slice(0, 3).map((p) => `${p.name} (${p.brand}) — Rs ${p.price.toLocaleString()}`).join('; ')
  return {
    reply: `Maine ${matched.length} items dhundhe. Top: ${names}. Sample prices hain (typical market range).`,
    products: matched,
    filters: f,
  }
}

export const useCatalog = create(
  persist(
    (set, get) => ({
      ownerProducts: [], // added/edited by owner (overrides seed by id)
      deletedIds: [],
      orders: [],
      all: () => {
        const { ownerProducts, deletedIds } = get()
        const map = new Map()
        for (const p of SEED_PRODUCTS) {
          if (!deletedIds.includes(p.id)) map.set(p.id, p)
        }
        for (const p of ownerProducts) map.set(p.id, p)
        return [...map.values()]
      },
      getById: (id) => get().all().find((p) => p.id === id),
      meta: () => {
        const products = get().all()
        return {
          brands: [...new Set(products.map((p) => p.brand))].sort(),
          categories: [...new Set(products.map((p) => p.category))].sort(),
          colors: [...new Set(products.map((p) => p.color).filter(Boolean))].sort(),
          counts: {
            total: products.length,
            women: products.filter((p) => p.gender === 'women').length,
            men: products.filter((p) => p.gender === 'men').length,
          },
        }
      },
      upsertProduct: (product) => {
        const ownerProducts = [...get().ownerProducts]
        const i = ownerProducts.findIndex((p) => p.id === product.id)
        if (i >= 0) ownerProducts[i] = product
        else ownerProducts.unshift(product)
        set({ ownerProducts, deletedIds: get().deletedIds.filter((id) => id !== product.id) })
      },
      removeProduct: (id) => {
        set({
          ownerProducts: get().ownerProducts.filter((p) => p.id !== id),
          deletedIds: [...new Set([...get().deletedIds, id])],
        })
      },
      addOrder: (order) => set({ orders: [order, ...get().orders] }),
    }),
    { name: 'pkf-catalog-v1', partialize: (s) => ({ ownerProducts: s.ownerProducts, deletedIds: s.deletedIds, orders: s.orders }) },
  ),
)

export { BRANDS, CATEGORIES, COLORS, SEED_PRODUCTS }


export function useProducts() {
  const ownerProducts = useCatalog((s) => s.ownerProducts)
  const deletedIds = useCatalog((s) => s.deletedIds)
  return useMemo(() => {
    const map = new Map()
    for (const p of SEED_PRODUCTS) {
      if (!deletedIds.includes(p.id)) map.set(p.id, p)
    }
    for (const p of ownerProducts) map.set(p.id, p)
    return [...map.values()]
  }, [ownerProducts, deletedIds])
}

export function useProduct(id) {
  const products = useProducts()
  return useMemo(() => products.find((p) => p.id === id), [products, id])
}

export function useMeta() {
  const products = useProducts()
  return useMemo(() => ({
    brands: [...new Set(products.map((p) => p.brand))].sort(),
    categories: [...new Set(products.map((p) => p.category))].sort(),
    colors: [...new Set(products.map((p) => p.color).filter(Boolean))].sort(),
    counts: {
      total: products.length,
      women: products.filter((p) => p.gender === 'women').length,
      men: products.filter((p) => p.gender === 'men').length,
    },
  }), [products])
}
