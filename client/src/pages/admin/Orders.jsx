import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import OrderCard from '../../components/OrderCard'
import { ListSkeleton } from '../../components/Skeleton'
import { errorMessage } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { adminFetchOrders, adminUpdateOrderStatus } from '../../services/adminService'
import { ORDER_STATUSES, STATUS_LABEL } from '../../services/orderService'

export default function Orders() {
  const { data, loading, setData } = useAsync(adminFetchOrders, [], { errorText: 'Could not load orders' })
  const [filter, setFilter] = useState('')
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState(null)

  const orders = useMemo(() => {
    const words = q.trim().toLowerCase()
    return (data || []).filter((o) => (!filter || o.status === filter)
      && (!words || `${o.orderNumber} ${o.customer?.name} ${o.customer?.phone} ${o.customer?.email} ${o.customer?.city}`.toLowerCase().includes(words)))
  }, [data, filter, q])

  async function changeStatus(order, status) {
    setSaving(order.id)
    try {
      const updated = await adminUpdateOrderStatus(order.id, status)
      setData((list) => (list || []).map((o) => (o.id === order.id ? updated : o)))
      toast.success(`Order ${order.orderNumber}: ${STATUS_LABEL[status]}`)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update order'))
    } finally {
      setSaving(null)
    }
  }

  const count = (s) => (data || []).filter((o) => o.status === s).length

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input className="input max-w-xs" type="search" placeholder="Search order, name, phone&hellip;" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className={`chip ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All ({data?.length || 0})</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} type="button" className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{STATUS_LABEL[s]} ({count(s)})</button>
        ))}
      </div>
      {loading && !data ? (
        <ListSkeleton rows={3} />
      ) : !orders.length ? (
        <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">No orders yet</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o}>
              <div className="mt-3 pt-3 border-t border-[var(--color-line)] flex flex-wrap gap-3 items-end justify-between">
                <div className="text-xs text-[var(--color-mute)] space-y-0.5">
                  <div className="text-[var(--color-ink)]">{o.customer?.name} &middot; {o.customer?.phone}{o.customer?.email ? ` \u00b7 ${o.customer.email}` : ''}</div>
                  <div>{o.customer?.address}, {o.customer?.city}</div>
                  {o.customer?.notes && <div>Note: {o.customer.notes}</div>}
                  <div>Payment: {o.paymentMethod} ({o.paymentStatus}) &middot; Subtotal {o.subtotal} + shipping {o.shippingFee}</div>
                </div>
                <label className="text-xs flex items-center gap-2">
                  Status
                  <select className="input w-auto py-1" value={o.status} disabled={saving === o.id} onChange={(e) => changeStatus(o, e.target.value)}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
              </div>
            </OrderCard>
          ))}
        </div>
      )}
    </div>
  )
}