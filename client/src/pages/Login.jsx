import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth, safeNext } from '../store/auth'
import { errorMessage, hasSupabase } from '../lib/supabase'
import { PageLoader } from '../components/Skeleton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login({ mode: modeProp }) {
  const [params] = useSearchParams()
  const [mode, setMode] = useState(modeProp || (params.get('mode') === 'register' ? 'register' : 'login'))
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState('')
  const navigate = useNavigate()
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const profile = useAuth((s) => s.profile)
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)
  const next = safeNext(params.get('next'), '')

  if (!ready) return <PageLoader />
  if (user && !busy) return <Navigate to={next || (profile?.role === 'admin' ? '/admin/dashboard' : '/account')} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function validate() {
    if (!EMAIL_RE.test(form.email.trim())) return 'Valid email required'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (mode === 'register') {
      if (form.fullName.trim().length < 3) return 'Full name required'
      if (form.phone && !/^03\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) return 'Valid Pakistani mobile required (03xxxxxxxxx)'
      if (form.password !== form.confirm) return 'Passwords do not match'
    }
    return null
  }

  async function submit(e) {
    e.preventDefault()
    if (!hasSupabase) return toast.error('Login is not configured yet (Supabase keys missing).')
    const err = validate()
    if (err) return toast.error(err)
    setBusy(true)
    try {
      if (mode === 'login') {
        const { profile: p } = await signIn(form.email, form.password)
        toast.success('Logged in')
        navigate(next || (p?.role === 'admin' ? '/admin/dashboard' : '/account'), { replace: true })
      } else {
        const res = await signUp({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone.replace(/[\s-]/g, '') })
        if (res.needsConfirmation) {
          setSent(form.email.trim())
          toast.success('Account created \u2014 check your email to confirm, then log in.')
        } else {
          toast.success('Account created')
          navigate(next || '/account', { replace: true })
        }
      }
    } catch (error) {
      const msg = errorMessage(error)
      toast.error(/invalid login credentials/i.test(msg) ? 'Wrong email or password' : /email not confirmed/i.test(msg) ? 'Please confirm your email first (check your inbox).' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-x py-16 max-w-md">
      <h1 className="font-display text-3xl mb-2">{mode === 'login' ? 'Log in' : 'Create account'}</h1>
      <p className="text-sm text-[var(--color-mute)] mb-6">
        {next === '/checkout' ? 'Order place karne ke liye login karein. Aapka bag save hai.' : 'Rana Collection account: profile, orders and order history.'}
      </p>
      <div className="flex gap-2 mb-4">
        <button type="button" className={`chip ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setSent('') }}>Log in</button>
        <button type="button" className={`chip ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setSent('') }}>Register</button>
      </div>
      {sent ? (
        <div className="border border-[var(--color-line)] bg-white p-5 space-y-3">
          <p className="text-sm">We sent a confirmation link to <strong>{sent}</strong>. Open it, then log in here.</p>
          <button type="button" className="btn w-full" onClick={() => { setMode('login'); setSent('') }}>Back to log in</button>
        </div>
      ) : (
        <form onSubmit={submit} className="border border-[var(--color-line)] bg-white p-5 space-y-3" noValidate>
          {mode === 'register' && (
            <>
              <input className="input" placeholder="Full name" autoComplete="name" value={form.fullName} onChange={set('fullName')} required />
              <input className="input" placeholder="Phone 03xxxxxxxxx (optional)" autoComplete="tel" value={form.phone} onChange={set('phone')} />
            </>
          )}
          <input className="input" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={set('email')} required />
          <input className="input" type="password" placeholder="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={set('password')} required />
          {mode === 'register' && (
            <input className="input" type="password" placeholder="Confirm password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
          )}
          <button className="btn w-full" type="submit" disabled={busy}>
            {busy ? 'Please wait\u2026' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      )}
      <p className="text-xs text-[var(--color-mute)] mt-4">
        {mode === 'login' ? 'New here? ' : 'Already have an account? '}
        <button type="button" className="underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setSent('') }}>
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </button>
        {' '}&middot; <Link to="/collection" className="underline">Continue shopping</Link>
      </p>
    </div>
  )
}