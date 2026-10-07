// Admin-only data access. Every call is also protected in the database by RLS
// (public.is_admin()), so a non-admin gets an error even if they call these.
import { requireSupabase, PRODUCT_BUCKET } from '../lib/supabase'
import { compressImage } from '../lib/image'
import { orderFromRow } from './orderService'
import { slugify } from './catalogService'

/* ---------------- Products ---------------- */

/** All products incl. inactive ones, as raw rows (images exactly as stored). */
export async function adminFetchProducts() {
  const sb = requireSupabase()
  const { data, error } = await sb.from('products').select('*').order('id', { ascending: false })
  if (error) throw error
  return data || []
}

export async function adminFetchProduct(code) {
  const sb = requireSupabase()
  let res = await sb.from('products').select('*').eq('code', code).maybeSingle()
  if (!res.error && !res.data && /^\d+$/.test(String(code))) {
    res = await sb.from('products').select('*').eq('id', Number(code)).maybeSingle()
  }
  if (res.error) throw res.error
  return res.data
}

/** Next free code like p029 (based on the highest existing pNNN). */
export async function nextProductCode() {
  const sb = requireSupabase()
  const { data, error } = await sb.from('products').select('code').like('code', 'p%')
  if (error) throw error
  let max = 0
  for (const r of data || []) {
    const m = /^p(\d+)$/i.exec(r.code || '')
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `p${String(max + 1).padStart(3, '0')}`
}

export async function adminCreateProduct(row) {
  const sb = requireSupabase()
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = row.code || await nextProductCode()
    const { data, error } = await sb.from('products').insert({ ...row, code }).select('*').single()
    if (!error) return data
    if (error.code !== '23505' || row.code) throw error // retry only on an auto-code clash
  }
  throw new Error('Could not create a unique product code, please try again.')
}

export async function adminUpdateProduct(id, patch) {
  const sb = requireSupabase()
  const { data, error } = await sb.from('products').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function adminDeleteProduct(row) {
  const sb = requireSupabase()
  const { error } = await sb.from('products').delete().eq('id', row.id)
  if (error) throw error
  // Best effort: remove this product's photos from our bucket.
  const paths = [...(row.images || []), ...(row.images360 || [])].map(storagePathFromUrl).filter(Boolean)
  if (paths.length) await sb.storage.from(PRODUCT_BUCKET).remove(paths).catch(() => {})
}

/* ---------------- Storage (product-images bucket) ---------------- */

export function storagePathFromUrl(url) {
  const marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`
  const s = String(url || '')
  const i = s.indexOf(marker)
  return i >= 0 ? decodeURIComponent(s.slice(i + marker.length).split('?')[0]) : null
}

/** Compress + upload photos, return their public URLs (stored in products.images). */
export async function uploadProductImages(files, folder = 'new') {
  const sb = requireSupabase()
  const urls = []
  for (const file of files) {
    const blob = await compressImage(file)
    const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `products/${slugify(folder) || 'new'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await sb.storage.from(PRODUCT_BUCKET).upload(path, blob, {
      contentType: blob.type || file.type || 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) throw error
    urls.push(sb.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl)
  }
  return urls
}

export async function removeStorageImages(urls) {
  const sb = requireSupabase()
  const paths = (urls || []).map(storagePathFromUrl).filter(Boolean)
  if (!paths.length) return
  const { error } = await sb.storage.from(PRODUCT_BUCKET).remove(paths)
  if (error) throw error
}

/* ---------------- Categories ---------------- */

export async function adminFetchCategories() {
  const sb = requireSupabase()
  const { data, error } = await sb.from('categories').select('*').order('sort_order').order('name')
  if (error) throw error
  return data || []
}

export async function adminCreateCategory(name) {
  const sb = requireSupabase()
  const { data, error } = await sb.from('categories').insert({ name: name.trim(), slug: slugify(name) }).select('*').single()
  if (error) throw error
  return data
}

/** Rename a category and move its products along (products keep category as text). */
export async function adminRenameCategory(cat, newName) {
  const sb = requireSupabase()
  const name = newName.trim()
  const { data, error } = await sb.from('categories').update({ name, slug: slugify(name) }).eq('id', cat.id).select('*').single()
  if (error) throw error
  if (cat.name !== name) {
    const res = await sb.from('products').update({ category: name }).eq('category', cat.name)
    if (res.error) throw res.error
  }
  return data
}

export async function adminUpdateCategory(id, patch) {
  const sb = requireSupabase()
  const { data, error } = await sb.from('categories').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function adminDeleteCategory(id) {
  const sb = requireSupabase()
  const { error } = await sb.from('categories').delete().eq('id', id)
  if (error) throw error
}

/* ---------------- Orders ---------------- */

export async function adminFetchOrders() {
  const sb = requireSupabase()
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) throw error
  return (data || []).map(orderFromRow)
}

export async function adminUpdateOrderStatus(id, status) {
  const sb = requireSupabase()
  const patch = { status }
  if (status === 'delivered') patch.payment_status = 'paid'
  const { data, error } = await sb.from('orders').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return orderFromRow(data)
}

/* ---------------- Customers ---------------- */

export async function adminFetchProfiles() {
  const sb = requireSupabase()
  const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) throw error
  return data || []
}