# Scene videos

These are the scroll-scrubbed background clips, one per chapter. Paths are configured in `src/config/scenes.ts`.

| Chapter | File |
| ------- | ---- |
| 01 Awakening | `scene-01-awakening.mp4` |
| 02 Enter the Portal | `scene-02-portal.mp4` |
| 03 The Digital City | `scene-03-digital-city.mp4` |
| 04 The Hidden System | `scene-04-backend-underground.mp4` |
| 05 The Skill Chamber | `scene-05-skill-chamber.mp4` |
| 06 The Final Mission | `scene-06-final-mission.mp4` |

All files are optional. If a clip is missing, its chapter shows a tinted fallback atmosphere and the HUD reports FALLBACK RENDER.

## Encode for smooth scrubbing

Clips need frequent keyframes plus faststart. Strip the audio, since the videos are always muted.

```bash
ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 20 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart -an public/videos/scene-01-awakening.mp4
```

- `-g` is the keyframe interval in frames. `-g 1` (all-intra) gives the smoothest scrub but larger files.
- Target 1080p, **≤ 8–12 MB per clip**, no audio.

## Optional mobile variant

The mobile variant is 720p. Set it as `mobileSrc` in `scenes.ts`.

```bash
ffmpeg -i in.mp4 -vf scale=-2:720 -c:v libx264 -preset slow -crf 24 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart -an public/videos/scene-01-awakening-720.mp4
```

For continuity between chapters, start clip N+1 from the last frame of clip N.

## Current clips (cut from `Video Project.mp4`)

The six scene clips were cut from the 45 s Google Flow export
`Video Project.mp4` (1920×1080, 30 fps) at these source timestamps:

| Scene clip                         | Source range (s) | Content                          |
| ---------------------------------- | ---------------- | -------------------------------- |
| scene-01-awakening                 | 0.00 – 8.00      | Character forms from particles   |
| scene-02-portal                    | 8.00 – 15.70     | Portal approach and entry        |
| scene-03-digital-city              | 15.70 – 22.13    | Neon city overlook               |
| scene-04-backend-underground       | 22.13 – 30.10    | Blast door → data core           |
| scene-05-skill-chamber             | 30.10 – 38.00    | Skill chamber and skill tree     |
| scene-06-final-mission             | 38.00 – 44.40    | Core activation → energy vortex  |

The source's last ~0.6 s (44.4 s+) contains generated on-screen text and is
deliberately excluded. Each clip ends one frame before the next cut.

Re-cut one clip (desktop, then the `-720` mobile variant):

```bash
ffmpeg -ss 8 -i "Video Project.mp4" -t 7.666 -an -c:v libx264 -preset slow -crf 23 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart scene-02-portal.mp4
ffmpeg -ss 8 -i "Video Project.mp4" -t 7.666 -an -vf scale=-2:720 -c:v libx264 -preset slow -crf 26 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart scene-02-portal-720.mp4
```

`Video Project.mp4` itself is not referenced by the app. Anything in `public/`
is copied into the build, so move it out of `public/` before deploying.
