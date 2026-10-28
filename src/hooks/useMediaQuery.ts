import { useSyncExternalStore } from 'react'
import { VIDEO_ENGINE } from '../config/scenes'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

export const useIsMobile = () => useMediaQuery(`(max-width: ${VIDEO_ENGINE.mobileBreakpoint - 1}px)`)

/** True for mouse/trackpad devices; false for touch-first devices. */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')
