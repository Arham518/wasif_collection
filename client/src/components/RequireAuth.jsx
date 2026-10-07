import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { PageLoader } from './Skeleton'

/** /account etc: must be logged in (any role). */
export function RequireAuth({ children }) {
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!ready) return <PageLoader />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return children
}

/** /admin/dashboard/*: must be logged in AND have profiles.role = 'admin'. */
export function RequireAdmin({ children }) {
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const profile = useAuth((s) => s.profile)
  const profileLoading = useAuth((s) => s.profileLoading)
  const location = useLocation()
  if (!ready || (user && profileLoading && !profile)) return <PageLoader />
  if (!user) return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (profile?.role !== 'admin') {
    return (
      <div className="container-x py-20 text-center max-w-lg">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-mute)] mb-3">Admin only</p>
        <h1 className="font-display text-3xl mb-3">Access denied</h1>
        <p className="text-[var(--color-ink-soft)] mb-8">This account is not an admin. Log in with the owner account to manage the store.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn inline-flex">Home</Link>
          <Link to="/account" className="btn btn-outline inline-flex">My account</Link>
        </div>
      </div>
    )
  }
  return children
}