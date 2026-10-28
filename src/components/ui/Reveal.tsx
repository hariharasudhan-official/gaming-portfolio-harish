import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  delay?: number
  /** Horizontal offset to enter from (px). Negative = from the left. */
  x?: number
  y?: number
  blur?: boolean
  /**
   * How much of the element must be visible before revealing. The default
   * ('some' + bottom margin) still fires for elements taller than the
   * viewport, e.g. at 400% zoom.
   */
  amount?: number | 'some' | 'all'
}

/**
 * Scroll-triggered cinematic entrance (fade + drift + optional blur→sharp).
 * Uses framer-motion's IntersectionObserver-backed `whileInView`. Reduced
 * motion is handled globally by <MotionConfig reducedMotion="user">.
 */
export function Reveal({ children, delay = 0, x = 0, y = 24, blur = true, amount = 'some', ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x, y, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      viewport={{ once: true, amount, margin: amount === 'some' ? '0px 0px -15% 0px' : undefined }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
