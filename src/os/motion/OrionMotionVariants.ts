/**
 * ORION-9 OS MOTION VARIANTS — MOTION EXPERIENCE 2.0
 * Standardized Framer Motion variants for all OS lifecycle transitions,
 * windows, spaces, dock, launcher, command palette, and interactive sheets.
 */

import { Variants } from 'motion/react';
import { 
  ORION_EASE, 
  ORION_EASE_IN_OUT, 
  ORION_EASE_OUT,
  ORION_MOTION_DURATIONS, 
  ORION_BOOT_MOTION_SCALE,
  ORION_SPRING_WINDOW,
  ORION_SPRING_SMOOTH,
  ORION_SPRING_MODAL,
  ORION_SPRING_SNAPPY,
  ORION_SPRING_BOUNCY,
  ORION_SPRING_GENTLE
} from './OrionMotion';

/**
 * Global OS Lifecycle Screen Fade/Scale Variants
 */
export const osLifecycleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.015,
    transition: {
      duration: ORION_MOTION_DURATIONS.fast,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * Power On & Boot Screen Animation Variants
 */
export const powerOnVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ORION_MOTION_DURATIONS.cinematic * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.04,
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * World Entry Sequence Motion Variants
 */
export const worldEntryContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.02,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE,
      staggerChildren: 0.1 * ORION_BOOT_MOTION_SCALE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: ORION_MOTION_DURATIONS.normal * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

export const worldEntryItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ORION_MOTION_DURATIONS.normal * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE,
    },
  },
};

/**
 * Logout Screen Contraction Variants
 */
export const logoutCoreVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.35,
    transition: {
      duration: ORION_MOTION_DURATIONS.cinematic,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * Shutdown Contraction Motion Variants
 */
export const shutdownVariants: Variants = {
  initial: {
    opacity: 1,
    scale: 1,
  },
  closing: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: ORION_MOTION_DURATIONS.cinematic,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * macOS Sequoia-inspired Window Open / Close / Restore Variants
 */
export const windowMotionVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 14,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: ORION_SPRING_WINDOW,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: {
      duration: 0.16,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * Desktop Entrance Stagger Variants
 */
export const desktopEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth,
      ease: ORION_EASE,
    },
  },
};

/**
 * Dock Appearance & Exit Variants
 */
export const dockEntranceVariants: Variants = {
  hidden: (position: string) => ({
    opacity: 0,
    y: position === 'bottom' ? 36 : position === 'top' ? -36 : 0,
    x: position === 'left' ? -36 : position === 'right' ? 36 : 0,
    scale: 0.96,
  }),
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: {
      ...ORION_SPRING_SMOOTH,
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

export const dockItemEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.75,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: ORION_SPRING_SNAPPY,
  },
};

/**
 * Application Launcher Entrance / Exit Variants
 */
export const launcherMotionVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 16,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: ORION_SPRING_MODAL,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: {
      duration: 0.16,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * Command Palette Entrance / Exit Variants
 */
export const commandPaletteMotionVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: -14,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: ORION_SPRING_SNAPPY,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -8,
    transition: {
      duration: 0.14,
      ease: ORION_EASE_OUT,
    },
  },
};

/**
 * Mission Control Spatial Overview Variants
 * Animates only opacity on backdrop (blur stays GPU-static on container)
 */
export const missionControlBackdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.24,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

export const missionControlWindowCardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 20,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...ORION_SPRING_SMOOTH,
      delay: i * 0.03,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 12,
    transition: {
      duration: 0.16,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * Spatial Workspace Switching Variants (Horizontal pan)
 */
export const workspaceSwitchVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.985,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: ORION_SPRING_SMOOTH,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 120 : -120,
    opacity: 0,
    scale: 0.985,
    transition: {
      duration: 0.2,
      ease: ORION_EASE_IN_OUT,
    },
  }),
};

/**
 * Toast / Notification Motion Variants
 */
export const toastNotificationVariants: Variants = {
  initial: {
    opacity: 0,
    y: -14,
    scale: 0.94,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: ORION_SPRING_BOUNCY,
  },
  exit: {
    opacity: 0,
    x: 32,
    scale: 0.95,
    transition: {
      duration: 0.16,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * Lock Screen Motion Variants
 */
export const lockScreenVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ORION_MOTION_DURATIONS.normal,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.04,
    transition: {
      duration: ORION_MOTION_DURATIONS.fast,
      ease: ORION_EASE_IN_OUT,
    },
  },
};
