import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { SCENES } from '../config/scenes'
import { useScrollVar } from '../hooks/useScrollProgress'
import { scrollStore, scrollToChapter } from '../lib/scrollStore'
import type { ScrollFrame } from '../lib/scrollStore'
import '../styles/hud.css'

const TOTAL = String(SCENES.length).padStart(2, '0')
const LAST = SCENES.length - 1

/**
 * Rail fill: reaches marker `i` exactly when chapter `i` reaches the top of the
 * viewport, so the line lines up with the evenly spaced markers even though
 * chapters have different scroll lengths.
 */
function railFill(f: ScrollFrame) {
  if (!f.ranges.length || LAST <= 0) return f.progress
  let i = 0
  for (let k = 0; k < f.ranges.length; k++) if (f.scrollY >= f.ranges[k].start - 1) i = k
  const v = (i + (f.chapterProgress[i] ?? 0)) / LAST
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/* ============================================================================
   Side rail — vertical chapter markers (md and up)
   ========================================================================== */

interface ChapterRailProps {
  activeIndex: number
}

export function ChapterRail({ activeIndex }: ChapterRailProps) {
  const fillRef = useScrollVar<HTMLSpanElement>(railFill)

  return (
    <nav
      aria-label="Chapters"
      style={{ right: 'var(--hud-sb-gap, 0px)' }}
      className="pointer-events-none fixed top-1/2 z-50 hidden w-12 -translate-y-1/2 md:block lg:w-14"
    >
      <div className="relative flex flex-col items-center">
        {/* Track: spans from the centre of the first marker to the last. */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[22px] bottom-[22px] w-px -translate-x-1/2 bg-line"
        >
          <span
            ref={fillRef}
            className="hud-progress-y absolute inset-0 bg-gradient-to-b from-cyan via-cyan to-electric shadow-[0_0_8px_rgb(34_225_255/0.8)]"
          />
        </span>

        <span aria-hidden="true" className="hud-label mb-1 text-[9px] tracking-[0.2em] text-dim">
          CH
        </span>

        <ol className="relative flex flex-col items-center">
          {SCENES.map((scene, i) => {
            const active = i === activeIndex
            return (
              <li key={scene.id}>
                <button
                  type="button"
                  onClick={() => scrollToChapter(i)}
                  aria-label={`Go to chapter ${scene.number}: ${scene.title}`}
                  aria-current={active ? 'step' : undefined}
                  className="hud-marker pointer-events-auto relative flex h-11 w-11 items-center justify-center"
                >
                  {/* Focus ring (drawn inside so it never clips at the edge) */}
                  <span
                    aria-hidden="true"
                    className="hud-marker-ring absolute inset-1 border border-cyan opacity-0 transition-opacity"
                  />
                  <span
                    aria-hidden="true"
                    className={`hud-marker-dot block h-2.5 w-2.5 border ${
                      active ? '' : i < activeIndex ? 'border-cyan/70 bg-cyan/40' : 'border-muted/60 bg-ink'
                    }`}
                  />
                  {/* Tooltip: decorative — the accessible name lives on the button. */}
                  <span
                    aria-hidden="true"
                    className="hud-marker-tip pointer-events-none absolute right-full top-1/2 mr-1 -translate-y-1/2 whitespace-nowrap"
                  >
                    <span className="hud-panel block px-3 py-1.5 [--cut:6px]">
                      <span className="font-mono text-[11px] tracking-[0.18em] text-cyan">
                        {scene.number}
                      </span>
                      <span className="mx-2 text-dim">//</span>
                      <span className="font-display text-[13px] uppercase tracking-[0.12em] text-text">
                        {scene.title}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <span aria-hidden="true" className="hud-label mt-1 text-[9px] tracking-[0.2em] text-dim">
          {TOTAL}
        </span>
      </div>
    </nav>
  )
}

/* ============================================================================
   Chapter-select overlay — AAA pause menu
   ========================================================================== */

export const CHAPTER_MENU_ID = 'chapter-select-menu'

interface ChapterMenuProps {
  open: boolean
  activeIndex: number
  /** Close without navigating (Escape, close button, backdrop). */
  onClose: () => void
  /** Navigate to a chapter; the parent closes the menu. */
  onSelect: (index: number) => void
}

export function ChapterMenu({ open, activeIndex, onClose, onSelect }: ChapterMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <ChapterMenuPanel key="chapter-menu" activeIndex={activeIndex} onClose={onClose} onSelect={onSelect} />
      )}
    </AnimatePresence>
  )
}

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -24, filter: 'blur(6px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

function ChapterMenuPanel({ activeIndex, onClose, onSelect }: Omit<ChapterMenuProps, 'open'>) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Snapshot taken once on open; the page cannot scroll while the menu is up.
  const [explored] = useState(() => Math.round(scrollStore.getFrame().progress * 100))
  const current = SCENES[activeIndex] ?? SCENES[0]

  const [openedAt] = useState(activeIndex)

  useEffect(() => {
    const target = itemRefs.current[openedAt] ?? dialogRef.current
    target?.focus({ preventScroll: true })
    // Only on open: focus the current chapter so Enter resumes there.
  }, [openedAt])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      const items = itemRefs.current.filter((el): el is HTMLButtonElement => !!el)
      const idx = items.indexOf(document.activeElement as HTMLButtonElement)
      if (idx === -1) return
      e.preventDefault()
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? items.length - 1
            : (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      items[next]?.focus()
      return
    }

    if (e.key === 'Tab') {
      const root = dialogRef.current
      if (!root) return
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (!focusables.length) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey && (activeEl === first || !root.contains(activeEl))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeEl === last || !root.contains(activeEl))) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <motion.div
      ref={dialogRef}
      id={CHAPTER_MENU_ID}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-select-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Atmosphere layers */}
      <div aria-hidden="true" className="hud-menu-backdrop absolute inset-0" />
      <div aria-hidden="true" className="hud-menu-grid pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="scanlines pointer-events-none absolute inset-0 opacity-60" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Top strip */}
      <div className="safe-top relative z-10">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8 lg:px-10">
          <p className="hud-label flex items-center gap-2.5 text-[11px]" aria-hidden="true">
            <span className="inline-block h-2 w-2 bg-amber shadow-[0_0_10px_rgb(255_176_46/0.8)] animate-blink" />
            <span className="text-amber">Paused</span>
            <span className="text-dim">—</span>
            <span>Chapter Select</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chapter select and resume"
            className="hud-control pointer-events-auto inline-flex h-11 min-w-11 items-center justify-center gap-2 px-3 text-cyan md:px-4"
          >
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.22em] sm:inline">Resume</span>
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="safe-bottom relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-12 pt-4 md:px-16 md:pt-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14 lg:px-24 lg:pt-12">
          <div>
            <motion.p
              aria-hidden="true"
              className="hud-label text-muted"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
            >
              CODEVERSE <span className="text-dim">//</span> The developer&apos;s journey
            </motion.p>
            <motion.h2
              id="chapter-select-title"
              className="text-glow mt-3 font-display text-4xl font-semibold uppercase leading-none tracking-[0.06em] text-text md:text-6xl"
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
              transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Chapter Select
            </motion.h2>
            <div aria-hidden="true" className="mt-5 flex items-center gap-3">
              <span className="h-px w-16 bg-cyan" />
              <span className="h-1 w-1 bg-amber" />
              <span className="h-px flex-1 bg-line" />
            </div>

            <motion.ol
              className="mt-8 flex flex-col gap-2.5"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {SCENES.map((scene, i) => {
                const active = i === activeIndex
                const cleared = i < activeIndex
                return (
                  <motion.li key={scene.id} variants={itemVariants}>
                    <button
                      ref={(el) => {
                        itemRefs.current[i] = el
                      }}
                      type="button"
                      onClick={() => onSelect(i)}
                      aria-current={active ? 'step' : undefined}
                      className="hud-menu-item group relative flex min-h-[72px] w-full items-center gap-4 py-3.5 pl-5 pr-4 text-left md:gap-6 md:pl-6 md:pr-6"
                    >
                      <span
                        aria-hidden="true"
                        className="hud-menu-item-bar absolute inset-y-3 left-0 w-[3px] bg-cyan shadow-[0_0_10px_rgb(34_225_255/0.9)]"
                      />
                      <span
                        className={`w-10 shrink-0 font-mono text-2xl tabular-nums md:w-14 md:text-3xl ${
                          active ? 'text-cyan text-glow' : 'text-muted'
                        }`}
                      >
                        <span className="sr-only">Chapter </span>
                        {scene.number}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span
                            className={`font-display text-lg font-semibold uppercase tracking-[0.08em] md:text-2xl ${
                              active ? 'text-text' : 'text-text/90'
                            }`}
                          >
                            {scene.title}
                          </span>
                          {active && (
                            <span className="tag-chip border-cyan/50 text-cyan">
                              <span aria-hidden="true" className="h-1.5 w-1.5 bg-cyan animate-pulse-slow" />
                              Current
                            </span>
                          )}
                          {cleared && (
                            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                              <span className="sr-only">, </span>Cleared
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[15px] text-muted">
                          <span className="sr-only">— </span>
                          {scene.caption}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className={`hud-menu-item-arrow h-5 w-5 shrink-0 ${active ? 'text-cyan' : 'text-muted'}`}
                      />
                    </button>
                  </motion.li>
                )
              })}
            </motion.ol>
          </div>

          {/* Status column — decorative save-data readout */}
          <motion.aside
            aria-label="Journey status"
            className="hidden lg:block"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hud-panel sticky top-4 p-6">
              <span aria-hidden="true" className="hud-corner right-2 top-2 border-r border-t" />
              <span aria-hidden="true" className="hud-corner bottom-2 left-2 border-b border-l" />

              <p className="hud-label text-muted">Save data</p>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Now playing</p>
              <p className="mt-1 font-display text-xl font-semibold uppercase tracking-[0.08em] text-text">
                <span className="text-cyan">{current.number}</span>
                <span aria-hidden="true" className="mx-2 text-dim">
                  /
                </span>
                {current.title}
              </p>
              <p className="mt-1 text-[15px] text-muted">{current.caption}</p>

              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Explored</p>
                  <p className="font-mono text-sm tabular-nums text-cyan">{explored}%</p>
                </div>
                <div aria-hidden="true" className="mt-2 h-1 w-full bg-steel">
                  <div
                    className="h-full bg-gradient-to-r from-cyan to-electric shadow-[0_0_10px_rgb(34_225_255/0.6)]"
                    style={{ width: `${explored}%` }}
                  />
                </div>
              </div>

              <ul aria-hidden="true" className="mt-6 grid grid-cols-6 gap-1">
                {SCENES.map((s, i) => (
                  <li
                    key={s.id}
                    className={`h-1.5 ${
                      i < activeIndex ? 'bg-cyan/60' : i === activeIndex ? 'bg-amber' : 'bg-steel'
                    }`}
                  />
                ))}
              </ul>

              <dl className="mt-6 space-y-2 border-t border-line pt-5 font-mono text-[11px] uppercase tracking-[0.18em]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Navigate</dt>
                  <dd className="text-text">↑ ↓</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Select</dt>
                  <dd className="text-text">Enter</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Resume</dt>
                  <dd className="text-text">Esc</dd>
                </div>
              </dl>
            </div>
          </motion.aside>
        </div>
      </div>
    </motion.div>
  )
}
