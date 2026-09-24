import React, { useState } from 'react';
import { 
  ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, 
  HelpCircle, Wrench, RotateCcw, DollarSign, MessageSquare
} from 'lucide-react';
import { 
  warrantyManagementEngine, 
  customerServiceEngine, 
  WarrantyClaimRecord, 
  CustomerServiceCaseRecord 
} from '../scm';
import { useAuth } from '../store/AuthContext';

export const WarrantyServiceCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [claims, setClaims] = useState<WarrantyClaimRecord[]>(() => 
    warrantyManagementEngine.getClaims(tenantId)
  );
  const [cases, setCases] = useState<CustomerServiceCaseRecord[]>(() => 
    customerServiceEngine.getCases(tenantId)
  );

  const [activeTab, setActiveTab] = useState<'WARRANTY' | 'CASES'>('WARRANTY');

  const refreshAll = () => {
    setClaims(warrantyManagementEngine.getClaims(tenantId));
    setCases(customerServiceEngine.getCases(tenantId));
  };

  const handleSimulateClaim = () => {
    warrantyManagementEngine.submitClaim({
      tenantId,
      claimNumber: `CLM-${Date.now().toString().slice(-6)}`,
      customerId: 'CUST-AERO-DYNAMICS',
      productId: 'PROD-NAV-SENSOR-X9',
      productSerialNumber: `SN-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: 'ORD-9831',
      purchaseDate: '2026-03-15',
      claimDate: '2026-09-20',
      claimReason: 'Optical sensor calibration drift beyond tolerance threshold',
      resolution: 'REPLACE',
      totalWarrantyCost: 450,
      supplierRecoveryAmount: 380
    });
    refreshAll();
  };

  const handleSimulateCase = () => {
    customerServiceEngine.openCase({
      tenantId,
      customerId: 'CUST-TECH-LOGISTICS',
      orderId: 'ORD-CUST-4412',
      issueCategory: 'LATE_DELIVERY',
      priority: 'HIGH',
      slaDeadline: '2026-09-26T18:00:00Z',
      resolutionNotes: 'Customer inquiring regarding port congestion delay at Rotterdam.'
    });
    refreshAll();
  };

  const handleResolveClaim = (claimId: string) => {
    warrantyManagementEngine.resolveClaim({
      tenantId,
      claimId,
      resolution: 'REPLACE',
      inspectionFinding: 'Confirmed diode degradation under high-temperature testing. RMA replacement unit dispatched.',
      supplierRecoveryAmount: 380
    });
    refreshAll();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="warranty-service-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Warranty Management & Customer Care Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              SERIALIZED CLAIMS & SUPPLIER RECOVERY
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            End-to-End Resolution: Policy Validation, Diagnostic Inspection, Dispositions, Supplier Chargebacks, and Customer Care SLAs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {activeTab === 'WARRANTY' ? (
            <button 
              onClick={handleSimulateClaim}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              Log Serialized Claim
            </button>
          ) : (
            <button 
              onClick={handleSimulateCase}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Open Customer Ticket
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('WARRANTY')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'WARRANTY' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Serialized Warranty Claims ({claims.length})
        </button>
        <button 
          onClick={() => setActiveTab('CASES')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'CASES' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Customer Service Tickets ({cases.length})
        </button>
      </div>

      {/* Main Content */}
      {activeTab === 'WARRANTY' ? (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No warranty claims registered. Log a new serialized claim above.
            </div>
          ) : (
            claims.map(claim => (
              <div key={claim.claimId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{claim.claimNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80 font-mono">{claim.productSerialNumber}</span>
                      <span className="text-xs text-white/60">({claim.productId})</span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-1">
                      Reason: <span className="text-white font-medium">{claim.claimReason}</span> • Claim Date: {claim.claimDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      claim.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {claim.status}
                    </span>

                    {claim.status !== 'RESOLVED' && (
                      <button 
                        onClick={() => handleResolveClaim(claim.claimId)}
                        className="px-3 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                      >
                        Inspect & Resolve
                      </button>
                    )}
                  </div>
                </div>

                {claim.inspectionFinding && (
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 text-[11px] text-white/80">
                    <span className="text-emerald-400 font-semibold block mb-0.5">Diagnostic Finding:</span>
                    {claim.inspectionFinding}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded bg-white/5 border border-white/5">
                  <div>
                    <span className="text-white/40 block">Warranty Cost</span>
                    <span className="font-semibold text-white">${claim.totalWarrantyCost}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Supplier Recovery</span>
                    <span className="font-semibold text-emerald-400">${claim.supplierRecoveryAmount}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Recovery Status</span>
                    <span className="font-semibold text-blue-300">{claim.supplierRecoveryStatus}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {cases.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No customer support tickets open. Click "Open Customer Ticket" above.
            </div>
          ) : (
            cases.map(csCase => (
              <div key={csCase.caseId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{csCase.caseNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">{csCase.customerId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 font-semibold">
                        {csCase.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-1">
                      Category: <span className="text-white font-medium">{csCase.issueCategory}</span> • SLA Deadline: {new Date(csCase.slaDeadline).toLocaleString()}
                    </p>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {csCase.status}
                  </span>
                </div>

                {csCase.resolutionNotes && (
                  <p className="text-xs text-white/70 bg-black/40 p-2.5 rounded border border-white/5">
                    {csCase.resolutionNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
