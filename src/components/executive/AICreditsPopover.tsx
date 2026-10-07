import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Zap, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWindowManager } from '../../os/WindowManagerContext';

export interface AICreditsState {
  total: number;
  remaining: number;
  used: number;
  renewalDate: string;
}

interface AICreditsPopoverProps {
  credits?: AICreditsState;
  onTopUp?: () => void;
  className?: string;
}

export const AICreditsPopover: React.FC<AICreditsPopoverProps> = ({
  credits = {
    total: 100,
    remaining: 94.63,
    used: 5.37,
    renewalDate: 'Nov 01, 2026',
  },
  onTopUp,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  let openApplication: (id: string) => void = () => {};
  try {
    const wm = useWindowManager();
    if (wm?.openApplication) {
      openApplication = wm.openApplication;
    }
  } catch (e) {}

  const percentageRemaining = Math.round((credits.remaining / credits.total) * 100);

  const handleTopUp = () => {
    if (onTopUp) {
      onTopUp();
    } else {
      openApplication('settings');
    }
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block select-none", className)}>
      {/* Trigger Button Matching Reference 3: Pill with AI credits count */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono transition-all border cursor-pointer",
          isOpen 
            ? "bg-[#1B1C1C] text-os-text-primary border-[#39C77A]/50 shadow-xs" 
            : "bg-[#101111] hover:bg-[#151616] text-os-text-secondary hover:text-os-text-primary border-white/[0.08]"
        )}
        title="AI Inference Credits & Quota"
        aria-expanded={isOpen}
      >
        <div className="w-2 h-2 rounded-full bg-[#39C77A] animate-pulse" />
        <span className="font-semibold text-os-text-primary">{credits.remaining.toFixed(2)}</span>
        <span className="text-os-text-muted">/ {credits.total}</span>
        <ChevronDown size={12} className={cn("text-os-text-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-[#101111] border border-white/[0.1] shadow-2xl p-4 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
            role="dialog"
            aria-label="AI Credits Usage and Quotas"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#39C77A]/15 border border-[#39C77A]/30 flex items-center justify-center text-[#39C77A]">
                  <Sparkles size={13} />
                </div>
                <div>
                  <h4 className="font-semibold text-os-text-primary text-[13px] leading-tight">AI Compute Credits</h4>
                  <p className="text-[10px] text-os-text-muted font-mono">Governed Enterprise Quota</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-os-text-muted hover:text-os-text-primary p-1 rounded-md hover:bg-white/[0.05]"
              >
                <X size={14} />
              </button>
            </div>

            {/* Credit Numbers */}
            <div className="py-3 space-y-2">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-2xl font-light tracking-tight text-os-text-primary">
                  {credits.remaining.toFixed(2)}
                </span>
                <span className="text-xs text-os-text-muted">
                  / {credits.total}.00 total
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#1B1C1C] rounded-full overflow-hidden border border-white/[0.06]">
                <div 
                  className="h-full bg-gradient-to-r from-[#39C77A] to-[#2ea865] rounded-full transition-all duration-300"
                  style={{ width: `${percentageRemaining}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-os-text-muted pt-1">
                <span className="text-[#39C77A] font-medium">{percentageRemaining}% remaining</span>
                <span>{credits.used.toFixed(2)} consumed</span>
              </div>
            </div>

            {/* Quota details */}
            <div className="bg-[#151616] border border-white/[0.06] rounded-lg p-2.5 space-y-1.5 text-[11px] font-mono text-os-text-secondary">
              <div className="flex justify-between">
                <span className="text-os-text-muted">Reset Cycle:</span>
                <span className="text-os-text-primary">{credits.renewalDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-os-text-muted">Governance:</span>
                <span className="text-[#39C77A] flex items-center gap-1">
                  <ShieldCheck size={11} /> Active
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTopUp}
                className="flex-1 py-1.5 px-3 rounded-md bg-[#39C77A] hover:bg-[#32b56e] text-[#0B0C0C] font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Zap size={13} className="fill-current" />
                <span>Top Up</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openApplication('ai-workforce');
                  setIsOpen(false);
                }}
                className="py-1.5 px-2.5 rounded-md bg-[#1B1C1C] hover:bg-white/[0.08] text-os-text-secondary hover:text-os-text-primary border border-white/[0.08] transition-colors cursor-pointer"
                title="AI Workforce & Agent Policies"
              >
                <Layers size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
