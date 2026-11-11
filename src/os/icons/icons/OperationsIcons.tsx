import React from 'react';
import { OrionIconArtworkProps } from '../OrionIconTheme';
import { OrionSquircleBase, useOrionIconDetail, useOrionIconIds } from '../OrionSquircleBase';

// 1. Command Center (Control Tower)
export const IconCommandCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('cmd-ctr');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-cmd-center" from="#0F2027" to="#203A43" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-steel`} x1="48" y1="36" x2="80" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="45%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`${id}-cab`} x1="44" y1="40" x2="84" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      {/* Horizon ground platform & shadow */}
      <ellipse cx="64" cy="99" rx="34" ry="4.5" fill="#000000" fillOpacity="0.34" />
      <line x1="22" y1="96" x2="106" y2="96" stroke="#38BDF8" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" />
      {/* Tapered structural shaft with side bevel */}
      <polygon points="55,96 73,96 69,56 59,56" fill={`url(#${id}-steel)`} />
      <polygon points="64,96 73,96 69,56 64,56" fill="#0F172A" fillOpacity="0.24" />
      {/* Cantilevered observation collar */}
      <polygon points="44,54 84,54 80,60 48,60" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
      {/* Wraparound glass control cab */}
      <polygon points="44,54 84,54 79,40 49,40" fill={`url(#${id}-cab)`} stroke="#E0F2FE" strokeWidth="1.4" strokeLinejoin="round" />
      {!isMicro && (
        <>
          <line x1="56" y1="40" x2="54" y2="54" stroke="#E0F2FE" strokeOpacity="0.55" strokeWidth="1.2" />
          <line x1="72" y1="40" x2="74" y2="54" stroke="#E0F2FE" strokeOpacity="0.55" strokeWidth="1.2" />
        </>
      )}
      {/* Roof cap & radar antenna mast */}
      <rect x="46" y="36" width="36" height="4.5" rx="2" fill="#F8FAFC" />
      <line x1="64" y1="36" x2="64" y2="23" stroke="#E2E8F0" strokeWidth="2.4" strokeLinecap="round" />
      {/* Amber rotating beacon + sweep rays */}
      <circle cx="64" cy="22" r="4.5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.2" />
      {!isMicro && (
        <>
          <path d="M 68 22 A 22 22 0 0 1 88 37" stroke="#FBBF24" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M 60 22 A 22 22 0 0 0 40 37" stroke="#00F2FE" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </>
      )}
    </OrionSquircleBase>
  );
};

// 2. Inventory (Isometric Dual-Crate Corrugated Storage)
export const IconInventory: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('inv');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-inventory" from="#059669" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-top`} x1="30" y1="28" x2="96" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`${id}-left`} x1="28" y1="48" x2="64" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id={`${id}-right`} x1="64" y1="48" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      {/* Contact shadow */}
      <polygon points="64,104 28,88 64,74 100,88" fill="#000000" fillOpacity="0.34" />
      {/* Secondary rear small parcel silhouette for warehouse stock depth */}
      {!isMicro && (
        <g opacity="0.88">
          <polygon points="84,30 100,38 84,46 68,38" fill="#FBBF24" />
          <polygon points="84,46 100,38 100,56 84,64" fill="#92400E" />
        </g>
      )}
      {/* Foreground primary 3D kraft carton */}
      <g transform="translate(64, 64)">
        <polygon points="0,-32 34,-15 0,2 -34,-15" fill={`url(#${id}-top)`} stroke="#FEF3C7" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points="-34,-15 0,2 0,36 -34,19" fill={`url(#${id}-left)`} stroke="#FCD34D" strokeOpacity="0.55" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="0,2 34,-15 34,19 0,36" fill={`url(#${id}-right)`} stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1" strokeLinejoin="round" />
        {/* Packaging tape ribbon folding down */}
        <polygon points="-7,-28 7,-21 7,10 -7,3" fill="#FFFBEB" fillOpacity="0.68" />
        {/* Thermal shipping barcode label on left face */}
        <polygon points="-27,2 -9,11 -9,24 -27,15" fill="#FFFFFF" />
        {!isMicro && (
          <>
            <line x1="-24" y1="7" x2="-13" y2="12.5" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-24" y1="11.5" x2="-15" y2="16" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 14 14 L 18 10 L 22 14 M 18 10 L 18 22" stroke="#FEF3C7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
      </g>
    </OrionSquircleBase>
  );
};

// 3. Procurement (Purchase Order Folio & Crimson Wax Seal)
export const IconProcurement: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('proc');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-procurement" from="#D97706" to="#78350F" accent="#F59E0B" {...props}>
      <defs>
        <linearGradient id={`${id}-sheet`} x1="34" y1="24" x2="94" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
        <radialGradient id={`${id}-wax`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="60%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>
      </defs>
      {/* Back binder card & cast shadow */}
      <rect x="28" y="30" width="68" height="76" rx="8" fill="#000000" fillOpacity="0.24" />
      <rect x="28" y="26" width="64" height="78" rx="7" fill="#1E293B" stroke="#94A3B8" strokeOpacity="0.4" strokeWidth="1.2" />
      {/* Ivory PO document */}
      <rect x="34" y="22" width="60" height="80" rx="6" fill={`url(#${id}-sheet)`} stroke="#CBD5E1" strokeWidth="1.2" />
      {/* Brushed brass binder clip */}
      <rect x="52" y="18" width="24" height="8" rx="3" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1" />
      {/* Document typography lines */}
      <rect x="43" y="34" width="22" height="5" rx="2" fill="#B45309" />
      <line x1="43" y1="47" x2="85" y2="47" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
      {!isMicro && (
        <>
          <line x1="43" y1="56" x2="85" y2="56" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="43" y1="65" x2="72" y2="65" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      <line x1="43" y1="76" x2="62" y2="76" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Embossed Crimson Seal + Ribbons */}
      <polygon points="73,82 67,102 77,96 87,102 81,82" fill="#B91C1C" />
      <circle cx="77" cy="80" r="11.5" fill={`url(#${id}-wax)`} stroke="#FEE2E2" strokeWidth="1.4" />
      <circle cx="77" cy="80" r="5.5" fill="#991B1B" stroke="#FCA5A5" strokeOpacity="0.5" strokeWidth="1" />
    </OrionSquircleBase>
  );
};

// 4. Suppliers (Interconnected Architectural Supplier Hub)
export const IconSuppliers: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('supp');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-suppliers" from="#2563EB" to="#1E3A8A" accent="#3B82F6" {...props}>
      <defs>
        <linearGradient id={`${id}-tower`} x1="44" y1="26" x2="84" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="60%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="100" rx="38" ry="5" fill="#000000" fillOpacity="0.28" />
      {/* Back network conduits to satellite supplier nodes */}
      <path d="M 32 76 Q 48 92 64 90 Q 80 92 96 76" stroke="#60A5FA" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="30" cy="74" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.6" />
      <circle cx="98" cy="74" r="6" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.6" />
      {/* Flanking secondary annex */}
      <rect x="68" y="46" width="24" height="46" rx="4" fill="#60A5FA" fillOpacity="0.88" stroke="#DBEAFE" strokeWidth="1.2" />
      {/* Primary sculpted tower */}
      <rect x="38" y="30" width="40" height="64" rx="5" fill={`url(#${id}-tower)`} stroke="#FFFFFF" strokeWidth="1.4" />
      {!isMicro && (
        <>
          <rect x="45" y="39" width="9" height="7" rx="1.5" fill="#1D4ED8" />
          <rect x="60" y="39" width="9" height="7" rx="1.5" fill="#1D4ED8" />
          <rect x="45" y="51" width="9" height="7" rx="1.5" fill="#2563EB" />
          <rect x="60" y="51" width="9" height="7" rx="1.5" fill="#2563EB" />
          <rect x="45" y="63" width="9" height="7" rx="1.5" fill="#3B82F6" />
          <rect x="60" y="63" width="9" height="7" rx="1.5" fill="#3B82F6" />
        </>
      )}
      <rect x="51" y="79" width="14" height="15" rx="2" fill="#1E3A8A" />
    </OrionSquircleBase>
  );
};

// 5. Shipments (Aerodynamic Aluminum & Cobalt Freight Truck)
export const IconShipments: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('ship');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-shipments" from="#EA580C" to="#7C2D12" accent="#F97316" {...props}>
      <defs>
        <linearGradient id={`${id}-cargo`} x1="22" y1="38" x2="72" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id={`${id}-cab`} x1="72" y1="48" x2="100" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      {/* Highway surface & truck cast shadow */}
      <ellipse cx="62" cy="94" rx="40" ry="4.5" fill="#000000" fillOpacity="0.34" />
      <line x1="18" y1="90" x2="110" y2="90" stroke="#FED7AA" strokeOpacity="0.35" strokeWidth="1.8" strokeLinecap="round" />
      {/* Cargo container body with aluminum ribs */}
      <rect x="22" y="38" width="52" height="44" rx="4" fill={`url(#${id}-cargo)`} stroke="#94A3B8" strokeWidth="1.2" />
      {!isMicro && (
        <>
          <line x1="35" y1="42" x2="35" y2="78" stroke="#CBD5E1" strokeWidth="1.6" />
          <line x1="48" y1="42" x2="48" y2="78" stroke="#CBD5E1" strokeWidth="1.6" />
          <line x1="61" y1="42" x2="61" y2="78" stroke="#CBD5E1" strokeWidth="1.6" />
        </>
      )}
      <rect x="26" y="45" width="44" height="5" rx="2" fill="#F97316" fillOpacity="0.85" />
      {/* Freight tractor cab */}
      <path d="M 74 49 L 90 49 L 102 64 L 102 82 L 74 82 Z" fill={`url(#${id}-cab)`} stroke="#BAE6FD" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="78,54 88,54 96,65 78,65" fill="#0F172A" />
      <line x1="80" y1="56" x2="87" y2="56" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
      {/* Twin metallic wheels */}
      <circle cx="40" cy="84" r="9.5" fill="#1E293B" stroke="#E2E8F0" strokeWidth="1.8" />
      <circle cx="40" cy="84" r="4" fill="#94A3B8" />
      <circle cx="88" cy="84" r="9.5" fill="#1E293B" stroke="#E2E8F0" strokeWidth="1.8" />
      <circle cx="88" cy="84" r="4" fill="#94A3B8" />
    </OrionSquircleBase>
  );
};

// 6. Quality Center (Optical Caliper Ring & Ruby Rosette Seal)
export const IconQuality: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('qual');
  return (
    <OrionSquircleBase gradientId="icon-quality" from="#E11D48" to="#881337" accent="#F43F5E" {...props}>
      <defs>
        <linearGradient id={`${id}-medal`} x1="40" y1="24" x2="88" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FFE4E6" />
          <stop offset="100%" stopColor="#FDA4AF" />
        </linearGradient>
      </defs>
      {/* Pleated award ribbons */}
      <polygon points="50,70 38,104 54,96 64,104 64,74" fill="#4C0519" fillOpacity="0.7" />
      <polygon points="78,70 90,104 74,96 64,104 64,74" fill="#881337" stroke="#FDA4AF" strokeOpacity="0.4" strokeWidth="1" />
      {/* Scalloped outer chrome bezel & glowing ruby medallion */}
      <circle cx="64" cy="54" r="28" fill="#000000" fillOpacity="0.22" />
      <circle cx="64" cy="52" r="27" fill={`url(#${id}-medal)`} stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="64" cy="52" r="20" fill="#E11D48" stroke="#FECDD3" strokeWidth="1.4" />
      <path d="M 54 52 L 61 59 L 76 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 7. Invoice 3-Way Matching (Precision Brass Scale & Matched Sheets)
export const IconInvoiceMatching: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('inv-match');
  return (
    <OrionSquircleBase gradientId="icon-inv-match" from="#0D9488" to="#134E4A" accent="#14B8A6" {...props}>
      <defs>
        <linearGradient id={`${id}-brass`} x1="30" y1="30" x2="98" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="99" rx="30" ry="4" fill="#000000" fillOpacity="0.28" />
      {/* Plinth & central pillar */}
      <rect x="44" y="90" width="40" height="7" rx="3.5" fill={`url(#${id}-brass)`} />
      <line x1="64" y1="36" x2="64" y2="90" stroke="#CCFBF1" strokeWidth="4" strokeLinecap="round" />
      {/* Fulcrum beam */}
      <line x1="30" y1="46" x2="98" y2="46" stroke={`url(#${id}-brass)`} strokeWidth="4" strokeLinecap="round" />
      {/* Hanging left & right invoice tray cards */}
      <path d="M 32 46 L 23 68 L 41 68 Z" stroke="#99F6E4" strokeWidth="1.8" fill="none" />
      <rect x="20" y="68" width="24" height="5" rx="2.5" fill="#F8FAFC" />
      <path d="M 96 46 L 87 68 L 105 68 Z" stroke="#99F6E4" strokeWidth="1.8" fill="none" />
      <rect x="84" y="68" width="24" height="5" rx="2.5" fill="#F8FAFC" />
      {/* Verified emerald center jewel pivot */}
      <circle cx="64" cy="46" r="8" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M 60 46 L 63 49 L 69 43" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 8. Gate & GRN Center (Automated Boom Barrier Checkpoint)
export const IconGateReceiving: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('gate');
  return (
    <OrionSquircleBase gradientId="icon-gate-recv" from="#1D4ED8" to="#172554" accent="#2563EB" {...props}>
      <defs>
        <linearGradient id={`${id}-housing`} x1="26" y1="44" x2="46" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="99" rx="38" ry="4.5" fill="#000000" fillOpacity="0.32" />
      {/* Left housing pillar + green status signal lamp */}
      <rect x="24" y="44" width="18" height="52" rx="4" fill={`url(#${id}-housing)`} stroke="#DBEAFE" strokeWidth="1.2" />
      <circle cx="33" cy="36" r="5" fill="#34D399" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Right receiver bollard */}
      <rect x="88" y="56" width="14" height="40" rx="3" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.2" />
      {/* Angled red/white articulated barrier arm */}
      <g transform="rotate(-14 38 56)">
        <rect x="34" y="51" width="66" height="9" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="44" y="51" width="10" height="9" fill="#EF4444" />
        <rect x="64" y="51" width="10" height="9" fill="#EF4444" />
        <rect x="84" y="51" width="10" height="9" fill="#EF4444" />
      </g>
      {/* Entry dock direction arrow */}
      <path d="M 64 70 L 64 90 M 56 82 L 64 90 L 72 82" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 9. Inbound Logistics (Receiving Bay with Gliding Crate)
export const IconInbound: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('inb');
  return (
    <OrionSquircleBase gradientId="icon-inbound" from="#2563EB" to="#1E40AF" accent="#3B82F6" {...props}>
      <defs>
        <linearGradient id={`${id}-bay`} x1="28" y1="54" x2="100" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Bay platform dock */}
      <path d="M 26 62 L 26 92 C 26 95.3 28.7 98 32 98 L 96 98 C 99.3 98 102 95.3 102 92 L 102 62" stroke="#DBEAFE" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill={`url(#${id}-bay)`} fillOpacity="0.35" />
      {/* Roller bed ticks */}
      <line x1="36" y1="88" x2="92" y2="88" stroke="#93C5FD" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
      {/* Descending glowing inbound arrow & crate */}
      <path d="M 64 24 L 64 68 M 48 54 L 64 70 L 80 54" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="52" y="24" width="24" height="14" rx="3" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.2" />
    </OrionSquircleBase>
  );
};

// 10. Outbound Logistics (Dispatch Bay Launch Arrow & Parcel)
export const IconOutbound: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('outb');
  return (
    <OrionSquircleBase gradientId="icon-outbound" from="#F97316" to="#9A3412" accent="#FB923C" {...props}>
      <defs>
        <linearGradient id={`${id}-tray`} x1="28" y1="68" x2="100" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      {/* Dispatch dock cradle */}
      <path d="M 26 64 L 26 92 C 26 95.3 28.7 98 32 98 L 96 98 C 99.3 98 102 95.3 102 92 L 102 64" stroke="#FFEDD5" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill={`url(#${id}-tray)`} fillOpacity="0.28" />
      {/* Outgoing trajectory wing arrow */}
      <path d="M 64 76 L 64 28 M 47 45 L 64 26 L 81 45" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Express parcel box */}
      <rect x="46" y="70" width="36" height="16" rx="4" fill="#FDE68A" stroke="#FFFFFF" strokeWidth="1.2" />
      <line x1="64" y1="70" x2="64" y2="86" stroke="#C2410C" strokeWidth="2.5" />
    </OrionSquircleBase>
  );
};

// 11. Warehouse Operations (Architectural Multi-Rack Facility)
export const IconWarehouse: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('whse');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-warehouse" from="#047857" to="#064E3B" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-roof`} x1="22" y1="26" x2="106" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#A7F3D0" />
        </linearGradient>
      </defs>
      <ellipse cx="64" cy="100" rx="42" ry="4.5" fill="#000000" fillOpacity="0.30" />
      {/* Steel building wall */}
      <path d="M 24 52 L 64 28 L 104 52 L 104 96 L 24 96 Z" fill="#065F46" stroke="#6EE7B7" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Corrugated pitched roof overhang */}
      <path d="M 18 54 L 64 26 L 110 54" stroke={`url(#${id}-roof)`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Cutaway open bay revealing warm pallet racks */}
      <rect x="38" y="56" width="52" height="40" rx="3" fill="#022C22" stroke="#34D399" strokeWidth="1.2" />
      {/* Tiered orange/amber racks & cartons */}
      <line x1="42" y1="70" x2="86" y2="70" stroke="#64748B" strokeWidth="2.2" />
      <line x1="42" y1="84" x2="86" y2="84" stroke="#64748B" strokeWidth="2.2" />
      <rect x="44" y="61" width="12" height="8" rx="1.5" fill="#F59E0B" />
      <rect x="59" y="61" width="11" height="8" rx="1.5" fill="#FBBF24" />
      <rect x="73" y="61" width="11" height="8" rx="1.5" fill="#D97706" />
      {!isMicro && (
        <>
          <rect x="44" y="75" width="13" height="8" rx="1.5" fill="#FBBF24" />
          <rect x="60" y="75" width="12" height="8" rx="1.5" fill="#F59E0B" />
        </>
      )}
    </OrionSquircleBase>
  );
};

// 12. Cost Optimizer (Trimmed Step Columns & Gold Blade Trend)
export const IconCostOptimizer: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('cost');
  return (
    <OrionSquircleBase gradientId="icon-cost-opt" from="#059669" to="#022C22" accent="#10B981" {...props}>
      <defs>
        <linearGradient id={`${id}-bar`} x1="0" y1="30" x2="0" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <line x1="24" y1="96" x2="104" y2="96" stroke="#34D399" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
      {/* Stepped cost reduction bars */}
      <rect x="28" y="36" width="18" height="58" rx="4" fill={`url(#${id}-bar)`} fillOpacity="0.55" />
      <rect x="55" y="52" width="18" height="42" rx="4" fill={`url(#${id}-bar)`} fillOpacity="0.78" />
      <rect x="82" y="66" width="18" height="28" rx="4" fill={`url(#${id}-bar)`} stroke="#A7F3D0" strokeWidth="1" />
      {/* Gold optimization arc arrow */}
      <path d="M 32 30 L 89 58" stroke="#FBBF24" strokeWidth="4.2" strokeLinecap="round" />
      <polyline points="82,46 92,60 76,63" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Floating gold medallion */}
      <circle cx="90" cy="36" r="10" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.8" />
      <path d="M 90 31 L 90 41 M 87 34 L 93 34 M 87 38 L 93 38" stroke="#451A03" strokeWidth="1.8" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 13. Working Capital (Steel Bank Vault Wheel & Gold Reserve)
export const IconWorkingCapital: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('work-cap');
  return (
    <OrionSquircleBase gradientId="icon-working-cap" from="#15803D" to="#14532D" accent="#22C55E" {...props}>
      <defs>
        <linearGradient id={`${id}-vault`} x1="30" y1="30" x2="98" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      {/* Rounded vault door slab */}
      <rect x="26" y="26" width="76" height="76" rx="16" fill="#052E16" stroke="#86EFAC" strokeOpacity="0.55" strokeWidth="1.6" />
      <rect x="31" y="31" width="66" height="66" rx="12" fill={`url(#${id}-vault)`} />
      <circle cx="64" cy="64" r="22" fill="#0F172A" stroke="#94A3B8" strokeWidth="2.5" />
      {/* Machined wheel spokes */}
      <line x1="64" y1="45" x2="64" y2="83" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="45" y1="64" x2="83" y2="64" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="64" cy="64" r="9" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2" />
      {/* Gold liquidity reserve bar badge */}
      <rect x="78" y="36" width="12" height="5" rx="2" fill="#FBBF24" />
      <rect x="78" y="87" width="12" height="5" rx="2" fill="#FBBF24" />
    </OrionSquircleBase>
  );
};

// 14. Contracts (Legal Parchment Deed & Brass Fountain Nib)
export const IconContracts: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('contracts');
  return (
    <OrionSquircleBase gradientId="icon-contracts" from="#4F46E5" to="#312E81" accent="#6366F1" {...props}>
      <defs>
        <linearGradient id={`${id}-page`} x1="30" y1="22" x2="88" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>
      <rect x="30" y="24" width="60" height="80" rx="6" fill="#1E1B4B" fillOpacity="0.5" transform="translate(3,3)" />
      <rect x="30" y="22" width="60" height="80" rx="6" fill={`url(#${id}-page)`} stroke="#C7D2FE" strokeWidth="1.2" />
      {/* Legal clause lines & signature */}
      <line x1="40" y1="36" x2="72" y2="36" stroke="#4338CA" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="40" y1="48" x2="80" y2="48" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="58" x2="76" y2="58" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M 40 78 Q 50 70 58 78 T 70 76" stroke="#4F46E5" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Gold notary badge + diagonal fountain nib */}
      <circle cx="48" cy="90" r="7" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1.5" />
      <g transform="translate(86, 62) rotate(35)">
        <polygon points="0,-24 6,-6 4,14 -4,14 -6,-6" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1.2" />
        <polygon points="0,24 5,14 -5,14" fill="#F8FAFC" />
      </g>
    </OrionSquircleBase>
  );
};

// 15. Communications (Layered Frosted Speech Capsules & Wavebars)
export const IconSupplierComms: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('comms');
  return (
    <OrionSquircleBase gradientId="icon-comms" from="#0284C7" to="#075985" accent="#0EA5E9" {...props}>
      <defs>
        <linearGradient id={`${id}-front`} x1="24" y1="30" x2="88" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
      {/* Background overlapping speech bubble */}
      <path d="M 54 44 L 98 44 C 102.4 44 106 47.6 106 52 L 106 78 C 106 82.4 102.4 86 98 86 L 90 86 L 96 98 L 78 86 L 54 86 Z" fill="#0369A1" stroke="#7DD3FC" strokeWidth="1.4" />
      {/* Primary crisp frosted foreground speech card */}
      <path d="M 22 30 C 22 25.6 25.6 22 30 22 L 82 22 C 86.4 22 90 25.6 90 30 L 90 62 C 90 66.4 86.4 70 82 70 L 44 70 L 30 82 L 33 70 L 30 70 C 25.6 70 22 66.4 22 62 Z" fill={`url(#${id}-front)`} />
      {/* Voice / message wavebars inside bubble */}
      <rect x="38" y="42" width="6" height="10" rx="3" fill="#0284C7" />
      <rect x="49" y="35" width="6" height="24" rx="3" fill="#0EA5E9" />
      <rect x="60" y="39" width="6" height="16" rx="3" fill="#0284C7" />
      <rect x="71" y="43" width="6" height="8" rx="3" fill="#38BDF8" />
    </OrionSquircleBase>
  );
};

// 16. Logistics (Isometric Steel Freight Container & Global Arc)
export const IconLogistics: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('logi');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-logistics" from="#C2410C" to="#7C2D12" accent="#EA580C" {...props}>
      <defs>
        <linearGradient id={`${id}-box`} x1="26" y1="34" x2="98" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      {/* Orbital global trade route arc beneath */}
      <path d="M 20 82 Q 64 102 108 74" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="98" cy="79" r="4.5" fill="#FFFFFF" />
      {/* Corrugated steel intermodal container */}
      <polygon points="24,42 74,30 102,42 52,56" fill="#FFEDD5" stroke="#FED7AA" strokeWidth="1" />
      <polygon points="24,42 52,56 52,80 24,66" fill="#9A3412" stroke="#FDBA74" strokeWidth="1" />
      <polygon points="52,56 102,42 102,66 52,80" fill={`url(#${id}-box)`} stroke="#FFEDD5" strokeWidth="1" />
      {!isMicro && (
        <>
          <line x1="65" y1="53" x2="65" y2="76" stroke="#9A3412" strokeWidth="2" />
          <line x1="77" y1="50" x2="77" y2="73" stroke="#9A3412" strokeWidth="2" />
          <line x1="89" y1="47" x2="89" y2="70" stroke="#9A3412" strokeWidth="2" />
        </>
      )}
    </OrionSquircleBase>
  );
};

// 17. Vital Signs (Clinical Glass Telemetry Monitor)
export const IconVitalSigns: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('vitals');
  return (
    <OrionSquircleBase gradientId="icon-vital-signs" from="#DC2626" to="#7F1D1D" accent="#EF4444" {...props}>
      <defs>
        <linearGradient id={`${id}-scr`} x1="24" y1="28" x2="104" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>
      </defs>
      {/* Brushed frame + dark diagnostic screen */}
      <rect x="20" y="28" width="88" height="72" rx="14" fill="#FCA5A5" fillOpacity="0.28" stroke="#FECACA" strokeWidth="1.4" />
      <rect x="24" y="32" width="80" height="64" rx="11" fill={`url(#${id}-scr)`} />
      {/* Subtle ECG grid baseline */}
      <line x1="28" y1="68" x2="100" y2="68" stroke="#FFFFFF" strokeOpacity="0.10" strokeWidth="1" />
      {/* Luminous phosphor ECG trace */}
      <path d="M 28 68 L 44 68 L 52 46 L 62 84 L 72 38 L 80 68 L 96 68" stroke="#F87171" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="96" cy="68" r="4.5" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2" />
    </OrionSquircleBase>
  );
};

// 18. Trading Partners (Interlocking Bilateral Partner Rings & Keystone)
export const IconTradingPartners: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('trd-p');
  return (
    <OrionSquircleBase gradientId="icon-trading-partners" from="#7C3AED" to="#4C1D95" accent="#8B5CF6" {...props}>
      <defs>
        <linearGradient id={`${id}-ring`} x1="28" y1="36" x2="100" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      <circle cx="48" cy="64" r="24" stroke={`url(#${id}-ring)`} strokeWidth="7.5" fill="none" />
      <circle cx="80" cy="64" r="24" stroke="#A78BFA" strokeWidth="7.5" fill="none" />
      {/* Golden interlocking bridge keystone */}
      <rect x="57" y="48" width="14" height="32" rx="7" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1.5" />
      <circle cx="64" cy="64" r="3" fill="#4C1D95" />
    </OrionSquircleBase>
  );
};

// 19. Manufacturing & MRP (Meshed Steel & Brass Spur Pinion Gears)
export const IconManufacturing: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('mfg');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-mfg" from="#D97706" to="#78350F" accent="#F59E0B" {...props}>
      <defs>
        <linearGradient id={`${id}-steel`} x1="24" y1="24" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      {/* Large primary machined drive gear */}
      <g transform="translate(54, 68)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="-5" y="-31" width="10" height="10" rx="2" fill={`url(#${id}-steel)`} transform={`rotate(${a})`} />
        ))}
        <circle cx="0" cy="0" r="24" fill={`url(#${id}-steel)`} stroke="#F8FAFC" strokeWidth="1" />
        <circle cx="0" cy="0" r="14" fill="#451A03" />
        <circle cx="0" cy="0" r="6" fill="#F59E0B" />
      </g>
      {/* Meshing brass idler pinion */}
      {!isMicro && (
        <g transform="translate(88, 42)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x="-3.5" y="-17" width="7" height="6" rx="1.5" fill="#FDE68A" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="0" r="13" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1" />
          <circle cx="0" cy="0" r="5" fill="#78350F" />
        </g>
      )}
    </OrionSquircleBase>
  );
};

// 20. Returns & Reverse Logistics (Orbiting Boomerang Loop & Kraft Box)
export const IconReturns: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('ret');
  return (
    <OrionSquircleBase gradientId="icon-returns" from="#E11D48" to="#881337" accent="#EF4444" {...props}>
      <defs>
        <linearGradient id={`${id}-arc`} x1="24" y1="24" x2="104" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FECDD3" />
        </linearGradient>
      </defs>
      {/* Sweeping metallic reverse loop */}
      <path d="M 94 56 C 94 36 78 24 58 24 C 36 24 24 40 24 62 C 24 84 40 100 62 100 C 78 100 90 92 96 78" stroke={`url(#${id}-arc)`} strokeWidth="7" strokeLinecap="round" fill="none" />
      <polygon points="24,62 13,47 35,47" fill="#FFFFFF" />
      {/* Mini returned parcel box in center */}
      <rect x="46" y="48" width="36" height="32" rx="5" fill="#FDE68A" stroke="#FEF3C7" strokeWidth="1.2" />
      <rect x="59" y="48" width="10" height="12" fill="#D97706" />
    </OrionSquircleBase>
  );
};

// 21. Supply Planning & MRP (Gantt Glass Rails & Milestone Pegs)
export const IconSupplyPlanning: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('splan');
  return (
    <OrionSquircleBase gradientId="icon-supply-plan" from="#0891B2" to="#164E63" accent="#06B6D4" {...props}>
      <defs>
        <linearGradient id={`${id}-board`} x1="24" y1="28" x2="104" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#164E63" />
          <stop offset="100%" stopColor="#083344" />
        </linearGradient>
      </defs>
      <rect x="22" y="28" width="84" height="72" rx="10" fill={`url(#${id}-board)`} stroke="#67E8F9" strokeOpacity="0.45" strokeWidth="1.5" />
      <rect x="30" y="38" width="42" height="10" rx="5" fill="#FFFFFF" />
      <rect x="48" y="57" width="48" height="10" rx="5" fill="#38BDF8" />
      <rect x="30" y="76" width="54" height="10" rx="5" fill="#FBBF24" />
      <circle cx="80" cy="43" r="4.5" fill="#22D3EE" />
      <circle cx="37" cy="62" r="4.5" fill="#FDE047" />
    </OrionSquircleBase>
  );
};

// 22. ATP & Order Promising (Promise Stopwatch Dial & Check)
export const IconAtpCenter: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('atp');
  return (
    <OrionSquircleBase gradientId="icon-atp" from="#0284C7" to="#0369A1" accent="#00F2FE" {...props}>
      <defs>
        <linearGradient id={`${id}-dial`} x1="34" y1="34" x2="94" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      {/* Top stopwatch crown */}
      <rect x="57" y="20" width="14" height="7" rx="2.5" fill="#E0F2FE" />
      <line x1="64" y1="27" x2="64" y2="33" stroke="#E0F2FE" strokeWidth="3" />
      {/* Sculpted outer promise dial */}
      <circle cx="64" cy="66" r="32" fill={`url(#${id}-dial)`} stroke="#FFFFFF" strokeWidth="1.5" />
      <circle cx="64" cy="66" r="24" fill="#082F49" />
      {/* Promised window emerald arc + crisp checkmark */}
      <path d="M 64 42 A 24 24 0 0 1 88 66" stroke="#34D399" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M 54 66 L 61 73 L 75 58" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 23. Outbound Execution (Laser Wave Scanner & Picked Crates)
export const IconOutboundExecution: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('oexec');
  return (
    <OrionSquircleBase gradientId="icon-out-exec" from="#F59E0B" to="#92400E" accent="#F59E0B" {...props}>
      <defs>
        <linearGradient id={`${id}-beam`} x1="28" y1="48" x2="100" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
          <stop offset="50%" stopColor="#FCA5A5" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Corner optical viewfinder frame */}
      <path d="M 38 30 L 26 30 L 26 42 M 90 30 L 102 30 L 102 42 M 26 86 L 26 98 L 38 98 M 90 98 L 102 98 L 102 86" stroke="#FEF3C7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Stacked serialized barcode bars */}
      <rect x="38" y="42" width="7" height="44" rx="1.5" fill="#FFFFFF" />
      <rect x="50" y="42" width="4" height="44" rx="1" fill="#FEF3C7" />
      <rect x="59" y="42" width="9" height="44" rx="1.5" fill="#FFFFFF" />
      <rect x="73" y="42" width="5" height="44" rx="1" fill="#FEF3C7" />
      <rect x="83" y="42" width="7" height="44" rx="1.5" fill="#FFFFFF" />
      {/* Glowing optical laser scan line */}
      <rect x="22" y="61" width="84" height="6" rx="3" fill={`url(#${id}-beam)`} />
      <line x1="24" y1="64" x2="104" y2="64" stroke="#FFFFFF" strokeWidth="1.5" />
    </OrionSquircleBase>
  );
};

// 24. Last-Mile & Digital POD (Rugged Signing Slate & Verified Stamp)
export const IconDeliveryPod: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('pod');
  return (
    <OrionSquircleBase gradientId="icon-del-pod" from="#3B82F6" to="#1E3A8A" accent="#60A5FA" {...props}>
      <defs>
        <linearGradient id={`${id}-slate`} x1="34" y1="22" x2="94" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      <rect x="34" y="22" width="60" height="84" rx="10" fill={`url(#${id}-slate)`} stroke="#FFFFFF" strokeWidth="1.5" />
      <rect x="40" y="30" width="48" height="62" rx="6" fill="#0F172A" />
      {/* Digital signature path */}
      <path d="M 46 66 Q 54 52 60 66 T 78 58" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <line x1="46" y1="74" x2="82" y2="74" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      {/* Verified emerald delivery pill badge */}
      <circle cx="80" cy="36" r="10" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M 76 36 L 79 39 L 85 33" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 25. Warranty & Supplier RTV (Rose Shield & Precision Chrome Wrench)
export const IconWarrantyService: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('warr');
  return (
    <OrionSquircleBase gradientId="icon-warranty" from="#DB2777" to="#831843" accent="#EC4899" {...props}>
      <defs>
        <linearGradient id={`${id}-shield`} x1="34" y1="26" x2="94" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>
      <path d="M 64 24 L 96 38 L 96 66 C 96 86 64 102 64 102 C 64 102 32 86 32 66 L 32 38 Z" fill={`url(#${id}-shield)`} stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M 64 32 L 88 42 L 88 64 C 88 79 64 93 64 93 C 64 93 40 79 40 64 L 40 42 Z" fill="#831843" />
      {/* Gleaming angled service wrench */}
      <path d="M 52 74 L 70 56 A 10 10 0 1 1 78 64 L 60 82 Z" fill="#F8FAFC" stroke="#FBCFE8" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="72" cy="54" r="3" fill="#831843" />
    </OrionSquircleBase>
  );
};

// 26. Supplier CPFR & Capacity (Synchronized Dual Planning Boards)
export const IconSupplierCollaboration: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('cpfr');
  return (
    <OrionSquircleBase gradientId="icon-cpfr" from="#06B6D4" to="#164E63" accent="#22D3EE" {...props}>
      <defs>
        <linearGradient id={`${id}-card`} x1="24" y1="26" x2="96" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CFFAFE" />
        </linearGradient>
      </defs>
      {/* Left factory board */}
      <rect x="22" y="28" width="44" height="54" rx="8" fill="#083344" stroke="#67E8F9" strokeWidth="1.8" />
      <rect x="29" y="38" width="30" height="8" rx="3" fill="#22D3EE" />
      <rect x="29" y="52" width="22" height="8" rx="3" fill="#38BDF8" />
      {/* Right supplier mirror board */}
      <rect x="62" y="46" width="44" height="54" rx="8" fill={`url(#${id}-card)`} stroke="#FFFFFF" strokeWidth="1.4" />
      <rect x="70" y="56" width="28" height="8" rx="3" fill="#0891B2" />
      <rect x="70" y="70" width="20" height="8" rx="3" fill="#06B6D4" />
      {/* Bidirectional sync ring clasp */}
      <circle cx="64" cy="64" r="9" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M 60 64 L 68 64" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </OrionSquircleBase>
  );
};

// 27. Buy Something (Tactile Emerald Enterprise Purchasing Tote)
export const IconBuyWorkflow: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('buy');
  return (
    <OrionSquircleBase gradientId="icon-buy-workflow" from="#10B981" to="#047857" accent="#34D399" {...props}>
      <defs>
        <linearGradient id={`${id}-bag`} x1="30" y1="42" x2="98" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>
      {/* Silver metallic tote handle arch */}
      <path d="M 46 44 L 46 34 C 46 25.2 53.2 18 64 18 C 74.8 18 82 25.2 82 34 L 82 44" stroke="#ECFDF5" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Tapered sculpted satchel body */}
      <path d="M 28 42 L 100 42 L 94 98 C 93.4 102.5 89.6 106 85 106 L 43 106 C 38.4 106 34.6 102.5 34 98 Z" fill={`url(#${id}-bag)`} stroke="#FFFFFF" strokeWidth="1.4" />
      {/* Center requisition ticket emblem */}
      <circle cx="64" cy="72" r="16" fill="#059669" />
      <path d="M 57 72 L 62 77 L 72 67" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </OrionSquircleBase>
  );
};

// 28. Executive Overview (Dimensional Glass Cockpit Display & Arc Gauge)
export const IconExecutiveOverview: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('exec-ov');
  const { detailTier } = useOrionIconDetail();
  const isMicro = detailTier === 'micro';
  return (
    <OrionSquircleBase gradientId="icon-executive-overview" from="#0B0C0C" to="#151616" accent="#39C77A" {...props}>
      <defs>
        <linearGradient id={`${id}-glass`} x1="24" y1="24" x2="104" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#262A30" />
          <stop offset="100%" stopColor="#121417" />
        </linearGradient>
      </defs>
      {/* Executive brushed display plinth */}
      <rect x="20" y="26" width="88" height="72" rx="14" fill={`url(#${id}-glass)`} stroke="#39C77A" strokeOpacity="0.45" strokeWidth="1.5" />
      {/* Top KPI header dots */}
      {!isMicro && (
        <>
          <circle cx="32" cy="37" r="2.5" fill="#EF4444" />
          <circle cx="40" cy="37" r="2.5" fill="#FBBF24" />
          <circle cx="48" cy="37" r="2.5" fill="#39C77A" />
        </>
      )}
      {/* Luminous emerald KPI semi-arc gauge */}
      <path d="M 36 74 A 28 28 0 0 1 92 74" stroke="#334155" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M 36 74 A 28 28 0 0 1 83 54" stroke="#39C77A" strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* Precision gold needle indicator */}
      <line x1="64" y1="76" x2="80" y2="54" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="64" cy="76" r="5" fill="#FFFFFF" />
      {/* Bottom mini spark columns */}
      <rect x="34" y="84" width="16" height="5" rx="2.5" fill="#39C77A" />
      <rect x="54" y="84" width="22" height="5" rx="2.5" fill="#38BDF8" />
      <rect x="80" y="84" width="14" height="5" rx="2.5" fill="#FBBF24" />
    </OrionSquircleBase>
  );
};

// 29. Project Management (3D Kanban Task Slate with Color-Coded Tiles)
export const IconProjectManagement: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('proj-m');
  return (
    <OrionSquircleBase gradientId="icon-project-management" from="#2563EB" to="#1D4ED8" accent="#60A5FA" {...props}>
      <defs>
        <linearGradient id={`${id}-panel`} x1="24" y1="26" x2="104" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
      </defs>
      <rect x="22" y="26" width="84" height="76" rx="12" fill={`url(#${id}-panel)`} stroke="#FFFFFF" strokeWidth="1.4" />
      {/* Top binder bar */}
      <rect x="22" y="26" width="84" height="14" rx="10" fill="#1E3A8A" />
      {/* Three Kanban column cards */}
      <rect x="30" y="48" width="20" height="44" rx="5" fill="#93C5FD" />
      <rect x="33" y="54" width="14" height="12" rx="3" fill="#1D4ED8" />
      <rect x="33" y="70" width="14" height="10" rx="3" fill="#2563EB" />

      <rect x="54" y="48" width="20" height="44" rx="5" fill="#A7F3D0" />
      <rect x="57" y="54" width="14" height="16" rx="3" fill="#059669" />

      <rect x="78" y="48" width="20" height="44" rx="5" fill="#FDE68A" />
      <rect x="81" y="54" width="14" height="22" rx="3" fill="#D97706" />
    </OrionSquircleBase>
  );
};

// 30. Flow Tracker (Sinuous Illuminated Conduit & Telemetry Gates)
export const IconFlowTracker: React.FC<OrionIconArtworkProps> = (props) => {
  const id = useOrionIconIds('flow-t');
  return (
    <OrionSquircleBase gradientId="icon-flow-tracker" from="#0891B2" to="#0E7490" accent="#22D3EE" {...props}>
      <defs>
        <linearGradient id={`${id}-pipe`} x1="28" y1="32" x2="100" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#67E8F9" />
        </linearGradient>
      </defs>
      {/* Sinuous pipeline track */}
      <path d="M 32 36 L 74 36 C 88 36 88 64 64 64 C 40 64 40 92 54 92 L 96 92" stroke="#083344" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M 32 36 L 74 36 C 88 36 88 64 64 64 C 40 64 40 92 54 92 L 96 92" stroke={`url(#${id}-pipe)`} strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Inlet, center gate & outlet flow beads */}
      <circle cx="32" cy="36" r="8.5" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2.2" />
      <circle cx="64" cy="64" r="9.5" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="2.2" />
      <circle cx="96" cy="92" r="8.5" fill="#34D399" stroke="#FFFFFF" strokeWidth="2.2" />
    </OrionSquircleBase>
  );
};
