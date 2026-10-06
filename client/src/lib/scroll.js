// Single place that owns the Lenis smooth-scroll instance, so drawers/modals
// can pause it (otherwise Lenis swallows wheel events inside scrollable panels).
let lenis = null
let locks = 0

export function setLenis(instance) {
  lenis = instance
  if (lenis && locks > 0) lenis.stop()
}

export function lockScroll() {
  locks += 1
  if (locks === 1) {
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
  }
}

export function unlockScroll() {
  if (locks === 0) return
  locks -= 1
  if (locks === 0) {
    document.documentElement.style.overflow = ''
    lenis?.start()
  }
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}
