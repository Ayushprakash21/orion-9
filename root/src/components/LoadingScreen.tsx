import React, { useEffect, useState, useCallback, useRef, Component, ReactNode } from 'react';
import { BrandLogo } from './brand/BrandLogo';
import { IntelligenceCore } from './ui/IntelligenceCore';
import { brandingRepository } from '../repositories/BrandingRepository';
import { BrandingConfig } from '../types/auth';
import { cn } from '../lib/utils';

export interface LoadingScreenProps {
  message?: string;
  isFadingOut?: boolean;
  className?: string;
  variant?: 'default' | 'orion-initialization';
  destination?: string;
  onComplete?: () => void;
  duration?: number;
  isAdmin?: boolean;
}

/**
 * Pure CSS fallback AI sphere in the event of unexpected SVG rendering failure.
 * Guarantees zero blank screens under all circumstances.
 */
class SafeCoreBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="relative flex items-center justify-center w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]"
          aria-hidden="true"
        >
          <div className="absolute w-44 h-44 rounded-full bg-[#00F2FE]/15 blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 rounded-full border border-[#00F2FE]/40 bg-[#080D1A] flex items-center justify-center shadow-[0_0_25px_rgba(0,242,254,0.3)]">
            <div className="w-16 h-16 rounded-full border border-[#38BDF8]/60 flex items-center justify-center animate-spin">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#00F2FE] to-white shadow-[0_0_12px_#00F2FE] animate-ping" />
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Autonomous JARVIS-Style Intelligence Core Awakening Screen.
 * 
 * STRICT ARCHITECTURAL SPECIFICATIONS:
 * - EXACTLY ONE central 3D mechanical AI intelligence core.
 * - ZERO TEXT: No titles, no subtitles, no status codes, no percentages.
 * - ZERO BRANDING: No logos, no emblems, no company names.
 * - ZERO HUD: No targeting crosshairs, no telemetry, no header, no footer.
 * - Multi-layer concentric mechanical rings, turbine blades, amber nucleus, and orbiting flux particles.
 * - 5-second synchronized activation timeline -> smooth scale + blur + opacity transition to dashboard.
 */

function getInitializationStatusText(elapsed: number, duration: number, isAdmin: boolean) {
  const percent = elapsed / duration;
  
  if (isAdmin) {
    if (percent < 0.15) return "PLATFORM CORE ONLINE";
    if (percent < 0.3) return "DATA FABRIC CONNECTED";
    if (percent < 0.45) return "AI ENGINE ONLINE";
    if (percent < 0.6) return "DECISION FABRIC ONLINE";
    if (percent < 0.75) return "GOVERNANCE ENGINE ONLINE";
    if (percent < 0.85) return "AUDIT FABRIC ONLINE";
    return "PLATFORM CONTROL PLANE READY";
  } else {
    if (percent < 0.15) return "SUPPLY CHAIN CORE ONLINE";
    if (percent < 0.3) return "DATA FABRIC CONNECTED";
    if (percent < 0.45) return "WORLD MODEL ONLINE";
    if (percent < 0.55) return "PREDICTION ENGINE ONLINE";
    if (percent < 0.65) return "RISK ENGINE ONLINE";
    if (percent < 0.75) return "DECISION ENGINE ONLINE";
    if (percent < 0.85) return "WORKFLOW FABRIC ONLINE";
    return "SUPPLY CHAIN INTELLIGENCE READY";
  }
}

const SUPPLY_CHAIN_NODES = [
  { id: 'suppliers', label: 'SUPPLIERS', angle: -135, r: 240, activeAt: 0.1 },
  { id: 'materials', label: 'MATERIALS', angle: -90, r: 210, activeAt: 0.2 },
  { id: 'procurement', label: 'PROCUREMENT', angle: -45, r: 230, activeAt: 0.3 },
  { id: 'warehouse', label: 'WAREHOUSE', angle: 0, r: 220, activeAt: 0.4 },
  { id: 'inventory', label: 'INVENTORY', angle: 45, r: 240, activeAt: 0.5 },
  { id: 'logistics', label: 'LOGISTICS', angle: 90, r: 200, activeAt: 0.6 },
  { id: 'demand', label: 'DEMAND', angle: 135, r: 230, activeAt: 0.7 },
  { id: 'customers', label: 'CUSTOMERS', angle: 180, r: 250, activeAt: 0.8 },
];

export const SupplyChainConvergence: React.FC<{ elapsed: number; duration: number }> = ({ elapsed, duration }) => {
  const percent = Math.min(1, elapsed / duration);
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-10">
      <svg className="w-[800px] h-[800px] absolute opacity-80" viewBox="-400 -400 800 800">
        <defs>
          <filter id="glow-convergence" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g>
          {SUPPLY_CHAIN_NODES.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = node.r * Math.cos(rad);
            const y = node.r * Math.sin(rad);
            
            const isVisible = percent > node.activeAt;
            const opacity = isVisible ? Math.min(1, (percent - node.activeAt) * 5) : 0;
            
            const pathD = `M ${x} ${y} C ${x * 0.5} ${y * 0.5}, ${x * 0.2} ${y * 0.2}, 0 0`;
            
            const packetPhase = (percent - node.activeAt) * 3;
            const showPacket = isVisible && packetPhase > 0 && packetPhase < 1;
            
            return (
              <g key={node.id} style={{ opacity, transition: 'opacity 0.3s ease-in' }}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(0, 242, 254, 0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                
                {isVisible && (
                  <circle r="4" fill="#00F2FE" filter="url(#glow-convergence)">
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      path={pathD}
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </circle>
                )}

                <circle cx={x} cy={y} r="6" fill="#03060E" stroke="#00F2FE" strokeWidth="2" filter="url(#glow-convergence)" />
                <text 
                  x={x + (x > 0 ? 12 : -12)} 
                  y={y + 4} 
                  fill="#00F2FE" 
                  fontSize="10" 
                  fontFamily="monospace"
                  textAnchor={x > 0 ? "start" : "end"}
                  opacity="0.8"
                  letterSpacing="0.1em"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const OrionInitializationView: React.FC<{
  onComplete?: () => void;
  destination?: string;
  duration?: number;
  isAdmin?: boolean;
}> = ({ onComplete, duration = 8500, isAdmin = false }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const hasFinishedRef = useRef(false);

  const triggerCompletion = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    const startTime = performance.now();
    let frameId: number;

    const step = (now: number) => {
      const current = Math.min(duration, Math.floor(now - startTime));
      setElapsed(current);

      // Begin smooth transition at 4700ms (300ms before 5000ms completion)
      if (current >= duration - 300) {
        setIsExiting(true);
      }

      if (current >= duration) {
        triggerCompletion();
        return;
      }

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);

    // Hard safety timeout: guarantees transition finishes even if requestAnimationFrame pauses
    const safetyTimer = setTimeout(() => {
      triggerCompletion();
    }, duration + 250);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(safetyTimer);
    };
  }, [duration, triggerCompletion]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Intelligence Core Initializing"
      className={cn(
        "fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center select-none overflow-hidden m-0 p-0 box-border pointer-events-auto transition-all duration-300 ease-out",
        isExiting ? "opacity-0 scale-[1.03] blur-[2px]" : "opacity-100 scale-100 blur-0"
      )}
      style={{
        background: 'radial-gradient(circle at 50% 50%, #050B18 0%, #03060E 45%, #010204 100%)',
      }}
    >
      {/* Centered Autonomous 3D Mechanical Intelligence Core with Fail-Safe Boundary */}
      
      <div className="flex flex-col items-center justify-center relative w-full h-full">
        {/* Safe Core Boundary for the reactor */}
        
        <SupplyChainConvergence elapsed={elapsed} duration={duration} />
        <SafeCoreBoundary>
          <IntelligenceCore elapsed={elapsed} duration={duration} />
        </SafeCoreBoundary>

        
        {/* Cinematic status text below the core */}
        <div className="absolute bottom-[20%] text-center">
          <span className="text-xs tracking-[0.2em] font-mono text-[#00F2FE] uppercase opacity-80 animate-pulse transition-all duration-300">
            {getInitializationStatusText(elapsed, duration, isAdmin)}
          </span>
        </div>
      </div>

    </div>
  );
};

/**
 * Independent full-screen ORION-9 loading screen.
 * - Occupies 100vw × 100vh with position: fixed, z-index: 99999
 * - Locks application body/html scrollbars during loading
 * - Supports normal startup loader (variant="default")
 * - Supports cinematic JARVIS-style post-login animation (variant="orion-initialization")
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'INITIALIZING SYSTEM...',
  isFadingOut = false,
  className = '',
  variant = 'default',
  destination = '/',
  onComplete,
  duration = 8500,
  isAdmin = false,
}) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());

  // Lock out any application scrollbars while loading screen is active
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Synchronize branding config if updated
  useEffect(() => {
    const handleUpdate = () => {
      const config = brandingRepository.getBrandingSync();
      setBranding(config);
    };

    window.addEventListener('orion-branding-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('orion-branding-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // POST-LOGIN INITIALIZATION VARIANT (JARVIS-INSPIRED ORION AI CORE, NO PROGRESS BAR)
  if (variant === 'orion-initialization') {
    return (
      <OrionInitializationView
        destination={destination}
        onComplete={onComplete}
        duration={duration}
        isAdmin={isAdmin}
      />
    );
  }

  // STANDARD STARTUP LOADER VARIANT (PRESERVED FOR INITIAL BROWSER REFRESH / STARTUP)
  const appName = branding.applicationName || branding.appName || 'ORION-9';
  const logoSource = branding.logo || branding.logoUrl;
  const hasCustomLogoWithText = Boolean(logoSource && branding.logoIncludesName);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
      }}
      className={cn(
        "fixed inset-0 w-screen h-screen z-[99999] flex flex-col items-center justify-center bg-os-bg text-os-text-primary select-none overflow-hidden m-0 p-0 box-border transition-opacity duration-300 ease-out",
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center max-w-sm px-6 text-center select-none">
        {/* Centered single configured ORION-9 logo with gentle fade/scale entrance */}
        <div className="flex items-center justify-center mb-6 animate-logo-fade-scale">
          <BrandLogo sizePreset="lg" variant="mark" className="justify-center" />
        </div>

        {/* Render text only if logo does not already contain the wordmark/text */}
        {!hasCustomLogoWithText && (
          <>
            {/* ORION-9 Title */}
            <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-[0.25em] text-os-text-primary uppercase animate-text-fade-in">
              {appName}
            </h1>

            {/* Tagline */}
            <p className="text-xs sm:text-sm font-sans text-os-text-muted tracking-[0.05em] mt-1.5 animate-text-fade-in">
              {branding.tagline || branding.description || 'AI SUPPLY CHAIN OPERATING SYSTEM'}
            </p>
          </>
        )}

        {/* Animated loading indicator */}
        <div className="mt-8 flex flex-col items-center">
          {/* Continuously animating indeterminate progress line */}
          <div
            className="w-48 sm:w-56 h-[2px] bg-os-surface-elevated rounded-full overflow-hidden relative"
            role="progressbar"
            aria-label="Loading progress"
          >
            <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-[#E5E5E5] to-transparent rounded-full animate-indeterminate-bar" />
          </div>

          {/* INITIALIZING SYSTEM... with subtle opacity/pulse */}
          <span className="mt-4 text-[10px] sm:text-[11px] font-mono text-os-text-secondary tracking-[0.2em] uppercase animate-pulse-subtle">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
