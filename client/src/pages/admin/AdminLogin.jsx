import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth, safeNext } from '../../store/auth'
import { errorMessage, hasSupabase } from '../../lib/supabase'
import { PageLoader } from '../../components/Skeleton'

export default function AdminLogin() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const profile = useAuth((s) => s.profile)
  const profileLoading = useAuth((s) => s.profileLoading)
  const signIn = useAuth((s) => s.signIn)
  const signOut = useAuth((s) => s.signOut)
  const next = safeNext(params.get('next'), '/admin/dashboard')

  if (!ready || (user && profileLoading && !profile && !busy)) return <PageLoader />
  if (user && profile?.role === 'admin' && !busy) return <Navigate to={next.startsWith('/admin') ? next : '/admin/dashboard'} replace />

  async function login(e) {
    e.preventDefault()
    if (!hasSupabase) return toast.error('Login is not configured yet (Supabase keys missing).')
    setBusy(true)
    try {
      const { profile: p } = await signIn(email, password)
      if (p?.role !== 'admin') {
        toast.error('This account is not an admin')
        return
      }
      toast.success('Logged in')
      navigate(next.startsWith('/admin') ? next : '/admin/dashboard', { replace: true })
    } catch (err) {
      const msg = errorMessage(err)
      toast.error(/invalid login credentials/i.test(msg) ? 'Wrong email or password' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-x py-16 max-w-md">
      <h1 className="font-display text-3xl mb-2">Rana Collection &mdash; Owner login</h1>
      <p className="text-sm text-[var(--color-mute)] mb-6">Admin area. Sign in with your admin account (Supabase).</p>
      {user && profile && profile.role !== 'admin' && (
        <div className="border border-[var(--color-line)] bg-white p-4 mb-4 text-sm">
          Signed in as <strong>{user.email}</strong> (customer). This account has no admin access.{' '}
          <button type="button" className="underline" onClick={() => signOut()}>Log out</button> &middot; <Link to="/account" className="underline">My account</Link>
        </div>
      )}
      <form onSubmit={login} className="border border-[var(--color-line)] bg-white p-5 space-y-3">
        <input className="input" type="email" placeholder="Admin email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn w-full" type="submit" disabled={busy}>{busy ? 'Signing in\u2026' : 'Sign in'}</button>
      </form>
    </div>
  )
}