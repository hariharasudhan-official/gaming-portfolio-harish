import { useChapter } from './chapterContext'

/** "CH 03 // THE DIGITAL CITY" style label shown at the top of a chapter. */
export function ChapterTag({ label, className = '' }: { label?: string; className?: string }) {
  const { scene } = useChapter()
  return (
    <p className={`hud-label flex items-center gap-3 ${className}`}>
      <span className="inline-block h-px w-8 bg-cyan/70" aria-hidden="true" />
      <span>
        CH {scene.number} <span className="text-dim">//</span> {label ?? scene.title}
      </span>
    </p>
  )
}

export default ChapterTag
