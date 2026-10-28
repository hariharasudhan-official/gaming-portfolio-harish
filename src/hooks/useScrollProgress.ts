import { useEffect, useRef, useSyncExternalStore } from 'react'
import { scrollStore, type ScrollFrame } from '../lib/scrollStore'

/**
 * Runs `callback` on every scroll frame WITHOUT re-rendering the component.
 * Use it to write styles / video time directly to refs.
 */
export function useScrollFrame(callback: (frame: ScrollFrame) => void) {
  const cb = useRef(callback)
  useEffect(() => {
    cb.current = callback
  })
  useEffect(() => scrollStore.subscribeFrame((f) => cb.current(f)), [])
}

/** The index of the chapter currently in view. Re-renders only on change. */
export function useActiveChapter(): number {
  return useSyncExternalStore(scrollStore.subscribeIndex, scrollStore.getActiveIndex, () => 0)
}

/**
 * Binds a CSS custom property (`--p` by default) on `ref` to a scroll value,
 * e.g. overall progress or a single chapter's progress. Zero React renders.
 */
export function useScrollVar<T extends HTMLElement>(
  select: (frame: ScrollFrame) => number,
  varName = '--p',
) {
  const ref = useRef<T>(null)
  useScrollFrame((f) => {
    ref.current?.style.setProperty(varName, select(f).toFixed(4))
  })
  return ref
}
