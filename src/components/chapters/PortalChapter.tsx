import { motion } from 'framer-motion'
import { BriefcaseBusiness, MapPin } from 'lucide-react'
import { profile } from '../../data/portfolio'
import { useScrollVar } from '../../hooks/useScrollProgress'
import { useIsMobile, useReducedMotion } from '../../hooks/useMediaQuery'
import { ChapterTag } from '../ui/ChapterTag'
import { useChapter } from '../ui/chapterContext'
import IdentityPanel from './IdentityPanel'
import '../../styles/hero.css'

const EASE = [0.16, 1, 0.3, 1] as const

export default function PortalChapter() {
  const { headingId, index } = useChapter()
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const stageRef = useScrollVar<HTMLDivElement>((f) => f.chapterProgress[index] ?? 0)

  // Decorative loops only on capable, motion-tolerant screens.
  const loops = !reduce
  const panelOffset = isMobile ? 0 : 96

  return (
    <div
      ref={stageRef}
      className="ptl-stage relative min-h-[100lvh] lg:sticky lg:top-0 lg:h-[100lvh] lg:min-h-[640px]"
    >
      <div className="ptl-scrim pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative flex h-full flex-col gap-10 px-6 pb-24 pt-24 md:px-16 lg:flex-row lg:items-center-safe lg:justify-between lg:gap-8 lg:pb-16 lg:pt-24 lg:pl-24 lg:pr-28">
        {/* ---- Profile copy (left third) --------------------------------- */}
        <motion.div
          className="lg:w-[min(30rem,36%)]"
          initial={{ opacity: 0, x: -48, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
          transition={{ duration: 1, ease: EASE }}
        >
          <ChapterTag label="Player profile" />

          <h2
            id={headingId}
            className="mt-6 font-display text-[clamp(2.2rem,4.4vw,4.25rem)] font-bold uppercase leading-[0.95] tracking-[0.03em] text-text"
          >
            {profile.name.split(/\s+/).map((part, i, all) => (
              <span key={i} className={i === all.length - 1 ? 'text-cyan text-glow' : undefined}>
                {part}
                {i < all.length - 1 ? ' ' : null}
              </span>
            ))}
          </h2>

          <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-text/90 md:text-xl">{profile.tagline}</p>

          <dl className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <dt className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5 text-cyan">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Location</span>
              </dt>
              <dd className="pt-1 text-[0.9375rem] text-text">{profile.location}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-amber/35 bg-amber/5 text-amber">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Current role</span>
              </dt>
              <dd className="pt-1 text-[0.9375rem] text-text">
                {profile.currentRole} <span className="text-muted">—</span>{' '}
                <span className="font-semibold tracking-wide text-amber text-glow-amber">{profile.company}</span>
              </dd>
            </div>
          </dl>
        </motion.div>

        {/* ---- Holographic identity panel (right third) ----------------- */}
        <div className="w-full max-w-[30rem] lg:w-[min(26rem,34%)]">
          <div className={loops && !isMobile ? 'ptl-float' : undefined}>
            <motion.div
              initial={{ opacity: 0, x: panelOffset, y: isMobile ? 32 : 0, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
              viewport={{ once: true, amount: 'some', margin: '0px 0px -15% 0px' }}
              transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
            >
              <IdentityPanel animate={loops} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
