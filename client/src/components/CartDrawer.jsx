import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import { formatPKR, mediaUrl } from '../lib/utils'

export default function CartDrawer() {
  const open = useUI((s) => s.cartOpen)
  const close = useUI((s) => s.closeCart)
  const { items, setQty, remove, subtotal } = useCart()
  if (!open) return null
  const total = subtotal()

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <aside className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--color-paper)] border-l border-[var(--color-line)] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--color-line)]">
          <h2 className="font-display text-xl">Bag</h2>
          <button onClick={close} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-line)]">
          {!items.length && <p className="p-6 text-sm text-[var(--color-mute)]">Your bag is empty.</p>}
          {items.map((it) => (
            <div key={`${it.productId}-${it.size}`} className="flex gap-3 p-4">
              <img src={mediaUrl(it.image)} alt="" className="w-16 h-20 object-cover border border-[var(--color-line)]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="text-[11px] text-[var(--color-mute)]">Size {it.size}</div>
                <div className="flex items-center gap-2 mt-2">
                  <button className="border border-[var(--color-line)] p-1" onClick={() => setQty(it.productId, it.size, it.qty - 1)}><Minus size={12} /></button>
                  <span className="text-xs w-5 text-center">{it.qty}</span>
                  <button className="border border-[var(--color-line)] p-1" onClick={() => setQty(it.productId, it.size, it.qty + 1)}><Plus size={12} /></button>
                  <button className="ml-auto text-[var(--color-mute)]" onClick={() => remove(it.productId, it.size)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="text-sm">{formatPKR(it.price * it.qty)}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--color-line)] p-4 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPKR(total)}</span></div>
          <Link to="/cart" onClick={close} className="btn btn-outline w-full">View bag</Link>
          <Link to="/checkout" onClick={close} className={`btn w-full ${!items.length ? 'pointer-events-none opacity-40' : ''}`}>Checkout</Link>
        </div>
      </aside>
    </div>
  )
}
