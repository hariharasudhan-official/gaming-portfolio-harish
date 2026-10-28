import { motion, type Variants } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { SCENES } from '../../config/scenes'
import { hero, profile } from '../../data/portfolio'
import { useScrollFrame, useScrollVar } from '../../hooks/useScrollProgress'
import { useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery'
import { scrollToChapter } from '../../lib/scrollStore'
import { useChapter } from '../ui/chapterContext'
import '../../styles/hero.css'

/** Words that receive the cyan glow accent (punctuation ignored). */
const ACCENT_WORDS = new Set(['WORLD', 'BUILD'])

/** Purely decorative boot log — hidden from assistive tech. */
const BOOT_LOG = [
  { text: '> mount world.core ........ ok', delay: 0.5 },
  { text: '> sync render.pipeline .... ok', delay: 1.1 },
  { text: '> link player.session ..... ready', delay: 1.7 },
]

/** Seconds before the title starts assembling — lets the boot fade breathe. */
const TITLE_DELAY = 0.9
const EASE = [0.16, 1, 0.3, 1] as const

const glyph: Variants = {
  hidden: { opacity: 0, y: '0.35em', filter: 'blur(14px)' },
  show: (i: number) => ({
    opacity: 1,
    y: '0em',
    filter: 'blur(0px)', transitionEnd: { filter: 'none' },
    transition: { duration: 0.85, delay: TITLE_DELAY + i, ease: EASE },
  }),
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)', transitionEnd: { filter: 'none' },
    transition: { duration: 0.9, delay, ease: EASE },
  }),
}

const isAccent = (word: string) => ACCENT_WORDS.has(word.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase())

function AnimatedTitle({ text, perWord, animate }: { text: string; perWord: boolean; animate: boolean }) {
  const words = text.split(/\s+/).filter(Boolean)
  let charIndex = 0
  const step = perWord ? 0.09 : 0.028

  return (
    <span aria-hidden="true">
      {words.map((word, wi) => {
        const accent = isAccent(word)
        const cls = `inline-block whitespace-nowrap ${accent ? 'text-cyan text-glow' : ''}`
        const node = perWord ? (
          <motion.span
            key={wi}
            className={cls}
            variants={glyph}
            custom={wi * step}
            initial={animate ? 'hidden' : false}
            animate="show"
          >
            {word}
          </motion.span>
        ) : (
          <span key={wi} className={cls}>
            {Array.from(word).map((ch, ci) => {
              const i = charIndex++
              return (
                <motion.span
                  key={ci}
                  className="inline-block"
                  variants={glyph}
                  custom={i * step}
                  initial={animate ? 'hidden' : false}
                  animate="show"
                >
                  {ch}
                </motion.span>
              )
            })}
          </span>
        )
        return (
          <span key={wi}>
            {node}
            {wi < words.length - 1 ? ' ' : null}
          </span>
        )
      })}
    </span>
  )
}

export default function AwakeningChapter() {
  const { headingId, index } = useChapter()
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const animate = !reduce

  const progress = (f: { chapterProgress: number[] }) => f.chapterProgress[index] ?? 0
  const driftRef = useScrollVar<HTMLDivElement>(progress)
  const cueRef = useScrollVar<HTMLDivElement>(progress)

  // Once the cue has faded out, take it out of the tab order / hit testing.
  useScrollFrame((f) => {
    const el = cueRef.current
    if (!el) return
    const gone = (f.chapterProgress[index] ?? 0) > 0.14
    if (el.inert !== gone) el.inert = gone
    el.style.visibility = gone ? 'hidden' : ''
  })

  const total = String(SCENES.length).padStart(2, '0')
  const current = SCENES[index].number
  const titleWordCount = hero.title.split(/\s+/).length
  const titleChars = hero.title.replace(/\s+/g, '').length
  // When the headline has finished assembling.
  const afterTitle = TITLE_DELAY + (isMobile ? titleWordCount * 0.09 : titleChars * 0.028) + 0.2
  const reveal = (delay: number) => ({
    variants: fadeUp,
    custom: animate ? delay : 0,
    initial: animate ? ('hidden' as const) : false,
    animate: 'show' as const,
  })

  return (
    <div className="sticky top-0 h-[100lvh] min-h-[560px] overflow-hidden">
      {/* Readability scrim + one-shot scan beam */}
      <div className="awk-scrim pointer-events-none absolute inset-0" aria-hidden="true" />
      {animate && <div className="awk-beam" aria-hidden="true" />}

      <div
        ref={driftRef}
        className="awk-drift relative flex h-full flex-col justify-between px-6 pb-36 pt-24 md:px-16 md:pb-24 md:pt-28 lg:pl-24 lg:pr-28"
      >
        {/* ---- Boot sequence ---------------------------------------------- */}
        <motion.div {...reveal(0.2)} className="max-w-full">
          <p className="hud-label flex items-center gap-3">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inset-0 animate-pulse-slow bg-cyan" />
            </span>
            <span>{hero.hudLabel}</span>
            <span className="animate-blink text-cyan" aria-hidden="true">
              _
            </span>
          </p>
          <div
            className="mt-4 hidden w-[19rem] max-w-full border-l border-cyan/25 pl-3 font-mono text-[0.6875rem] leading-6 tracking-wider text-muted/80 sm:block"
            aria-hidden="true"
          >
            {BOOT_LOG.map((line) => (
              <span key={line.text} className="awk-boot-line" style={{ animationDelay: `${line.delay}s` }}>
                {line.text}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ---- Title block ------------------------------------------------- */}
        <div className="max-w-[min(52rem,72vw)] max-md:max-w-none">
          <motion.p {...reveal(TITLE_DELAY - 0.3)} className="hud-label mb-5 flex items-center gap-3 text-muted">
            <span className="inline-block h-px w-10 bg-cyan/70" aria-hidden="true" />
            <span>
              CH {current} <span className="text-dim">//</span> {SCENES[index].title}
            </span>
          </motion.p>

          <h1
            id={headingId}
            className="font-display text-[clamp(2.4rem,min(6.6vw,11vh),6.25rem)] font-bold uppercase leading-[0.95] tracking-[0.01em] text-text"
          >
            <span className="sr-only">{hero.title}</span>
            <AnimatedTitle text={hero.title} perWord={isMobile} animate={animate} />
          </h1>

          <motion.div {...reveal(afterTitle)} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <span className="hidden h-px w-14 bg-gradient-to-r from-cyan to-transparent sm:block" aria-hidden="true" />
            <p className="font-display text-lg font-semibold uppercase tracking-[0.32em] text-text md:text-xl">
              {profile.name}
            </p>
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
            <p className="font-mono text-[0.9375rem] uppercase tracking-[0.14em] text-muted">{profile.role}</p>
          </motion.div>
        </div>
      </div>

      {/* ---- Scroll cue + chapter indicator --------------------------------- */}
      <div
        ref={cueRef}
        className="awk-cue absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-14 md:left-auto md:right-16 md:translate-x-0 lg:right-28"
      >
        <motion.div {...reveal(afterTitle + 0.3)}>
          <button
            type="button"
            onClick={() => scrollToChapter(index + 1)}
            className="group flex min-h-11 min-w-11 flex-col items-center gap-2 px-3 py-1 text-cyan transition-colors hover:text-cyan-soft"
          >
            <span className="font-mono text-[0.6875rem] tracking-[0.3em] text-muted" aria-hidden="true">
              <span className="text-text">{current}</span> / {total}
            </span>
            <span className="hud-label whitespace-nowrap">Scroll to begin</span>
            <span className="awk-cue-line hidden md:block" aria-hidden="true" />
            <ChevronDown className="h-4 w-4 animate-pulse-slow" aria-hidden="true" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
