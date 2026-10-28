# Scene posters

Poster frames are optional still images, one per chapter. A poster shows while its clip loads and sits behind the video as part of the fallback atmosphere. Paths are configured as `poster` in `src/config/scenes.ts`.

Expected files:

- `scene-01-awakening.jpg`
- `scene-02-portal.jpg`
- `scene-03-digital-city.jpg`
- `scene-04-backend-underground.jpg`
- `scene-05-skill-chamber.jpg`
- `scene-06-final-mission.jpg`

Missing posters fail silently because they are applied as CSS backgrounds.

## Extract the first frame of a clip

```bash
ffmpeg -ss 0 -i public/videos/scene-01-awakening.mp4 -frames:v 1 -q:v 3 public/posters/scene-01-awakening.jpg
```

Use 1920×1080 or smaller, and aim for roughly 100–250 KB per JPEG (`-q:v` 2–5).
