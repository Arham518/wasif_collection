import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { scrollToTop } from '../lib/scroll'

/** Page numbers with gaps: 1 ... 4 5 6 ... 12 */
export function pageList(page, pages) {
  const out = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) out.push(p)
    else if (out[out.length - 1] !== '...') out.push('...')
  }
  return out
}

/** Numbered pagination; renders nothing when everything fits on one page. */
export default function Pagination({ page, total, perPage, onChange }) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  return (
    <nav className="flex flex-wrap justify-center items-center gap-2 mt-8" aria-label="Pagination">
      <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
      {pageList(page, pages).map((p, i) => (p === '...'
        ? <span key={`gap-${i}`} className="px-1 text-sm text-[var(--color-mute)]">&hellip;</span>
        : <button key={p} type="button" className={`chip ${p === page ? 'active' : ''}`} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button type="button" className="btn btn-outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  )
}

/** ?page= in the URL (other params kept), scrolls to top on change. */
export function usePageParam() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const setPage = useCallback((p) => {
    setParams((prev) => {
      const sp = new URLSearchParams(prev)
      if (p > 1) sp.set('page', String(p))
      else sp.delete('page')
      return sp
    }, { replace: true, preventScrollReset: true })
    scrollToTop()
  }, [setParams])
  return [page, setPage]
}