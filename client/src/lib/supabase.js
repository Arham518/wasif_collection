import { createClient } from '@supabase/supabase-js'

// One Supabase client for the whole site (auth + database + storage).
// Values come from client/.env.local (VITE_ vars are baked in at build time).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabase = Boolean(url && anonKey)

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'rana-auth' },
  })
  : null

if (!hasSupabase && import.meta.env.DEV) {
  console.warn('Supabase env vars missing: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env.local')
}

export const PRODUCT_BUCKET = 'product-images'

/** Turn a Supabase / network error into a short message for a toast. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  const msg = String(err.message || err.error_description || err || '')
  if (/PGRST205|schema cache|does not exist/i.test(msg) || err.code === 'PGRST205' || err.code === '42P01') {
    return 'Database setup pending: run supabase/auth_admin_setup.sql in Supabase.'
  }
  if (/row-level security|permission denied|42501/i.test(msg) || err.code === '42501') return 'You do not have permission for this action.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Network error - check your internet connection.'
  return msg || fallback
}

/** Supabase not configured -> throw a readable error. */
export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  return supabase
}