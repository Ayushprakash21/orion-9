import React, { useState, useEffect, useRef } from 'react';
import { Power } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { useSupplyChain } from '../../store/SupplyChainContext';

interface OrionPowerOnScreenProps {
  isInitializing: boolean;
  onPowerOn: () => void;
  onComplete: () => void;
}

export const OrionPowerOnScreen: React.FC<OrionPowerOnScreenProps> = ({ isInitializing, onPowerOn, onComplete }) => {
  const supplyChain = useSupplyChain();
  
  const [hovered, setHovered] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const reqRef = useRef<number | null>(null);

  const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const prefersReducedMotion = mediaQuery ? mediaQuery.matches : false;

  useEffect(() => {
    if (isInitializing) {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        setTimeMs(elapsed);
        
        if (elapsed < 10000) {
          reqRef.current = requestAnimationFrame(animate);
        } else {
          onComplete();
        }
      };
      reqRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isInitializing, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isInitializing) { onPowerOn(); }
    }
  };

  let phaseText = 'AWAITING POWER ON';
  if (isInitializing) {
    if (timeMs < 2000) phaseText = 'ORION CORE INITIALIZING';
    else if (timeMs < 4000) phaseText = 'WORLD MODEL INITIALIZING';
    else if (timeMs < 6000) phaseText = 'SUPPLY CHAIN NETWORK CONNECTING';
    else if (timeMs < 8000) phaseText = 'INTELLIGENCE FABRIC SYNCHRONIZING';
    else if (timeMs < 9500) phaseText = 'DECISION SYSTEM INITIALIZING';
    else phaseText = 'ORION READY';
  }

  // Ensure inner and outer nodes are well-spaced visually
  const innerNodes = ['DATA', 'AI', 'RISK', 'DECISION', 'WORKFLOW', 'MEMORY'];
  const outerNodes = ['SUPPLY', 'DEMAND', 'PROCUREMENT', 'CUSTOMERS', 'INVENTORY', 'LOGISTICS', 'WAREHOUSE'];

  const branding = brandingRepository.getEffectiveBranding();
  const appName = branding.appName || branding.productName || branding.applicationName || branding.osName || 'ORION-9';
  const appTagline = branding.description || branding.tagline || 'AI-NATIVE SUPPLY CHAIN OPERATING SYSTEM';
  const hasCustomLogoWithText = Boolean((branding.logo || branding.logoUrl) && (branding.logoIncludesName || branding.logoIncludesWordmark));

  return (
    <div className="fixed inset-0 w-full h-full z-[10000] bg-[#03060E] font-sans select-none overflow-hidden grid place-items-center">
      
      {/* Cinematic Vignette */}
      

      {/* 
        CENTRAL SCENE CONTAINER
        Strict width/height limits to keep layout locked in center.
        Flex column distributes space reliably.
      */}
      <div className="relative z-20 w-[min(90vw,1100px)] h-[min(90vh,800px)] flex flex-col items-center justify-between pointer-events-none">
        
        {/* =========================================================================
            ZONE 1: BRANDING (Top 25%)
            ========================================================================= */}
        <div className="flex flex-col items-center justify-start pt-[5%] h-[25%] w-full">
          <BrandLogo sizePreset="xl" variant="full" showName={false} className="justify-center mb-6 drop-shadow-[0_0_15px_rgba(0,242,254,0.15)] h-24 sm:h-32" />
          
          <div className="flex flex-col items-center justify-center text-center space-y-2 mt-4">
            <h1 className="font-mono font-bold tracking-[0.2em] text-os-text-primary text-lg sm:text-xl uppercase leading-none">
              {appName}
            </h1>
            <p className="font-mono text-os-accent/70 text-[10px] sm:text-xs tracking-[0.3em] uppercase max-w-[80vw] leading-tight">
              {appTagline}
            </p>
          </div>
        </div>

        {/* =========================================================================
            ZONE 2: CORE VISUALIZATION (Middle 60%)
            ========================================================================= */}
        <div className="relative flex flex-col items-center justify-center h-[60%] w-full">
          
          {/* Background SVG Canvas */}
          <div className="absolute inset-0 flex items-center justify-center overflow-visible pointer-events-none">
            
          </div>

          {/* Central Power Core */}
          <button
            onClick={!isInitializing ? () => { onPowerOn(); } : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onKeyDown={handleKeyDown}
            aria-label="Power on ORION"
            disabled={isInitializing}
            className={`
              relative z-30 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center pointer-events-auto
              bg-os-bg
              border border-[#1A2639] 
              shadow-[inset_0_2px_15px_rgba(255,255,255,0.05),0_10px_40px_rgba(0,0,0,0.8)]
              transition-all duration-700 ease-out cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#00F2FE]/30
              ${hovered && !isInitializing ? 'scale-105 border-[#00F2FE]/40 shadow-[inset_0_0_30px_rgba(0,242,254,0.15),0_0_40px_rgba(0,242,254,0.1)]' : ''}
              ${isInitializing ? 'scale-110 border-[#00F2FE]/60 shadow-[inset_0_0_50px_rgba(0,242,254,0.3),0_0_80px_rgba(0,242,254,0.2)] bg-os-bg' : ''}
              ${timeMs > 8500 ? 'opacity-0 scale-150 blur-xl' : ''}
            `}
          >
            {/* Glass / Metal Depth Inner Ring */}
            <div className="absolute inset-2 rounded-full border border-white/5 bg-gradient-to-tr from-transparent via-transparent to-white/5 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-os-border/50 bg-os-surface shadow-[inset_0_0_20px_rgba(0,0,0,1)] pointer-events-none" />
            
            {/* Internal rotating mechanical/technical ring */}
            <div className={`
              absolute inset-[14px] rounded-full border-[0.5px] border-t-[#00F2FE]/30 border-r-transparent border-b-[#00F2FE]/10 border-l-transparent
              transition-all duration-1000
              ${hovered && !isInitializing ? 'motion-safe:animate-[spin_4s_linear_infinite]' : ''}
              ${isInitializing ? 'motion-safe:animate-[spin_1s_linear_infinite] border-t-[#00F2FE]/80 border-b-[#00F2FE]/40' : ''}
            `} />
            
            <Power className={`
              relative z-10 w-10 h-10 transition-all duration-700
              ${isInitializing ? 'text-os-accent drop-shadow-[0_0_12px_rgba(0,242,254,0.8)] scale-110' : 'text-os-accent/40'}
              ${hovered && !isInitializing ? 'text-os-accent drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]' : ''}
            `} strokeWidth={2.5} />
            
            {/* Energy pulse in central ring */}
            {isInitializing && timeMs < 2000 && !prefersReducedMotion && (
              <div className="absolute inset-[14px] rounded-full border-[2px] border-[#00F2FE] animate-ping opacity-60" />
            )}
          </button>
        </div>

        {/* =========================================================================
            ZONE 3: STATUS (Bottom 15%)
            ========================================================================= */}
        <div className={`flex flex-col items-center justify-end pb-[5%] h-[15%] w-full transition-opacity duration-1000
          ${timeMs > 8500 ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 sm:gap-4 w-full justify-center px-4">
            <div className="hidden sm:block h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-[#00F2FE]/30" />
            <p className={`
              text-[10px] sm:text-xs font-mono tracking-[0.2em] sm:tracking-[0.4em] uppercase transition-colors duration-500 text-center whitespace-nowrap shrink-0
              ${isInitializing ? 'text-os-accent' : 'text-slate-500'}
            `}>
              {phaseText}
            </p>
            <div className="hidden sm:block h-px flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-[#00F2FE]/30" />
          </div>
        </div>

      </div>
    </div>
  );
};
