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
      className="fixed inset-0 w-full h-full z-[10000] bg-[#05070B] text-os-text-primary font-sans select-none overflow-hidden flex flex-col items-center justify-center p-4"
    >
      {/* Background Ambient OS Grid & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,254,0.035),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(5,7,11,0.8))] pointer-events-none" />

      {/* Main Central Workspace */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center min-h-[420px]">
        <AnimatePresence mode="wait">
          {phase === 'INITIALIZING' && (
            <motion.div
              key="initializing-phase"
              data-testid="initialization-phase"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: isReduced ? 0.1 : 0.5, ease: ORION_EASE }}
              className="flex flex-col items-center justify-center text-center w-full"
              role="status"
              aria-live="polite"
            >
              {/* Logo with cyan glow */}
              <motion.div
                data-testid="startup-logo"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: ORION_EASE }}
                className="relative mb-5"
              >
                <div className="absolute inset-0 rounded-full bg-[#00F2FE]/15 blur-xl transition-opacity duration-700" />
                <BrandLogo
                  sizePreset="lg"
                  variant="mark"
                  className="relative justify-center drop-shadow-[0_0_15px_rgba(0,242,254,0.3)]"
                />
              </motion.div>

              {/* Tagline */}
              <p
                data-testid="startup-tagline"
                className="font-mono text-os-text-muted text-[10px] sm:text-xs tracking-[0.2em] uppercase mt-1 mb-8"
              >
                {appTagline.toUpperCase()}
              </p>

              {/* Progressive Service Status */}
              <motion.div
                data-testid="initialization-status-box"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: elapsedMs >= 1000 ? 1 : 0, y: elapsedMs >= 1000 ? 0 : 10 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[320px] space-y-1.5"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-[10px] font-mono tracking-widest text-os-text-muted uppercase">
                  <span>INITIALIZING SYSTEM</span>
                  <span className={cn(
                    "transition-colors",
                    allServicesReady ? "text-emerald-400 font-semibold" : "text-[#00F2FE]"
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
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between font-mono text-[11px] sm:text-xs w-full py-0.5"
                    >
                      <span className="shrink-0 text-os-text-secondary">{svc.label}</span>
                      <span className="mx-2 flex-1 border-b border-dotted border-white/15 h-0 translate-y-1" />
                      <span
                        className={cn(
                          "shrink-0 font-semibold tracking-wider text-[10px] uppercase transition-colors duration-300",
                          isReady ? "text-emerald-400" : "text-os-text-muted/60"
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
                  "mt-6 flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase text-emerald-400 font-semibold transition-all duration-500",
                  allServicesReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
                <span>SYSTEM READY</span>
              </div>
            </motion.div>
          )}

          {phase === 'BOOT_READY' && (
            <motion.div
              key="boot-ready-phase"
              data-testid="boot-phase"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: isReduced ? 0.1 : 0.5, ease: ORION_EASE }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              <div
                data-testid="boot-logo"
                className="relative mb-5"
              >
                <div className="absolute inset-0 rounded-full bg-[#00F2FE]/15 blur-xl animate-pulse" />
                <BrandLogo
                  sizePreset="lg"
                  variant="mark"
                  className="relative justify-center drop-shadow-[0_0_20px_rgba(0,242,254,0.35)]"
                />
              </div>

              <div
                data-testid="boot-system-ready-badge"
                className="flex items-center justify-center gap-2 mb-8 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] tracking-[0.2em] uppercase"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse" />
                <span>SYSTEM READY</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                data-testid="start-orion-button"
                onClick={handleStartOrion}
                disabled={isBooting}
                autoFocus
                aria-label="Start Orion Operating System"
                className={cn(
                  "relative group w-full max-w-[220px] px-6 py-3.5 rounded-xl cursor-pointer select-none outline-none",
                  "bg-[#0C1017] hover:bg-[#121824] active:scale-[0.98]",
                  "border border-white/10 hover:border-[#00F2FE]/50 focus-visible:border-[#00F2FE]/80",
                  "shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)]",
                  "hover:shadow-[0_0_25px_rgba(0,242,254,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                  "focus-visible:ring-2 focus-visible:ring-[#00F2FE]/40",
                  "transition-all duration-200 flex items-center justify-center gap-2"
                )}
              >
                <span className="font-mono font-bold text-xs tracking-[0.22em] text-[#00F2FE] group-hover:text-white transition-colors uppercase">
                  {isBooting ? 'BOOTING...' : 'START ORION'}
                </span>
              </motion.button>

              <p
                data-testid="boot-enter-system-caption"
                className="font-mono text-[10px] text-os-text-muted tracking-[0.25em] uppercase mt-4"
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
