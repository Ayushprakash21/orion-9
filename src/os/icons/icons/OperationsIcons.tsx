import React from 'react';
import { OrionSquircleBase } from '../OrionIconRegistry';

// 1. Command Center (Control Tower)
export const IconCommandCenter: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-cmd-center" from="#0F172A" to="#1E3A8A" {...props}>
    {/* Architectural Airport / Port Operations Control Tower */}
    {/* Horizon Grid Line */}
    <line x1="24" y1="96" x2="104" y2="96" stroke="#334155" strokeWidth="1.5" />
    {/* Tower Base & Tapered Shaft */}
    <polygon points="56,96 72,96 68,54 60,54" fill="#64748B" stroke="#94A3B8" strokeWidth="1" />
    {/* Flared Observation Deck Platform */}
    <polygon points="46,54 82,54 78,40 50,40" fill="#334155" stroke="#94A3B8" strokeWidth="1.2" />
    {/* Panoramic Glass Window Ring */}
    <polygon points="48,48 80,48 76,42 52,42" fill="#38BDF8" opacity="0.9" />
    {/* Control Cab Roof */}
    <rect x="48" y="38" width="32" height="4" rx="1.5" fill="#E2E8F0" />
    {/* Antenna Mast */}
    <line x1="64" y1="38" x2="64" y2="24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    {/* Amber Rotating Beacon Light */}
    <circle cx="64" cy="23" r="3.5" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1" />
    {/* Radar Sweep Arc */}
    <path d="M 64 24 Q 82 20 92 34" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" fill="none" opacity="0.8" />
  </OrionSquircleBase>
);

// 2. Inventory
export const IconInventory: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-inventory" from="#B45309" to="#451A03" {...props}>
    {/* Heavy-Duty Corrugated Kraft Shipping Carton */}
    <g transform="translate(64, 60)">
      {/* Top Carton Flap */}
      <polygon points="0,-28 34,-12 0,4 -34,-12" fill="#D97706" stroke="#FDE68A" strokeWidth="1" />
      {/* Packaging Sealing Tape Down Center */}
      <polygon points="-5,-26 5,-21 5,2 -5,-3" fill="#B45309" opacity="0.85" />
      {/* Left Carton Face */}
      <polygon points="-34,-12 0,4 0,38 -34,22" fill="#B45309" stroke="#FDE68A" strokeWidth="1" />
      {/* Right Carton Face */}
      <polygon points="0,4 34,-12 34,22 0,38" fill="#92400E" stroke="#FDE68A" strokeWidth="1" />
      {/* Shipping Label on Left Face */}
      <polygon points="-26,6 -8,14 -8,28 -26,20" fill="#FEF3C7" />
      <line x1="-22" y1="12" x2="-12" y2="17" stroke="#78350F" strokeWidth="1.5" />
      <line x1="-22" y1="17" x2="-14" y2="21" stroke="#78350F" strokeWidth="1.2" />
      <line x1="-22" y1="22" x2="-16" y2="25" stroke="#78350F" strokeWidth="1.2" />
      {/* Up Arrows / Handle With Care Stamp on Right Face */}
      <g transform="translate(18, 12) skewY(-20) scale(0.6)">
        <polygon points="0,-8 4,-2 2,-2 2,6 -2,6 -2,-2 -4,-2" fill="#FEF3C7" opacity="0.8" />
        <polygon points="8,-8 12,-2 10,-2 10,6 6,6 6,-2 4,-2" fill="#FEF3C7" opacity="0.8" />
      </g>
    </g>
  </OrionSquircleBase>
);

// 3. Procurement
export const IconProcurement: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-procurement" from="#1E3A8A" to="#0F172A" {...props}>
    {/* Purchase Order Invoice Document with Red Wax Seal */}
    <rect x="32" y="24" width="64" height="80" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
    {/* PO Header */}
    <line x1="42" y1="36" x2="68" y2="36" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
    <line x1="42" y1="46" x2="86" y2="46" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="42" y1="56" x2="86" y2="56" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="42" y1="66" x2="86" y2="66" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="42" y1="76" x2="64" y2="76" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
    {/* Royal Red Wax Seal with Ribbon Tails */}
    <path d="M 72 82 L 68 98 L 76 93 L 84 98 L 80 82 Z" fill="#DC2626" />
    <circle cx="76" cy="80" r="10" fill="#EF4444" stroke="#FEE2E2" strokeWidth="1.5" />
    <circle cx="76" cy="80" r="5" fill="#DC2626" />
  </OrionSquircleBase>
);

// 4. Suppliers
export const IconSuppliers: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-suppliers" from="#0D9488" to="#134E4A" {...props}>
    {/* Commercial Supplier Enterprise Building */}
    <rect x="36" y="32" width="56" height="66" rx="4" fill="#99F6E4" stroke="#FFFFFF" strokeWidth="1.5" />
    {/* Office Windows Grid */}
    <rect x="44" y="42" width="10" height="8" rx="1.5" fill="#0F766E" />
    <rect x="60" y="42" width="10" height="8" rx="1.5" fill="#0F766E" />
    <rect x="74" y="42" width="10" height="8" rx="1.5" fill="#0F766E" />
    <rect x="44" y="56" width="10" height="8" rx="1.5" fill="#0F766E" />
    <rect x="60" y="56" width="10" height="8" rx="1.5" fill="#0F766E" />
    <rect x="74" y="56" width="10" height="8" rx="1.5" fill="#0F766E" />
    {/* Building Entrance & Awning */}
    <polygon points="56,76 72,76 74,80 54,80" fill="#0F766E" />
    <rect x="58" y="80" width="12" height="18" rx="1" fill="#134E4A" />
  </OrionSquircleBase>
);

// 5. Shipments
export const IconShipments: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-shipments" from="#1D4ED8" to="#1E293B" {...props}>
    {/* Commercial Freight Delivery Truck */}
    {/* Truck Cargo Body */}
    <rect x="24" y="42" width="48" height="40" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
    <line x1="48" y1="42" x2="48" y2="82" stroke="#CBD5E1" strokeWidth="1.2" />
    {/* Truck Cab */}
    <path d="M 72 52 L 86 52 L 96 66 L 96 82 L 72 82 Z" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.2" />
    {/* Cab Windshield */}
    <polygon points="76,56 84,56 91,66 76,66" fill="#1E293B" />
    {/* Ground Road Line */}
    <line x1="18" y1="88" x2="108" y2="88" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    {/* Wheels with Aluminum Rims */}
    <circle cx="42" cy="85" r="9" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
    <circle cx="42" cy="85" r="4" fill="#CBD5E1" />
    <circle cx="84" cy="85" r="9" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
    <circle cx="84" cy="85" r="4" fill="#CBD5E1" />
  </OrionSquircleBase>
);

// 6. Quality
export const IconQuality: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-quality" from="#BE123C" to="#4C0519" {...props}>
    {/* Quality Inspection Rosette & Certified Stamp */}
    <circle cx="64" cy="54" r="26" fill="#F43F5E" stroke="#FECDD3" strokeWidth="2" />
    <circle cx="64" cy="54" r="18" fill="#E11D48" />
    <path d="M 54 54 L 61 61 L 75 47" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Ribbon Tails */}
    <polygon points="52,74 42,98 56,92 64,98 64,76" fill="#9F1239" />
    <polygon points="76,74 86,98 72,92 64,98 64,76" fill="#881337" />
  </OrionSquircleBase>
);

// 7. Invoice Matching (3-Way Match)
export const IconInvoiceMatching: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-inv-match" from="#0D9488" to="#134E4A" {...props}>
    {/* Precision Balance Scale */}
    <line x1="34" y1="46" x2="94" y2="46" stroke="#CCFBF1" strokeWidth="3" strokeLinecap="round" />
    <line x1="64" y1="38" x2="64" y2="88" stroke="#5EEAD4" strokeWidth="3.5" strokeLinecap="round" />
    <rect x="48" y="88" width="32" height="6" rx="3" fill="#FFFFFF" />
    {/* Left Pan */}
    <path d="M 34 46 L 24 68 L 44 68 Z" fill="#2DD4BF" />
    {/* Right Pan */}
    <path d="M 94 46 L 84 68 L 104 68 Z" fill="#2DD4BF" />
    {/* Center Pivot */}
    <circle cx="64" cy="46" r="4.5" fill="#FFFFFF" />
  </OrionSquircleBase>
);

// 8. Gate Receiving
export const IconGateReceiving: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-gate-recv" from="#1D4ED8" to="#172554" {...props}>
    {/* Physical Facility Boom Barrier */}
    <rect x="28" y="44" width="14" height="46" rx="3" fill="#60A5FA" />
    <rect x="86" y="44" width="14" height="46" rx="3" fill="#60A5FA" />
    <path d="M 36 52 L 92 52" stroke="#EF4444" strokeWidth="6" strokeDasharray="8 8" strokeLinecap="round" />
    <path d="M 36 52 L 92 52" stroke="#FFFFFF" strokeWidth="6" strokeDasharray="0 8 8 0" strokeLinecap="round" />
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
    {/* High-Bay Logistics Distribution Center Building */}
    {/* Gabled Roof & Building Facade */}
    <polygon points="26,44 64,26 102,44 102,96 26,96" fill="#065F46" stroke="#6EE7B7" strokeWidth="1.5" />
    {/* Roll-up Dock Shutter Door */}
    <rect x="44" y="58" width="40" height="38" rx="2" fill="#022C22" stroke="#A7F3D0" strokeWidth="1.2" />
    {/* Shutter Slats */}
    <line x1="44" y1="66" x2="84" y2="66" stroke="#34D399" strokeWidth="1.2" />
    <line x1="44" y1="74" x2="84" y2="74" stroke="#34D399" strokeWidth="1.2" />
    <line x1="44" y1="82" x2="84" y2="82" stroke="#34D399" strokeWidth="1.2" />
    <line x1="44" y1="90" x2="84" y2="90" stroke="#34D399" strokeWidth="1.2" />
    {/* Loading Dock Canopy */}
    <rect x="40" y="54" width="48" height="4" rx="1" fill="#FDE68A" />
    {/* Overhead Light Beacon */}
    <circle cx="64" cy="48" r="3" fill="#FEF08A" />
  </OrionSquircleBase>
);

// 12. Cost Optimizer
export const IconCostOptimizer: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-cost-opt" from="#059669" to="#022C22" {...props}>
    {/* Cost Efficiency Shears & Margin Trend */}
    <circle cx="46" cy="74" r="10" stroke="#6EE7B7" strokeWidth="2.5" fill="none" />
    <circle cx="82" cy="74" r="10" stroke="#6EE7B7" strokeWidth="2.5" fill="none" />
    <line x1="53" y1="67" x2="76" y2="40" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <line x1="75" y1="67" x2="52" y2="40" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <circle cx="64" cy="54" r="3.5" fill="#34D399" />
  </OrionSquircleBase>
);

// 13. Working Capital
export const IconWorkingCapital: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-working-cap" from="#15803D" to="#14532D" {...props}>
    {/* Financial Treasury Coin Stack & Currency Seal */}
    <ellipse cx="64" cy="42" rx="26" ry="9" fill="#86EFAC" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 38 42 L 38 60 C 38 65 50 69 64 69 C 78 69 90 65 90 60 L 90 42" fill="#22C55E" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 38 60 L 38 78 C 38 83 50 87 64 87 C 78 87 90 83 90 78 L 90 60" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 38 78 L 38 96 C 38 101 50 105 64 105 C 78 105 90 101 90 96 L 90 78" fill="#15803D" stroke="#FFFFFF" strokeWidth="1.5" />
    <text x="64" y="47" fontSize="13" fontWeight="bold" textAnchor="middle" fill="#14532D" fontFamily="sans-serif">$</text>
  </OrionSquircleBase>
);

// 14. Contracts
export const IconContracts: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-contracts" from="#4338CA" to="#1E1B4B" {...props}>
    {/* Executive Legal Agreement Document with Notary Wax Seal */}
    <rect x="32" y="24" width="64" height="80" rx="6" fill="#F8FAFC" stroke="#C7D2FE" strokeWidth="1.2" />
    <line x1="42" y1="38" x2="72" y2="38" stroke="#4338CA" strokeWidth="3" strokeLinecap="round" />
    <line x1="42" y1="48" x2="86" y2="48" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="42" y1="58" x2="86" y2="58" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="42" y1="68" x2="68" y2="68" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    {/* Signature Flow */}
    <path d="M 42 82 Q 48 76 54 82 T 66 80" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Notary Seal */}
    <circle cx="78" cy="80" r="10" fill="#DC2626" stroke="#FEF2F2" strokeWidth="1.5" />
    <polygon points="78,74 80,78 84,79 81,82 82,86 78,84 74,86 75,82 72,79 76,78" fill="#FEF3C7" />
  </OrionSquircleBase>
);

// 15. Communications
export const IconSupplierComms: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-comms" from="#0284C7" to="#075985" {...props}>
    {/* Classic Executive Mail Envelope with Folded Flap */}
    <rect x="28" y="38" width="72" height="52" rx="6" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
    {/* Envelope Fold Flaps */}
    <path d="M 28 40 L 64 68 L 100 40" stroke="#0284C7" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
    <line x1="28" y1="88" x2="52" y2="64" stroke="#BAE6FD" strokeWidth="1.5" />
    <line x1="100" y1="88" x2="76" y2="64" stroke="#BAE6FD" strokeWidth="1.5" />
  </OrionSquircleBase>
);

// 16. Logistics
export const IconLogistics: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-logistics" from="#C2410C" to="#7C2D12" {...props}>
    {/* Intermodal Steel Cargo Shipping Container */}
    <rect x="26" y="38" width="76" height="52" rx="4" fill="#EA580C" stroke="#FED7AA" strokeWidth="1.5" />
    {/* Corrugated Vertical Ribs */}
    <line x1="38" y1="38" x2="38" y2="90" stroke="#9A3412" strokeWidth="2" />
    <line x1="48" y1="38" x2="48" y2="90" stroke="#9A3412" strokeWidth="2" />
    <line x1="58" y1="38" x2="58" y2="90" stroke="#9A3412" strokeWidth="2" />
    <line x1="68" y1="38" x2="68" y2="90" stroke="#9A3412" strokeWidth="2" />
    <line x1="78" y1="38" x2="78" y2="90" stroke="#9A3412" strokeWidth="2" />
    <line x1="88" y1="38" x2="88" y2="90" stroke="#9A3412" strokeWidth="2" />
    {/* Dual Door Seams & Locking Bars */}
    <line x1="63" y1="38" x2="63" y2="90" stroke="#FED7AA" strokeWidth="2.5" />
    {/* Corner Casting Pockets */}
    <rect x="27" y="39" width="6" height="6" rx="1" fill="#7C2D12" />
    <rect x="95" y="39" width="6" height="6" rx="1" fill="#7C2D12" />
    <rect x="27" y="83" width="6" height="6" rx="1" fill="#7C2D12" />
    <rect x="95" y="83" width="6" height="6" rx="1" fill="#7C2D12" />
  </OrionSquircleBase>
);

// 17. Vital Signs
export const IconVitalSigns: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-vital-signs" from="#DC2626" to="#7F1D1D" {...props}>
    {/* Operating System Pulse Telemetry Wave */}
    <rect x="26" y="32" width="76" height="64" rx="6" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
    <line x1="26" y1="64" x2="102" y2="64" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
    <path d="M 30 64 L 46 64 L 52 44 L 60 84 L 70 38 L 78 72 L 84 64 L 98 64" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </OrionSquircleBase>
);

// 18. Trading Partners
export const IconTradingPartners: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-trading-partners" from="#6D28D9" to="#4C1D95" {...props}>
    {/* B2B Partner Handshake Crest */}
    <circle cx="48" cy="44" r="14" fill="#DDD6FE" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="80" cy="44" r="14" fill="#C4B5FD" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M 32 86 C 32 72 42 66 50 66 C 58 66 62 70 64 74 C 66 70 70 66 78 66 C 86 66 96 72 96 86 Z" fill="#A78BFA" />
    <line x1="52" y1="76" x2="76" y2="76" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
  </OrionSquircleBase>
);

// 19. Manufacturing & MRP
export const IconManufacturing: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-mfg" from="#B45309" to="#78350F" {...props}>
    {/* Industrial Factory Facility with Sawtooth Roof & Chimney */}
    {/* Smokestack */}
    <rect x="76" y="30" width="10" height="26" fill="#78350F" stroke="#FDE68A" strokeWidth="1" />
    {/* Factory Sawtooth Roof & Building */}
    <polygon points="26,92 26,60 44,46 44,60 62,46 62,60 88,46 98,46 98,92" fill="#D97706" stroke="#FEF3C7" strokeWidth="1.5" />
    {/* Factory Windows */}
    <rect x="36" y="68" width="8" height="12" rx="1" fill="#78350F" />
    <rect x="52" y="68" width="8" height="12" rx="1" fill="#78350F" />
    <rect x="68" y="68" width="8" height="12" rx="1" fill="#78350F" />
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

// 27. Guided Buy Workflow
export const IconBuyWorkflow: React.FC<{ size?: number; className?: string; active?: boolean }> = (props) => (
  <OrionSquircleBase gradientId="icon-buy-flow" from="#10B981" to="#047857" {...props}>
    {/* Shopping Bag with Lightning Sourcing Flow */}
    <path d="M 42 46 L 86 46 L 94 92 L 34 92 Z" fill="#34D399" stroke="#FFFFFF" strokeWidth="2.5" />
    <path d="M 52 46 C 52 32 76 32 76 46" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
    <circle cx="64" cy="68" r="8" fill="#065F46" />
    <path d="M 64 62 L 64 74 M 58 68 L 70 68" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
  </OrionSquircleBase>
);
