import type { Variants } from 'framer-motion'

// Shared animation variants — properly typed for Framer Motion

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

export const itemAnim: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.3,  ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const slideIn: Variants = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
}
