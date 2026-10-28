/**
 * Scroll store — the single source of truth for scroll-driven animation.
 *
 * One passive scroll listener schedules at most one rAF per frame. Each frame
 * it measures window.scrollY against the cached chapter ranges and notifies
 * frame subscribers (video engine, progress bars) without touching React.
 * React components only re-render when the *active chapter* changes, through
 * `useSyncExternalStore` in `useScrollProgress.ts`.
 *
 * The store only reads scroll position — it never writes it — so there is no
 * scroll ↔ video feedback loop and native scrolling is never hijacked.
 */

export interface ChapterRange {
  /** scrollY at which the chapter's top reaches the top of the viewport. */
  start: number
  /** scrollY at which the next chapter takes over (or the max scroll). */
  end: number
}

export interface ScrollFrame {
  scrollY: number
  viewportHeight: number
  /** 0..1 across the whole document. */
  progress: number
  /** Index of the chapter that currently owns the viewport. */
  activeIndex: number
  /** 0..1 progress through each chapter's own range. */
  chapterProgress: number[]
  ranges: ChapterRange[]
}

type FrameListener = (frame: ScrollFrame) => void
type Listener = () => void

let sections: HTMLElement[] = []
let ranges: ChapterRange[] = []
let frame: ScrollFrame = {
  scrollY: 0,
  viewportHeight: typeof window === 'undefined' ? 800 : window.innerHeight,
  progress: 0,
  activeIndex: 0,
  chapterProgress: [],
  ranges: [],
}

const frameListeners = new Set<FrameListener>()
const indexListeners = new Set<Listener>()
let rafId = 0
let started = false
let resizeObserver: ResizeObserver | null = null

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function measure() {
  const vh = window.innerHeight
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh)
  const tops = sections.map((el) => el.getBoundingClientRect().top + window.scrollY)
  ranges = tops.map((start, i) => ({
    start: Math.min(start, maxScroll),
    end: i < tops.length - 1 ? Math.min(tops[i + 1], maxScroll) : maxScroll,
  }))
  frame = { ...frame, viewportHeight: vh, ranges }
}

function compute() {
  rafId = 0
  const y = window.scrollY
  const vh = window.innerHeight
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh)

  let activeIndex = 0
  for (let i = 0; i < ranges.length; i++) {
    // A chapter owns the viewport once its top has crossed the middle of the
    // screen; this matches what the visitor perceives as "the current chapter".
    if (y + vh * 0.5 >= ranges[i].start) activeIndex = i
  }

  const chapterProgress = ranges.map((r) => clamp01((y - r.start) / Math.max(1, r.end - r.start)))
  const prevIndex = frame.activeIndex
  frame = {
    scrollY: y,
    viewportHeight: vh,
    progress: clamp01(y / maxScroll),
    activeIndex,
    chapterProgress,
    ranges,
  }

  frameListeners.forEach((fn) => fn(frame))
  if (activeIndex !== prevIndex) indexListeners.forEach((fn) => fn())
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(compute)
}

function onResize() {
  measure()
  schedule()
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', onResize, { passive: true })
  // Content height changes (fonts loading, reveals, images) shift chapter tops.
  resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(document.body)
  measure()
  schedule()
}

function stop() {
  if (!started) return
  started = false
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', onResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function maybeStop() {
  if (frameListeners.size === 0 && indexListeners.size === 0) stop()
}

export const scrollStore = {
  /** Register the chapter <section> elements in story order. */
  registerSections(els: HTMLElement[]) {
    sections = els
    if (started) {
      measure()
      schedule()
    }
  },

  /** Called every animation frame in which scroll or layout changed. */
  subscribeFrame(fn: FrameListener) {
    frameListeners.add(fn)
    start()
    // Deliver the current state immediately so subscribers can initialise.
    if (ranges.length) fn(frame)
    return () => {
      frameListeners.delete(fn)
      maybeStop()
    }
  },

  /** Called only when the active chapter index changes. */
  subscribeIndex(fn: Listener) {
    indexListeners.add(fn)
    start()
    return () => {
      indexListeners.delete(fn)
      maybeStop()
    }
  },

  getFrame: () => frame,
  getActiveIndex: () => frame.activeIndex,

  /** Force a re-measure (e.g. after a chapter's content expands). */
  refresh() {
    if (!started) return
    measure()
    schedule()
  },
}

/**
 * Scroll to a chapter using native smooth scrolling (instant when the visitor
 * prefers reduced motion). Moves keyboard focus to the chapter for a11y.
 */
export function scrollToChapter(index: number) {
  const el = sections[index]
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const top = el.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  el.focus({ preventScroll: true })
}

export function scrollToTop() {
  scrollToChapter(0)
}
