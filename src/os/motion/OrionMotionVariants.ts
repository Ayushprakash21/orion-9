/**
 * ORION-9 OS MOTION VARIANTS
 * Standardized Framer Motion variants for all OS lifecycle transitions.
 */

import { Variants } from 'motion/react';
import { ORION_EASE, ORION_EASE_IN_OUT, ORION_MOTION_DURATIONS, ORION_BOOT_MOTION_SCALE } from './OrionMotion';

/**
 * Global OS Lifecycle Screen Fade/Scale Variants
 */
export const osLifecycleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.985,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.015,
    filter: 'blur(10px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.fast,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * Power On & Boot Screen Animation Variants
 * Scaled by ORION_BOOT_MOTION_SCALE for measured, calm 80% visual pacing.
 */
export const powerOnVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.cinematic * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    filter: 'blur(14px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * World Entry Sequence Motion Variants
 * Scaled by ORION_BOOT_MOTION_SCALE for measured, calm 80% visual pacing.
 */
export const worldEntryContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.02,
    filter: 'blur(12px)',
  },
  show: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth * ORION_BOOT_MOTION_SCALE,
      ease: ORION_EASE,
      staggerChildren: 0.1 * ORION_BOOT_MOTION_SCALE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(8px)',
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
    scale: 1.2,
    filter: 'blur(20px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.2,
    filter: 'blur(24px)',
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
    filter: 'blur(0px)',
  },
  closing: {
    opacity: 0,
    scale: 0.65,
    filter: 'blur(16px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.cinematic,
      ease: ORION_EASE_IN_OUT,
    },
  },
};

/**
 * OS Window Open / Close / Minimize / Restore Variants
 */
export const windowMotionVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.97,
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ORION_MOTION_DURATIONS.fast,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: 5,
    transition: {
      duration: ORION_MOTION_DURATIONS.instant,
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
    filter: 'blur(6px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.smooth,
      ease: ORION_EASE,
    },
  },
};

/**
 * Toast / Notification Motion Variants
 */
export const toastNotificationVariants: Variants = {
  initial: {
    opacity: 0,
    y: -12,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ORION_MOTION_DURATIONS.fast,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    x: 24,
    scale: 0.96,
    transition: {
      duration: ORION_MOTION_DURATIONS.instant,
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
    filter: 'blur(12px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.normal,
      ease: ORION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.04,
    filter: 'blur(16px)',
    transition: {
      duration: ORION_MOTION_DURATIONS.fast,
      ease: ORION_EASE_IN_OUT,
    },
  },
};
