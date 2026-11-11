/**
 * ORION-9 SHARED WCAG 2.1 CONTRAST & COLOR ACCESSIBILITY ENGINE
 *
 * Single authoritative source for relative luminance calculation,
 * alpha-aware compositing, WCAG contrast ratio measurement, accessible
 * foreground selection (#FFFFFF vs #0F172A / #000000), and accessible
 * control/focus indicator adjustment across all Orion-9 themes.
 */

export interface RgbaColor {
  r: number; // 0..255
  g: number; // 0..255
  b: number; // 0..255
  a: number; // 0..1
}

export interface ForegroundSelectionOptions {
  lightCandidate?: string;
  darkCandidate?: string;
  backingColor?: string;
  minRatio?: number;
}

const DEFAULT_LIGHT_FG = '#FFFFFF';
const DEFAULT_DARK_FG = '#0F172A';
const STRICT_DARK_FG = '#000000';

/**
 * Parses #RGB, #RGBA, #RRGGBB, #RRGGBBAA, rgb(...), rgba(...), and 'transparent'.
 * Returns null if invalid.
 */
export function parseColorToRgba(input?: string | null): RgbaColor | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  if (trimmed.startsWith('#')) {
    const raw = trimmed.slice(1);
    if (!/^[0-9a-f]+$/.test(raw)) return null;

    if (raw.length === 3 || raw.length === 4) {
      const r = parseInt(raw[0] + raw[0], 16);
      const g = parseInt(raw[1] + raw[1], 16);
      const b = parseInt(raw[2] + raw[2], 16);
      const a = raw.length === 4 ? parseInt(raw[3] + raw[3], 16) / 255 : 1;
      return { r, g, b, a };
    }

    if (raw.length === 6 || raw.length === 8) {
      const r = parseInt(raw.slice(0, 2), 16);
      const g = parseInt(raw.slice(2, 4), 16);
      const b = parseInt(raw.slice(4, 6), 16);
      const a = raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }

    return null;
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([0-9.]+)\s*[,\s]\s*([0-9.]+)\s*[,\s]\s*([0-9.]+)(?:\s*[,/]\s*([0-9.]+%?))?\s*\)$/
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, Number(rgbMatch[1])));
    const g = Math.min(255, Math.max(0, Number(rgbMatch[2])));
    const b = Math.min(255, Math.max(0, Number(rgbMatch[3])));
    let a = 1;
    if (rgbMatch[4] !== undefined) {
      a = rgbMatch[4].endsWith('%')
        ? parseFloat(rgbMatch[4]) / 100
        : parseFloat(rgbMatch[4]);
      if (!Number.isFinite(a)) a = 1;
      a = Math.min(1, Math.max(0, a));
    }
    return { r, g, b, a };
  }

  return null;
}

/**
 * Composites a foreground RGBA color over an opaque/backing RGBA color.
 */
export function compositeRgba(fg: RgbaColor, bg: RgbaColor): RgbaColor {
  const alpha = Math.min(1, Math.max(0, fg.a));
  if (alpha >= 1) return { r: fg.r, g: fg.g, b: fg.b, a: 1 };
  const inv = 1 - alpha;
  return {
    r: Math.round(fg.r * alpha + bg.r * inv),
    g: Math.round(fg.g * alpha + bg.g * inv),
    b: Math.round(fg.b * alpha + bg.b * inv),
    a: 1,
  };
}

/**
 * Normalizes a valid CSS color string to 6-digit uppercase #RRGGBB when opaque,
 * returning null if unparseable.
 */
export function normalizeHexColor(input?: string | null): string | null {
  const parsed = parseColorToRgba(input);
  if (!parsed) return null;
  const r = Math.round(parsed.r).toString(16).padStart(2, '0');
  const g = Math.round(parsed.g).toString(16).padStart(2, '0');
  const b = Math.round(parsed.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Computes WCAG 2.1 relative luminance (0 = black, 1 = white).
 */
export function getRelativeLuminance(color: string | RgbaColor, backingColor?: string): number {
  let rgba = typeof color === 'string' ? parseColorToRgba(color) : color;
  if (!rgba) return 0;

  if (rgba.a < 1) {
    const bgRgba = parseColorToRgba(backingColor) || { r: 11, g: 13, b: 15, a: 1 };
    rgba = compositeRgba(rgba, bgRgba);
  }

  const toLinear = (channel255: number): number => {
    const srgb = channel255 / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * toLinear(rgba.r) +
    0.7152 * toLinear(rgba.g) +
    0.0722 * toLinear(rgba.b)
  );
}

/**
 * Computes the WCAG 2.1 contrast ratio between two colors (1.0 .. 21.0).
 */
export function getContrastRatio(
  foreground: string | RgbaColor,
  background: string | RgbaColor,
  backingForTransparentBg = '#0B0D0F'
): number {
  const bgRgbaRaw = typeof background === 'string' ? parseColorToRgba(background) : background;
  const fgRgbaRaw = typeof foreground === 'string' ? parseColorToRgba(foreground) : foreground;

  if (!bgRgbaRaw || !fgRgbaRaw) return 1;

  const backing = parseColorToRgba(backingForTransparentBg) || { r: 11, g: 13, b: 15, a: 1 };
  const resolvedBg = bgRgbaRaw.a < 1 ? compositeRgba(bgRgbaRaw, backing) : bgRgbaRaw;
  const resolvedFg = fgRgbaRaw.a < 1 ? compositeRgba(fgRgbaRaw, resolvedBg) : fgRgbaRaw;

  const l1 = getRelativeLuminance(resolvedFg);
  const l2 = getRelativeLuminance(resolvedBg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks whether foreground vs background satisfies WCAG 2.1 AA contrast
 * (>= 4.5:1 normal text, >= 3.0:1 large text / UI components).
 */
export function meetsWcagAA(
  foreground: string,
  background: string,
  options?: { largeText?: boolean; uiComponent?: boolean; backingColor?: string }
): boolean {
  const required = options?.largeText || options?.uiComponent ? 3.0 : 4.5;
  return getContrastRatio(foreground, background, options?.backingColor) >= required;
}

/**
 * Selects the accessible foreground color (#FFFFFF or #0F172A, falling back to #000000
 * if needed to hit 4.5:1) by comparing actual WCAG contrast ratios instead of a fixed threshold.
 */
export function calculateContrastColor(
  backgroundColor: string,
  options?: ForegroundSelectionOptions
): string {
  const lightCandidate = options?.lightCandidate || DEFAULT_LIGHT_FG;
  const darkCandidate = options?.darkCandidate || DEFAULT_DARK_FG;
  const backingColor = options?.backingColor || '#0B0D0F';
  const minRatio = options?.minRatio ?? 4.5;

  const parsed = parseColorToRgba(backgroundColor);
  if (!parsed) {
    return '#FFFFFF';
  }

  const effectiveBg =
    parsed.a < 1
      ? compositeRgba(parsed, parseColorToRgba(backingColor) || { r: 11, g: 13, b: 15, a: 1 })
      : parsed;

  const lightRatio = getContrastRatio(lightCandidate, effectiveBg);
  const darkRatio = getContrastRatio(darkCandidate, effectiveBg);

  if (lightRatio >= darkRatio) {
    return lightCandidate;
  }

  // If darkCandidate (#0F172A) is close on a mid-tone color, verify whether #000000 meets minRatio better
  if (darkRatio < minRatio) {
    const blackRatio = getContrastRatio(STRICT_DARK_FG, effectiveBg);
    if (blackRatio > darkRatio && blackRatio >= lightRatio) {
      return STRICT_DARK_FG;
    }
  }

  return darkCandidate;
}

/**
 * Adjusts brightness of a hex/rgb color by percentage (-100 .. +100).
 */
export function adjustHexBrightness(colorInput: string, percent: number): string {
  const parsed = parseColorToRgba(colorInput);
  if (!parsed) return colorInput;

  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, Math.round(parsed.r + amt)));
  const G = Math.min(255, Math.max(0, Math.round(parsed.g + amt)));
  const B = Math.min(255, Math.max(0, Math.round(parsed.b + amt)));

  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`.toUpperCase();
}

/**
 * Converts a color string to an rgba() CSS value with explicit opacity.
 */
export function hexToRgba(colorInput: string, alpha: number): string {
  const parsed = parseColorToRgba(colorInput);
  if (!parsed) return `rgba(216, 221, 227, ${alpha})`;
  const clamped = Math.min(1, Math.max(0, alpha * parsed.a));
  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${clamped})`;
}

/**
 * Resolves accent interaction states & boundary contrast tokens guaranteeing:
 * - foreground achieves highest WCAG contrast (>= 4.5:1 on solid accents)
 * - hover/active states shift noticeably while preserving accent hue
 * - focusRing meets >= 3:1 non-text contrast against the adjacent surface
 */
export function resolveAccessibleAccentStates(
  accentInput: string,
  mode: 'dark' | 'light',
  adjacentSurfaceBg: string
): {
  accent: string;
  foreground: string;
  hover: string;
  active: string;
  soft: string;
  focusGlow: string;
  focusRing: string;
  contrastRatio: number;
} {
  const fallbackAccent = mode === 'light' ? '#4A5056' : '#D8DDE3';
  const normalizedAccent = normalizeHexColor(accentInput) || fallbackAccent;

  const foreground = calculateContrastColor(normalizedAccent, { backingColor: adjacentSurfaceBg });
  const hover = adjustHexBrightness(normalizedAccent, mode === 'dark' ? 10 : -10);
  const active = adjustHexBrightness(normalizedAccent, mode === 'dark' ? 18 : -18);

  // Ensure focus ring satisfies >= 3.0:1 against adjacent surface background
  let focusRing = normalizedAccent;
  if (getContrastRatio(focusRing, adjacentSurfaceBg) < 3.0) {
    focusRing = mode === 'light' ? '#1E293B' : '#F8FAFC';
  }

  return {
    accent: normalizedAccent,
    foreground,
    hover,
    active,
    soft: hexToRgba(normalizedAccent, mode === 'light' ? 0.12 : 0.16),
    focusGlow: hexToRgba(focusRing, 0.4),
    focusRing,
    contrastRatio: getContrastRatio(foreground, normalizedAccent),
  };
}
