import { motion, type Variants } from 'framer-motion'
import { Activity, CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { experience, type ExperienceEntry } from '../data/portfolio'
import { useScrollVar } from '../hooks/useScrollProgress'
import { HudPanel } from './ui/HudPanel'
import '../styles/timeline.css'

const EASE = [0.16, 1, 0.3, 1] as const

const entryVariants: Variants = {
  hidden: { opacity: 0, x: -28, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)', transitionEnd: { filter: 'none' },
    transition: { duration: 0.85, ease: EASE, staggerChildren: 0.09, delayChildren: 0.35 },
  },
}

const nodeVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0.35 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.6, ease: EASE } },
}

const lineVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** "Feb 2026" → "2026-02"; anything else → null (rendered as plain text). */
function toDateTime(label: string): string | null {
  const m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(label.trim())
  if (!m) return null
  const month = MONTHS.indexOf(m[1].toLowerCase())
  if (month < 0) return null
  return `${m[2]}-${String(month + 1).padStart(2, '0')}`
}

function PeriodPart({ label }: { label: string }) {
  const dt = toDateTime(label)
  return dt ? <time dateTime={dt}>{label}</time> : <span>{label}</span>
}

function Period({ period }: { period: string }) {
  const parts = period.split(/\s*[–—-]\s*/)
  if (parts.length !== 2) return <PeriodPart label={period} />
  return (
    <>
      <PeriodPart label={parts[0]} />
      <span className="px-1.5 text-dim" aria-hidden="true">
        →
      </span>
      <span className="sr-only"> to </span>
      <PeriodPart label={parts[1]} />
    </>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

function ExperienceItem({ entry, index }: { entry: ExperienceEntry; index: number }) {
  const [lit, setLit] = useState(false)
  const accent = entry.current ? 'text-amber' : 'text-cyan'

  return (
    <motion.li
      className="xp-entry relative pl-10 sm:pl-12"
      data-lit={lit}
      data-current={entry.current}
      variants={entryVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
      onViewportEnter={() => setLit(true)}
    >
      <motion.span className="xp-node" variants={nodeVariants} aria-hidden="true">
        <span className="xp-node-ring" />
        <span className="xp-node-core" />
      </motion.span>

      <HudPanel as="article" className="xp-panel px-5 py-6 sm:px-7 sm:py-7" corners={false}>
        <span className="hud-corner right-2 top-2 border-r border-t border-amber/80" aria-hidden="true" />
        <span className="hud-corner bottom-2 left-2 border-b border-l" aria-hidden="true" />

        <header>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className={`hud-label tracking-[0.2em] ${accent}`}>
              <span aria-hidden="true">LOG-</span>
              <span className="sr-only">Entry </span>
              {pad(index + 1)}
            </p>
            {entry.current ? (
              <p className="inline-flex items-center gap-2 border border-amber/50 bg-amber/10 px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.2em] text-amber">
                <span className="xp-status-dot inline-block size-1.5 animate-pulse-slow bg-amber" aria-hidden="true" />
                <Activity className="size-3.5" aria-hidden="true" />
                ACTIVE
              </p>
            ) : (
              <p className="inline-flex items-center gap-2 border border-cyan/35 bg-cyan/[0.06] px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.2em] text-cyan-soft">
                <CircleCheck className="size-3.5" aria-hidden="true" />
                COMPLETED
              </p>
            )}
          </div>

          <h3 className="mt-4 font-display text-2xl font-semibold uppercase leading-tight text-text sm:text-[1.75rem]">
            {entry.company}
          </h3>
          <p className={`mt-1.5 font-display text-base font-medium tracking-wide sm:text-lg ${accent}`}>
            {entry.role}
          </p>
          <p className="mt-2 font-mono text-[0.8125rem] tracking-wider text-muted">
            <span className="text-dim" aria-hidden="true">
              PERIOD ::{' '}
            </span>
            <Period period={entry.period} />
          </p>
        </header>

        <div className="mt-5 h-px bg-gradient-to-r from-amber/40 via-line to-transparent" aria-hidden="true" />

        <ul className="mt-5 space-y-3 font-mono text-[0.9375rem] leading-relaxed" aria-label={`${entry.company} highlights`}>
          {entry.highlights.map((line, i) => (
            <motion.li key={line} variants={lineVariants} className="flex gap-3">
              <span className={`xp-line-index shrink-0 select-none text-[0.8125rem] leading-[1.6rem] ${accent} opacity-80`} aria-hidden="true">
                [{pad(i + 1)}]
              </span>
              <span className="min-w-0 text-text/90">
                <span className="select-none text-amber/80" aria-hidden="true">
                  {'> '}
                </span>
                {line}
              </span>
            </motion.li>
          ))}
        </ul>

        {entry.current && (
          <motion.p variants={lineVariants} className="mt-4 font-mono text-[0.8125rem] text-amber/80" aria-hidden="true">
            {'> '}process running<span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-blink bg-amber" />
          </motion.p>
        )}
      </HudPanel>
    </motion.li>
  )
}

/**
 * Vertical mission-log timeline. The spine fill follows the visitor's scroll
 * through the chapter via a CSS variable (no React re-renders).
 */
export default function ExperienceTimeline({ chapterIndex }: { chapterIndex: number }) {
  // Progress of a reading line (65% down the viewport) through this chapter's
  // range — chapter progress shifted so the fill tracks what is on screen.
  const listRef = useScrollVar<HTMLSpanElement>((f) => {
    const r = f.ranges[chapterIndex]
    if (!r) return f.chapterProgress[chapterIndex] ?? 0
    const span = Math.max(1, r.end - r.start)
    const p = (f.scrollY + f.viewportHeight * 0.65 - r.start) / span
    return Math.min(1, Math.max(0, p * 1.15 - 0.1))
  }, '--log-p')

  return (
    <div className="relative">
      <span ref={listRef} className="xp-spine" aria-hidden="true">
        <span className="xp-spine-fill" />
        <span className="xp-spine-head" />
      </span>
      <ol className="relative flex flex-col gap-[14vh] md:gap-[18vh]" aria-label="Experience timeline">
        {experience.map((entry, i) => (
          <ExperienceItem key={entry.id} entry={entry} index={i} />
        ))}
      </ol>
    </div>
  )
}
