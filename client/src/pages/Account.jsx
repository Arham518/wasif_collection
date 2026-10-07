import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, User, ShoppingBag, Package } from 'lucide-react'
import OrderCard from '../components/OrderCard'
import { ListSkeleton } from '../components/Skeleton'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { PK_CITIES } from '../data/catalog'
import { errorMessage } from '../lib/supabase'
import { fetchMyOrders } from '../services/orderService'

export default function Account() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'orders' ? 'orders' : 'profile'
  const user = useAuth((s) => s.user)
  const profile = useAuth((s) => s.profile)
  const signOut = useAuth((s) => s.signOut)
  const bagCount = useCart((s) => s.items.reduce((n, x) => n + x.qty, 0))
  const setTab = (t) => setParams(t === 'profile' ? {} : { tab: t }, { replace: true })

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--color-mute)] mb-1">My account</p>
          <h1 className="font-display text-3xl">{profile?.full_name || user?.email}</h1>
        </div>
        <button className="btn btn-outline" onClick={async () => { await signOut(); toast.success('Logged out') }}><LogOut size={14} /> Logout</button>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button className={`chip ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}><User size={12} className="inline mr-1" />Profile</button>
        <button className={`chip ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}><Package size={12} className="inline mr-1" />My orders</button>
        <Link to="/cart" className="chip"><ShoppingBag size={12} className="inline mr-1" />Bag{bagCount ? ` (${bagCount})` : ''}</Link>
      </div>
      {tab === 'profile' ? <ProfileForm key={profile?.id || 'none'} /> : <MyOrders />}
    </div>
  )
}

function ProfileForm() {
  const user = useAuth((s) => s.user)
  const profile = useAuth((s) => s.profile)
  const profileError = useAuth((s) => s.profileError)
  const updateProfile = useAuth((s) => s.updateProfile)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(() => ({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    city: profile?.city || 'Karachi',
    address: profile?.address || '',
  }))
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    if (form.full_name.trim().length < 3) return toast.error('Full name required')
    const phone = form.phone.replace(/[\s-]/g, '')
    if (phone && !/^03\d{9}$/.test(phone)) return toast.error('Valid Pakistani mobile required (03xxxxxxxxx)')
    setBusy(true)
    try {
      await updateProfile({ ...form, full_name: form.full_name.trim(), phone, address: form.address.trim() })
      toast.success('Profile saved')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save profile'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="border border-[var(--color-line)] bg-white p-5 grid md:grid-cols-2 gap-3 max-w-3xl">
      {profileError && <p className="md:col-span-2 text-sm text-red-700">{profileError}</p>}
      <input className="input" placeholder="Full name" value={form.full_name} onChange={set('full_name')} required />
      <input className="input" placeholder="Phone 03xxxxxxxxx" value={form.phone} onChange={set('phone')} />
      <input className="input md:col-span-2 opacity-70" value={user?.email || ''} readOnly aria-label="Email" title="Email can't be changed here" />
      <select className="input" value={form.city} onChange={set('city')}>
        {PK_CITIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <textarea className="input md:col-span-2 min-h-[80px]" placeholder="Full address (used at checkout)" value={form.address} onChange={set('address')} />
      <button className="btn md:col-span-2" type="submit" disabled={busy || !profile}>{busy ? 'Saving\u2026' : 'Save profile'}</button>
    </form>
  )
}

function MyOrders() {
  const user = useAuth((s) => s.user)
  const [state, setState] = useState({ loading: true, orders: [] })

  useEffect(() => {
    let alive = true
    fetchMyOrders(user.id)
      .then((orders) => { if (alive) setState({ loading: false, orders }) })
      .catch((err) => {
        if (!alive) return
        setState({ loading: false, orders: [] })
        toast.error(errorMessage(err, 'Could not load your orders'))
      })
    return () => { alive = false }
  }, [user.id])

  if (state.loading) return <ListSkeleton rows={3} />
  if (!state.orders.length) {
    return (
      <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">
        <p className="mb-4">No orders yet</p>
        <Link to="/collection" className="btn inline-flex">Shop</Link>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {state.orders.map((o) => <OrderCard key={o.id} order={o} />)}
    </div>
  )
}
