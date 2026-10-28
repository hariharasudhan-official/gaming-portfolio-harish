import type { ElementType, ReactNode } from 'react'

interface HudPanelProps {
  children: ReactNode
  className?: string
  /** Render cyan corner brackets. */
  corners?: boolean
  as?: ElementType
}

/** Chamfered, glassy holographic panel used across all chapters. */
export function HudPanel({ children, className = '', corners = true, as: Tag = 'div' }: HudPanelProps) {
  return (
    <Tag className={`hud-panel ${className}`}>
      {corners && (
        <>
          <span className="hud-corner right-2 top-2 border-r border-t" aria-hidden="true" />
          <span className="hud-corner bottom-2 left-2 border-b border-l" aria-hidden="true" />
        </>
      )}
      {children}
    </Tag>
  )
}

export default HudPanel
