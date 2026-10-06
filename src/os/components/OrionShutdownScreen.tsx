/**
 * ORION-9 CANONICAL OS SHUTDOWN SCREEN
 * Controlled power teardown with restrained red accents, process termination status,
 * and clean system halt.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { shutdownVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';
import { OrionLifecycleBackdrop } from '../lifecycle/OrionLifecycleBackdrop';
import { OrionLifecycleCore } from '../lifecycle/OrionLifecycleCore';
import { OrionLifecycleStatusList, LifecycleStatusItem } from '../lifecycle/OrionLifecycleStatusList';
import { OrionLifecycleProgress } from '../lifecycle/OrionLifecycleProgress';

interface OrionShutdownScreenProps {
  onComplete?: () => void;
}

const SHUTDOWN_SERVICES = [
  { id: 'processes', code: '01', label: 'Stopping active processes', readyMs: 400 },
  { id: 'telemetry', code: '02', label: 'Disconnecting telemetry', readyMs: 900 },
  { id: 'state', code: '03', label: 'Saving system state', readyMs: 1400 },
  { id: 'fabric', code: '04', label: 'Closing event fabric', readyMs: 1800 },
  { id: 'runtime', code: '05', label: 'Releasing runtime', readyMs: 2100 },
  { id: 'power', code: '06', label: 'Power state', readyMs: 2300 },
];

export const OrionShutdownScreen: React.FC<OrionShutdownScreenProps> = ({ onComplete }) => {
  const isReduced = useIsReducedMotion();

  const [phase, setPhase] = useState<'initial' | 'processes' | 'telemetry' | 'state' | 'closing' | 'terminated'>('initial');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isReduced) {
      setPhase('terminated');
      if (onComplete) onComplete();
      return;
    }

    const t1 = setTimeout(() => {
      setPhase('processes');
    }, 400);

    const t2 = setTimeout(() => {
      setPhase('telemetry');
    }, 900);

    const t3 = setTimeout(() => {
      setPhase('state');
    }, 1400);

    const t4 = setTimeout(() => {
      setPhase('closing');
    }, 1900);

    const t5 = setTimeout(() => {
      setPhase('terminated');
      if (onComplete) onComplete();
    }, 2400);

    const interval = setInterval(() => {
      setElapsed(prev => prev + 100);
    }, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearInterval(interval);
    };
  }, [onComplete, isReduced]);

  const pct = Math.min(100, Math.floor((elapsed / 2200) * 100));
  const isHalted = phase === 'closing' || phase === 'terminated';

  const getStatusSubtitle = () => {
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

  const statusItems: LifecycleStatusItem[] = SHUTDOWN_SERVICES.map(svc => {
    const isReady = elapsed >= svc.readyMs;
    return {
      id: svc.id,
      code: svc.code,
      label: svc.label,
      status: isReady ? (svc.id === 'power' ? 'OFFLINE' : 'HALTED') : 'CLOSING',
      isReady,
      isVisible: true,
    };
  });

  return (
    <motion.main
      variants={shutdownVariants}
      initial="initial"
      animate={phase === 'terminated' || phase === 'closing' ? 'closing' : 'initial'}
      transition={{ duration: isReduced ? 0.1 : 0.4, ease: ORION_EASE }}
      className="fixed inset-0 w-screen h-[100dvh] z-[999999] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Unified Atmospheric OS Backdrop with Shutdown Accent */}
      <OrionLifecycleBackdrop variant="shutdown" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Central Rotating Power Core with Subdued Red Shutdown Highlight */}
        <motion.div
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <OrionLifecycleCore status="shutdown" size="md" />
        </motion.div>

        {/* Primary Subdued Red System Title */}
        <motion.h2
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="text-sm sm:text-base font-semibold tracking-[0.25em] text-red-400 uppercase mb-1"
        >
          System Shutdown
        </motion.h2>

        {/* Concise Single-Line Status Label */}
        <motion.p
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="text-xs text-neutral-400 font-normal mb-6 h-5 flex items-center justify-center"
        >
          {getStatusSubtitle()}
        </motion.p>

        {/* Structured Shutdown Services */}
        <div className="w-full max-w-[300px] mb-6">
          <OrionLifecycleStatusList
            title="SYSTEM SHUTDOWN"
            items={statusItems}
            allReady={isHalted}
          />
        </div>

        {/* Restrained Red Progress Bar */}
        <motion.div
          animate={{ opacity: phase === 'terminated' ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[280px]"
        >
          <OrionLifecycleProgress
            progress={pct}
            label="POWER BUS OFFLINE"
            readyLabel="SYSTEM OFFLINE"
            variant="red"
          />
        </motion.div>
      </div>
    </motion.main>
  );
};
