import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Share2, 
  MoreHorizontal, 
  Sparkles, 
  Activity, 
  Bell, 
  ArrowDownRight,
  ShieldCheck,
  Zap
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      data-testid="golden-gate-control-tower-card"
      className={`relative w-full max-w-[580px] rounded-[24px] border border-white/[0.14] shadow-[0_24px_64px_rgba(0,0,0,0.60),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-[28px] overflow-hidden select-none pointer-events-auto transition-all ${
        isDark ? 'bg-[#181B22]/88 text-white' : 'bg-white/90 text-slate-900 border-slate-900/12 shadow-[0_24px_50px_rgba(15,23,42,0.18)]'
      } ${className}`}
    >
      {/* 1. macOS Window Chrome Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-white/[0.08]">
        {/* Left: Window Dots + App Identifier */}
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5 group">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition-opacity cursor-pointer"
            />
            <button
              type="button"
              aria-label="Minimize"
              className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 transition-opacity cursor-pointer"
            />
            <button
              type="button"
              aria-label="Maximize"
              className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 transition-opacity cursor-pointer"
            />
          </div>

          {/* O9 App Icon Badge */}
          <div className="flex items-center gap-2 pl-1">
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

        {/* Right: Window Actions */}
        <div className="flex items-center gap-1.5 text-white/60">
          <button
            type="button"
            onClick={() => showToast('Control Tower session share link copied', 'info', 'Control Tower')}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Share Workspace"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openApplication('settings')}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Window Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtitle Bar */}
      <div className="px-5 pt-2 pb-1">
        <span className="text-[11px] text-white/50 font-medium">
          Enterprise Control Tower
        </span>
      </div>

      {/* 2. Main Content Body */}
      <div className="p-5 pt-2 space-y-4">
        {/* Status Banner with Golden Gate Wireframe Artwork */}
        <div className="relative rounded-2xl p-4 border border-white/[0.10] bg-white/[0.04] backdrop-blur-md flex items-center justify-between overflow-hidden shadow-inner">
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>System Nominal</span>
              </div>
              <p className="text-[12px] text-white/70 mt-0.5">
                All supply chain flows are healthy
              </p>
            </div>
          </div>

          {/* Right Wireframe Golden Gate Bridge Art & Edition Badge */}
          <div className="flex items-center gap-3 z-10">
            <div className="text-right">
              <div className="text-[12px] font-bold text-white/90">Version 21.1</div>
              <div className="text-[10px] text-[#D6A65C] font-medium tracking-wide">
                Golden Gate Edition
              </div>
            </div>

            {/* Architectural Wireframe SVG of Golden Gate Bridge */}
            <svg
              viewBox="0 0 100 48"
              className="w-16 h-10 text-[#D6A65C]/80 stroke-current shrink-0 pointer-events-none drop-shadow-[0_0_8px_rgba(214,166,92,0.4)]"
              fill="none"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Main Suspension Tower Left */}
              <line x1="30" y1="4" x2="30" y2="44" strokeWidth="1.8" />
              <line x1="34" y1="4" x2="34" y2="44" strokeWidth="1.8" />
              <line x1="30" y1="12" x2="34" y2="12" />
              <line x1="30" y1="20" x2="34" y2="20" />
              <line x1="30" y1="28" x2="34" y2="28" />
              <line x1="30" y1="36" x2="34" y2="36" />
              {/* X Braces */}
              <line x1="30" y1="12" x2="34" y2="20" strokeWidth="0.8" />
              <line x1="34" y1="12" x2="30" y2="20" strokeWidth="0.8" />
              <line x1="30" y1="20" x2="34" y2="28" strokeWidth="0.8" />
              <line x1="34" y1="20" x2="30" y2="28" strokeWidth="0.8" />

              {/* Main Suspension Tower Right */}
              <line x1="72" y1="4" x2="72" y2="44" strokeWidth="1.8" />
              <line x1="76" y1="4" x2="76" y2="44" strokeWidth="1.8" />
              <line x1="72" y1="12" x2="76" y2="12" />
              <line x1="72" y1="20" x2="76" y2="20" />
              <line x1="72" y1="28" x2="76" y2="28" />
              <line x1="72" y1="36" x2="76" y2="36" />
              {/* X Braces */}
              <line x1="72" y1="12" x2="76" y2="20" strokeWidth="0.8" />
              <line x1="76" y1="12" x2="72" y2="20" strokeWidth="0.8" />
              <line x1="72" y1="20" x2="76" y2="28" strokeWidth="0.8" />
              <line x1="76" y1="20" x2="72" y2="28" strokeWidth="0.8" />

              {/* Suspension Cables Catenary Curves */}
              <path d="M 4 28 Q 18 10 32 4" strokeWidth="1.6" />
              <path d="M 32 4 Q 53 32 74 4" strokeWidth="1.6" />
              <path d="M 74 4 Q 88 10 98 28" strokeWidth="1.6" />

              {/* Bridge Road Deck */}
              <line x1="2" y1="30" x2="98" y2="30" strokeWidth="2.2" stroke="#E5A84B" />

              {/* Vertical Suspenders */}
              <line x1="16" y1="18" x2="16" y2="30" strokeWidth="0.7" />
              <line x1="22" y1="12" x2="22" y2="30" strokeWidth="0.7" />
              <line x1="42" y1="18" x2="42" y2="30" strokeWidth="0.7" />
              <line x1="48" y1="25" x2="48" y2="30" strokeWidth="0.7" />
              <line x1="53" y1="28" x2="53" y2="30" strokeWidth="0.7" />
              <line x1="58" y1="25" x2="58" y2="30" strokeWidth="0.7" />
              <line x1="64" y1="18" x2="64" y2="30" strokeWidth="0.7" />
              <line x1="84" y1="12" x2="84" y2="30" strokeWidth="0.7" />
              <line x1="90" y1="18" x2="90" y2="30" strokeWidth="0.7" />

              {/* Water Bay Baseline */}
              <line x1="0" y1="44" x2="100" y2="44" strokeWidth="0.8" stroke="rgba(255,255,255,0.2)" />
            </svg>
          </div>
        </div>

        {/* 3. Metrics Row — Exactly matching reference */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Card 1: Exceptions */}
          <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between">
            <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
              Exceptions
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-bold font-mono text-white">
                {exceptionsCount}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center">
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
              <span className="text-xs font-bold text-emerald-400">
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

        {/* 4. Action Buttons — Exactly matching reference */}
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
      </div>
    </motion.div>
  );
};

export default OrionGoldenGateHeroCard;
