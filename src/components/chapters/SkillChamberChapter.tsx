import { Network } from 'lucide-react'
import { certifications, skillCategories } from '../../data/portfolio'
import AchievementsPanel, { AcademicRecord } from '../AchievementsPanel'
import SkillTree from '../SkillTree'
import ChapterTag from '../ui/ChapterTag'
import HudPanel from '../ui/HudPanel'
import Reveal from '../ui/Reveal'
import { useChapter } from '../ui/chapterContext'

const pad = (n: number) => String(n).padStart(2, '0')

const STATS = [
  { label: 'Skill branches', value: pad(skillCategories.length) },
  { label: 'Skill nodes', value: pad(skillCategories.reduce((s, c) => s + c.skills.length, 0)) },
  { label: 'Achievements', value: pad(certifications.length) },
]

/** CH 05 — skills (interactive tree), certifications and education. */
export default function SkillChamberChapter() {
  const { scene, index, headingId } = useChapter()

  return (
    <div
      className="relative flex flex-col px-6 pb-24 pt-24 md:px-16 md:pt-28 lg:pl-24 lg:pr-28"
      style={{ minHeight: `${scene.scrollLength * 100}lvh` }}
    >
      {/* Readability scrim behind the title block */}
      <div className="scrim-left pointer-events-none absolute inset-x-0 top-0 h-[70lvh] opacity-80" aria-hidden="true" />

      <header className="relative max-w-2xl">
        <Reveal x={-30} y={0}>
          <ChapterTag />
        </Reveal>
        <Reveal x={-40} y={0} delay={0.1}>
          <h2
            id={headingId}
            className="mt-4 text-4xl font-bold uppercase leading-[0.95] tracking-[0.04em] text-text text-glow sm:text-5xl md:text-6xl xl:text-7xl"
          >
            {scene.title}
          </h2>
        </Reveal>
        <Reveal delay={0.25} y={16}>
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
            {STATS.map((s) => (
              <div key={s.label} className="border-l border-cyan/40 pl-3">
                <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{s.label}</dt>
                <dd className="font-display text-2xl font-semibold text-cyan text-glow">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </header>

      <div className="min-h-[10lvh] flex-1" aria-hidden="true" />

      <Reveal amount={0.15} y={40}>
        <section aria-labelledby="skill-tree-title" className="relative">
          <HudPanel className="p-5 md:p-8 xl:p-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4 lg:mb-2">
              <div>
                <p className="hud-label flex items-center gap-2">
                  <Network className="size-3.5" aria-hidden="true" />
                  Loadout
                </p>
                <h3
                  id="skill-tree-title"
                  className="mt-1.5 text-xl font-semibold uppercase tracking-[0.12em] text-text md:text-2xl"
                >
                  Skill Tree
                </h3>
              </div>
              <p className="max-w-xs text-[15px] text-muted">
                Select a branch to activate its nodes. Arrow keys switch branches.
              </p>
            </div>
            <SkillTree chapterIndex={index} />
          </HudPanel>
        </section>
      </Reveal>

      <div className="min-h-[18lvh] flex-[1.4]" aria-hidden="true" />

      <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <Reveal x={-40} y={0} amount={0.15} className="lg:col-span-6 xl:col-span-5">
          <AchievementsPanel />
        </Reveal>
        <Reveal x={40} y={0} delay={0.1} amount={0.15} className="lg:col-span-6 xl:col-span-5 xl:col-start-8">
          <AcademicRecord />
        </Reveal>
      </div>
    </div>
  )
}
