import { ArrowUpRight } from 'lucide-react'
import { contact, experience, isValidUrl, profile, projects } from '../../data/portfolio'
import { GithubIcon } from '../ui/BrandIcons'
import { HudPanel } from '../ui/HudPanel'

/** "HARIHARASUDHAN N" -> "HN" (first + last word). */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** Geometric player emblem — no image asset required. */
function PlayerEmblem({ initials, animate }: { initials: string; animate: boolean }) {
  return (
    <div className="ptl-emblem relative h-20 w-20 shrink-0 text-cyan" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full" fill="none">
        <g className={animate ? 'ptl-spin' : undefined}>
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="3 5" />
        </g>
        <g className={animate ? 'ptl-spin-rev' : undefined}>
          <path d="M40 8 A32 32 0 0 1 72 40" stroke="currentColor" strokeWidth="1.5" />
          <path d="M40 72 A32 32 0 0 1 8 40" stroke="#ffb02e" strokeOpacity="0.8" strokeWidth="1.5" />
        </g>
        <polygon points="40,16 61,28 61,52 40,64 19,52 19,28" stroke="currentColor" strokeOpacity="0.7" fill="rgb(34 225 255 / 0.06)" />
        <path d="M40 2v6M40 72v6M2 40h6M72 40h6" stroke="currentColor" strokeOpacity="0.6" />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-bold tracking-[0.08em] text-cyan-soft text-glow">
        {initials}
      </span>
    </div>
  )
}

interface IdentityPanelProps {
  /** Enable decorative loops (scan sweep, float, emblem rotation). */
  animate: boolean
}

/** Holographic "player card" for chapter 02. Every value comes from portfolio.ts. */
export default function IdentityPanel({ animate }: IdentityPanelProps) {
  const current = experience.find((e) => e.current)
  const stack = [...new Set(projects.flatMap((p) => p.tech))]
  const github = isValidUrl(contact.github) ? contact.github : null

  const stats: { key: string; value: string; accent?: boolean }[] = [
    { key: 'Class', value: profile.role },
    { key: 'Rank', value: profile.currentRole },
    { key: 'Faction', value: profile.company },
    { key: 'Base', value: profile.location },
    ...(current ? [{ key: 'Deployed', value: current.period }] : []),
  ]

  return (
    <article aria-label="Player identity card" className="w-full">
    <HudPanel className="ptl-card w-full p-6 md:p-7">
      {animate && <div className="ptl-scan" aria-hidden="true" />}
      <div className="scanlines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative">
        {/* Header */}
        <header className="flex items-center gap-5">
          <PlayerEmblem initials={initialsOf(profile.name)} animate={animate} />
          <div className="min-w-0">
            <p className="hud-label text-muted">Player ID</p>
            <h3 className="mt-1 truncate font-display text-xl font-semibold tracking-[0.06em] text-text">
              {profile.displayName}
            </h3>
            {contact.githubUsername && (
              <p className="mt-1 truncate font-mono text-[0.8125rem] text-cyan-soft/90">@{contact.githubUsername}</p>
            )}
          </div>
        </header>

        <div className="ptl-divider my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-cyan/60 via-line to-transparent" />
          <span className="font-mono text-[0.625rem] tracking-[0.3em] text-dim">STATS</span>
        </div>

        {/* Stat rows */}
        <dl className="ptl-stats space-y-3">
          {stats.map((s) => (
            <div key={s.key} className="ptl-stat grid grid-cols-[6.5rem_1fr] items-baseline gap-3 border-b border-line/70 pb-3">
              <dt className="hud-label text-muted">{s.key}</dt>
              <dd className="ptl-stat-value text-[0.9375rem] leading-snug text-text">{s.value}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
            <dt className="hud-label text-muted">Status</dt>
            <dd className="flex items-center gap-2 text-[0.9375rem] text-text">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-cyan/60 animate-pulse-slow" />
                <span className="absolute inset-[3px] rounded-full bg-cyan" />
              </span>
              Online
            </dd>
          </div>
        </dl>

        {/* Loadout */}
        {stack.length > 0 && (
          <div className="ptl-loadout mt-6">
            <p className="hud-label text-muted">Mission loadout</p>
            <ul className="ptl-chips mt-3 flex flex-wrap gap-2" aria-label="Technologies used in projects">
              {stack.map((t) => (
                <li key={t} className="tag-chip">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {github && (
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="ptl-cta btn-hud btn-hud-ghost mt-6 w-full focus-visible:outline-cyan-soft focus-visible:outline-offset-[-4px]"
            aria-label={`GitHub profile of ${profile.displayName} (opens in a new tab)`}
          >
            <GithubIcon className="h-4 w-4" />
            <span>Open GitHub</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </HudPanel>
    </article>
  )
}
