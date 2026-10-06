/**
 * ORION-9 OS RESTART TRANSITION SCREEN
 * Premium minimal enterprise OS restart screen.
 * Replaces old cyan neon spinning ring with clean dark graphite aesthetic.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';

interface OrionRestartScreenProps {
  onComplete?: () => void;
}

export const OrionRestartScreen: React.FC<OrionRestartScreenProps> = ({ onComplete }) => {
  const isReduced = useIsReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isReduced) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 120);

    const completionTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1600);

    return () => {
      clearInterval(interval);
      clearTimeout(completionTimer);
    };
  }, [onComplete, isReduced]);

  return (
    <motion.main
      data-testid="orion-restart-screen"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: isReduced ? 0.1 : 0.4, ease: ORION_EASE }}
      className="fixed inset-0 w-screen h-[100dvh] bg-[#08090A] z-[100000] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Subtle Barely-Visible Neutral Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Centered Hero Logo */}
        <div className="relative mb-6">
          <BrandLogo
            sizePreset="xl"
            variant="mark"
            className="justify-center h-20 sm:h-24 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
          />
        </div>

        {/* Calm Heading */}
        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white mb-1.5">
          Restarting System
        </h2>

        {/* Subtitle / Status */}
        <p className="text-xs text-neutral-400 font-normal mb-8 h-5 flex items-center justify-center">
          Preparing clean system start
        </p>

        {/* Restrained Horizontal Progress Line */}
        <div className="w-full max-w-[240px] h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-sky-500 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear', duration: 0.1 }}
          />
        </div>

        {/* Subtle Percentage */}
        <span className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">
          {progress}%
        </span>
      </div>
    </motion.main>
  );
};
