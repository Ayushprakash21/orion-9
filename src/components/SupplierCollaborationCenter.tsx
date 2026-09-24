import React, { useState } from 'react';
import { 
  Users, Handshake, Layers, RefreshCw, CheckCircle2, 
  AlertTriangle, ArrowRight, Warehouse, DollarSign, Calendar
} from 'lucide-react';
import { 
  supplierCollaborationEngine, 
  vmiConsignmentEngine, 
  SupplierCommitmentRecord, 
  VmiConsignmentRecord 
} from '../scm';
import { useAuth } from '../store/AuthContext';

export const SupplierCollaborationCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [commitments, setCommitments] = useState<SupplierCommitmentRecord[]>(() => 
    supplierCollaborationEngine.getCommitments(tenantId)
  );
  const [vmiPools, setVmiPools] = useState<VmiConsignmentRecord[]>(() => 
    vmiConsignmentEngine.getStockPools(tenantId)
  );

  const [activeTab, setActiveTab] = useState<'CPFR' | 'VMI'>('CPFR');

  const refreshAll = () => {
    setCommitments(supplierCollaborationEngine.getCommitments(tenantId));
    setVmiPools(vmiConsignmentEngine.getStockPools(tenantId));
  };

  const handleSimulateCpfr = () => {
    supplierCollaborationEngine.recordCommitment({
      tenantId,
      supplierId: 'SUP-SEMICON-ADVANCED',
      productId: 'PROD-FPGA-PROCESSOR',
      monthPeriod: '2026-M11',
      sharedForecastUnits: 5000,
      supplierCommittedUnits: 4800,
      acknowledgementStatus: 'COMMITTED_IN_FULL'
    });
    refreshAll();
  };

  const handleSimulateVmi = () => {
    vmiConsignmentEngine.registerStockPool({
      tenantId,
      supplierId: 'SUP-FASTENERS-DIRECT',
      facilityLocationId: 'WH-CENTRAL-AUSTIN',
      productId: 'PROD-TI-BOLT-M8',
      stockType: 'VMI_SUPPLIER_OWNED',
      currentStockUnits: 3200,
      minThresholdUnits: 1500,
      maxThresholdUnits: 8000,
      reorderTriggerUnits: 2000
    });
    refreshAll();
  };

  const handleConsumeVmi = (vmiId: string) => {
    vmiConsignmentEngine.recordConsumption(tenantId, vmiId, 450);
    refreshAll();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="supplier-collaboration-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Handshake className="w-6 h-6 text-blue-400" />
              Supplier Collaboration, CPFR & VMI Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              SHARED PLANNING & CONSIGNMENT
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Collaborative Forecasting (CPFR), Capacity Commitments, Vendor-Managed Inventory (VMI), and Consignment Settlement.
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
          {activeTab === 'CPFR' ? (
            <button 
              onClick={handleSimulateCpfr}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Log CPFR Forecast Commitment
            </button>
          ) : (
            <button 
              onClick={handleSimulateVmi}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium transition-colors"
            >
              <Warehouse className="w-3.5 h-3.5" />
              Register VMI / Consignment Pool
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('CPFR')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'CPFR' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          CPFR Forecasts & Commitments ({commitments.length})
        </button>
        <button 
          onClick={() => setActiveTab('VMI')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'VMI' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          VMI & Consignment Stock Pools ({vmiPools.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'CPFR' ? (
        <div className="space-y-4">
          {commitments.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No CPFR commitments recorded. Click "Log CPFR Forecast Commitment" above.
            </div>
          ) : (
            commitments.map(c => (
              <div key={c.commitmentId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{c.supplierId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">{c.productId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">{c.monthPeriod}</span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      Committed: {c.supplierCommittedUnits.toLocaleString()} units • Shared Forecast: {c.sharedForecastUnits.toLocaleString()} units
                    </p>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {c.acknowledgementStatus}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded bg-black/40 border border-white/5">
                  <div>
                    <span className="text-white/40 block">Forecast Demand</span>
                    <span className="font-semibold text-white">{c.sharedForecastUnits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Supplier Committed</span>
                    <span className="font-semibold text-emerald-400">{c.supplierCommittedUnits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Capacity Constraint Gap</span>
                    <span className="font-semibold text-amber-300">{c.capacityConstraintGap.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {vmiPools.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No VMI or Consignment pools active. Click "Register VMI / Consignment Pool" above.
            </div>
          ) : (
            vmiPools.map(pool => (
              <div key={pool.vmiId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{pool.productId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">{pool.supplierId}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">{pool.stockType}</span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      Facility: {pool.facilityLocationId} • Min: {pool.minThresholdUnits} • Max: {pool.maxThresholdUnits}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleConsumeVmi(pool.vmiId)}
                    className="px-3 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
                  >
                    Simulate Consumption (450 units)
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] p-2 rounded bg-black/40 border border-white/5">
                  <div>
                    <span className="text-white/40 block">Current Stock</span>
                    <span className="font-bold text-emerald-400 text-sm">{pool.currentStockUnits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Reorder Threshold</span>
                    <span className="font-semibold text-amber-300">{pool.reorderTriggerUnits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Monthly Consumed</span>
                    <span className="font-semibold text-white">{pool.settledUnitsConsumedThisMonth.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Settlement Trigger</span>
                    <span className={`font-semibold ${pool.settlementTriggerPending ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pool.settlementTriggerPending ? 'PENDING SETTLEMENT' : 'UP TO DATE'}
                    </span>
                  </div>
                </div>

                {pool.supplierReplenishmentProposedQty && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Automated VMI Replenishment Proposal: <span className="font-bold text-white">{pool.supplierReplenishmentProposedQty} units</span> to restore max threshold.
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
