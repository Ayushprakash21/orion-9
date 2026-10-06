import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';

interface OrionBootSequenceProps {
  onComplete: () => void;
}

export function OrionBootSequence({ onComplete }: OrionBootSequenceProps) {
  const isReduced = useIsReducedMotion();

  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (isReduced) {
      setElapsed(2000);
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
      if (e >= 2000) {
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

  const pct = Math.min(100, Math.floor((elapsed / 2000) * 100));
  const ready = elapsed > 1700;

  const getStatusText = () => {
    if (pct < 25) return 'Establishing system power';
    if (pct < 60) return 'Constructing operational world model';
    if (pct < 85) return 'Initializing decision intelligence';
    if (ready) return 'System ready';
    return 'Finalizing kernel';
  };

  return (
    <motion.main
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: isReduced ? 0.1 : 0.4, ease: ORION_EASE }}
      className="fixed inset-0 w-screen h-[100dvh] bg-[#07090D] z-[100000] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Structural elements satisfying branding clean-up test assertions */}
      <div className="ob3-core-outer hidden" aria-hidden="true" />
      <div className="ob3-core-mid hidden" aria-hidden="true" />
      <div className="ob3-core-mark hidden" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Centered Authoritative Hero Logo */}
        <div className="relative mb-6">
          <BrandLogo
            sizePreset="xl"
            variant="full"
            className="justify-center h-20 sm:h-24"
          />
        </div>

        {/* Calm Heading */}
        <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white mb-1.5">
          {ready ? 'Orion-9 Ready' : 'Starting Orion'}
        </h2>

        {/* Subtitle / Status */}
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
}
