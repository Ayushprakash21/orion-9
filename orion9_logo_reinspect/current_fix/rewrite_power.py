with open('src/os/components/OrionPowerOnScreen.tsx', 'r') as f:
    content = f.read()

new_content = """import React, { useState, useEffect, useRef } from 'react';
import { Power } from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { brandingRepository } from '../../repositories/BrandingRepository';

interface OrionPowerOnScreenProps {
  isInitializing: boolean;
  onPowerOn: () => void;
  onComplete: () => void;
}

export const OrionPowerOnScreen: React.FC<OrionPowerOnScreenProps> = ({ isInitializing, onPowerOn, onComplete }) => {
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
      if (!isInitializing) onPowerOn();
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
  const appName = branding.appName || branding.productName || branding.applicationName || branding.osName || 'ORION SCM OS';
  const appTagline = branding.description || branding.tagline || 'AI-NATIVE SUPPLY CHAIN OPERATING SYSTEM';
  const hasCustomLogoWithText = Boolean((branding.logo || branding.logoUrl) && (branding.logoIncludesName || branding.logoIncludesWordmark));

  return (
    <div className="fixed inset-0 w-full h-full z-[10000] bg-[#020305] font-sans select-none overflow-hidden grid place-items-center">
      
      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000000_100%)] pointer-events-none z-10" />

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
          <BrandLogo size={56} variant="mark" className="justify-center mb-4 scale-110 drop-shadow-[0_0_15px_rgba(0,242,254,0.15)]" />
          
          {!hasCustomLogoWithText && (
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <h1 className="font-mono font-bold tracking-[0.2em] text-white text-lg sm:text-xl uppercase leading-none">
                {appName}
              </h1>
              <p className="font-mono text-[#00F2FE]/70 text-[10px] sm:text-xs tracking-[0.3em] uppercase max-w-[80vw] leading-tight">
                {appTagline}
              </p>
            </div>
          )}
        </div>

        {/* =========================================================================
            ZONE 2: CORE VISUALIZATION (Middle 60%)
            ========================================================================= */}
        <div className="relative flex flex-col items-center justify-center h-[60%] w-full">
          
          {/* Background SVG Canvas */}
          <div className="absolute inset-0 flex items-center justify-center overflow-visible pointer-events-none">
            <svg 
              className="w-full h-full max-w-[800px] max-h-[800px] opacity-80" 
              viewBox="-400 -400 800 800" 
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(0,242,254,0.4)" />
                  <stop offset="100%" stopColor="rgba(0,242,254,0)" />
                </radialGradient>
              </defs>
              
              {/* Background Rings */}
              <g className="opacity-40">
                <circle cx="0" cy="0" r="140" fill="none" stroke="rgba(0,242,254,0.15)" strokeWidth="0.5" strokeDasharray="2 4" 
                   className={timeMs > 1000 ? 'motion-safe:animate-[spin_40s_linear_infinite]' : ''} />
                <circle cx="0" cy="0" r="260" fill="none" stroke="rgba(0,242,254,0.08)" strokeWidth="1"
                    className={timeMs > 1000 ? 'motion-safe:animate-[spin_60s_linear_infinite_reverse]' : ''} />
                <circle cx="0" cy="0" r="350" fill="none" stroke="rgba(0,242,254,0.03)" strokeWidth="0.5" strokeDasharray="1 6"
                  className={timeMs > 1000 ? 'motion-safe:animate-[spin_90s_linear_infinite]' : ''} />
              </g>

              {/* Inner Ring (Intelligence) - Reveals 2s-4s */}
              {innerNodes.map((node, i) => {
                const angle = (i * Math.PI * 2) / innerNodes.length - Math.PI / 2;
                const radius = 140;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                // Scale in starting at 2000ms, staggered
                const delayMs = 2000 + i * 200;
                const scale = Math.min(1, Math.max(0, (timeMs - delayMs) / 500));

                if (scale <= 0) return null;

                return (
                  <g key={`inner-${node}`} style={{ transform: `scale(${scale})`, transformOrigin: `${x}px ${y}px` }}>
                    <line x1={0} y1={0} x2={x} y2={y} stroke="rgba(0,242,254,0.15)" strokeWidth="0.5" />
                    <circle cx={x} cy={y} r="3" fill="#8B5CF6" />
                    <circle cx={x} cy={y} r="12" fill="url(#nodeGlow)" />
                    <text 
                        x={x + (x > -10 && x < 10 ? 0 : (x > 0 ? 15 : -15))} 
                       y={y + (x > -10 && x < 10 ? (y > 0 ? 20 : -12) : 4)} 
                       fill="rgba(139, 92, 246, 0.9)" 
                       fontSize="11" 
                       fontFamily="monospace" 
                       fontWeight="bold" 
                       textAnchor={x > -10 && x < 10 ? "middle" : (x > 0 ? "start" : "end")} 
                       letterSpacing="0.15em"
                    >
                      {node}
                    </text>
                  </g>
                );
              })}

              {/* Outer Ring (Supply Chain) - Reveals 4s-6s */}
              {outerNodes.map((node, i) => {
                // Offset angle so it interweaves
                const angle = (i * Math.PI * 2) / outerNodes.length - Math.PI / 2;
                const radius = 260;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                // Scale in starting at 4000ms, staggered
                const delayMs = 4000 + i * 200;
                const scale = Math.min(1, Math.max(0, (timeMs - delayMs) / 500));

                if (scale <= 0) return null;

                // Connect to nearest inner node
                const innerAngle = (i * Math.PI * 2) / innerNodes.length - Math.PI / 2;
                const innerX = Math.cos(innerAngle) * 140;
                const innerY = Math.sin(innerAngle) * 140;

                return (
                  <g key={`outer-${node}`} style={{ transform: `scale(${scale})`, transformOrigin: `${x}px ${y}px` }}>
                    <line x1={innerX} y1={innerY} x2={x} y2={y} stroke="rgba(0,242,254,0.1)" strokeWidth="1" strokeDasharray="2 4" />
                    <circle cx={x} cy={y} r="4" fill="#00F2FE" />
                    <circle cx={x} cy={y} r="15" fill="url(#nodeGlow)" />
                    <text 
                        x={x + (x > -10 && x < 10 ? 0 : (x > 0 ? 18 : -18))} 
                       y={y + (x > -10 && x < 10 ? (y > 0 ? 22 : -14) : 4)} 
                       fill="rgba(0,242,254,0.9)" 
                       fontSize="12" 
                       fontFamily="monospace" 
                       fontWeight="bold" 
                       textAnchor={x > -10 && x < 10 ? "middle" : (x > 0 ? "start" : "end")} 
                       letterSpacing="0.2em"
                    >
                      {node}
                    </text>
                  </g>
                );
              })}

              {/* Network Connections - Reveals 6s-8s */}
              {timeMs > 6000 && outerNodes.map((_, i) => {
                const angle1 = (i * Math.PI * 2) / outerNodes.length - Math.PI / 2;
                const nextI = (i + 1) % outerNodes.length;
                const angle2 = (nextI * Math.PI * 2) / outerNodes.length - Math.PI / 2;
                
                const x1 = Math.cos(angle1) * 260;
                const y1 = Math.sin(angle1) * 260;
                const x2 = Math.cos(angle2) * 260;
                const y2 = Math.sin(angle2) * 260;

                const opacity = Math.min(1, (timeMs - 6000) / 1000);

                return (
                  <path 
                      key={`edge-${i}`} 
                     d={`M ${x1} ${y1} Q 0 0 ${x2} ${y2}`} 
                     stroke="rgba(0,242,254,0.05)" 
                     strokeWidth="1" 
                     fill="none" 
                     style={{ opacity }} 
                   />
                );
              })}
            </svg>
          </div>

          {/* Central Power Core */}
          <button
            onClick={!isInitializing ? onPowerOn : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onKeyDown={handleKeyDown}
            aria-label="Power on ORION"
            disabled={isInitializing}
            className={`
              relative z-30 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center pointer-events-auto
              bg-gradient-to-b from-[#060B14] to-[#010204]
              border border-[#1A2639] 
              shadow-[inset_0_2px_15px_rgba(255,255,255,0.05),0_10px_40px_rgba(0,0,0,0.8)]
              transition-all duration-700 ease-out cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#00F2FE]/30
              ${hovered && !isInitializing ? 'scale-105 border-[#00F2FE]/40 shadow-[inset_0_0_30px_rgba(0,242,254,0.15),0_0_40px_rgba(0,242,254,0.1)]' : ''}
              ${isInitializing ? 'scale-110 border-[#00F2FE]/60 shadow-[inset_0_0_50px_rgba(0,242,254,0.3),0_0_80px_rgba(0,242,254,0.2)] bg-gradient-to-b from-[#0A1A2F] to-[#010204]' : ''}
              ${timeMs > 8500 ? 'opacity-0 scale-150 blur-xl' : ''}
            `}
          >
            {/* Glass / Metal Depth Inner Ring */}
            <div className="absolute inset-2 rounded-full border border-white/5 bg-gradient-to-tr from-transparent via-transparent to-white/5 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-black/50 bg-[#020408] shadow-[inset_0_0_20px_rgba(0,0,0,1)] pointer-events-none" />
            
            {/* Internal rotating mechanical/technical ring */}
            <div className={`
              absolute inset-[14px] rounded-full border-[0.5px] border-t-[#00F2FE]/30 border-r-transparent border-b-[#00F2FE]/10 border-l-transparent
              transition-all duration-1000
              ${hovered && !isInitializing ? 'motion-safe:animate-[spin_4s_linear_infinite]' : ''}
              ${isInitializing ? 'motion-safe:animate-[spin_1s_linear_infinite] border-t-[#00F2FE]/80 border-b-[#00F2FE]/40' : ''}
            `} />
            
            <Power className={`
              relative z-10 w-10 h-10 transition-all duration-700
              ${isInitializing ? 'text-[#00F2FE] drop-shadow-[0_0_12px_rgba(0,242,254,0.8)] scale-110' : 'text-[#00F2FE]/40'}
              ${hovered && !isInitializing ? 'text-[#00F2FE] drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]' : ''}
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
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#00F2FE]/30" />
            <p className={`
              text-[10px] sm:text-xs font-mono tracking-[0.3em] sm:tracking-[0.4em] uppercase transition-colors duration-500 text-center
              ${isInitializing ? 'text-[#00F2FE]' : 'text-slate-500'}
            `}>
              {phaseText}
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#00F2FE]/30" />
          </div>
        </div>

      </div>
    </div>
  );
};
"""

with open('src/os/components/OrionPowerOnScreen.tsx', 'w') as f:
    f.write(new_content)
