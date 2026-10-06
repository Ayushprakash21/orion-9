/**
 * ORION-9 CENTRALIZED MOTION SYSTEM & ANIMATION TOKENS
 *
 * Provides physical, responsive, and purposeful motion specifications for:
 * - Micro interactions (hover, press, click)
 * - Icons (hover, pressed, dragging, lift, drop)
 * - Windows (open, close, minimize, restore, maximize, drag, resize)
 * - Launcher & Menus (expand, collapse, slide, fade)
 * - Modals & Tooltips
 * - Notifications & Alerts
 * - Reduced motion support (prefers-reduced-motion)
 */

export const ORION_MOTION = {
  // Durations (in milliseconds)
  duration: {
    instant: 50,
    fast: 120,
    normal: 220,
    moderate: 300,
    slow: 400,
  },

  // Easing Functions (CSS bezier curves)
  easing: {
    // Physical spring-like snap
    snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
    // Standard UI ease
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    // Decelerate (entrance)
    entrance: 'cubic-bezier(0, 0, 0.2, 1)',
    // Accelerate (exit)
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    // Spring overshoot for gentle physical drops
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Icon Microinteraction Tokens
  icon: {
    hoverScale: 'scale(1.06)',
    pressScale: 'scale(0.95)',
    dragLiftScale: 'scale(1.08)',
    dragLiftShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 242, 254, 0.35)',
    dropSnapTransition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease, opacity 200ms ease',
  },

  // Window Animation Tokens
  window: {
    open: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease-out',
    close: 'transform 150ms cubic-bezier(0.4, 0, 1, 1), opacity 150ms ease-in',
    minimize: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-in',
    maximize: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), width 240ms cubic-bezier(0.16, 1, 0.3, 1), height 240ms cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Reduced Motion Fallbacks
  reducedMotion: {
    duration: '0.01ms',
    transition: 'opacity 100ms ease',
    transform: 'none !important',
  }
};

/**
 * Checks whether user has enabled reduced motion preferences
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Helper to get CSS transition style according to prefers-reduced-motion
 */
export function getMotionStyle(normalStyle: React.CSSProperties): React.CSSProperties {
  if (isReducedMotionPreferred()) {
    return {
      ...normalStyle,
      transition: 'opacity 100ms ease',
      transform: 'none',
    };
  }
  return normalStyle;
}
