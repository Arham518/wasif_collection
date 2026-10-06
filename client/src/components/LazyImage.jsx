import { memo, useEffect, useState } from 'react'
import { FALLBACK_IMAGE, cn, jpgFallback, mediaUrl, srcSetFor } from '../lib/utils'
import { isImageLoaded, markImageLoaded, resolveMedia, resolveMediaSync } from '../lib/imageCache'

/** Resolve "idb:" owner uploads to object URLs; everything else passes straight through. */
function useResolvedSrc(src) {
  const wanted = mediaUrl(src)
  const [state, setState] = useState(() => ({ wanted, url: resolveMediaSync(wanted) }))
  const current = state.wanted === wanted ? state : { wanted, url: resolveMediaSync(wanted) }
  if (current !== state) setState(current)

  useEffect(() => {
    if (current.url) return
    let alive = true
    resolveMedia(wanted).then((url) => {
      if (alive) setState({ wanted, url: url || FALLBACK_IMAGE })
    })
    return () => { alive = false }
  }, [wanted, current.url])

  return current.url
}

/**
 * Optimised image:
 *  - native lazy loading + async decoding (eager + fetchpriority="high" for the LCP/hero image)
 *  - reserves space with aspect-ratio / width+height so the layout never jumps
 *  - light skeleton until the first load, then a short fade-in
 *  - remembers loaded URLs for the whole session: remounting shows the picture instantly
 *  - WebP with automatic JPG fallback, responsive srcset for catalogue photos
 *    (responsive={false} forces the single 800px file, e.g. when it was preloaded)
 */
function LazyImage({
  src,
  alt = '',
  priority = false,
  eager = false,
  sizes = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
  width = 800,
  height = 1066,
  className = '',
  imgClassName = '',
  style,
  imgStyle,
  placeholder = true,
  responsive = true,
  ...rest
}) {
  const resolved = useResolvedSrc(src)
  const [failed, setFailed] = useState(() => new Set())
  let url = resolved
  if (url && failed.has(url)) url = jpgFallback(url) || FALLBACK_IMAGE
  if (url && failed.has(url)) url = null

  const [loadedUrl, setLoadedUrl] = useState(null)
  const ready = !!url && (loadedUrl === url || isImageLoaded(url))
  const srcSet = url && responsive ? srcSetFor(url) : undefined

  return (
    <span
      className={cn('block relative overflow-hidden', placeholder && 'bg-[var(--color-paper-2)]', className)}
      style={style}
    >
      {placeholder && !ready && <span aria-hidden="true" className="img-skeleton absolute inset-0" />}
      {url && (
        <img
          src={url}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority || eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          draggable={false}
          onLoad={() => { markImageLoaded(url); setLoadedUrl(url) }}
          onError={() => setFailed((s) => new Set(s).add(url))}
          className={cn('block w-full h-full object-cover transition-[opacity,transform] duration-300', ready ? 'opacity-100' : 'opacity-0', imgClassName)}
          style={imgStyle}
          {...rest}
        />
      )}
    </span>
  )
}

export default memo(LazyImage)
