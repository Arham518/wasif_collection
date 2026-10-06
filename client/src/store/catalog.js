import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import { SEED_PRODUCTS, BRANDS, CATEGORIES, COLORS } from '../data/catalog'
import { catalogService } from '../services/catalogService'

export { saveImageBlob, getImageUrl } from '../services/imageStore'

// localStorage wrapper that never crashes the app when the ~5 MB quota is full.
const safeStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => {
    try { localStorage.setItem(k, v) } catch (err) {
      console.warn('Could not save catalogue to localStorage', err)
      toast.error('Storage full — remove some owner products or photos.')
    }
  },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

/** Filter + sort products. Served from the cached ProductIndex when possible. */
export function filterProducts(list, f = {}) {
  return catalogService.filter(list, f)
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
      all: () => catalogService.index(get().ownerProducts, get().deletedIds).list,
      getById: (id) => catalogService.index(get().ownerProducts, get().deletedIds).get(id),
      meta: () => catalogService.index(get().ownerProducts, get().deletedIds).meta(),
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
    { name: 'pkf-catalog-v1', storage: createJSONStorage(() => safeStorage), partialize: (s) => ({ ownerProducts: s.ownerProducts, deletedIds: s.deletedIds, orders: s.orders }) },
  ),
)

export { BRANDS, CATEGORIES, COLORS, SEED_PRODUCTS }


/** Shared, cached product index (rebuilt only when owner data changes). */
export function useCatalogIndex() {
  const ownerProducts = useCatalog((s) => s.ownerProducts)
  const deletedIds = useCatalog((s) => s.deletedIds)
  return catalogService.index(ownerProducts, deletedIds)
}

export function useProducts() {
  return useCatalogIndex().list
}

/** O(1) lookup by id or slug. */
export function useProduct(idOrSlug) {
  return useCatalogIndex().get(idOrSlug)
}

export function useMeta() {
  return useCatalogIndex().meta()
}

/** Memoised filtered + sorted list. */
export function useFilteredProducts(filters) {
  const index = useCatalogIndex()
  return useMemo(() => index.query(filters), [index, filters])
}
