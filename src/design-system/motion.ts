/**
 * ORION-9 macOS / Liquid Glass Design System — Motion & Spring Physics
 * Apple-style spring curves and window interaction variants.
 */

import type { Transition, Variants } from 'motion/react';

export const ORION_SPRINGS = {
  // macOS responsive spring for controls and hover
  responsive: {
    type: 'spring',
    stiffness: 420,
    damping: 32,
    mass: 0.8,
  } as Transition,

  // Smooth tactile spring for windows and modals
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 28,
    mass: 0.9,
  } as Transition,

  // Crisp spring for menus and popovers
  crisp: {
    type: 'spring',
    stiffness: 450,
    damping: 36,
    mass: 0.7,
  } as Transition,

  // Gentle magnification spring for dock icons
  dockItem: {
    type: 'spring',
    stiffness: 320,
    damping: 24,
    mass: 0.6,
  } as Transition,

  // Instant minimal transition for reduced motion
  reduced: {
    type: 'tween',
    duration: 0.1,
    ease: 'easeOut',
  } as Transition,
};

export const ORION_WINDOW_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: ORION_SPRINGS.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    filter: 'blur(2px)',
    transition: { duration: 0.15, ease: [0.32, 0, 0.67, 0] },
  },
};

export const ORION_MODAL_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 12,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: ORION_SPRINGS.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

export const ORION_POPOVER_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: -4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: ORION_SPRINGS.crisp,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -2,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
};

export const ORION_TOOLTIP_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 2,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 1,
    transition: { duration: 0.08, ease: 'easeIn' },
  },
};
