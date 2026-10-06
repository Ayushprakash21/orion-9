import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { cn } from '../../lib/utils';
import { powerOnVariants } from '../motion/OrionMotionVariants';
import { useIsReducedMotion, ORION_EASE } from '../motion/OrionMotion';

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
  { id: 'identity', label: 'Identity', readyMs: 1300 },
  { id: 'kernel', label: 'Kernel', readyMs: 1600 },
  { id: 'security', label: 'Security', readyMs: 1900 },
  { id: 'data-fabric', label: 'Data Fabric', readyMs: 2200 },
  { id: 'intelligence', label: 'Intelligence', readyMs: 2500 },
  { id: 'operations', label: 'Operations', readyMs: 2800 },
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
      setElapsedMs(3500);
      setPhase('BOOT_READY');
      return;
    }

    const handleFrame = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsed = now - startTimeRef.current;
      setElapsedMs(elapsed);

      if (elapsed >= 3400) {
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

  const allServicesReady = elapsedMs >= 2800 || phase === 'BOOT_READY';

  return (
    <motion.div
      data-testid="orion-startup-screen"
      data-startup-phase={phase}
      variants={powerOnVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 w-full h-[100dvh] z-[10000] bg-[#08090A] text-white font-sans select-none overflow-hidden flex flex-col items-center justify-center p-4"
    >
      {/* Subtle Barely-Visible Neutral Ambient Glow Behind Center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.025),transparent_60%)] pointer-events-none" />

      {/* Main Central Workspace */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center min-h-[420px]">
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
              {/* Logo without neon/cyan glow */}
              <motion.div
                data-testid="startup-logo"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: ORION_EASE }}
                className="relative mb-5"
              >
                <BrandLogo
                  sizePreset="lg"
                  variant="mark"
                  className="relative justify-center drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
                />
              </motion.div>

              {/* Tagline */}
              <p
                data-testid="startup-tagline"
                className="font-sans text-white/40 text-xs tracking-wider uppercase mt-1 mb-8"
              >
                {appTagline.toUpperCase()}
              </p>

              {/* Progressive Service Status */}
              <motion.div
                data-testid="initialization-status-box"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: elapsedMs >= 800 ? 1 : 0, y: elapsedMs >= 800 ? 0 : 8 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[280px] space-y-2"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-[11px] font-sans font-medium tracking-wider text-white/50 uppercase">
                  <span>INITIALIZING SYSTEM</span>
                  <span className={cn(
                    "transition-colors",
                    allServicesReady ? "text-emerald-400 font-medium" : "text-white/70"
                  )}>
                    {allServicesReady ? 'SYSTEM READY' : 'IN PROGRESS'}
                  </span>
                </div>

                {INITIALIZATION_SERVICES.map(svc => {
                  const isReady = elapsedMs >= svc.readyMs;
                  const isVisible = elapsedMs >= svc.readyMs - 200;

                  return (
                    <motion.div
                      key={svc.id}
                      data-testid={`init-service-${svc.id}`}
                      data-service-ready={isReady ? 'true' : 'false'}
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: isVisible ? 1 : 0.2 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between font-sans text-xs w-full py-0.5"
                    >
                      <span className="shrink-0 text-white/70 font-normal">{svc.label}</span>
                      <span className="mx-2 flex-1 border-b border-dotted border-white/10 h-0 translate-y-1" />
                      <span
                        className={cn(
                          "shrink-0 font-medium tracking-wide text-[10px] uppercase transition-colors duration-200",
                          isReady ? "text-emerald-400" : "text-white/30"
                        )}
                      >
                        {isReady ? 'READY' : 'PENDING'}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Final Stage Header Badge */}
              <div
                data-testid="init-system-ready-label"
                className={cn(
                  "mt-6 flex items-center justify-center gap-2 font-sans text-xs tracking-wider uppercase text-emerald-400 font-medium transition-all duration-300",
                  allServicesReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
              <div
                data-testid="boot-logo"
                className="relative mb-6"
              >
                <BrandLogo
                  sizePreset="lg"
                  variant="mark"
                  className="relative justify-center drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)]"
                />
              </div>

              {/* Restrained SYSTEM READY Badge */}
              <div
                data-testid="boot-system-ready-badge"
                className="flex items-center justify-center gap-2 mb-8 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans text-xs tracking-wider uppercase font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SYSTEM READY</span>
              </div>

              {/* Premium Minimal OS Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                data-testid="start-orion-button"
                onClick={handleStartOrion}
                disabled={isBooting}
                autoFocus
                aria-label="Start Orion Operating System"
                className={cn(
                  "relative w-full max-w-[240px] h-[50px] px-6 rounded-xl cursor-pointer select-none outline-none font-sans font-medium text-sm tracking-[0.04em]",
                  "bg-white/[0.035] hover:bg-white/[0.06] active:bg-white/[0.025]",
                  "border border-white/15 hover:border-white/25 focus-visible:border-white/40",
                  "text-white/90 hover:text-white transition-all duration-200",
                  "shadow-[0_12px_32px_rgba(0,0,0,0.45)]",
                  "focus-visible:ring-2 focus-visible:ring-white/20",
                  "flex items-center justify-center gap-2"
                )}
              >
                <span>
                  {isBooting ? 'BOOTING...' : 'START ORION'}
                </span>
              </motion.button>

              {/* Quiet ENTER SYSTEM prompt */}
              <p
                data-testid="boot-enter-system-caption"
                className="font-sans text-[10px] text-white/35 tracking-[0.18em] uppercase mt-4"
              >
                ENTER SYSTEM
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
