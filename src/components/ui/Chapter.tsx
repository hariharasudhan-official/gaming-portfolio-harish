import type { ReactNode, Ref } from 'react'
import { SCENES, chapterDomId } from '../../config/scenes'
import { ChapterContext } from './chapterContext'

interface ChapterProps {
  index: number
  children: ReactNode
  ref?: Ref<HTMLElement>
  className?: string
}

/**
 * A story chapter. Its height (from `scrollLength` in config/scenes.ts) sets
 * how much scrolling the matching background clip is scrubbed across.
 */
export function Chapter({ index, children, ref, className = '' }: ChapterProps) {
  const scene = SCENES[index]
  const id = chapterDomId(scene)
  const headingId = `${id}-title`
  return (
    <ChapterContext.Provider value={{ scene, index, headingId }}>
      <section
        ref={ref}
        id={id}
        tabIndex={-1}
        aria-labelledby={headingId}
        data-chapter={scene.number}
        className={`relative z-10 ${className}`}
        style={{ minHeight: `${scene.scrollLength * 100}lvh` }}
      >
        {children}
      </section>
    </ChapterContext.Provider>
  )
}
