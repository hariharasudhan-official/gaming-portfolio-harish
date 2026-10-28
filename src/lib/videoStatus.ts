/**
 * Tiny store exposing each scene's video status to the UI (HUD "buffering" /
 * "fallback render" indicators) without coupling components to the engine.
 */
export type VideoStatus = 'idle' | 'loading' | 'ready' | 'error'

const statuses: VideoStatus[] = []
const listeners = new Set<() => void>()
let snapshot: readonly VideoStatus[] = []

export const videoStatusStore = {
  set(index: number, status: VideoStatus) {
    if (statuses[index] === status) return
    statuses[index] = status
    snapshot = [...statuses]
    listeners.forEach((fn) => fn())
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  getSnapshot: () => snapshot,
}
