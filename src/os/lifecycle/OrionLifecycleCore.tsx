/**
 * ORION-9 OS LIFECYCLE POWER CORE
 * Canonical central rotating power core element.
 * Combines mechanical concentric rings, coordinate tick marks, controlled illumination,
 * and authoritative BrandLogo mark.
 */

import React from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { useIsReducedMotion } from '../motion/OrionMotion';
import { cn } from '../../lib/utils';

export interface OrionLifecycleCoreProps {
  status?: 'initializing' | 'active' | 'ready' | 'shutdown';
  size?: 'sm' | 'md' | 'lg';
  showRings?: boolean;
  className?: string;
}

export const OrionLifecycleCore: React.FC<OrionLifecycleCoreProps> = ({
  status = 'active',
  size = 'md',
  showRings = true,
  className = '',
}) => {
  const isReduced = useIsReducedMotion();

  const outerSize = size === 'sm' ? 240 : size === 'lg' ? 360 : 300;
  const midSize = size === 'sm' ? 180 : size === 'lg' ? 270 : 230;

  const ringColor =
    status === 'shutdown'
      ? 'border-red-500/25'
      : status === 'ready'
      ? 'border-emerald-400/30'
      : 'border-white/15';

  const ringHighlight =
    status === 'shutdown'
      ? 'border-t-red-500/70'
      : status === 'ready'
      ? 'border-t-emerald-400/80'
      : 'border-t-sky-400/60';

  const glowColor =
    status === 'shutdown'
      ? 'rgba(239, 68, 68, 0.15)'
      : status === 'ready'
      ? 'rgba(52, 211, 153, 0.15)'
      : 'rgba(56, 189, 248, 0.12)';

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none pointer-events-none",
        className
      )}
      style={{ width: `${outerSize}px`, height: `${outerSize}px` }}
    >
      {/* 1. Subtle Radial Power Illumination */}
      <div
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* 2. Outer Concentric Ring */}
      {showRings && (
        <motion.div
          animate={!isReduced ? { rotate: 360 } : undefined}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className={cn(
            "ob3-core-outer absolute rounded-full border pointer-events-none",
            ringColor,
            ringHighlight
          )}
          style={{ width: `${outerSize}px`, height: `${outerSize}px` }}
        />
      )}

      {/* 3. Mid Concentric Ring (Counter-Rotating) */}
      {showRings && (
        <motion.div
          animate={!isReduced ? { rotate: -360 } : undefined}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className={cn(
            "ob3-core-mid absolute rounded-full border border-dashed pointer-events-none",
            ringColor
          )}
          style={{ width: `${midSize}px`, height: `${midSize}px` }}
        />
      )}

      {/* 4. Coordinate Tick Marks */}
      {showRings && !isReduced && (
        <>
          <span className="ob3-core-tick t1 absolute w-2 h-[1px] bg-white/30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-left" style={{ transform: `rotate(0deg) translateX(${midSize / 2}px)` }} />
          <span className="ob3-core-tick t2 absolute w-2 h-[1px] bg-white/30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-left" style={{ transform: `rotate(90deg) translateX(${midSize / 2}px)` }} />
          <span className="ob3-core-tick t3 absolute w-2 h-[1px] bg-white/30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-left" style={{ transform: `rotate(180deg) translateX(${midSize / 2}px)` }} />
          <span className="ob3-core-tick t4 absolute w-2 h-[1px] bg-white/30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-left" style={{ transform: `rotate(270deg) translateX(${midSize / 2}px)` }} />
        </>
      )}

      {/* 5. Central Authoritative Mark */}
      <div className="ob3-core-mark relative z-10 flex items-center justify-center">
        <BrandLogo
          sizePreset={size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'}
          variant="mark"
          className="justify-center drop-shadow-[0_16px_32px_rgba(0,0,0,0.6)]"
        />
      </div>
    </div>
  );
};
