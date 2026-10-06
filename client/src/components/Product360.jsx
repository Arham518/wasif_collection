import { useRef, useState, useEffect } from 'react'
import { mediaUrl } from '../lib/utils'

/** Image-sequence 360 only — shown when product.images360 has frames */
export default function Product360({ product }) {
  const wrap = useRef(null)
  const [pointerX, setPointerX] = useState(0.5)
  const frames = product?.images360?.length ? product.images360 : null
  if (!frames?.length) return null
  const idx = Math.min(frames.length - 1, Math.max(0, Math.floor(pointerX * frames.length)))

  function onMove(clientX) {
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPointerX(Math.min(1, Math.max(0, (clientX - r.left) / r.width)))
  }

  useEffect(() => {
    function up() {}
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up) }
  }, [])

  return (
    <div
      ref={wrap}
      className="relative w-full aspect-[3/4] bg-[var(--color-paper-2)] border border-[var(--color-line)] overflow-hidden select-none touch-none"
      onMouseMove={(e) => onMove(e.clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
    >
      <img src={mediaUrl(frames[idx])} alt="360 view" className="w-full h-full object-cover" />
      <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] tracking-[0.14em] uppercase text-[var(--color-mute)] pointer-events-none">
        <span>360° · drag</span>
        <span>{idx + 1}/{frames.length}</span>
      </div>
    </div>
  )
}
