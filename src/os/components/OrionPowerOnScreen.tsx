/**
 * ORION-9 CANONICAL OS POWER-ON & FIRMWARE INITIALIZATION SCREEN
 * Restores the bespoke Orion OS power core and branded power entry control
 * with an aerospace-grade dark atmospheric environment.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { powerOnVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';
import { OrionLifecycleBackdrop } from '../lifecycle/OrionLifecycleBackdrop';
import { OrionLifecycleCore } from '../lifecycle/OrionLifecycleCore';
import { OrionLifecycleStatusList, LifecycleStatusItem } from '../lifecycle/OrionLifecycleStatusList';
import { OrionLifecyclePowerControl } from '../lifecycle/OrionLifecyclePowerControl';
import { cn } from '../../lib/utils';

export interface OrionPowerOnScreenProps {
  isInitializing?: boolean;
  onPowerOn: () => void;
  onComplete?: () => void;
}

export type StartupPhase = 'INITIALIZING' | 'BOOT_READY';

interface ServiceStage {
  id: string;
  label: string;
  readyMs: number;
}

const INITIALIZATION_SERVICES: ServiceStage[] = [
  { id: 'identity', label: 'Identity', readyMs: 1100 },
  { id: 'kernel', label: 'Kernel', readyMs: 1400 },
  { id: 'security', label: 'Security', readyMs: 1700 },
  { id: 'data-fabric', label: 'Data Fabric', readyMs: 2000 },
  { id: 'intelligence', label: 'Intelligence', readyMs: 2300 },
  { id: 'operations', label: 'Operations', readyMs: 2600 },
];

export const OrionPowerOnScreen: React.FC<OrionPowerOnScreenProps> = ({
  onPowerOn,
}) => {
  const [phase, setPhase] = useState<StartupPhase>('INITIALIZING');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isBooting, setIsBooting] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isReduced = useIsReducedMotion();

  const branding = brandingRepository.getEffectiveBranding();
  const appTagline = branding.description || branding.tagline || 'AI SUPPLY CHAIN OPERATING SYSTEM';

  // Deterministic Initialization Timeline
  useEffect(() => {
    if (isReduced) {
      setElapsedMs(3200);
      setPhase('BOOT_READY');
      return;
    }

    const handleFrame = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsed = now - startTimeRef.current;
      setElapsedMs(elapsed);

      if (elapsed >= 3000) {
        setPhase('BOOT_READY');
        return;
      }

      animationFrameRef.current = requestAnimationFrame(handleFrame);
    };

    animationFrameRef.current = requestAnimationFrame(handleFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReduced]);

  const handleStartOrion = useCallback(() => {
    if (isBooting) return;
    setIsBooting(true);
    onPowerOn();
  }, [isBooting, onPowerOn]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
    if (phase === 'INITIALIZING') {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        setPhase('BOOT_READY');
      }
    } else if (phase === 'BOOT_READY') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStartOrion();
      }
    }
  }, [phase, handleStartOrion]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const allServicesReady = elapsedMs >= 2600 || phase === 'BOOT_READY';

  const statusItems: LifecycleStatusItem[] = INITIALIZATION_SERVICES.map(svc => {
    const isReady = elapsedMs >= svc.readyMs;
    const isVisible = elapsedMs >= svc.readyMs - 200;
    return {
      id: svc.id,
      label: svc.label,
      status: isReady ? 'READY' : 'PENDING',
      isReady,
      isVisible,
    };
  });

  return (
    <motion.div
      data-testid="orion-startup-screen"
      data-startup-phase={phase}
      variants={powerOnVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 w-full h-[100dvh] z-[10000] text-white font-sans select-none overflow-hidden flex flex-col items-center justify-center p-4"
    >
      {/* Unified Atmospheric OS Backdrop */}
      <OrionLifecycleBackdrop variant={phase === 'BOOT_READY' ? 'ready' : 'default'} />

      {/* Main Central Workspace */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center min-h-[480px]">
        <AnimatePresence mode="wait">
          {phase === 'INITIALIZING' && (
            <motion.div
              key="initializing-phase"
              data-testid="initialization-phase"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: isReduced ? 0.1 : 0.4, ease: ORION_EASE }}
              className="flex flex-col items-center justify-center text-center w-full"
              role="status"
              aria-live="polite"
            >
              {/* Rotating Power Core & Centered Logo */}
              <div data-testid="startup-logo" className="mb-4">
                <OrionLifecycleCore status="initializing" size="md" />
              </div>

              {/* Tagline */}
              <p
                data-testid="startup-tagline"
                className="font-sans text-white/40 text-[11px] tracking-[0.2em] uppercase mb-6"
              >
                {appTagline.toUpperCase()}
              </p>

              {/* Progressive Service Status */}
              <div data-testid="initialization-status-box" className="w-full max-w-[300px]">
                <OrionLifecycleStatusList
                  title="INITIALIZING SYSTEM"
                  items={statusItems}
                  allReady={allServicesReady}
                />
              </div>

              {/* Final Stage Header Badge */}
              <div
                data-testid="init-system-ready-label"
                className={cn(
                  "mt-6 flex items-center justify-center gap-2 font-sans text-xs tracking-wider uppercase text-emerald-400 font-medium transition-all duration-300",
                  allServicesReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYSTEM READY</span>
              </div>
            </motion.div>
          )}

          {phase === 'BOOT_READY' && (
            <motion.div
              key="boot-ready-phase"
              data-testid="boot-phase"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: isReduced ? 0.1 : 0.4, ease: ORION_EASE }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              {/* Illuminated Active Power Core */}
              <div data-testid="boot-logo" className="mb-6">
                <OrionLifecycleCore status="ready" size="lg" />
              </div>

              {/* Restrained SYSTEM READY Badge */}
              <div
                data-testid="boot-system-ready-badge"
                className="flex items-center justify-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans text-xs tracking-wider uppercase font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYSTEM READY</span>
              </div>

              {/* Branded OS Power Entry Control */}
              <OrionLifecyclePowerControl
                onClick={handleStartOrion}
                isBooting={isBooting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
