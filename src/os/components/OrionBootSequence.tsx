/**
 * ORION-9 CANONICAL OS BOOT SEQUENCE
 * Cinematic system assembly with mechanical rotating power core,
 * structured service alignment, environmental topology, and seamless transition to login.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useIsReducedMotion, ORION_EASE, ORION_BOOT_MOTION_SCALE } from '../motion/OrionMotion';
import { OrionLifecycleBackdrop } from '../lifecycle/OrionLifecycleBackdrop';
import { OrionLifecycleCore } from '../lifecycle/OrionLifecycleCore';
import { OrionLifecycleStatusList, LifecycleStatusItem } from '../lifecycle/OrionLifecycleStatusList';
import { OrionLifecycleProgress } from '../lifecycle/OrionLifecycleProgress';

interface OrionBootSequenceProps {
  onComplete: () => void;
}

interface BootServiceStage {
  id: string;
  code: string;
  label: string;
  readyStatus: string;
  readyMs: number;
}

// Measured boot sequence visual pacing scaled to ~80% speed (1.25x durations)
const TOTAL_BOOT_MS = Math.round(2800 * ORION_BOOT_MOTION_SCALE); // 3500ms
const BOOT_READY_THRESHOLD_MS = Math.round(2600 * ORION_BOOT_MOTION_SCALE); // 3250ms

const BOOT_SERVICES: BootServiceStage[] = [
  { id: 'identity', code: '01', label: 'POWER BUS', readyStatus: 'STABLE', readyMs: Math.round(600 * ORION_BOOT_MOTION_SCALE) },       // 750ms
  { id: 'kernel', code: '02', label: 'EVENT FABRIC', readyStatus: 'BOUND', readyMs: Math.round(1000 * ORION_BOOT_MOTION_SCALE) },       // 1250ms
  { id: 'security', code: '03', label: 'WORLD MODEL', readyStatus: 'MOUNTED', readyMs: Math.round(1400 * ORION_BOOT_MOTION_SCALE) },    // 1750ms
  { id: 'data-fabric', code: '04', label: 'INTELLIGENCE CORE', readyStatus: 'ONLINE', readyMs: Math.round(1800 * ORION_BOOT_MOTION_SCALE) }, // 2250ms
  { id: 'intelligence', code: '05', label: 'DECISION PLANE', readyStatus: 'ARMED', readyMs: Math.round(2200 * ORION_BOOT_MOTION_SCALE) },// 2750ms
  { id: 'operations', code: '06', label: 'ORION-9 KERNEL', readyStatus: 'READY', readyMs: Math.round(2500 * ORION_BOOT_MOTION_SCALE) }, // 3125ms
];

export function OrionBootSequence({ onComplete }: OrionBootSequenceProps) {
  const isReduced = useIsReducedMotion();

  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (isReduced) {
      setElapsed(TOTAL_BOOT_MS);
      const timer = setTimeout(() => {
        if (!done.current) {
          done.current = true;
          onComplete();
        }
      }, 200);
      return () => clearTimeout(timer);
    }

    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const e = t - start.current;
      setElapsed(e);
      if (e >= TOTAL_BOOT_MS) {
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

  const pct = Math.min(100, Math.floor((elapsed / TOTAL_BOOT_MS) * 100));
  const ready = elapsed >= BOOT_READY_THRESHOLD_MS;

  const getStatusSubtitle = () => {
    if (pct < 25) return 'Establishing system power';
    if (pct < 55) return 'Constructing operational world model';
    if (pct < 80) return 'Initializing decision intelligence fabric';
    if (ready) return 'System ready';
    return 'Finalizing kernel execution space';
  };

  const statusItems: LifecycleStatusItem[] = BOOT_SERVICES.map(svc => {
    const isReady = elapsed >= svc.readyMs;
    const isVisible = elapsed >= svc.readyMs - 250;
    return {
      id: svc.id,
      code: svc.code,
      label: svc.label,
      status: isReady ? svc.readyStatus : 'STANDBY',
      isReady,
      isVisible,
    };
  });

  return (
    <motion.main
      data-testid="orion-boot-sequence"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: isReduced ? 0.1 : 0.5, ease: ORION_EASE }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100000] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Unified Atmospheric OS Backdrop with Vector Topology */}
      <OrionLifecycleBackdrop variant={ready ? 'ready' : 'boot'} showTopology={true} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Canonical Central Rotating Power Core */}
        <div className="mb-4">
          <OrionLifecycleCore status={ready ? 'ready' : 'active'} size="lg" />
        </div>

        {/* Calm Heading & Subtitle */}
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white mb-1">
          {ready ? 'Orion-9 Ready' : 'Starting Orion'}
        </h2>
        <p className="text-xs text-neutral-400 font-normal mb-6 h-5 flex items-center justify-center">
          {getStatusSubtitle()}
        </p>

        {/* Structured Assembly Services */}
        <div className="w-full max-w-[300px] mb-6">
          <OrionLifecycleStatusList
            title="SYSTEM ASSEMBLY"
            items={statusItems}
            allReady={ready}
          />
        </div>

        {/* Precision Progress Bar */}
        <OrionLifecycleProgress
          progress={pct}
          label="ASSEMBLY PROGRESS"
          readyLabel="SYSTEM READY"
          variant={ready ? 'emerald' : 'neutral'}
        />
      </div>
    </motion.main>
  );
}
