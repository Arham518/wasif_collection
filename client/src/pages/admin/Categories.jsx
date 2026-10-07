import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { ListSkeleton } from '../../components/Skeleton'
import { errorMessage } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import {
  adminFetchCategories, adminFetchProducts, adminCreateCategory, adminRenameCategory, adminUpdateCategory, adminDeleteCategory,
} from '../../services/adminService'
import { useCatalog } from '../../store/catalog'

async function loadAll() {
  const [categories, products] = await Promise.all([adminFetchCategories(), adminFetchProducts()])
  return { categories, products }
}

export default function Categories() {
  const { data, loading, reload } = useAsync(loadAll, [], { errorText: 'Could not load categories' })
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null) // { id, name }
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => {
    const m = new Map()
    for (const p of data?.products || []) m.set(p.category, (m.get(p.category) || 0) + 1)
    return m
  }, [data])
  const missing = useMemo(() => {
    const known = new Set((data?.categories || []).map((c) => c.name))
    return [...counts.keys()].filter((c) => c && !known.has(c))
  }, [data, counts])

  async function run(fn, ok) {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      await reload()
      useCatalog.getState().load({ force: true })
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save category'))
    } finally {
      setBusy(false)
    }
  }

  function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return toast.error('Category name required')
    run(() => adminCreateCategory(n), 'Category added').then(() => setName(''))
  }

  function rename(cat) {
    const n = editing?.name?.trim()
    if (!n) return toast.error('Category name required')
    const used = counts.get(cat.name) || 0
    run(() => adminRenameCategory(cat, n), used ? `Renamed (${used} products moved)` : 'Renamed').then(() => setEditing(null))
  }

  function remove(cat) {
    const used = counts.get(cat.name) || 0
    const msg = used
      ? `${used} products still use "${cat.name}". They keep this category text, but it will no longer be in the admin list. Delete anyway?`
      : `Delete category "${cat.name}"?`
    if (!confirm(msg)) return
    run(() => adminDeleteCategory(cat.id), 'Category deleted')
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div>
        {loading && !data ? (
          <ListSkeleton rows={4} />
        ) : !data?.categories?.length ? (
          <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">No categories yet.</div>
        ) : (
          <div className="border border-[var(--color-line)] bg-white divide-y divide-[var(--color-line)]">
            {data.categories.map((c) => (
              <div key={c.id} className="flex flex-wrap gap-3 p-3 items-center">
                {editing?.id === c.id ? (
                  <input className="input flex-1 min-w-[160px]" value={editing.name} onChange={(e) => setEditing({ id: c.id, name: e.target.value })} autoFocus />
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{c.name}{!c.active && <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--color-accent)]">Hidden</span>}</div>
                    <div className="text-xs text-[var(--color-mute)]">{counts.get(c.name) || 0} products &middot; /{c.slug}</div>
                  </div>
                )}
                {editing?.id === c.id ? (
                  <>
                    <button type="button" className="text-xs uppercase tracking-wider px-2 py-1 border border-[var(--color-ink)]" disabled={busy} onClick={() => rename(c)}>Save</button>
                    <button type="button" className="text-xs uppercase tracking-wider px-2 py-1 border border-[var(--color-line)]" onClick={() => setEditing(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="text-xs uppercase tracking-wider px-2 py-1 border border-[var(--color-line)]" onClick={() => setEditing({ id: c.id, name: c.name })}>Rename</button>
                    <button type="button" className="text-xs uppercase tracking-wider px-2 py-1 border border-[var(--color-line)]" disabled={busy} onClick={() => run(() => adminUpdateCategory(c.id, { active: !c.active }), c.active ? 'Category hidden' : 'Category visible')}>{c.active ? 'Hide' : 'Show'}</button>
                    <button type="button" className="p-2 text-[var(--color-mute)] hover:text-red-700" aria-label="Delete" disabled={busy} onClick={() => remove(c)}><Trash2 size={16} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {missing.length > 0 && (
          <p className="text-xs text-[var(--color-mute)] mt-3">
            Used by products but not in this list: {missing.join(', ')}.{' '}
            <button type="button" className="underline" disabled={busy} onClick={() => run(async () => { for (const m of missing) await adminCreateCategory(m) }, 'Categories added')}>Add them</button>
          </p>
        )}
      </div>
      <form onSubmit={add} className="border border-[var(--color-line)] bg-white p-5 space-y-3 h-fit">
        <h2 className="text-[11px] tracking-[0.16em] uppercase">Add category</h2>
        <input className="input" placeholder="e.g. Winter" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn w-full" type="submit" disabled={busy}>Add category</button>
        <p className="text-xs text-[var(--color-mute)]">Products keep the category name as text, so the WhatsApp bot keeps working. Renaming here also updates those products.</p>
      </form>
    </div>
  )
}