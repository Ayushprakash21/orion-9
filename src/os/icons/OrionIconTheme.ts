/**
 * ORION-9 macOS-INSPIRED ICON DESIGN SYSTEM TOKENS
 * Cohesive squircle geometry, tonal material surfaces, light/dark contrast rules,
 * and size-adaptive detail tiers for all 118+ Orion Supply Chain OS applications.
 */

export type OrionIconCategory =
  | 'Operations'
  | 'Intelligence'
  | 'Control'
  | 'AI'
  | 'Platform'
  | 'Administration'
  | 'System';

export interface CategoryMaterialSpec {
  from: string;
  to: string;
  accent: string;
  bloom: string;
  rimHighlight: string;
}

/**
 * Continuous macOS-grade superellipse (squircle) silhouette in canonical 128x128 viewBox.
 * Generous padding [6..122] ensures crisp edge anti-aliasing and halo clearance at 16px-128px.
 */
export const ORION_SQUIRCLE_PATH =
  'M 64,6 C 102,6 122,26 122,64 C 122,102 102,122 64,122 C 26,122 6,102 6,64 C 6,26 26,6 64,6 Z';

export const ORION_SQUIRCLE_INNER_PATH =
  'M 64,9 C 99.5,9 119,28.5 119,64 C 119,99.5 99.5,119 64,119 C 28.5,119 9,99.5 9,64 C 9,28.5 28.5,9 64,9 Z';

export const ORION_CATEGORY_MATERIALS: Record<OrionIconCategory, CategoryMaterialSpec> = {
  Operations: {
    from: '#0F2B3C',
    to: '#081520',
    accent: '#38BDF8',
    bloom: '#7DD3FC',
    rimHighlight: 'rgba(186, 230, 253, 0.34)',
  },
  Intelligence: {
    from: '#2E1065',
    to: '#13072E',
    accent: '#A78BFA',
    bloom: '#DDD6FE',
    rimHighlight: 'rgba(221, 214, 254, 0.34)',
  },
  Control: {
    from: '#064E3B',
    to: '#022C22',
    accent: '#34D399',
    bloom: '#A7F3D0',
    rimHighlight: 'rgba(167, 243, 208, 0.32)',
  },
  AI: {
    from: '#3730A3',
    to: '#1E1B4B',
    accent: '#818CF8',
    bloom: '#C7D2FE',
    rimHighlight: 'rgba(199, 210, 254, 0.38)',
  },
  Platform: {
    from: '#1E293B',
    to: '#090D16',
    accent: '#94A3B8',
    bloom: '#E2E8F0',
    rimHighlight: 'rgba(226, 232, 240, 0.28)',
  },
  Administration: {
    from: '#78350F',
    to: '#271204',
    accent: '#FBBF24',
    bloom: '#FDE68A',
    rimHighlight: 'rgba(253, 230, 138, 0.32)',
  },
  System: {
    from: '#0369A1',
    to: '#0C2D48',
    accent: '#38BDF8',
    bloom: '#BAE6FD',
    rimHighlight: 'rgba(186, 230, 253, 0.34)',
  },
};

export function resolveCategoryMaterial(category?: string): CategoryMaterialSpec {
  if (category && category in ORION_CATEGORY_MATERIALS) {
    return ORION_CATEGORY_MATERIALS[category as OrionIconCategory];
  }
  return ORION_CATEGORY_MATERIALS.Platform;
}

export function getIconDetailTier(size: number): 'micro' | 'compact' | 'standard' {
  if (size <= 20) return 'micro';
  if (size <= 28) return 'compact';
  return 'standard';
}

export function sanitizeSvgToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}
