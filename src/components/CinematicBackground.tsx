import { memo, useEffect, useRef } from 'react'
import { useScrollFrame } from '../hooks/useScrollProgress'
import ParticleField from './ParticleField'
import VideoSceneController from './VideoSceneController'

/**
 * Fixed, full-viewport cinematic stage behind all chapters:
 *   scene videos (with per-scene fallbacks)
 *   → intro darkness veil (lifts on load and through chapter 01)
 *   → volumetric fog → digital particles → cursor light
 *   → scanlines, grain and vignette.
 * Everything here is decorative and hidden from assistive tech.
 */
function CinematicBackgroundImpl() {
  const veilRef = useRef<HTMLDivElement>(null)
  const lightRef = useRef<HTMLDivElement>(null)

  // Chapter 01 starts almost black and the world is revealed as you scroll.
  useScrollFrame((f) => {
    const p = f.chapterProgress[0] ?? 0
    const veil = Math.max(0, 0.62 * (1 - Math.min(1, p * 2.2)))
    veilRef.current?.style.setProperty('opacity', veil.toFixed(3))
  })

  // Soft light that trails the cursor on desktop.
  useEffect(() => {
    const el = lightRef.current
    if (!el) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    let raf = 0
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let x = tx
    let y = ty
    const step = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      el.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(step) : 0
    }
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      el.style.opacity = '1'
      if (!raf) raf = requestAnimationFrame(step)
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void" aria-hidden="true">
      <VideoSceneController />

      {/* Darkness veil for the awakening */}
      <div ref={veilRef} className="absolute inset-0 z-10 bg-void" style={{ opacity: 0.62 }} />

      {/* Volumetric fog */}
      <div className="cv-fog absolute inset-0 z-10" />

      {/* Digital particles */}
      <div className="absolute inset-0 z-20 mix-blend-screen">
        <ParticleField />
      </div>

      {/* Cursor light (desktop only) */}
      <div
        ref={lightRef}
        className="absolute left-0 top-0 z-20 h-[600px] w-[600px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-700"
        style={{ background: 'radial-gradient(circle, rgb(34 225 255 / 0.10), transparent 62%)' }}
      />

      {/* Film treatment */}
      <div className="scanlines absolute inset-0 z-30 opacity-60" />
      <div className="noise absolute inset-0 z-30 opacity-[0.05] mix-blend-overlay" />
      <div className="vignette absolute inset-0 z-30" />

      {/* Initial boot: fade from pure black on first load */}
      <div className="cv-boot absolute inset-0 z-40 bg-void" />
    </div>
  )
}

export const CinematicBackground = memo(CinematicBackgroundImpl)
export default CinematicBackground
