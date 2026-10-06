/**
 * ORION-9 LIFECYCLE ORBITAL CORE
 * Authoritative central logo & orbital ring composition system.
 * 
 * Hierarchy & Stacking:
 *  - z-10: Ambient power glow
 *  - z-20: Concentric elliptical orbital rings (outer, mid, partial arc)
 *  - z-25: Subtle dark transparent logo backing (prevents orbit lines passing through logo)
 *  - z-30: Orion-9 logo foreground (dominant, full brightness, centered)
 * 
 * Spatial Rules:
 *  - Center of orbital system == logoCenterX, logoCenterY.
 *  - Absolute positioning strictly anchored to container (left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2).
 *  - Zero viewport-relative or arbitrary offsets.
 */

import React from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { useIsReducedMotion } from '../motion/OrionMotion';
import { cn } from '../../lib/utils';

export type OrionOrbitalState = 'initializing' | 'active' | 'boot' | 'ready' | 'shutdown';

export interface OrionLifecycleOrbitalCoreProps {
  /** Lifecycle semantic status/state */
  status?: OrionOrbitalState;
  /** State alias for status */
  state?: OrionOrbitalState;
  /** Scale preset: sm (mobile), md (tablet/status), lg (desktop hero) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional toggle to hide orbital rings */
  showRings?: boolean;
  /** Custom logo override node */
  logo?: React.ReactNode;
  /** Additional container classes */
  className?: string;
}

export const OrionLifecycleOrbitalCore: React.FC<OrionLifecycleOrbitalCoreProps> = ({
  status,
  state,
  size = 'md',
  showRings = true,
  logo,
  className = '',
}) => {
  const isReduced = useIsReducedMotion();
  const effectiveStatus: OrionOrbitalState = state || status || 'active';

  // Dimensional presets anchored to exact center
  const dimensions = {
    sm: {
      containerW: 240,
      containerH: 160,
      outerW: 225,
      outerH: 130,
      midW: 170,
      midH: 98,
      arcW: 250,
      arcH: 145,
      glowW: 220,
      glowH: 130,
      backingW: 130,
      backingH: 80,
      logoW: 105,
      logoPreset: 'md' as const,
    },
    md: {
      containerW: 300,
      containerH: 200,
      outerW: 295,
      outerH: 170,
      midW: 220,
      midH: 125,
      arcW: 330,
      arcH: 190,
      glowW: 290,
      glowH: 170,
      backingW: 165,
      backingH: 105,
      logoW: 130,
      logoPreset: 'lg' as const,
    },
    lg: {
      containerW: 360,
      containerH: 230,
      outerW: 340,
      outerH: 195,
      midW: 250,
      midH: 145,
      arcW: 380,
      arcH: 215,
      glowW: 340,
      glowH: 195,
      backingW: 195,
      backingH: 125,
      logoW: 150,
      logoPreset: 'xl' as const,
    },
  }[size];

  const isShutdown = effectiveStatus === 'shutdown';
  const isReady = effectiveStatus === 'ready';

  // Semantic color and illumination tokens
  const glowColor = isShutdown
    ? 'rgba(239, 68, 68, 0.12)'
    : isReady
    ? 'rgba(52, 211, 153, 0.12)'
    : 'rgba(56, 189, 248, 0.10)';

  const ringOuterBorder = isShutdown
    ? 'border border-red-500/25 border-t-red-500/40'
    : isReady
    ? 'border border-emerald-400/20 border-t-emerald-400/45'
    : 'border border-white/12 border-t-sky-400/35';

  const ringMidBorder = isShutdown
    ? 'border border-dashed border-red-400/22 border-t-red-400/50'
    : isReady
    ? 'border border-dashed border-emerald-400/25 border-t-emerald-300/55'
    : 'border border-dashed border-sky-400/22 border-t-sky-400/45';

  const arcColor = isShutdown
    ? 'rgba(239, 68, 68, 0.35)'
    : isReady
    ? 'rgba(52, 211, 153, 0.38)'
    : 'rgba(56, 189, 248, 0.32)';

  return (
    <div
      data-testid="orion-lifecycle-core"
      className={cn(
        "relative flex items-center justify-center select-none pointer-events-none mx-auto",
        className
      )}
      style={{
        width: `${dimensions.containerW}px`,
        height: `${dimensions.containerH}px`,
      }}
    >
      {/* 1. Subtle Radial Ambient Power Illumination (z-10) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl pointer-events-none z-10 transition-colors duration-700"
        style={{
          width: `${dimensions.glowW}px`,
          height: `${dimensions.glowH}px`,
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* 2. Concentric Orbital Ring System (z-20) */}
      {showRings && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center">
          {/* Optional Third Partial Arc */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              animate={!isReduced ? { rotate: 360 } : undefined}
              transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
              className="rounded-[50%] pointer-events-none"
              style={{
                width: `${dimensions.arcW}px`,
                height: `${dimensions.arcH}px`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'transparent',
                borderTopColor: arcColor,
                opacity: isShutdown ? 0.3 : 0.45,
              }}
            />
          </div>

          {/* Outer Concentric Orbit (ob3-core-outer) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              animate={!isReduced ? { rotate: 360 } : undefined}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              className={cn(
                "ob3-core-outer rounded-[50%] pointer-events-none transition-colors duration-700",
                ringOuterBorder
              )}
              style={{
                width: `${dimensions.outerW}px`,
                height: `${dimensions.outerH}px`,
              }}
            />
          </div>

          {/* Mid Concentric Orbit (Counter-Rotating, ob3-core-mid) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              animate={!isReduced ? { rotate: -360 } : undefined}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className={cn(
                "ob3-core-mid rounded-[50%] pointer-events-none transition-colors duration-700",
                ringMidBorder
              )}
              style={{
                width: `${dimensions.midW}px`,
                height: `${dimensions.midH}px`,
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Subtle Dark Transparent Logo Backing (z-25) */}
      {/* Softly obscures orbit lines directly behind logo mark, without looking like a button */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-25 rounded-full"
        style={{
          width: `${dimensions.backingW}px`,
          height: `${dimensions.backingH}px`,
          background: 'radial-gradient(ellipse at center, rgba(5, 8, 17, 0.95) 0%, rgba(5, 8, 17, 0.75) 55%, transparent 75%)',
        }}
      />

      {/* 4. Central Authoritative Logo Mark Foreground (z-30) */}
      <div className="ob3-core-mark relative z-30 flex items-center justify-center">
        {logo ? (
          logo
        ) : (
          <BrandLogo
            width={dimensions.logoW}
            sizePreset={dimensions.logoPreset}
            variant="mark"
            className="justify-center drop-shadow-[0_16px_36px_rgba(0,0,0,0.7)]"
          />
        )}
      </div>
    </div>
  );
};
