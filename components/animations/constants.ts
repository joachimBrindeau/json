/**
 * Animation Constants
 * Shared animation configurations for consistent motion design across the app
 */

import type { Transition, Variants } from 'framer-motion';

/**
 * Standard transition presets
 */
export const TRANSITIONS = {
  // Spring physics - natural, bouncy feel
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  springFast: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
  springSlow: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 35,
  },

  // Smooth easing - polished, professional
  smooth: {
    duration: 0.3,
    ease: 'easeInOut' as const,
  },
  smoothFast: {
    duration: 0.15,
    ease: 'easeOut' as const,
  },
  smoothSlow: {
    duration: 0.5,
    ease: 'easeInOut' as const,
  },

  // Instant - for layout shifts
  instant: {
    duration: 0,
  },
} satisfies Record<string, Transition>;

/**
 * Common animation variants
 */
export const VARIANTS = {
  // Fade animations
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeOut: {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  },

  // Slide animations
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },

  // Scale animations
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },

  // Combined animations
  slideUpScale: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },

  // Collapse/Expand
  collapse: {
    open: { height: 'auto', opacity: 1 },
    closed: { height: 0, opacity: 0 },
  },

  // Stagger container
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  staggerContainerSlow: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
} satisfies Record<string, Variants>;

/**
 * Hover and tap effects for interactive elements
 */
export const INTERACTIONS = {
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },
  buttonSubtle: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
  },
  buttonBounce: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
  card: {
    whileHover: { y: -4, scale: 1.01 },
    whileTap: { scale: 0.99 },
  },
  icon: {
    whileHover: { scale: 1.1, rotate: 5 },
    whileTap: { scale: 0.9 },
  },
};

/**
 * Page transition variants
 */
export const PAGE_TRANSITIONS = {
  fadeSlide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

/**
 * Modal/Dialog animations
 */
export const MODAL_ANIMATIONS = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  },
  contentSpring: {
    initial: { opacity: 0, scale: 0.9, y: 30 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  },
};

/**
 * Toast notification animations
 */
export const TOAST_ANIMATIONS = {
  slideIn: {
    initial: { opacity: 0, y: -50, scale: 0.3 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.5,
      transition: {
        duration: 0.2,
      },
    },
  },
  slideRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
  },
};

/**
 * Loading animations
 */
export const LOADING_ANIMATIONS = {
  spinner: {
    rotate: [0, 360],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
  pulse: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  skeleton: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

/**
 * Highlight/Flash animations for search results
 */
export const HIGHLIGHT_ANIMATIONS = {
  flash: {
    backgroundColor: ['transparent', '#fef3c7', 'transparent'],
    transition: {
      duration: 0.6,
      ease: 'easeInOut' as const,
    },
  },
  flashBlue: {
    backgroundColor: ['transparent', '#dbeafe', 'transparent'],
    transition: {
      duration: 0.6,
      ease: 'easeInOut' as const,
    },
  },
  glow: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0)',
      '0 0 0 4px rgba(59, 130, 246, 0.3)',
      '0 0 0 0 rgba(59, 130, 246, 0)',
    ],
    transition: {
      duration: 0.6,
      ease: 'easeInOut' as const,
    },
  },
};
