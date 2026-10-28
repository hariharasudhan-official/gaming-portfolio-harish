import { memo, useEffect, useRef } from 'react'

/**
 * Lightweight canvas of drifting "digital dust". Density scales with screen
 * area, DPR is capped, the loop pauses when the tab is hidden, and reduced
 * motion renders a single static frame.
 */
function ParticleFieldImpl({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 767px)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5)

    type P = { x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number; amber: boolean }
    let particles: P[] = []
    let w = 0
    let h = 0
    let raf = 0
    let last = 0

    const seed = () => {
      const count = Math.round(Math.min(small ? 45 : 110, (w * h) / (small ? 14000 : 11000)))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.35,
        vx: (Math.random() - 0.5) * 0.06,
        vy: -(Math.random() * 0.18 + 0.04),
        a: Math.random() * 0.6 + 0.2,
        tw: Math.random() * Math.PI * 2,
        amber: Math.random() < 0.08,
      }))
    }

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
      if (reduce) draw(0)
    }

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        if (dt) {
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.tw += dt * 0.002
          if (p.y < -4) {
            p.y = h + 4
            p.x = Math.random() * w
          }
          if (p.x < -4) p.x = w + 4
          else if (p.x > w + 4) p.x = -4
        }
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw))
        ctx.fillStyle = p.amber ? `rgba(255,176,46,${alpha})` : `rgba(120,236,255,${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = (now: number) => {
      const dt = last ? Math.min(50, now - last) : 16
      last = now
      draw(dt)
      raf = requestAnimationFrame(loop)
    }

    const onVisibility = () => {
      if (reduce) return
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    if (!reduce) raf = requestAnimationFrame(loop)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className={`h-full w-full ${className}`} aria-hidden="true" />
}

export const ParticleField = memo(ParticleFieldImpl)
export default ParticleField
