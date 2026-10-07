import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ListSkeleton } from '../../components/Skeleton'
import { formatPKR } from '../../lib/utils'
import { useAsync } from '../../hooks/useAsync'
import { adminFetchProducts, adminFetchOrders, adminFetchProfiles } from '../../services/adminService'
import { ORDER_STATUSES, STATUS_LABEL } from '../../services/orderService'

async function loadAll() {
  const [products, orders, profiles] = await Promise.all([
    adminFetchProducts(),
    adminFetchOrders(),
    adminFetchProfiles().catch(() => []),
  ])
  return { products, orders, profiles }
}

function Card({ label, value, to }) {
  const body = (
    <>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-mute)] mb-1">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </>
  )
  return to
    ? <Link to={to} className="border border-[var(--color-line)] bg-white p-4 block hover:border-[var(--color-ink)]">{body}</Link>
    : <div className="border border-[var(--color-line)] bg-white p-4">{body}</div>
}

export default function Statistics() {
  const { data, loading } = useAsync(loadAll, [], { errorText: 'Could not load statistics' })

  const stats = useMemo(() => {
    if (!data) return null
    const { products, orders, profiles } = data
    const valid = orders.filter((o) => o.status !== 'cancelled')
    const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]))
    for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1
    const top = new Map()
    for (const o of valid) {
      for (const it of o.items || []) {
        const t = top.get(it.productId) || { id: it.productId, name: it.name, qty: 0, revenue: 0 }
        t.qty += Number(it.qty) || 0
        t.revenue += (Number(it.price) || 0) * (Number(it.qty) || 0)
        top.set(it.productId, t)
      }
    }
    return {
      products: products.length,
      active: products.filter((p) => p.active !== false).length,
      lowStock: products.filter((p) => p.stock != null && p.stock <= 5).length,
      customers: profiles.filter((p) => p.role !== 'admin').length,
      orders: orders.length,
      revenue: valid.reduce((s, o) => s + o.total, 0),
      delivered: orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
      byStatus,
      top: [...top.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 8),
    }
  }, [data])

  if (loading && !stats) return <ListSkeleton rows={4} />
  if (!stats) return <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">Statistics unavailable.</div>
  const maxStatus = Math.max(1, ...Object.values(stats.byStatus))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Products" value={`${stats.active} / ${stats.products}`} to="/admin/dashboard/products" />
        <Card label="Customers" value={stats.customers} to="/admin/dashboard/customers" />
        <Card label="Orders" value={stats.orders} to="/admin/dashboard/orders" />
        <Card label="Revenue (excl. cancelled)" value={formatPKR(stats.revenue)} />
        <Card label="Delivered revenue" value={formatPKR(stats.delivered)} />
        <Card label="Low stock (5 or less)" value={stats.lowStock} to="/admin/dashboard/products" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="border border-[var(--color-line)] bg-white p-5">
          <h2 className="text-[11px] tracking-[0.16em] uppercase mb-4">Orders by status</h2>
          <div className="space-y-2">
            {ORDER_STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0">{STATUS_LABEL[s]}</span>
                <span className="flex-1 h-2 bg-[var(--color-paper-2)]"><span className="block h-2 bg-[var(--color-ink)]" style={{ width: `${(stats.byStatus[s] / maxStatus) * 100}%` }} /></span>
                <span className="w-8 text-right">{stats.byStatus[s]}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-[var(--color-line)] bg-white p-5">
          <h2 className="text-[11px] tracking-[0.16em] uppercase mb-4">Top products</h2>
          {!stats.top.length ? (
            <p className="text-sm text-[var(--color-mute)]">No sales yet.</p>
          ) : (
            <ol className="text-sm space-y-2">
              {stats.top.map((t, i) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <span className="truncate">{i + 1}. <Link to={`/product/${t.id}`} className="hover:underline">{t.name}</Link> <span className="text-[var(--color-mute)]">&times;{t.qty}</span></span>
                  <span>{formatPKR(t.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}