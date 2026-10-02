import React from 'react';
import { OrionSquircleBase } from '../OrionIconRegistry';

// 83. Master Data
export const IconMasterData: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-master-data" from="#3730A3" to="#1E1B4B" {...props}>
    {/* Authoritative Golden Master Cylinder & Records */}
    <ellipse cx="64" cy="38" rx="28" ry="10" fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="1.5" />
    <path d="M 36 38 L 36 58 C 36 64 48 68 64 68 C 80 68 92 64 92 58 L 92 38" fill="#6366F1" stroke="#818CF8" strokeWidth="1.5" />
    <path d="M 36 58 L 36 78 C 36 84 48 88 64 88 C 80 88 92 84 92 78 L 92 58" fill="#4F46E5" stroke="#6366F1" strokeWidth="1.5" />
    <path d="M 36 78 L 36 96 C 36 102 48 106 64 106 C 80 106 92 102 92 96 L 92 78" fill="#4338CA" stroke="#4F46E5" strokeWidth="1.5" />
    {/* Golden Authoritative Seal */}
    <circle cx="64" cy="68" r="6" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.5" />
  </OrionSquircleBase>
);

// 84. Reports
export const IconReports: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-reports" from="#312E81" to="#1E1B4B" {...props}>
    {/* Analytical Report Dossier & Precision Chart Bars */}
    <rect x="30" y="24" width="68" height="80" rx="8" fill="#F8FAFC" stroke="#C7D2FE" strokeWidth="1.2" />
    {/* Report Header Lines */}
    <line x1="40" y1="36" x2="68" y2="36" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="44" x2="88" y2="44" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    {/* Chart Baseline */}
    <line x1="38" y1="92" x2="90" y2="92" stroke="#CBD5E1" strokeWidth="1.5" />
    {/* Data Columns */}
    <rect x="42" y="70" width="9" height="22" rx="2" fill="#818CF8" />
    <rect x="55" y="56" width="9" height="36" rx="2" fill="#6366F1" />
    <rect x="68" y="64" width="9" height="28" rx="2" fill="#4F46E5" />
    <rect x="81" y="48" width="9" height="44" rx="2" fill="#4338CA" />
    {/* Growth Trend Accent Line */}
    <path d="M 46 68 L 59 52 L 72 60 L 85 44" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 85. Documents
export const IconDocuments: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-documents" from="#334155" to="#0F172A" {...props}>
    {/* Structured Enterprise Knowledge Document Folder */}
    <path d="M 26 36 L 50 36 L 58 44 L 102 44 L 102 96 L 26 96 Z" fill="#64748B" />
    <rect x="34" y="46" width="60" height="44" rx="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
    <line x1="42" y1="58" x2="74" y2="58" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="42" y1="68" x2="86" y2="68" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="42" y1="78" x2="80" y2="78" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 86. User Manual
export const IconUserManual: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-manual" from="#0E7490" to="#164E63" {...props}>
    {/* Hardcover Operator Reference Manual & Ribbon */}
    <rect x="30" y="24" width="68" height="80" rx="6" fill="#0891B2" stroke="#67E8F9" strokeWidth="1.5" />
    {/* Spine */}
    <rect x="30" y="24" width="12" height="80" rx="4" fill="#042F2E" />
    {/* Pages Rim */}
    <rect x="94" y="28" width="4" height="72" rx="1" fill="#F8FAFC" />
    {/* Bookmark Ribbon */}
    <path d="M 52 24 L 52 56 L 60 50 L 68 56 L 68 24 Z" fill="#F59E0B" />
    {/* Title Emblem */}
    <line x1="50" y1="68" x2="84" y2="68" stroke="#E0F2FE" strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="76" x2="76" y2="76" stroke="#A5F3FC" strokeWidth="1.8" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 87. Settings
export const IconSettings: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-settings" from="#334155" to="#1E293B" {...props}>
    {/* Precision Mechanical Gear */}
    {/* Gear Wheel Outer Teeth */}
    <g transform="translate(64, 64)">
      {/* 8 Intermeshing Teeth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <rect
          key={angle}
          x="-7"
          y="-38"
          width="14"
          height="12"
          rx="2.5"
          fill="#E2E8F0"
          stroke="#94A3B8"
          strokeWidth="1"
          transform={`rotate(${angle})`}
        />
      ))}
      {/* Gear Outer Rim */}
      <circle cx="0" cy="0" r="30" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
      {/* Recessed Gear Web */}
      <circle cx="0" cy="0" r="23" fill="#64748B" stroke="#475569" strokeWidth="1" />
      {/* 4 Weight Reduction Windows */}
      {[0, 90, 180, 270].map((angle) => (
        <circle
          key={`hole-${angle}`}
          cx={14 * Math.cos((angle * Math.PI) / 180)}
          cy={14 * Math.sin((angle * Math.PI) / 180)}
          r="4.5"
          fill="#334155"
        />
      ))}
      {/* Central Hub & Bore */}
      <circle cx="0" cy="0" r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
      <circle cx="0" cy="0" r="5" fill="#1E293B" />
      {/* Keyway Notch */}
      <rect x="-1.5" y="-7" width="3" height="3" fill="#1E293B" />
    </g>
  </OrionSquircleBase>
);

// 88. Data Lakehouse
export const IconData: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-data" from="#0369A1" to="#082F49" {...props}>
    {/* Enterprise Storage Server Drive Array */}
    <rect x="28" y="26" width="72" height="22" rx="4" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.5" />
    <circle cx="38" cy="37" r="3.5" fill="#34D399" />
    <line x1="50" y1="37" x2="88" y2="37" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
    <rect x="28" y="53" width="72" height="22" rx="4" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.5" />
    <circle cx="38" cy="64" r="3.5" fill="#34D399" />
    <line x1="50" y1="64" x2="88" y2="64" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
    <rect x="28" y="80" width="72" height="22" rx="4" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.5" />
    <circle cx="38" cy="91" r="3.5" fill="#FBBF24" />
    <line x1="50" y1="91" x2="88" y2="91" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 89. Data Quality
export const IconDataQuality: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-data-qual" from="#047857" to="#064E3B" {...props}>
    {/* Data Integrity Quality Seal & Checkmark */}
    <circle cx="64" cy="64" r="34" stroke="#6EE7B7" strokeWidth="2.5" fill="none" />
    <circle cx="64" cy="64" r="26" fill="#10B981" />
    <path d="M 48 64 L 59 75 L 80 53" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 90. Integrations
export const IconIntegrations: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-integrations" from="#4338CA" to="#1E1B4B" {...props}>
    {/* Enterprise Interconnect Hub Nodes */}
    <circle cx="38" cy="46" r="11" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="90" cy="46" r="11" fill="#A5B4FC" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="84" r="12" fill="#818CF8" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 47 52 L 56 75" stroke="#C7D2FE" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 81 52 L 72 75" stroke="#C7D2FE" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 50 46 L 78 46" stroke="#C7D2FE" strokeWidth="3.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 91. Observability
export const IconObservability: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-observability" from="#1E40AF" to="#172554" {...props}>
    {/* System Telemetry Lens & Dial */}
    <circle cx="64" cy="64" r="34" stroke="#93C5FD" strokeWidth="2.5" fill="none" />
    <circle cx="64" cy="64" r="22" stroke="#60A5FA" strokeWidth="2" fill="#1E3A8A" />
    <circle cx="64" cy="64" r="10" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
    <line x1="64" y1="46" x2="64" y2="54" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="64" y1="74" x2="64" y2="82" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="46" y1="64" x2="54" y2="64" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="74" y1="64" x2="82" y2="64" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 92. Sync Monitor
export const IconSync: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-sync" from="#0891B2" to="#155E75" {...props}>
    {/* Dual Circular Sync Arrows */}
    <path d="M 64 32 A 32 32 0 0 1 96 64" stroke="#A5F3FC" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <polygon points="96,52 96,72 78,72" fill="#A5F3FC" />
    <path d="M 64 96 A 32 32 0 0 1 32 64" stroke="#67E8F9" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <polygon points="32,76 32,56 50,56" fill="#67E8F9" />
  </OrionSquircleBase>
);

// 93. About ORION
export const IconAbout: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-about" from="#0F172A" to="#020617" {...props}>
    {/* Orion Sovereign Diamond Star & Crest */}
    <polygon points="64,26 73,48 98,52 79,69 85,94 64,81 43,94 49,69 30,52 55,48" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="64" cy="60" r="5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 94. Time & World
export const IconTimeWorld: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-time-world" from="#1E293B" to="#0F172A" {...props}>
    {/* Precision Analog Clock Dial */}
    {/* Outer Bezel */}
    <circle cx="64" cy="64" r="38" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="3" />
    {/* 12 Hour Tick Marks */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
      <line
        key={deg}
        x1="64"
        y1={deg % 90 === 0 ? "30" : "32"}
        x2="64"
        y2={deg % 90 === 0 ? "37" : "35"}
        stroke="#475569"
        strokeWidth={deg % 90 === 0 ? "2.5" : "1.2"}
        strokeLinecap="round"
        transform={`rotate(${deg} 64 64)`}
      />
    ))}
    {/* Hour Hand (pointing at 10:10) */}
    <line x1="64" y1="64" x2="48" y2="44" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
    {/* Minute Hand */}
    <line x1="64" y1="64" x2="82" y2="48" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
    {/* Orange Sweeping Second Hand */}
    <line x1="64" y1="72" x2="64" y2="34" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    {/* Central Pivot Cap */}
    <circle cx="64" cy="64" r="3.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
  </OrionSquircleBase>
);

// 95. Profile
export const IconProfile: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-profile" from="#1E40AF" to="#1E3A8A" {...props}>
    {/* Operator User Card & Portrait Avatar */}
    <circle cx="64" cy="46" r="16" fill="#DBEAFE" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 38 90 C 38 74 50 70 64 70 C 78 70 90 74 90 90 Z" fill="#93C5FD" stroke="#FFFFFF" strokeWidth="2" />
  </OrionSquircleBase>
);

// 96. Organization
export const IconOrganization: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-org" from="#581C87" to="#3B0764" {...props}>
    {/* Enterprise Corporate Headquarters Building */}
    <rect x="40" y="30" width="48" height="68" rx="4" fill="#C4B5FD" stroke="#FFFFFF" strokeWidth="2" />
    {/* Glass Windows */}
    <rect x="46" y="40" width="8" height="8" rx="1.5" fill="#581C87" />
    <rect x="60" y="40" width="8" height="8" rx="1.5" fill="#581C87" />
    <rect x="74" y="40" width="8" height="8" rx="1.5" fill="#581C87" />
    <rect x="46" y="54" width="8" height="8" rx="1.5" fill="#581C87" />
    <rect x="60" y="54" width="8" height="8" rx="1.5" fill="#581C87" />
    <rect x="74" y="54" width="8" height="8" rx="1.5" fill="#581C87" />
    {/* Double Entry Doors */}
    <rect x="58" y="74" width="12" height="24" rx="2" fill="#3B0764" />
  </OrionSquircleBase>
);

// 97. Platform Intelligence
export const IconPlatformIntelligence: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-plat-intel" from="#4C1D95" to="#1E1B4B" {...props}>
    {/* Enterprise Processor Architecture */}
    <rect x="34" y="34" width="60" height="60" rx="8" fill="#6D28D9" stroke="#DDD6FE" strokeWidth="2" />
    <rect x="46" y="46" width="36" height="36" rx="4" fill="#8B5CF6" />
    {/* Pins */}
    <line x1="64" y1="24" x2="64" y2="34" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="94" x2="64" y2="104" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    <line x1="24" y1="64" x2="34" y2="64" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    <line x1="94" y1="64" x2="104" y2="64" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 98. Production Readiness
export const IconProductionReadiness: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-prod-ready" from="#047857" to="#064E3B" {...props}>
    {/* Production Go-Live Certified Ribbon */}
    <circle cx="64" cy="54" r="26" fill="#10B981" stroke="#6EE7B7" strokeWidth="2" />
    <path d="M 52 54 L 60 62 L 76 46" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <polygon points="52,74 44,98 56,92 64,98 64,78" fill="#059669" />
    <polygon points="76,74 84,98 72,92 64,98 64,78" fill="#047857" />
  </OrionSquircleBase>
);

// 99. Configuration Center
export const IconConfigurationCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-config-ctr" from="#475569" to="#0F172A" {...props}>
    {/* System Console Sliders / Equalizer */}
    <rect x="28" y="24" width="72" height="80" rx="8" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
    <line x1="44" y1="36" x2="44" y2="92" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="36" x2="64" y2="92" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <line x1="84" y1="36" x2="84" y2="92" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    {/* Slider Knobs */}
    <circle cx="44" cy="50" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="64" cy="74" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="84" cy="44" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
  </OrionSquircleBase>
);

// 100. Release Center
export const IconReleaseCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-release-ctr" from="#0E7490" to="#164E63" {...props}>
    {/* Deployment Shipping Container / Package Dispatch */}
    <path d="M 64 26 L 94 42 L 94 78 L 64 94 L 34 78 L 34 42 Z" fill="#0891B2" stroke="#67E8F9" strokeWidth="2" />
    <line x1="64" y1="26" x2="64" y2="94" stroke="#164E63" strokeWidth="2" />
    <line x1="34" y1="42" x2="64" y2="58" stroke="#164E63" strokeWidth="2" />
    <line x1="94" y1="42" x2="64" y2="58" stroke="#164E63" strokeWidth="2" />
    <polygon points="64,36 74,42 64,48 54,42" fill="#FEF08A" />
  </OrionSquircleBase>
);

// 101. Integration Gateway
export const IconIntegrationGateway: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-int-gw" from="#0284C7" to="#0369A1" {...props}>
    {/* Network Gateway Router & Ports */}
    <rect x="28" y="38" width="72" height="42" rx="6" fill="#075985" stroke="#7DD3FC" strokeWidth="2" />
    <circle cx="42" cy="59" r="4" fill="#34D399" />
    <circle cx="56" cy="59" r="4" fill="#34D399" />
    <circle cx="70" cy="59" r="4" fill="#34D399" />
    <circle cx="84" cy="59" r="4" fill="#38BDF8" />
    <line x1="42" y1="38" x2="42" y2="28" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
    <line x1="84" y1="38" x2="84" y2="28" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 102. Scale & Performance
export const IconScalePerformance: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-scale-perf" from="#065F46" to="#022C22" {...props}>
    {/* Speedometer Instrument Gauge */}
    <path d="M 32 78 A 36 36 0 1 1 96 78" stroke="#6EE7B7" strokeWidth="6" strokeLinecap="round" fill="none" />
    <line x1="64" y1="78" x2="86" y2="50" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="64" cy="78" r="6" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 103. Platform Maturity Center
export const IconPlatformMaturity: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-plat-mat" from="#047857" to="#064E3B" {...props}>
    {/* Enterprise Maturity Shield & Star */}
    <path d="M 64 24 L 94 36 L 94 66 C 94 84 64 98 64 98 C 64 98 34 84 34 66 L 34 36 Z" fill="#10B981" stroke="#A7F3D0" strokeWidth="2" />
    <polygon points="64,44 68,54 78,56 70,64 72,74 64,68 56,74 58,64 50,56 60,54" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1" />
  </OrionSquircleBase>
);

// 104. File Manager (File Explorer)
export const IconFileManager: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-file-mgr" from="#0284C7" to="#0F172A" {...props}>
    {/* Multi-tier Desktop OS Folder */}
    <path d="M 24 34 C 24 30 27 26 31 26 L 54 26 C 58 26 61 28 63 32 L 67 38 L 97 38 C 102 38 106 42 106 47 L 106 94 C 106 99 102 103 97 103 L 31 103 C 27 103 24 99 24 94 Z" fill="#0369A1" />
    {/* White Paper Tab Preview */}
    <rect x="34" y="34" width="60" height="24" rx="3" fill="#F8FAFC" />
    {/* Front Folder Pocket */}
    <path d="M 22 46 C 22 43 24 41 27 41 L 101 41 C 104 41 106 43 106 46 L 106 94 C 106 100 101 104 95 104 L 33 104 C 27 104 22 100 22 94 Z" fill="#38BDF8" stroke="#7DD3FC" strokeWidth="1" />
    {/* Top Rim Sheen */}
    <line x1="26" y1="42" x2="102" y2="42" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 105. Notepad
export const IconNotepad: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-notepad" from="#D97706" to="#78350F" {...props}>
    {/* Ruled Legal Memo Notepad & Pencil */}
    <rect x="30" y="22" width="68" height="84" rx="6" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
    {/* Top Binding Tape */}
    <rect x="30" y="22" width="68" height="14" rx="4" fill="#B45309" />
    {/* Ruled Note Lines */}
    <line x1="44" y1="46" x2="88" y2="46" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="44" y1="56" x2="88" y2="56" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="44" y1="66" x2="88" y2="66" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="44" y1="76" x2="88" y2="76" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="44" y1="86" x2="72" y2="86" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    {/* Red Left Margin Line */}
    <line x1="40" y1="36" x2="40" y2="98" stroke="#F87171" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    {/* Precision Yellow Pencil */}
    <g transform="translate(74, 62) rotate(45)">
      <rect x="0" y="0" width="8" height="34" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
      <polygon points="0,34 8,34 4,44" fill="#FDE68A" />
      <polygon points="3,42 5,42 4,44" fill="#1E293B" />
      <rect x="0" y="-5" width="8" height="5" rx="1" fill="#F43F5E" />
    </g>
  </OrionSquircleBase>
);

// 106. Orion Computer ("This PC")
export const IconOrionComputer: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-orion-comp" from="#334155" to="#0F172A" {...props}>
    {/* All-in-One Aluminum Workstation Computer */}
    {/* Screen Outer Aluminum Shell */}
    <rect x="24" y="26" width="80" height="56" rx="6" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Inner Glass Display Screen */}
    <rect x="28" y="30" width="72" height="44" rx="3" fill="#0284C7" />
    {/* Horizon Wallpaper on Screen */}
    <path d="M 28 62 L 48 48 L 68 58 L 86 42 L 100 52 L 100 74 L 28 74 Z" fill="#0369A1" />
    <circle cx="84" cy="40" r="4" fill="#FEF08A" />
    {/* Metallic Pedestal Stand */}
    <polygon points="56,82 72,82 76,96 52,96" fill="#94A3B8" />
    <rect x="44" y="96" width="40" height="4" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
    {/* Power LED Indicator */}
    <circle cx="64" cy="78" r="1.5" fill="#34D399" />
  </OrionSquircleBase>
);

// 107. Recycle Bin
export const IconRecycleBin: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-recycle-bin" from="#475569" to="#1E293B" {...props}>
    {/* Ribbed Metallic Waste Canister with Green Möbius Loop */}
    {/* Canister Body */}
    <path d="M 38 42 L 90 42 L 84 96 C 84 99 81 102 78 102 L 50 102 C 47 102 44 99 44 96 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Canister Lid Rim */}
    <rect x="34" y="38" width="60" height="6" rx="2.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
    {/* Lid Handle */}
    <path d="M 54 38 L 54 32 C 54 30 56 28 58 28 L 70 28 C 72 28 74 30 74 32 L 74 38" stroke="#94A3B8" strokeWidth="2" fill="none" />
    {/* Vertical Canister Ribs */}
    <line x1="52" y1="48" x2="50" y2="92" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="64" y1="48" x2="64" y2="92" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="76" y1="48" x2="78" y2="92" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    {/* Embossed Green Möbius Recycling Loop */}
    <g transform="translate(64, 70) scale(0.7)">
      <circle cx="0" cy="0" r="14" fill="#10B981" />
      <path d="M -6 -4 L 0 -10 L 6 -4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 6 0 L 10 7 L 3 9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M -3 7 L -10 4 L -7 -3" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  </OrionSquircleBase>
);

// 108. Orion Documents
export const IconOrionDocuments: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-orion-docs" from="#0284C7" to="#0369A1" {...props}>
    {/* Enterprise Word Processor Document */}
    <rect x="32" y="22" width="64" height="84" rx="6" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
    <path d="M 68 22 L 96 50 L 68 50 Z" fill="#BAE6FD" />
    <line x1="42" y1="42" x2="62" y2="42" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="42" y1="56" x2="86" y2="56" stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="42" y1="68" x2="86" y2="68" stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="42" y1="80" x2="72" y2="80" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 109. Orion Sheets
export const IconOrionSheets: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-orion-sheets" from="#059669" to="#064E3B" {...props}>
    {/* Enterprise Spreadsheet Ledger Table */}
    <rect x="28" y="24" width="72" height="80" rx="6" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="1.5" />
    <rect x="28" y="24" width="72" height="18" rx="6" fill="#10B981" />
    <line x1="28" y1="42" x2="100" y2="42" stroke="#059669" strokeWidth="1.5" />
    <line x1="28" y1="62" x2="100" y2="62" stroke="#A7F3D0" strokeWidth="1.5" />
    <line x1="28" y1="82" x2="100" y2="82" stroke="#A7F3D0" strokeWidth="1.5" />
    <line x1="52" y1="24" x2="52" y2="104" stroke="#A7F3D0" strokeWidth="1.5" />
    <line x1="76" y1="24" x2="76" y2="104" stroke="#A7F3D0" strokeWidth="1.5" />
  </OrionSquircleBase>
);

// 110. Orion Slides
export const IconOrionSlides: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-orion-slides" from="#D97706" to="#78350F" {...props}>
    {/* Presentation Projection Easel & Slide */}
    <rect x="26" y="28" width="76" height="54" rx="6" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
    <rect x="34" y="38" width="26" height="32" rx="3" fill="#F59E0B" />
    <circle cx="76" cy="54" r="11" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
    {/* Stand */}
    <line x1="64" y1="82" x2="64" y2="98" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
    <line x1="46" y1="98" x2="82" y2="98" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 111. Orion PDF
export const IconOrionPdf: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-orion-pdf" from="#DC2626" to="#7F1D1D" {...props}>
    {/* Certified PDF Document Dossier */}
    <rect x="32" y="22" width="64" height="84" rx="6" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1.5" />
    <path d="M 40 40 L 88 40 L 88 54 L 40 54 Z" fill="#EF4444" rx="2" />
    <text x="64" y="51" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    <line x1="44" y1="66" x2="84" y2="66" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <line x1="44" y1="76" x2="84" y2="76" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <line x1="44" y1="86" x2="68" y2="86" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
  </OrionSquircleBase>
);



