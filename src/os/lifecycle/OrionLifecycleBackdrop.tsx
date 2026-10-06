/**
 * ORION-9 OS LIFECYCLE BACKDROP
 * Unified cinematic background provider for all OS lifecycle transitions.
 * Integrates subtle atmospheric depth, deep vignette, orbital geometry, and restrained lighting.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useIsReducedMotion } from '../motion/OrionMotion';
import { ORION_LIFECYCLE_COLORS } from './OrionLifecycleTokens';

interface OrionLifecycleBackdropProps {
  variant?: 'default' | 'ready' | 'shutdown' | 'boot';
  showTopology?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const OrionLifecycleBackdrop: React.FC<OrionLifecycleBackdropProps> = ({
  variant = 'default',
  showTopology = false,
  className = '',
  children,
}) => {
  const isReduced = useIsReducedMotion();

  const dust = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      x: (i * 47) % 100,
      y: (i * 71 + 11) % 100,
      size: (i % 3) === 0 ? 2 : 1.5,
      opacity: 0.08 + (i % 5) * 0.03,
      delay: (i % 17) * 0.12,
    })),
    []
  );

  const ambientGlowColor =
    variant === 'shutdown'
      ? 'rgba(239, 68, 68, 0.04)'
      : variant === 'ready'
      ? 'rgba(52, 211, 153, 0.035)'
      : variant === 'boot'
      ? 'rgba(56, 189, 248, 0.035)'
      : 'rgba(255, 255, 255, 0.025)';

  return (
    <div
      className={`fixed inset-0 w-screen h-[100dvh] bg-[#050811] overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Base Dark Atmospheric Background Image (Preloaded Cosmic Earth Horizon) */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 filter brightness-75 contrast-125"
        style={{ backgroundImage: "url('/wallpaper/orion9-earth-horizon-default.png')" }}
      />

      {/* 2. Deep Cinematic Darkening Overlay */}
      <div className="absolute inset-0 bg-[#050811]/85 pointer-events-none" />

      {/* 3. Subtle Neutral/Semantic Ambient Glow Behind Center Core */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${ambientGlowColor}, transparent 65%)`,
        }}
      />

      {/* 4. Deep Radial Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(3, 5, 9, 0.92) 90%)',
        }}
      />

      {/* 5. Subtle Orbital Grid (Perspective Layer) */}
      {!isReduced && (
        <div 
          className="absolute inset-[-10%] opacity-[0.14] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            transform: 'perspective(650px) rotateX(60deg) translateY(20%)',
            transformOrigin: 'center bottom',
          }}
        />
      )}

      {/* 6. Subtle Particulate Dust Points */}
      {!isReduced && (
        <div className="absolute inset-0 pointer-events-none">
          {dust.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
              }}
              animate={{
                y: [0, -6, 0],
                opacity: [p.opacity, p.opacity * 1.8, p.opacity],
              }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* 7. Optional Subtle Network Topology Vector Layer */}
      {showTopology && !isReduced && (
        <div className="absolute inset-[8%] pointer-events-none opacity-[0.22]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M10 50 L25 25 L45 20 L50 35 L65 20 L85 30 L90 50 L85 65 L65 80 L50 65 L35 80 L20 65 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="0.12"
              strokeDasharray="1.5 2.5"
            />
            <path
              d="M25 25 L35 80 M45 20 L50 65 M65 20 L65 80 M85 30 L50 35 M20 65 L50 35 L90 50"
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="0.08"
              strokeDasharray="1 3"
            />
          </svg>
        </div>
      )}

      {/* Content Slot */}
      {children}
    </div>
  );
};
