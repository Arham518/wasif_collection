import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { useAuth, useIsAdmin } from '../store/auth'
import { errorMessage } from '../lib/supabase'
import { fetchReviews, saveReview, deleteReview, summarize } from '../services/reviewService'

function Stars({ value, size = 14 }) {
  return (
    <span className="inline-flex gap-0.5 text-[var(--color-accent)]" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(value) ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

const dateFmt = new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })

/** Rating summary, review list and (for signed-in customers) a one-per-product review form. */
export default function ProductReviews({ product }) {
  const user = useAuth((s) => s.user)
  const profile = useAuth((s) => s.profile)
  const isAdmin = useIsAdmin()
  const location = useLocation()
  const [state, setState] = useState({ loading: true, list: [], available: true, error: '' })
  const [form, setForm] = useState({ rating: 0, comment: '' })
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetchReviews(product)
      .then(({ list, available }) => { if (alive) setState({ loading: false, list, available, error: '' }) })
      .catch((err) => { if (alive) setState({ loading: false, list: [], available: true, error: errorMessage(err, 'Could not load reviews.') }) })
    return () => { alive = false }
  }, [product])

  const { count, average } = useMemo(() => summarize(state.list), [state.list])
  const mine = user ? state.list.find((r) => r.user_id === user.id) : null
  const showForm = user && state.available && (!mine || editing)

  function startEdit() {
    setForm({ rating: mine.rating, comment: mine.comment || '' })
    setEditing(true)
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.rating) return toast.error('Please choose a star rating')
    setBusy(true)
    try {
      const authorName = profile?.full_name?.trim() || (user.email || '').split('@')[0] || 'Customer'
      const saved = await saveReview({ product, userId: user.id, authorName, rating: form.rating, comment: form.comment.trim().slice(0, 1000) })
      setState((s) => ({ ...s, list: [saved, ...s.list.filter((r) => r.id !== saved.id)] }))
      setEditing(false)
      setForm({ rating: 0, comment: '' })
      toast.success(mine ? 'Review updated' : 'Thanks for your review')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save your review.'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(r) {
    if (!window.confirm('Delete this review?')) return
    try {
      await deleteReview(r.id)
      setState((s) => ({ ...s, list: s.list.filter((x) => x.id !== r.id) }))
      setEditing(false)
      toast.success('Review deleted')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the review.'))
    }
  }

  return (
    <section className="mt-16" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <h2 className="font-display text-2xl">Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars value={average} />
            <span className="font-medium">{average.toFixed(1)}</span>
            <span className="text-[var(--color-mute)]">({count} {count === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}
      </div>

      {state.loading ? (
        <p className="text-sm text-[var(--color-mute)]">Loading reviews…</p>
      ) : !state.available ? (
        <p className="text-sm text-[var(--color-mute)]">Reviews will be available soon.</p>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div className="min-w-0">
            {state.error && <p className="text-sm text-red-700 mb-3">{state.error}</p>}
            {!state.error && count === 0 && <p className="text-sm text-[var(--color-mute)]">No reviews yet. Be the first to review this piece.</p>}
            <ul className="space-y-3">
              {state.list.map((r) => (
                <li key={r.id} className="border border-[var(--color-line)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Stars value={r.rating} size={12} />
                      <span className="text-sm font-medium break-words">{r.author_name || 'Customer'}</span>
                    </div>
                    <span className="text-[11px] text-[var(--color-mute)]">{dateFmt.format(new Date(r.created_at))}</span>
                  </div>
                  {r.comment && <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed break-words whitespace-pre-line">{r.comment}</p>}
                  {(user?.id === r.user_id || isAdmin) && (
                    <div className="flex gap-3 mt-2 text-[11px] uppercase tracking-wider">
                      {user?.id === r.user_id && !editing && <button type="button" className="underline" onClick={startEdit}>Edit</button>}
                      <button type="button" className="underline text-red-700" onClick={() => remove(r)}>Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            {!user ? (
              <div className="border border-[var(--color-line)] bg-white p-5 text-sm">
                <p className="mb-3">Log in to write a review.</p>
                <Link to={`/login?next=${encodeURIComponent(location.pathname + '#reviews')}`} className="btn inline-flex">Log in</Link>
              </div>
            ) : showForm ? (
              <form onSubmit={submit} className="border border-[var(--color-line)] bg-white p-5 grid gap-3">
                <div className="text-[11px] tracking-[0.14em] uppercase">{mine ? 'Edit your review' : 'Write a review'}</div>
                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={form.rating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className="p-1 text-[var(--color-accent)]"
                      onClick={() => setForm((f) => ({ ...f, rating: n }))}
                    >
                      <Star size={22} fill={n <= form.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Share your thoughts on fabric, fit and quality (optional)"
                  maxLength={1000}
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="btn flex-1" disabled={busy}>{busy ? 'Saving…' : mine ? 'Update review' : 'Submit review'}</button>
                  {editing && <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>}
                </div>
              </form>
            ) : (
              <div className="border border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-mute)]">You have reviewed this piece. Thank you!</div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}