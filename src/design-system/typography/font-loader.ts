/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Authoritative Font Preloader & Runtime Hydration Engine
 *
 * Ensures local Lato and Roboto Mono WOFF2 font faces are loaded, verified,
 * and ready before critical desktop shell painting and visual testing.
 */

export interface FontLoadingStatus {
  latoLoaded: boolean;
  robotoMonoLoaded: boolean;
  ready: boolean;
  activeFontFamily: string;
}

/**
 * Preloads and verifies that local WOFF2 font assets are actively bound in document.fonts.
 */
export async function ensureOrionFontsLoaded(timeoutMs = 3000): Promise<FontLoadingStatus> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return {
      latoLoaded: true,
      robotoMonoLoaded: true,
      ready: true,
      activeFontFamily: 'system-fallback',
    };
  }

  const fonts = document.fonts;

  try {
    const latoPromise = Promise.all([
      fonts.load('400 14px "Lato"'),
      fonts.load('700 14px "Lato"'),
    ]);

    const monoPromise = Promise.all([
      fonts.load('400 12px "Roboto Mono"'),
      fonts.load('600 12px "Roboto Mono"'),
    ]);

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs));

    await Promise.race([
      Promise.all([latoPromise, monoPromise]),
      timeoutPromise,
    ]);

    const latoLoaded = fonts.check('400 14px "Lato"');
    const robotoMonoLoaded = fonts.check('400 12px "Roboto Mono"');

    return {
      latoLoaded,
      robotoMonoLoaded,
      ready: latoLoaded && robotoMonoLoaded,
      activeFontFamily: getComputedStyle(document.documentElement).getPropertyValue('--orion-font-family-ui').trim(),
    };
  } catch (err) {
    console.warn('[ORION:FONT-LOADER] Font loading encountered non-fatal error:', err);
    return {
      latoLoaded: false,
      robotoMonoLoaded: false,
      ready: false,
      activeFontFamily: 'fallback',
    };
  }
}

/**
 * Initializes and kicks off font hydration non-blockingly.
 */
export function initOrionTypography(): void {
  if (typeof window === 'undefined') return;
  ensureOrionFontsLoaded().then((status) => {
    if (status.ready) {
      document.documentElement.dataset.fontsReady = 'true';
    }
  }).catch(() => {});
}

