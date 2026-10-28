# CODEVERSE — The Developer's Journey

A cinematic, scroll-driven developer portfolio styled like a AAA game menu. As you scroll, a fixed full-screen video stage plays through six story chapters frame by frame. Chamfered holographic HUD panels show the portfolio content over the footage.

| #  | Chapter            | Content                       |
| -- | ------------------ | ----------------------------- |
| 01 | Awakening          | Hero / system initializing    |
| 02 | Enter the Portal   | Player profile                |
| 03 | The Digital City   | Missions & projects           |
| 04 | The Hidden System  | Experience log                |
| 05 | The Skill Chamber  | Skills, certifications, education |
| 06 | The Final Mission  | Contact finale                |

This is a frontend-only static site with no backend.

---

## Tech stack

- **React 19** + **TypeScript 7** (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`)
- **Vite 8** with `@vitejs/plugin-react`
- **Tailwind CSS v4** (`@tailwindcss/vite`, design tokens in `@theme` in `src/index.css`)
- **framer-motion 14** for entrances and UI motion.
- **lucide-react 1.x** for icons. Brand icons (GitHub, LinkedIn) are local SVGs in `ui/BrandIcons.tsx`.
- **oxlint** for linting
- Fonts: Chakra Petch (display), Inter (body), JetBrains Mono (HUD labels)

## Requirements

- **Node.js 20.19+ or 22.12+** (required by Vite 8)
- npm (bundled with Node)

## Getting started

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check (tsc -b) and build to dist/
npm run preview    # serve the production build locally
npm run lint       # run oxlint
```

---

## Project structure

```
gaming-portfolio/
├─ index.html                     # meta / OG tags, font preconnects
├─ vite.config.ts
├─ public/
│  ├─ favicon.svg
│  ├─ videos/                     # scene clips (see public/videos/README.md)
│  └─ posters/                    # poster frames (see public/posters/README.md)
└─ src/
   ├─ main.tsx
   ├─ App.tsx                     # MotionConfig, background, HUD, <main> with 6 chapters
   ├─ index.css                   # Tailwind v4 @theme tokens + HUD component classes
   ├─ config/
   │  └─ scenes.ts                # SCENES (one per chapter) + VIDEO_ENGINE tuning
   ├─ data/
   │  └─ portfolio.ts             # content copy, links, contact details
   ├─ lib/
   │  ├─ scrollStore.ts           # single scroll listener → per-frame ScrollFrame
   │  └─ videoStatus.ts           # per-scene video status (idle/loading/ready/error)
   ├─ hooks/
   │  ├─ useScrollProgress.ts     # useScrollFrame, useActiveChapter, useScrollVar
   │  └─ useMediaQuery.ts         # useReducedMotion, useIsMobile, useFinePointer
   ├─ styles/                     # per-area CSS (hero, hud, missions, timeline, skills, finale)
   └─ components/
      ├─ CinematicBackground.tsx  # fixed stage: video, veil, fog, particles, film grain
      ├─ VideoSceneController.tsx # scroll-scrubbed video engine
      ├─ ParticleField.tsx
      ├─ GameHUD.tsx              # top bar, chapter rail, bottom bar
      ├─ ChapterNavigation.tsx    # chapter menu overlay
      ├─ ProjectMissionCard.tsx   # project "mission" panel
      ├─ ExperienceTimeline.tsx
      ├─ SkillTree.tsx
      ├─ ContactFinale.tsx        # chapter 06
      ├─ chapters/
      │  ├─ AwakeningChapter.tsx      # 01
      │  ├─ PortalChapter.tsx         # 02 (+ IdentityPanel.tsx)
      │  ├─ DigitalCityChapter.tsx    # 03
      │  ├─ HiddenSystemChapter.tsx   # 04
      │  └─ SkillChamberChapter.tsx   # 05
      └─ ui/
         ├─ Chapter.tsx           # <section id="chapter-0N"> wrapper, height = scrollLength × 100lvh
         ├─ chapterContext.ts     # useChapter() → { scene, index, headingId }
         ├─ HudPanel.tsx, ChapterTag.tsx, Reveal.tsx, BrandIcons.tsx
```

**Layering:** `CinematicBackground` is `position: fixed` at `z-0`. Chapters scroll over it in normal document flow at `z-10`, and the HUD sits on top. Native scrolling is never hijacked.

---

## How the scroll-scrubbed video works

The videos never autoplay. Your scroll position sets the playhead.

1. **Scroll store** (`src/lib/scrollStore.ts`). A single passive `scroll` listener schedules at most one `requestAnimationFrame` per frame. On each frame it measures `window.scrollY` against cached chapter ranges and produces a `ScrollFrame` with these fields:
   - `progress`: 0..1 across the whole page
   - `activeIndex`: the chapter whose top has crossed the middle of the viewport
   - `chapterProgress[]`: 0..1 progress through each chapter
   - `ranges`: start and end scrollY for each chapter

   Ranges are re-measured on resize, orientation change, and body size changes (a `ResizeObserver`). The store only reads the scroll position and never writes it. React components re-render only when the active chapter changes. Per-frame consumers write to refs or CSS variables instead.
2. **Target time** (`VideoSceneController.tsx`). Each scene maps its scroll position to a time inside the usable part of the clip (`trimStart` … `duration − trimEnd`). It never seeks to the exact end, because some browsers show a black frame there. A scene's scrub finishes at the start of the crossfade window, before the next chapter begins.
3. **Eased rAF loop.** The displayed time eases toward the target with frame-rate-independent exponential smoothing (`VIDEO_ENGINE.smoothing`). A new `currentTime` seek is issued only when the previous seek has finished (`video.seeking === false`) and the difference is larger than `seekEpsilon`. The loop stops when everything has settled.
4. **Crossfade.** Each chapter boundary has a window of `VIDEO_ENGINE.crossfade` viewport heights before it. In that window the outgoing clip holds its last frame while the incoming clip fades in (smoothstep) on its first frame. Layers fully covered by an opaque layer above them are set to `visibility: hidden`. A slow push-in (scale 1.07 → 1.0) runs across each chapter.
5. **Loading window.** Only the primary scene and its neighbours (±`preloadRadius`, default 1) get a `src`. The primary scene, and the outgoing scene during a crossfade, use `preload="auto"`; neighbours use `metadata`. Scenes further away are released (`src` removed and `load()` called) to free decoder memory. At most about 3 clips are active at once.
6. **Fallback atmosphere.** Under every video there is a tinted atmospheric layer: radial glows in the scene's `tint` plus a perspective floor grid. The `poster` image is applied to it as a CSS background, so a missing poster fails silently. A video is only shown after `loadeddata`. If the file is missing or broken, the layer goes to `data-status="error"` and the fallback stays visible. You never see a broken-video icon.
7. **iOS priming.** On some iOS Safari versions, a video that has never been played does not paint seeked frames. On touch devices, the first `touchstart`/`pointerdown` calls `play()` then immediately `pause()` on each loaded clip, then restores its time. Any other `play` event (autoplay heuristics, media keys) is paused immediately.
8. **Reduced motion.** With `prefers-reduced-motion: reduce`, each scene holds a single representative frame (40 % into the usable range) instead of scrubbing. Easing and the push-in are disabled, and chapters still crossfade.

Each scene's status is published through `videoStatusStore` (`src/lib/videoStatus.ts`), so the HUD can show buffering or **FALLBACK RENDER** states.

---

## Adding video clips

Put the clips in `public/videos/` with these exact names:

| Chapter | File |
| ------- | ---- |
| 01 | `scene-01-awakening.mp4` |
| 02 | `scene-02-portal.mp4` |
| 03 | `scene-03-digital-city.mp4` |
| 04 | `scene-04-backend-underground.mp4` |
| 05 | `scene-05-skill-chamber.mp4` |
| 06 | `scene-06-final-mission.mp4` |

Optional poster frames go in `public/posters/` with the same base names and a `.jpg` extension.

### Configuring `src/config/scenes.ts`

Each `SCENES` entry has these fields:

| Field | Purpose |
| ----- | ------- |
| `src` | Desktop clip, e.g. `'/videos/scene-01-awakening.mp4'` |
| `mobileSrc` | Optional lighter clip used below `mobileBreakpoint` (768 px), e.g. `'/videos/scene-01-awakening-720.mp4'` |
| `poster` | Optional still shown while loading and behind the video |
| `duration` | Fallback length in seconds, used until metadata loads |
| `scrollLength` | Chapter height in viewport heights (2–2.8 by default). Higher values scrub more slowly. |
| `trimStart` / `trimEnd` | Seconds to skip at the head or tail, for dead frames from the generator |
| `tint` | Accent colour of the fallback atmosphere |

`VIDEO_ENGINE` options:

| Option | Default | Purpose |
| ------ | ------- | ------- |
| `crossfade` | `0.45` | Crossfade window size, in viewport heights |
| `smoothing` | `0.22` | 0..1. How quickly the frame catches up to scroll (1 = instant) |
| `seekEpsilon` | `1/30` | Seeks smaller than this many seconds are ignored |
| `preloadRadius` | `{ desktop: 1, mobile: 1 }` | Number of neighbouring scenes kept loaded |
| `mobileBreakpoint` | `768` | Width below which `mobileSrc` is used |

### Encoding for smooth scrubbing (important)

Browsers can only seek precisely to **keyframes**. Most exported clips have a keyframe every 2–10 seconds, so every seek has to decode a long run of frames and scrubbing stutters. Re-encode every clip with frequent keyframes and `faststart`:

```bash
ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 20 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart -an public/videos/scene-01-awakening.mp4
```

What the flags do:

- `-g 6 -keyint_min 6` puts a keyframe every 6 frames. `-sc_threshold 0` keeps that interval fixed.
- **`-g 1` (all-intra)** is the smoothest possible scrub, but files are much larger. `-g 6`–`-g 10` is a good balance.
- `-movflags +faststart` moves the index to the front of the file, so seeking can start before the whole file has downloaded.
- `-pix_fmt yuv420p` gives the widest browser and device compatibility.
- `-an` strips the audio track. The videos are always muted.

**Recommendations:**
- Use 1080p, about 24–30 fps, 5–10 s per clip.
- Keep each clip at **≤ 8–12 MB**. Raise `-crf` (e.g. 22–24) if a clip is too large.

**Mobile variant** (720p, used through `mobileSrc`):

```bash
ffmpeg -i in.mp4 -vf scale=-2:720 -c:v libx264 -preset slow -crf 24 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart -an public/videos/scene-01-awakening-720.mp4
```

**Poster frame:**

```bash
ffmpeg -ss 0 -i public/videos/scene-01-awakening.mp4 -frames:v 1 -q:v 3 public/posters/scene-01-awakening.jpg
```

### Google Flow (or other AI video) export notes

- Keep the **same character** (reference image, outfit, lighting) across all six clips.
- For continuity, generate clip N+1 starting from the **last frame of clip N**. The crossfade holds the outgoing clip's last frame and fades in the incoming clip's first frame, so matching frames give an almost seamless transition.
- Keep the character roughly centred. The UI text sits in the left and right thirds and the lower area.
- Avoid camera cuts inside a clip, because scrubbing across a hard cut feels jarring.
- Use `trimStart`/`trimEnd` to remove fade-ins, fade-outs, or dead frames instead of re-exporting.

---

## Changing content, contact and social links

Content (profile, projects, experience, skills, certifications, education, contact and social links) lives in **`src/data/portfolio.ts`**. Chapter titles and captions live in **`src/config/scenes.ts`**. Fixed UI chrome labels are written directly in their components (for example the HUD status text, "Scroll to begin", "Comms Channel", "Achievements Unlocked"). Change those in the component itself.

- `profile`, `hero`, `projects`, `experience`, `skillCategories`, `certifications`, `education`, `finale`: text content.
- `contact.email`: when it is empty (`''`), the **INITIATE CONTACT** button is disabled and shows a placeholder. Set it to enable a `mailto:` link.
- `contact.contactUrl`: an alternative `https://` link (e.g. a booking page), used when no email is set. `getContactHref()` picks the email first, then this URL, otherwise `null`.
- `contact.linkedin`, `contact.github`, `contact.githubUsername`: social links. An empty or invalid URL hides or disables the link (checked with `isValidUrl()`).
- `projects[].url`: when it is empty, the card shows a non-clickable **PROJECT PREVIEW** label instead of a link.
- `education`: the MCA entry has placeholder `institution: ''` and `year: ''`. Fill these in when available.

Do not add made-up URLs, proficiency percentages, or certificate links. Empty values are handled gracefully.

---

## Accessibility & reduced motion

- Semantic landmarks: one `<main>`, and one `<section>` per chapter with `aria-labelledby` pointing at the chapter heading (`h1` for chapter 01, `h2` for the rest). There is a **Skip intro** link to `#chapter-02`.
- All decorative layers (video, fog, particles, scanlines) are `aria-hidden`. The videos are muted, have no controls, and are removed from the tab order.
- Chapter navigation uses native smooth scrolling and moves focus to the target section. It scrolls instantly when reduced motion is preferred.
- `<MotionConfig reducedMotion="user">` turns off framer-motion transforms. A global CSS override shortens animations. The video holds one frame per chapter.
- Interactive elements are keyboard accessible, have visible focus styles, and touch targets of at least 44 px. No information is available only on hover.

## Performance notes

- Scroll handling makes no React state updates per frame. Everything per-frame is written imperatively to refs or CSS variables.
- Only about 3 video elements decode at any time, and far scenes are released.
- Below 768 px, `mobileSrc` and lighter effects are used. The cursor light is desktop and fine-pointer only.
- Keep clips small and keyframe-dense (see encoding). Clip size and keyframe spacing have the biggest effect on smoothness.

## Browser support

Current Chrome, Edge, Firefox and Safari (desktop and iOS 16+). The site uses `lvh` units, `color-mix()`, `ResizeObserver` and CSS custom properties. H.264 MP4 (`yuv420p`) plays everywhere. If you add WebM/AV1 variants, keep MP4 as the baseline.

---

## Deployment

`npm run build` writes a fully static site to `dist/`. Any static host works.

| Host | Settings |
| ---- | -------- |
| **Vercel** | Framework preset *Vite*, build `npm run build`, output `dist` |
| **Netlify** | Build `npm run build`, publish `dist` |
| **Cloudflare Pages** | Framework *Vite*, build `npm run build`, output `dist` |
| **GitHub Pages** | Build in a GitHub Action and deploy `dist/` with `actions/deploy-pages` |

**GitHub Pages project sites** are served from `/<repo-name>/`:

1. Set `base: '/repo-name/'` in `vite.config.ts`.
2. The video and poster paths in `src/config/scenes.ts` are absolute (`'/videos/...'`), so they will not pick up the base automatically. Prefix them with `import.meta.env.BASE_URL`, e.g. ``src: `${import.meta.env.BASE_URL}videos/scene-01-awakening.mp4` ``. The same applies to `/favicon.svg` in `index.html` if you don't rely on Vite's rewriting.

**Serving video:**
- Scrubbing needs **HTTP range requests** (`206 Partial Content`). Vercel, Netlify, Cloudflare Pages and GitHub Pages all support them, and so do `vite dev` and `vite preview`.
- Give `/videos/*` and `/posters/*` long cache lifetimes, e.g. `Cache-Control: public, max-age=31536000, immutable`. When you replace a clip, rename it or add a query string.
- Very large files may hit host limits. GitHub blocks files over 100 MB, and Cloudflare Pages limits single files to 25 MB.

---

## Missing assets

The site works with **no video or poster files at all**. Expected files:

- `public/videos/scene-01-awakening.mp4` … `scene-06-final-mission.mp4`
- `public/posters/scene-01-awakening.jpg` … `scene-06-final-mission.jpg` (optional)
- any `mobileSrc` files you configure

When a clip is missing or fails to decode, that chapter shows its **tinted fallback atmosphere** (glow + perspective grid, plus the poster if one exists). The scene status becomes `error`, which the HUD reports as **FALLBACK RENDER**. Missing posters fail silently because they are CSS backgrounds.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Choppy or laggy scrubbing | Re-encode with frequent keyframes (`-g 6`, or `-g 1` for all-intra) and `+faststart`. Reduce resolution or bitrate, and add a 720p `mobileSrc`. |
| Video not visible on iOS | The clips must be muted with `playsInline` (both set by the engine), and priming runs on the first touch, so tap or scroll once. Check the file is H.264 `yuv420p`, not HEVC 10-bit. |
| Video shows only the fallback | Check the file name and path against `scenes.ts`, and open `/videos/<file>.mp4` directly in the browser. |
| Black frame at a chapter end | Increase `trimEnd` slightly. |
| Large files / slow first load | Keep clips ≤ 8–12 MB, raise `-crf`, and strip audio (`-an`). Only nearby scenes are loaded. |
| Scrubbing feels too fast or slow | Adjust that scene's `scrollLength`, or `VIDEO_ENGINE.smoothing`. |
| Broken asset paths on GitHub Pages | Set `base` and prefix the asset paths with `import.meta.env.BASE_URL` (see Deployment). |
