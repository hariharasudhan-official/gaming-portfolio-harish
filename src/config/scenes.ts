/**
 * CINEMATIC SCENE CONFIGURATION
 * -----------------------------------------------------------------------------
 * One entry per chapter, in story order. This is the only place you need to
 * touch to swap clips, tune durations, or change how long each chapter lasts.
 *
 *  - `src`            Desktop clip (served from /public).
 *  - `mobileSrc`      Optional lighter clip for small screens / slow devices.
 *  - `poster`         Optional still frame shown while the clip loads (and as
 *                     the reduced-motion background). Missing files are fine.
 *  - `duration`       Fallback clip length in seconds, used only until the real
 *                     metadata loads (or if it never does).
 *  - `scrollLength`   How tall the chapter is, in viewport heights. Longer =
 *                     slower scrubbing through that clip.
 *  - `trimStart/End`  Seconds to skip at the head/tail of the clip, if the
 *                     generated video has dead frames.
 *  - `tint`           Accent used by the fallback atmosphere if the clip fails.
 */

export type SceneId =
  | 'awakening'
  | 'portal'
  | 'digital-city'
  | 'backend-underground'
  | 'skill-chamber'
  | 'final-mission'

export interface SceneConfig {
  id: SceneId
  /** Two-digit chapter number shown in the HUD. */
  number: string
  /** Short chapter title used by the HUD and navigation. */
  title: string
  /** One-line caption used by the navigation menu. */
  caption: string
  src: string
  mobileSrc?: string
  poster?: string
  duration: number
  scrollLength: number
  trimStart?: number
  trimEnd?: number
  tint: string
}

export const SCENES: SceneConfig[] = [
  {
    id: 'awakening',
    number: '01',
    title: 'Awakening',
    caption: 'System initializing',
    src: '/videos/scene-01-awakening.mp4',
    mobileSrc: '/videos/scene-01-awakening-720.mp4',
    poster: '/posters/scene-01-awakening.jpg',
    duration: 7.97,
    scrollLength: 2.2,
    tint: '#22e1ff',
  },
  {
    id: 'portal',
    number: '02',
    title: 'Enter the Portal',
    caption: 'Player profile',
    src: '/videos/scene-02-portal.mp4',
    mobileSrc: '/videos/scene-02-portal-720.mp4',
    poster: '/posters/scene-02-portal.jpg',
    duration: 7.67,
    scrollLength: 2,
    tint: '#3b82ff',
  },
  {
    id: 'digital-city',
    number: '03',
    title: 'The Digital City',
    caption: 'Missions & projects',
    src: '/videos/scene-03-digital-city.mp4',
    mobileSrc: '/videos/scene-03-digital-city-720.mp4',
    poster: '/posters/scene-03-digital-city.jpg',
    duration: 6.4,
    scrollLength: 2.6,
    tint: '#22e1ff',
  },
  {
    id: 'backend-underground',
    number: '04',
    title: 'The Hidden System',
    caption: 'Experience log',
    src: '/videos/scene-04-backend-underground.mp4',
    mobileSrc: '/videos/scene-04-backend-underground-720.mp4',
    poster: '/posters/scene-04-backend-underground.jpg',
    duration: 7.93,
    scrollLength: 2.4,
    tint: '#ffb02e',
  },
  {
    id: 'skill-chamber',
    number: '05',
    title: 'The Skill Chamber',
    caption: 'Skills & achievements',
    src: '/videos/scene-05-skill-chamber.mp4',
    mobileSrc: '/videos/scene-05-skill-chamber-720.mp4',
    poster: '/posters/scene-05-skill-chamber.jpg',
    duration: 7.87,
    scrollLength: 2.8,
    tint: '#3b82ff',
  },
  {
    id: 'final-mission',
    number: '06',
    title: 'The Final Mission',
    caption: 'Initiate contact',
    src: '/videos/scene-06-final-mission.mp4',
    mobileSrc: '/videos/scene-06-final-mission-720.mp4',
    poster: '/posters/scene-06-final-mission.jpg',
    duration: 6.37,
    scrollLength: 2,
    tint: '#ffb02e',
  },
]

/** Global tuning for the scroll → video engine. */
export const VIDEO_ENGINE = {
  /**
   * Height (in viewport heights) of the crossfade window before each chapter
   * boundary. The outgoing clip holds its last frame while the incoming clip
   * fades in on its first frame.
   */
  crossfade: 0.45,
  /** 0..1 — how quickly the displayed frame catches up to scroll (1 = instant). */
  smoothing: 0.22,
  /** Ignore seeks smaller than this many seconds (avoids decoder thrash). */
  seekEpsilon: 1 / 30,
  /** How many neighbouring scenes to keep loaded on desktop / mobile. */
  preloadRadius: { desktop: 1, mobile: 1 },
  /** Breakpoint (px) below which `mobileSrc` and lighter effects are used. */
  mobileBreakpoint: 768,
} as const

export const chapterDomId = (scene: SceneConfig) => `chapter-${scene.number}`
