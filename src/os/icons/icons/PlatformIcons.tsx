import React from 'react';
import { OrionIconArtworkProps } from '../OrionIconTheme';
import { OrionSquircleBase, useOrionIconDetail, useOrionIconIds } from '../OrionSquircleBase';

// 87. Master Data & Integration Fabric (Golden-Core Titanium Cylinder Platter Vault)
export const IconMasterData: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('mdata');
  return (
    <OrionSquircleBase gradientId="icon-master-data" from="#4F46E5" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-disc`} x1="32" y1="28" x2="96" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#A5B4FC" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <path d="M 34 78 L 34 94 C 34 100 47.4 105 64 105 C 80.6 105 94 100 94 94 L 94 78" fill="#312E81" stroke="#818CF8" strokeWidth="1.5" />
      <path d="M 34 58 L 34 76 C 34 82 47.4 87 64 87 C 80.6 87 94 82 94 76 L 94 58" fill="#4338CA" stroke="#A5B4FC" strokeWidth="1.5" />
      <path d="M 34 38 L 34 56 C 34 62 47.4 67 64 67 C 80.6 67 94 62 94 56 L 94 38" fill="#4F46E5" stroke="#C7D2FE" strokeWidth="1.5" />
      <ellipse cx="64" cy="38" rx="30" ry="11" fill={`url(#${id}-disc)`} />
      <circle cx="64" cy="69" r="7.5" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1.8" />
    </OrionSquircleBase>
  );
};

// 88. Reports (Executive Ivory Dossier & Layered 3D Analytics Bars)
export const IconReports: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('reps');
  return (
    <OrionSquircleBase gradientId="icon-reports" from="#4338CA" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-card`} x1="28" y1="22" x2="100" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>
      <rect x="28" y="24" width="72" height="82" rx="10" fill="#1E1B4B" fillOpacity="0.4" transform="translate(2, 3)" />
      <rect x="28" y="22" width="72" height="82" rx="10" fill={`url(#${id}-card)`} />
      <line x1="39" y1="36" x2="68" y2="36" stroke="#312E81" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="39" y1="44" x2="89" y2="44" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <rect x="39" y="68" width="10" height="24" rx="2.5" fill="#818CF8" />
      <rect x="53" y="56" width="10" height="36" rx="2.5" fill="#6366F1" />
      <rect x="67" y="62" width="10" height="30" rx="2.5" fill="#4F46E5" />
      <rect x="81" y="48" width="10" height="44" rx="2.5" fill="#312E81" />
      <path d="M 44 64 L 58 51 L 72 57 L 86 43" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 89. Documents (Architectural Knowledge Binder Folder & Pages)
export const IconDocuments: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('docs-f');
  return (
    <OrionSquircleBase gradientId="icon-documents" from="#475569" to="#0F172A" accent="#94A3B8" {...props}>
      <defs>
        <linearGradient id={`${id}-flap`} x1="24" y1="38" x2="104" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <path d="M 24 38 C 24 34 27 31 31 31 L 52 31 L 60 40 L 97 40 C 101 40 104 43 104 47 L 104 94 C 104 98 101 101 97 101 L 31 101 C 27 101 24 98 24 94 Z" fill="#334155" />
      <rect x="31" y="44" width="66" height="48" rx="6" fill="#FFFFFF" />
      <path d="M 24 54 L 104 54 L 104 95 C 104 98.5 101.5 101 98 101 L 30 101 C 26.5 101 24 98.5 24 95 Z" fill={`url(#${id}-flap)`} fillOpacity="0.9" />
      <line x1="40" y1="70" x2="88" y2="70" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="81" x2="72" y2="81" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 90. User Manual (Cobalt Cloth Spine Reference Book & Gold Bookmark Ribbon)
export const IconUserManual: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('man');
  return (
    <OrionSquircleBase gradientId="icon-manual" from="#0891B2" to="#164E63" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-cover`} x1="30" y1="22" x2="98" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0E7490" />
        </linearGradient>
      </defs>
      <rect x="30" y="24" width="68" height="80" rx="8" fill={`url(#${id}-cover)`} stroke="#A5F3FC" strokeWidth="1.4" />
      <rect x="30" y="24" width="13" height="80" rx="4" fill="#083344" />
      <rect x="93" y="29" width="4" height="70" rx="1.5" fill="#F8FAFC" />
      <path d="M 52 24 L 52 60 L 60 53 L 68 60 L 68 24 Z" fill="#FBBF24" />
      <line x1="52" y1="72" x2="84" y2="72" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <line x1="52" y1="81" x2="76" y2="81" stroke="#CFFAFE" strokeWidth="2.2" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 91. Settings (Machined Anodized Titanium Planetary Gear)
export const IconSettings: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('set');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-settings" from="#475569" to="#1E293B" accent="#94A3B8" {...props}>
      <defs>
        <linearGradient id={`${id}-gear`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="52%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <g transform="translate(64, 64)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <rect key={angle} x="-6.5" y="-39" width="13" height="12" rx="3" fill={`url(#${id}-gear)`} transform={`rotate(${angle})`} />
        ))}
        <circle cx="0" cy="0" r="30" fill={`url(#${id}-gear)`} stroke="#F8FAFC" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="21" fill="#334155" stroke="#94A3B8" strokeWidth="1.2" />
        {!isMicro && [0, 90, 180, 270].map((a) => (
          <circle key={a} cx={14 * Math.cos((a * Math.PI) / 180)} cy={14 * Math.sin((a * Math.PI) / 180)} r="3.5" fill="#1E293B" />
        ))}
        <circle cx="0" cy="0" r="10" fill={`url(#${id}-gear)`} />
        <circle cx="0" cy="0" r="4.5" fill="#0F172A" />
      </g>
    </OrionSquircleBase>
  );
};

// 92. Data Center (Rack-Mount Drive Blades & Emerald Status LEDs)
export const IconData: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('data-c');
  return (
    <OrionSquircleBase gradientId="icon-data" from="#0284C7" to="#082F49" accent="#0EA5E9" {...props}>
      <defs>
        <linearGradient id={`${id}-bay`} x1="26" y1="24" x2="102" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <rect x="24" y="25" width="80" height="22" rx="6" fill={`url(#${id}-bay)`} />
      <circle cx="36" cy="36" r="4" fill="#10B981" />
      <rect x="48" y="33.5" width="44" height="5" rx="2.5" fill="#0369A1" />

      <rect x="24" y="53" width="80" height="22" rx="6" fill={`url(#${id}-bay)`} />
      <circle cx="36" cy="64" r="4" fill="#10B981" />
      <rect x="48" y="61.5" width="44" height="5" rx="2.5" fill="#0369A1" />

      <rect x="24" y="81" width="80" height="22" rx="6" fill={`url(#${id}-bay)`} />
      <circle cx="36" cy="92" r="4" fill="#FBBF24" />
      <rect x="48" y="89.5" width="44" height="5" rx="2.5" fill="#0369A1" />
    </OrionSquircleBase>
  );
};

// 93. Data Quality (Structured Verification Grid & Emerald Tick Lens)
export const IconDataQuality: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('dqual');
  return (
    <OrionSquircleBase gradientId="icon-data-qual" from="#059669" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-tbl`} x1="26" y1="26" x2="102" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>
      <rect x="24" y="26" width="80" height="76" rx="10" fill={`url(#${id}-tbl)`} />
      <rect x="24" y="26" width="80" height="16" rx="8" fill="#065F46" />
      <line x1="34" y1="54" x2="64" y2="54" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="34" y1="69" x2="60" y2="69" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="34" y1="84" x2="54" y2="84" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="80" cy="74" r="16" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M 73 74 L 78 79 L 87 69" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 94. Integrations (Molded Industrial Coupler Plug & Socket Bridge)
export const IconIntegrations: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('integ');
  return (
    <OrionSquircleBase gradientId="icon-integrations" from="#4F46E5" to="#1E1B4B" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-plug`} x1="24" y1="32" x2="104" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>
      </defs>
      <path d="M 22 76 L 44 54 L 62 72 L 40 94 Z" fill={`url(#${id}-plug)`} />
      <path d="M 106 52 L 84 74 L 66 56 L 88 34 Z" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.6" />
      <line x1="56" y1="50" x2="66" y2="40" stroke="#FBBF24" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="68" y1="62" x2="78" y2="52" stroke="#FBBF24" strokeWidth="4.5" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 95. Observability (Precision Multi-Coated Telescope & Optical Eye)
export const IconObservability: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('obs');
  return (
    <OrionSquircleBase gradientId="icon-observability" from="#1D4ED8" to="#172554" accent="#3B82F6" {...props}>
      <defs>
        <radialGradient id={`${id}-pupil`} cx="40%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
      </defs>
      <path d="M 18 64 C 30 40 46 32 64 32 C 82 32 98 40 110 64 C 98 88 82 96 64 96 C 46 96 30 88 18 64 Z" fill="#FFFFFF" />
      <circle cx="64" cy="64" r="21" fill={`url(#${id}-pupil)`} stroke="#DBEAFE" strokeWidth="2" />
      <circle cx="64" cy="64" r="8.5" fill="#0F172A" />
      <circle cx="57" cy="57" r="3.5" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 96. Sync Monitor (Chrome Twin Orbital Sync Arrows & Core)
export const IconSync: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('sync');
  return (
    <OrionSquircleBase gradientId="icon-sync" from="#0891B2" to="#155E75" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-arc`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A5F3FC" />
        </linearGradient>
      </defs>
      <path d="M 32 52 A 34 34 0 0 1 92 42" stroke={`url(#${id}-arc)`} strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <polygon points="96,46 82,34 99,29" fill="#FFFFFF" />
      <path d="M 96 76 A 34 34 0 0 1 36 86" stroke="#22D3EE" strokeWidth="6.5" strokeLinecap="round" fill="none" />
      <polygon points="32,82 46,94 29,99" fill="#22D3EE" />
      <circle cx="64" cy="64" r="8" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 97. About ORION (Dimensional Orion Orbital Planet & Waypoint Star)
export const IconAbout: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('about');
  return (
    <OrionSquircleBase gradientId="icon-about" from="#0F172A" to="#020617" accent="#00F2FE" {...props}>
      <defs>
        <radialGradient id={`${id}-orb`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0284C7" />
        </radialGradient>
      </defs>
      <ellipse cx="64" cy="64" rx="40" ry="15" transform="rotate(-24 64 64)" stroke="#00F2FE" strokeWidth="3.5" fill="none" />
      <circle cx="64" cy="64" r="19" fill={`url(#${id}-orb)`} stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="64" cy="64" r="6" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 98. Time & World (Brushed Chrome Analog World Chronometer Dial)
export const IconTimeWorld: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('tworld');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-time-world" from="#0284C7" to="#075985" accent="#0EA5E9" {...props}>
      <defs>
        <linearGradient id={`${id}-dial`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="35" fill={`url(#${id}-dial)`} stroke="#BAE6FD" strokeWidth="2" />
      <circle cx="64" cy="64" r="30" fill="#0F172A" />
      {!isMicro && [0, 90, 180, 270].map((a) => (
        <rect key={a} x="-1.5" y="-27" width="3" height="6" rx="1" fill="#7DD3FC" transform={`translate(64,64) rotate(${a})`} />
      ))}
      <line x1="64" y1="64" x2="64" y2="44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <line x1="64" y1="64" x2="80" y2="70" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="64" cy="64" r="4" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 99. User Profile (Frosted Identity Medallion & Sculpted Bust)
export const IconProfile: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('prof');
  return (
    <OrionSquircleBase gradientId="icon-profile" from="#2563EB" to="#1E3A8A" accent="#3B82F6" {...props}>
      <defs>
        <linearGradient id={`${id}-bust`} x1="36" y1="30" x2="92" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="46" r="16" fill={`url(#${id}-bust)`} />
      <path d="M 32 94 C 32 74 46 66 64 66 C 82 66 96 74 96 94 C 96 98 92 101 87 101 L 41 101 C 36 101 32 98 32 94 Z" fill={`url(#${id}-bust)`} />
    </OrionSquircleBase>
  );
};

// 100. Organization (Classical Pillared Enterprise Pavilion & Pediment)
export const IconOrganization: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('org');
  return (
    <OrionSquircleBase gradientId="icon-org" from="#6D28D9" to="#3B0764" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-stone`} x1="28" y1="26" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      <polygon points="64,24 102,46 26,46" fill={`url(#${id}-stone)`} stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="34" y="48" width="10" height="38" rx="2" fill="#EDE9FE" />
      <rect x="59" y="48" width="10" height="38" rx="2" fill="#EDE9FE" />
      <rect x="84" y="48" width="10" height="38" rx="2" fill="#EDE9FE" />
      <rect x="24" y="88" width="80" height="10" rx="4" fill="#FBBF24" />
    </OrionSquircleBase>
  );
};

// 101. Platform Intelligence (Illuminated Neural Silicon Core Die)
export const IconPlatformIntelligence: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('pl-int');
  return (
    <OrionSquircleBase gradientId="icon-plat-intel" from="#581C87" to="#1E1B4B" accent="#A855F7" {...props}>
      <defs>
        <linearGradient id={`${id}-chip`} x1="34" y1="34" x2="94" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <rect x="32" y="32" width="64" height="64" rx="14" fill="#3B0764" stroke="#E9D5FF" strokeWidth="2" />
      <rect x="44" y="44" width="40" height="40" rx="8" fill={`url(#${id}-chip)`} />
      <circle cx="64" cy="64" r="8" fill="#581C87" />
      <circle cx="64" cy="64" r="3.5" fill="#00F2FE" />
    </OrionSquircleBase>
  );
};

// 102. Production Readiness (Clipboard Go-Flight Checklist & Badge)
export const IconProductionReadiness: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('pr-rdy');
  return (
    <OrionSquircleBase gradientId="icon-prod-ready" from="#059669" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-board`} x1="30" y1="26" x2="98" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>
      <rect x="30" y="28" width="68" height="76" rx="10" fill={`url(#${id}-board)`} />
      <rect x="48" y="21" width="32" height="12" rx="4" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.4" />
      <path d="M 41 52 L 45 56 L 52 48" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="59" y1="52" x2="86" y2="52" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
      <path d="M 41 70 L 45 74 L 52 66" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="59" y1="70" x2="86" y2="70" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
      <path d="M 41 88 L 45 92 L 52 84" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="59" y1="88" x2="78" y2="88" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 103. Configuration Center (Tactile Three-Band Metallic Console Faders)
export const IconConfigurationCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('cfg-c');
  return (
    <OrionSquircleBase gradientId="icon-config-ctr" from="#475569" to="#0F172A" accent="#94A3B8" {...props}>
      <defs>
        <linearGradient id={`${id}-cap`} x1="0" y1="24" x2="0" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      <line x1="40" y1="28" x2="40" y2="100" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" />
      <line x1="64" y1="28" x2="64" y2="100" stroke="#34D399" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" />
      <line x1="88" y1="28" x2="88" y2="100" stroke="#FBBF24" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" />
      <rect x="31" y="42" width="18" height="12" rx="6" fill={`url(#${id}-cap)`} />
      <rect x="55" y="72" width="18" height="12" rx="6" fill={`url(#${id}-cap)`} />
      <rect x="79" y="50" width="18" height="12" rx="6" fill={`url(#${id}-cap)`} />
    </OrionSquircleBase>
  );
};

// 104. Release Center (Ceramic & Cobalt Orbital Rocket Liftoff)
export const IconReleaseCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('rel-c');
  return (
    <OrionSquircleBase gradientId="icon-release-ctr" from="#0E7490" to="#164E63" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-hull`} x1="44" y1="22" x2="84" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CFFAFE" />
        </linearGradient>
      </defs>
      {/* Boost flame */}
      <path d="M 56 86 Q 64 108 72 86 Z" fill="#FBBF24" />
      {/* Fins */}
      <polygon points="48,68 34,84 50,82" fill="#F43F5E" />
      <polygon points="80,68 94,84 78,82" fill="#F43F5E" />
      {/* Fuselage */}
      <path d="M 64 20 C 78 36 80 62 76 84 L 52 84 C 48 62 50 36 64 20 Z" fill={`url(#${id}-hull)`} />
      <circle cx="64" cy="48" r="8" fill="#0891B2" stroke="#FFFFFF" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 105. Integration Gateway (Arched Steel Portal & Data Packet Conduit)
export const IconIntegrationGateway: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('int-gw');
  return (
    <OrionSquircleBase gradientId="icon-int-gw" from="#0284C7" to="#0369A1" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-arch`} x1="28" y1="28" x2="100" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <path d="M 32 94 L 32 58 C 32 40.3 46.3 26 64 26 C 81.7 26 96 40.3 96 58 L 96 94" stroke={`url(#${id}-arch)`} strokeWidth="9" strokeLinecap="round" fill="none" />
      <line x1="20" y1="74" x2="108" y2="74" stroke="#00F2FE" strokeWidth="4" strokeLinecap="round" />
      <circle cx="64" cy="74" r="9" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2.2" />
    </OrionSquircleBase>
  );
};

// 106. Scale & Performance (High-Velocity Turbofan Rotor Blades)
export const IconScalePerformance: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('sc-perf');
  return (
    <OrionSquircleBase gradientId="icon-scale-perf" from="#059669" to="#022C22" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-ring`} x1="28" y1="28" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="35" stroke={`url(#${id}-ring)`} strokeWidth="5" fill="#064E3B" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M 0 0 C 8 -14 22 -22 28 -10 C 20 0 10 -2 0 0 Z" fill="#A7F3D0" transform={`translate(64,64) rotate(${a})`} />
      ))}
      <circle cx="64" cy="64" r="9" fill="#FFFFFF" stroke="#059669" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 107. Platform Maturity Center (Faceted Emerald Diamond Gemstone)
export const IconPlatformMaturity: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('plat-mat');
  return (
    <OrionSquircleBase gradientId="icon-plat-mat" from="#047857" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-gem`} x1="28" y1="28" x2="100" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
      </defs>
      <polygon points="42,32 86,32 102,52 64,98 26,52" fill={`url(#${id}-gem)`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="42,32 86,32 76,52 52,52" fill="#A7F3D0" />
      <polygon points="52,52 76,52 64,98" fill="#10B981" fillOpacity="0.65" />
    </OrionSquircleBase>
  );
};

// 108. File Explorer (Sculpted Sky-Blue Layered Desktop Folder)
export const IconFileManager: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('fm');
  return (
    <OrionSquircleBase gradientId="icon-file-mgr" from="#0284C7" to="#0F172A" accent="#38BDF8" {...props}>
      <defs>
        <linearGradient id={`${id}-front`} x1="22" y1="48" x2="106" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <path d="M 22 40 C 22 35.6 25.6 32 30 32 L 54 32 L 62 42 L 98 42 C 102.4 42 106 45.6 106 50 L 106 94 C 106 98.4 102.4 102 98 102 L 30 102 C 25.6 102 22 98.4 22 94 Z" fill="#0369A1" />
      <rect x="29" y="42" width="70" height="18" rx="4" fill="#FFFFFF" fillOpacity="0.92" />
      <path d="M 22 54 C 22 50.7 24.7 48 28 48 L 100 48 C 103.3 48 106 50.7 106 54 L 106 94 C 106 98.4 102.4 102 98 102 L 30 102 C 25.6 102 22 98.4 22 94 Z" fill={`url(#${id}-front)`} stroke="#BAE6FD" strokeWidth="1.2" />
    </OrionSquircleBase>
  );
};

// 109. Notepad (Spiral-Bound Ivory Memo Pad & Ruled Ink)
export const IconNotepad: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('note');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-notepad" from="#0284C7" to="#0E7490" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-pad`} x1="30" y1="26" x2="98" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FEF9C3" />
        </linearGradient>
      </defs>
      <rect x="30" y="28" width="68" height="76" rx="10" fill={`url(#${id}-pad)`} />
      <rect x="30" y="28" width="68" height="15" rx="7" fill="#F59E0B" />
      {!isMicro && [42, 53, 64, 75, 86].map((x) => (
        <rect key={x} x={x - 2} y="21" width="4" height="12" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
      ))}
      <line x1="40" y1="56" x2="88" y2="56" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="70" x2="88" y2="70" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="84" x2="72" y2="84" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 110. This Computer (Sculpted Anodized All-in-One Desktop Display & Stand)
export const IconOrionComputer: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('comp');
  return (
    <OrionSquircleBase gradientId="icon-orion-comp" from="#4F46E5" to="#0F172A" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-scr`} x1="26" y1="28" x2="102" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
      </defs>
      <path d="M 54 84 L 74 84 L 82 100 L 46 100 Z" fill="#CBD5E1" />
      <rect x="20" y="24" width="88" height="62" rx="9" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
      <rect x="25" y="29" width="78" height="46" rx="5" fill={`url(#${id}-scr)`} />
      <circle cx="64" cy="80.5" r="2.5" fill="#475569" />
    </OrionSquircleBase>
  );
};

// 111. Recycle Bin (Translucent Fluted Chrome Waste Bin & Recycling Symbol)
export const IconRecycleBin: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('rbin');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-recycle-bin" from="#E11D48" to="#4C0519" accent="#FB7185" {...props}>
      <defs>
        <linearGradient id={`${id}-cup`} x1="34" y1="36" x2="94" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FECDD3" stopOpacity="0.82" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="36" rx="28" ry="6" fill="#FFFFFF" />
      <path d="M 36 36 L 44 96 C 44.5 99.5 52 102 64 102 C 76 102 83.5 99.5 84 96 L 92 36 Z" fill={`url(#${id}-cup)`} />
      {!isMicro && (
        <>
          <line x1="50" y1="45" x2="53" y2="95" stroke="#9F1239" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="64" y1="45" x2="64" y2="96" stroke="#9F1239" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="78" y1="45" x2="75" y2="95" stroke="#9F1239" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      <circle cx="64" cy="69" r="11" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M 59 69 L 64 62 L 69 69 L 64 76 Z" fill="#FFFFFF" />
    </OrionSquircleBase>
  );
};

// 112. Orion Documents (Ivory Folded-Corner Sheet & Sapphire Header)
export const IconOrionDocuments: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('odocs');
  return (
    <OrionSquircleBase gradientId="icon-orion-docs" from="#0284C7" to="#0369A1" accent="#38BDF8" {...props}>
      <defs>
        <linearGradient id={`${id}-page`} x1="32" y1="22" x2="96" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
      <path d="M 32 28 C 32 24.7 34.7 22 38 22 L 76 22 L 96 42 L 96 98 C 96 101.3 93.3 104 90 104 L 38 104 C 34.7 104 32 101.3 32 98 Z" fill={`url(#${id}-page)`} />
      <path d="M 76 22 L 76 38 C 76 40.2 77.8 42 80 42 L 96 42 Z" fill="#7DD3FC" />
      <rect x="42" y="38" width="24" height="7" rx="3.5" fill="#0284C7" />
      <line x1="42" y1="56" x2="86" y2="56" stroke="#0369A1" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="42" y1="70" x2="86" y2="70" stroke="#64748B" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="42" y1="84" x2="72" y2="84" stroke="#64748B" strokeWidth="2.8" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 113. Orion Sheets (Emerald Workbook Cell Matrix & Highlighted Cell)
export const IconOrionSheets: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('osheets');
  return (
    <OrionSquircleBase gradientId="icon-orion-sheets" from="#059669" to="#064E3B" accent="#34D399" {...props}>
      <defs>
        <linearGradient id={`${id}-grid`} x1="28" y1="26" x2="100" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>
      <rect x="26" y="26" width="76" height="76" rx="11" fill={`url(#${id}-grid)`} />
      <rect x="26" y="26" width="76" height="18" rx="9" fill="#047857" />
      <line x1="52" y1="44" x2="52" y2="102" stroke="#10B981" strokeOpacity="0.55" strokeWidth="2.5" />
      <line x1="77" y1="44" x2="77" y2="102" stroke="#10B981" strokeOpacity="0.55" strokeWidth="2.5" />
      <line x1="26" y1="63" x2="102" y2="63" stroke="#10B981" strokeOpacity="0.55" strokeWidth="2.5" />
      <line x1="26" y1="83" x2="102" y2="83" stroke="#10B981" strokeOpacity="0.55" strokeWidth="2.5" />
      <rect x="52" y="63" width="25" height="20" fill="#10B981" fillOpacity="0.35" stroke="#047857" strokeWidth="2.5" />
    </OrionSquircleBase>
  );
};

// 114. Orion Slides (Amber Keynote Presentation Easel & Graphic Slide)
export const IconOrionSlides: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('oslides');
  return (
    <OrionSquircleBase gradientId="icon-orion-slides" from="#D97706" to="#78350F" accent="#FBBF24" {...props}>
      <defs>
        <linearGradient id={`${id}-canvas`} x1="24" y1="30" x2="104" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FEF3C7" />
        </linearGradient>
      </defs>
      <line x1="48" y1="86" x2="40" y2="102" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
      <line x1="80" y1="86" x2="88" y2="102" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
      <rect x="22" y="28" width="84" height="58" rx="9" fill={`url(#${id}-canvas)`} />
      <rect x="33" y="40" width="32" height="7" rx="3" fill="#B45309" />
      <rect x="33" y="54" width="24" height="5" rx="2.5" fill="#F59E0B" />
      <circle cx="82" cy="58" r="14" fill="#F59E0B" />
      <path d="M 82 58 L 82 44 A 14 14 0 0 1 96 58 Z" fill="#78350F" />
    </OrionSquircleBase>
  );
};

// 115. Orion PDF (Crimson Document Folio & Vector Ribbon Loop Seal)
export const IconOrionPdf: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('opdf');
  return (
    <OrionSquircleBase gradientId="icon-orion-pdf" from="#DC2626" to="#7F1D1D" accent="#F87171" {...props}>
      <defs>
        <linearGradient id={`${id}-sheet`} x1="32" y1="22" x2="96" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFE4E6" />
        </linearGradient>
      </defs>
      <path d="M 32 28 C 32 24.7 34.7 22 38 22 L 76 22 L 96 42 L 96 98 C 96 101.3 93.3 104 90 104 L 38 104 C 34.7 104 32 101.3 32 98 Z" fill={`url(#${id}-sheet)`} />
      <path d="M 76 22 L 76 38 C 76 40.2 77.8 42 80 42 L 96 42 Z" fill="#FDA4AF" />
      <path d="M 64 44 C 57 62 49 78 44 82 C 42 84 47 86 52 78 C 58 68 78 68 82 75 C 84 78 79 81 74 75 C 67 66 67 52 64 44 Z" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="44" y="87" width="40" height="9" rx="3" fill="#B91C1C" />
    </OrionSquircleBase>
  );
};
