import { useEffect, useRef, useCallback } from 'react'

/** Returns a stable function that calls `fn` only after `delay` ms of silence. */
export function useDebouncedCallback(fn, delay = 300) {
  const fnRef = useRef(fn)
  const timer = useRef(null)
  useEffect(() => { fnRef.current = fn })
  useEffect(() => () => clearTimeout(timer.current), [])
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fnRef.current(...args), delay)
  }, [delay])
}
