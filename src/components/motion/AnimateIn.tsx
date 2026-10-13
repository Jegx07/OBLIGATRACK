import { motion, AnimatePresence } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { cn } from '@/lib/utils'

// ── Shared easing ──────────────────────────────────────────────
const easeOut = [0.16, 1, 0.3, 1]

// ── AnimateIn ─────────────────────────────────────────────────
// Scroll-triggered entrance animation. Respects reduced-motion.
interface AnimateInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  duration?: number
  distance?: number
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.4,
  distance = 18,
}: AnimateInProps) {
  const [ref, isVisible] = useScrollAnimation()

  const directionMap = {
    up:    { y: distance },
    down:  { y: -distance },
    left:  { x: distance },
    right: { x: -distance },
    fade:  {},
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isVisible ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

// ── StaggerChildren ───────────────────────────────────────────
// Wraps a list and staggers each direct child's entrance
interface StaggerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  baseDelay?: number
}

export function StaggerChildren({ children, className, staggerDelay = 0.07, baseDelay = 0 }: StaggerProps) {
  const [ref, isVisible] = useScrollAnimation()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: baseDelay } },
      }}
    >
      {children}
    </motion.div>
  )
}

// ── StaggerItem ───────────────────────────────────────────────
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
      }}
    >
      {children}
    </motion.div>
  )
}

// ── PageTransition ────────────────────────────────────────────
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

// ── FadeIn ────────────────────────────────────────────────────
export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ── ScaleIn ───────────────────────────────────────────────────
export function ScaleIn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}
