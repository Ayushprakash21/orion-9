import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { worldEntryContainerVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion } from '../motion/OrionMotion';

interface Props {
  onComplete: () => void;
  isAdmin?: boolean;
}

export const OrionWorldEntrySequence: React.FC<Props> = ({ onComplete, isAdmin = false }) => {
  const isReduced = useIsReducedMotion();

  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (isReduced) {
      setElapsed(1500);
      if (!done.current) {
        done.current = true;
        onComplete();
      }
      return;
    }

    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const e = t - start.current;
      setElapsed(e);
      if (e >= 1500) {
        if (!done.current) {
          done.current = true;
          onComplete();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete, isReduced]);

  const pct = Math.min(100, Math.floor((elapsed / 1500) * 100));

  const getStatusText = () => {
    if (pct < 30) return 'Restoring secure session';
    if (pct < 70) return isAdmin ? 'Mounting governance space' : 'Preparing operational workspace';
    if (pct < 95) return 'Finalizing environment';
    return 'System ready';
  };

  return (
    <motion.main
      variants={worldEntryContainerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 w-screen h-[100dvh] bg-[#07090D] z-[100000] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Centered Authoritative Hero Logo */}
        <div className="relative mb-6">
          <BrandLogo
            sizePreset="xl"
            variant="full"
            className="justify-center h-20 sm:h-24"
          />
        </div>

        {/* Calm Primary Heading */}
        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white mb-1.5">
          {isAdmin ? 'Entering Control Center' : 'Starting Orion'}
        </h2>

        {/* Clear Subtitle / Status */}
        <p className="text-xs text-neutral-400 font-normal mb-8 h-5 flex items-center justify-center">
          {getStatusText()}
        </p>

        {/* Restrained Horizontal Progress Line */}
        <div className="w-full max-w-[260px] h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-sky-500 rounded-full"
            style={{ width: `${pct}%` }}
            transition={{ ease: 'linear', duration: 0.1 }}
          />
        </div>

        {/* Subtle Percentage */}
        <span className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase">
          {pct}%
        </span>
      </div>
    </motion.main>
  );
};
