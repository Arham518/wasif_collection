import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../store/cart'
import { useCatalog } from '../store/catalog'
import { formatPKR, uid } from '../lib/utils'
import { PK_CITIES, STORE } from '../data/catalog'
import { toast } from 'sonner'

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const addOrder = useCatalog((s) => s.addOrder)
  const [method, setMethod] = useState('cod')
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState(null)
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' })
  const [walletPhone, setWalletPhone] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: 'Karachi', notes: '' })
  const navigate = useNavigate()
  const total = subtotal()
  const ship = total >= 5000 || total === 0 ? 0 : 250

  if (!items.length && !order) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-display text-3xl mb-3">Nothing to checkout</h1>
        <Link to="/collection" className="btn inline-flex">Shop</Link>
      </div>
    )
  }

  if (order) {
    return (
      <div className="container-x py-16 max-w-lg text-center">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-mute)] mb-2">Confirmed</p>
        <h1 className="font-display text-3xl mb-3">Order placed</h1>
        <p className="text-[var(--color-ink-soft)] mb-2">Order <strong>{order.orderNumber}</strong></p>
        <p className="text-sm text-[var(--color-mute)] mb-2">Payment: {order.paymentMethod.toUpperCase()} · Total {formatPKR(order.total)}</p>
        <p className="text-xs text-[var(--color-mute)] mb-6">Demo order saved in this browser (localStorage). Admin panel mein bhi dikhega.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn inline-flex">Home</Link>
          <Link to="/admin" className="btn btn-outline inline-flex">View in admin</Link>
        </div>
      </div>
    )
  }

  function validateAddress() {
    if (!form.name.trim() || form.name.trim().length < 3) return 'Full name required'
    if (!/^03\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) return 'Valid Pakistani mobile required (03xxxxxxxxx)'
    if (!form.address.trim() || form.address.trim().length < 8) return 'Complete address required'
    if (!form.city) return 'City required'
    return null
  }

  function validatePayment() {
    if (method === 'card') {
      const num = card.number.replace(/\s/g, '')
      if (num.length < 15) return 'Enter a demo card number (e.g. 4242 4242 4242 4242)'
      if (!card.name.trim()) return 'Cardholder name required'
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Expiry MM/YY required'
      if (!/^\d{3,4}$/.test(card.cvc)) return 'CVC required'
    }
    if ((method === 'jazzcash' || method === 'easypaisa') && !/^03\d{9}$/.test(walletPhone.replace(/[\s-]/g, ''))) {
      return 'Wallet mobile (03xxxxxxxxx) required for demo payment'
    }
    return null
  }

  async function submit(e) {
    e.preventDefault()
    const aErr = validateAddress()
    if (aErr) return toast.error(aErr)
    const pErr = validatePayment()
    if (pErr) return toast.error(pErr)
    setBusy(true)
    await new Promise((r) => setTimeout(r, 600))
    const next = {
      id: uid('ord'),
      orderNumber: `PKF-${Date.now().toString(36).toUpperCase()}`,
      items: items.map((i) => ({ ...i })),
      customer: { ...form, phone: form.phone.replace(/[\s-]/g, '') },
      paymentMethod: method,
      paymentStatus: method === 'cod' ? 'pending_cod' : 'demo_paid',
      status: 'placed',
      subtotal: total,
      shippingFee: ship,
      total: total + ship,
      createdAt: new Date().toISOString(),
    }
    addOrder(next)
    setOrder(next)
    clear()
    toast.success('Order placed (demo)')
    setBusy(false)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl mb-2">Checkout</h1>
      <p className="text-sm text-[var(--color-mute)] mb-6">{STORE.address} · <a className="underline" href={STORE.whatsapp} target="_blank" rel="noreferrer">{STORE.phoneDisplay}</a></p>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-6">
          <section className="border border-[var(--color-line)] bg-white p-5 space-y-3">
            <h2 className="text-[11px] tracking-[0.16em] uppercase mb-2">Shipping</h2>
            <input className="input" required placeholder="Full name" value={form.name} onChange={set('name')} />
            <input className="input" required placeholder="Phone 03xxxxxxxxx" value={form.phone} onChange={set('phone')} />
            <input className="input" type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} />
            <select className="input" required value={form.city} onChange={set('city')}>
              {PK_CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <textarea className="input min-h-[90px]" required placeholder="Full address" value={form.address} onChange={set('address')} />
            <textarea className="input min-h-[60px]" placeholder="Order notes" value={form.notes} onChange={set('notes')} />
          </section>
          <section className="border border-[var(--color-line)] bg-white p-5 space-y-3">
            <h2 className="text-[11px] tracking-[0.16em] uppercase mb-2">Payment</h2>
            {[
              { id: 'cod', label: 'Cash on Delivery', note: 'Pay when order arrives' },
              { id: 'card', label: 'Card (demo)', note: 'No real charge — demo form only' },
              { id: 'jazzcash', label: 'JazzCash (demo)', note: 'Simulated wallet payment' },
              { id: 'easypaisa', label: 'Easypaisa (demo)', note: 'Simulated wallet payment' },
            ].map((m) => (
              <label key={m.id} className={`flex gap-3 items-start border border-[var(--color-line)] p-3 cursor-pointer ${method === m.id ? 'border-[var(--color-ink)]' : ''}`}>
                <input type="radio" name="pay" checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1" />
                <span>
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="text-xs text-[var(--color-mute)]">{m.note}</span>
                </span>
              </label>
            ))}
            {method === 'card' && (
              <div className="grid sm:grid-cols-2 gap-2 pt-2">
                <input className="input sm:col-span-2" placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                <input className="input sm:col-span-2" placeholder="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                <input className="input" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                <input className="input" placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
              </div>
            )}
            {(method === 'jazzcash' || method === 'easypaisa') && (
              <input className="input mt-2" placeholder="Wallet mobile 03xxxxxxxxx" value={walletPhone} onChange={(e) => setWalletPhone(e.target.value)} />
            )}
          </section>
        </div>
        <aside className="border border-[var(--color-line)] bg-white p-5 h-fit sticky top-24">
          <h2 className="text-[11px] tracking-[0.16em] uppercase mb-4">Order</h2>
          <ul className="space-y-2 text-sm mb-4">
            {items.map((it) => (
              <li key={`${it.productId}-${it.size}`} className="flex justify-between gap-2">
                <span className="truncate">{it.name} ×{it.qty}</span>
                <span>{formatPKR(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>{formatPKR(total)}</span></div>
          <div className="flex justify-between text-sm mb-3"><span>Shipping</span><span>{ship === 0 ? 'Free' : formatPKR(ship)}</span></div>
          <div className="flex justify-between font-medium border-t border-[var(--color-line)] pt-3 mb-5"><span>Total</span><span>{formatPKR(total + ship)}</span></div>
          <button type="submit" className="btn w-full" disabled={busy}>{busy ? 'Placing…' : 'Place order'}</button>
          <button type="button" className="btn btn-outline w-full mt-2" onClick={() => navigate('/cart')}>Back to bag</button>
        </aside>
      </form>
    </div>
  )
}
