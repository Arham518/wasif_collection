import { Link } from 'react-router-dom'
import LazyImage from './LazyImage'
import Drawer from './Drawer'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import { formatPKR } from '../lib/utils'

export default function CartDrawer() {
  const open = useUI((s) => s.cartOpen)
  const close = useUI((s) => s.closeCart)
  const items = useCart((s) => s.items)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const total = items.reduce((s, x) => s + x.price * x.qty, 0)

  return (
    <Drawer
      open={open}
      onClose={close}
      side="right"
      title="Bag"
      widthClass="w-full max-w-md"
      bodyClass="divide-y divide-[var(--color-line)]"
      footer={
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPKR(total)}</span></div>
          <Link to="/cart" onClick={close} className="btn btn-outline w-full">View bag</Link>
          <Link to="/checkout" onClick={close} className={`btn w-full ${!items.length ? 'pointer-events-none opacity-40' : ''}`}>Checkout</Link>
        </div>
      }
    >
      {!items.length && <p className="p-6 text-sm text-[var(--color-mute)]">Your bag is empty.</p>}
      {items.map((it) => (
        <div key={`${it.productId}-${it.size}`} className="flex gap-3 p-4">
          <LazyImage src={it.image} alt="" sizes="64px" className="w-16 h-20 shrink-0 border border-[var(--color-line)]" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{it.name}</div>
            <div className="text-[11px] text-[var(--color-mute)]">Size {it.size}</div>
            <div className="flex items-center gap-2 mt-2">
              <button type="button" aria-label="Decrease quantity" className="border border-[var(--color-line)] p-1" onClick={() => setQty(it.productId, it.size, it.qty - 1)}><Minus size={12} /></button>
              <span className="text-xs w-5 text-center">{it.qty}</span>
              <button type="button" aria-label="Increase quantity" className="border border-[var(--color-line)] p-1" onClick={() => setQty(it.productId, it.size, it.qty + 1)}><Plus size={12} /></button>
              <button type="button" aria-label="Remove" className="ml-auto text-[var(--color-mute)]" onClick={() => remove(it.productId, it.size)}><Trash2 size={14} /></button>
            </div>
          </div>
          <div className="text-sm">{formatPKR(it.price * it.qty)}</div>
        </div>
      ))}
    </Drawer>
  )
}
