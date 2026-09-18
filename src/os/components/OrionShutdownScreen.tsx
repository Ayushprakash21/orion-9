import React, { useEffect, useState } from 'react';
import { Power } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface OrionShutdownScreenProps {
  onComplete?: () => void;
}

export const OrionShutdownScreen: React.FC<OrionShutdownScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'initial' | 'network' | 'nodes' | 'orbital' | 'core' | 'final' | 'terminated'>('initial');
  
  
  useEffect(() => {
    // 0-1s: Initial
    const t1 = setTimeout(() => setPhase('network'), 300);
    // 1-3s: Network drains, packets disappear
    const t2 = setTimeout(() => setPhase('nodes'), 700);
    // 3-5s: Nodes disconnect
    const t3 = setTimeout(() => setPhase('orbital'), 1100);
    // 5-6s: Orbital rings contract
    const t4 = setTimeout(() => setPhase('core'), 1500);
    // 6-8s: Core loses energy, final warning pulse
    const t5 = setTimeout(() => setPhase('final'), 2000);
    // 8-10s: Terminated fade out
    const t6 = setTimeout(() => {
      setPhase('terminated');
      if (onComplete) onComplete();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#03060E] z-[999999] flex flex-col items-center justify-center font-sans overflow-hidden select-none">
      
      <div className="relative z-20 w-[min(90vw,1100px)] h-[min(90vh,800px)] flex flex-col items-center justify-between pointer-events-none">
        
        {/* =========================================================================
            ZONE 1: BRANDING (Top 25%) - Centered composition, no top-left logo
            ========================================================================= */}
        <div className={`flex flex-col items-center justify-center pt-[5%] h-[25%] w-full transition-opacity duration-1000
            ${phase === 'terminated' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <BrandLogo
              sizePreset="xl"
              variant="full"
              className="justify-center h-24 sm:h-32 drop-shadow-[0_0_18px_rgba(0,242,254,0.18)]"
            />
            <p className="font-mono text-red-500/60 text-xs sm:text-sm tracking-[0.3em] uppercase max-w-[80vw] leading-tight">
              SYSTEM SHUTDOWN
            </p>
          </div>
        </div>

        {/* =========================================================================
            ZONE 2: CORE VISUALIZATION (Middle 60%) - Centered red power core
            ========================================================================= */}
        <div className="relative flex flex-col items-center justify-center h-[60%] w-full">
          <div className={`relative flex items-center justify-center transition-all duration-[2000ms] ease-[cubic-bezier(0.2,0,0,1)]
            ${phase === 'initial' || phase === 'network' ? 'scale-100 opacity-100' : ''}
            ${phase === 'nodes' ? 'scale-90 opacity-80' : ''}
            ${phase === 'orbital' ? 'scale-75 opacity-50' : ''}
            ${phase === 'core' ? 'scale-50 opacity-20' : ''}
            ${phase === 'final' || phase === 'terminated' ? 'scale-0 opacity-0 blur-xl' : ''}
          `}>
            {/* Collapsing Rings */}
            <div className={`absolute w-48 h-48 rounded-full border border-red-500/10 transition-all duration-1000
              ${phase === 'initial' ? 'animate-[spin_6s_linear_infinite]' : 'animate-none scale-50 opacity-0'}`} />
            
            <div className="absolute w-36 h-36 rounded-full border border-red-500/20 bg-red-500/5 shadow-[0_0_60px_rgba(239,68,68,0.25)] animate-[spin_4s_linear_infinite]" />
            <div className="absolute w-28 h-28 rounded-full border border-red-500/30 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.35)] animate-[spin_3s_linear_infinite_reverse]" />
            
            <div className="relative w-20 h-20 rounded-full bg-black flex items-center justify-center border border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <Power className={`w-8 h-8 text-red-500 ${phase === 'core' || phase === 'final' ? 'animate-pulse opacity-50' : ''}`} />
            </div>
          </div>
        </div>

        {/* =========================================================================
            ZONE 3: STATUS FEED (Bottom 15%)
            ========================================================================= */}
        <div className={`flex flex-col items-center justify-end pb-[5%] h-[15%] w-full transition-opacity duration-1000
            ${phase === 'terminated' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex flex-col items-center gap-2 text-center">
            
            <span className={`text-[10px] sm:text-xs font-mono tracking-[0.2em] transition-opacity duration-300
              ${phase === 'initial' || phase === 'network' ? 'text-red-400 opacity-100' : 'text-slate-600 opacity-50'}`}>
              TERMINATING ACTIVE PROCESSES
            </span>
            <span className={`text-[10px] sm:text-xs font-mono tracking-[0.2em] transition-opacity duration-300
              ${phase === 'nodes' || phase === 'orbital' ? 'text-red-400 opacity-100' : 'text-slate-600 opacity-50'}`}>
              DISCONNECTING DATA FABRIC & SUPPLY CHAIN TELEMETRY
            </span>
            <span className={`text-[10px] sm:text-xs font-mono tracking-[0.2em] transition-opacity duration-300
              ${phase === 'core' || phase === 'final' ? 'text-red-400 opacity-100' : 'text-slate-600 opacity-50'}`}>
              SAVING SESSION STATE & CLOSING ENVIRONMENT
            </span>

          </div>
        </div>

      </div>
    </div>
  );
};
