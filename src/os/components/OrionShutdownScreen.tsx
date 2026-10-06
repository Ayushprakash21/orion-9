import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { shutdownVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion } from '../motion/OrionMotion';

interface OrionShutdownScreenProps {
  onComplete?: () => void;
}

export const OrionShutdownScreen: React.FC<OrionShutdownScreenProps> = ({ onComplete }) => {
  const isReduced = useIsReducedMotion();

  const [phase, setPhase] = useState<'initial' | 'processes' | 'telemetry' | 'state' | 'closing' | 'terminated'>('initial');
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (isReduced) {
      setPhase('terminated');
      if (onComplete) onComplete();
      return;
    }

    const t1 = setTimeout(() => {
      setPhase('processes');
      setProgress(35);
    }, 400);

    const t2 = setTimeout(() => {
      setPhase('telemetry');
      setProgress(65);
    }, 900);

    const t3 = setTimeout(() => {
      setPhase('state');
      setProgress(90);
    }, 1400);

    const t4 = setTimeout(() => {
      setPhase('closing');
      setProgress(100);
    }, 1900);

    const t5 = setTimeout(() => {
      setPhase('terminated');
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete, isReduced]);

  const getStatusText = () => {
    switch (phase) {
      case 'initial':
      case 'processes':
        return 'Terminating active processes';
      case 'telemetry':
        return 'Disconnecting supply chain telemetry';
      case 'state':
        return 'Saving session state';
      case 'closing':
      case 'terminated':
        return 'System halted';
      default:
        return 'Terminating session';
    }
  };

  return (
    <motion.main
      variants={shutdownVariants}
      initial="initial"
      animate={phase === 'terminated' || phase === 'closing' ? 'closing' : 'initial'}
      className="fixed inset-0 w-screen h-[100dvh] bg-[#07090D] z-[999999] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Centered Authoritative Hero Logo */}
        <motion.div
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="relative mb-6"
        >
          <BrandLogo
            sizePreset="xl"
            variant="mark"
            className="justify-center h-24 sm:h-28"
          />
        </motion.div>

        {/* Primary Subdued Red System Title */}
        <motion.h2
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-red-400 uppercase mb-2"
        >
          System Shutdown
        </motion.h2>

        {/* Concise Single-Line Status Label */}
        <motion.p
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="text-xs text-neutral-400 font-normal tracking-wide mb-8 h-5 flex items-center justify-center"
        >
          {getStatusText()}
        </motion.p>

        {/* Subtle Horizontal Progress Line */}
        <motion.div
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[260px] h-1 bg-white/10 rounded-full overflow-hidden mb-3"
        >
          <motion.div
            className="h-full bg-red-500 rounded-full"
            initial={{ width: '10%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </motion.div>

        {/* Restrained Percentage */}
        <motion.span
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase"
        >
          {progress}%
        </motion.span>
      </div>
    </motion.main>
  );
};
