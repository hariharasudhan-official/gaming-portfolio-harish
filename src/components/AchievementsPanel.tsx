import { motion } from 'framer-motion'
import { Award, GraduationCap, Trophy } from 'lucide-react'
import { certifications, education } from '../data/portfolio'
import HudPanel from './ui/HudPanel'
import '../styles/skills.css'

const EASE = [0.16, 1, 0.3, 1] as const
const pad = (n: number) => String(n).padStart(2, '0')

/** "ACHIEVEMENTS UNLOCKED" — certifications as game achievements (no links). */
export default function AchievementsPanel() {
  const total = pad(certifications.length)
  return (
    <section aria-labelledby="achievements-title">
      <HudPanel className="p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="hud-label flex items-center gap-2 text-amber">
            <Award className="size-3.5" aria-hidden="true" />
            Certifications
          </p>
          <h3 id="achievements-title" className="mt-1.5 text-xl font-semibold uppercase tracking-[0.12em] text-text md:text-2xl">
            Achievements Unlocked
          </h3>
        </div>
        <p className="font-mono text-xs tracking-[0.2em] text-muted">
          <span className="text-amber">{total}</span> / {total}
        </p>
      </header>

      <ul className="mt-5 space-y-3">
        {certifications.map((c, i) => (
          <motion.li
            key={c.name}
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
            className="relative overflow-hidden border border-amber/20 bg-void/40"
          >
            <article className="flex items-center gap-4 p-3.5 pr-4">
              <span className="achv-badge grid size-12 shrink-0 place-items-center text-amber" aria-hidden="true">
                <Trophy className="size-5 drop-shadow-[0_0_6px_rgb(255_176_46/0.7)]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[0.24em] text-amber/90">ACHIEVEMENT UNLOCKED</p>
                <h4 className="mt-0.5 font-display text-base font-semibold leading-snug text-text">{c.name}</h4>
                {c.issuer && <p className="text-[15px] text-muted">Issued by {c.issuer}</p>}
              </div>
              <time dateTime={c.year} className="shrink-0 font-mono text-sm tracking-[0.12em] text-cyan-soft">
                {c.year}
              </time>
            </article>
            <motion.span
              className="achv-shine"
              aria-hidden="true"
              initial={{ x: '-110%' }}
              whileInView={{ x: '110%' }}
              viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
              transition={{ duration: 1.3, delay: 0.25 + i * 0.12, ease: EASE }}
            />
          </motion.li>
        ))}
      </ul>
    </HudPanel>
    </section>
  )
}

/** "ACADEMIC RECORD" — education entries with clear placeholders for unset fields. */
export function AcademicRecord() {
  return (
    <section aria-labelledby="academic-title">
      <HudPanel className="p-6 md:p-8">
      <header className="border-b border-line pb-4">
        <p className="hud-label flex items-center gap-2">
          <GraduationCap className="size-3.5" aria-hidden="true" />
          Education
        </p>
        <h3 id="academic-title" className="mt-1.5 text-xl font-semibold uppercase tracking-[0.12em] text-text md:text-2xl">
          Academic Record
        </h3>
      </header>

      <ol className="relative mt-5 space-y-4 border-l border-cyan/25 pl-6">
        {education.map((e, i) => {
          const pursuing = e.status === 'pursuing'
          const institution = e.institution.trim()
          const year = e.year.trim()
          return (
            <motion.li
              key={e.degree}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
              transition={{ duration: 0.6, delay: i * 0.14, ease: EASE }}
              className="relative"
            >
              <span
                className={`absolute -left-[30px] top-2 size-[11px] rotate-45 border ${
                  pursuing ? 'border-amber bg-amber/80 shadow-[0_0_10px_rgb(255_176_46/0.8)]' : 'border-cyan bg-ink'
                }`}
                aria-hidden="true"
              />
              <article>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[10px] tracking-[0.24em] text-muted">REC-{pad(i + 1)}</p>
                  {pursuing ? (
                    <span className="inline-flex items-center gap-1.5 border border-amber/50 bg-amber/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-amber">
                      <span className="size-1.5 animate-pulse-slow bg-amber" aria-hidden="true" />
                      IN PROGRESS
                    </span>
                  ) : (
                    <span className="border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-cyan-soft">
                      COMPLETED
                    </span>
                  )}
                </div>
                <h4 className="mt-1.5 font-display text-lg font-semibold leading-snug text-text">{e.degree}</h4>
                {institution ? (
                  <p className="text-[15px] text-muted">{institution}</p>
                ) : (
                  <p className="text-[15px] italic text-muted/80">
                    Institution <span aria-hidden="true">—</span>
                    <span className="sr-only">:</span> to be configured
                  </p>
                )}
                <p className="mt-1 font-mono text-sm tracking-[0.08em]">
                  {year ? (
                    <>
                      <span className="text-muted">{pursuing ? 'Expected: ' : 'Completed: '}</span>
                      <time dateTime={year} className="text-cyan-soft">
                        {year}
                      </time>
                    </>
                  ) : (
                    <span className="italic text-muted/80">{pursuing ? 'Expected: TBA' : 'Year — to be configured'}</span>
                  )}
                </p>
              </article>
            </motion.li>
          )
        })}
      </ol>
    </HudPanel>
    </section>
  )
}
