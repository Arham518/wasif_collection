import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { lockScroll, unlockScroll } from '../lib/scroll'

/**
 * Side drawer rendered in a portal on <body>, so no parent (e.g. the sticky,
 * backdrop-blurred header) can clip it. Locks page scroll and pauses Lenis
 * while open, closes on overlay click / Escape, and lets its own content scroll.
 */
export default function Drawer({ open, onClose, side = 'left', title, children, footer, bodyClass = 'p-5', widthClass = 'w-[85%] max-w-xs', zClass = 'z-[80]', id, closeAbove }) {
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    lockScroll()
    const prev = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      unlockScroll()
      if (prev && typeof prev.focus === 'function') prev.focus({ preventScroll: true })
    }
  }, [open])

  // Auto-close if the viewport grows past the breakpoint where the drawer isn't used.
  useEffect(() => {
    if (!open || !closeAbove || !window.matchMedia) return
    const mq = window.matchMedia(`(min-width: ${closeAbove}px)`)
    const onChange = () => { if (mq.matches) onCloseRef.current?.() }
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [open, closeAbove])

  if (!open) return null
  const right = side === 'right'
  return createPortal(
    <div className={`fixed inset-0 ${zClass}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} id={id}>
      <div className="absolute inset-0 bg-black/40 anim-fade-in" onClick={onClose} />
      <aside
        className={`absolute top-0 bottom-0 ${right ? 'right-0 border-l anim-slide-in-right' : 'left-0 border-r anim-slide-in-left'} ${widthClass} bg-[var(--color-paper)] border-[var(--color-line)] flex flex-col shadow-2xl`}
      >
        <div className="flex justify-between items-center px-5 h-14 shrink-0 border-b border-[var(--color-line)]">
          <span className="font-display text-xl">{title}</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="p-1 -mr-1"><X size={20} /></button>
        </div>
        <div className={`flex-1 overflow-y-auto overscroll-contain ${bodyClass}`} data-lenis-prevent>
          {children}
        </div>
        {footer && <div className="shrink-0 border-t border-[var(--color-line)] p-4">{footer}</div>}
      </aside>
    </div>,
    document.body,
  )
}
