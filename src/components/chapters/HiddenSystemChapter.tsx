import { Lock, Terminal } from 'lucide-react'
import { experience } from '../../data/portfolio'
import ExperienceTimeline from '../ExperienceTimeline'
import { ChapterTag } from '../ui/ChapterTag'
import { Reveal } from '../ui/Reveal'
import { useChapter } from '../ui/chapterContext'

const pad = (n: number) => String(n).padStart(2, '0')

/** Chapter 04 — The Hidden System: experience as an underground mission log. */
export default function HiddenSystemChapter() {
  const { headingId, scene, index } = useChapter()
  const activeCount = experience.filter((e) => e.current).length

  return (
    <div className="relative" style={{ minHeight: 'inherit' }}>
      {/* Readability scrims — left column on desktop, soft full wash on mobile.
          Masked at top/bottom so they melt into the neighbouring chapters. */}
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{
          background: 'rgb(3 4 6 / 0.55)',
          maskImage: 'linear-gradient(180deg, transparent, #000 10%, #000 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 10%, #000 90%, transparent)',
        }}
        aria-hidden="true"
      />
      <div
        className="scrim-left pointer-events-none absolute inset-y-0 left-0 hidden w-[68%] md:block"
        style={{
          maskImage: 'linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent)',
        }}
        aria-hidden="true"
      />
      {/* Faint amber furnace glow from below-left — the underground. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 md:block"
        style={{
          background:
            'radial-gradient(ellipse 70% 30% at 10% 70%, rgb(255 176 46 / 0.07), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div
        className="relative flex flex-col justify-between gap-[12vh] px-6 pb-36 pt-[22vh] md:px-16 lg:pl-24 lg:pr-28"
        style={{ minHeight: 'inherit' }}
      >
        <div className="w-full max-w-xl lg:max-w-[min(46vw,40rem)]">
          {/* ---- Heading ---------------------------------------------------- */}
          <header>
            <Reveal x={-24} y={0}>
              <ChapterTag className="text-amber" />
            </Reveal>
            <Reveal delay={0.1} x={-24} y={0}>
              <h2
                id={headingId}
                className="mt-5 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-bold uppercase leading-[0.95] text-text"
              >
                <span className="block text-[0.42em] font-medium tracking-[0.3em] text-amber text-glow-amber">The</span>{' '}
                <span className="text-glow">{scene.title.replace(/^the\s+/i, '')}</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2} x={-24} y={0}>
              <p className="mt-4 flex items-center gap-3 font-mono text-[0.9375rem] uppercase tracking-[0.22em] text-muted">
                <span className="inline-block h-px w-10 bg-amber/70" aria-hidden="true" />
                {scene.caption}
              </p>
            </Reveal>

            {/* ---- Decorative terminal bar ---------------------------------- */}
            <Reveal delay={0.35} y={12} blur={false}>
              <div className="xp-term mt-10 font-mono text-[0.6875rem] tracking-[0.18em] text-amber" aria-hidden="true">
                <div className="flex items-center gap-3 border-b border-amber/20 px-4 py-2.5">
                  <span className="flex gap-1.5">
                    <span className="size-2 bg-amber/80" />
                    <span className="size-2 bg-amber/40" />
                    <span className="size-2 bg-cyan/50" />
                  </span>
                  <Terminal className="size-3.5" />
                  <span className="truncate">SYS://MISSION_LOG</span>
                  <span className="text-dim">—</span>
                  <span className="flex items-center gap-1.5 text-cyan">
                    <Lock className="size-3" />
                    ACCESS GRANTED
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 text-muted">
                  <span>
                    RECORDS <span className="text-text">{pad(experience.length)}</span>
                  </span>
                  <span>
                    ACTIVE <span className="text-amber">{pad(activeCount)}</span>
                  </span>
                  <span>
                    LAYER <span className="text-cyan">BACKEND</span>
                  </span>
                </div>
              </div>
            </Reveal>
            <p className="sr-only">
              {experience.length} experience records, {activeCount} currently active.
            </p>
          </header>

          {/* ---- Timeline ----------------------------------------------------- */}
          <div className="mt-[14vh]">
            <ExperienceTimeline chapterIndex={index} />
          </div>
        </div>

        <Reveal y={10} blur={false} amount={0.8}>
          <p className="flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.24em] text-muted" aria-hidden="true">
            <span className="inline-block h-px w-8 bg-cyan/50" />
            END OF LOG <span className="text-amber">//</span> CONTINUE DESCENT
            <span className="inline-block h-3 w-1.5 animate-blink bg-cyan/80" />
          </p>
        </Reveal>
      </div>
    </div>
  )
}
