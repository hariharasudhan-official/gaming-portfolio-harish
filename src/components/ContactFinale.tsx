import { motion, useInView, type Transition } from 'framer-motion'
import { ArrowUpRight, Mail, RotateCcw, TriangleAlert } from 'lucide-react'
import { useRef } from 'react'
import { contact, finale, getContactHref, isValidUrl, profile } from '../data/portfolio'
import { useScrollVar } from '../hooks/useScrollProgress'
import { scrollToTop } from '../lib/scrollStore'
import { GithubIcon, LinkedinIcon } from './ui/BrandIcons'
import { ChapterTag } from './ui/ChapterTag'
import { HudPanel } from './ui/HudPanel'
import { useChapter } from './ui/chapterContext'
import '../styles/finale.css'

const EASE: Transition['ease'] = [0.16, 1, 0.3, 1]
const YEAR = new Date().getFullYear()

/**
 * CH 06 — THE FINAL MISSION.
 * On large, tall viewports a sticky 100lvh stage is pinned over the
 * energy-core clip. Content sits in the lower band (left: headline, right:
 * comms panel) so the core stays visible, and because the stage is
 * bottom-aligned the final viewport always reads as a complete end screen.
 *
 * When the content would not fit in one viewport (phones, short windows) the
 * stage drops sticky and fills the whole chapter instead, still bottom-aligned,
 * so the content scrolls naturally in flow (title never trapped under the HUD)
 * and the credits line lands at the very end of the document.
 * See `.finale-stage` in styles/finale.css.
 */
export default function ContactFinale() {
  const { headingId, index } = useChapter()
  const stageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  // Sticky mode: the 100lvh stage is the trigger (unchanged desktop timing).
  // Flow mode: the stage spans the whole chapter and can never be 45% visible,
  // so the content block itself is a fallback trigger.
  const stageInView = useInView(stageRef, { once: true, amount: 0.45 })
  const contentInView = useInView(contentRef, { once: true, amount: 'some', margin: '0px 0px -15% 0px' })
  // The footer is the last thing in the document: reveal it as soon as any of
  // it is on screen so it can never be left blurred at the bottom of the page.
  const footerInView = useInView(footerRef, { once: true, amount: 0 })
  const inView = stageInView || contentInView
  const uplinkRef = useScrollVar<HTMLDivElement>((f) => f.chapterProgress[index] ?? 0)

  const state = inView ? 'show' : 'hidden'
  const words = finale.title.split(' ')
  const titleStart = 0.55
  const wordStep = 0.09
  const afterTitle = titleStart + words.length * wordStep + 0.25

  const contactHref = getContactHref(contact)
  const email = contact.email.trim()
  const isExternal = !!contactHref && /^https?:\/\//i.test(contactHref)
  const warningId = `${headingId}-contact-warning`
  const hasGithub = isValidUrl(contact.github)
  const hasLinkedin = isValidUrl(contact.linkedin)

  const rise = (delay: number) => ({
    hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' }, transition: { duration: 0.9, delay, ease: EASE } },
  })

  return (
    <div ref={stageRef} className="finale-stage">
      {/* Readability scrims: strong at the bottom, soft on the left. */}
      <div className="finale-scrim scrim-bottom pointer-events-none absolute inset-x-0 bottom-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-void/55 to-transparent md:block"
        aria-hidden="true"
      />

      <div ref={contentRef} className="relative px-6 pb-14 pt-28 md:px-16 md:pb-16 lg:pl-24 lg:pr-28 lg:pt-24">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-14">
          {/* ---------------------------------------------------------------- */}
          {/* Headline block                                                  */}
          {/* ---------------------------------------------------------------- */}
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate={state} variants={rise(0)}>
              <ChapterTag className="mb-6" />
            </motion.div>

            <motion.p
              className="finale-stamp text-glow-amber"
              data-on={inView}
              initial="hidden"
              animate={state}
              variants={{
                hidden: { opacity: 0, scale: 1.35, filter: 'blur(10px)' },
                show: {
                  opacity: [0, 1, 0.75, 1],
                  scale: 1,
                  filter: 'blur(0px)', transitionEnd: { filter: 'none' },
                  transition: { duration: 0.6, delay: 0.1, ease: EASE },
                },
              }}
            >
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber/60" />
                <span className="relative size-2.5 rounded-full bg-amber" />
              </span>
              {finale.label}
            </motion.p>

            <h2
              id={headingId}
              className="text-glow mt-6 text-[2.15rem] font-bold uppercase leading-[1.02] text-text sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {words.map((word, i) => (
                <span key={`${word}-${i}`}>
                  <motion.span
                    className={`inline-block ${i >= words.length - 3 ? 'text-cyan' : ''}`}
                    initial="hidden"
                    animate={state}
                    variants={{
                      hidden: { opacity: 0, y: 28, filter: 'blur(14px)' },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)', transitionEnd: { filter: 'none' },
                        transition: { duration: 1, delay: titleStart + i * wordStep, ease: EASE },
                      },
                    }}
                  >
                    {word}
                  </motion.span>
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h2>

            <motion.div initial="hidden" animate={state} variants={rise(afterTitle)} className="mt-6">
              <p className="max-w-xl text-lg text-text/90 md:text-xl">{finale.subtitle}</p>
              <p className="mt-3 flex items-center gap-3 font-mono text-[0.8125rem] uppercase tracking-[0.2em] text-muted">
                <span className="inline-block h-px w-8 bg-amber/70" aria-hidden="true" />
                <span>
                  Player{' '}
                  <span className="text-dim" aria-hidden="true">
                    //
                  </span>{' '}
                  <span className="text-text">{profile.displayName}</span>
                </span>
              </p>
            </motion.div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Comms panel                                                     */}
          {/* ---------------------------------------------------------------- */}
          <motion.div initial="hidden" animate={state} variants={rise(afterTitle + 0.25)}>
            <HudPanel className="finale-actions p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="hud-label">Comms Channel</h3>
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted">
                  {contactHref ? (
                    <span className="text-cyan">
                      <span aria-hidden="true">●</span> Online
                    </span>
                  ) : (
                    <span className="text-amber">
                      <span aria-hidden="true">●</span> Standby
                    </span>
                  )}
                </span>
              </div>

              {/* Uplink meter — fills as the visitor scrolls the finale. */}
              <div className="mt-3 h-px w-full bg-line" aria-hidden="true">
                <div ref={uplinkRef} className="finale-uplink h-px w-full bg-gradient-to-r from-cyan to-amber" />
              </div>

              <div className="mt-5">
                {contactHref ? (
                  <>
                    <a
                      href={contactHref}
                      className="btn-hud w-full"
                      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      Initiate Contact
                      {isExternal && (
                        <>
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </>
                      )}
                    </a>
                    {email && (
                      <p className="mt-3 break-all text-center font-mono text-[0.9375rem] text-cyan-soft">{email}</p>
                    )}
                  </>
                ) : (
                  <>
                    <button type="button" className="btn-hud w-full" disabled aria-describedby={warningId}>
                      <Mail className="size-4" aria-hidden="true" />
                      Initiate Contact
                    </button>
                    <p
                      id={warningId}
                      className="finale-warning mt-3 flex gap-2.5 px-3 py-2.5 text-[0.9375rem] leading-snug text-text/90"
                    >
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" />
                      <span>
                        Contact email not configured yet.
                        {import.meta.env.DEV && (
                          <>
                            {' '}
                            Set <code className="font-mono text-[0.8125rem] text-amber">contact.email</code> or{' '}
                            <code className="font-mono text-[0.8125rem] text-amber">contact.contactUrl</code> in{' '}
                            <code className="font-mono text-[0.8125rem] text-amber">src/data/portfolio.ts</code>.
                          </>
                        )}
                      </span>
                    </p>
                  </>
                )}
              </div>

              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1" aria-label="Other channels">
                <li>
                  {hasGithub ? (
                    <a
                      href={contact.github.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`GitHub profile @${contact.githubUsername} (opens in a new tab)`}
                      className="finale-channel text-text"
                    >
                      <GithubIcon className="size-5 shrink-0 text-cyan" />
                      <span className="min-w-0 flex-1 truncate font-mono text-[0.9375rem]">
                        @{contact.githubUsername}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="finale-channel text-muted">
                      <GithubIcon className="size-5 shrink-0" />
                      <span className="text-[0.9375rem]">GitHub — not configured</span>
                    </span>
                  )}
                </li>
                <li>
                  {hasLinkedin ? (
                    <a
                      href={contact.linkedin.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`LinkedIn profile of ${profile.displayName} (opens in a new tab)`}
                      className="finale-channel text-text"
                    >
                      <LinkedinIcon className="size-5 shrink-0 text-cyan" />
                      <span className="min-w-0 flex-1 truncate text-[0.9375rem]">LinkedIn</span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="finale-channel text-muted">
                      <LinkedinIcon className="size-5 shrink-0" />
                      <span className="text-[0.9375rem]">LinkedIn — not configured</span>
                    </span>
                  )}
                </li>
              </ul>

              <div className="mt-5 border-t border-line pt-5">
                <button type="button" onClick={scrollToTop} className="btn-hud btn-hud-ghost w-full">
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Replay Experience
                </button>
              </div>
            </HudPanel>
          </motion.div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Credits line                                                       */}
        {/* ------------------------------------------------------------------ */}
        <motion.footer
          ref={footerRef}
          initial="hidden"
          animate={inView || footerInView ? 'show' : 'hidden'}
          variants={rise(inView ? afterTitle + 0.5 : 0.15)}
          className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 font-mono text-[0.75rem] uppercase tracking-[0.18em] text-muted"
        >
          <span>
            © {YEAR} {profile.displayName}
          </span>
          <span className="text-dim" aria-hidden="true">
            ·
          </span>
          <span className="text-cyan">CODEVERSE</span>
          <span className="text-dim" aria-hidden="true">
            ·
          </span>
          <span>Built with React</span>
        </motion.footer>
      </div>
    </div>
  )
}
