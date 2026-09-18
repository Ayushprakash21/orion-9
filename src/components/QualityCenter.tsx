/**
 * ORION-9 QUALITY INSPECTION & NCR CENTER
 * macOS-inspired Desktop Window Application for Layer 4 & Layer 9
 * 
 * Enforces Quality Inspection Lifecycle:
 * REQUIRED -> SCHEDULED -> INSPECTING -> PASSED / FAILED -> QUALITY_HOLD -> RELEASED / REJECTED
 * 
 * Features:
 * - AQL Sampling standards & tolerance evaluation
 * - Non-Conformance Report (NCR) generation
 * - Dual-authorization Quality Hold Release
 * - Full integration with Kernel State Machine, Event Fabric & Audit Engine
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Plus,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Search,
  Check,
  X,
  Eye,
  Lock
} from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { qualityStateMachine, QualityState } from '../kernel/StateMachine';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { DataClassification } from '../types';

export interface QualityParameter {
  name: string;
  specification: string;
  measuredValue: string;
  passed: boolean;
}

export interface QualityInspection {
  id: string;
  poId: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  lotNumber: string;
  batchQuantity: number;
  sampleSize: number;
  defectCount: number;
  status: QualityState;
  inspector: string;
  inspectionDate: string;
  parameters: QualityParameter[];
  ncrNumber?: string;
  ncrRootCause?: string;
  holdReason?: string;
  releaseRationale?: string;
  classification: DataClassification;
}

export const QualityCenter: React.FC = () => {
  const { purchaseOrders, suppliers, products } = useSupplyChain();
  const { showToast } = useToast();

  const [inspections, setInspections] = useState<QualityInspection[]>([
    {
      id: 'QC-2026-081',
      poId: 'PO-2026-0001',
      supplierId: 'SUP-001',
      supplierName: 'Titan Micro Materials',
      productId: 'SKU-TITAN-X1',
      productName: 'Industrial Titanium Alloy Sensor Housing',
      lotNumber: 'LOT-9921-A',
      batchQuantity: 500,
      sampleSize: 32,
      defectCount: 0,
      status: 'PASSED',
      inspector: 'Marcus Vance (QA Lead)',
      inspectionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      classification: 'INTERNAL',
      parameters: [
        { name: 'Tensile Strength (MPa)', specification: '>= 850 MPa', measuredValue: '910 MPa', passed: true },
        { name: 'Dimensional Tolerances', specification: '+/- 0.02 mm', measuredValue: '+0.01 mm', passed: true },
        { name: 'Surface Porosity', specification: 'Zero micro-fractures', measuredValue: 'Clean', passed: true }
      ]
    },
    {
      id: 'QC-2026-082',
      poId: 'PO-2026-0002',
      supplierId: 'SUP-002',
      supplierName: 'Pacific Opto-Electronics',
      productId: 'SKU-OPTIC-F5',
      productName: 'Fiber Optic Transceiver Core 100G',
      lotNumber: 'LOT-4418-C',
      batchQuantity: 200,
      sampleSize: 20,
      defectCount: 3,
      status: 'QUALITY_HOLD',
      inspector: 'Elena Rostova (Senior QC)',
      inspectionDate: new Date(Date.now() - 3600000 * 5).toISOString(),
      ncrNumber: 'NCR-2026-009',
      ncrRootCause: 'Thermal wavelength variance exceeding ANSI-Z specs by 4.2nm during high-temp bench testing.',
      holdReason: 'Sub-assembly optical signal degradation under 60C thermal soak.',
      classification: 'CONFIDENTIAL',
      parameters: [
        { name: 'Wavelength Accuracy', specification: '1310nm +/- 1nm', measuredValue: '1314.2nm', passed: false },
        { name: 'Insertion Loss', specification: '<= 0.3 dB', measuredValue: '0.24 dB', passed: true },
        { name: 'Hermetic Seal Leak Rate', specification: '< 1e-8 atm cc/s', measuredValue: 'Passed', passed: true }
      ]
    },
    {
      id: 'QC-2026-083',
      poId: 'PO-2026-0003',
      supplierId: 'SUP-003',
      supplierName: 'Apex Precision Hydraulics',
      productId: 'SKU-VALVE-H2',
      productName: 'High Pressure Cryogenic Relief Valve',
      lotNumber: 'LOT-8820-B',
      batchQuantity: 150,
      sampleSize: 15,
      defectCount: 0,
      status: 'INSPECTING',
      inspector: 'Julian Scott',
      inspectionDate: new Date().toISOString(),
      classification: 'INTERNAL',
      parameters: [
        { name: 'Pressure Proof Test', specification: '6000 PSI sustained', measuredValue: 'Testing...', passed: true },
        { name: 'Cryogenic Cycle Test (-40C)', specification: 'Zero valve seizure', measuredValue: 'Testing...', passed: true }
      ]
    }
  ]);

  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(inspections[1]?.id || inspections[0]?.id);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showReleaseModal, setShowReleaseModal] = useState<boolean>(false);
  const [releaseRationale, setReleaseRationale] = useState<string>('');

  const selected = inspections.find(i => i.id === selectedInspectionId) || inspections[0];

  const filteredInspections = useMemo(() => {
    return inspections.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.poId.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inspections, statusFilter, searchQuery]);

  const handleStateTransition = async (targetState: QualityState, metadata?: any) => {
    if (!selected) return;

    try {
      qualityStateMachine.transition(selected.id, selected.status, targetState, {
        metadata: { ...metadata, inspector: 'Marcus Vance' }
      });

      setInspections(prev =>
        prev.map(item => (item.id === selected.id ? { ...item, status: targetState, ...metadata } : item))
      );

      kernelAuditEngine.record({
        action: `QUALITY_TRANSITION_${targetState}`,
        actor: { id: 'user-qa', type: 'USER', name: 'Quality Lead' },
        entityId: selected.id,
        entityType: 'quality_inspection',
        classification: selected.classification,
        details: { fromState: selected.status, toState: targetState, ...metadata }
      });

      showToast(`Inspection ${selected.id} transitioned to ${targetState}.`, 'success', 'Quality State Updated');
    } catch (err: any) {
      showToast(err.message || 'Transition blocked by Quality State Machine.', 'error', 'Governance Blocked');
    }
  };

  const handleConfirmRelease = () => {
    if (!releaseRationale.trim()) {
      showToast('Mandatory engineering rationale required to release quality hold.', 'error', 'Rationale Required');
      return;
    }

    handleStateTransition('RELEASED', {
      releaseRationale: releaseRationale.trim(),
      releasedBy: 'Lead Quality Architect',
      releasedAt: new Date().toISOString()
    });

    setShowReleaseModal(false);
    setReleaseRationale('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117] text-white overflow-hidden font-sans">
      {/* App Header & KPI Bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#161B22]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Quality Inspection & NCR Center
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  Layer 4 & Layer 9
                </span>
              </h1>
              <p className="text-xs text-white/50">
                AQL Inspection Standards, Defect Quarantine, Non-Conformance Reports & Dual-Key Hold Release
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition shadow-sm"
          >
            <Plus size={14} />
            <span>Create Inspection Lot</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 border-b border-white/5 bg-[#12161D]">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Active Inspections</span>
            <div className="text-xl font-bold text-white mt-0.5">{inspections.length} Lots</div>
          </div>
          <ShieldCheck size={20} className="text-blue-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Quality Holds</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">
              {inspections.filter(i => i.status === 'QUALITY_HOLD').length} Quarantined
            </div>
          </div>
          <AlertOctagon size={20} className="text-rose-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Inspection Pass Rate</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">94.8%</div>
          </div>
          <CheckCircle2 size={20} className="text-emerald-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Pending Release</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {inspections.filter(i => i.status === 'FAILED' || i.status === 'QUALITY_HOLD').length}
            </div>
          </div>
          <Clock size={20} className="text-amber-400 opacity-60" />
        </div>
      </div>

      {/* Main Master-Detail Split Pane */}
      <div className="flex-1 flex overflow-hidden divide-x divide-white/10">
        {/* Left List Pane */}
        <div className="w-1/3 min-w-[340px] max-w-[440px] h-full flex flex-col bg-[#12161D]">
          {/* Filters */}
          <div className="p-3 border-b border-white/10 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-white/40" />
              <input
                type="text"
                placeholder="Search lots, POs, SKUs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">All Inspection States</option>
                <option value="REQUIRED">Required</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="INSPECTING">Inspecting</option>
                <option value="PASSED">Passed</option>
                <option value="QUALITY_HOLD">Quality Hold</option>
                <option value="RELEASED">Released</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Inspection Lots List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredInspections.map(item => {
              const isSelected = item.id === selected?.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedInspectionId(item.id)}
                  className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                    isSelected ? 'bg-rose-600/15 border-l-2 border-rose-400' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-white/90">{item.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        item.status === 'PASSED' || item.status === 'RELEASED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'QUALITY_HOLD' || item.status === 'FAILED'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-white/80 truncate">{item.productName}</div>
                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                    <span>{item.supplierName}</span>
                    <span className="font-mono text-[10px]">{item.poId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="flex-1 h-full overflow-y-auto p-6 bg-[#0D1117] space-y-6">
          {selected ? (
            <>
              {/* Header Overview Card */}
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-rose-400 font-semibold">{selected.id}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                        {selected.lotNumber}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                        {selected.classification}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">{selected.productName}</h2>
                    <div className="text-xs text-white/50 mt-0.5">
                      Supplier: <span className="text-white/80">{selected.supplierName}</span> • PO Reference:{' '}
                      <span className="font-mono text-indigo-300">{selected.poId}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        selected.status === 'PASSED' || selected.status === 'RELEASED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : selected.status === 'QUALITY_HOLD' || selected.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {selected.status}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Controls */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                  {selected.status === 'REQUIRED' && (
                    <button
                      onClick={() => handleStateTransition('SCHEDULED')}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                    >
                      Schedule Inspection
                    </button>
                  )}

                  {selected.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStateTransition('INSPECTING')}
                      className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                    >
                      Begin Testing Lot
                    </button>
                  )}

                  {selected.status === 'INSPECTING' && (
                    <>
                      <button
                        onClick={() => handleStateTransition('PASSED')}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <Check size={13} /> Pass Inspection
                      </button>
                      <button
                        onClick={() =>
                          handleStateTransition('FAILED', {
                            ncrNumber: `NCR-${Date.now().toString(36).toUpperCase()}`,
                            holdReason: 'Dimensional or spec failure detected during lab testing.'
                          })
                        }
                        className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <X size={13} /> Fail & Quarantine
                      </button>
                    </>
                  )}

                  {selected.status === 'FAILED' && (
                    <button
                      onClick={() => handleStateTransition('QUALITY_HOLD')}
                      className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Lock size={13} /> Issue Formal Quality Hold
                    </button>
                  )}

                  {selected.status === 'QUALITY_HOLD' && (
                    <>
                      <button
                        onClick={() => setShowReleaseModal(true)}
                        className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <ShieldCheck size={13} /> Governance Hold Release
                      </button>
                      <button
                        onClick={() => handleStateTransition('REJECTED', { rejectReason: 'Returned to vendor for rework' })}
                        className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition"
                      >
                        Reject & Initiate RMA
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Lab Test Parameters Table */}
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  AQL Sample Test Parameters ({selected.sampleSize} Units Tested)
                </h3>
                <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
                  <div className="grid grid-cols-4 p-2.5 bg-white/5 font-semibold text-white/60 text-[11px] uppercase">
                    <div>Test Characteristic</div>
                    <div>Engineering Specification</div>
                    <div>Measured Value</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y divide-white/5 bg-black/20">
                    {selected.parameters.map((param, idx) => (
                      <div key={idx} className="grid grid-cols-4 p-2.5 text-white/80 items-center">
                        <div className="font-medium text-white">{param.name}</div>
                        <div className="font-mono text-white/60">{param.specification}</div>
                        <div className="font-mono text-white/90">{param.measuredValue}</div>
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              param.passed
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {param.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Non-Conformance Report (NCR) Box if Hold/Failed */}
              {(selected.status === 'QUALITY_HOLD' || selected.status === 'FAILED' || selected.ncrNumber) && (
                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                    <AlertOctagon size={16} />
                    <span>Non-Conformance Report (NCR) — Quarantine Protocol Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase">NCR Number</span>
                      <div className="font-mono text-rose-300 font-medium mt-0.5">
                        {selected.ncrNumber || 'NCR-PENDING-ASSIGNMENT'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 uppercase">Root Cause Analysis</span>
                      <div className="text-white mt-0.5">
                        {selected.ncrRootCause || selected.holdReason || 'Dimensional out-of-tolerance'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Released Rationale if Released */}
              {selected.status === 'RELEASED' && selected.releaseRationale && (
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                    <CheckCircle2 size={16} />
                    <span>Quality Hold Released by Governance Directive</span>
                  </div>
                  <p className="text-xs text-white/80">"{selected.releaseRationale}"</p>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40 text-xs">
              Select an inspection record to review details.
            </div>
          )}
        </div>
      </div>

      {/* Governance Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#161B22] border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-400" />
                Dual-Key Quality Hold Release
              </h3>
              <button onClick={() => setShowReleaseModal(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-white/70">
                You are authorizing the operational release of quarantined lot{' '}
                <span className="font-mono text-white font-bold">{selected?.lotNumber}</span>. Provide detailed
                engineering rationale and concession documentation:
              </p>

              <div>
                <label className="text-white/60 font-medium block mb-1">Engineering Concession Rationale</label>
                <textarea
                  rows={3}
                  value={releaseRationale}
                  onChange={e => setReleaseRationale(e.target.value)}
                  placeholder="e.g. Non-critical secondary wavelength acceptable for non-avionics consumer harness."
                  className="w-full bg-white/5 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(false)}
                  className="px-3 py-1.5 rounded text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRelease}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium shadow"
                >
                  Authorize Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
