/**
 * ORION-9 CANONICAL OS LOGOUT & SESSION TEARDOWN SCREEN
 * Graceful session state persistence, telemetry disconnection, and cryptographic credential clearance.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';
import { OrionLifecycleBackdrop } from '../lifecycle/OrionLifecycleBackdrop';
import { OrionLifecycleCore } from '../lifecycle/OrionLifecycleCore';
import { OrionLifecycleStatusList, LifecycleStatusItem } from '../lifecycle/OrionLifecycleStatusList';
import { OrionLifecycleProgress } from '../lifecycle/OrionLifecycleProgress';

interface OrionLogoutScreenProps {
  onComplete: () => void;
}

const TEARDOWN_SERVICES = [
  { id: 'state', code: '01', label: 'Saving workspace state', readyMs: 300 },
  { id: 'apps', code: '02', label: 'Closing applications', readyMs: 600 },
  { id: 'realtime', code: '03', label: 'Stopping live subscriptions', readyMs: 900 },
  { id: 'credentials', code: '04', label: 'Clearing credentials', readyMs: 1200 },
  { id: 'privileged', code: '05', label: 'Revoking privileged state', readyMs: 1500 },
  { id: 'session', code: '06', label: 'Closing secure session', readyMs: 1700 },
];

export const OrionLogoutScreen: React.FC<OrionLogoutScreenProps> = ({ onComplete }) => {
  const isReduced = useIsReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isReduced) {
      const timer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev >= 1900) {
          clearInterval(interval);
          return 1900;
        }
        return prev + 100;
      });
    }, 100);

    const completionTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(completionTimer);
    };
  }, [onComplete, isReduced]);

  const pct = Math.min(100, Math.floor((elapsed / 1800) * 100));
  const done = elapsed >= 1700;

  const statusItems: LifecycleStatusItem[] = TEARDOWN_SERVICES.map(svc => {
    const isReady = elapsed >= svc.readyMs;
    return {
      id: svc.id,
      code: svc.code,
      label: svc.label,
      status: isReady ? 'READY' : 'CLOSING',
      isReady,
      isVisible: true,
    };
  });

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isReduced ? 0.1 : 0.4, ease: ORION_EASE }}
      className="fixed inset-0 w-screen h-[100dvh] z-[999999] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
      role="status"
      aria-live="polite"
    >
      {/* Unified Atmospheric OS Backdrop */}
      <OrionLifecycleBackdrop variant={done ? 'ready' : 'default'} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center px-6 pointer-events-none">
        {/* Canonical Central Rotating Power Core */}
        <div className="mb-4">
          <OrionLifecycleCore status={done ? 'ready' : 'active'} size="md" />
        </div>

        {/* Calm Heading & Subtitle */}
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white mb-1">
          Signing Out
        </h2>
        <p className="text-xs text-neutral-400 font-normal mb-6 h-5 flex items-center justify-center">
          {done ? 'Session closed' : 'Closing secure session and clearing credentials'}
        </p>

        {/* Structured Teardown Services */}
        <div className="w-full max-w-[300px] mb-6">
          <OrionLifecycleStatusList
            title="SECURE SESSION TEARDOWN"
            items={statusItems}
            allReady={done}
          />
        </div>

        {/* Precision Progress Bar */}
        <OrionLifecycleProgress
          progress={pct}
          label="TEARDOWN PROGRESS"
          readyLabel="SESSION CLOSED"
          variant={done ? 'emerald' : 'sky'}
        />
      </div>
    </motion.main>
  );
};
