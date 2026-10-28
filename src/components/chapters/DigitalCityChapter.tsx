import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Crosshair } from 'lucide-react'
import { useRef } from 'react'
import { projects } from '../../data/portfolio'
import { useScrollFrame, useScrollVar } from '../../hooks/useScrollProgress'
import ProjectMissionCard from '../ProjectMissionCard'
import { ChapterTag } from '../ui/ChapterTag'
import { Reveal } from '../ui/Reveal'
import { useChapter } from '../ui/chapterContext'
import '../../styles/missions.css'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: 0.1 + i * 0.16, ease: [0.16, 1, 0.3, 1] },
  }),
}

/**
 * Chapter 03 — The Digital City. A mission-select screen: headline top-left,
 * readout top-right, mission panels in a lower band so the city stays visible.
 * On wide + tall screens the stage is pinned while the clip scrubs behind it;
 * elsewhere it flows as a single spaced column.
 */
export default function DigitalCityChapter() {
  const { scene, index, headingId } = useChapter()
  const driftRef = useScrollVar<HTMLElement>((f) => f.chapterProgress[index] ?? 0)
  const pctRef = useRef<HTMLSpanElement>(null)
  const lastPct = useRef(-1)

  useScrollFrame((f) => {
    const pct = Math.round((f.chapterProgress[index] ?? 0) * 100)
    if (pct !== lastPct.current && pctRef.current) {
      lastPct.current = pct
      pctRef.current.textContent = String(pct).padStart(3, '0')
    }
  })

  const missionCount = String(projects.length).padStart(2, '0')

  return (
    <div className="relative" style={{ minHeight: `${scene.scrollLength * 100}lvh` }}>
      <div
        className="city-stage px-6 pb-24 pt-28 md:px-16 lg:pb-16 lg:pl-24 lg:pr-28 lg:pt-24"
      >
        {/* Readability scrims: top-left for the headline, bottom for the panels. */}
        <div
          className="scrim-left pointer-events-none absolute inset-y-0 left-0 w-full opacity-60 md:w-2/3"
          aria-hidden="true"
        />
        <div
          className="scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 hidden h-3/5 lg:block"
          aria-hidden="true"
        />

        {/* --- Headline + readout ------------------------------------------ */}
        <header ref={driftRef} className="city-drift relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <Reveal x={-28} y={0} className="max-w-xl">
            <ChapterTag />
            <h2
              id={headingId}
              className="mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-wide text-text sm:text-5xl lg:text-6xl"
            >
              Mission <span className="text-cyan text-glow">Select</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted md:text-lg">
              {scene.title} <span className="text-dim">—</span> select a mission.
            </p>
          </Reveal>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xs border border-line bg-ink/60 px-5 py-4 lg:mt-10"
          >
            <dl className="space-y-3 font-mono text-xs uppercase tracking-[0.2em]">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted">
                  <Crosshair className="h-3.5 w-3.5 text-cyan" aria-hidden="true" />
                  Sector
                </dt>
                <dd className="text-text">{scene.number}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Missions available</dt>
                <dd className="text-amber text-glow-amber">{missionCount}</dd>
              </div>
            </dl>
            <div className="mt-4" aria-hidden="true">
              <div className="flex items-center justify-between font-mono text-[0.625rem] tracking-[0.24em] text-muted">
                <span>CITY SCAN</span>
                <span>
                  <span ref={pctRef}>000</span>%
                </span>
              </div>
              <div className="mt-2 h-px w-full bg-line">
                <div className="city-scan-fill h-px w-full bg-cyan shadow-[0_0_8px_rgb(34_225_255/0.8)]" />
              </div>
            </div>
          </motion.div>
        </header>

        {/* --- Mission panels ------------------------------------------------ */}
        <ul
          aria-label="Missions"
          className="relative mt-[22lvh] grid grid-cols-1 gap-y-[14lvh] md:mt-16 md:grid-cols-2 md:gap-x-6 md:gap-y-8 lg:mt-10 lg:grid-cols-3 lg:gap-6"
        >
          {projects.map((project, i) => (
            <motion.li
              key={project.id}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
              className="h-full"
            >
              <ProjectMissionCard project={project} index={i} />
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}
