import React, { useState } from 'react';
import { 
  Users, Truck, Factory, ShoppingBag, ShieldCheck, Building2, 
  FileText, CheckCircle2, AlertTriangle, ArrowUpRight, Lock, Eye
} from 'lucide-react';

export type ExternalPartyType = 'SUPPLIER' | 'CARRIER' | '3PL' | 'CUSTOMER' | 'MANUFACTURING_PARTNER';

interface MultiPartyNetworkPortalProps {
  tenantId?: string;
  partyType?: ExternalPartyType;
}

export const MultiPartyNetworkPortal: React.FC<MultiPartyNetworkPortalProps> = ({ 
  tenantId = 'ORION_PLATFORM', 
  partyType: initialPartyType = 'SUPPLIER' 
}) => {
  const [activeParty, setActiveParty] = useState<ExternalPartyType>(initialPartyType);

  const partyPortals: { type: ExternalPartyType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'SUPPLIER', label: 'Supplier Collaboration Portal', icon: <Building2 className="w-5 h-5" />, desc: 'Confirm purchase orders, post ASNs, upload quality test certificates.' },
    { type: 'CARRIER', label: 'Carrier Logistics Portal', icon: <Truck className="w-5 h-5" />, desc: 'Accept tenders, report milestones, update GPS telemetry, request appointments.' },
    { type: '3PL', label: '3PL Warehouse Portal', icon: <Users className="w-5 h-5" />, desc: 'Inbound receipt confirmation, dynamic slotting, wave picking status.' },
    { type: 'CUSTOMER', label: 'Customer Order Portal', icon: <ShoppingBag className="w-5 h-5" />, desc: 'Real-time order tracking, predictive ETA, delivery scheduling.' },
    { type: 'MANUFACTURING_PARTNER', label: 'Contract Manufacturing Portal', icon: <Factory className="w-5 h-5" />, desc: 'Production progress, OEE tracking, component replenishment requests.' }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--orion-text)]">
              Multi-Party Orion External Network Portal
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              TENANT ISOLATED
            </span>
          </div>
          <p className="text-sm text-[var(--orion-text-secondary)] mt-1">
            Governed external partner collaboration matrix with end-to-end security boundary enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[var(--orion-text-muted)] bg-[var(--orion-surface)] px-3 py-1.5 rounded-lg border border-[var(--orion-border)]">
          <ShieldCheck className="w-4 h-4 text-[var(--orion-accent)]" />
          <span>Active Boundary: </span>
          <span className="font-bold text-[var(--orion-text)]">{tenantId}</span>
        </div>
      </div>

      {/* Party Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {partyPortals.map(portal => {
          const isSelected = activeParty === portal.type;
          return (
            <button
              key={portal.type}
              type="button"
              onClick={() => setActiveParty(portal.type)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] ring-2 ring-[var(--orion-accent)]/30'
                  : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:bg-[var(--orion-surface-hover)]'
              }`}
            >
              <div>
                <div className={`p-2 rounded-lg w-max mb-2 ${isSelected ? 'bg-[var(--orion-accent)] text-[var(--orion-on-accent)]' : 'bg-[var(--orion-surface-secondary)] text-[var(--orion-text)]'}`}>
                  {portal.icon}
                </div>
                <h4 className="text-xs font-bold text-[var(--orion-text)]">{portal.label.split(' ')[0]} {portal.label.split(' ')[1]}</h4>
                <p className="text-[11px] text-[var(--orion-text-secondary)] mt-1 line-clamp-2">{portal.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Portal Workspace */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--orion-border)] pb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--orion-text)] flex items-center gap-2">
              {partyPortals.find(p => p.type === activeParty)?.label}
            </h3>
            <p className="text-xs text-[var(--orion-text-secondary)] mt-0.5">
              Strictly scoped view for authenticated {activeParty.replace('_', ' ')} partners.
            </p>
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--orion-accent)] text-[var(--orion-on-accent)] hover:opacity-90 transition-opacity"
          >
            Submit Transaction
          </button>
        </div>

        {/* Sample Partner Document List Table */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)]">
            Active Partner Documents & Workflows
          </span>
          <div className="border border-[var(--orion-border)] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--orion-surface-secondary)] text-[var(--orion-text-muted)] font-mono text-[11px]">
                <tr>
                  <th className="p-3">DOCUMENT / TASK ID</th>
                  <th className="p-3">PARTNER NAME</th>
                  <th className="p-3">TYPE</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">AI AUTONOMY LEVEL</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--orion-border)] text-[var(--orion-text)] font-sans">
                <tr className="hover:bg-[var(--orion-surface-hover)]">
                  <td className="p-3 font-mono text-[var(--orion-accent)] font-semibold">PO-88210-CONFIRM</td>
                  <td className="p-3">Apex Component Systems</td>
                  <td className="p-3 font-mono">PO Acknowledgement</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      AUTONOMOUSLY CONFIRMED
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px]">LEVEL_4_GOVERNED</td>
                  <td className="p-3 text-right font-mono text-[var(--orion-accent)] cursor-pointer">View Details</td>
                </tr>

                <tr className="hover:bg-[var(--orion-surface-hover)]">
                  <td className="p-3 font-mono text-[var(--orion-accent)] font-semibold">ASN-49021-POST</td>
                  <td className="p-3">Pacific Freight Line</td>
                  <td className="p-3 font-mono">Advanced Shipping Notice</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">
                      PENDING VERIFICATION
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px]">LEVEL_3_APPROVAL_GATED</td>
                  <td className="p-3 text-right font-mono text-[var(--orion-accent)] cursor-pointer">Review & Approve</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
