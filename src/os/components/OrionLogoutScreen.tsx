/**
 * ORION-9 OS LOGOUT SCREEN
 * Clean, centered session teardown screen aligned with the minimal enterprise OS design system.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { useIsReducedMotion } from '../motion/OrionMotion';

interface OrionLogoutScreenProps {
  onComplete: () => void;
}

export const OrionLogoutScreen: React.FC<OrionLogoutScreenProps> = ({ onComplete }) => {
  const isReduced = useIsReducedMotion();

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isReduced) {
      const timer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 90);

    const completionTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(completionTimer);
    };
  }, [onComplete, isReduced]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isReduced ? 0.1 : 0.4 }}
      className="fixed inset-0 w-screen h-[100dvh] bg-[#07090D] z-[999999] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Centered Authoritative Hero Logo */}
        <div className="relative mb-6">
          <BrandLogo
            sizePreset="xl"
            variant="mark"
            className="justify-center h-24 sm:h-28"
          />
        </div>

        {/* Calm Heading */}
        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white mb-1.5">
          Signing Out
        </h2>

        {/* Clear Subtitle / Status */}
        <p className="text-xs text-neutral-400 font-normal mb-8 h-5 flex items-center justify-center">
          {progress < 100 ? 'Closing secure session and clearing credentials' : 'Session closed'}
        </p>

        {/* Restrained Horizontal Progress Line */}
        <div className="w-full max-w-[260px] h-1 bg-white/10 rounded-full overflow-hidden mb-3">
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
