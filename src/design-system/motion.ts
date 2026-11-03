/**
 * ORION-9 macOS / Liquid Glass Design System — Motion & Spring Physics
 * Re-exports centralized Orion Motion Engine tokens for design-system components.
 */

import type { Transition, Variants } from 'motion/react';
import {
  ORION_SPRINGS,
  ORION_SPRING_SNAPPY,
  ORION_SPRING_SMOOTH,
  ORION_SPRING_BOUNCY,
  ORION_SPRING_GENTLE,
  ORION_SPRING_DOCK,
  ORION_SPRING_WINDOW,
  ORION_SPRING_MODAL,
  ORION_EASE,
  ORION_EASE_IN_OUT,
  ORION_EASE_OUT,
  ORION_MOTION_DURATIONS,
} from '../os/motion/OrionMotion';

export {
  ORION_SPRINGS,
  ORION_SPRING_SNAPPY,
  ORION_SPRING_SMOOTH,
  ORION_SPRING_BOUNCY,
  ORION_SPRING_GENTLE,
  ORION_SPRING_DOCK,
  ORION_SPRING_WINDOW,
  ORION_SPRING_MODAL,
  ORION_EASE,
  ORION_EASE_IN_OUT,
  ORION_EASE_OUT,
  ORION_MOTION_DURATIONS,
};

export const ORION_WINDOW_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 12,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: ORION_SPRING_WINDOW,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    filter: 'blur(4px)',
    transition: { duration: 0.18, ease: ORION_EASE_IN_OUT },
  },
};

export const ORION_MODAL_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 14,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: ORION_SPRING_MODAL,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    filter: 'blur(4px)',
    transition: { duration: 0.16, ease: ORION_EASE_IN_OUT },
  },
};

export const ORION_POPOVER_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: ORION_SPRING_SNAPPY,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -3,
    filter: 'blur(2px)',
    transition: { duration: 0.12, ease: ORION_EASE_OUT },
  },
};

export const ORION_TOOLTIP_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.92,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.12, ease: ORION_EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.08, ease: ORION_EASE_OUT },
  },
};

export const ORION_CARD_HOVER: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: 'var(--orion-shadow-sm, 0 1px 3px rgba(0,0,0,0.3))',
    transition: ORION_SPRING_SNAPPY,
  },
  hover: {
    scale: 1.015,
    y: -2,
    boxShadow: 'var(--orion-shadow-lg, 0 16px 36px rgba(0,0,0,0.5))',
    transition: ORION_SPRING_SNAPPY,
  },
  tap: {
    scale: 0.985,
    y: 0,
    transition: ORION_SPRING_SNAPPY,
  },
};

export const MOTION_SPRINGS = ORION_SPRINGS;
export const MOTION_DURATIONS = ORION_MOTION_DURATIONS;
