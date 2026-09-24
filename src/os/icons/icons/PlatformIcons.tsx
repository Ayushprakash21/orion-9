import React from 'react';
import { OrionSquircleBase } from '../OrionIconRegistry';

// 83. Master Data
export const IconMasterData: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-master-data" from="#4F46E5" to="#1E1B4B" {...props}>
    {/* Authoritative Gold Record Database Cylinder */}
    <ellipse cx="64" cy="38" rx="28" ry="10" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 36 38 L 36 60 C 36 66 48 70 64 70 C 80 70 92 66 92 60 L 92 38" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 36 60 L 36 82 C 36 88 48 92 64 92 C 80 92 92 88 92 82 L 92 60" fill="#4338CA" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="62" r="5" fill="#FEF08A" />
  </OrionSquircleBase>
);

// 84. Reports
export const IconReports: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-reports" from="#4338CA" to="#1E1B4B" {...props}>
    {/* Analytical Report Dossier & Chart Bars */}
    <rect x="32" y="26" width="64" height="76" rx="6" fill="#EEF2FF" />
    <rect x="42" y="66" width="8" height="22" rx="2" fill="#4F46E5" />
    <rect x="54" y="52" width="8" height="36" rx="2" fill="#6366F1" />
    <rect x="66" y="42" width="8" height="46" rx="2" fill="#818CF8" />
    <rect x="78" y="58" width="8" height="30" rx="2" fill="#A5B4FC" />
  </OrionSquircleBase>
);

// 85. Documents
export const IconDocuments: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-documents" from="#475569" to="#0F172A" {...props}>
    {/* Structured Enterprise Knowledge Document Folder */}
    <path d="M 28 36 L 50 36 L 58 44 L 100 44 L 100 92 L 28 92 Z" fill="#94A3B8" />
    <rect x="36" y="48" width="56" height="40" rx="4" fill="#E2E8F0" />
    <line x1="44" y1="60" x2="72" y2="60" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="44" y1="70" x2="80" y2="70" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 86. User Manual
export const IconUserManual: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-manual" from="#0891B2" to="#164E63" {...props}>
    {/* Operator Field Book & Knowledge Compass */}
    <path d="M 32 32 L 64 42 L 96 32 L 96 86 L 64 96 L 32 86 Z" fill="#67E8F9" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="64" y1="42" x2="64" y2="96" stroke="#0891B2" strokeWidth="2" />
  </OrionSquircleBase>
);

// 87. Settings
export const IconSettings: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-settings" from="#475569" to="#1E293B" {...props}>
    {/* Precision Mechanical Configuration Cog */}
    <circle cx="64" cy="64" r="32" stroke="#CBD5E1" strokeWidth="6" strokeDasharray="14 10" fill="none" />
    <circle cx="64" cy="64" r="14" fill="#94A3B8" stroke="#FFFFFF" strokeWidth="3" />
  </OrionSquircleBase>
);

// 88. Data Lakehouse
export const IconData: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-data" from="#0284C7" to="#082F49" {...props}>
    {/* BigQuery Semantic Lakehouse Multi-Cylinder Array */}
    <ellipse cx="64" cy="36" rx="26" ry="8" fill="#7DD3FC" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 38 36 L 38 52 C 38 56 50 60 64 60 C 78 60 90 56 90 52 L 90 36" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 38 52 L 38 68 C 38 72 50 76 64 76 C 78 76 90 72 90 68 L 90 52" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 38 68 L 38 84 C 38 88 50 92 64 92 C 78 92 90 88 90 84 L 90 68" fill="#0369A1" stroke="#FFFFFF" strokeWidth="1.5" />
  </OrionSquircleBase>
);

// 89. Data Quality
export const IconDataQuality: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-data-qual" from="#059669" to="#064E3B" {...props}>
    {/* Data Hygiene 100% Score Shield */}
    <circle cx="64" cy="64" r="32" stroke="#6EE7B7" strokeWidth="3" fill="none" />
    <path d="M 46 64 L 58 76 L 82 52" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <polygon points="64,18 72,26 64,34 56,26" fill="#FDE047" />
  </OrionSquircleBase>
);

// 90. Integrations
export const IconIntegrations: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-integrations" from="#4F46E5" to="#1E1B4B" {...props}>
    {/* Interconnected Enterprise API Mesh Connector */}
    <circle cx="38" cy="46" r="10" fill="#A5B4FC" />
    <circle cx="90" cy="46" r="10" fill="#A5B4FC" />
    <circle cx="64" cy="84" r="10" fill="#818CF8" />
    <path d="M 46 50 L 56 76" stroke="#FFFFFF" strokeWidth="3.5" />
    <path d="M 82 50 L 72 76" stroke="#FFFFFF" strokeWidth="3.5" />
    <path d="M 48 46 L 80 46" stroke="#FFFFFF" strokeWidth="3.5" />
  </OrionSquircleBase>
);

// 91. Observability
export const IconObservability: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-observability" from="#1D4ED8" to="#172554" {...props}>
    {/* Distributed Tracing & Telemetry Eye Lens */}
    <path d="M 24 64 C 24 64 40 38 64 38 C 88 38 104 64 104 64 C 104 64 88 90 64 90 C 40 90 24 64 24 64 Z" stroke="#93C5FD" strokeWidth="3.5" fill="#1E40AF" />
    <circle cx="64" cy="64" r="14" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="64" cy="64" r="6" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 92. Sync Monitor
export const IconSync: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-sync" from="#0891B2" to="#155E75" {...props}>
    {/* Dual Bidirectional Sync Ring Arrows */}
    <path d="M 64 30 A 34 34 0 0 1 98 64" stroke="#67E8F9" strokeWidth="4" strokeLinecap="round" fill="none" />
    <polygon points="98,54 98,72 80,72" fill="#67E8F9" />
    <path d="M 64 98 A 34 34 0 0 1 30 64" stroke="#A5F3FC" strokeWidth="4" strokeLinecap="round" fill="none" />
    <polygon points="30,74 30,56 48,56" fill="#A5F3FC" />
  </OrionSquircleBase>
);

// 93. About ORION
export const IconAbout: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-about" from="#0F172A" to="#020617" {...props}>
    {/* Orion Constellation 9-Star Sovereign Crest */}
    <polygon points="64,24 74,48 100,52 80,70 86,96 64,82 42,96 48,70 28,52 54,48" fill="#00F2FE" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="64" cy="60" r="5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 94. Time & World
export const IconTimeWorld: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-time-world" from="#0284C7" to="#075985" {...props}>
    {/* Coordinated Universal Time Planetary Dial */}
    <circle cx="64" cy="64" r="34" stroke="#BAE6FD" strokeWidth="2.5" fill="none" />
    <ellipse cx="64" cy="64" rx="34" ry="12" stroke="#7DD3FC" strokeWidth="1.5" fill="none" />
    <line x1="64" y1="40" x2="64" y2="64" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="64" y1="64" x2="80" y2="64" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 95. Profile
export const IconProfile: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-profile" from="#2563EB" to="#1E3A8A" {...props}>
    {/* Operator Sovereign Avatar & Role Crest */}
    <circle cx="64" cy="46" r="16" fill="#DBEAFE" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 36 90 C 36 74 48 70 64 70 C 80 70 92 74 92 90 Z" fill="#93C5FD" stroke="#FFFFFF" strokeWidth="2" />
  </OrionSquircleBase>
);

// 96. Organization
export const IconOrganization: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-org" from="#6D28D9" to="#3B0764" {...props}>
    {/* 7-Level Enterprise Hierarchy Headquarters */}
    <rect x="42" y="32" width="44" height="66" rx="4" fill="#A78BFA" stroke="#FFFFFF" strokeWidth="2" />
    {/* Windows */}
    <rect x="48" y="42" width="8" height="8" rx="1" fill="#FFFFFF" />
    <rect x="60" y="42" width="8" height="8" rx="1" fill="#FFFFFF" />
    <rect x="72" y="42" width="8" height="8" rx="1" fill="#FFFFFF" />
    <rect x="48" y="56" width="8" height="8" rx="1" fill="#FFFFFF" />
    <rect x="60" y="56" width="8" height="8" rx="1" fill="#FFFFFF" />
    <rect x="72" y="56" width="8" height="8" rx="1" fill="#FFFFFF" />
    <rect x="58" y="76" width="12" height="22" rx="2" fill="#3B0764" />
  </OrionSquircleBase>
);

// 97. Platform Intelligence
export const IconPlatformIntelligence: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-plat-intel" from="#581C87" to="#1E1B4B" {...props}>
    {/* Autonomous Platform Engine Processor */}
    <rect x="36" y="36" width="56" height="56" rx="8" fill="#7E22CE" stroke="#E9D5FF" strokeWidth="2" />
    <circle cx="64" cy="64" r="14" fill="#C084FC" />
    <path d="M 64 26 L 64 36 M 64 92 L 64 102 M 26 64 L 36 64 M 92 64 L 102 64" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 98. Production Readiness
export const IconProductionReadiness: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-prod-ready" from="#059669" to="#064E3B" {...props}>
    {/* Production Go-Live Certified Seal */}
    <circle cx="64" cy="64" r="32" stroke="#6EE7B7" strokeWidth="3" fill="none" />
    <polygon points="64,36 72,52 90,54 76,66 80,84 64,74 48,84 52,66 38,54 56,52" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="64" cy="60" r="6" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 99. Configuration Center
export const IconConfigurationCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-config-ctr" from="#475569" to="#0F172A" {...props}>
    {/* Masked Secrets Vault & Parameter Tuner */}
    <rect x="32" y="44" width="64" height="48" rx="8" fill="#64748B" stroke="#E2E8F0" strokeWidth="2" />
    <circle cx="64" cy="68" r="8" fill="#FEF08A" stroke="#334155" strokeWidth="2" />
    <path d="M 44 44 L 44 34 C 44 24 52 18 64 18 C 76 18 84 24 84 34 L 84 44" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" fill="none" />
  </OrionSquircleBase>
);

// 100. Release Center
export const IconReleaseCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-release-ctr" from="#0E7490" to="#164E63" {...props}>
    {/* Immutable Release Pipeline & Binary Rocket */}
    <path d="M 64 24 C 64 24 80 44 80 68 L 74 78 L 54 78 L 48 68 C 48 44 64 24 64 24 Z" fill="#67E8F9" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="48" r="6" fill="#0891B2" />
    <polygon points="54,78 64,96 74,78" fill="#F97316" />
  </OrionSquircleBase>
);

// 101. Integration Gateway
export const IconIntegrationGateway: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-int-gw" from="#00F2FE" to="#0369A1" {...props}>
    {/* Perimeter Gateway Portals & Circuit Guard */}
    <rect x="28" y="28" width="72" height="72" rx="10" fill="#0284C7" stroke="#BAE6FD" strokeWidth="2" />
    <circle cx="64" cy="64" r="16" fill="#00F2FE" stroke="#FFFFFF" strokeWidth="2.5" />
    <line x1="18" y1="64" x2="28" y2="64" stroke="#00F2FE" strokeWidth="4" strokeLinecap="round" />
    <line x1="100" y1="64" x2="110" y2="64" stroke="#00F2FE" strokeWidth="4" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 102. Scale & Performance
export const IconScalePerformance: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-scale-perf" from="#059669" to="#022C22" {...props}>
    {/* High-Throughput Speedometer Gauge */}
    <path d="M 28 78 A 38 38 0 1 1 100 78" stroke="#6EE7B7" strokeWidth="6" strokeLinecap="round" fill="none" />
    <line x1="64" y1="78" x2="86" y2="46" stroke="#FEF08A" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="64" cy="78" r="6.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 103. Platform Maturity Center
export const IconPlatformMaturity: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-plat-mat" from="#047857" to="#064E3B" {...props}>
    {/* 5-Star Enterprise Maturity Trophy & Shield */}
    <path d="M 64 22 L 94 34 L 94 66 C 94 84 64 100 64 100 C 64 100 34 84 34 66 L 34 34 Z" fill="#10B981" stroke="#A7F3D0" strokeWidth="2.5" />
    <polygon points="64,42 68,52 78,54 70,62 72,72 64,66 56,72 58,62 50,54 60,52" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1" />
  </OrionSquircleBase>
);
