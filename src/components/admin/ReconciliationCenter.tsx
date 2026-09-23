import React, { useState } from 'react';
import { 
  FileSpreadsheet, AlertTriangle, CheckCircle2, DollarSign, 
  RotateCcw, Check, RefreshCw, Filter, ArrowUpDown, 
  ShieldAlert, Layers, ShieldCheck
} from 'lucide-react';
import { 
  integrationReconciliationService, 
  ReconciliationFinding, 
  DiscrepancyType,
  DiscrepancySeverity,
  RemediationStatus
} from '../../integration/reconciliation/IntegrationReconciliationService';
import { useAuth } from '../../store/AuthContext';

export const ReconciliationCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [findings, setFindings] = useState<ReconciliationFinding[]>(() => 
    integrationReconciliationService.listFindings(tenantId)
  );
  const [selectedFinding, setSelectedFinding] = useState<ReconciliationFinding | null>(() => findings[0] || null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [resolutionMessage, setResolutionMessage] = useState<string | null>(null);

  const refreshFindings = () => {
    const list = integrationReconciliationService.listFindings(tenantId);
    setFindings(list);
    if (selectedFinding) {
      const updated = list.find(f => f.findingId === selectedFinding.findingId);
      if (updated) setSelectedFinding(updated);
    }
  };

  const handleResolve = (findingId: string, status: RemediationStatus) => {
    integrationReconciliationService.updateFindingStatus(findingId, status, profile?.fullName || profile?.displayName || 'admin');
    setResolutionMessage(`Finding ${findingId} marked as ${status}`);
    setTimeout(() => setResolutionMessage(null), 3500);
    refreshFindings();
  };

  const filteredFindings = findings.filter(f => {
    const matchSev = filterSeverity === 'ALL' || f.severity === filterSeverity;
    const matchStat = filterStatus === 'ALL' || f.status === filterStatus;
    return matchSev && matchStat;
  });

  const totalExposure = findings
    .filter(f => f.status === 'OPEN' || f.status === 'PROPOSED')
    .reduce((acc, f) => acc + f.financialExposureUsd, 0);

  const getSeverityBadge = (sev: DiscrepancySeverity) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  const getStatusBadge = (stat: RemediationStatus) => {
    switch (stat) {
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'APPROVED': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PROPOSED': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'OPEN': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DISMISSED': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="reconciliation-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Reconciliation Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              Cross-System Ledger Integrity, Discrepancy Diagnostics & Financial Exposure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshFindings}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh Findings"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {resolutionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={16} /> {resolutionMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0d1117] border border-os-border rounded">
          <div className="text-[10px] font-mono text-os-text-muted uppercase">Total Discrepancies</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{findings.length}</div>
        </div>
        <div className="p-4 bg-[#0d1117] border border-os-border rounded">
          <div className="text-[10px] font-mono text-os-text-muted uppercase">Unresolved Financial Exposure</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            ${totalExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-4 bg-[#0d1117] border border-os-border rounded">
          <div className="text-[10px] font-mono text-os-text-muted uppercase">Critical / High Severity</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length}
          </div>
        </div>
        <div className="p-4 bg-[#0d1117] border border-os-border rounded">
          <div className="text-[10px] font-mono text-os-text-muted uppercase">Reconciled / Dismissed</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {findings.filter(f => f.status === 'RESOLVED' || f.status === 'DISMISSED').length}
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Discrepancy Findings Table */}
        <div className="lg:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[600px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-os-border">
            <span className="text-sm font-bold text-white font-mono">Discrepancy Ledger ({filteredFindings.length})</span>
            <div className="flex items-center gap-2">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-xs font-mono bg-black/40 border border-os-border rounded px-2 py-1 text-os-text-secondary outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs font-mono bg-black/40 border border-os-border rounded px-2 py-1 text-os-text-secondary outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="PROPOSED">Proposed</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {filteredFindings.map(f => (
              <div
                key={f.findingId}
                onClick={() => setSelectedFinding(f)}
                className={`p-3 bg-black/30 border rounded cursor-pointer transition-colors ${
                  selectedFinding?.findingId === f.findingId
                    ? 'border-[#00F2FE] bg-[#00F2FE]/10'
                    : 'border-os-border hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold uppercase ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{f.discrepancyType}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold uppercase ${getStatusBadge(f.status)}`}>
                    {f.status}
                  </span>
                </div>

                <div className="text-xs text-os-text-secondary mt-1.5">
                  {f.varianceDetails.explanation}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-2 border-t border-os-border/40">
                  <span className="text-os-text-muted">
                    {f.externalSystem}: {f.partnerOrInstanceId} ({f.entityType})
                  </span>
                  <span className="text-rose-400 font-bold">
                    ${f.financialExposureUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
            {filteredFindings.length === 0 && (
              <div className="p-8 text-center text-os-text-muted text-xs italic">
                No discrepancy findings match the selected filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Finding Inspector & Remediation Gate */}
        <div className="bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[600px] overflow-y-auto space-y-4">
          {selectedFinding ? (
            <>
              <div className="border-b border-os-border pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#00F2FE] font-bold">{selectedFinding.findingId}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold uppercase ${getSeverityBadge(selectedFinding.severity)}`}>
                    {selectedFinding.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2">{selectedFinding.discrepancyType}</h3>
                <div className="text-xs font-mono text-os-text-muted mt-0.5">
                  Ref: {selectedFinding.orionReferenceId || 'N/A'} vs {selectedFinding.externalReferenceId || 'N/A'}
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded">
                <div className="text-[10px] font-mono text-rose-400 uppercase">Financial Exposure</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  ${selectedFinding.financialExposureUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3 bg-black/40 border border-os-border rounded space-y-2 text-xs">
                <div className="text-[10px] font-mono text-os-text-muted uppercase">Variance Details</div>
                <p className="text-os-text-secondary">{selectedFinding.varianceDetails.explanation}</p>
                {selectedFinding.varianceDetails.amountVariance !== undefined && (
                  <div className="text-[11px] font-mono text-amber-300">
                    Amount Delta: ${selectedFinding.varianceDetails.amountVariance.toFixed(2)}
                  </div>
                )}
                {selectedFinding.varianceDetails.unitVariance !== undefined && (
                  <div className="text-[11px] font-mono text-amber-300">
                    Quantity Delta: {selectedFinding.varianceDetails.unitVariance} units
                  </div>
                )}
              </div>

              {selectedFinding.remediationProposal && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded space-y-2 text-xs">
                  <div className="text-[10px] font-mono text-purple-400 uppercase font-bold flex items-center justify-between">
                    <span>Proposed Remediation Action</span>
                    <span className="text-[9px] text-os-text-muted">By: {selectedFinding.remediationProposal.proposedBy}</span>
                  </div>
                  <div className="font-mono text-white font-bold text-[11px]">
                    {selectedFinding.remediationProposal.action}
                  </div>
                  <p className="text-os-text-secondary text-[11px]">
                    {selectedFinding.remediationProposal.summary}
                  </p>
                </div>
              )}

              {/* Governed Remediation Action Buttons */}
              <div className="pt-2 border-t border-os-border space-y-2">
                {selectedFinding.status !== 'RESOLVED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleResolve(selectedFinding.findingId, 'RESOLVED')}
                      className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-xs font-bold rounded border border-emerald-500/40 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Approve & Execute Remediation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(selectedFinding.findingId, 'DISMISSED')}
                      className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-os-text-muted hover:text-white font-mono text-xs rounded border border-os-border transition-all"
                    >
                      Dismiss Discrepancy
                    </button>
                  </>
                )}
                {selectedFinding.status === 'RESOLVED' && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-center text-emerald-400 text-xs font-mono">
                    ✓ Resolved on {new Date(selectedFinding.resolvedAt || '').toLocaleString()} by {selectedFinding.resolvedBy}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-os-text-muted text-xs">
              Select a discrepancy finding to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
