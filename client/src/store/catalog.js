import { useMemo } from 'react'
import { create } from 'zustand'
import { toast } from 'sonner'
import { SEED_PRODUCTS, BRANDS, CATEGORIES, COLORS } from '../data/catalog'
import { catalogService, fetchPublicProducts } from '../services/catalogService'
import { errorMessage } from '../lib/supabase'

const EMPTY = Object.freeze([])

/** Filter + sort products. Served from the cached ProductIndex when possible. */
export function filterProducts(list, f = {}) {
  return catalogService.filter(list, f)
}

export function runAssistant(message, products) {
  const lower = String(message || '').toLowerCase().trim()
  if (!lower) return { reply: 'Ask me something, e.g. women lawn under 5000 Khaadi', products: [], filters: {} }
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
    return { reply: 'No matching products found. Try a brand, gender, category or max price.', products: [], filters: f }
  }
  const names = matched.slice(0, 3).map((p) => `${p.name} (${p.brand}) \u2014 Rs ${p.price.toLocaleString()}`).join('; ')
  return {
    reply: `Found ${matched.length} items. Top: ${names}.`,
    products: matched,
    filters: f,
  }
}

// Live catalogue from Supabase (no localStorage). If Supabase can't be reached the
// bundled seed catalogue is shown read-only as an offline fallback.
let inflight = null

export const useCatalog = create((set, get) => ({
  products: EMPTY,
  status: 'idle', // idle | loading | ready
  source: null, // 'supabase' | 'fallback'
  error: null,
  load: ({ force = false } = {}) => {
    const s = get()
    if (inflight) return inflight
    if (!force && s.status === 'ready' && s.source === 'supabase') return Promise.resolve(s.products)
    if (!s.products.length) set({ status: 'loading' })
    inflight = fetchPublicProducts()
      .then((products) => {
        set({ products, status: 'ready', source: 'supabase', error: null })
        return products
      })
      .catch((err) => {
        console.warn('Could not load products from Supabase', err)
        const msg = errorMessage(err)
        if (get().source !== 'supabase') {
          set({ products: SEED_PRODUCTS, status: 'ready', source: 'fallback', error: msg })
          toast.error('Live catalogue unavailable \u2014 showing the offline catalogue.', { id: 'catalog-offline' })
        } else {
          set({ status: 'ready', error: msg })
        }
        return get().products
      })
      .finally(() => { inflight = null })
    return inflight
  },
  all: () => get().products,
  getById: (id) => catalogService.index(get().products).get(id),
  meta: () => catalogService.index(get().products).meta(),
}))

export { BRANDS, CATEGORIES, COLORS, SEED_PRODUCTS }

/** Shared, cached product index (rebuilt only when the product list changes). */
export function useCatalogIndex() {
  const products = useCatalog((s) => s.products)
  return catalogService.index(products)
}

/** true until the first catalogue load has finished. */
export function useCatalogLoading() {
  return useCatalog((s) => s.status !== 'ready')
}

export function useProducts() {
  return useCatalogIndex().list
}

/** O(1) lookup by code (p001), slug or database id. */
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