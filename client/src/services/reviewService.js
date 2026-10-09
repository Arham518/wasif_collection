// Product reviews (table public.reviews, see supabase/reviews.sql).
// Everyone can read; a signed-in customer has one review per product (insert or update).
import { supabase, requireSupabase } from '../lib/supabase'

/** True when the reviews table hasn't been created yet (reviews.sql not run). */
export const isMissingTable = (err) =>
  !!err && (err.code === 'PGRST205' || err.code === '42P01' || /schema cache|does not exist/i.test(String(err.message || '')))

export async function fetchReviews(product) {
  if (!supabase) return { list: [], available: false }
  const { data, error } = await supabase
    .from('reviews')
    .select('id, product, user_id, author_name, rating, comment, created_at')
    .eq('product', product)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) {
    if (isMissingTable(error)) return { list: [], available: false }
    throw error
  }
  return { list: data || [], available: true }
}

export async function saveReview({ product, userId, authorName, rating, comment }) {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('reviews')
    .upsert(
      { product, user_id: userId, author_name: authorName, rating, comment: comment || null },
      { onConflict: 'user_id,product' },
    )
    .select('id, product, user_id, author_name, rating, comment, created_at')
    .single()
  if (error) throw error
  return data
}

export async function deleteReview(id) {
  const sb = requireSupabase()
  const { error } = await sb.from('reviews').delete().eq('id', id)
  if (error) throw error
}

/** Average (1 decimal) and count. */
export function summarize(list) {
  const n = list.length
  const avg = n ? list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / n : 0
  return { count: n, average: Math.round(avg * 10) / 10 }
}