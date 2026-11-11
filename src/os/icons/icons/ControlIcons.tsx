import React from 'react';
import { OrionIconArtworkProps } from '../OrionIconTheme';
import { OrionSquircleBase, useOrionIconDetail, useOrionIconIds } from '../OrionSquircleBase';

// 63. Exceptions (Beveled Anodized Alert Hazard Instrument)
export const IconExceptions: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('exc');
  return (
    <OrionSquircleBase gradientId="icon-exceptions" from="#DC2626" to="#7F1D1D" accent="#EF4444" {...props}>
      <defs>
        <linearGradient id={`${id}-tri`} x1="64" y1="22" x2="64" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Cast ground shadow */}
      <polygon points="64,25 106,96 22,96" fill="#000000" fillOpacity="0.28" transform="translate(0, 3)" />
      <path d="M 64 22 C 67.5 22 70.5 24 72.5 28 L 103 84 C 105.5 88.5 102.5 94 97 94 L 31 94 C 25.5 94 22.5 88.5 25 84 L 55.5 28 C 57.5 24 60.5 22 64 22 Z" fill={`url(#${id}-tri)`} stroke="#FEF3C7" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="64" y1="44" x2="64" y2="68" stroke="#1E293B" strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="64" cy="80" r="4.2" fill="#1E293B" />
    </OrionSquircleBase>
  );
};

// 64. Approval Center (Official Executive Certification Seal & Ribbons)
export const IconApprovalCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('appr');
  return (
    <OrionSquircleBase gradientId="icon-approvals" from="#0284C7" to="#082F49" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-seal`} x1="36" y1="24" x2="92" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <polygon points="50,70 40,104 54,96 64,104 64,74" fill="#0369A1" />
      <polygon points="78,70 88,104 74,96 64,104 64,74" fill="#0284C7" />
      <circle cx="64" cy="52" r="28" fill={`url(#${id}-seal)`} stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="64" cy="52" r="21" fill="#10B981" stroke="#D1FAE5" strokeWidth="1.5" />
      <path d="M 53 52 L 60.5 59.5 L 75 45" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 65. AI Workforce Center (Coordinated Triad of Autonomous Agent Entities)
export const IconAiWorkforce: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('aiwf');
  return (
    <OrionSquircleBase gradientId="icon-ai-workforce" from="#0E7490" to="#164E63" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-core`} x1="48" y1="26" x2="80" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="34" stroke="#67E8F9" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      {/* Left & Right flank entities */}
      <circle cx="38" cy="70" r="8" fill="#A5F3FC" />
      <path d="M 25 94 C 25 83 31 79 38 79 C 45 79 51 83 51 94 Z" fill="#22D3EE" fillOpacity="0.82" />
      <circle cx="90" cy="70" r="8" fill="#A5F3FC" />
      <path d="M 77 94 C 77 83 83 79 90 79 C 97 79 103 83 103 94 Z" fill="#22D3EE" fillOpacity="0.82" />
      {/* Foreground Lead Orchestrator entity */}
      <circle cx="64" cy="44" r="11" fill={`url(#${id}-core)`} stroke="#083344" strokeWidth="1.8" />
      <path d="M 45 84 C 45 69 53 62 64 62 C 75 62 83 69 83 84 Z" fill={`url(#${id}-core)`} stroke="#083344" strokeWidth="1.6" />
      <circle cx="64" cy="73" r="3.5" fill="#0891B2" />
    </OrionSquircleBase>
  );
};

// 66. Vendor Onboarding & RFQ (Laminated Credential Lanyard Badge)
export const IconVendorOnboarding: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('vend-o');
  return (
    <OrionSquircleBase gradientId="icon-vendor-onb" from="#6D28D9" to="#2E1065" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-badge`} x1="34" y1="32" x2="94" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      {/* Top metal clip */}
      <rect x="55" y="20" width="18" height="14" rx="4" fill="#CBD5E1" stroke="#FFFFFF" strokeWidth="1.2" />
      <rect x="33" y="31" width="62" height="72" rx="10" fill={`url(#${id}-badge)`} />
      <circle cx="64" cy="54" r="13" fill="#7C3AED" />
      <polygon points="64,45 67,51 73,52 68.5,56 69.5,62 64,59 58.5,62 59.5,56 55,52 61,51" fill="#FDE047" />
      <rect x="44" y="75" width="40" height="5.5" rx="2.5" fill="#4C1D95" />
      <rect x="50" y="85" width="28" height="4" rx="2" fill="#8B5CF6" />
    </OrionSquircleBase>
  );
};

// 67. Decisions (Hardwood & Brass Executive Protocol Gavel)
export const IconDecisions: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dec');
  return (
    <OrionSquircleBase gradientId="icon-decisions" from="#D97706" to="#78350F" accent="#F59E0B" {...props}>
      <defs>
        <linearGradient id={`${id}-block`} x1="32" y1="78" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Sounding anvil block */}
      <rect x="30" y="84" width="68" height="12" rx="5" fill={`url(#${id}-block)`} stroke="#FFFFFF" strokeWidth="1.4" />
      {/* Gavel handle & angled brass mallet head */}
      <line x1="60" y1="48" x2="90" y2="76" stroke="#FEF3C7" strokeWidth="7" strokeLinecap="round" />
      <g transform="rotate(-38 52 46)">
        <rect x="30" y="34" width="44" height="22" rx="5" fill="#FFFFFF" stroke="#FBBF24" strokeWidth="2.5" />
        <rect x="34" y="34" width="6" height="22" fill="#F59E0B" />
        <rect x="64" y="34" width="6" height="22" fill="#F59E0B" />
      </g>
    </OrionSquircleBase>
  );
};

// 68. Action Center (Hexagonal Power Cell & Volcanic Bolt Prism)
export const IconActionCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('act-c');
  return (
    <OrionSquircleBase gradientId="icon-action-ctr" from="#EA580C" to="#7C2D12" accent="#F97316" {...props}>
      <defs>
        <linearGradient id={`${id}-bolt`} x1="42" y1="22" x2="88" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="34" fill="#431407" fillOpacity="0.45" stroke="#FED7AA" strokeOpacity="0.45" strokeWidth="1.8" />
      <polygon points="70,22 36,66 60,66 52,106 92,54 68,54" fill={`url(#${id}-bolt)`} stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
    </OrionSquircleBase>
  );
};

// 69. Autopilot (Titanium Cockpit Attitude Wing & Compass)
export const IconAutopilot: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('auto-p');
  return (
    <OrionSquircleBase gradientId="icon-autopilot" from="#7C3AED" to="#3B0764" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-wing`} x1="46" y1="24" x2="82" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="34" stroke="#E9D5FF" strokeOpacity="0.55" strokeWidth="2.4" fill="#2E1065" fillOpacity="0.4" />
      <line x1="28" y1="64" x2="46" y2="64" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="82" y1="64" x2="100" y2="64" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
      <polygon points="64,24 84,88 64,74 44,88" fill={`url(#${id}-wing)`} stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
    </OrionSquircleBase>
  );
};

// 70. Workflows (Connected Pipeline Process Stages)
export const IconWorkflows: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('wfl');
  return (
    <OrionSquircleBase gradientId="icon-workflows" from="#0284C7" to="#082F49" accent="#0EA5E9" {...props}>
      <defs>
        <linearGradient id={`${id}-node`} x1="26" y1="30" x2="102" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <path d="M 38 40 L 88 40 L 64 88 Z" stroke="#38BDF8" strokeWidth="4" strokeLinejoin="round" fill="none" />
      <rect x="26" y="28" width="24" height="24" rx="7" fill={`url(#${id}-node)`} stroke="#0284C7" strokeWidth="2" />
      <polygon points="90,26 104,40 90,54 76,40" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="64" cy="88" r="13" fill="#34D399" stroke="#FFFFFF" strokeWidth="2.2" />
    </OrionSquircleBase>
  );
};

// 71. Autonomy Center (Chrome Tachometer Gauge & Luminous Needle)
export const IconAutonomyCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('aut-c');
  return (
    <OrionSquircleBase gradientId="icon-autonomy-ctr" from="#6D28D9" to="#1E1B4B" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-arc`} x1="28" y1="42" x2="100" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="68" r="34" fill="#1E1B4B" stroke="#DDD6FE" strokeOpacity="0.4" strokeWidth="2" />
      <path d="M 32 78 A 34 34 0 0 1 96 78" stroke={`url(#${id}-arc)`} strokeWidth="7.5" strokeLinecap="round" fill="none" />
      <line x1="64" y1="74" x2="84" y2="44" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="64" cy="74" r="7" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 72. Attention Center (Fresnel Spotlight Lens & Focused Beam)
export const IconAttentionCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('att-c');
  return (
    <OrionSquircleBase gradientId="icon-attention" from="#D97706" to="#78350F" accent="#F59E0B" {...props}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="36" fill={`url(#${id}-glow)`} fillOpacity="0.4" />
      <circle cx="64" cy="64" r="30" stroke="#FEF3C7" strokeOpacity="0.65" strokeWidth="3" fill="none" />
      <circle cx="64" cy="64" r="19" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="64" cy="64" r="8" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 73. Constraints (Forged Steel Locking Brackets & Strict Cap Bar)
export const IconConstraints: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('cnst');
  return (
    <OrionSquircleBase gradientId="icon-constraints" from="#4338CA" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-steel`} x1="28" y1="30" x2="100" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>
      </defs>
      <path d="M 46 34 L 28 34 L 28 94 L 46 94" stroke={`url(#${id}-steel)`} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 82 34 L 100 34 L 100 94 L 82 94" stroke={`url(#${id}-steel)`} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="44" y="48" width="40" height="32" rx="8" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="2" />
      <line x1="54" y1="64" x2="74" y2="64" stroke="#1E1B4B" strokeWidth="5" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 74. Policies (Heraldic Chrome & Sapphire Security Shield)
export const IconPolicies: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('pol');
  return (
    <OrionSquircleBase gradientId="icon-policies" from="#1D4ED8" to="#172554" accent="#3B82F6" {...props}>
      <defs>
        <linearGradient id={`${id}-shield`} x1="34" y1="24" x2="94" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>
      <path d="M 64 22 L 96 36 L 96 64 C 96 86 64 104 64 104 C 64 104 32 86 32 64 L 32 36 Z" fill={`url(#${id}-shield)`} />
      <path d="M 64 31 L 88 42 L 88 63 C 88 79 64 93 64 93 C 64 93 40 79 40 63 L 40 42 Z" fill="#1E3A8A" />
      <rect x="52" y="57" width="24" height="19" rx="4" fill="#FBBF24" />
      <path d="M 56 57 L 56 50 C 56 45.6 59.6 42 64 42 C 68.4 42 72 45.6 72 50 L 72 57" stroke="#FEF3C7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 75. AI + Manual Control Center (Machined Dual-Toggle Console Deck)
export const IconControlCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('ctrl-ctr');
  return (
    <OrionSquircleBase gradientId="icon-ctrl-ctr" from="#0F766E" to="#134E4A" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-knob`} x1="0" y1="30" x2="0" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      {/* Top ON toggle switch */}
      <rect x="26" y="31" width="76" height="27" rx="13.5" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
      <circle cx="88" cy="44.5" r="10.5" fill={`url(#${id}-knob)`} />
      {/* Bottom secondary toggle switch */}
      <rect x="26" y="69" width="76" height="27" rx="13.5" fill="#042F2E" stroke="#5EEAD4" strokeOpacity="0.6" strokeWidth="1.5" />
      <circle cx="40" cy="82.5" r="10.5" fill={`url(#${id}-knob)`} />
    </OrionSquircleBase>
  );
};

// 76. Workflow Builder (Modular Snapping Cyan & Silver Blocks)
export const IconWorkflowBuilder: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('wfb');
  return (
    <OrionSquircleBase gradientId="icon-wf-builder" from="#0284C7" to="#0369A1" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-blk`} x1="26" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <rect x="24" y="28" width="44" height="34" rx="8" fill={`url(#${id}-blk)`} />
      <rect x="60" y="64" width="44" height="34" rx="8" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="68" cy="45" r="6" fill="#FBBF24" />
      <path d="M 46 62 L 46 81 L 60 81" stroke="#E0F2FE" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 77. Outcome Center (Laurel Crest & Podium Verification Jewel)
export const IconOutcomeCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('out-ctr');
  return (
    <OrionSquircleBase gradientId="icon-outcome-ctr" from="#047857" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-disc`} x1="36" y1="32" x2="92" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="33" stroke="#6EE7B7" strokeOpacity="0.45" strokeWidth="3" strokeDasharray="8 4" fill="none" />
      <circle cx="64" cy="64" r="24" fill={`url(#${id}-disc)`} />
      <path d="M 52 64 L 60 72 L 77 55" stroke="#047857" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 78. Rollback Center (Mechanical Red Safety Rewind Dial)
export const IconRollbackCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('rollb');
  return (
    <OrionSquircleBase gradientId="icon-rollback" from="#B91C1C" to="#7F1D1D" accent="#EF4444" {...props}>
      <defs>
        <linearGradient id={`${id}-ring`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FECACA" />
        </linearGradient>
      </defs>
      <path d="M 32 52 A 34 34 0 1 1 38 86" stroke={`url(#${id}-ring)`} strokeWidth="6" strokeLinecap="round" fill="none" />
      <polygon points="22,56 38,38 43,58" fill="#FFFFFF" />
      <circle cx="64" cy="64" r="14" fill="#F87171" stroke="#FFFFFF" strokeWidth="2.4" />
      <rect x="59" y="59" width="10" height="10" rx="2" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 79. Operations Center (War-Room Telemetry Console Monitor)
export const IconOperationsCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('ops-c');
  return (
    <OrionSquircleBase gradientId="icon-ops-ctr" from="#0F766E" to="#115E59" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-disp`} x1="22" y1="28" x2="106" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#082F49" />
          <stop offset="100%" stopColor="#042F2E" />
        </linearGradient>
      </defs>
      <rect x="20" y="28" width="88" height="58" rx="10" fill={`url(#${id}-disp)`} stroke="#99F6E4" strokeWidth="2" />
      {/* Stand base */}
      <path d="M 52 86 L 76 86 L 82 98 L 46 98 Z" fill="#CCFBF1" />
      {/* Radar pulse inside screen */}
      <circle cx="46" cy="57" r="14" stroke="#2DD4BF" strokeWidth="2.5" fill="none" />
      <circle cx="46" cy="57" r="5" fill="#00F2FE" />
      <rect x="68" y="42" width="30" height="7" rx="3" fill="#34D399" />
      <rect x="68" y="54" width="22" height="7" rx="3" fill="#FBBF24" />
      <rect x="68" y="66" width="26" height="7" rx="3" fill="#38BDF8" />
    </OrionSquircleBase>
  );
};

// 80. Incident Center (Emergency Dome Strobe Beacon)
export const IconIncidentCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('inc-c');
  return (
    <OrionSquircleBase gradientId="icon-incident-ctr" from="#991B1B" to="#450A0A" accent="#DC2626" {...props}>
      <defs>
        <radialGradient id={`${id}-dome`} cx="45%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="38%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
      </defs>
      {/* Rays */}
      <line x1="64" y1="20" x2="64" y2="30" stroke="#FEF08A" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="36" x2="38" y2="42" stroke="#FEF08A" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="98" y1="36" x2="90" y2="42" stroke="#FEF08A" strokeWidth="3.5" strokeLinecap="round" />
      {/* Illuminated glass dome siren */}
      <path d="M 40 78 L 40 60 C 40 46.7 50.7 36 64 36 C 77.3 36 88 46.7 88 60 L 88 78 Z" fill={`url(#${id}-dome)`} stroke="#FFFFFF" strokeWidth="1.6" />
      <rect x="30" y="78" width="68" height="14" rx="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
    </OrionSquircleBase>
  );
};

// 81. Global Operations (Glossy Sapphire Hemisphere & Polar Corridors)
export const IconGlobalOperations: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('gl-ops');
  return (
    <OrionSquircleBase gradientId="icon-global-ops" from="#0369A1" to="#082F49" accent="#00F2FE" {...props}>
      <defs>
        <radialGradient id={`${id}-earth`} cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="55%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#082F49" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="34" fill={`url(#${id}-earth)`} stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2" />
      <path d="M 32 54 Q 64 36 96 54" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M 36 78 Q 64 90 92 72" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <circle cx="48" cy="48" r="4.5" fill="#FFFFFF" />
      <circle cx="82" cy="54" r="4.5" fill="#FDE047" />
      <circle cx="64" cy="80" r="4.5" fill="#34D399" />
    </OrionSquircleBase>
  );
};

// 82. Regional Operations (Folded 3D Terrain Map & Telemetry Pins)
export const IconRegionalOperations: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('reg-ops');
  return (
    <OrionSquircleBase gradientId="icon-reg-ops" from="#0891B2" to="#155E75" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-map`} x1="24" y1="32" x2="104" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#A5F3FC" />
        </linearGradient>
      </defs>
      <polygon points="24,42 50,32 50,86 24,96" fill={`url(#${id}-map)`} />
      <polygon points="50,32 78,42 78,96 50,86" fill="#67E8F9" />
      <polygon points="78,42 104,32 104,86 78,96" fill={`url(#${id}-map)`} />
      {/* Raised corridor pins */}
      <circle cx="42" cy="56" r="6.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="86" cy="54" r="6.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.8" />
      <path d="M 48 56 Q 64 46 80 54" stroke="#083344" strokeWidth="2.5" strokeDasharray="3 2" fill="none" />
    </OrionSquircleBase>
  );
};

// 83. Reconciliation Center (Dual Matched Ledger Sheets & Gold Zipper Sync)
export const IconReconciliationCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('recon');
  return (
    <OrionSquircleBase gradientId="icon-recon-ctr" from="#D97706" to="#78350F" accent="#F59E0B" {...props}>
      <defs>
        <linearGradient id={`${id}-doc`} x1="26" y1="26" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
      </defs>
      <rect x="24" y="28" width="46" height="62" rx="7" fill={`url(#${id}-doc)`} />
      <rect x="58" y="38" width="46" height="62" rx="7" fill="#FFFBEB" stroke="#FBBF24" strokeWidth="1.6" />
      <line x1="34" y1="44" x2="58" y2="44" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
      <line x1="68" y1="54" x2="94" y2="54" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
      <circle cx="64" cy="70" r="11" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.2" />
      <path d="M 59 70 L 62.5 73.5 L 70 66" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 84. Failover & Fencing (Industrial Redundant Transfer Switch)
export const IconFailoverCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('fail-o');
  return (
    <OrionSquircleBase gradientId="icon-failover" from="#991B1B" to="#450A0A" accent="#EF4444" {...props}>
      <defs>
        <linearGradient id={`${id}-lever`} x1="36" y1="28" x2="92" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      <rect x="28" y="28" width="72" height="72" rx="14" fill="#2A0808" stroke="#FCA5A5" strokeOpacity="0.5" strokeWidth="1.8" />
      <circle cx="46" cy="44" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="82" cy="44" r="7" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Active knife transfer lever swung over to live healthy right bus */}
      <line x1="64" y1="84" x2="82" y2="44" stroke={`url(#${id}-lever)`} strokeWidth="7" strokeLinecap="round" />
      <circle cx="64" cy="84" r="8" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.8" />
    </OrionSquircleBase>
  );
};

// 85. Finance & Working Capital Ledger (Bound Emerald Accounting Folio)
export const IconFinanceLedger: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('fin-l');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-fin-ledger" from="#059669" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-cover`} x1="32" y1="22" x2="98" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      {/* Book gold page edges & spine */}
      <rect x="30" y="24" width="68" height="80" rx="8" fill={`url(#${id}-cover)`} stroke="#A7F3D0" strokeWidth="1.6" />
      <rect x="30" y="24" width="14" height="80" rx="4" fill="#022C22" />
      <rect x="92" y="29" width="5" height="70" rx="1.5" fill="#FEF3C7" />
      {/* Gold brass medallion & crisp currency balance bars */}
      <circle cx="67" cy="54" r="14" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1.8" />
      <path d="M 67 45 L 67 63 M 62 49 L 72 49 M 62 59 L 72 59" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
      {!isMicro && <rect x="52" y="78" width="30" height="5" rx="2.5" fill="#ECFDF5" />}
    </OrionSquircleBase>
  );
};

// 86. Customs & Trade Compliance (Embossed Port Passport & Clear Stamp)
export const IconCustomsTrade: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('cust');
  return (
    <OrionSquircleBase gradientId="icon-customs" from="#6D28D9" to="#3B0764" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-pass`} x1="30" y1="24" x2="98" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
      </defs>
      <rect x="30" y="24" width="68" height="80" rx="9" fill={`url(#${id}-pass)`} stroke="#DDD6FE" strokeWidth="1.8" />
      {/* Gold passport globe seal */}
      <circle cx="64" cy="54" r="16" stroke="#FBBF24" strokeWidth="2.5" fill="none" />
      <ellipse cx="64" cy="54" rx="8" ry="16" stroke="#FBBF24" strokeWidth="1.8" fill="none" />
      <line x1="48" y1="54" x2="80" y2="54" stroke="#FBBF24" strokeWidth="1.8" />
      {/* Customs clearance bar & stamp */}
      <rect x="44" y="80" width="40" height="8" rx="3" fill="#34D399" />
    </OrionSquircleBase>
  );
};
