import { createContext, useContext } from 'react'
import type { SceneConfig } from '../../config/scenes'

export interface ChapterContextValue {
  scene: SceneConfig
  index: number
  /** id for the chapter's main heading — the <section> is labelled by it. */
  headingId: string
}

export const ChapterContext = createContext<ChapterContextValue | null>(null)

/** Scene, index and heading id of the enclosing <Chapter>. */
export function useChapter() {
  const ctx = useContext(ChapterContext)
  if (!ctx) throw new Error('useChapter must be used inside <Chapter>')
  return ctx
}
