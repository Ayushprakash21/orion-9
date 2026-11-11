import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as variants from '../../os/motion/OrionMotionVariants';
import { getOrionSpringPhysics } from '../../os/motion/OrionMotion';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { applyThemeToDocument } from '../../theme/themeResolver';

describe('Orion-9 OS Performance Recovery & Modes', () => {
  beforeEach(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.removeAttribute('data-animation-style');
      document.documentElement.removeAttribute('data-reduced-motion');
      document.documentElement.removeAttribute('data-reduced-transparency');
    }
  });

  it('PERF-01: Motion variants do not animate expensive full-screen blur/backdropFilter shaders', () => {
    const serialized = JSON.stringify({
      osLifecycleVariants: variants.osLifecycleVariants,
      powerOnVariants: variants.powerOnVariants,
      worldEntryContainerVariants: variants.worldEntryContainerVariants,
      windowMotionVariants: variants.windowMotionVariants,
      launcherMotionVariants: variants.launcherMotionVariants,
      commandPaletteMotionVariants: variants.commandPaletteMotionVariants,
      missionControlBackdropVariants: variants.missionControlBackdropVariants,
      workspaceSwitchVariants: variants.workspaceSwitchVariants,
      toastNotificationVariants: variants.toastNotificationVariants,
      lockScreenVariants: variants.lockScreenVariants,
    });

    expect(serialized).not.toContain('"filter":"blur');
    expect(serialized).not.toContain('"backdropFilter":"blur');
  });

  it('PERF-02: Animation style profiles enforce Performance (minimal) and Reduced Motion presets', () => {
    const minimalSpring = getOrionSpringPhysics('window', 'minimal');
    expect(minimalSpring.duration).toBe(0.12);
    expect(minimalSpring.type).toBeUndefined();

    const reducedSpring = getOrionSpringPhysics('window', 'reduced');
    expect(reducedSpring.duration).toBe(0);
  });

  it('PERF-03: applyThemeToDocument propagates animationStyle and reduced transparency attributes when document exists', () => {
    if (typeof document === 'undefined') return;
    if (!window.matchMedia) {
      (window as any).matchMedia = vi.fn().mockReturnValue({ matches: false });
    }
    applyThemeToDocument({
      ...DEFAULT_PERSONALIZATION_SETTINGS,
      animationStyle: 'minimal',
      reducedMotion: false,
      reducedTransparency: false,
    });

    expect(document.documentElement.getAttribute('data-animation-style')).toBe('minimal');
    expect(document.documentElement.getAttribute('data-reduced-transparency')).toBe('true');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('false');
  });
});
