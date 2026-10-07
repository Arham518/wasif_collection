import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { requireSupabase, errorMessage } from '../lib/supabase'
import { useAuth } from '../store/auth'
import { PageLoader } from '../components/Skeleton'

/** Opened from the reset email: Supabase signs the user in from the link, then they pick a new password. */
export default function ResetPassword() {
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const [waited, setWaited] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  // Give Supabase a moment to read the token from the link.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500)
    return () => clearTimeout(t)
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirm) return toast.error('Passwords do not match')
    setBusy(true)
    try {
      const { error } = await requireSupabase().auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated')
      navigate('/account', { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update password'))
    } finally {
      setBusy(false)
    }
  }

  if (!user && (!ready || !waited)) return <PageLoader />

  return (
    <div className="container-x py-16 max-w-md">
      <h1 className="font-display text-3xl mb-2">Set a new password</h1>
      {!user ? (
        <div className="border border-[var(--color-line)] bg-white p-5 space-y-3">
          <p className="text-sm">This reset link is invalid or has expired. Request a new one.</p>
          <Link to="/forgot-password" className="btn w-full">Request new link</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-mute)] mb-6">Account: {user.email}</p>
          <form onSubmit={submit} className="border border-[var(--color-line)] bg-white p-5 space-y-3">
            <input className="input" type="password" placeholder="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input className="input" type="password" placeholder="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <button className="btn w-full" type="submit" disabled={busy}>{busy ? 'Saving\u2026' : 'Update password'}</button>
          </form>
        </>
      )}
    </div>
  )
}