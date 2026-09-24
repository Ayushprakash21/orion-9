import React from 'react';
import { OrionSquircleBase } from '../OrionIconRegistry';

// 1. Command Center
export const IconCommandCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-cmd-center" from="#0F2027" to="#203A43" {...props}>
    {/* Global Command Center Radar & Multi-orbital Rings */}
    <circle cx="64" cy="64" r="38" stroke="#00F2FE" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
    <circle cx="64" cy="64" r="26" stroke="#00F2FE" strokeWidth="2" opacity="0.7" />
    <circle cx="64" cy="64" r="14" stroke="#4FACFE" strokeWidth="2.5" />
    <circle cx="64" cy="64" r="5" fill="#00F2FE" />
    <line x1="64" y1="20" x2="64" y2="108" stroke="#00F2FE" strokeWidth="1.2" opacity="0.5" />
    <line x1="20" y1="64" x2="108" y2="64" stroke="#00F2FE" strokeWidth="1.2" opacity="0.5" />
    {/* Sweeping Radar Beam */}
    <path d="M 64 64 L 92 36 A 38 38 0 0 0 64 26 Z" fill="url(#cmd-sweep)" opacity="0.6" />
    <defs>
      <linearGradient id="cmd-sweep" x1="64" y1="64" x2="92" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#00F2FE" stopOpacity="0" />
      </linearGradient>
    </defs>
    <circle cx="86" cy="42" r="3.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 2. Inventory
export const IconInventory: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-inventory" from="#059669" to="#064E3B" {...props}>
    {/* Layered Isometric Inventory Storage Blocks */}
    <g transform="translate(64, 44)">
      {/* Top Isometric Cube */}
      <path d="M 0 -18 L 24 -4 L 0 10 L -24 -4 Z" fill="#34D399" />
      <path d="M -24 -4 L 0 10 L 0 34 L -24 20 Z" fill="#10B981" />
      <path d="M 0 10 L 24 -4 L 24 20 L 0 34 Z" fill="#059669" />
      {/* Lower Left Cube */}
      <path d="M -26 12 L -2 26 L -26 40 L -50 26 Z" fill="#6EE7B7" opacity="0.9" />
      <path d="M -50 26 L -26 40 L -26 64 L -50 50 Z" fill="#10B981" />
      <path d="M -26 40 L -2 26 L -2 50 L -26 64 Z" fill="#047857" />
      {/* Lower Right Cube */}
      <path d="M 26 12 L 50 26 L 26 40 L 2 26 Z" fill="#6EE7B7" opacity="0.9" />
      <path d="M 2 26 L 26 40 L 26 64 L 2 50 Z" fill="#10B981" />
      <path d="M 26 40 L 50 26 L 50 50 L 26 64 Z" fill="#047857" />
    </g>
  </OrionSquircleBase>
);

// 3. Procurement
export const IconProcurement: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-procurement" from="#D97706" to="#78350F" {...props}>
    {/* Strategic Sourcing Crosshair Target & Purchase Document */}
    <circle cx="64" cy="64" r="34" stroke="#FDE68A" strokeWidth="2.5" fill="none" opacity="0.4" />
    <circle cx="64" cy="64" r="22" stroke="#FBBF24" strokeWidth="3" fill="none" />
    <circle cx="64" cy="64" r="8" fill="#F59E0B" />
    {/* Target Calipers */}
    <line x1="64" y1="22" x2="64" y2="34" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="94" x2="64" y2="106" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <line x1="22" y1="64" x2="34" y2="64" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <line x1="94" y1="64" x2="106" y2="64" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    {/* Purchase Diamond Badge */}
    <polygon points="64,48 76,64 64,80 52,64" fill="#FFFFFF" opacity="0.9" />
  </OrionSquircleBase>
);

// 4. Suppliers
export const IconSuppliers: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-suppliers" from="#2563EB" to="#1E3A8A" {...props}>
    {/* Multi-Node Supplier Network Star */}
    <line x1="64" y1="42" x2="38" y2="78" stroke="#93C5FD" strokeWidth="2.5" />
    <line x1="64" y1="42" x2="90" y2="78" stroke="#93C5FD" strokeWidth="2.5" />
    <line x1="38" y1="78" x2="90" y2="78" stroke="#93C5FD" strokeWidth="2.5" />
    <line x1="64" y1="66" x2="64" y2="42" stroke="#60A5FA" strokeWidth="3" />
    <line x1="64" y1="66" x2="38" y2="78" stroke="#60A5FA" strokeWidth="3" />
    <line x1="64" y1="66" x2="90" y2="78" stroke="#60A5FA" strokeWidth="3" />
    {/* Central Enterprise Hub */}
    <circle cx="64" cy="66" r="9" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="3" />
    {/* Supplier Nodes */}
    <circle cx="64" cy="38" r="11" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="36" cy="80" r="11" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="92" cy="80" r="11" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2.5" />
  </OrionSquircleBase>
);

// 5. Shipments
export const IconShipments: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-shipments" from="#EA580C" to="#7C2D12" {...props}>
    {/* Global High-Speed Freight Logistics Carrier */}
    <path d="M 26 74 L 68 74 L 84 56 L 102 56 L 102 82 L 26 82 Z" fill="#FED7AA" />
    <path d="M 26 48 L 68 48 L 68 74 L 26 74 Z" fill="#FB923C" />
    {/* Windshield */}
    <polygon points="72,58 82,58 76,70 70,70" fill="#7C2D12" />
    {/* Wheels */}
    <circle cx="44" cy="84" r="9" fill="#1C1917" stroke="#FDBA74" strokeWidth="2" />
    <circle cx="86" cy="84" r="9" fill="#1C1917" stroke="#FDBA74" strokeWidth="2" />
    <circle cx="44" cy="84" r="3.5" fill="#FFFFFF" />
    <circle cx="86" cy="84" r="3.5" fill="#FFFFFF" />
    {/* Speed Trails */}
    <line x1="18" y1="54" x2="24" y2="54" stroke="#FED7AA" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="14" y1="62" x2="22" y2="62" stroke="#FED7AA" strokeWidth="2.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 6. Quality
export const IconQuality: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-quality" from="#E11D48" to="#881337" {...props}>
    {/* Precision Quality AQL Inspection Badge & Stamp */}
    <circle cx="64" cy="64" r="32" stroke="#FECDD3" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
    <polygon points="64,28 73,46 93,49 78,64 82,84 64,74 46,84 50,64 35,49 55,46" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="64" cy="60" r="14" fill="#FFFFFF" />
    <path d="M 57 60 L 62 65 L 72 54" stroke="#E11D48" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 7. Invoice Matching (3-Way Match)
export const IconInvoiceMatching: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-inv-match" from="#0D9488" to="#134E4A" {...props}>
    {/* 3-Way Reconciliation Balance Triple Scale */}
    <path d="M 32 40 L 64 40 L 96 40" stroke="#CCFBF1" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="36" x2="64" y2="88" stroke="#5EEAD4" strokeWidth="3.5" strokeLinecap="round" />
    {/* Left Pan */}
    <path d="M 32 40 L 22 66 L 42 66 Z" fill="#2DD4BF" />
    {/* Right Pan */}
    <path d="M 96 40 L 86 66 L 106 66 Z" fill="#2DD4BF" />
    {/* Base Stand */}
    <rect x="48" y="88" width="32" height="6" rx="3" fill="#FFFFFF" />
    {/* Center Verified Badge */}
    <circle cx="64" cy="60" r="8" fill="#14B8A6" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 60 60 L 63 63 L 68 57" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
  </OrionSquircleBase>
);

// 8. Gate Receiving
export const IconGateReceiving: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-gate-recv" from="#1D4ED8" to="#172554" {...props}>
    {/* Physical Facility Gate Barrier & Radio Frequency Beacon */}
    <rect x="30" y="42" width="14" height="48" rx="4" fill="#60A5FA" />
    <rect x="84" y="42" width="14" height="48" rx="4" fill="#60A5FA" />
    {/* Barrier Boom */}
    <path d="M 38 52 L 90 52" stroke="#EF4444" strokeWidth="6" strokeDasharray="8 8" strokeLinecap="round" />
    <path d="M 38 52 L 90 52" stroke="#FFFFFF" strokeWidth="6" strokeDasharray="0 8 8 0" strokeLinecap="round" />
    {/* Directional Inward Arrow */}
    <path d="M 64 68 L 64 88 M 56 80 L 64 88 L 72 80" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 9. Inbound
export const IconInbound: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-inbound" from="#2563EB" to="#1E40AF" {...props}>
    {/* Inbound Converging Arrows & Receiving Dock Funnel */}
    <rect x="34" y="58" width="60" height="38" rx="6" fill="#93C5FD" />
    <path d="M 34 70 L 64 88 L 94 70" stroke="#1D4ED8" strokeWidth="2.5" fill="none" />
    {/* Dynamic Incoming Vectors */}
    <path d="M 64 22 L 64 54 M 52 42 L 64 54 L 76 42" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 10. Outbound
export const IconOutbound: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-outbound" from="#F97316" to="#9A3412" {...props}>
    {/* Outbound Launch Trajectory & Dispatch Stream */}
    <rect x="34" y="48" width="60" height="38" rx="6" fill="#FDBA74" />
    <path d="M 34 60 L 64 78 L 94 60" stroke="#C2410C" strokeWidth="2.5" fill="none" />
    {/* Outgoing Launch Vector */}
    <path d="M 64 64 L 64 24 M 52 36 L 64 24 L 76 36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 11. Warehouse
export const IconWarehouse: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-warehouse" from="#047857" to="#064E3B" {...props}>
    {/* Structured High-Bay Storage Racks & Pallet Rows */}
    <path d="M 28 32 L 64 20 L 100 32 L 100 96 L 28 96 Z" fill="#065F46" stroke="#6EE7B7" strokeWidth="2" />
    {/* Internal Racks */}
    <line x1="36" y1="52" x2="92" y2="52" stroke="#A7F3D0" strokeWidth="2.5" />
    <line x1="36" y1="74" x2="92" y2="74" stroke="#A7F3D0" strokeWidth="2.5" />
    <line x1="64" y1="36" x2="64" y2="96" stroke="#34D399" strokeWidth="2" />
    {/* Pallet Loads */}
    <rect x="40" y="38" width="18" height="12" rx="2" fill="#F59E0B" />
    <rect x="70" y="38" width="18" height="12" rx="2" fill="#10B981" />
    <rect x="40" y="60" width="18" height="12" rx="2" fill="#3B82F6" />
    <rect x="70" y="60" width="18" height="12" rx="2" fill="#F59E0B" />
    <rect x="40" y="82" width="18" height="12" rx="2" fill="#10B981" />
    <rect x="70" y="82" width="18" height="12" rx="2" fill="#6366F1" />
  </OrionSquircleBase>
);

// 12. Cost Optimizer
export const IconCostOptimizer: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-cost-opt" from="#059669" to="#022C22" {...props}>
    {/* Financial Cost Optimizer Scissors & Margin Slope */}
    <circle cx="48" cy="76" r="10" stroke="#6EE7B7" strokeWidth="3" fill="none" />
    <circle cx="80" cy="76" r="10" stroke="#6EE7B7" strokeWidth="3" fill="none" />
    <line x1="55" y1="69" x2="78" y2="40" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="73" y1="69" x2="50" y2="40" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="64" cy="56" r="3.5" fill="#34D399" />
    {/* Downward Trend Arrow */}
    <path d="M 86 34 L 100 48 M 100 34 L 100 48 L 86 48" stroke="#34D399" strokeWidth="3" strokeLinecap="round" fill="none" />
  </OrionSquircleBase>
);

// 13. Working Capital
export const IconWorkingCapital: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-working-cap" from="#15803D" to="#14532D" {...props}>
    {/* Dynamic Cash Conversion Cycle Orbit & Currency Token */}
    <circle cx="64" cy="64" r="32" stroke="#86EFAC" strokeWidth="2.5" strokeDasharray="12 6" fill="none" />
    <polygon points="96,64 88,56 88,72" fill="#86EFAC" />
    <circle cx="64" cy="64" r="20" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2" />
    <text x="64" y="72" fontSize="22" fontWeight="bold" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif">$</text>
  </OrionSquircleBase>
);

// 14. Contracts
export const IconContracts: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-contracts" from="#4F46E5" to="#312E81" {...props}>
    {/* Enterprise Master Service Agreement Parchment & Wax Seal */}
    <rect x="34" y="24" width="60" height="78" rx="6" fill="#EEF2FF" />
    <line x1="46" y1="40" x2="82" y2="40" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" />
    <line x1="46" y1="52" x2="82" y2="52" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" />
    <line x1="46" y1="64" x2="68" y2="64" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" />
    {/* Red Cryptographic Authority Seal */}
    <circle cx="76" cy="80" r="12" fill="#EF4444" stroke="#FEE2E2" strokeWidth="2" />
    <polygon points="76,73 80,78 86,79 81,83 82,89 76,86 70,89 71,83 66,79 72,78" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 15. Communications
export const IconSupplierComms: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-comms" from="#0284C7" to="#075985" {...props}>
    {/* Secure Supplier Intercom Dialogue Bubbles */}
    <path d="M 28 42 C 28 32 38 24 50 24 L 78 24 C 90 24 100 32 100 42 C 100 52 90 60 78 60 L 52 60 L 36 72 L 40 60 C 33 57 28 50 28 42 Z" fill="#BAE6FD" />
    <circle cx="50" cy="42" r="4" fill="#0284C7" />
    <circle cx="64" cy="42" r="4" fill="#0284C7" />
    <circle cx="78" cy="42" r="4" fill="#0284C7" />
  </OrionSquircleBase>
);

// 16. Logistics
export const IconLogistics: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-logistics" from="#C2410C" to="#7C2D12" {...props}>
    {/* Multimodal Transport Hub & Intermodal Globe */}
    <circle cx="64" cy="64" r="34" stroke="#FDBA74" strokeWidth="2" fill="none" opacity="0.5" />
    {/* Curved Flight/Shipping Route */}
    <path d="M 32 78 Q 64 22 96 78" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <circle cx="32" cy="78" r="6" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="96" cy="78" r="6" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
    <polygon points="64,44 72,50 64,54" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 17. Vital Signs
export const IconVitalSigns: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-vital-signs" from="#DC2626" to="#7F1D1D" {...props}>
    {/* Live Operational Pulse ECG Cardiogram Monitor */}
    <path d="M 22 64 L 42 64 L 50 40 L 58 88 L 68 32 L 76 74 L 84 64 L 106 64" stroke="#FEF08A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="68" cy="32" r="4.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 18. Trading Partners
export const IconTradingPartners: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-trading-partners" from="#7C3AED" to="#4C1D95" {...props}>
    {/* Electronic B2B Trading Handshake & EDI Protocol Bridge */}
    <circle cx="46" cy="46" r="14" fill="#DDD6FE" />
    <circle cx="82" cy="46" r="14" fill="#C4B5FD" />
    <path d="M 28 88 C 28 72 38 68 46 68 C 54 68 58 72 64 76 C 70 72 74 68 82 68 C 90 68 100 72 100 88 Z" fill="#A78BFA" />
    {/* Handshake Link */}
    <line x1="50" y1="78" x2="78" y2="78" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 19. Manufacturing & MRP
export const IconManufacturing: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-mfg" from="#D97706" to="#78350F" {...props}>
    {/* Shop Floor Robotic Fabrication Arm & Precision Gear */}
    <circle cx="64" cy="64" r="28" stroke="#FDE68A" strokeWidth="4" strokeDasharray="8 6" fill="none" />
    <circle cx="64" cy="64" r="14" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
    {/* Robot Joint Arm */}
    <path d="M 38 88 L 56 64 L 78 52" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
    <circle cx="38" cy="88" r="5" fill="#FCD34D" />
    <circle cx="56" cy="64" r="4.5" fill="#FCD34D" />
  </OrionSquircleBase>
);

// 20. Returns & Reverse Logistics
export const IconReturns: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-returns" from="#E11D48" to="#881337" {...props}>
    {/* Circular Reverse Logistics Recirculation Loop */}
    <path d="M 64 30 A 34 34 0 1 1 30 64" stroke="#FECDD3" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <polygon points="30,46 30,64 48,64" fill="#FECDD3" />
    <circle cx="64" cy="64" r="12" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M 59 64 L 69 64 M 64 59 L 64 69" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 21. Supply Planning & MRP
export const IconSupplyPlanning: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-supply-plan" from="#0891B2" to="#164E63" {...props}>
    {/* Master Supply Netting Schedule Grid & Stepped Plan */}
    <rect x="28" y="32" width="72" height="64" rx="6" fill="#155E75" stroke="#67E8F9" strokeWidth="2" />
    <line x1="28" y1="52" x2="100" y2="52" stroke="#22D3EE" strokeWidth="1.5" />
    <line x1="28" y1="72" x2="100" y2="72" stroke="#22D3EE" strokeWidth="1.5" />
    <line x1="52" y1="32" x2="52" y2="96" stroke="#22D3EE" strokeWidth="1.5" />
    <line x1="76" y1="32" x2="76" y2="96" stroke="#22D3EE" strokeWidth="1.5" />
    {/* Stepped Scheduled Allocation */}
    <rect x="34" y="38" width="12" height="8" rx="2" fill="#67E8F9" />
    <rect x="58" y="58" width="12" height="8" rx="2" fill="#A5F3FC" />
    <rect x="82" y="78" width="12" height="8" rx="2" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 22. ATP & Order Promising
export const IconAtpCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-atp" from="#00F2FE" to="#0369A1" {...props}>
    {/* Deterministic Order Allocation Lock & Promise Caliper */}
    <circle cx="64" cy="64" r="32" stroke="#E0F2FE" strokeWidth="2.5" fill="none" />
    <circle cx="64" cy="64" r="22" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
    {/* Lock/Check Mechanism */}
    <path d="M 54 62 L 62 70 L 76 54" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="58" y="30" width="12" height="10" rx="3" fill="#38BDF8" />
  </OrionSquircleBase>
);

// 23. Outbound Execution & Wave Picking
export const IconOutboundExecution: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-out-exec" from="#F59E0B" to="#92400E" {...props}>
    {/* Wave Release Handheld Scanner & SSCC Carton Staging */}
    <rect x="32" y="44" width="38" height="38" rx="4" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
    <line x1="38" y1="52" x2="64" y2="52" stroke="#B45309" strokeWidth="2" strokeDasharray="3 2" />
    <line x1="38" y1="60" x2="64" y2="60" stroke="#B45309" strokeWidth="2" strokeDasharray="4 2" />
    {/* Laser Scan Vector */}
    <path d="M 72 32 L 96 56 L 82 70" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" fill="none" />
    <polygon points="96,56 94,46 84,48" fill="#EF4444" />
  </OrionSquircleBase>
);

// 24. Last-Mile Delivery & Digital POD
export const IconDeliveryPod: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-del-pod" from="#3B82F6" to="#1E3A8A" {...props}>
    {/* Cryptographic E-Signature Manifest & Geotag Beacon */}
    <rect x="32" y="28" width="64" height="72" rx="6" fill="#DBEAFE" />
    <path d="M 44 44 L 84 44 M 44 56 L 84 56" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
    {/* Signature Flow */}
    <path d="M 44 76 Q 52 64 60 76 T 76 74" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Geotag Stamp */}
    <circle cx="78" cy="80" r="10" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="78" cy="80" r="3.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 25. Warranty Management & Supplier Recovery
export const IconWarrantyService: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-warranty" from="#DB2777" to="#831843" {...props}>
    {/* Serialized Warranty Protection Shield & Recovery Emblem */}
    <path d="M 64 24 L 94 36 L 94 66 C 94 84 64 100 64 100 C 64 100 34 84 34 66 L 34 36 Z" fill="#F472B6" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="64" cy="58" r="14" fill="#BE185D" />
    <path d="M 58 58 L 62 62 L 70 54" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 26. Supplier CPFR & Capacity Collaboration
export const IconSupplierCollaboration: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-cpfr" from="#06B6D4" to="#164E63" {...props}>
    {/* Synchronized Forecast & Supplier Commitment Dual Wave */}
    <path d="M 28 68 Q 46 36 64 68 T 100 68" stroke="#A5F3FC" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M 28 58 Q 46 88 64 58 T 100 58" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" fill="none" />
    <circle cx="64" cy="63" r="6" fill="#0891B2" stroke="#FFFFFF" strokeWidth="2" />
  </OrionSquircleBase>
);
