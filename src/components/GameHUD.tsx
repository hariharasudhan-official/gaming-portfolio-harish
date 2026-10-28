import { Menu } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { SCENES, chapterDomId } from '../config/scenes'
import { useActiveChapter, useScrollFrame, useScrollVar } from '../hooks/useScrollProgress'
import { scrollToChapter, scrollToTop } from '../lib/scrollStore'
import { videoStatusStore, type VideoStatus } from '../lib/videoStatus'
import { CHAPTER_MENU_ID, ChapterMenu, ChapterRail } from './ChapterNavigation'
import '../styles/hud.css'

const TOTAL = String(SCENES.length).padStart(2, '0')

const STATUS_COPY: Record<VideoStatus, { label: string; tone: string }> = {
  idle: { label: 'Buffering scene', tone: 'bg-muted' },
  loading: { label: 'Buffering scene', tone: 'bg-amber animate-pulse-slow' },
  ready: { label: 'Signal locked', tone: 'bg-cyan' },
  error: { label: 'Fallback render', tone: 'bg-ember' },
}

const SB_GAP_VAR = '--hud-sb-gap'

/**
 * Locks document scroll (keeps scroll position, compensates scrollbar).
 * The gap is also exposed as --hud-sb-gap so the fixed HUD bars (.hud-fixed-x)
 * stay put instead of stretching under the vanished scrollbar on open and
 * snapping back on close.
 */
function lockScroll() {
  const html = document.documentElement
  const prevOverflow = html.style.overflow
  const prevPadding = html.style.paddingRight
  const prevGapVar = html.style.getPropertyValue(SB_GAP_VAR)
  const gap = window.innerWidth - html.clientWidth
  if (gap > 0) {
    html.style.paddingRight = `${gap}px`
    html.style.setProperty(SB_GAP_VAR, `${gap}px`)
  }
  html.style.overflow = 'hidden'
  let released = false
  return () => {
    if (released) return
    released = true
    html.style.overflow = prevOverflow
    html.style.paddingRight = prevPadding
    if (prevGapVar) html.style.setProperty(SB_GAP_VAR, prevGapVar)
    else html.style.removeProperty(SB_GAP_VAR)
  }
}

export default function GameHUD() {
  const activeIndex = useActiveChapter()
  const scene = SCENES[activeIndex] ?? SCENES[0]
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const unlockRef = useRef<(() => void) | null>(null)
  const returnFocusRef = useRef(true)

  const statuses = useSyncExternalStore(
    videoStatusStore.subscribe,
    videoStatusStore.getSnapshot,
    videoStatusStore.getSnapshot,
  )
  const status = STATUS_COPY[statuses[activeIndex] ?? 'loading']

  // Scroll-bound visuals: CSS vars / text written directly, zero React renders.
  const bottomBarRef = useScrollVar<HTMLDivElement>((f) => f.progress)
  const percentRef = useRef<HTMLSpanElement>(null)
  const segmentRefs = useRef<(HTMLSpanElement | null)[]>([])
  useScrollFrame((f) => {
    if (percentRef.current) {
      percentRef.current.textContent = String(Math.round(f.progress * 100)).padStart(3, '0')
    }
    segmentRefs.current.forEach((el, i) => {
      if (!el) return
      const v = i < f.activeIndex ? 1 : i > f.activeIndex ? 0 : (f.chapterProgress[i] ?? 0)
      el.style.setProperty('--p', v.toFixed(3))
    })
  })

  // Body scroll lock + focus return while the chapter-select menu is open.
  useEffect(() => {
    if (!menuOpen) return
    const menuButton = menuButtonRef.current
    unlockRef.current = lockScroll()
    return () => {
      unlockRef.current?.()
      unlockRef.current = null
      if (returnFocusRef.current) menuButton?.focus({ preventScroll: true })
      returnFocusRef.current = true
    }
  }, [menuOpen])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const selectChapter = useCallback((index: number) => {
    // Release the lock first so the smooth scroll can run; focus then moves to
    // the chapter section (scrollToChapter) instead of back to the menu button.
    returnFocusRef.current = false
    unlockRef.current?.()
    unlockRef.current = null
    scrollToChapter(index)
    setMenuOpen(false)
  }, [])

  const onLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToTop()
  }

  return (
    <>
      {/* ================= Top bar ================= */}
      <header className="hud-fixed-x safe-top pointer-events-none fixed top-0 z-50">
        {/* Backing: masked blur strip + tall scrim so scrolling content never reads through the bar */}
        <div aria-hidden="true" className="hud-top-blur pointer-events-none" />
        <div aria-hidden="true" className="hud-top-fade pointer-events-none" />

        <div className="hud-top-bar relative flex h-16 items-center justify-between gap-2 sm:gap-3">
          {/* Logo */}
          <a
            href={`#${chapterDomId(SCENES[0])}`}
            onClick={onLogoClick}
            aria-label="CODEVERSE — back to chapter 01"
            className="group pointer-events-auto -ml-1 flex min-h-11 min-w-0 items-center gap-2.5 px-1 focus-visible:outline-offset-2 sm:gap-3"
          >
            <span aria-hidden="true" className="hud-mark relative grid h-8 w-8 shrink-0 place-items-center">
              <span className="hud-mark-inner absolute inset-[2px]" />
              <span className="relative font-display text-[13px] font-bold tracking-tight text-cyan transition-colors group-hover:text-cyan-soft">
                CV
              </span>
            </span>
            <span aria-hidden="true" className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-[0.28em] text-text transition-colors group-hover:text-cyan-soft md:text-base">
                CODEVERSE
              </span>
              <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.26em] text-muted sm:block">
                The developer&apos;s journey
              </span>
            </span>
          </a>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3 md:gap-5">
            <div className="flex items-center gap-4 text-right" aria-hidden="true">
              <div className="hidden flex-col items-end md:flex">
                <span key={`title-${activeIndex}`} className="hud-glitch font-display text-sm font-semibold uppercase tracking-[0.16em] text-text">
                  {scene.title}
                </span>
                <span className="mt-1.5 flex gap-1">
                  {SCENES.map((s, i) => (
                    <span key={s.id} className="relative h-[3px] w-4 overflow-hidden bg-steel">
                      <span
                        ref={(el) => {
                          segmentRefs.current[i] = el
                        }}
                        className="hud-progress-x absolute inset-0 bg-cyan"
                      />
                    </span>
                  ))}
                </span>
              </div>
              <span className="flex items-baseline gap-1 font-mono tabular-nums">
                <span key={`num-${activeIndex}`} className="hud-glitch text-glow text-lg font-semibold text-cyan md:text-xl">
                  {scene.number}
                </span>
                <span className="text-xs text-muted md:mx-0.5">/</span>
                <span className="text-xs text-muted">{TOTAL}</span>
              </span>
            </div>
            {/* Screen-reader readout of the same info */}
            <p className="sr-only">
              Chapter {scene.number} of {TOTAL}: {scene.title}
            </p>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls={CHAPTER_MENU_ID}
              className="hud-control pointer-events-auto inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 px-2.5 text-cyan md:gap-2 md:px-4"
            >
              <Menu aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] md:text-[11px] md:tracking-[0.22em]">Menu</span>
            </button>
          </div>
        </div>

        {/* One-shot scan sweep on chapter change */}
        <div aria-hidden="true" className="relative h-px overflow-hidden">
          <span key={`sweep-${activeIndex}`} className="hud-sweep absolute inset-y-0 left-0 w-full" />
        </div>
      </header>

      {/* ================= Side rail ================= */}
      <ChapterRail activeIndex={activeIndex} />

      {/* ================= Bottom bar ================= */}
      <div
        ref={bottomBarRef}
        aria-hidden="true"
        className="hud-fixed-x safe-bottom pointer-events-none fixed bottom-0 z-50"
      >
        <div className="hud-bottom-blur pointer-events-none hidden md:block" />
        <div className="hud-bottom-fade pointer-events-none hidden md:block" />

        {/* Overall scroll progress */}
        <div className="relative h-[2px] w-full bg-line/60">
          <div className="hud-progress-x absolute inset-0 bg-gradient-to-r from-cyan via-cyan to-electric shadow-[0_0_10px_rgb(34_225_255/0.7)]" />
        </div>

        <div className="relative hidden h-10 items-center justify-between gap-6 px-8 font-mono text-[10px] uppercase tracking-[0.24em] md:flex lg:px-10">
          <div className="flex items-center gap-5">
            <span className="text-cyan">Exploration mode</span>
            <span className="hidden h-3 w-px bg-line lg:block" />
            <span className="hidden text-muted lg:inline">Player 01</span>
            <span className="hidden h-3 w-px bg-line lg:block" />
            <span className="hidden text-muted lg:inline">
              Progress <span ref={percentRef} className="tabular-nums text-text">000</span>%
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span key={`status-${activeIndex}-${status.label}`} className="hud-glitch flex items-center gap-2 text-muted">
              <span className={`h-1.5 w-1.5 ${status.tone}`} />
              {status.label}
            </span>
            <span className="h-3 w-px bg-line" />
            <span className="flex items-center gap-2 text-text">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-cyan animate-pulse-slow" />
                <span className="absolute -inset-1 rounded-full bg-cyan/25 animate-pulse-slow" />
              </span>
              System online
            </span>
          </div>
        </div>
      </div>

      {/* ================= Chapter select overlay ================= */}
      <ChapterMenu open={menuOpen} activeIndex={activeIndex} onClose={closeMenu} onSelect={selectChapter} />
    </>
  )
}
