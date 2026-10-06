/**
 * ORION-9 OS CINEMATIC LOGOUT SCREEN
 * Controlled Framer Motion sequence displaying secure session teardown.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { logoutCoreVariants } from '../motion/OrionMotionVariants';
import { isReducedMotionPreferred } from '../motion/OrionMotion';
import { useSupplyChain } from '../../store/SupplyChainContext';

interface OrionLogoutScreenProps {
  onComplete: () => void;
}

export const OrionLogoutScreen: React.FC<OrionLogoutScreenProps> = ({ onComplete }) => {
  const supplyChain = useSupplyChain();
  const isReduced = isReducedMotionPreferred(supplyChain?.settings?.reducedMotion);

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
      className="fixed inset-0 w-screen h-screen min-h-screen bg-[#03060E] z-[999999] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,254,0.04),transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center justify-center text-center p-6">
        {/* Central Core Contraction */}
        <motion.div
          variants={logoutCoreVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-6 rounded-full border border-[#00F2FE]/20 shadow-[0_0_30px_rgba(0,242,254,0.15)] pointer-events-none"
          />
          <BrandLogo
            sizePreset="xl"
            variant="mark"
            className="relative justify-center drop-shadow-[0_0_20px_rgba(0,242,254,0.35)]"
          />
        </motion.div>

        {/* Header Label */}
        <h2 className="font-mono text-os-text-primary text-sm sm:text-base tracking-[0.25em] uppercase font-semibold mb-2">
          CLOSING SECURE SESSION
        </h2>
        <p className="font-mono text-os-text-muted text-xs tracking-[0.2em] uppercase mb-8">
          TEARDOWN & CRYPTOGRAPHIC CLEARANCE
        </p>

        {/* Progress Line */}
        <div className="w-full max-w-[280px] bg-white/10 h-1 rounded-full overflow-hidden mb-4 p-[1px]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#00F2FE] to-emerald-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.1 }}
          />
        </div>

        <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase">
          {progress < 100 ? `TERMINATING SESSION (${progress}%)` : 'SESSION CLOSED'}
        </span>
      </div>
    </motion.main>
  );
};
