import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';

export interface IntelligenceCoreProps {
  /** Elapsed time in milliseconds (0 to 5000) */
  elapsed: number;
  /** Total animation duration (default 5000) */
  duration?: number;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * 3D-feel Autonomous Mechanical Intelligence Core.
 * Modeled after futuristic cinematic intelligence cores (JARVIS / Ultron / Arc Reactor inspired).
 * Concentric multi-layer architecture:
 * - Center: Multi-spectral luminous energy nucleus (White / Amber / Cyan)
 * - Layer 1: Amber turbine reactor aperture & obsidian chamber
 * - Layer 2: Metallic iris turbine with 16 beveled mechanical blades & 4 cardinal caliper nodes
 * - Layer 3: Thin luminous circuit ring & energy filament couplings
 * - Layer 4: Primary glowing glass torus ring with specular lens highlight
 * - Layer 5: Counter-rotating segmented orbital mechanical track with micro-notches
 * - Layer 6: Outer atmospheric guide track with satellite nodes
 * - Orbiting quantum flux particles & outward energy wavefront
 * 
 * ZERO TEXT • ZERO LOGOS • ZERO HUD • PURE INTELLIGENCE CORE
 */
export const IntelligenceCore: React.FC<IntelligenceCoreProps> = ({
  elapsed,
  duration = 5000,
  className = '',
}) => {
  const progress = Math.min(1, Math.max(0, elapsed / duration));

  // Determine current intelligence evolution phase
  // 0.0 - 1.0s: Awakening / Forming (tiny point -> inner layers)
  // 1.0 - 2.0s: Mechanical Assembly (rings assemble, rotation begins)
  // 2.0 - 3.5s: Neural Processing / Thinking (high activity, accelerated circulation)
  // 3.5 - 4.5s: Harmonic Pulse (shockwave travels center -> outer)
  // 4.5 - 5.0s: Convergence & Settle
  const isForming = elapsed < 1000;
  const isAssembling = elapsed >= 1000 && elapsed < 2000;
  const isThinking = elapsed >= 2000 && elapsed < 3500;
  const isPulsing = elapsed >= 3500 && elapsed < 4500;
  const isSettling = elapsed >= 4500;

  // Wave expansion ratio during phase 3.5s - 4.5s (0.0 -> 1.0)
  const pulseWaveProgress = isPulsing ? Math.min(1, (elapsed - 3500) / 1000) : 0;

  // Overall core entrance scale & opacity (0.0 -> 1.0 during first 900ms)
  const entranceOpacity = Math.min(1, elapsed / 800);
  const outerLayersOpacity = elapsed < 600 ? 0 : Math.min(1, (elapsed - 600) / 900);

  // Generate 16 mechanical iris turbine blades (Layer 2)
  const irisBlades = useMemo(() => {
    const blades = [];
    const count = 16;
    const rInner = 36;
    const rOuter = 55;
    const widthAngle = 8; // degrees width of each blade

    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad1 = ((angle - widthAngle / 2) * Math.PI) / 180;
      const rad2 = ((angle + widthAngle / 2) * Math.PI) / 180;
      const rad3 = ((angle + widthAngle / 1.5) * Math.PI) / 180;
      const rad4 = ((angle - widthAngle / 3) * Math.PI) / 180;

      const p1x = 160 + rInner * Math.cos(rad1);
      const p1y = 160 + rInner * Math.sin(rad1);
      const p2x = 160 + rOuter * Math.cos(rad2);
      const p2y = 160 + rOuter * Math.sin(rad2);
      const p3x = 160 + rOuter * Math.cos(rad3);
      const p3y = 160 + rOuter * Math.sin(rad3);
      const p4x = 160 + rInner * Math.cos(rad4);
      const p4y = 160 + rInner * Math.sin(rad4);

      const d = `M ${p1x.toFixed(1)} ${p1y.toFixed(1)} L ${p2x.toFixed(1)} ${p2y.toFixed(1)} L ${p3x.toFixed(1)} ${p3y.toFixed(1)} L ${p4x.toFixed(1)} ${p4y.toFixed(1)} Z`;
      blades.push({ id: i, d, angle });
    }
    return blades;
  }, []);

  // Generate 12 amber reactor turbine teeth (Layer 1)
  const amberTeeth = useMemo(() => {
    const teeth = [];
    const count = 12;
    const rInner = 20;
    const rOuter = 31;
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      const x1 = 160 + rInner * Math.cos(rad);
      const y1 = 160 + rInner * Math.sin(rad);
      const x2 = 160 + rOuter * Math.cos(rad);
      const y2 = 160 + rOuter * Math.sin(rad);
      teeth.push({ id: i, x1, y1, x2, y2 });
    }
    return teeth;
  }, []);

  // Generate 32 mechanical tick notches for Layer 5
  const mechanicalNotches = useMemo(() => {
    const notches = [];
    const count = 32;
    const rBase = 117;
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      const isMajor = i % 4 === 0;
      const length = isMajor ? 5 : 2.5;
      const x1 = 160 + (rBase - length / 2) * Math.cos(rad);
      const y1 = 160 + (rBase - length / 2) * Math.sin(rad);
      const x2 = 160 + (rBase + length / 2) * Math.cos(rad);
      const y2 = 160 + (rBase + length / 2) * Math.sin(rad);
      notches.push({ id: i, x1, y1, x2, y2, isMajor });
    }
    return notches;
  }, []);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none pointer-events-none",
        "w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[280px] md:h-[280px]",
        className
      )}
      style={{ opacity: entranceOpacity }}
    >
      {/* 1. ATMOSPHERIC DEEP RADIAL ILLUMINATION (Soft dark-navy/cyan bloom behind the core) */}
      <div
        className={cn(
          "absolute -inset-10 sm:-inset-16 rounded-full pointer-events-none transition-all duration-1000 blur-3xl",
          isThinking
            ? "bg-[#00F2FE]/20 scale-110"
            : isPulsing
            ? "bg-[#00F2FE]/25 scale-115"
            : isAssembling
            ? "bg-[#0284C7]/18 scale-100"
            : "bg-[#00F2FE]/10 scale-95"
        )}
      />

      {/* 2. SECONDARY AMBER CORE BLOOM (Warm core presence in the very center) */}
      <div
        className={cn(
          "absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full pointer-events-none transition-all duration-700 blur-xl",
          isThinking
            ? "bg-[#F59E0B]/25 scale-120"
            : isPulsing
            ? "bg-[#F59E0B]/30 scale-125"
            : "bg-[#F59E0B]/15 scale-100"
        )}
      />

      {/* 3. MULTI-LAYER 3D MECHANICAL SVG ENGINE */}
      <svg
        viewBox="0 0 320 320"
        className="absolute inset-0 w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Central Nucleus Multi-Spectral Radial Gradient */}
          <radialGradient id="ai-core-nucleus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="25%" stopColor="#FEF08A" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.85" />
            <stop offset="78%" stopColor="#00F2FE" stopOpacity="0.65" />
            <stop offset="92%" stopColor="#0284C7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>

          {/* Cyan Energy Plasma Gradient */}
          <radialGradient id="ai-core-cyan-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#00F2FE" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0284C7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>

          {/* Metallic Iris Blade Linear Gradient (Gives mechanical 3D bevel reflection) */}
          <linearGradient id="ai-metal-blade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="40%" stopColor="#1E293B" />
            <stop offset="75%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Glass Specular Torus Gradient (Reflective highlight on upper-left arc) */}
          <linearGradient id="ai-specular-torus" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#E0F2FE" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </linearGradient>

          {/* Caliper Housing Gradient */}
          <linearGradient id="ai-caliper-metal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Outer Segmented Ring Gradient */}
          <linearGradient id="ai-outer-cyan-band" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0284C7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.75" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="ai-glow-nucleus" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ai-glow-subtle" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* KEYFRAME ANIMATION STYLES */}
          <style>{`
            @keyframes ai-core-breathe {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.025); }
            }
            @keyframes ai-spin-cw-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes ai-spin-cw-mid {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes ai-spin-ccw-slow {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            @keyframes ai-spin-ccw-mid {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            @keyframes ai-pulse-nucleus {
              0%, 100% { transform: scale(0.95); opacity: 0.85; }
              50% { transform: scale(1.12); opacity: 1.0; }
            }
            @keyframes ai-thinking-flutter {
              0%, 100% { opacity: 0.85; }
              25% { opacity: 1.0; }
              50% { opacity: 0.75; }
              75% { opacity: 0.95; }
            }

            .ai-core-group {
              transform-origin: 160px 160px;
              animation: ai-core-breathe 3.2s ease-in-out infinite;
            }
            .ai-rotate-outer-cw {
              transform-origin: 160px 160px;
              animation: ai-spin-cw-slow 48s linear infinite;
            }
            .ai-rotate-mid-ccw {
              transform-origin: 160px 160px;
              animation: ai-spin-ccw-mid 32s linear infinite;
            }
            .ai-rotate-glass-cw {
              transform-origin: 160px 160px;
              animation: ai-spin-cw-mid 24s linear infinite;
            }
            .ai-rotate-circuits-ccw {
              transform-origin: 160px 160px;
              animation: ai-spin-ccw-slow 20s linear infinite;
            }
            .ai-rotate-turbine-cw {
              transform-origin: 160px 160px;
              animation: ai-spin-cw-slow 16s linear infinite;
            }
            .ai-rotate-amber-ccw {
              transform-origin: 160px 160px;
              animation: ai-spin-ccw-mid 12s linear infinite;
            }
            .ai-pulse-center {
              transform-origin: 160px 160px;
              animation: ai-pulse-nucleus 2.4s ease-in-out infinite;
            }
            .ai-thinking-mode {
              animation: ai-thinking-flutter 0.6s ease-in-out infinite alternate;
            }
            .ai-particles-inner-cw {
              transform-origin: 160px 160px;
              animation: ai-spin-cw-slow 14s linear infinite;
            }
            .ai-particles-mid-ccw {
              transform-origin: 160px 160px;
              animation: ai-spin-ccw-mid 18s linear infinite;
            }
            .ai-particles-outer-cw {
              transform-origin: 160px 160px;
              animation: ai-spin-cw-slow 26s linear infinite;
            }

            @media (prefers-reduced-motion: reduce) {
              .ai-core-group,
              .ai-rotate-outer-cw,
              .ai-rotate-mid-ccw,
              .ai-rotate-glass-cw,
              .ai-rotate-circuits-ccw,
              .ai-rotate-turbine-cw,
              .ai-rotate-amber-ccw,
              .ai-pulse-center,
              .ai-particles-inner-cw,
              .ai-particles-mid-ccw,
              .ai-particles-outer-cw {
                animation: none !important;
              }
            }
          `}</style>
        </defs>

        {/* =================================================================== */}
        {/* MAIN BREATHING INTELLIGENCE CORE GROUP */}
        {/* =================================================================== */}
        <g className="ai-core-group">

          {/* =============================================================== */}
          {/* LAYER 6: SUBTLE OUTER ATMOSPHERIC GUIDE & SATELLITE NODES */}
          {/* =============================================================== */}
          <g style={{ opacity: outerLayersOpacity }}>
            {/* Outer fine perimeter guide ring (r = 142) */}
            <circle
              cx="160"
              cy="160"
              r="142"
              fill="none"
              stroke="rgba(56, 189, 248, 0.18)"
              strokeWidth="0.8"
            />

            {/* Segmented outer orbit ring with counter-clockwise rotation */}
            <g className="ai-rotate-outer-cw">
              <circle
                cx="160"
                cy="160"
                r="137"
                fill="none"
                stroke="url(#ai-outer-cyan-band)"
                strokeWidth="1.2"
                strokeDasharray="32 75 14 90 48 60 18 105"
                filter="url(#ai-glow-subtle)"
              />

              {/* Orbital satellite nodes on outer track */}
              <circle cx="297" cy="160" r="2.2" fill="#00F2FE" filter="drop-shadow(0 0 4px #00F2FE)" />
              <circle cx="23" cy="160" r="1.6" fill="#38BDF8" opacity="0.8" />
              <circle cx="160" cy="23" r="1.8" fill="#00F2FE" opacity="0.9" />
              <circle cx="257" cy="257" r="1.4" fill="#67E8F9" opacity="0.7" />
            </g>
          </g>

          {/* =============================================================== */}
          {/* LAYER 5: COUNTER-ROTATING SEGMENTED MECHANICAL TRACK (r = 117) */}
          {/* =============================================================== */}
          <g style={{ opacity: outerLayersOpacity }}>
            {/* Base concentric guide tracks */}
            <circle
              cx="160"
              cy="160"
              r="117"
              fill="none"
              stroke="rgba(15, 23, 42, 0.6)"
              strokeWidth="5"
            />
            <circle
              cx="160"
              cy="160"
              r="119.5"
              fill="none"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="0.6"
            />
            <circle
              cx="160"
              cy="160"
              r="114.5"
              fill="none"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="0.6"
            />

            {/* Mechanical radial notches */}
            <g>
              {mechanicalNotches.map((notch) => (
                <line
                  key={notch.id}
                  x1={notch.x1}
                  y1={notch.y1}
                  x2={notch.x2}
                  y2={notch.y2}
                  stroke={notch.isMajor ? "rgba(0, 242, 254, 0.55)" : "rgba(100, 116, 139, 0.4)"}
                  strokeWidth={notch.isMajor ? "1.2" : "0.8"}
                />
              ))}
            </g>

            {/* Counter-clockwise segmented energy arcs */}
            <g className="ai-rotate-mid-ccw">
              <circle
                cx="160"
                cy="160"
                r="117"
                fill="none"
                stroke="#00F2FE"
                strokeWidth="2.2"
                strokeDasharray="55 130 35 80"
                opacity={isThinking ? 0.9 : 0.65}
                filter="url(#ai-glow-subtle)"
              />
              <circle
                cx="160"
                cy="160"
                r="117"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.4"
                strokeDasharray="15 35 8 50"
                strokeDashoffset="70"
                opacity="0.7"
              />
            </g>
          </g>

          {/* =============================================================== */}
          {/* LAYER 4: PRIMARY GLOWING GLASS TORUS RING (r = 92) */}
          {/* =============================================================== */}
          <g>
            {/* Translucent cylindrical glass tube body */}
            <circle
              cx="160"
              cy="160"
              r="92"
              fill="none"
              stroke="rgba(14, 165, 233, 0.15)"
              strokeWidth="7"
            />
            <circle
              cx="160"
              cy="160"
              r="95.5"
              fill="none"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="0.8"
            />
            <circle
              cx="160"
              cy="160"
              r="88.5"
              fill="none"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="0.8"
            />

            {/* Specular Glass Highlight: Curved reflection on upper-left quadrant */}
            <path
              d="M 95 95 A 92 92 0 0 1 225 95"
              fill="none"
              stroke="url(#ai-specular-torus)"
              strokeWidth="3.2"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* Rotating luminous energetic segments */}
            <g className="ai-rotate-glass-cw">
              <circle
                cx="160"
                cy="160"
                r="92"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeDasharray="60 140 30 110"
                filter="drop-shadow(0 0 6px #00F2FE)"
                opacity={isThinking ? 1.0 : 0.8}
              />
              <circle
                cx="160"
                cy="160"
                r="92"
                fill="none"
                stroke="#00F2FE"
                strokeWidth="2.6"
                strokeDasharray="18 45 12 75"
                strokeDashoffset="120"
                opacity="0.9"
              />
            </g>
          </g>

          {/* =============================================================== */}
          {/* LAYER 3: THIN LUMINOUS CIRCUITS & FILAMENTS (r = 74) */}
          {/* =============================================================== */}
          <g>
            <circle
              cx="160"
              cy="160"
              r="74"
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="0.8"
            />
            <g className="ai-rotate-circuits-ccw">
              <circle
                cx="160"
                cy="160"
                r="74"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.2"
                strokeDasharray="14 28 8 28 42 28"
                opacity="0.75"
              />
              {/* Micro circuit sparks */}
              <circle cx="234" cy="160" r="1.5" fill="#FFFFFF" />
              <circle cx="86" cy="160" r="1.5" fill="#00F2FE" />
              <circle cx="160" cy="86" r="1.3" fill="#38BDF8" />
              <circle cx="160" cy="234" r="1.3" fill="#67E8F9" />
            </g>

            {/* Radial Inter-Layer Filament Connectors (Linking Layer 3 to Layer 2) */}
            <g opacity="0.4">
              <line x1="120" y1="120" x2="135" y2="135" stroke="#00F2FE" strokeWidth="0.8" />
              <line x1="200" y1="120" x2="185" y2="135" stroke="#00F2FE" strokeWidth="0.8" />
              <line x1="120" y1="200" x2="135" y2="185" stroke="#00F2FE" strokeWidth="0.8" />
              <line x1="200" y1="200" x2="185" y2="185" stroke="#00F2FE" strokeWidth="0.8" />
            </g>
          </g>

          {/* =============================================================== */}
          {/* LAYER 2: METALLIC HOUSING, CALIPER NODES & 16 IRIS TURBINE BLADES */}
          {/* =============================================================== */}
          <g>
            {/* Dark Metallic Collar Housing (r = 60) */}
            <circle
              cx="160"
              cy="160"
              r="60"
              fill="#080D1A"
              stroke="#1E293B"
              strokeWidth="2.5"
              filter="drop-shadow(0 0 10px rgba(0,0,0,0.8))"
            />
            <circle
              cx="160"
              cy="160"
              r="58"
              fill="none"
              stroke="rgba(0, 242, 254, 0.4)"
              strokeWidth="0.8"
            />

            {/* 16 Rotating Mechanical Iris Turbine Blades */}
            <g className="ai-rotate-turbine-cw">
              {irisBlades.map((blade) => (
                <path
                  key={blade.id}
                  d={blade.d}
                  fill="url(#ai-metal-blade)"
                  stroke="#334155"
                  strokeWidth="0.6"
                />
              ))}
              {/* Inner blade circular bezel */}
              <circle
                cx="160"
                cy="160"
                r="36"
                fill="none"
                stroke="rgba(0, 242, 254, 0.6)"
                strokeWidth="1.2"
              />
            </g>

            {/* 4 Cardinal Calipers / Fastener Brackets at 0°, 90°, 180°, 270° */}
            <g>
              {/* Top Caliper (160, 102) */}
              <rect x="156" y="99" width="8" height="6" rx="1.5" fill="url(#ai-caliper-metal)" stroke="#475569" strokeWidth="0.6" />
              <circle cx="160" cy="102" r="1.5" fill="#00F2FE" filter="drop-shadow(0 0 3px #00F2FE)" />

              {/* Bottom Caliper (160, 218) */}
              <rect x="156" y="215" width="8" height="6" rx="1.5" fill="url(#ai-caliper-metal)" stroke="#475569" strokeWidth="0.6" />
              <circle cx="160" cy="218" r="1.5" fill="#00F2FE" filter="drop-shadow(0 0 3px #00F2FE)" />

              {/* Left Caliper (102, 160) */}
              <rect x="99" y="156" width="6" height="8" rx="1.5" fill="url(#ai-caliper-metal)" stroke="#475569" strokeWidth="0.6" />
              <circle cx="102" cy="160" r="1.5" fill="#00F2FE" filter="drop-shadow(0 0 3px #00F2FE)" />

              {/* Right Caliper (218, 160) */}
              <rect x="215" y="156" width="6" height="8" rx="1.5" fill="url(#ai-caliper-metal)" stroke="#475569" strokeWidth="0.6" />
              <circle cx="218" cy="160" r="1.5" fill="#00F2FE" filter="drop-shadow(0 0 3px #00F2FE)" />
            </g>
          </g>

          {/* =============================================================== */}
          {/* LAYER 1: AMBER TURBINE REACTOR & OBSIDIAN CHAMBER (r = 34) */}
          {/* =============================================================== */}
          <g>
            {/* Deep Obsidian Glass Chamber Aperture */}
            <circle
              cx="160"
              cy="160"
              r="34"
              fill="#03050B"
              stroke="#00F2FE"
              strokeWidth="0.8"
              strokeOpacity="0.6"
            />

            {/* Amber Radial Turbine Teeth (Warm energy ring from Reference 2) */}
            <g className="ai-rotate-amber-ccw">
              {amberTeeth.map((tooth) => (
                <line
                  key={tooth.id}
                  x1={tooth.x1}
                  y1={tooth.y1}
                  x2={tooth.x2}
                  y2={tooth.y2}
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity={isThinking ? 0.95 : 0.8}
                />
              ))}
              {/* Inner amber containment ring */}
              <circle
                cx="160"
                cy="160"
                r="21"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.4"
                strokeDasharray="6 3"
                opacity="0.85"
                filter="url(#ai-glow-subtle)"
              />
            </g>
          </g>

          {/* =============================================================== */}
          {/* CENTER: MULTI-SPECTRAL ENERGY NUCLEUS (r = 14) */}
          {/* =============================================================== */}
          <g className={cn("ai-pulse-center", isThinking && "ai-thinking-mode")}>
            {/* Outer Plasma Glow Corona */}
            <circle
              cx="160"
              cy="160"
              r="17"
              fill="url(#ai-core-cyan-glow)"
              opacity="0.8"
            />

            {/* Main Multi-Spectral Energy Nucleus */}
            <circle
              cx="160"
              cy="160"
              r="12"
              fill="url(#ai-core-nucleus)"
              filter="url(#ai-glow-nucleus)"
            />

            {/* Pinpoint Ultra-Bright Energy Singularity Center */}
            <circle
              cx="160"
              cy="160"
              r="3.5"
              fill="#FFFFFF"
              filter="drop-shadow(0 0 6px #FFFFFF)"
            />
          </g>

          {/* =============================================================== */}
          {/* ORBITING QUANTUM PARTICLES (8-16 constrained particles) */}
          {/* =============================================================== */}
          {/* Inner orbit particles (r = 48) */}
          <g className="ai-particles-inner-cw" opacity={isForming ? 0 : 0.85}>
            <circle cx="208" cy="160" r="1.3" fill="#67E8F9" />
            <circle cx="136" cy="118" r="1.1" fill="#38BDF8" />
            <circle cx="136" cy="202" r="1.2" fill="#00F2FE" />
          </g>

          {/* Middle orbit particles (r = 83) - includes 1 brighter particle */}
          <g className="ai-particles-mid-ccw" opacity={isForming ? 0 : 0.9}>
            {/* Bright highlight particle */}
            <circle cx="219" cy="219" r="2.0" fill="#FFFFFF" filter="drop-shadow(0 0 5px #00F2FE)" />
            <circle cx="101" cy="101" r="1.3" fill="#38BDF8" opacity="0.8" />
            <circle cx="219" cy="101" r="1.2" fill="#67E8F9" opacity="0.75" />
            <circle cx="101" cy="219" r="1.4" fill="#00F2FE" opacity="0.85" />
          </g>

          {/* Outer orbit particles (r = 127) - includes 1 brighter particle */}
          <g className="ai-particles-outer-cw" style={{ opacity: outerLayersOpacity }}>
            {/* Bright highlight particle */}
            <circle cx="279" cy="203" r="1.8" fill="#00F2FE" filter="drop-shadow(0 0 4px #00F2FE)" />
            <circle cx="41" cy="117" r="1.2" fill="#38BDF8" opacity="0.8" />
            <circle cx="160" cy="33" r="1.3" fill="#67E8F9" opacity="0.75" />
            <circle cx="70" cy="235" r="1.1" fill="#38BDF8" opacity="0.7" />
            <circle cx="250" cy="85" r="1.2" fill="#00F2FE" opacity="0.8" />
          </g>

          {/* =============================================================== */}
          {/* DYNAMIC EXPANDING HARMONIC SHOCKWAVE PULSE (Seconds 3.5 - 4.5) */}
          {/* =============================================================== */}
          {isPulsing && (
            <circle
              cx="160"
              cy="160"
              r={15 + pulseWaveProgress * 135}
              fill="none"
              stroke="#00F2FE"
              strokeWidth={Math.max(0.5, 2.5 * (1 - pulseWaveProgress))}
              opacity={Math.max(0, 0.85 * (1 - pulseWaveProgress))}
              filter="url(#ai-glow-subtle)"
            />
          )}

        </g>
      </svg>
    </div>
  );
};
