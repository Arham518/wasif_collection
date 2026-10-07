import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import LazyImage from '../../components/LazyImage'
import { ListSkeleton } from '../../components/Skeleton'
import { formatPKR } from '../../lib/utils'
import { errorMessage } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { adminFetchProducts, adminDeleteProduct } from '../../services/adminService'
import { fromRow } from '../../services/catalogService'
import { useCatalog } from '../../store/catalog'
import Pagination, { usePageParam } from '../../components/Pagination'

const PER_PAGE = 20

/** Delete with confirm, then refresh the public catalogue cache. Returns true when deleted. */
export async function confirmDeleteProduct(row) {
  if (!confirm(`Delete "${row.name}" (${row.code || row.id})? This cannot be undone.`)) return false
  try {
    await adminDeleteProduct(row)
    useCatalog.getState().load({ force: true })
    toast.success('Product deleted')
    return true
  } catch (err) {
    toast.error(errorMessage(err, 'Could not delete product'))
    return false
  }
}

export default function Products() {
  const { data, loading, setData } = useAsync(adminFetchProducts, [], { errorText: 'Could not load products' })
  const [q, setQ] = useState('')
  const [show, setShow] = useState('all')
  const rows = useMemo(() => {
    const words = q.trim().toLowerCase()
    return (data || []).filter((r) => {
      if (show === 'active' && r.active === false) return false
      if (show === 'hidden' && r.active !== false) return false
      if (!words) return true
      return `${r.code} ${r.name} ${r.brand} ${r.category} ${r.color}`.toLowerCase().includes(words)
    })
  }, [data, q, show])

  const [pageParam, setPage] = usePageParam()
  const page = Math.min(pageParam, Math.max(1, Math.ceil(rows.length / PER_PAGE)))
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function remove(row) {
    if (await confirmDeleteProduct(row)) setData((list) => (list || []).filter((r) => r.id !== row.id))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input className="input max-w-xs" type="search" placeholder="Search name, code, brand&hellip;" value={q} onChange={(e) => setQ(e.target.value)} />
        {['all', 'active', 'hidden'].map((s) => (
          <button key={s} type="button" className={`chip ${show === s ? 'active' : ''}`} onClick={() => setShow(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
        ))}
        <Link to="/admin/dashboard/products/new" className="btn ml-auto"><Plus size={14} /> Add product</Link>
      </div>
      {loading && !data ? (
        <ListSkeleton rows={6} />
      ) : !rows.length ? (
        <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">{data?.length ? 'No products match.' : 'No products yet.'}</div>
      ) : (
        <div className="border border-[var(--color-line)] bg-white divide-y divide-[var(--color-line)]">
          {pageRows.map((r) => {
            const p = fromRow(r)
            return (
              <div key={r.id} className="flex gap-3 p-3 items-center">
                <LazyImage src={p.images?.[0]} alt="" sizes="56px" className="w-14 aspect-[3/4] shrink-0 border border-[var(--color-line)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}{r.active === false && <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--color-accent)]">Hidden</span>}</div>
                  <div className="text-xs text-[var(--color-mute)]">{r.code || `#${r.id}`} &middot; {p.brand} &middot; {p.category} &middot; {p.gender} &middot; {formatPKR(p.price)} &middot; stock {p.stock ?? '-'}</div>
                </div>
                <Link className="text-xs uppercase tracking-wider px-2 py-1 border border-[var(--color-line)]" to={`/admin/dashboard/products/${encodeURIComponent(r.code || r.id)}/edit`}>Edit</Link>
                <button className="p-2 text-[var(--color-mute)] hover:text-red-700" aria-label="Delete" onClick={() => remove(r)}><Trash2 size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
      <Pagination page={page} total={rows.length} perPage={PER_PAGE} onChange={setPage} />
      {data && <p className="text-xs text-[var(--color-mute)] mt-3">{data.length} products in Supabase</p>}
    </div>
  )
}