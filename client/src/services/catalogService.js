// Catalogue data-access layer.
//
// Products live in Supabase (table public.products). This module:
//   - maps database rows to the product shape the UI uses (id = `code`, e.g. p001)
//   - fetches the public (active) catalogue
//   - builds a cached ProductIndex per product list so every page/component
//     shares the same work: O(1) Map lookups by id / slug, pre-bucketed by
//     gender / brand / category / color, pre-computed lowercase search text,
//     cached meta (brand / category / color lists) and a small LRU cache of
//     filter results.

import { requireSupabase } from '../lib/supabase'

export const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const norm = (v) => String(v ?? '').trim().toLowerCase()
const EMPTY = Object.freeze([])
const BUCKET_KEYS = ['gender', 'brand', 'category', 'color']
const QUERY_CACHE_SIZE = 60

const toArray = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String)
  if (typeof v === 'string' && v.trim()) {
    const s = v.trim()
    if (s.startsWith('[')) { try { return toArray(JSON.parse(s)) } catch { /* fall through */ } }
    return s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return []
}

// Bundled catalogue photos are stored in Supabase as absolute URLs of the live site
// (https://<site>/products/w01.webp). Serve them from this build instead (same file),
// so local dev works and responsive srcset / JPG fallback still apply.
const BUNDLED_PHOTO = /^https?:\/\/[^/]+(\/products\/[a-z]\d+(?:-400)?\.(?:webp|jpg))$/i
export function normalizeImage(url) {
  if (!url) return url
  const s = String(url).trim()
  const m = BUNDLED_PHOTO.exec(s)
  return m && !/\.supabase\.co\//i.test(s) ? m[1] : s
}

/** Database row -> UI product. */
export function fromRow(r) {
  const images = toArray(r.images).length ? toArray(r.images) : toArray(r.image_url)
  return {
    id: String(r.code ?? '').trim() || String(r.id),
    dbId: r.id,
    code: r.code ?? null,
    name: r.name || 'Product',
    brand: r.brand || '',
    category: r.category || '',
    subcategory: r.subcategory || '',
    price: Number(r.price) || 0,
    color: r.color || '',
    fabric: r.fabric || '',
    gender: String(r.gender || '').toLowerCase(),
    sizes: toArray(r.sizes),
    tags: toArray(r.tags),
    description: r.description || '',
    images: images.map(normalizeImage),
    images360: toArray(r.images360).map(normalizeImage),
    stock: r.stock == null ? null : Number(r.stock),
    featured: !!r.featured,
    rating: Number(r.rating) || 0,
    reviews: Number(r.reviews) || 0,
    priceNote: r.price_note || '',
    active: r.active !== false,
    createdAt: r.created_at || null,
  }
}

/** Public catalogue: active products only (same rows the WhatsApp bot reads). */
export async function fetchPublicProducts() {
  const sb = requireSupabase()
  const { data, error } = await sb.from('products').select('*').not('active', 'is', false).order('id', { ascending: true })
  if (error) throw error
  return (data || []).map(fromRow)
}

// Whole gender words filter by gender exactly ("men" is also a substring of "women").
const GENDER_WORDS = {
  woman: 'women', women: 'women', womens: 'women', ladies: 'women', lady: 'women', female: 'women', girl: 'women', girls: 'women',
  man: 'men', men: 'men', mens: 'men', gents: 'men', gent: 'men', male: 'men', boy: 'men', boys: 'men',
}

// Every typed character counts: tokens are matched as case-insensitive substrings.
function searchWords(q) {
  return String(q || '').toLowerCase().split(/[\s,]+/).filter(Boolean)
}

const SORTERS = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || (Number(b.dbId) || 0) - (Number(a.dbId) || 0) || String(b.id).localeCompare(String(a.id)),
  rating: (a, b) => (b.rating || 0) - (a.rating || 0),
}

function haystackOf(p) {
  return `${p.id} ${p.name} ${p.brand} ${p.category} ${p.subcategory} ${p.color} ${p.fabric} ${p.gender} ${(p.tags || []).join(' ')} ${p.description}`.toLowerCase()
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
      for (const w of words) {
        const g = GENDER_WORDS[w]
        if (g ? p.gender !== g : !hay.includes(w)) return false
      }
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
    this.byDbId = new Map()
    this.bySlug = new Map()
    this.buckets = Object.fromEntries(BUCKET_KEYS.map((k) => [k, new Map()]))
    this.hay = new Map()
    this.queryCache = new Map()
    this.metaCache = null

    for (const p of products) {
      this.byId.set(p.id, p)
      if (p.code) this.byId.set(String(p.code).toLowerCase(), p)
      if (p.dbId != null) this.byDbId.set(String(p.dbId), p)
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

  /** O(1) lookup by product code (p001), slug, or database id. */
  get(idOrSlug) {
    if (!idOrSlug) return undefined
    const key = String(idOrSlug)
    return this.byId.get(key) ?? this.byId.get(key.toLowerCase()) ?? this.bySlug.get(key.toLowerCase()) ?? this.byDbId.get(key)
  }

  /** Brand / category / color lists and counts - computed once per index. */
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

// One index per product-list reference (rebuilt only when the list changes).
const indexes = new WeakMap()

export const catalogService = {
  index(list = EMPTY) {
    let idx = indexes.get(list)
    if (!idx) {
      idx = new ProductIndex(list)
      indexes.set(list, idx)
    }
    return idx
  },
  /** Filter any list. Uses the cached index when the list already has one. */
  filter(list, f = {}) {
    const idx = indexes.get(list)
    return idx ? idx.query(f) : applyFilters(list, f)
  },
}