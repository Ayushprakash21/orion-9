/**
 * ORION-9 CANONICAL POST-LOGIN WORLD ENTRY SEQUENCE
 * Restores authenticated operator session and mounts governance or supply workspace.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { worldEntryContainerVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';
import { OrionLifecycleBackdrop } from '../lifecycle/OrionLifecycleBackdrop';
import { OrionLifecycleCore } from '../lifecycle/OrionLifecycleCore';
import { OrionLifecycleStatusList, LifecycleStatusItem } from '../lifecycle/OrionLifecycleStatusList';
import { OrionLifecycleProgress } from '../lifecycle/OrionLifecycleProgress';

interface Props {
  onComplete: () => void;
  isAdmin?: boolean;
}

const WORLD_ENTRY_STAGES = [
  { id: 'world-model', code: '01', label: 'WORLD MODEL', readyMs: 400 },
  { id: 'supply-network', code: '02', label: 'SUPPLY NETWORK', readyMs: 750 },
  { id: 'decision-fabric', code: '03', label: 'DECISION FABRIC', readyMs: 1100 },
  { id: 'governance', code: '04', label: 'GOVERNANCE PLANE', readyMs: 1400 },
];

export const OrionWorldEntrySequence: React.FC<Props> = ({ onComplete, isAdmin = false }) => {
  const isReduced = useIsReducedMotion();

  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (isReduced) {
      setElapsed(1600);
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
      if (e >= 1600) {
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

  const pct = Math.min(100, Math.floor((elapsed / 1600) * 100));
  const ready = elapsed >= 1400;

  const getStatusSubtitle = () => {
    if (pct < 30) return 'Restoring secure session';
    if (pct < 70) return isAdmin ? 'Mounting enterprise control center' : 'Preparing operational workspace';
    if (pct < 95) return 'Finalizing telemetry connections';
    return 'Workspace ready';
  };

  const statusItems: LifecycleStatusItem[] = WORLD_ENTRY_STAGES.map(svc => {
    const isReady = elapsed >= svc.readyMs;
    return {
      id: svc.id,
      code: svc.code,
      label: svc.label,
      status: isReady ? 'READY' : 'MOUNTING',
      isReady,
      isVisible: true,
    };
  });

  return (
    <motion.main
      variants={worldEntryContainerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 w-screen h-[100dvh] z-[100000] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Unified Atmospheric OS Backdrop */}
      <OrionLifecycleBackdrop variant={ready ? 'ready' : 'boot'} showTopology={true} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Canonical Central Rotating Power Core */}
        <div className="mb-4">
          <OrionLifecycleCore status={ready ? 'ready' : 'active'} size="lg" />
        </div>

        {/* Calm Heading & Subtitle */}
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white mb-1">
          {isAdmin ? 'Entering Control Center' : 'Starting Orion'}
        </h2>
        <p className="text-xs text-neutral-400 font-normal mb-6 h-5 flex items-center justify-center">
          {getStatusSubtitle()}
        </p>

        {/* Structured Assembly Services */}
        <div className="w-full max-w-[300px] mb-6">
          <OrionLifecycleStatusList
            title="WORKSPACE FABRIC"
            items={statusItems}
            allReady={ready}
          />
        </div>

        {/* Precision Progress Bar */}
        <OrionLifecycleProgress
          progress={pct}
          label="MOUNTING PROGRESS"
          readyLabel="SYSTEM READY"
          variant={ready ? 'emerald' : 'sky'}
        />
      </div>
    </motion.main>
  );
};
