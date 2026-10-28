import { MotionConfig } from 'framer-motion'
import { useCallback, useLayoutEffect, useRef } from 'react'
import CinematicBackground from './components/CinematicBackground'
import GameHUD from './components/GameHUD'
import AwakeningChapter from './components/chapters/AwakeningChapter'
import PortalChapter from './components/chapters/PortalChapter'
import DigitalCityChapter from './components/chapters/DigitalCityChapter'
import HiddenSystemChapter from './components/chapters/HiddenSystemChapter'
import SkillChamberChapter from './components/chapters/SkillChamberChapter'
import ContactFinale from './components/ContactFinale'
import { Chapter } from './components/ui/Chapter'
import { SCENES } from './config/scenes'
import { scrollStore } from './lib/scrollStore'

const CHAPTERS = [
  AwakeningChapter,
  PortalChapter,
  DigitalCityChapter,
  HiddenSystemChapter,
  SkillChamberChapter,
  ContactFinale,
]

export default function App() {
  const sections = useRef<(HTMLElement | null)[]>([])

  const setSection = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      sections.current[i] = el
    },
    [],
  )

  useLayoutEffect(() => {
    scrollStore.registerSections(sections.current.filter((el): el is HTMLElement => !!el))
    window.scrollTo(0, 0)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#chapter-02"
        className="btn-hud fixed left-4 top-4 z-[100] -translate-y-24 focus:translate-y-0"
      >
        Skip intro
      </a>

      <CinematicBackground />
      <GameHUD />

      <main id="main" className="relative z-10">
        {SCENES.map((scene, i) => {
          const Content = CHAPTERS[i]
          return (
            <Chapter key={scene.id} index={i} ref={setSection(i)}>
              <Content />
            </Chapter>
          )
        })}
      </main>
    </MotionConfig>
  )
}
