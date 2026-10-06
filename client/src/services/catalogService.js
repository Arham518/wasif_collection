// Catalogue data-access layer.
//
// There is no backend: products come from the bundled seed catalogue plus
// owner edits stored in localStorage. This module is the single place that
// turns that raw data into something fast to query, and caches the result so
// every page/component shares the same work instead of rebuilding it:
//   - ProductIndex: O(1) Map lookups by id / slug, pre-bucketed by
//     gender / brand / category / color, pre-computed lowercase search text,
//     cached meta (brand / category / color lists) and a small LRU cache of
//     filter results.
//   - CatalogService: builds a ProductIndex once per data change (memoised on
//     the owner-product / deleted-id references) and hands out the cached one.

import { SEED_PRODUCTS } from '../data/catalog'

export const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const norm = (v) => String(v ?? '').trim().toLowerCase()
const EMPTY = Object.freeze([])
const BUCKET_KEYS = ['gender', 'brand', 'category', 'color']
const QUERY_CACHE_SIZE = 60

function searchWords(q) {
  return String(q || '').toLowerCase().split(/\s+/).filter((w) => w && w.length > 1 && !/^\d+$/.test(w))
}

const SORTERS = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: (a, b) => String(b.id).localeCompare(String(a.id)),
  rating: (a, b) => (b.rating || 0) - (a.rating || 0),
}

function haystackOf(p) {
  return `${p.name} ${p.brand} ${p.category} ${p.subcategory} ${p.color} ${(p.tags || []).join(' ')} ${p.description}`.toLowerCase()
}

/** Linear filter used for arbitrary lists (and as the core of indexed queries). */
function applyFilters(list, f, haystack = haystackOf) {
  const brand = f.brand && norm(f.brand)
  const category = f.category && norm(f.category)
  const sub = f.subcategory && norm(f.subcategory)
  const color = f.color && norm(f.color)
  const min = f.minPrice != null && f.minPrice !== '' && !Number.isNaN(Number(f.minPrice)) ? Number(f.minPrice) : null
  const max = f.maxPrice != null && f.maxPrice !== '' && !Number.isNaN(Number(f.maxPrice)) ? Number(f.maxPrice) : null
  const featured = f.featured === true || f.featured === 'true'
  const words = f.q ? searchWords(f.q) : EMPTY

  const out = list.filter((p) => {
    if (f.gender && p.gender !== f.gender) return false
    if (brand && norm(p.brand) !== brand) return false
    if (category && norm(p.category) !== category) return false
    if (sub && norm(p.subcategory) !== sub) return false
    if (color && norm(p.color) !== color) return false
    if (min != null && p.price < min) return false
    if (max != null && p.price > max) return false
    if (featured && !p.featured) return false
    if (words.length) {
      const hay = haystack(p)
      for (const w of words) if (!hay.includes(w)) return false
    }
    return true
  })
  const sorter = SORTERS[f.sort]
  if (sorter) out.sort(sorter)
  return out
}

function cacheKey(f) {
  return ['gender', 'brand', 'category', 'subcategory', 'color', 'minPrice', 'maxPrice', 'featured', 'q', 'sort']
    .map((k) => (f[k] == null ? '' : String(f[k]).trim().toLowerCase()))
    .join('|')
}

export class ProductIndex {
  constructor(products) {
    this.list = Object.freeze(products)
    this.byId = new Map()
    this.bySlug = new Map()
    this.buckets = Object.fromEntries(BUCKET_KEYS.map((k) => [k, new Map()]))
    this.hay = new Map()
    this.queryCache = new Map()
    this.metaCache = null

    for (const p of products) {
      this.byId.set(p.id, p)
      this.bySlug.set(p.slug || slugify(p.name), p)
      this.hay.set(p.id, haystackOf(p))
      for (const k of BUCKET_KEYS) {
        const key = k === 'gender' ? p.gender : norm(p[k])
        if (!key) continue
        const bucket = this.buckets[k].get(key)
        if (bucket) bucket.push(p)
        else this.buckets[k].set(key, [p])
      }
    }
  }

  get size() { return this.list.length }

  /** O(1) lookup by product id or slug. */
  get(idOrSlug) {
    if (!idOrSlug) return undefined
    return this.byId.get(idOrSlug) ?? this.bySlug.get(String(idOrSlug).toLowerCase())
  }

  /** Brand / category / color lists and counts — computed once per index. */
  meta() {
    if (this.metaCache) return this.metaCache
    const sorted = (k) => [...this.buckets[k].values()].map((b) => b[0][k]).sort()
    this.metaCache = Object.freeze({
      brands: sorted('brand'),
      categories: sorted('category'),
      colors: sorted('color'),
      counts: {
        total: this.list.length,
        women: this.buckets.gender.get('women')?.length || 0,
        men: this.buckets.gender.get('men')?.length || 0,
      },
    })
    return this.metaCache
  }

  /** Filter + sort with memoised results. Starts from the smallest matching bucket. */
  query(f = {}) {
    const key = cacheKey(f)
    const hit = this.queryCache.get(key)
    if (hit) {
      this.queryCache.delete(key)
      this.queryCache.set(key, hit)
      return hit
    }
    let base = this.list
    for (const k of BUCKET_KEYS) {
      if (!f[k]) continue
      const bucket = this.buckets[k].get(k === 'gender' ? f[k] : norm(f[k])) || EMPTY
      if (bucket.length < base.length) base = bucket
    }
    const result = Object.freeze(applyFilters(base, f, (p) => this.hay.get(p.id) ?? haystackOf(p)))
    this.queryCache.set(key, result)
    if (this.queryCache.size > QUERY_CACHE_SIZE) this.queryCache.delete(this.queryCache.keys().next().value)
    return result
  }
}

export class CatalogService {
  #seed
  #ownerRef = null
  #deletedRef = null
  #index = null

  constructor(seed) {
    this.#seed = seed
  }

  /** Cached index for the given owner data; rebuilt only when that data changes. */
  index(ownerProducts = EMPTY, deletedIds = EMPTY) {
    if (this.#index && ownerProducts === this.#ownerRef && deletedIds === this.#deletedRef) return this.#index
    const deleted = new Set(deletedIds)
    const map = new Map()
    for (const p of this.#seed) if (!deleted.has(p.id)) map.set(p.id, p)
    for (const p of ownerProducts) map.set(p.id, p)
    this.#ownerRef = ownerProducts
    this.#deletedRef = deletedIds
    this.#index = new ProductIndex([...map.values()])
    return this.#index
  }

  /** Last built index (or the seed-only one). */
  current() {
    return this.#index || this.index()
  }

  /** Filter any list. Uses the cached index when given the current product list. */
  filter(list, f = {}) {
    const idx = this.#index
    if (idx && list === idx.list) return idx.query(f)
    return applyFilters(list, f)
  }
}

export const catalogService = new CatalogService(SEED_PRODUCTS)
