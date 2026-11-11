import React, { createContext, useContext, useId } from 'react';
import {
  ORION_SQUIRCLE_INNER_PATH,
  ORION_SQUIRCLE_PATH,
  OrionIconPalette,
  getIconDetailTier,
  mixHexColor,
  sanitizeSvgToken,
} from './OrionIconTheme';

export type IconDetailTier = 'micro' | 'compact' | 'standard';

interface OrionIconRenderContextValue {
  detailTier: IconDetailTier;
  theme: 'light' | 'dark';
  palette?: OrionIconPalette;
}

const OrionIconRenderContext = createContext<OrionIconRenderContextValue>({
  detailTier: 'standard',
  theme: 'dark',
});

/**
 * Provides authoritative registry palette metadata (from/to/accent/surface)
 * to child icon artwork so palette definitions stay single-source-of-truth.
 */
export const OrionIconPaletteContext = createContext<OrionIconPalette | undefined>(undefined);

export function useOrionIconDetail(): OrionIconRenderContextValue {
  return useContext(OrionIconRenderContext);
}

/**
 * Generates collision-free per-mount SVG gradient/clip IDs without relying on
 * static strings or expensive DOM mutations.
 */
export function useOrionIconIds(prefix: string): string {
  const reactId = useId();
  return `${sanitizeSvgToken(prefix)}-${sanitizeSvgToken(reactId)}`;
}

export interface IconBaseProps {
  size?: number;
  className?: string;
  active?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  gradientId: string;
  from: string;
  to: string;
  accent?: string;
  children: React.ReactNode;
}

/**
 * Sculpted macOS-inspired continuous superellipse tile with multi-stop directional depth,
 * ambient studio catchlights, Light/Dark theme edge definition, and zero SVG filter churn.
 */
export const OrionSquircleBase: React.FC<IconBaseProps> = ({
  size = 48,
  className = '',
  active = false,
  theme = 'dark',
  gradientId,
  from,
  to,
  accent,
  children,
}) => {
  const registryPalette = useContext(OrionIconPaletteContext);
  const resolvedFrom = registryPalette?.from || from;
  const resolvedTo = registryPalette?.to || to;
  const resolvedAccent = registryPalette?.accent || accent || '#38BDF8';
  const resolvedMid = mixHexColor(resolvedFrom, resolvedTo, 0.48);

  const uid = useOrionIconIds(gradientId);
  const detailTier = getIconDetailTier(size);
  const isCompact = detailTier !== 'standard';
  const isLight = theme === 'light';

  return (
    <OrionIconRenderContext.Provider
      value={{
        detailTier,
        theme: isLight ? 'light' : 'dark',
        palette: registryPalette || {
          from: resolvedFrom,
          to: resolvedTo,
          accent: resolvedAccent,
          surface: `${resolvedAccent}15`,
        },
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className={`select-none overflow-visible transition-transform duration-150 ${className}`}
        role="img"
      >
        <defs>
          {/* Multi-stop sculpted studio directional tile gradient */}
          <linearGradient id={`${uid}-bg`} x1="18" y1="6" x2="110" y2="122" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={resolvedFrom} />
            <stop offset="48%" stopColor={resolvedMid} />
            <stop offset="100%" stopColor={resolvedTo} />
          </linearGradient>

          {/* Upper specular dome studio bloom */}
          <radialGradient id={`${uid}-bloom`} cx="50%" cy="16%" r="64%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={active ? '0.28' : '0.18'} />
            <stop offset="38%" stopColor={resolvedAccent} stopOpacity={active ? '0.22' : '0.11'} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Warm lower bounce-light rim gradient */}
          <radialGradient id={`${uid}-bounce`} cx="50%" cy="94%" r="55%">
            <stop offset="0%" stopColor={resolvedAccent} stopOpacity="0.20" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Chamfered specular inner bezel catchlight */}
          <linearGradient id={`${uid}-rim`} x1="64" y1="7" x2="64" y2="121" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isLight ? '0.72' : '0.46'} />
            <stop offset="32%" stopColor="#FFFFFF" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#000000" stopOpacity={isLight ? '0.20' : '0.36'} />
          </linearGradient>
        </defs>

        {/* Active running/selected focus aura */}
        {active && (
          <path
            d={ORION_SQUIRCLE_PATH}
            stroke={resolvedAccent}
            strokeWidth={detailTier === 'micro' ? 5.5 : 3.5}
            strokeOpacity="0.52"
            fill="none"
          />
        )}

        {/* Grounding base superellipse silhouette */}
        <path d={ORION_SQUIRCLE_PATH} fill={`url(#${uid}-bg)`} />

        {/* Studio optical surface dome & subtle lower bounce light */}
        {!isCompact && (
          <>
            <path d={ORION_SQUIRCLE_PATH} fill={`url(#${uid}-bloom)`} />
            <path d={ORION_SQUIRCLE_PATH} fill={`url(#${uid}-bounce)`} />
          </>
        )}

        {/* Crisper outer separation hairline for Light Mode pale porcelain backgrounds */}
        {isLight && (
          <path
            d={ORION_SQUIRCLE_PATH}
            stroke="rgba(15, 23, 42, 0.16)"
            strokeWidth={detailTier === 'micro' ? 2.2 : 1.5}
            fill="none"
          />
        )}

        {/* Inner specular bevel border */}
        <path
          d={ORION_SQUIRCLE_INNER_PATH}
          stroke={`url(#${uid}-rim)`}
          strokeWidth={isCompact ? 1.8 : 1.4}
          fill="none"
        />

        {/* Subtle top crown meniscus highlight arc */}
        {!isCompact && (
          <path
            d="M 27 11.5 C 43 8.5 85 8.5 101 11.5"
            stroke="#FFFFFF"
            strokeOpacity={isLight ? '0.42' : '0.30'}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        )}

        {/* Foreground Bespoke Dimensional Artwork */}
        <g>{children}</g>
      </svg>
    </OrionIconRenderContext.Provider>
  );
};
