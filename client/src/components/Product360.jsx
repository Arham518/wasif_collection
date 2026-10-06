import { useEffect, useRef, useState } from 'react'
import { warmMedia } from '../lib/imageCache'
import LazyImage from './LazyImage'

/** Image-sequence 360 only — shown when product.images360 has frames */
export default function Product360({ product }) {
  const wrap = useRef(null)
  const [pointerX, setPointerX] = useState(0.5)
  const frames = product?.images360?.length ? product.images360 : null

  // Preload every frame once so dragging never shows blank frames.
  useEffect(() => {
    for (const f of frames || []) warmMedia(f)
  }, [frames])

  if (!frames) return null
  const idx = Math.min(frames.length - 1, Math.max(0, Math.floor(pointerX * frames.length)))

  function onMove(clientX) {
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPointerX(Math.min(1, Math.max(0, (clientX - r.left) / r.width)))
  }

  return (
    <div
      ref={wrap}
      className="relative w-full aspect-[3/4] bg-[var(--color-paper-2)] border border-[var(--color-line)] overflow-hidden select-none touch-none"
      onMouseMove={(e) => onMove(e.clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
    >
      <LazyImage src={frames[idx]} alt="360 view" eager sizes="(min-width: 1024px) 50vw, 100vw" className="w-full h-full" imgClassName="transition-none" />
      <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] tracking-[0.14em] uppercase text-[var(--color-mute)] pointer-events-none">
        <span>360° · drag</span>
        <span>{idx + 1}/{frames.length}</span>
      </div>
    </div>
  )
}
