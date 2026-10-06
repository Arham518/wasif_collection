import { Link } from 'react-router-dom'
import { useCart } from '../store/cart'
import { formatPKR, mediaUrl } from '../lib/utils'
import { Minus, Plus, Trash2 } from 'lucide-react'

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart()
  const total = subtotal()
  const ship = total >= 5000 || total === 0 ? 0 : 250

  if (!items.length) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-display text-3xl mb-3">Your bag is empty</h1>
        <Link to="/collection" className="btn inline-flex">Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl mb-6">Bag</h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="border border-[var(--color-line)] bg-white divide-y divide-[var(--color-line)]">
          {items.map((it) => (
            <div key={`${it.productId}-${it.size}`} className="flex gap-4 p-4">
              <img src={mediaUrl(it.image)} alt="" className="w-20 h-28 object-cover border border-[var(--color-line)]" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-mute)]">{it.brand}</div>
                <Link to={`/product/${it.productId}`} className="text-sm font-medium hover:underline">{it.name}</Link>
                <div className="text-xs text-[var(--color-mute)] mt-1">Size {it.size} · {it.color}</div>
                <div className="flex items-center gap-3 mt-3">
                  <button className="border border-[var(--color-line)] p-1" onClick={() => setQty(it.productId, it.size, it.qty - 1)}><Minus size={12} /></button>
                  <span className="text-sm w-6 text-center">{it.qty}</span>
                  <button className="border border-[var(--color-line)] p-1" onClick={() => setQty(it.productId, it.size, it.qty + 1)}><Plus size={12} /></button>
                  <button className="ml-auto text-[var(--color-mute)]" onClick={() => remove(it.productId, it.size)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="text-sm font-medium">{formatPKR(it.price * it.qty)}</div>
            </div>
          ))}
        </div>
        <aside className="border border-[var(--color-line)] bg-white p-5 h-fit sticky top-24">
          <h2 className="text-[11px] tracking-[0.16em] uppercase mb-4">Summary</h2>
          <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span>{formatPKR(total)}</span></div>
          <div className="flex justify-between text-sm mb-4"><span>Shipping</span><span>{ship === 0 ? 'Free' : formatPKR(ship)}</span></div>
          <div className="flex justify-between font-medium border-t border-[var(--color-line)] pt-3 mb-5"><span>Total</span><span>{formatPKR(total + ship)}</span></div>
          <Link to="/checkout" className="btn w-full">Checkout</Link>
        </aside>
      </div>
    </div>
  )
}
