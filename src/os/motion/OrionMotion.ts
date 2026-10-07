/**
 * ORION-9 OS CENTRAL MOTION SYSTEM & TOKENS
 * Framer Motion curve definitions, duration tokens, and reduced-motion utilities.
 */

import { useOptionalSupplyChain } from '../../store/SupplyChainContext';

export const ORION_EASE = [0.22, 1, 0.36, 1] as const;
export const ORION_EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const ORION_EASE_OUT = [0, 0, 0.2, 1] as const;

export const ORION_SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.8,
} as const;

export const ORION_SPRING_BOUNCY = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
} as const;

export const ORION_MOTION_DURATIONS = {
  instant: 0.15,
  fast: 0.25,
  normal: 0.45,
  smooth: 0.7,
  cinematic: 1.1,
  epic: 1.8,
} as const;

/**
 * Pacing scale factor for pre-login and post-login boot & lifecycle sequences.
 * Slows visual progression to ~80% speed (duration * 1.25).
 */
export const ORION_BOOT_MOTION_SCALE = 1.25;

/**
 * Determines whether reduced motion should be enforced
 */
export function isReducedMotionPreferred(settingReducedMotion?: boolean): boolean {
  if (settingReducedMotion) return true;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/**
 * React Hook for safely resolving reduced motion preference
 */
export function useIsReducedMotion(overrideSetting?: boolean): boolean {
  const supplyChain = useOptionalSupplyChain();
  const setting = overrideSetting ?? supplyChain?.settings?.reducedMotion;
  return isReducedMotionPreferred(setting);
}

/**
 * Returns adjusted animation duration based on reduced-motion preference
 */
export function getMotionDuration(normalDuration: number, isReduced: boolean): number {
  return isReduced ? Math.min(normalDuration, 0.12) : normalDuration;
}
