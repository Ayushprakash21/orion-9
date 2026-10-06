/**
 * ORION-9 CANONICAL OS RESTART TRANSITION SCREEN
 * Clean reboot transition with mechanical power core and clean reboot vectors.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';
import { OrionLifecycleBackdrop } from '../lifecycle/OrionLifecycleBackdrop';
import { OrionLifecycleCore } from '../lifecycle/OrionLifecycleCore';
import { OrionLifecycleStatusList, LifecycleStatusItem } from '../lifecycle/OrionLifecycleStatusList';
import { OrionLifecycleProgress } from '../lifecycle/OrionLifecycleProgress';

interface OrionRestartScreenProps {
  onComplete?: () => void;
}

const RESTART_SERVICES = [
  { id: 'buffers', code: '01', label: 'Flushing memory buffers', readyMs: 300 },
  { id: 'bus', code: '02', label: 'Resetting peripheral bus', readyMs: 700 },
  { id: 'vector', code: '03', label: 'Initializing clean boot vector', readyMs: 1200 },
];

export const OrionRestartScreen: React.FC<OrionRestartScreenProps> = ({ onComplete }) => {
  const isReduced = useIsReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isReduced) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev >= 1600) {
          clearInterval(interval);
          return 1600;
        }
        return prev + 100;
      });
    }, 100);

    const completionTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1600);

    return () => {
      clearInterval(interval);
      clearTimeout(completionTimer);
    };
  }, [onComplete, isReduced]);

  const pct = Math.min(100, Math.floor((elapsed / 1500) * 100));
  const done = elapsed >= 1400;

  const statusItems: LifecycleStatusItem[] = RESTART_SERVICES.map(svc => {
    const isReady = elapsed >= svc.readyMs;
    return {
      id: svc.id,
      code: svc.code,
      label: svc.label,
      status: isReady ? 'READY' : 'RESETTING',
      isReady,
      isVisible: true,
    };
  });

  return (
    <motion.main
      data-testid="orion-restart-screen"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: isReduced ? 0.1 : 0.4, ease: ORION_EASE }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100000] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Unified Atmospheric OS Backdrop */}
      <OrionLifecycleBackdrop variant="boot" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Canonical Central Rotating Power Core */}
        <div className="mb-4">
          <OrionLifecycleCore status={done ? 'ready' : 'active'} size="md" />
        </div>

        {/* Calm Heading & Subtitle */}
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white mb-1">
          Restarting System
        </h2>
        <p className="text-xs text-neutral-400 font-normal mb-6 h-5 flex items-center justify-center">
          {done ? 'Rebooting into Orion OS' : 'Preparing clean system start'}
        </p>

        {/* Structured Reboot Services */}
        <div className="w-full max-w-[300px] mb-6">
          <OrionLifecycleStatusList
            title="SYSTEM REBOOT VECTORS"
            items={statusItems}
            allReady={done}
          />
        </div>

        {/* Precision Progress Bar */}
        <OrionLifecycleProgress
          progress={pct}
          label="REBOOT PROGRESS"
          readyLabel="SYSTEM READY"
          variant={done ? 'emerald' : 'sky'}
        />
      </div>
    </motion.main>
  );
};
