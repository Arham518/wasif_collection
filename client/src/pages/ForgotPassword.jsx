import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { requireSupabase, errorMessage } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error('Valid email required')
    setBusy(true)
    try {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
      if (error) throw error
      setSent(email.trim())
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send the reset email'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-x py-16 max-w-md">
      <h1 className="font-display text-3xl mb-2">Forgot password</h1>
      <p className="text-sm text-[var(--color-mute)] mb-6">Enter your account email and we will send you a reset link.</p>
      {sent ? (
        <div className="border border-[var(--color-line)] bg-white p-5 space-y-3">
          <p className="text-sm">If an account exists for <strong>{sent}</strong>, a reset link is on its way. Check your inbox and spam folder.</p>
          <Link to="/login" className="btn w-full">Back to log in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="border border-[var(--color-line)] bg-white p-5 space-y-3" noValidate>
          <input className="input" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn w-full" type="submit" disabled={busy}>{busy ? 'Sending\u2026' : 'Send reset link'}</button>
        </form>
      )}
      <p className="text-xs text-[var(--color-mute)] mt-4"><Link to="/login" className="underline">Back to log in</Link></p>
    </div>
  )
}