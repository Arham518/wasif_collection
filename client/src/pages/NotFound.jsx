import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-mute)] mb-3">404</p>
      <h1 className="font-display text-4xl mb-4">Page not found</h1>
      <p className="text-[var(--color-ink-soft)] mb-8">Ye page maujood nahi — collection se continue karein.</p>
      <Link to="/" className="btn inline-flex">Home</Link>
    </div>
  )
}
