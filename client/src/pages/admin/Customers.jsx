import { useMemo, useState } from 'react'
import { ListSkeleton } from '../../components/Skeleton'
import { formatPKR } from '../../lib/utils'
import { useAsync } from '../../hooks/useAsync'
import { adminFetchProfiles, adminFetchOrders } from '../../services/adminService'
import { formatDate } from '../../services/orderService'
import Pagination, { usePageParam } from '../../components/Pagination'

const PER_PAGE = 20

async function loadAll() {
  const [profiles, orders] = await Promise.all([adminFetchProfiles(), adminFetchOrders()])
  return { profiles, orders }
}

export default function Customers() {
  const { data, loading } = useAsync(loadAll, [], { errorText: 'Could not load customers' })
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const stats = new Map()
    for (const o of data?.orders || []) {
      const s = stats.get(o.userId) || { count: 0, spent: 0 }
      s.count += 1
      if (o.status !== 'cancelled') s.spent += o.total
      stats.set(o.userId, s)
    }
    const words = q.trim().toLowerCase()
    return (data?.profiles || [])
      .filter((p) => !words || `${p.full_name} ${p.email} ${p.phone} ${p.city}`.toLowerCase().includes(words))
      .map((p) => ({ ...p, stats: stats.get(p.id) || { count: 0, spent: 0 } }))
  }, [data, q])

  const [pageParam, setPage] = usePageParam()
  const page = Math.min(pageParam, Math.max(1, Math.ceil(rows.length / PER_PAGE)))
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <input className="input max-w-xs mb-4" type="search" placeholder="Search name, email, phone&hellip;" value={q} onChange={(e) => setQ(e.target.value)} />
      {loading && !data ? (
        <ListSkeleton rows={4} />
      ) : !rows.length ? (
        <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">No customers yet</div>
      ) : (
        <div className="border border-[var(--color-line)] bg-white divide-y divide-[var(--color-line)]">
          {pageRows.map((p) => (
            <div key={p.id} className="flex flex-wrap gap-3 p-3 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-medium">{p.full_name || '(no name)'}{p.role === 'admin' && <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--color-accent)]">Admin</span>}</div>
                <div className="text-xs text-[var(--color-mute)]">{p.email}{p.phone ? ` \u00b7 ${p.phone}` : ''}{p.city ? ` \u00b7 ${p.city}` : ''}</div>
              </div>
              <div className="text-xs text-right text-[var(--color-mute)]">
                <div className="text-[var(--color-ink)]">{p.stats.count} orders &middot; {formatPKR(p.stats.spent)}</div>
                <div>Joined {formatDate(p.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} total={rows.length} perPage={PER_PAGE} onChange={setPage} />
      {data && <p className="text-xs text-[var(--color-mute)] mt-3">{data.profiles.length} accounts</p>}
    </div>
  )
}