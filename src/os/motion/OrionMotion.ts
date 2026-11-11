/**
 * ORION-9 MOTION EXPERIENCE 2.0 — CENTRALIZED MOTION ENGINE
 * 
 * Provides unified, physics-based springs, durations, transition curves,
 * and accessibility-respecting motion tokens for the entire Orion-9 Web OS.
 * Inspired by macOS Sequoia and Liquid Glass interaction design.
 */

import type { Transition } from 'motion/react';
import { useOptionalSupplyChain } from '../../store/SupplyChainContext';

// ---------------------------------------------------------------------------
// 1. PHYSICAL SPRING PRESETS
// ---------------------------------------------------------------------------

/**
 * Snappy tactile response for micro-interactions (presses, badges, toggles).
 */
export const ORION_SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.6,
} as const satisfies Transition;

/**
 * Smooth, elegant spring for windows, drawers, and full-pane surfaces.
 */
export const ORION_SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.85,
} as const satisfies Transition;

/**
 * Controlled, energetic spring for launch feedback, toast entry, and alert pulses.
 */
export const ORION_SPRING_BOUNCY = {
  type: 'spring',
  stiffness: 380,
  damping: 22,
  mass: 0.8,
} as const satisfies Transition;

/**
 * Calm, ambient spring for background layers, wallpaper transitions, and dimmers.
 */
export const ORION_SPRING_GENTLE = {
  type: 'spring',
  stiffness: 200,
  damping: 26,
  mass: 1.0,
} as const satisfies Transition;

/**
 * Fluid magnification spring for the macOS-style Dock icons.
 */
export const ORION_SPRING_DOCK = {
  type: 'spring',
  stiffness: 360,
  damping: 24,
  mass: 0.55,
} as const satisfies Transition;

/**
 * Heavy, authoritative spring for desktop windows (moving, resizing, snapping).
 */
export const ORION_SPRING_WINDOW = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.9,
} as const satisfies Transition;

/**
 * Elevated spring for system dialogs, context menus, and modal sheets.
 */
export const ORION_SPRING_MODAL = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.75,
} as const satisfies Transition;

// Backward-compatible spring map
export const ORION_SPRINGS = {
  snappy: ORION_SPRING_SNAPPY,
  smooth: ORION_SPRING_SMOOTH,
  bouncy: ORION_SPRING_BOUNCY,
  gentle: ORION_SPRING_GENTLE,
  dockItem: ORION_SPRING_DOCK,
  window: ORION_SPRING_WINDOW,
  modal: ORION_SPRING_MODAL,
  responsive: ORION_SPRING_SNAPPY,
  crisp: ORION_SPRING_MODAL,
  reduced: {
    type: 'tween',
    duration: 0.1,
    ease: 'easeOut',
  } as Transition,
} as const;

// ---------------------------------------------------------------------------
// 2. TIMING & BEZIER CURVES
// ---------------------------------------------------------------------------

export const ORION_EASE = [0.22, 1, 0.36, 1] as const; // macOS natural deceleration
export const ORION_EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const ORION_EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const ORION_EASE_SHARP = [0.4, 0, 0.2, 1] as const;

export const ORION_MOTION_DURATIONS = {
  instant: 0.12,
  micro: 0.18,
  fast: 0.24,
  normal: 0.38,
  smooth: 0.52,
  spatial: 0.65,
  cinematic: 0.95,
  epic: 1.6,
} as const;

/**
 * Pacing scale factor for boot & shutdown lifecycle transitions.
 */
export const ORION_BOOT_MOTION_SCALE = 1.25;
export const BASE_BOOT_DURATION_MS = 2800;
export const BASE_WORLD_ENTRY_DURATION_MS = 1600;

export const ORION_BOOT_DURATION_MS = Math.round(BASE_BOOT_DURATION_MS * ORION_BOOT_MOTION_SCALE);
export const ORION_WORLD_ENTRY_DURATION_MS = Math.round(BASE_WORLD_ENTRY_DURATION_MS * ORION_BOOT_MOTION_SCALE);

// ---------------------------------------------------------------------------

export const ORION_DURATION_FAST = ORION_MOTION_DURATIONS.instant; // 0.12s
export const ORION_DURATION_NORMAL = ORION_MOTION_DURATIONS.fast; // 0.24s
export const ORION_DURATION_SLOW = ORION_MOTION_DURATIONS.normal; // 0.38s

export function getOrionSpringPhysics(type: 'snappy' | 'smooth' | 'bouncy' | 'gentle' | 'dock' | 'window' | 'modal', style: OSAnimationStyle = 'premium'): Transition {
  if (style === 'reduced') {
    return { duration: 0 };
  }
  if (style === 'minimal') {
    return { duration: 0.12, ease: 'easeOut' };
  }
  const base = type === 'snappy' ? ORION_SPRING_SNAPPY
    : type === 'bouncy' ? ORION_SPRING_BOUNCY
    : type === 'gentle' ? ORION_SPRING_GENTLE
    : type === 'dock' ? ORION_SPRING_DOCK
    : type === 'window' ? ORION_SPRING_WINDOW
    : type === 'modal' ? ORION_SPRING_MODAL
    : ORION_SPRING_SMOOTH;

  if (style === 'balanced') {
    return {
      ...base,
      damping: Math.round(base.damping * 1.15),
      stiffness: Math.round(base.stiffness * 1.1),
    };
  }
  return base;
}

// 3. MOTION CONFIGURATION & ACCESSIBILITY AUTHORITY
// ---------------------------------------------------------------------------

export type OSAnimationStyle = 'premium' | 'balanced' | 'minimal' | 'reduced';

export interface MotionConfigState {
  style: OSAnimationStyle;
  isReduced: boolean;
  dockMagnification: boolean;
  dockBounceOnLaunch: boolean;
  genieEnabled: boolean;
  scaleDuration: number;
}

/**
 * Checks system preferences or user setting for reduced motion
 */
export function isReducedMotionPreferred(settingReducedMotion?: boolean): boolean {
  if (settingReducedMotion) return true;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/**
 * React hook resolving active OS motion configuration from personalization settings
 */
export function useOrionMotionConfig(): MotionConfigState {
  const supplyChain = useOptionalSupplyChain();
  const settings = supplyChain?.settings;
  const effectiveReduced = settings?.reducedMotion ?? settings?.personalization?.reducedMotion;
  const effectiveStyle = settings?.animationStyle ?? settings?.personalization?.animationStyle;
  const isReduced = isReducedMotionPreferred(effectiveReduced);
  const style: OSAnimationStyle = isReduced ? 'reduced' : (effectiveStyle || 'premium');
  const isMinimal = style === 'minimal';

  return {
    style,
    isReduced,
    dockMagnification: (isReduced || isMinimal) ? false : ((settings?.dockMagnification ?? settings?.personalization?.dockMagnification) ?? true),
    dockBounceOnLaunch: (isReduced || isMinimal) ? false : ((settings?.dockBounceOnLaunch ?? settings?.personalization?.dockBounceOnLaunch) ?? true),
    genieEnabled: (isReduced || isMinimal) ? false : ((settings?.genieEffectEnabled ?? settings?.personalization?.genieEffectEnabled) ?? true),
    scaleDuration: isReduced ? 0.2 : isMinimal ? 0.6 : style === 'balanced' ? 0.85 : 1.0,
  };
}

/**
 * React hook for checking if reduced motion is active
 */
export function useIsReducedMotion(overrideSetting?: boolean): boolean {
  const supplyChain = useOptionalSupplyChain();
  const setting = overrideSetting ?? supplyChain?.settings?.reducedMotion ?? supplyChain?.settings?.personalization?.reducedMotion;
  return isReducedMotionPreferred(setting);
}

/**
 * Adjust duration based on reduced motion or speed scale
 */
export function getMotionDuration(normalDuration: number, isReduced: boolean): number {
  return isReduced ? Math.min(normalDuration, 0.1) : normalDuration;
}
