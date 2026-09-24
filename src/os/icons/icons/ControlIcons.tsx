import React from 'react';
import { OrionSquircleBase } from '../OrionIconRegistry';

// 59. Exceptions
export const IconExceptions: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-exceptions" from="#DC2626" to="#7F1D1D" {...props}>
    {/* Alert Warning Shield / Exclamation Delta */}
    <polygon points="64,24 102,88 26,88" fill="#EF4444" stroke="#FEE2E2" strokeWidth="3" />
    <line x1="64" y1="46" x2="64" y2="68" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="64" cy="78" r="3" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 60. Approval Center
export const IconApprovalCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-approvals" from="#0284C7" to="#082F49" {...props}>
    {/* Dual-key Governance Stamp & Certified Shield */}
    <circle cx="64" cy="64" r="32" stroke="#BAE6FD" strokeWidth="2.5" fill="none" />
    <path d="M 44 64 L 58 78 L 84 50" stroke="#00F2FE" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="64" cy="64" r="38" stroke="#00F2FE" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
  </OrionSquircleBase>
);

// 61. AI Workforce
export const IconAiWorkforce: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-ai-workforce" from="#0E7490" to="#164E63" {...props}>
    {/* 20-Agent Directorate Core & Sovereign Ring */}
    <circle cx="64" cy="64" r="34" stroke="#67E8F9" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    <circle cx="64" cy="64" r="18" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="64" cy="30" r="5" fill="#A5F3FC" />
    <circle cx="98" cy="64" r="5" fill="#A5F3FC" />
    <circle cx="64" cy="98" r="5" fill="#A5F3FC" />
    <circle cx="30" cy="64" r="5" fill="#A5F3FC" />
  </OrionSquircleBase>
);

// 62. Vendor Onboarding
export const IconVendorOnboarding: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-vendor-onb" from="#6D28D9" to="#2E1065" {...props}>
    {/* Qualified Vendor Pass Badge & Star */}
    <rect x="34" y="32" width="60" height="68" rx="8" fill="#A78BFA" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="56" r="12" fill="#FFFFFF" />
    <polygon points="64,48 67,54 74,54 69,58 71,64 64,60 57,64 59,58 54,54 61,54" fill="#6D28D9" />
    <line x1="46" y1="78" x2="82" y2="78" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 63. Decisions
export const IconDecisions: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-decisions" from="#D97706" to="#78350F" {...props}>
    {/* Executive Protocol Gavel & Sovereign Action Block */}
    <rect x="36" y="76" width="56" height="12" rx="4" fill="#FDE68A" />
    {/* Gavel Head */}
    <rect x="42" y="36" width="44" height="18" rx="4" transform="rotate(-30 64 45)" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="64" y1="45" x2="84" y2="75" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 64. Action Center
export const IconActionCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-action-ctr" from="#EA580C" to="#7C2D12" {...props}>
    {/* High-Priority Prescriptive Lightning Trigger */}
    <polygon points="68,22 38,62 60,62 52,106 90,52 68,52" fill="#FDBA74" stroke="#FFFFFF" strokeWidth="2.5" />
  </OrionSquircleBase>
);

// 65. Autopilot
export const IconAutopilot: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-autopilot" from="#7C3AED" to="#3B0764" {...props}>
    {/* Autonomous Flight Compass Wing */}
    <circle cx="64" cy="64" r="32" stroke="#DDD6FE" strokeWidth="2.5" fill="none" />
    <polygon points="64,30 76,64 64,56 52,64" fill="#C4B5FD" stroke="#FFFFFF" strokeWidth="1.5" />
    <polygon points="64,98 76,64 64,72 52,64" fill="#8B5CF6" />
  </OrionSquircleBase>
);

// 66. Workflows
export const IconWorkflows: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-workflows" from="#0284C7" to="#082F49" {...props}>
    {/* Sequential Process Flow & Step Nodes */}
    <circle cx="36" cy="40" r="9" fill="#7DD3FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="92" cy="40" r="9" fill="#7DD3FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="86" r="9" fill="#00F2FE" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 45 40 L 83 40" stroke="#BAE6FD" strokeWidth="3" />
    <path d="M 86 48 L 70 78" stroke="#BAE6FD" strokeWidth="3" />
    <path d="M 42 48 L 58 78" stroke="#BAE6FD" strokeWidth="3" />
  </OrionSquircleBase>
);

// 67. Autonomy Center
export const IconAutonomyCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-autonomy-ctr" from="#6D28D9" to="#1E1B4B" {...props}>
    {/* Tiered Sovereign Autonomy Gauge */}
    <path d="M 30 78 A 38 38 0 0 1 98 78" stroke="#DDD6FE" strokeWidth="6" strokeLinecap="round" fill="none" />
    <line x1="64" y1="78" x2="82" y2="44" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
    <circle cx="64" cy="78" r="6" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 68. Attention Center
export const IconAttentionCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-attention" from="#D97706" to="#78350F" {...props}>
    {/* Focused Beacon Spotlight Ring */}
    <circle cx="64" cy="64" r="32" stroke="#FDE68A" strokeWidth="3" fill="none" />
    <polygon points="64,36 84,84 44,84" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="60" r="4.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 69. Constraints
export const IconConstraints: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-constraints" from="#4338CA" to="#1E1B4B" {...props}>
    {/* Regulatory Barrier Brackets / Strict Bound Limits */}
    <path d="M 36 34 L 26 34 L 26 94 L 36 94" stroke="#A5B4FC" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M 92 34 L 102 34 L 102 94 L 92 94" stroke="#A5B4FC" strokeWidth="4" strokeLinecap="round" fill="none" />
    <line x1="40" y1="64" x2="88" y2="64" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="64" cy="64" r="6" fill="#F87171" />
  </OrionSquircleBase>
);

// 70. Policies
export const IconPolicies: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-policies" from="#1D4ED8" to="#172554" {...props}>
    {/* Rulebook Scroll & Authority Shield */}
    <rect x="34" y="28" width="60" height="72" rx="6" fill="#93C5FD" />
    <line x1="44" y1="42" x2="84" y2="42" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="44" y1="54" x2="84" y2="54" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="64" cy="74" r="10" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 60 74 L 63 77 L 69 71" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
  </OrionSquircleBase>
);

// 71. Control Center (AI + Manual Unified)
export const IconControlCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-ctrl-ctr" from="#0F766E" to="#134E4A" {...props}>
    {/* Sovereign Switchboard Master Faders */}
    <rect x="28" y="28" width="72" height="72" rx="8" fill="#115E59" stroke="#5EEAD4" strokeWidth="2" />
    <line x1="42" y1="38" x2="42" y2="90" stroke="#2DD4BF" strokeWidth="2.5" />
    <line x1="64" y1="38" x2="64" y2="90" stroke="#2DD4BF" strokeWidth="2.5" />
    <line x1="86" y1="38" x2="86" y2="90" stroke="#2DD4BF" strokeWidth="2.5" />
    {/* Sliders */}
    <rect x="36" y="50" width="12" height="8" rx="2" fill="#FFFFFF" />
    <rect x="58" y="70" width="12" height="8" rx="2" fill="#FFFFFF" />
    <rect x="80" y="42" width="12" height="8" rx="2" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 72. Workflow Builder
export const IconWorkflowBuilder: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-wf-builder" from="#0284C7" to="#0369A1" {...props}>
    {/* Node-Graph Visual Canvas Architecture */}
    <rect x="28" y="28" width="28" height="20" rx="4" fill="#7DD3FC" stroke="#FFFFFF" strokeWidth="1.5" />
    <rect x="72" y="28" width="28" height="20" rx="4" fill="#7DD3FC" stroke="#FFFFFF" strokeWidth="1.5" />
    <rect x="50" y="78" width="28" height="20" rx="4" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 42 48 L 42 64 L 64 64 L 64 78" stroke="#BAE6FD" strokeWidth="2.5" fill="none" />
    <path d="M 86 48 L 86 64 L 64 64" stroke="#BAE6FD" strokeWidth="2.5" fill="none" />
  </OrionSquircleBase>
);

// 73. Outcome Center
export const IconOutcomeCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-outcome-ctr" from="#047857" to="#064E3B" {...props}>
    {/* Closed-loop Telemetry Value Reconciliation */}
    <circle cx="64" cy="64" r="32" stroke="#6EE7B7" strokeWidth="2.5" fill="none" />
    <path d="M 44 64 L 58 78 L 84 50" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 74. Rollback Center
export const IconRollbackCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-rollback" from="#B91C1C" to="#7F1D1D" {...props}>
    {/* 1-Click Instant Version Reversal Loop */}
    <path d="M 64 30 A 34 34 0 1 0 98 64" stroke="#FCA5A5" strokeWidth="4" strokeLinecap="round" fill="none" />
    <polygon points="64,18 64,42 44,30" fill="#FCA5A5" />
    <circle cx="64" cy="64" r="8" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 75. Operations Center
export const IconOperationsCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-ops-ctr" from="#0F766E" to="#115E59" {...props}>
    {/* Live Industrial Console Gauge & Circuit Breaker */}
    <circle cx="64" cy="64" r="34" stroke="#5EEAD4" strokeWidth="2.5" fill="none" />
    <path d="M 40 76 A 28 28 0 0 1 88 76" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" fill="none" />
    <line x1="64" y1="64" x2="78" y2="44" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="64" cy="64" r="5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 76. Incident Center
export const IconIncidentCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-incident-ctr" from="#991B1B" to="#450A0A" {...props}>
    {/* Crisis Incident Red Flasher / Octagonal Shield */}
    <polygon points="46,26 82,26 102,46 102,82 82,102 46,102 26,82 26,46" fill="#DC2626" stroke="#FEE2E2" strokeWidth="3" />
    <line x1="64" y1="44" x2="64" y2="72" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
    <circle cx="64" cy="84" r="3.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 77. Global Operations
export const IconGlobalOperations: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-global-ops" from="#0369A1" to="#082F49" {...props}>
    {/* Sovereign Multi-Site Global Operation Ring */}
    <circle cx="64" cy="64" r="34" stroke="#7DD3FC" strokeWidth="2" fill="none" />
    <ellipse cx="64" cy="64" rx="34" ry="12" stroke="#38BDF8" strokeWidth="2" fill="none" />
    <line x1="64" y1="30" x2="64" y2="98" stroke="#38BDF8" strokeWidth="2" />
    <circle cx="64" cy="64" r="7" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 78. Regional Operations
export const IconRegionalOperations: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-reg-ops" from="#0891B2" to="#155E75" {...props}>
    {/* Sovereign Data Residency Regional Boundaries */}
    <rect x="28" y="28" width="72" height="72" rx="12" stroke="#67E8F9" strokeWidth="2.5" strokeDasharray="6 4" fill="none" />
    <circle cx="50" cy="50" r="8" fill="#22D3EE" />
    <circle cx="78" cy="74" r="8" fill="#A5F3FC" />
    <line x1="50" y1="50" x2="78" y2="74" stroke="#FFFFFF" strokeWidth="2" />
  </OrionSquircleBase>
);

// 79. Reconciliation Center
export const IconReconciliationCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-recon-ctr" from="#D97706" to="#78350F" {...props}>
    {/* Multi-System Exposure Balancing Scales */}
    <line x1="32" y1="46" x2="96" y2="46" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="38" x2="64" y2="88" stroke="#FBBF24" strokeWidth="3.5" />
    <rect x="44" y="88" width="40" height="6" rx="3" fill="#FFFFFF" />
    <path d="M 32 46 L 22 72 L 42 72 Z" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
    <path d="M 96 46 L 86 72 L 106 72 Z" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
  </OrionSquircleBase>
);

// 80. Failover & Fencing
export const IconFailoverCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-failover" from="#991B1B" to="#450A0A" {...props}>
    {/* Distributed Multi-Region Active Fencing Key */}
    <circle cx="48" cy="64" r="16" stroke="#FCA5A5" strokeWidth="3" fill="none" />
    <line x1="64" y1="64" x2="96" y2="64" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <line x1="84" y1="64" x2="84" y2="76" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="94" y1="64" x2="94" y2="76" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 81. Finance & Working Capital Ledger
export const IconFinanceLedger: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-fin-ledger" from="#059669" to="#064E3B" {...props}>
    {/* Enterprise Dual-Entry Ledger & Vault Seal */}
    <rect x="30" y="28" width="68" height="72" rx="8" fill="#10B981" stroke="#A7F3D0" strokeWidth="2" />
    <line x1="64" y1="28" x2="64" y2="100" stroke="#047857" strokeWidth="2" />
    <text x="47" y="56" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">DR</text>
    <text x="81" y="56" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">CR</text>
    <circle cx="64" cy="78" r="8" fill="#FEF08A" stroke="#065F46" strokeWidth="1.5" />
  </OrionSquircleBase>
);

// 82. Customs & Trade Compliance
export const IconCustomsTrade: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-customs" from="#6D28D9" to="#3B0764" {...props}>
    {/* International Border Clearance Passport & Stamp */}
    <rect x="32" y="26" width="64" height="76" rx="8" fill="#8B5CF6" stroke="#DDD6FE" strokeWidth="2" />
    <circle cx="64" cy="54" r="16" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 2" fill="none" />
    <text x="64" y="60" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">PASSED</text>
    <line x1="44" y1="82" x2="84" y2="82" stroke="#DDD6FE" strokeWidth="2.5" />
  </OrionSquircleBase>
);
