import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, Ref } from 'react'
import { skillCategories } from '../data/portfolio'
import type { SkillCategory } from '../data/portfolio'
import { useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery'
import { useScrollVar } from '../hooks/useScrollProgress'
import '../styles/skills.css'

/* ---------------------------------------------------------------------------
   Geometry — all in a 0..100 × 0..100 space shared by the SVG (stretched with
   preserveAspectRatio="none" + non-scaling strokes) and the HTML nodes
   (positioned with % offsets), so lines meet nodes without any measuring.
   ------------------------------------------------------------------------- */
const CORE = { x: 10, y: 50 }
const CAT_W = 18
const JUNCTION = { x: 57, y: 50 }
const TRUNK_X = 58.6
const COL_X = [61, 80] as const
const NODE_W = 17.5

function categoryPos(i: number, n: number) {
  const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1
  return { x: 33 - 8 * t * t, y: 50 + t * 37 }
}

function skillPos(i: number, n: number) {
  const step = n > 1 ? Math.min(10.5, 78 / (n - 1)) : 0
  return { x: COL_X[i % 2], y: 50 + (i - (n - 1) / 2) * step }
}

const EASE = [0.16, 1, 0.3, 1] as const
const PANEL_ID = 'skill-tree-panel'
const tabId = (c: SkillCategory) => `skill-tab-${c.id}`
const TOTAL_SKILLS = skillCategories.reduce((sum, c) => sum + c.skills.length, 0)

interface TabsApi {
  active: number
  select: (i: number) => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  tabRef: (i: number) => Ref<HTMLButtonElement>
  /** Moves focus to the active tab (used after the desktop/compact swap). */
  focusActive: () => void
}

/** Roving-tabindex ARIA tabs with automatic activation. */
function useTabs(count: number): TabsApi {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const select = useCallback((i: number) => setActive(i), [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      let next: number | null = null
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (active + 1) % count
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (active - 1 + count) % count
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = count - 1
      if (next === null) return
      e.preventDefault()
      setActive(next)
      refs.current[next]?.focus()
    },
    [active, count],
  )

  const tabRef = useCallback(
    (i: number) => (el: HTMLButtonElement | null) => {
      refs.current[i] = el
    },
    [],
  )

  const focusActive = useCallback(() => refs.current[active]?.focus({ preventScroll: true }), [active])

  return { active, select, onKeyDown, tabRef, focusActive }
}

function tabProps(api: TabsApi, c: SkillCategory, i: number) {
  const selected = api.active === i
  return {
    id: tabId(c),
    role: 'tab' as const,
    type: 'button' as const,
    'aria-selected': selected,
    'aria-controls': PANEL_ID,
    tabIndex: selected ? 0 : -1,
    ref: api.tabRef(i),
    onClick: () => api.select(i),
    onKeyDown: api.onKeyDown,
  }
}

/* ---------------------------------------------------------------------------
   Desktop: core hub → category nodes → branch → skill nodes
   ------------------------------------------------------------------------- */
function DesktopTree({ api, chapterIndex }: { api: TabsApi; chapterIndex: number }) {
  const reduced = useReducedMotion()
  const ringRef = useScrollVar<HTMLDivElement>((f) => f.chapterProgress[chapterIndex] ?? 0)
  const n = skillCategories.length
  const cat = skillCategories[api.active]
  const catP = categoryPos(api.active, n)
  const skills = cat.skills
  const draw = reduced ? { duration: 0 } : { duration: 0.9, ease: EASE }

  return (
    <div className="relative h-[540px] w-full xl:h-[600px]">
      {/* Connector lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="skill-branch-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#22e1ff" />
            <stop offset="1" stopColor="#3b82ff" />
          </linearGradient>
          <clipPath id="skill-branch-clip" clipPathUnits="userSpaceOnUse">
            <motion.rect
              key={cat.id}
              x={catP.x + CAT_W - 1}
              y={-5}
              height={110}
              initial={{ width: 0 }}
              animate={{ width: 100 - (catP.x + CAT_W - 1) + 5 }}
              transition={draw}
            />
          </clipPath>
        </defs>

        {/* Core → every category (dim), active one bright */}
        {skillCategories.map((c, i) => {
          const p = categoryPos(i, n)
          const d = `M ${CORE.x} ${CORE.y} C ${CORE.x + 9} ${CORE.y}, ${p.x - 10} ${p.y}, ${p.x} ${p.y}`
          const on = i === api.active
          return (
            <g key={c.id}>
              <path
                d={d}
                fill="none"
                stroke={on ? '#22e1ff' : 'rgb(120 220 255 / 0.22)'}
                strokeWidth={on ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
                style={{ transition: 'stroke 0.4s ease' }}
              />
              {on && (
                <path
                  d={d}
                  fill="none"
                  stroke="#8ff0ff"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  className="skill-flow"
                />
              )}
            </g>
          )
        })}

        {/* Active category → junction → skills, drawn in with a wipe */}
        <g clipPath="url(#skill-branch-clip)">
          {(() => {
            const sx = catP.x + CAT_W
            const branch = `M ${sx} ${catP.y} C ${sx + 6} ${catP.y}, ${JUNCTION.x - 6} ${JUNCTION.y}, ${JUNCTION.x} ${JUNCTION.y} H ${TRUNK_X}`
            const leaves = skills.map((_, i) => {
              const p = skillPos(i, skills.length)
              return `M ${TRUNK_X} ${JUNCTION.y} V ${p.y} H ${p.x}`
            })
            return (
              <>
                <path
                  d={branch}
                  fill="none"
                  stroke="url(#skill-branch-grad)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
                {leaves.map((d, i) => (
                  <path
                    key={`${cat.id}-${i}`}
                    d={d}
                    fill="none"
                    stroke="rgb(34 225 255 / 0.6)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <path
                  d={[branch, ...leaves].join(' ')}
                  fill="none"
                  stroke="#8ff0ff"
                  strokeWidth={1.75}
                  vectorEffect="non-scaling-stroke"
                  className="skill-flow"
                  opacity={0.8}
                />
              </>
            )
          })()}
        </g>
      </svg>

      {/* Core hub */}
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${CORE.x}%`, top: `${CORE.y}%` }}
        aria-hidden="true"
      >
        <div className="relative grid size-36 place-items-center xl:size-40">
          <div ref={ringRef} className="skill-core-ring absolute inset-0">
            <div className="skill-core-spin absolute inset-0 rounded-full border border-dashed border-cyan/40" />
          </div>
          <div className="skill-core-spin-rev absolute inset-4 rounded-full border border-electric/50 border-t-transparent border-b-transparent" />
          <div className="absolute inset-8 rounded-full bg-cyan/10 shadow-[0_0_40px_rgb(34_225_255/0.35)] animate-pulse-slow" />
          <div className="relative text-center">
            <p className="font-display text-lg font-semibold tracking-[0.2em] text-cyan text-glow">CORE</p>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted">{TOTAL_SKILLS} NODES</p>
          </div>
        </div>
      </div>

      {/* Category nodes (tabs) */}
      <div role="tablist" aria-label="Skill categories" aria-orientation="vertical" className="pointer-events-none absolute inset-0">
        {skillCategories.map((c, i) => {
          const p = categoryPos(i, n)
          const on = i === api.active
          return (
            <button
              key={c.id}
              {...tabProps(api, c, i)}
              className="skill-cat pointer-events-auto absolute flex min-h-[48px] -translate-y-1/2 cursor-pointer items-center gap-3 py-2 pl-3 pr-3 text-left"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${CAT_W}%` }}
            >
              <span className="skill-port" data-on={on} aria-hidden="true" />
              <span className="min-w-0">
                <span className={`block font-mono text-[11px] tracking-[0.2em] ${on ? 'text-amber' : 'text-muted'}`}>
                  {c.code}
                </span>
                <span
                  className={`block font-display text-[15px] font-semibold uppercase leading-tight tracking-[0.08em] ${on ? 'text-text text-glow' : 'text-muted'}`}
                >
                  {c.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Skill nodes */}
      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId(cat)}
        tabIndex={0}
        className="absolute inset-0 pointer-events-none focus-visible:outline-offset-[-4px]"
      >
        <p className="sr-only">
          {cat.label}: {skills.length} skills
        </p>
        <ul key={cat.id}>
          {skills.map((s, i) => {
            const p = skillPos(i, skills.length)
            return (
              <li
                key={s}
                className="absolute -translate-y-1/2"
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${NODE_W}%` }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -14, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                  transition={reduced ? { duration: 0 } : { duration: 0.55, delay: 0.35 + i * 0.06, ease: EASE }}
                  className="skill-node flex min-h-[42px] items-center gap-2.5 py-2 pl-3 pr-3"
                >
                  <span className="skill-port" data-on="true" aria-hidden="true" />
                  <span className="text-[15px] font-medium leading-snug text-text">{s}</span>
                </motion.div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Mobile / tablet: scrollable tab row + node grid
   ------------------------------------------------------------------------- */
function CompactTree({ api }: { api: TabsApi }) {
  const reduced = useReducedMotion()
  const cat = skillCategories[api.active]

  return (
    <div>
      <div
        role="tablist"
        aria-label="Skill categories"
        aria-orientation="horizontal"
        className="skill-tabs-scroll -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-3"
      >
        {skillCategories.map((c, i) => {
          const on = i === api.active
          return (
            <button
              key={c.id}
              {...tabProps(api, c, i)}
              className="skill-cat flex min-h-[48px] shrink-0 snap-start cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left"
            >
              <span className="skill-port" data-on={on} aria-hidden="true" />
              <span>
                <span className={`block font-mono text-[10px] tracking-[0.2em] ${on ? 'text-amber' : 'text-muted'}`}>
                  {c.code}
                </span>
                <span
                  className={`block whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.08em] ${on ? 'text-text' : 'text-muted'}`}
                >
                  {c.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId(cat)}
        tabIndex={0}
        className="relative mt-3 border-l border-cyan/40 pl-5"
      >
        <span
          className="absolute -left-[6px] top-0 size-[11px] rotate-45 border border-cyan bg-cyan shadow-[0_0_10px_rgb(34_225_255/0.9)]"
          aria-hidden="true"
        />
        <p className="hud-label mb-3 leading-none">
          {cat.code} <span className="text-dim">//</span> {cat.skills.length} nodes active
        </p>
        <ul key={cat.id} className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:grid-cols-3">
          {cat.skills.map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.45, delay: i * 0.05, ease: EASE }}
              className="skill-node flex min-h-[44px] items-center gap-2.5 py-2 pl-3 pr-3"
            >
              <span className="skill-port" data-on="true" aria-hidden="true" />
              <span className="text-[15px] font-medium leading-snug text-text">{s}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Full, always-available list of every skill (no tab interaction needed). */
function SkillIndex() {
  return (
    <details className="skill-index group mt-6 border-t border-line pt-4">
      <summary className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 hud-label">
        <span>Full skill index — all {TOTAL_SKILLS} nodes</span>
        <ChevronDown className="skill-index-chevron size-4 transition-transform duration-300" aria-hidden="true" />
      </summary>
      <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {skillCategories.map((c) => (
          <div key={c.id}>
            <dt className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-cyan-soft">
              <span className="mr-2 font-mono text-[11px] text-amber">{c.code}</span>
              {c.label}
            </dt>
            <dd className="mt-1.5 text-[15px] leading-relaxed text-muted">{c.skills.join(' · ')}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

interface SkillTreeProps {
  /** Index of the enclosing chapter, used for the scroll-linked core ring. */
  chapterIndex: number
}

/** Interactive skill tree: category tabs on a core hub, skills branching off the active one. */
export default function SkillTree({ chapterIndex }: SkillTreeProps) {
  const api = useTabs(skillCategories.length)
  const wide = useMediaQuery('(min-width: 1024px)')

  // Crossing the breakpoint swaps tree variants, unmounting the focused tab.
  // Check for tab focus during render (the old button is still in the DOM;
  // a parent layout-effect cleanup would run after it is removed) and restore
  // focus to the new variant's active tab after commit.
  const [prevWide, setPrevWide] = useState(wide)
  const [restoreFocus, setRestoreFocus] = useState(false)
  if (prevWide !== wide) {
    setPrevWide(wide)
    const el = document.activeElement
    setRestoreFocus(!!el && el.getAttribute('role') === 'tab' && !!el.closest('[data-skill-tree]'))
  }
  // Runs only on a variant swap (restoreFocus is recomputed on every swap).
  useLayoutEffect(() => {
    if (restoreFocus) api.focusActive()
  }, [restoreFocus, wide]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-skill-tree>
      {wide ? <DesktopTree api={api} chapterIndex={chapterIndex} /> : <CompactTree api={api} />}
      <SkillIndex />
    </div>
  )
}
