import React from 'react';
import { OrionIconArtworkProps } from '../OrionIconTheme';
import { OrionSquircleBase, useOrionIconDetail, useOrionIconIds } from '../OrionSquircleBase';

// 31. World Model (Dimensional Orbiting Terrestrial Simulation Sphere)
export const IconWorldModel: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('wm');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-world-model" from="#0E7490" to="#083344" accent="#06B6D4" {...props}>
      <defs>
        <radialGradient id={`${id}-globe`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="55%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#042F2E" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="32" fill={`url(#${id}-globe)`} stroke="#A5F3FC" strokeWidth="1.6" />
      <ellipse cx="64" cy="64" rx="15" ry="32" stroke="#CFFAFE" strokeOpacity="0.65" strokeWidth="1.6" fill="none" />
      <ellipse cx="64" cy="64" rx="32" ry="12" stroke="#CFFAFE" strokeOpacity="0.65" strokeWidth="1.6" fill="none" />
      {/* Tilted atmospheric orbital scanner ring */}
      <ellipse cx="64" cy="64" rx="44" ry="14" transform="rotate(-22 64 64)" stroke="#FFFFFF" strokeOpacity="0.82" strokeWidth="2.2" fill="none" />
      {!isMicro && <circle cx="96" cy="51" r="4" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.2" />}
    </OrionSquircleBase>
  );
};

// 32. Orion AI (Faceted Celestial Diamond Star Prism)
export const IconOrionAi: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('orion-ai');
  return (
    <OrionSquircleBase gradientId="icon-orion-ai" from="#7E22CE" to="#3B0764" accent="#A855F7" {...props}>
      <defs>
        <linearGradient id={`${id}-starA`} x1="28" y1="24" x2="100" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      {/* Subtle orbital intelligence halo */}
      <circle cx="64" cy="64" r="34" stroke="#C084FC" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
      {/* Layered celestial diamond facets */}
      <path d="M 64 20 C 66 46 82 62 108 64 C 82 66 66 82 64 108 C 62 82 46 66 20 64 C 46 62 62 46 64 20 Z" fill={`url(#${id}-starA)`} />
      {/* Cut crystal center facet */}
      <polygon points="64,46 82,64 64,82 46,64" fill="#6D28D9" stroke="#FFFFFF" strokeWidth="1.4" />
      <circle cx="64" cy="64" r="5" fill="#00F2FE" />
      {/* Secondary companion spark */}
      <path d="M 92 26 C 92 33 96 36 102 36 C 96 36 92 39 92 46 C 92 39 88 36 82 36 C 88 36 92 33 92 26 Z" fill="#FDE047" />
    </OrionSquircleBase>
  );
};

// 33. Predictions (Glass Forecast Trajectory Panel & Horizon Cone)
export const IconPredictions: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('pred');
  return (
    <OrionSquircleBase gradientId="icon-predictions" from="#8B5CF6" to="#4C1D95" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-cone`} x1="68" y1="30" x2="102" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.10" />
        </linearGradient>
      </defs>
      {/* Frosted slate backdrop */}
      <rect x="22" y="26" width="84" height="76" rx="12" fill="#1E1B4B" fillOpacity="0.55" stroke="#DDD6FE" strokeOpacity="0.35" strokeWidth="1.3" />
      {/* Confidence fan */}
      <polygon points="68,66 100,32 100,66" fill={`url(#${id}-cone)`} />
      {/* Historical trajectory & forecast ray */}
      <path d="M 30 82 L 48 64 L 68 68 L 94 40" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="48" cy="64" r="4.5" fill="#DDD6FE" />
      <circle cx="94" cy="40" r="6" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.8" />
    </OrionSquircleBase>
  );
};

// 34. Demand Forecasting (Layered Seasonal Sine Telemetry Ribbon)
export const IconDemandForecasting: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dem-fc');
  return (
    <OrionSquircleBase gradientId="icon-demand-fc" from="#9333EA" to="#581C87" accent="#A855F7" {...props}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="64" y1="32" x2="64" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0ABFC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#581C87" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d="M 22 86 Q 44 26 64 60 T 106 34 L 106 94 L 22 94 Z" fill={`url(#${id}-fill)`} />
      <path d="M 22 86 Q 44 26 64 60 T 106 34" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <line x1="22" y1="94" x2="106" y2="94" stroke="#E9D5FF" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="46" cy="44" r="5" fill="#FDE047" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="94" cy="44" r="5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
    </OrionSquircleBase>
  );
};

// 35. Inventory Optimization (Buffer Columns & Optimal Gold Curve)
export const IconInventoryOptimization: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('inv-opt');
  return (
    <OrionSquircleBase gradientId="icon-inv-opt" from="#0D9488" to="#115E59" accent="#14B8A6" {...props}>
      <defs>
        <linearGradient id={`${id}-col`} x1="0" y1="30" x2="0" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#5EEAD4" />
        </linearGradient>
      </defs>
      <rect x="28" y="64" width="18" height="32" rx="4" fill={`url(#${id}-col)`} fillOpacity="0.72" />
      <rect x="55" y="46" width="18" height="50" rx="4" fill={`url(#${id}-col)`} fillOpacity="0.88" />
      <rect x="82" y="34" width="18" height="62" rx="4" fill={`url(#${id}-col)`} />
      <path d="M 24 52 C 44 46 68 42 104 24" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="64" cy="41" r="5" fill="#FDE047" stroke="#134E4A" strokeWidth="1.5" />
    </OrionSquircleBase>
  );
};

// 36. Scenarios (Prismatic Decision Branch Fork & Capsules)
export const IconScenarios: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('scen');
  return (
    <OrionSquircleBase gradientId="icon-scenarios" from="#0284C7" to="#0369A1" accent="#0EA5E9" {...props}>
      <defs>
        <linearGradient id={`${id}-pill`} x1="0" y1="30" x2="0" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <path d="M 38 64 L 58 64 Q 68 64 76 38 L 90 38" stroke="#E0F2FE" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 38 64 L 90 64" stroke="#E0F2FE" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 38 64 L 58 64 Q 68 64 76 90 L 90 90" stroke="#7DD3FC" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="64" r="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
      <rect x="84" y="30" width="18" height="16" rx="8" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.8" />
      <rect x="84" y="56" width="18" height="16" rx="8" fill={`url(#${id}-pill)`} stroke="#FFFFFF" strokeWidth="1.8" />
      <rect x="84" y="82" width="18" height="16" rx="8" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.8" />
    </OrionSquircleBase>
  );
};

// 37. Digital Twin (Coordinated Solid & Wireframe Isometric Models)
export const IconDigitalTwin: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dtwin');
  return (
    <OrionSquircleBase gradientId="icon-digital-twin" from="#0891B2" to="#155E75" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-solid`} x1="24" y1="36" x2="64" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
      </defs>
      {/* Left solid physical cube */}
      <g transform="translate(44, 64)">
        <polygon points="0,-24 20,-12 0,0 -20,-12" fill={`url(#${id}-solid)`} />
        <polygon points="-20,-12 0,0 0,24 -20,12" fill="#0E7490" stroke="#A5F3FC" strokeWidth="1" />
        <polygon points="0,0 20,-12 20,12 0,24" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="1" />
      </g>
      {/* Right holographic digital wireframe cube */}
      <g transform="translate(84, 64)">
        <polygon points="0,-24 20,-12 0,0 -20,-12" fill="#67E8F9" fillOpacity="0.18" stroke="#FFFFFF" strokeWidth="1.8" strokeDasharray="3 2" />
        <polygon points="-20,-12 0,0 0,24 -20,12" fill="none" stroke="#67E8F9" strokeWidth="1.8" strokeDasharray="3 2" />
        <polygon points="0,0 20,-12 20,12 0,24" fill="none" stroke="#A5F3FC" strokeWidth="1.8" strokeDasharray="3 2" />
      </g>
      {/* Sync bridge beam */}
      <line x1="58" y1="64" x2="70" y2="64" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 38. Risk Radar (Circular Polar Radar Scope & Warning Blip)
export const IconRiskRadar: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('radar');
  return (
    <OrionSquircleBase gradientId="icon-risk-radar" from="#B91C1C" to="#450A0A" accent="#EF4444" {...props}>
      <defs>
        <linearGradient id={`${id}-sweep`} x1="64" y1="64" x2="96" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="36" fill="#280505" stroke="#FCA5A5" strokeOpacity="0.45" strokeWidth="2" />
      <circle cx="64" cy="64" r="24" stroke="#F87171" strokeOpacity="0.65" strokeWidth="1.5" fill="none" />
      <circle cx="64" cy="64" r="12" stroke="#FCA5A5" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
      {/* Active swept quadrant */}
      <path d="M 64 64 L 64 28 A 36 36 0 0 1 97 50 Z" fill={`url(#${id}-sweep)`} />
      <line x1="64" y1="64" x2="88" y2="42" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="84" cy="46" r="5.5" fill="#FDE047" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="64" cy="64" r="4.5" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 39. Orion Memory (Gold-Pinned Silicone Neural Memory Wafer)
export const IconMemory: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('mem');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-memory" from="#6D28D9" to="#2E1065" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-die`} x1="30" y1="30" x2="98" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
      </defs>
      {/* Gold substrate IC pins */}
      {!isMicro && [46, 58, 70, 82].map((p) => (
        <React.Fragment key={p}>
          <rect x={p - 2} y="22" width="4" height="8" rx="1.5" fill="#FBBF24" />
          <rect x={p - 2} y="98" width="4" height="8" rx="1.5" fill="#FBBF24" />
          <rect x="22" y={p - 2} width="8" height="4" rx="1.5" fill="#FBBF24" />
          <rect x="98" y={p - 2} width="8" height="4" rx="1.5" fill="#FBBF24" />
        </React.Fragment>
      ))}
      <rect x="30" y="30" width="68" height="68" rx="12" fill={`url(#${id}-die)`} stroke="#C4B5FD" strokeWidth="2" />
      <rect x="40" y="40" width="20" height="20" rx="5" fill="#DDD6FE" />
      <rect x="68" y="40" width="20" height="20" rx="5" fill="#A78BFA" />
      <rect x="40" y="68" width="20" height="20" rx="5" fill="#A78BFA" />
      <rect x="68" y="68" width="20" height="20" rx="5" fill="#38BDF8" />
    </OrionSquircleBase>
  );
};

// 40. Deep Intelligence (Multi-Faceted Optical Prism Core)
export const IconIntelligenceCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('int-ctr');
  return (
    <OrionSquircleBase gradientId="icon-intel-center" from="#581C87" to="#1E1B4B" accent="#A855F7" {...props}>
      <defs>
        <linearGradient id={`${id}-facetL`} x1="34" y1="24" x2="64" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="34" stroke="#E9D5FF" strokeOpacity="0.28" strokeWidth="1.5" fill="none" />
      {/* Refracted diamond prism */}
      <polygon points="64,22 94,64 64,106 34,64" fill="#7E22CE" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
      <polygon points="64,22 64,106 34,64" fill={`url(#${id}-facetL)`} fillOpacity="0.88" />
      <circle cx="64" cy="64" r="8" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 41. Signal Language (Acoustic Oscilloscope Glass & Frequency Bars)
export const IconSignalLanguage: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('sig-l');
  return (
    <OrionSquircleBase gradientId="icon-signal-lang" from="#7C3AED" to="#3B0764" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-wave`} x1="24" y1="64" x2="104" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0ABFC" />
        </linearGradient>
      </defs>
      <rect x="22" y="34" width="84" height="60" rx="12" fill="#1E1B4B" fillOpacity="0.65" stroke="#DDD6FE" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M 28 64 Q 38 38 48 64 T 68 64 T 88 64 T 100 64" stroke={`url(#${id}-wave)`} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="64" r="4" fill="#38BDF8" />
      <circle cx="80" cy="64" r="4" fill="#FDE047" />
    </OrionSquircleBase>
  );
};

// 42. Network Intelligence (Isometric Mesh Hexagon & Glowing Router Jewel)
export const IconNetworkIntelligence: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('net-i');
  return (
    <OrionSquircleBase gradientId="icon-net-intel" from="#4338CA" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-edge`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <polygon points="64,26 96,45 96,83 64,102 32,83 32,45" stroke={`url(#${id}-edge)`} strokeWidth="3" fill="#1E1B4B" fillOpacity="0.45" strokeLinejoin="round" />
      <line x1="64" y1="26" x2="64" y2="102" stroke="#818CF8" strokeWidth="2" />
      <line x1="32" y1="45" x2="96" y2="83" stroke="#818CF8" strokeWidth="2" />
      <line x1="96" y1="45" x2="32" y2="83" stroke="#818CF8" strokeWidth="2" />
      <circle cx="64" cy="26" r="5" fill="#FFFFFF" />
      <circle cx="96" cy="45" r="5" fill="#38BDF8" />
      <circle cx="96" cy="83" r="5" fill="#FFFFFF" />
      <circle cx="64" cy="102" r="5" fill="#38BDF8" />
      <circle cx="32" cy="83" r="5" fill="#FFFFFF" />
      <circle cx="32" cy="45" r="5" fill="#38BDF8" />
      <circle cx="64" cy="64" r="10" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 43. Decision Science (Stepped Pareto Matrix & Golden Sigma Arc)
export const IconDecisionScience: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dec-sci');
  return (
    <OrionSquircleBase gradientId="icon-dec-sci" from="#B45309" to="#451A03" accent="#F59E0B" {...props}>
      <defs>
        <linearGradient id={`${id}-card`} x1="26" y1="26" x2="102" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect x="24" y="24" width="80" height="80" rx="14" fill="#271204" fillOpacity="0.6" stroke="#FDE68A" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M 80 38 L 46 38 L 68 64 L 46 90 L 80 90" stroke={`url(#${id}-card)`} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="80" cy="38" r="5" fill="#FFFFFF" />
      <circle cx="80" cy="90" r="5" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 44. Event Fabric (Interlocking Fiber-Optic Stream Matrix)
export const IconEventFabric: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('ev-fab');
  return (
    <OrionSquircleBase gradientId="icon-event-fabric" from="#0284C7" to="#082F49" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-s1`} x1="24" y1="36" x2="104" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#00F2FE" />
        </linearGradient>
      </defs>
      <path d="M 24 44 C 46 44 50 84 74 84 L 104 84" stroke={`url(#${id}-s1)`} strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <path d="M 24 84 C 48 84 50 44 74 44 L 104 44" stroke="#38BDF8" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <circle cx="64" cy="64" r="11" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2.4" />
      <circle cx="28" cy="44" r="5" fill="#FFFFFF" />
      <circle cx="100" cy="44" r="5" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 45. Causal Engine (Bayesian Root-to-Effect Directed Graph)
export const IconCausalIntelligence: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('caus');
  return (
    <OrionSquircleBase gradientId="icon-causal" from="#0D9488" to="#042F2E" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-node`} x1="26" y1="32" x2="102" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#99F6E4" />
        </linearGradient>
      </defs>
      <path d="M 38 40 L 82 64 L 38 88" stroke="#5EEAD4" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="38" y1="40" x2="38" y2="88" stroke="#2DD4BF" strokeOpacity="0.45" strokeWidth="2.5" strokeDasharray="4 4" />
      <circle cx="38" cy="40" r="10.5" fill={`url(#${id}-node)`} stroke="#042F2E" strokeWidth="2" />
      <circle cx="38" cy="88" r="10.5" fill="#2DD4BF" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="88" cy="64" r="13" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2.4" />
    </OrionSquircleBase>
  );
};

// 46. Counterfactual (Vertical Mirror Split Timeline)
export const IconCounterfactual: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('cntf');
  return (
    <OrionSquircleBase gradientId="icon-counterfactual" from="#1D4ED8" to="#172554" accent="#3B82F6" {...props}>
      <defs>
        <linearGradient id={`${id}-mirror`} x1="64" y1="22" x2="64" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Vertical counterfactual splitter beam */}
      <line x1="64" y1="22" x2="64" y2="106" stroke={`url(#${id}-mirror)`} strokeWidth="3.2" strokeDasharray="5 4" />
      {/* Left actual crystal path */}
      <path d="M 28 84 Q 44 42 58 64" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="28" cy="84" r="6" fill="#FFFFFF" />
      {/* Right alternate reality amber arc */}
      <path d="M 70 64 Q 84 88 100 44" stroke="#FBBF24" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="44" r="7" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.8" />
    </OrionSquircleBase>
  );
};

// 47. Economics (Sculpted Gold Equilibrium Intersecting Curves)
export const IconDecisionEconomics: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dec-ec');
  return (
    <OrionSquircleBase gradientId="icon-dec-econ" from="#15803D" to="#052E16" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-coin`} x1="34" y1="34" x2="94" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="32" fill="#064E3B" stroke="#6EE7B7" strokeOpacity="0.5" strokeWidth="1.8" />
      <path d="M 38 86 Q 60 54 90 38" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M 38 42 Q 62 72 90 86" stroke="#34D399" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="64" cy="64" r="8" fill={`url(#${id}-coin)`} stroke="#FFFFFF" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 48. Information Gaps (Precision Optical Loupe Scanning Perforated Matrix)
export const IconInformationGaps: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('inf-g');
  return (
    <OrionSquircleBase gradientId="icon-info-gaps" from="#BE185D" to="#500724" accent="#EC4899" {...props}>
      <defs>
        <linearGradient id={`${id}-rim`} x1="28" y1="28" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FBCFE8" />
        </linearGradient>
      </defs>
      {/* Matrix tile grid with one dashed gap */}
      <rect x="28" y="34" width="20" height="20" rx="5" fill="#F472B6" />
      <rect x="54" y="34" width="20" height="20" rx="5" fill="#FFFFFF" />
      <rect x="28" y="60" width="20" height="20" rx="5" fill="#FFFFFF" />
      <rect x="54" y="60" width="20" height="20" rx="5" stroke="#FDE047" strokeWidth="2.5" strokeDasharray="4 3" fill="#500724" />
      {/* Magnifying glass handle & beveled lens ring */}
      <line x1="78" y1="78" x2="100" y2="100" stroke="#FBCFE8" strokeWidth="7" strokeLinecap="round" />
      <circle cx="64" cy="64" r="22" stroke={`url(#${id}-rim)`} strokeWidth="4" fill="#FFFFFF" fillOpacity="0.08" />
    </OrionSquircleBase>
  );
};

// 49. Outcomes (Precision Emerald Bullseye Target & Gold Fletched Arrow)
export const IconOutcomes: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('outc');
  return (
    <OrionSquircleBase gradientId="icon-outcomes" from="#047857" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-ring`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="34" fill="#065F46" stroke={`url(#${id}-ring)`} strokeWidth="4" />
      <circle cx="64" cy="64" r="22" fill="#047857" stroke="#6EE7B7" strokeWidth="3.5" />
      <circle cx="64" cy="64" r="10" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
      {/* Arrow shaft embedded into center */}
      <line x1="64" y1="64" x2="98" y2="30" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="98,30 100,20 90,22" fill="#FDE047" />
    </OrionSquircleBase>
  );
};

// 50. Decision Replay (Scrubbing Rewind Cassette Deck & Reels)
export const IconDecisionReplay: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('replay');
  return (
    <OrionSquircleBase gradientId="icon-dec-replay" from="#6D28D9" to="#2E1065" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-body`} x1="22" y1="34" x2="106" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      <rect x="22" y="34" width="84" height="60" rx="12" fill={`url(#${id}-body)`} />
      <rect x="30" y="42" width="68" height="32" rx="6" fill="#2E1065" />
      {/* Twin precision tape reels */}
      <circle cx="46" cy="58" r="10" fill="#A78BFA" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="46" cy="58" r="3.5" fill="#2E1065" />
      <circle cx="82" cy="58" r="10" fill="#A78BFA" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="82" cy="58" r="3.5" fill="#2E1065" />
      {/* Center rewind chevrons */}
      <polygon points="65,58 72,52 72,64" fill="#FDE047" />
      <polygon points="57,58 64,52 64,64" fill="#FDE047" />
      <rect x="38" y="80" width="52" height="7" rx="3.5" fill="#4C1D95" />
    </OrionSquircleBase>
  );
};

// 51. Time Machine (Chrome Chronometer & Rewind Orbital Ring)
export const IconTimeMachine: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('tm');
  return (
    <OrionSquircleBase gradientId="icon-time-mach" from="#0369A1" to="#082F49" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-face`} x1="36" y1="36" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
      <path d="M 32 42 A 38 38 0 1 1 28 74" stroke="#00F2FE" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <polygon points="24,46 37,33 41,49" fill="#00F2FE" />
      <circle cx="64" cy="64" r="24" fill={`url(#${id}-face)`} stroke="#38BDF8" strokeWidth="2" />
      <path d="M 64 49 L 64 64 L 76 70" stroke="#082F49" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="64" cy="64" r="3.5" fill="#0284C7" />
    </OrionSquircleBase>
  );
};

// 52. Decision DNA (Volumetric Double Helix Strand)
export const IconDecisionDna: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dna');
  return (
    <OrionSquircleBase gradientId="icon-dec-dna" from="#4338CA" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-sA`} x1="40" y1="24" x2="88" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      {/* Cross rungs */}
      <line x1="42" y1="36" x2="86" y2="36" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="48" y1="50" x2="80" y2="50" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="48" y1="78" x2="80" y2="78" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="42" y1="92" x2="86" y2="92" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      {/* Intertwined helical rails */}
      <path d="M 40 24 C 40 48 88 80 88 104" stroke={`url(#${id}-sA)`} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <path d="M 88 24 C 88 48 40 80 40 104" stroke="#38BDF8" strokeWidth="5.5" strokeLinecap="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 53. Human-AI Teaming (Warm Amber & Luminous Cyan Dual Profiles)
export const IconHumanAi: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('hai');
  return (
    <OrionSquircleBase gradientId="icon-human-ai" from="#D97706" to="#78350F" accent="#F59E0B" {...props}>
      <defs>
        <linearGradient id={`${id}-h`} x1="24" y1="36" x2="64" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
      </defs>
      {/* Collaborative harmony arc */}
      <path d="M 38 38 Q 64 20 90 38" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Human form silhouette */}
      <circle cx="44" cy="48" r="10.5" fill={`url(#${id}-h)`} />
      <path d="M 24 88 C 24 72 32 66 44 66 C 56 66 64 72 64 88 Z" fill={`url(#${id}-h)`} />
      {/* AI geometric faceted core silhouette */}
      <polygon points="84,36 96,48 84,60 72,48" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.6" />
      <path d="M 66 88 C 66 72 74 66 84 66 C 96 66 104 72 104 88 Z" fill="#0EA5E9" stroke="#E0F2FE" strokeWidth="1.4" />
    </OrionSquircleBase>
  );
};

// 54. Quiet Risk (Sonar Surface Horizon & Submerged Anomaly Pulse)
export const IconQuietRisk: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('qrisk');
  return (
    <OrionSquircleBase gradientId="icon-quiet-risk" from="#C2410C" to="#431407" accent="#F97316" {...props}>
      <defs>
        <radialGradient id={`${id}-sub`} cx="50%" cy="68%" r="45%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Calm horizon baseline */}
      <line x1="22" y1="52" x2="106" y2="52" stroke="#FED7AA" strokeWidth="3.5" strokeLinecap="round" />
      {/* Submerged sonar pulse rings */}
      <circle cx="64" cy="74" r="24" fill={`url(#${id}-sub)`} fillOpacity="0.45" />
      <circle cx="64" cy="74" r="22" stroke="#FDBA74" strokeOpacity="0.45" strokeWidth="2" fill="none" />
      <circle cx="64" cy="74" r="13" stroke="#FDE047" strokeWidth="2.4" fill="none" />
      <circle cx="64" cy="74" r="5" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 55. Workflow Monitor (Dual-Pane Process Frame & Active Telemetry Beat)
export const IconWorkflowMonitor: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('wfmon');
  return (
    <OrionSquircleBase gradientId="icon-wf-mon" from="#0284C7" to="#075985" accent="#0EA5E9" {...props}>
      <defs>
        <linearGradient id={`${id}-pane`} x1="22" y1="28" x2="106" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#082F49" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect x="20" y="28" width="88" height="72" rx="12" fill="#FFFFFF" fillOpacity="0.18" stroke="#BAE6FD" strokeWidth="1.4" />
      <rect x="24" y="32" width="80" height="64" rx="9" fill={`url(#${id}-pane)`} />
      <path d="M 30 66 L 44 66 L 52 46 L 64 82 L 74 52 L 82 66 L 98 66" stroke="#34D399" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="34" cy="41" r="3" fill="#34D399" />
      <circle cx="44" cy="41" r="3" fill="#38BDF8" />
    </OrionSquircleBase>
  );
};

// 56. Digital Twin Center (Blueprint Wireframe Cube on Spatial Grid)
export const IconDigitalTwinCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dt-ctr');
  return (
    <OrionSquircleBase gradientId="icon-dt-center" from="#0891B2" to="#164E63" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-top`} x1="36" y1="26" x2="92" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
      </defs>
      {/* Blueprint spatial floor */}
      <ellipse cx="64" cy="96" rx="38" ry="8" fill="#083344" stroke="#22D3EE" strokeOpacity="0.55" strokeWidth="1.4" />
      {/* Holographic isometric structure */}
      <polygon points="64,24 94,41 64,58 34,41" fill={`url(#${id}-top)`} stroke="#FFFFFF" strokeWidth="1.4" />
      <polygon points="34,41 64,58 64,92 34,75" fill="#0E7490" stroke="#67E8F9" strokeWidth="1.4" />
      <polygon points="64,58 94,41 94,75 64,92" fill="#06B6D4" fillOpacity="0.72" stroke="#FFFFFF" strokeWidth="1.4" />
      <circle cx="64" cy="58" r="5" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.5" />
    </OrionSquircleBase>
  );
};

// 57. Scenario Lab (Borosilicate Conical Flask & Glowing Bubbles)
export const IconScenarioLab: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('sc-lab');
  return (
    <OrionSquircleBase gradientId="icon-scen-lab" from="#4F46E5" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-liq`} x1="32" y1="62" x2="96" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Glass flask silhouette */}
      <path d="M 52 24 L 76 24 M 55 24 L 55 48 L 28 92 C 26 96 29 102 35 102 L 93 102 C 99 102 102 96 100 92 L 73 48 L 73 24" stroke="#E0E7FF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF" fillOpacity="0.10" />
      {/* Luminous reagent liquid inside */}
      <path d="M 41 70 L 87 70 L 97 91 C 98 95 95 99 90 99 L 38 99 C 33 99 30 95 31 91 Z" fill={`url(#${id}-liq)`} />
      <circle cx="56" cy="84" r="4.5" fill="#FFFFFF" fillOpacity="0.85" />
      <circle cx="72" cy="78" r="3.5" fill="#FDE047" />
      <circle cx="64" cy="38" r="3.5" fill="#A5B4FC" />
    </OrionSquircleBase>
  );
};

// 58. Scenario Results (Winning Podium Columns & Gold Star Emblem)
export const IconScenarioResult: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('sc-res');
  return (
    <OrionSquircleBase gradientId="icon-scen-res" from="#4338CA" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-p1`} x1="54" y1="42" x2="74" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>
      </defs>
      <rect x="26" y="64" width="22" height="34" rx="5" fill="#6366F1" stroke="#C7D2FE" strokeWidth="1.2" />
      <rect x="53" y="42" width="22" height="56" rx="5" fill={`url(#${id}-p1)`} />
      <rect x="80" y="54" width="22" height="44" rx="5" fill="#818CF8" stroke="#E0E7FF" strokeWidth="1.2" />
      {/* Gold star trophy above center column */}
      <polygon points="64,19 67.5,27 76,28 69.5,33.5 71,42 64,37.5 57,42 58.5,33.5 52,28 60.5,27" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1.2" strokeLinejoin="round" />
    </OrionSquircleBase>
  );
};

// 59. Learning Center (Opened Luminous Tome & Knowledge Arc)
export const IconLearningCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('learn');
  return (
    <OrionSquircleBase gradientId="icon-learning" from="#7E22CE" to="#3B0764" accent="#A855F7" {...props}>
      <defs>
        <linearGradient id={`${id}-pageL`} x1="24" y1="38" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>
      {/* Left & right open pages */}
      <path d="M 64 44 C 50 34 32 34 22 40 L 22 92 C 34 86 50 86 64 96 Z" fill={`url(#${id}-pageL)`} />
      <path d="M 64 44 C 78 34 96 34 106 40 L 106 92 C 94 86 78 86 64 96 Z" fill="#F3E8FF" />
      <line x1="64" y1="44" x2="64" y2="96" stroke="#6D28D9" strokeWidth="2.5" />
      {/* Rising insight orb */}
      <circle cx="64" cy="27" r="6" fill="#FDE047" stroke="#FFFFFF" strokeWidth="1.5" />
    </OrionSquircleBase>
  );
};

// 60. Drift Center (Gyroscope Calibration Level & Tilted Needle)
export const IconDriftCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('drift');
  return (
    <OrionSquircleBase gradientId="icon-drift" from="#9333EA" to="#3B0764" accent="#A855F7" {...props}>
      <defs>
        <linearGradient id={`${id}-ring`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D8B4FE" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="33" fill="#2E1065" stroke={`url(#${id}-ring)`} strokeWidth="3.5" />
      <line x1="30" y1="64" x2="98" y2="64" stroke="#A855F7" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="4 3" />
      {/* Tilted horizon drift plane */}
      <line x1="34" y1="74" x2="94" y2="54" stroke="#F472B6" strokeWidth="5" strokeLinecap="round" />
      <circle cx="64" cy="64" r="7" fill="#FFFFFF" stroke="#9333EA" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 61. Network Design (Architectural Drafting Blueprint & Divider Triangle)
export const IconNetworkDesign: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('net-des');
  return (
    <OrionSquircleBase gradientId="icon-net-design" from="#4F46E5" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-sheet`} x1="24" y1="26" x2="104" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
      </defs>
      <rect x="22" y="26" width="84" height="76" rx="10" fill={`url(#${id}-sheet)`} stroke="#A5B4FC" strokeWidth="2" />
      {/* Geometric network triangle */}
      <polygon points="64,36 94,86 34,86" stroke="#38BDF8" strokeWidth="3" fill="#38BDF8" fillOpacity="0.14" strokeLinejoin="round" />
      <circle cx="64" cy="36" r="6" fill="#FFFFFF" />
      <circle cx="94" cy="86" r="6" fill="#FBBF24" />
      <circle cx="34" cy="86" r="6" fill="#34D399" />
    </OrionSquircleBase>
  );
};

// 62. Sustainability & ESG (Glossy Botanical Leaf & Solar Circuit Vein)
export const IconSustainability: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('esg');
  return (
    <OrionSquircleBase gradientId="icon-sustainability" from="#15803D" to="#052E16" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-leaf`} x1="28" y1="26" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="55%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Sculpted glossy leaf silhouette */}
      <path d="M 96 28 C 60 28 32 48 32 82 C 32 90 38 96 46 96 C 80 96 100 68 96 28 Z" fill={`url(#${id}-leaf)`} stroke="#ECFDF5" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Stem & delicate veined circuit */}
      <path d="M 28 98 C 46 80 68 58 88 38" stroke="#064E3B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 52 74 L 52 56 M 66 60 L 80 60" stroke="#ECFDF5" strokeWidth="2.2" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};
