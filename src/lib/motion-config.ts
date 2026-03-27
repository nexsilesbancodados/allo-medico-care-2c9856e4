/**
 * Global motion configuration for optimized Framer Motion animations.
 * Use these presets instead of inline animation values.
 */

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.25 },
  },
};

export const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};

/** Check if user prefers reduced motion */
export const shouldReduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
