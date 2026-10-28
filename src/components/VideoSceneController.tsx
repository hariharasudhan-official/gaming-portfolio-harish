import { memo, useEffect, useRef, type CSSProperties } from 'react'
import { SCENES, VIDEO_ENGINE, type SceneConfig } from '../config/scenes'
import { scrollStore, type ScrollFrame } from '../lib/scrollStore'
import { videoStatusStore } from '../lib/videoStatus'

/**
 * Scroll-scrubbed cinematic video sequence.
 *
 * - Videos never autoplay. Scroll position → target time; a rAF loop eases the
 *   displayed frame toward the target and only issues a new seek once the
 *   previous one has finished (`video.seeking === false`).
 * - Only the active scene and its neighbours get a `src`; far scenes are
 *   released, so at most ~3 clips are ever decoding.
 * - Each scene layer has a tinted atmospheric fallback underneath the video.
 *   The video only becomes visible after `loadeddata`, so a missing or broken
 *   file never shows a broken-video icon or a blank page.
 * - React renders this tree once; everything per-frame is imperative.
 */

interface SceneRuntime {
  layer: HTMLDivElement
  inner: HTMLDivElement
  video: HTMLVideoElement
  fallback: HTMLDivElement
  src: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  duration: number
  /** Eased time currently being displayed. */
  shown: number
  /** Time the scroll position asks for. */
  target: number
  opacity: number
  /** Ignore 'play' events we triggered ourselves when priming iOS. */
  priming: boolean
  posterApplied: boolean
  /** performance.now() of the last load error, for retry backoff. */
  errorAt: number
  /** Consecutive load errors since the last successful load. */
  errors: number
}

const smoothstep = (x: number) => {
  const t = x < 0 ? 0 : x > 1 ? 1 : x
  return t * t * (3 - 2 * t)
}
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function pickSource(scene: SceneConfig) {
  const small = window.matchMedia(`(max-width: ${VIDEO_ENGINE.mobileBreakpoint - 1}px)`).matches
  return small && scene.mobileSrc ? scene.mobileSrc : scene.src
}

function VideoSceneControllerImpl() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const innerRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const fallbackRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const reduceMql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileMql = window.matchMedia(`(max-width: ${VIDEO_ENGINE.mobileBreakpoint - 1}px)`)
    const coarseMql = window.matchMedia('(pointer: coarse)')

    const scenes: SceneRuntime[] = SCENES.map((scene, i) => ({
      layer: layerRefs.current[i]!,
      inner: innerRefs.current[i]!,
      video: videoRefs.current[i]!,
      fallback: fallbackRefs.current[i]!,
      src: null,
      status: 'idle',
      duration: scene.duration,
      shown: 0,
      target: 0,
      opacity: i === 0 ? 1 : 0,
      priming: false,
      posterApplied: false,
      errorAt: 0,
      errors: 0,
    }))

    let lastFrame: ScrollFrame | null = null
    let rafId = 0
    let lastTick = 0
    const cleanups: (() => void)[] = []

    const setStatus = (i: number, status: SceneRuntime['status']) => {
      scenes[i].status = status
      scenes[i].layer.dataset.status = status
      videoStatusStore.set(i, status)
    }

    const usableEnd = (i: number) => {
      const s = scenes[i]
      const cfg = SCENES[i]
      const start = Math.min(cfg.trimStart ?? 0, Math.max(0, s.duration - 0.1))
      // Never seek to the exact end: several browsers render a black frame there.
      const end = Math.max(start, s.duration - (cfg.trimEnd ?? 0) - 0.06)
      return { start, end }
    }

    const timeFor = (i: number, t: number) => {
      const { start, end } = usableEnd(i)
      // Reduced motion: hold one representative frame instead of scrubbing.
      if (reduceMql.matches) return start + (end - start) * 0.4
      return start + (end - start) * clamp01(t)
    }

    /**
     * Scene progress 0→1. Reaches 1 when the next layer starts fading in, so
     * the outgoing clip holds its last frame through the crossfade.
     */
    const sceneT = (i: number, f: ScrollFrame) => {
      const r = f.ranges[i]
      if (!r) return 0
      const fade = Math.max(1, VIDEO_ENGINE.crossfade * f.viewportHeight)
      const holdEnd = i < f.ranges.length - 1 ? f.ranges[i + 1].start - fade : r.end
      return (f.scrollY - r.start) / Math.max(1, holdEnd - r.start)
    }

    // ---- loading / releasing -------------------------------------------------

    const load = (i: number, eager: boolean) => {
      const s = scenes[i]
      if (!s.posterApplied && SCENES[i].poster) {
        // Background images 404 silently — no broken image icons.
        s.fallback.style.backgroundImage = `url("${SCENES[i].poster}")`
        s.posterApplied = true
      }
      if (s.src) {
        if (eager && s.video.preload !== 'auto') s.video.preload = 'auto'
        return
      }
      if (s.status === 'error') {
        // Retry only when the scene is primary/eager, after a backoff, a few times max.
        if (!eager || s.errors >= 3 || performance.now() - s.errorAt < 4000 * s.errors) return
      }
      s.src = pickSource(SCENES[i])
      s.video.preload = eager ? 'auto' : 'metadata'
      s.video.src = s.src
      setStatus(i, 'loading')
      s.video.load()
    }

    const release = (i: number) => {
      const s = scenes[i]
      if (!s.src) return
      s.src = null
      s.video.removeAttribute('src')
      s.video.load()
      if (s.status !== 'error') setStatus(i, 'idle')
    }

    // ---- per-video events ----------------------------------------------------

    scenes.forEach((s, i) => {
      const v = s.video
      // React sets `muted` as a property only; make sure it is really muted.
      v.muted = true
      v.defaultMuted = true
      const onMeta = () => {
        if (Number.isFinite(v.duration) && v.duration > 0) s.duration = v.duration
        s.shown = s.target = timeFor(i, lastFrame ? sceneT(i, lastFrame) : 0)
        try {
          v.currentTime = s.shown
        } catch {
          /* not seekable yet */
        }
      }
      const onData = () => {
        if (!s.src) return
        s.errors = 0
        setStatus(i, 'ready')
        kick()
      }
      const onError = () => {
        // A released video (src removed) also fires 'error' in some browsers.
        if (!s.src) return
        s.errors++
        s.errorAt = performance.now()
        setStatus(i, 'error')
        s.src = null
        // Drop the failed source so a later retry starts clean.
        s.video.removeAttribute('src')
      }
      const onPlay = () => {
        // Scroll owns playback. Anything else (autoplay heuristics, media keys)
        // is cancelled immediately.
        if (!s.priming) v.pause()
      }
      const onSeeked = () => kick()
      v.addEventListener('loadedmetadata', onMeta)
      v.addEventListener('loadeddata', onData)
      v.addEventListener('error', onError)
      v.addEventListener('play', onPlay)
      v.addEventListener('seeked', onSeeked)
      cleanups.push(() => {
        v.removeEventListener('loadedmetadata', onMeta)
        v.removeEventListener('loadeddata', onData)
        v.removeEventListener('error', onError)
        v.removeEventListener('play', onPlay)
        v.removeEventListener('seeked', onSeeked)
      })
    })

    // iOS Safari will not paint seeked frames for a never-played element on
    // some versions. Prime loaded videos once on the first real user gesture.
    let primed = false
    const prime = () => {
      if (primed) return
      primed = true
      scenes.forEach((s) => {
        if (!s.src || s.video.readyState < 1) return
        s.priming = true
        const resume = s.shown
        s.video
          .play()
          .then(() => {
            s.video.pause()
            s.video.currentTime = resume
          })
          .catch(() => {
            /* autoplay policy refused — seeking still works on most browsers */
          })
          .finally(() => {
            s.priming = false
          })
      })
      window.removeEventListener('touchstart', prime)
      window.removeEventListener('pointerdown', prime)
    }
    if (coarseMql.matches) {
      window.addEventListener('touchstart', prime, { passive: true })
      window.addEventListener('pointerdown', prime, { passive: true })
      cleanups.push(() => {
        window.removeEventListener('touchstart', prime)
        window.removeEventListener('pointerdown', prime)
      })
    }

    // ---- scroll → targets ----------------------------------------------------

    const applyFrame = (f: ScrollFrame) => {
      lastFrame = f
      const { ranges, scrollY: y, viewportHeight: vh } = f
      if (!ranges.length) return
      const fade = Math.max(1, VIDEO_ENGINE.crossfade * vh)

      // Fade-in of each layer: complete when the chapter reaches the top.
      const fadeIn = ranges.map((r, i) => (i === 0 ? 1 : smoothstep((y - (r.start - fade)) / fade)))

      let primary = 0
      fadeIn.forEach((o, i) => {
        if (o > 0) primary = i
      })

      scenes.forEach((s, i) => {
        const t = sceneT(i, f)
        s.target = timeFor(i, t)
        s.opacity = fadeIn[i]
        // Layers fully covered by an opaque upper layer are hidden entirely.
        const covered = fadeIn.slice(i + 1).some((o) => o >= 0.999)
        s.layer.style.opacity = s.opacity.toFixed(3)
        s.layer.style.visibility = covered || s.opacity <= 0.001 ? 'hidden' : 'visible'
        if (!reduceMql.matches) {
          // Slow cinematic push-in across the chapter.
          s.inner.style.transform = `scale(${(1.07 - 0.07 * clamp01(t)).toFixed(4)})`
        }
      })

      // Load window around the primary scene; release far-away scenes.
      const radius = mobileMql.matches ? VIDEO_ENGINE.preloadRadius.mobile : VIDEO_ENGINE.preloadRadius.desktop
      const keep = mobileMql.matches ? radius : radius + 1
      scenes.forEach((_, i) => {
        const d = Math.abs(i - primary)
        if (d <= radius) load(i, d === 0 || (i === primary - 1 && fadeIn[primary] < 1))
        else if (d > keep) release(i)
      })

      kick()
    }

    // ---- rAF easing / seeking loop ------------------------------------------

    const tick = (now: number) => {
      rafId = 0
      const dt = lastTick ? Math.min(64, now - lastTick) : 16.7
      lastTick = now
      // Frame-rate independent exponential smoothing.
      const alpha = reduceMql.matches ? 1 : 1 - Math.pow(1 - VIDEO_ENGINE.smoothing, dt / 16.7)
      let busy = false

      scenes.forEach((s) => {
        if (s.status !== 'ready' || s.layer.style.visibility === 'hidden') return
        const v = s.video
        const diff = s.target - s.shown
        s.shown = Math.abs(diff) < 0.004 ? s.target : s.shown + diff * alpha
        if (s.shown !== s.target) busy = true
        if (v.seeking) {
          busy = true
          return
        }
        if (Math.abs(v.currentTime - s.shown) > VIDEO_ENGINE.seekEpsilon) {
          v.currentTime = s.shown
          busy = true
        }
      })

      if (busy) rafId = requestAnimationFrame(tick)
      else lastTick = 0
    }

    function kick() {
      if (!rafId) rafId = requestAnimationFrame(tick)
    }

    const unsubscribe = scrollStore.subscribeFrame(applyFrame)
    const onReduceChange = () => lastFrame && applyFrame(lastFrame)
    reduceMql.addEventListener('change', onReduceChange)

    return () => {
      unsubscribe()
      reduceMql.removeEventListener('change', onReduceChange)
      if (rafId) cancelAnimationFrame(rafId)
      cleanups.forEach((fn) => fn())
      scenes.forEach((s) => {
        s.video.pause()
        s.video.removeAttribute('src')
        s.video.load()
      })
    }
  }, [])

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {SCENES.map((scene, i) => (
        <div
          key={scene.id}
          ref={(el) => {
            layerRefs.current[i] = el
          }}
          className="scene-layer"
          data-status="idle"
          style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden', zIndex: i + 1 }}
        >
          <div
            ref={(el) => {
              innerRefs.current[i] = el
            }}
            className="scene-inner"
          >
            <div
              ref={(el) => {
                fallbackRefs.current[i] = el
              }}
              className="scene-fallback"
              style={{ '--tint': scene.tint } as CSSProperties}
            />
            <video
              ref={(el) => {
                videoRefs.current[i] = el
              }}
              className="scene-video"
              muted
              playsInline
              preload="none"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Memoised: has no props and must never re-render (that would reset videos). */
export const VideoSceneController = memo(VideoSceneControllerImpl)
export default VideoSceneController
