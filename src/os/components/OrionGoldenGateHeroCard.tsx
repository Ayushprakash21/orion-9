import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Share2, 
  MoreHorizontal, 
  Sparkles, 
  Activity, 
  Bell, 
  ArrowDownRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Move
} from 'lucide-react';
import { useWindowManager } from '../WindowManagerContext';
import { useToast } from '../../store/ToastContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { useOrionTheme } from '../theme/useOrionTheme';
import { ORION_OS_METADATA } from '../constants/OrionOsMetadata';
import { BrandLogo } from '../../components/brand/BrandLogo';

export interface OrionGoldenGateHeroCardProps {
  onClose?: () => void;
  className?: string;
}

const STORAGE_KEY_POS = 'orion_control_tower_hero_pos';

export const OrionGoldenGateHeroCard: React.FC<OrionGoldenGateHeroCardProps> = ({
  onClose,
  className = ''
}) => {
  const { openApplication } = useWindowManager();
  const { showToast } = useToast();
  const { isDark, resolvedAccent } = useOrionTheme();
  const supplyChain = useSupplyChain();
  const { organization } = useAuth();

  const exceptionsCount = supplyChain?.exceptions?.length ?? 0;
  const criticalCount = supplyChain?.exceptions?.filter(e => e.severity === 'Critical')?.length ?? 0;

  // Window position state with persistent coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        } catch {}
      }
      const vWidth = window.innerWidth || 1440;
      const vHeight = window.innerHeight || 900;
      const defaultX = Math.max(24, Math.round((vWidth - 580) / 2));
      const defaultY = Math.max(68, Math.round((vHeight - 400) / 2) - 20);
      return { x: defaultX, y: defaultY };
    }
    return { x: 280, y: 120 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Clamp position to viewport bounds
  const clampCoordinates = useCallback((x: number, y: number, width: number, height: number) => {
    const vWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
    const minX = 12;
    const maxX = Math.max(minX, vWidth - width - 12);
    const minY = 48; // Below top system bar
    const maxY = Math.max(minY, vHeight - height - 80); // Above bottom dock
    return {
      x: Math.min(Math.max(minX, x), maxX),
      y: Math.min(Math.max(minY, y), maxY)
    };
  }, []);

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // Don't drag if clicking buttons, links, or inputs
    if ((e.target as HTMLElement).closest('button, a, input, select, [role="button"], [data-no-drag="true"]')) {
      return;
    }
    if (isMaximized) return;

    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const cardWidth = 580;
    const cardHeight = isMinimized ? 48 : 360;

    const clamped = clampCoordinates(
      dragStartRef.current.posX + dx,
      dragStartRef.current.posY + dy,
      cardWidth,
      cardHeight
    );
    setPosition(clamped);
  };

  const handleTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
      }
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(prev => !prev);
  };

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMaximized(prev => !prev);
  };

  const effectiveStyle: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        top: '48px',
        left: '20px',
        right: '20px',
        bottom: '84px',
        width: 'auto',
        maxWidth: 'none',
        zIndex: 35,
      }
    : {
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '580px',
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 25,
      };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      data-testid="orion-control-tower-card"
      style={effectiveStyle}
      className={`rounded-[24px] border border-white/[0.14] shadow-[0_24px_64px_rgba(0,0,0,0.60),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-[28px] overflow-hidden select-none pointer-events-auto transition-shadow ${
        isDragging ? 'shadow-[0_32px_80px_rgba(0,0,0,0.75)] ring-2 ring-[#D6A65C]/40' : ''
      } ${
        isDark ? 'bg-[#181B22]/90 text-white' : 'bg-white/94 text-slate-900 border-slate-900/12 shadow-[0_24px_50px_rgba(15,23,42,0.18)]'
      } ${className}`}
    >
      {/* 1. Window Chrome Header with Drag Handle */}
      <div 
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        onPointerCancel={handleTitlePointerUp}
        className={`flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/[0.08] cursor-grab active:cursor-grabbing ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        title="Drag to reposition window"
      >
        {/* Left: Window Dots + App Identifier */}
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5 group" data-no-drag="true">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Close"
              title="Close Control Tower Summary"
              className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center text-[8px] text-black/60 font-bold leading-none"
            >
              <span className="opacity-0 group-hover:opacity-100">×</span>
            </button>
            <button
              type="button"
              onClick={toggleMinimize}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Minimize"
              title="Minimize to header"
              className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center text-[8px] text-black/60 font-bold leading-none"
            >
              <span className="opacity-0 group-hover:opacity-100">–</span>
            </button>
            <button
              type="button"
              onClick={toggleMaximize}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Maximize"
              title="Toggle full screen window"
              className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center text-[8px] text-black/60 font-bold leading-none"
            >
              <span className="opacity-0 group-hover:opacity-100">+</span>
            </button>
          </div>

          {/* O9 App Icon Badge */}
          <div className="flex items-center gap-2 pl-1 pointer-events-none">
            <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/20 flex items-center justify-center font-bold font-mono text-[11px] text-[#D6A65C] shadow-xs">
              09
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tracking-tight text-white/95 uppercase font-mono">
                ORION-9 • SUPPLY CHAIN OS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#D6A65C]/15 text-[#D6A65C] border border-[#D6A65C]/35">
                DEMO
              </span>
            </div>
          </div>
        </div>

        {/* Right: Window Drag Indicator & Actions */}
        <div className="flex items-center gap-1.5 text-white/60" data-no-drag="true">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showToast('Control Tower session share link copied', 'info', 'Control Tower');
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Share"
            title="Share Session"
            className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openApplication('command-center');
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Open Full Control Tower"
            title="Open Full Workspace"
            className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 flex flex-col gap-3.5 overflow-hidden"
          >
            {/* Subheader */}
            <div className="flex items-center justify-between -mt-1 text-xs text-white/60">
              <span className="font-medium tracking-wide">Enterprise Control Tower</span>
              <span className="font-mono text-[10px] text-white/40">Real-time Telemetry</span>
            </div>

            {/* 2. Hero Operational Banner with Pulsar celestial emission */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.04] p-4 flex items-center justify-between backdrop-blur-md">
              {/* Left: System Status Pill */}
              <div className="flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.30)]">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">System Nominal</h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse" />
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    {criticalCount > 0 
                      ? `${criticalCount} critical exceptions pending resolution` 
                      : 'All supply chain flows are healthy'}
                  </p>
                </div>
              </div>

              {/* Right: Version + Pulsar Release Graphic */}
              <div className="flex items-center gap-3.5 z-10">
                <div className="text-right">
                  <div className="text-xs font-bold text-white/90 tracking-wide font-mono">
                    Version {ORION_OS_METADATA.version}
                  </div>
                  <div className="text-[10px] text-sky-400 font-bold tracking-wider uppercase font-mono">
                    {ORION_OS_METADATA.releaseCodename} RELEASE
                  </div>
                </div>

                {/* Pulsar Celestial Emission Waveform SVG */}
                <div className="w-12 h-10 text-sky-400/90 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="24" cy="24" r="5" className="fill-sky-400/20" />
                    <line x1="24" y1="4" x2="24" y2="44" strokeDasharray="2 3" strokeWidth="1.5" />
                    <line x1="4" y1="24" x2="44" y2="24" strokeDasharray="2 3" strokeWidth="1.5" />
                    <path d="M12 18 C16 12 32 12 36 18" strokeWidth="1.8" />
                    <path d="M12 30 C16 36 32 36 36 30" strokeWidth="1.8" />
                    <path d="M8 14 C15 6 33 6 40 14" strokeWidth="1.4" opacity="0.6" />
                    <path d="M8 34 C15 42 33 42 40 34" strokeWidth="1.4" opacity="0.6" />
                  </svg>
                </div>
              </div>

              {/* Background ambient warm sunset glow */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#E5A84B]/15 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* 3. Live Operational KPI Cards (Grid) */}
            <div className="grid grid-cols-4 gap-2">
              {/* Card 1: Exceptions */}
              <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                  Exceptions
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-base font-bold font-mono ${criticalCount > 0 ? 'text-rose-400' : 'text-white/95'}`}>
                    {exceptionsCount}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                    ↓ 100%
                  </span>
                </div>
              </div>

              {/* Card 2: Stock Coverage */}
              <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                  Stock Coverage
                </span>
                <div className="mt-1">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    Optimal
                  </span>
                </div>
              </div>

              {/* Card 3: Shipments */}
              <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                  Shipments
                </span>
                <div className="mt-1">
                  <span className="text-xs font-bold text-white/95">
                    On Track
                  </span>
                </div>
              </div>

              {/* Card 4: Connectors */}
              <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                  Connectors
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
                  <span className="text-xs font-bold text-white/95 font-mono">
                    5 Online
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* Open Copilot */}
              <button
                type="button"
                onClick={() => openApplication('ai-copilot')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Open Copilot</span>
              </button>

              {/* Control Tower (Active Glowing Gold Button) */}
              <button
                type="button"
                onClick={() => openApplication('command-center')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#E5A84B] hover:bg-[#D6963B] text-[#0B0D13] font-bold text-xs shadow-[0_4px_16px_rgba(229,168,75,0.40)] transition-all active:scale-[0.98] cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Control Tower</span>
              </button>

              {/* Alerts */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('orion:open-notifications'));
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-white/70" />
                <span>Alerts ({criticalCount})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const OrionPulsarHeroCard = OrionGoldenGateHeroCard;
export default OrionGoldenGateHeroCard;
