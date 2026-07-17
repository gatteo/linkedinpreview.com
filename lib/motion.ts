// ---------------------------------------------------------------------------
// Motion tokens — a single source of truth so every animation in the app feels
// coherent. Standardizes on the EASE_OUT curve already used in the hero/CSS.
//
// Reduced motion is handled globally by wrapping roots in
// <MotionConfig reducedMotion="user">, so individual components don't each have
// to branch on useReducedMotion().
// ---------------------------------------------------------------------------

import type { Transition, Variants } from 'framer-motion'

/** The house easing curve. Matches `--ease-out` in globals.css and the hero. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

/** Standard durations (seconds). Keep motion short — restraint reads as premium. */
export const DURATION = {
    fast: 0.15,
    base: 0.3,
    slow: 0.5,
} as const

/** Base transition used by most reveals. */
export const transition: Transition = {
    duration: DURATION.base,
    ease: EASE_OUT,
}

/** Fade + rise. The default entrance for content blocks. */
export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition },
}

/** Fade + gentle scale. For milestone art and celebratory beats. */
export const popIn: Variants = {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: { duration: DURATION.slow, ease: EASE_OUT } },
}

/** Parent that staggers its children's entrances. Pair with `staggerItem`. */
export const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.06, delayChildren: 0.04 },
    },
}

/** Child for `staggerContainer`. */
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition },
}

/**
 * Direction-aware wizard step transition. `custom` is the slide direction:
 * +1 advancing, -1 going back. Use with <AnimatePresence custom={direction} mode="popLayout">.
 */
export const slideStep: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0, transition },
    exit: (dir: number) => ({
        opacity: 0,
        x: dir > 0 ? -40 : 40,
        transition: { duration: DURATION.fast, ease: EASE_OUT },
    }),
}

/** whileTap press feedback for interactive surfaces (cards, custom buttons). */
export const pressable = {
    whileTap: { scale: 0.97 },
    transition: { duration: DURATION.fast, ease: EASE_OUT },
} as const
