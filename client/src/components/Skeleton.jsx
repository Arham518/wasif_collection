/** Loading placeholders that reuse the site's skeleton style. */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <div key={i} className="aspect-[3/4] bg-white img-skeleton" />)}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="container-x py-8 min-h-[60vh]" aria-busy="true">
      <div className="h-3 w-16 img-skeleton mb-3" />
      <div className="h-8 w-48 img-skeleton mb-8" />
      <ProductGridSkeleton />
    </div>
  )
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="border border-[var(--color-line)] bg-white divide-y divide-[var(--color-line)]" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 p-3 items-center">
          <div className="w-14 h-16 shrink-0 img-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 img-skeleton" />
            <div className="h-3 w-1/3 img-skeleton" />
          </div>
        </div>
      ))}
    </div>
  )
}