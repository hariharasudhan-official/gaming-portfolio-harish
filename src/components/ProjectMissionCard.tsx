import { ExternalLink, Lock } from 'lucide-react'
import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { isValidUrl } from '../data/portfolio'
import type { Project } from '../data/portfolio'
import { useFinePointer, useReducedMotion } from '../hooks/useMediaQuery'
import '../styles/missions.css'

interface ProjectMissionCardProps {
  project: Project
  /** Zero-based position, used for the sector readout. */
  index: number
}

const MAX_TILT = 6 // degrees

/**
 * A mission-select panel for one project. Selection (glow, sweeping border,
 * expanding brackets, "MISSION SELECTED") is pure CSS on :hover/:focus-within.
 * The 3D tilt writes CSS variables straight to the element — no React state.
 */
export function ProjectMissionCard({ project, index }: ProjectMissionCardProps) {
  const ref = useRef<HTMLElement>(null)
  const rect = useRef<DOMRect | null>(null)
  const finePointer = useFinePointer()
  const reducedMotion = useReducedMotion()
  const tiltEnabled = finePointer && !reducedMotion

  const titleId = `mission-${project.id}-title`
  const hasUrl = isValidUrl(project.url)
  const isActive = project.status.toLowerCase() === 'active'

  const onPointerEnter = (e: PointerEvent<HTMLElement>) => {
    if (!tiltEnabled || e.pointerType !== 'mouse') return
    rect.current = e.currentTarget.getBoundingClientRect()
    e.currentTarget.dataset.tilting = 'true'
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!tiltEnabled || e.pointerType !== 'mouse') return
    const el = e.currentTarget
    const r = rect.current ?? el.getBoundingClientRect()
    rect.current = r
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
    el.style.setProperty('--ry', `${((px - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`)
    el.style.setProperty('--rx', `${((0.5 - py) * 2 * MAX_TILT).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
  }

  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current ?? e.currentTarget
    rect.current = null
    delete el.dataset.tilting
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <article
      ref={ref}
      aria-labelledby={titleId}
      className="mission"
      onPointerEnter={tiltEnabled ? onPointerEnter : undefined}
      onPointerMove={tiltEnabled ? onPointerMove : undefined}
      onPointerLeave={tiltEnabled ? onPointerLeave : undefined}
    >
      <div className="mission-glow" aria-hidden="true" />

      <div className="mission-frame px-6 pb-6 pt-5 lg:px-7">
        <span className="mission-bracket left-3 top-3 border-l border-t" aria-hidden="true" />
        <span className="mission-bracket right-3 top-3 border-r border-t" aria-hidden="true" />
        <span className="mission-bracket bottom-3 left-3 border-b border-l" aria-hidden="true" />
        <span className="mission-bracket bottom-3 right-3 border-b border-r" aria-hidden="true" />

        {/* Header: code / type / status */}
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-3xl font-semibold leading-none tracking-wider text-cyan text-glow">
              <span className="sr-only">Mission </span>
              {project.code}
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              <span className="sr-only">Type: </span>
              {project.type}
            </p>
          </div>
          {project.status.trim() && (
            <p
              className={`inline-flex shrink-0 items-center gap-2 border px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.2em] ${
                isActive ? 'border-amber/45 bg-amber/10 text-amber' : 'border-cyan/35 bg-cyan/10 text-cyan-soft'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 ${isActive ? 'animate-pulse-slow bg-amber' : 'bg-cyan'}`}
                aria-hidden="true"
              />
              <span className="sr-only">Status: </span>
              {project.status}
            </p>
          )}
        </div>

        {/* Selection readout line */}
        <div className="relative mt-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-cyan/50 via-line to-transparent" />
          <span className="relative font-mono text-[0.625rem] uppercase tracking-[0.24em]">
            <span className="mission-standby-label text-dim">SECTOR 03.{String(index + 1).padStart(2, '0')}</span>
            <span className="mission-selected-label absolute right-0 top-0 whitespace-nowrap text-amber text-glow-amber">
              ▸ MISSION SELECTED
            </span>
          </span>
        </div>

        <h3
          id={titleId}
          className="mission-title relative mt-4 text-xl font-semibold leading-snug text-text transition-colors duration-300 lg:text-[1.375rem]"
        >
          {project.title}
        </h3>
        <p className="relative mt-3 text-[0.9375rem] leading-relaxed text-muted">{project.summary}</p>

        <div className="relative mt-5">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.24em] text-muted" id={`${titleId}-loadout`}>
            Loadout
          </p>
          <ul className="mt-2 flex flex-wrap gap-2" aria-labelledby={`${titleId}-loadout`}>
            {project.tech.map((t) => (
              <li key={t} className="tag-chip">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-auto pt-6">
          {hasUrl ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View Project: ${project.title} (opens in a new tab)`}
              className="btn-hud btn-hud-ghost w-full sm:w-auto"
            >
              View Project
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            <span className="mission-preview">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Project Preview
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProjectMissionCard
