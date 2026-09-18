/**
 * ORION-9 VENDOR ONBOARDING & SOURCING RFQ CENTER
 * macOS-inspired Desktop Window Application for Layers 3, 4 & 9
 * 
 * Enforces Vendor Onboarding & Strategic Sourcing Lifecycle:
 * - Vendor Onboarding: INVITED -> APPLIED -> UNDER_REVIEW -> APPROVED -> ACTIVATED
 * - Strategic Sourcing RFQ: DRAFT -> PUBLISHED -> BIDS_RECEIVED -> EVALUATED -> AWARDED
 */

import React, { useState } from 'react';
import {
  Users,
  FileCheck,
  Building2,
  Award,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Search,
  Check,
  X,
  FileText
} from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { vendorStateMachine, VendorState } from '../kernel/StateMachine';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { formatCurrency } from '../lib/formatters';

export interface VendorApplication {
  id: string; // VAPP-2026-001
  companyName: string;
  category: string;
  country: string;
  contactEmail: string;
  taxId: string;
  dunsNumber: string;
  isoCertified: boolean;
  esgScore: number;
  financialStabilityRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'HIGH_RISK';
  status: VendorState;
  submittedAt: string;
  approvedBy?: string;
}

export interface SourcingRfq {
  id: string; // RFQ-2026-501
  title: string;
  category: string;
  targetQuantity: number;
  targetPriceMax: number;
  deadline: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EVALUATING' | 'AWARDED';
  bids: Array<{
    supplierId: string;
    supplierName: string;
    quotedUnitPrice: number;
    quotedLeadTimeDays: number;
    qualityScore: number;
    totalScore: number;
    awarded?: boolean;
  }>;
}

export const VendorOnboardingCenter: React.FC = () => {
  const { suppliers } = useSupplyChain();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<VendorApplication[]>([
    {
      id: 'VAPP-2026-011',
      companyName: 'Bavarian Precision Machining GmbH',
      category: 'Mechanical Engineering',
      country: 'Germany',
      contactEmail: 'sales@bavarian-precision.de',
      taxId: 'DE-994821094',
      dunsNumber: '31-904-8821',
      isoCertified: true,
      esgScore: 92,
      financialStabilityRating: 'AAA',
      status: 'UNDER_REVIEW',
      submittedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'VAPP-2026-012',
      companyName: 'Kyoto Micro Optics KK',
      category: 'Optoelectronics',
      country: 'Japan',
      contactEmail: 'procure@kyoto-micro.co.jp',
      taxId: 'JP-77410029',
      dunsNumber: '72-108-4419',
      isoCertified: true,
      esgScore: 88,
      financialStabilityRating: 'AA',
      status: 'APPLIED',
      submittedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'VAPP-2026-010',
      companyName: 'Nordic Polymer Composites Oy',
      category: 'Raw Materials',
      country: 'Finland',
      contactEmail: 'contact@nordic-polymer.fi',
      taxId: 'FI-4481029',
      dunsNumber: '11-884-2901',
      isoCertified: true,
      esgScore: 96,
      financialStabilityRating: 'AAA',
      status: 'ACTIVATED',
      submittedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      approvedBy: 'VP Global Sourcing'
    }
  ]);

  const [rfqs, setRfqs] = useState<SourcingRfq[]>([
    {
      id: 'RFQ-2026-501',
      title: 'Q4 2026 Titanium Precision Housing Frame Contract',
      category: 'Mechanical Components',
      targetQuantity: 2500,
      targetPriceMax: 300,
      deadline: '2026-10-15',
      status: 'EVALUATING',
      bids: [
        {
          supplierId: 'SUP-001',
          supplierName: 'Titan Micro Materials',
          quotedUnitPrice: 289,
          quotedLeadTimeDays: 14,
          qualityScore: 95,
          totalScore: 92.4,
          awarded: false
        },
        {
          supplierId: 'VAPP-2026-011',
          supplierName: 'Bavarian Precision Machining',
          quotedUnitPrice: 275,
          quotedLeadTimeDays: 18,
          qualityScore: 98,
          totalScore: 94.8,
          awarded: false
        }
      ]
    }
  ]);

  const [activeTab, setActiveTab] = useState<'onboarding' | 'rfq'>('onboarding');
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id);

  const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0];

  const handleUpdateVendorStatus = (targetState: VendorState) => {
    if (!selectedApp) return;

    try {
      vendorStateMachine.transition(selectedApp.id, selectedApp.status, targetState, {
        metadata: { actor: 'Global Sourcing Director' }
      });

      setApplications(prev =>
        prev.map(a => (a.id === selectedApp.id ? { ...a, status: targetState } : a))
      );

      kernelAuditEngine.record({
        action: `VENDOR_TRANSITION_${targetState}`,
        actor: { id: 'sourcing-lead', type: 'USER', name: 'Sourcing Director' },
        entityId: selectedApp.id,
        entityType: 'vendor',
        classification: 'CONFIDENTIAL',
        details: { fromState: selectedApp.status, toState: targetState }
      });

      showToast(`Vendor ${selectedApp.companyName} transitioned to ${targetState}.`, 'success', 'Vendor Status Updated');
    } catch (err: any) {
      showToast(err.message || 'Transition blocked by Vendor State Machine.', 'error', 'Governance Blocked');
    }
  };

  const handleAwardBid = (rfqId: string, supplierId: string) => {
    setRfqs(prev =>
      prev.map(rfq => {
        if (rfq.id === rfqId) {
          return {
            ...rfq,
            status: 'AWARDED',
            bids: rfq.bids.map(b => ({ ...b, awarded: b.supplierId === supplierId }))
          };
        }
        return rfq;
      })
    );

    kernelEventBus.publish('orion:rfq:awarded', {
      rfqId,
      awardedSupplierId: supplierId
    }, {
      actor: { id: 'sourcing-lead', type: 'USER', name: 'Sourcing Director' },
      entityId: rfqId,
      entityType: 'rfq'
    });

    showToast(`RFQ contract awarded to ${supplierId}! Purchase Order drafting initiated.`, 'success', 'Sourcing Contract Awarded');
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#161B22]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Users size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Vendor Onboarding & Sourcing RFQ Center
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Strategic Sourcing & Compliance
                </span>
              </h1>
              <p className="text-xs text-white/50">
                Supplier Due Diligence, ESG Scoring, Compliance Audit & Multi-Criteria RFQ Evaluation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeTab === 'onboarding' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Vendor Onboarding ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('rfq')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeTab === 'rfq' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Sourcing RFQs ({rfqs.length})
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'onboarding' && (
          <div className="h-full flex divide-x divide-white/10">
            {/* Left Applications List */}
            <div className="w-1/3 min-w-[340px] max-w-[440px] h-full overflow-y-auto divide-y divide-white/5 bg-[#12161D]">
              {applications.map(app => {
                const isSelected = app.id === selectedApp?.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`p-4 cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected ? 'bg-amber-600/15 border-l-2 border-amber-400' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white/90">{app.companyName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          app.status === 'ACTIVATED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : app.status === 'UNDER_REVIEW'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-white/60">{app.category} • {app.country}</div>
                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                      <span>ESG Score: {app.esgScore}/100</span>
                      <span className="font-mono text-emerald-400 font-bold">{app.financialStabilityRating} Rating</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Application Inspector */}
            <div className="flex-1 h-full overflow-y-auto p-6 bg-[#0D1117] space-y-6">
              {selectedApp ? (
                <>
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-amber-400 font-bold">{selectedApp.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                            {selectedApp.country}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white mt-1">{selectedApp.companyName}</h2>
                        <div className="text-xs text-white/50">{selectedApp.contactEmail}</div>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                        {selectedApp.status}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                      {selectedApp.status === 'APPLIED' && (
                        <button
                          onClick={() => handleUpdateVendorStatus('UNDER_REVIEW')}
                          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                        >
                          Commence Compliance Audit
                        </button>
                      )}

                      {selectedApp.status === 'UNDER_REVIEW' && (
                        <button
                          onClick={() => handleUpdateVendorStatus('APPROVED')}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <Check size={13} /> Approve Onboarding Application
                        </button>
                      )}

                      {selectedApp.status === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateVendorStatus('ACTIVATED')}
                          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow"
                        >
                          <ShieldCheck size={13} /> Activate Vendor in ERP Master
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vetting Information Grid */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Due Diligence & Compliance Credentials
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-white/40 uppercase">Tax Identifier</span>
                        <div className="font-mono text-white font-semibold mt-0.5">{selectedApp.taxId}</div>
                      </div>
                      <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-white/40 uppercase">D-U-N-S Number</span>
                        <div className="font-mono text-white font-semibold mt-0.5">{selectedApp.dunsNumber}</div>
                      </div>
                      <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-white/40 uppercase">ESG Sustainability</span>
                        <div className="text-emerald-400 font-bold mt-0.5">{selectedApp.esgScore} / 100</div>
                      </div>
                      <div className="p-3 rounded bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-white/40 uppercase">ISO 9001 Certification</span>
                        <div className="text-white font-semibold mt-0.5">
                          {selectedApp.isoCertified ? 'Verified Active' : 'Not Provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'rfq' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Strategic Sourcing RFQ Bids</h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Multi-Criteria Bid Scoring Matrix (Cost 40%, Quality 40%, Lead Time 20%)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {rfqs.map(rfq => (
                <div key={rfq.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400 font-bold">{rfq.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                          {rfq.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{rfq.title}</h4>
                      <div className="text-xs text-white/50">
                        Target Volume: {rfq.targetQuantity.toLocaleString()} Units • Max Target Rate: ${rfq.targetPriceMax} • Deadline: {rfq.deadline}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                      {rfq.status}
                    </span>
                  </div>

                  {/* Bids Evaluation Table */}
                  <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
                    <div className="grid grid-cols-5 p-2.5 bg-white/5 font-semibold text-white/60 text-[11px] uppercase">
                      <div>Bidding Supplier</div>
                      <div>Quoted Unit Price</div>
                      <div>Committed Lead Time</div>
                      <div>Evaluation Composite Score</div>
                      <div>Award Decision</div>
                    </div>
                    <div className="divide-y divide-white/5 bg-black/20">
                      {rfq.bids.map((bid, idx) => (
                        <div key={idx} className="grid grid-cols-5 p-2.5 text-white/80 items-center">
                          <div className="font-semibold text-white">{bid.supplierName}</div>
                          <div className="font-mono text-emerald-400 font-bold">${bid.quotedUnitPrice}</div>
                          <div className="font-mono text-white/70">{bid.quotedLeadTimeDays} Days</div>
                          <div className="font-mono font-bold text-indigo-300">{bid.totalScore} / 100</div>
                          <div>
                            {bid.awarded ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                                CONTRACT AWARDED
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAwardBid(rfq.id, bid.supplierId)}
                                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                              >
                                Award Contract
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
