import { Link } from 'react-router-dom'
import LazyImage from './LazyImage'
import { formatPKR } from '../lib/utils'
import { formatDate, STATUS_LABEL } from '../services/orderService'

export default function OrderCard({ order: o, children }) {
  return (
    <div className="border border-[var(--color-line)] bg-white p-4">
      <div className="flex flex-wrap justify-between gap-2 mb-2">
        <div>
          <div className="font-medium">{o.orderNumber}</div>
          <div className="text-xs text-[var(--color-mute)]">{formatDate(o.createdAt)}</div>
        </div>
        <div className="text-sm text-right">
          <div>{formatPKR(o.total)} &middot; {String(o.paymentMethod || '').toUpperCase()}</div>
          <span className="chip active inline-block mt-1 cursor-default">{STATUS_LABEL[o.status] || o.status}</span>
        </div>
      </div>
      <ul className="text-sm space-y-2">
        {(o.items || []).map((it, i) => (
          <li key={i} className="flex gap-3 items-center">
            {it.image && <LazyImage src={it.image} alt="" sizes="40px" className="w-10 h-12 shrink-0 border border-[var(--color-line)]" />}
            <span className="flex-1 min-w-0">
              <Link to={`/product/${it.productId}`} className="hover:underline">{it.name}</Link> &times;{it.qty}{it.size ? ` (${it.size})` : ''}
            </span>
            <span>{formatPKR((Number(it.price) || 0) * (Number(it.qty) || 0))}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  )
}