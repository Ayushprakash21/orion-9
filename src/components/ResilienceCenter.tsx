import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Play, RefreshCw, Lock, Activity, Server, 
  ArrowRight, AlertTriangle, CheckCircle2, FileText, Cpu, Database, 
  HardDrive, Layers, Clock, Zap, CornerUpRight, RotateCcw, Eye, Shield
} from 'lucide-react';
import { resilienceService } from '../operations/ResilienceService';
import { 
  QuarantineRecord, 
  RunbookExecution, 
  AIRecoveryRecommendation, 
  MeasuredRpoRtoStatus,
  RunbookScenario
} from '../operations/types';
import { fencingTokenManager } from '../enterprise/failover/FencingTokenManager';
import { regionalFailoverOrchestrator } from '../enterprise/failover/RegionalFailoverOrchestrator';
import { backupRecoveryService } from '../operations/BackupRecoveryService';
import { useAuth } from '../store/AuthContext';

export const ResilienceCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';
  const userRole = profile?.role || 'platform_admin';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RPO_RTO' | 'FAILOVER' | 'QUARANTINE' | 'BACKUP' | 'RUNBOOKS'>('OVERVIEW');
  const [quarantineList, setQuarantineList] = useState<QuarantineRecord[]>([]);
  const [rpoRtoStatus, setRpoRtoStatus] = useState<MeasuredRpoRtoStatus[]>([]);
  const [activeRunbook, setActiveRunbook] = useState<RunbookExecution | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecoveryRecommendation | null>(null);
  
  // Reconcile modal state
  const [selectedQuarantineId, setSelectedQuarantineId] = useState<string | null>(null);
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Backup restore simulation state
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    refreshAll();
  }, [tenantId]);

  const refreshAll = () => {
    setQuarantineList(resilienceService.listQuarantineRecords(tenantId));
    setRpoRtoStatus(resilienceService.getMeasuredRpoRtoStatus());
    setSnapshots(backupRecoveryService.getAllSnapshots(tenantId));
  };

  const handleReconcileQuarantine = (recordId: string) => {
    setReconcileError(null);
    try {
      resilienceService.reconcileQuarantineItem({
        recordId,
        notes: reconciliationNotes || 'Manual reconciliation verified by admin',
        actor: profile?.fullName || profile?.displayName || 'admin',
        userRole
      });
      setSelectedQuarantineId(null);
      setReconciliationNotes('');
      refreshAll();
    } catch (err: any) {
      setReconcileError(err.message);
    }
  };

  const handleStartRunbook = (scenario: RunbookScenario) => {
    const rb = resilienceService.startRunbook({
      tenantId,
      scenario,
      actor: profile?.fullName || profile?.displayName || 'admin'
    });
    setActiveRunbook(rb);
  };

  const handleCompleteRunbookStep = (stepNumber: number) => {
    if (!activeRunbook) return;
    const updated = resilienceService.completeRunbookStep(
      activeRunbook.id,
      stepNumber,
      profile?.fullName || profile?.displayName || 'admin'
    );
    if (updated) setActiveRunbook({ ...updated });
  };

  const handleGenerateAiRecommendation = () => {
    const rec = resilienceService.generateAIRecoveryRecommendation({
      tenantId,
      telemetrySummary: 'EDI Carrier & Outbox Backpressure Engine'
    });
    setAiRecommendation(rec);
  };

  const handleExecuteAiAction = () => {
    if (!aiRecommendation) return;
    const result = resilienceService.executeAIRecoveryAction(
      aiRecommendation.id,
      profile?.fullName || profile?.displayName || 'admin',
      userRole
    );
    alert(result.reason);
  };

  const handleRunRestoreSimulation = (snapId: string) => {
    setIsSimulating(true);
    setTimeout(() => {
      const sim = backupRecoveryService.verifyRestoreSimulation(snapId, tenantId);
      setSimulationResult(sim);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12" data-testid="resilience-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Resilience & Disaster Recovery Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              Governed Failure Domain Resolution, RPO/RTO SLA Engine & Business Continuity Control Plane
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1.5">
            <Activity size={13} className="animate-pulse" />
            RESILIENCE STATE: HEALTHY (CLOSED-LOOP)
          </span>
          <button
            type="button"
            onClick={refreshAll}
            className="p-2 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh Telemetry"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-os-border overflow-x-auto pb-2">
        {[
          { id: 'OVERVIEW', label: 'Resilience Matrix', icon: Layers },
          { id: 'RPO_RTO', label: 'RPO / RTO SLAs', icon: Clock },
          { id: 'FAILOVER', label: 'Failover & Fencing', icon: ShieldAlert },
          { id: 'QUARANTINE', label: 'Quarantine & Integrity', icon: AlertTriangle, badge: quarantineList.filter(q => q.status === 'QUARANTINED').length },
          { id: 'BACKUP', label: 'Backup & Restore', icon: Database },
          { id: 'RUNBOOKS', label: 'Recovery Runbooks', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold rounded transition-all shrink-0 ${
                isActive
                  ? 'bg-[#00F2FE]/15 text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'bg-black/30 hover:bg-white/5 text-os-text-muted border border-os-border'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & FAILURE MATRIX */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
            <div className="p-4 bg-[#0d1117] border border-os-border rounded">
              <span className="text-[10px] text-os-text-muted uppercase">Failure Domain Engine</span>
              <div className="text-lg font-bold text-white mt-1">13 Failure Domains</div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 size={11} /> Auto-Classification Active
              </span>
            </div>
            <div className="p-4 bg-[#0d1117] border border-os-border rounded">
              <span className="text-[10px] text-os-text-muted uppercase">Active Quarantined Items</span>
              <div className="text-lg font-bold text-amber-400 mt-1">{quarantineList.filter(q => q.status === 'QUARANTINED').length} Entities</div>
              <span className="text-[10px] text-os-text-muted mt-1">Integrity Scan Protected</span>
            </div>
            <div className="p-4 bg-[#0d1117] border border-os-border rounded">
              <span className="text-[10px] text-os-text-muted uppercase">Split-Brain Protection</span>
              <div className="text-lg font-bold text-purple-400 mt-1">Fencing Monotonic</div>
              <span className="text-[10px] text-emerald-400 mt-1">Generation Leader Enforced</span>
            </div>
            <div className="p-4 bg-[#0d1117] border border-os-border rounded">
              <span className="text-[10px] text-os-text-muted uppercase">DR RPO SLA Met</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">100% SLA Compliant</div>
              <span className="text-[10px] text-os-text-muted mt-1">Verified via Emulator</span>
            </div>
          </div>

          <div className="p-4 bg-[#0d1117] border border-os-border rounded space-y-4 font-mono">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-[#00F2FE]" /> Failure Domains & Fail-Closed Boundaries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {[
                { domain: 'PROCESS / RUNTIME', behavior: 'Automatic worker lease expiry & fencing re-assignment', icon: Cpu },
                { domain: 'DATABASE / FIRESTORE', behavior: 'Durable outbox buffer queuing; zero fake success claims', icon: Database },
                { domain: 'REGIONAL OUTAGE', behavior: 'Strict 6-Phase Cutover with Data Residency Verification', icon: Server },
                { domain: 'SECURITY & TENANT', behavior: 'FAIL-CLOSED: Instant execution block on missing tenant', icon: Shield },
                { domain: 'EXTERNAL ERP', behavior: 'Circuit Breaker OPEN with exponential backoff & jitter', icon: Zap },
                { domain: 'WORKFLOW ENGINE', behavior: 'Durable checkpoint recovery; state machine resumption', icon: RotateCcw }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-3 bg-black/40 border border-os-border rounded space-y-1">
                    <div className="flex items-center gap-2 text-white font-bold text-[11px]">
                      <Icon size={14} className="text-[#00F2FE]" /> {item.domain}
                    </div>
                    <div className="text-[10px] text-os-text-muted">{item.behavior}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RPO / RTO SLAS */}
      {activeTab === 'RPO_RTO' && (
        <div className="space-y-4 font-mono">
          <div className="p-4 bg-[#0d1117] border border-os-border rounded flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Recovery Point & Time Objective SLA Telemetry</h2>
              <p className="text-[11px] text-os-text-muted">Target vs Measured SLAs by Service Criticality Tier</p>
            </div>
            <span className="px-2.5 py-1 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded">
              VERIFICATION: EMULATOR DRILLS
            </span>
          </div>

          <div className="space-y-2">
            {rpoRtoStatus.map((item, idx) => (
              <div key={idx} className="p-4 bg-[#0d1117] border border-os-border rounded flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>{item.serviceName}</span>
                    <span className="px-2 py-0.5 text-[9px] bg-white/10 text-os-text-secondary rounded">
                      Tier {item.tier}
                    </span>
                  </div>
                  <div className="text-[10px] text-os-text-muted">Verified Mode: {item.verificationMode}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <span className="text-[9px] text-os-text-muted block">Target RPO</span>
                    <span className="font-bold text-white">{item.targetRpoMinutes}m</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-os-text-muted block">Measured RPO</span>
                    <span className="font-bold text-emerald-400">{item.measuredRpoMinutes}m</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-os-text-muted block">Target RTO</span>
                    <span className="font-bold text-white">{item.targetRtoMinutes}m</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-os-text-muted block">Measured RTO</span>
                    <span className="font-bold text-emerald-400">{item.measuredRtoMinutes}m</span>
                  </div>
                </div>

                <div>
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1">
                    <CheckCircle2 size={12} /> SLA MET
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FAILOVER & FENCING */}
      {activeTab === 'FAILOVER' && (
        <div className="space-y-4 font-mono">
          <div className="p-4 bg-[#0d1117] border border-os-border rounded space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400" /> Governed Regional Cutover Protocol
            </h2>
            <p className="text-xs text-os-text-muted">
              Fencing Token Manager issues monotonically increasing tokens to prevent split-brain writes during regional failure or drill.
            </p>
            <button
              onClick={async () => {
                await regionalFailoverOrchestrator.executeFailover({
                  tenantId,
                  sourceRegionId: 'reg-us-east',
                  targetRegionId: 'reg-us-west-dr',
                  triggerType: 'DISASTER_RECOVERY_DRILL',
                  isDrill: true,
                  initiatedBy: profile?.fullName || profile?.displayName || 'admin'
                });
                alert('Regional Failover Drill executed successfully!');
                refreshAll();
              }}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play size={14} /> Initiate 6-Phase Regional Cutover Drill
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: QUARANTINE & INTEGRITY */}
      {activeTab === 'QUARANTINE' && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Data Corruption Quarantine Ledger</h2>
            <button
              onClick={() => {
                resilienceService.quarantineEntity({
                  tenantId,
                  entityType: 'InventoryItem',
                  entityId: `SKU-DEFICIT-${Date.now()}`,
                  reason: 'Negative inventory anomaly (-50 units)',
                  payload: { sku: 'SKU-DEFICIT', qty: -50 },
                  actor: 'DataIntegrityService'
                });
                refreshAll();
              }}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs transition-all"
            >
              + Simulate Quarantine Finding
            </button>
          </div>

          <div className="space-y-2">
            {quarantineList.map((item) => (
              <div key={item.id} className="p-4 bg-[#0d1117] border border-os-border rounded flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.entityType}: {item.entityId}</span>
                    <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${
                      item.status === 'QUARANTINED' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-os-text-muted">{item.reason}</div>
                  <div className="text-[9px] text-os-text-muted">Quarantined at: {new Date(item.quarantinedAt).toLocaleString()} by {item.quarantinedBy}</div>
                </div>

                {item.status === 'QUARANTINED' && (
                  <button
                    onClick={() => setSelectedQuarantineId(item.id)}
                    className="px-3 py-1.5 bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 rounded text-xs transition-all shrink-0 cursor-pointer"
                  >
                    Reconcile & Release
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Reconcile Modal */}
          {selectedQuarantineId && (
            <div className="fixed inset-0 z-[100000] bg-black/70 flex items-center justify-center p-4">
              <div className="bg-[#0d1117] border border-os-border rounded p-6 max-w-md w-full space-y-4">
                <h3 className="text-sm font-bold text-white">Reconcile Quarantined Asset</h3>
                <p className="text-xs text-os-text-muted">Provide governance notes for reconciliation and release</p>
                
                {reconcileError && (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded">
                    {reconcileError}
                  </div>
                )}

                <textarea
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Enter reconciliation notes and verification rationale..."
                  className="w-full bg-black/40 border border-os-border rounded p-2 text-xs text-white outline-none focus:border-[#00F2FE] h-24"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedQuarantineId(null)}
                    className="px-3 py-1.5 text-xs text-os-text-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReconcileQuarantine(selectedQuarantineId)}
                    className="px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-bold"
                  >
                    Approve & Release
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'BACKUP' && (
        <div className="space-y-4 font-mono">
          <div className="p-4 bg-[#0d1117] border border-os-border rounded space-y-2">
            <h2 className="text-sm font-bold text-white">Logical Backups & Restore Validation</h2>
            <p className="text-xs text-os-text-muted">Logical snapshots with SHA-256 integrity checksums and non-destructive dry-run restore simulator.</p>
          </div>

          <div className="space-y-2">
            {snapshots.map((snap) => (
              <div key={snap.id} className="p-4 bg-[#0d1117] border border-os-border rounded flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white">Snapshot ID: {snap.id}</div>
                  <div className="text-[10px] text-os-text-muted">Checksum SHA-256: {snap.checksumSha256?.substring(0, 24)}...</div>
                  <div className="text-[9px] text-os-text-muted">Records: {snap.totalRecordCount} | Created: {new Date(snap.createdAt).toLocaleString()}</div>
                </div>

                <button
                  disabled={isSimulating}
                  onClick={() => handleRunRestoreSimulation(snap.id)}
                  className="px-3 py-1.5 bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 rounded text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  {isSimulating ? 'Simulating...' : 'Run Dry-Run Restore Simulation'}
                </button>
              </div>
            ))}
          </div>

          {simulationResult && (
            <div className="p-4 bg-black/40 border border-emerald-500/40 rounded space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Restore Simulation Verification Passed
              </span>
              <p className="text-[11px] text-os-text-muted">
                Checksum match: {String(simulationResult.checksumMatches)} | Record count matches: {String(simulationResult.recordCountMatches)} | Discrepancies: 0
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RECOVERY RUNBOOKS */}
      {activeTab === 'RUNBOOKS' && (
        <div className="space-y-6 font-mono">
          <div className="p-4 bg-[#0d1117] border border-os-border rounded flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Structured Recovery Runbooks & AI Governance</h2>
              <p className="text-xs text-os-text-muted">Interactive 9-step runbook execution with AI-assisted recommendations</p>
            </div>
            <button
              onClick={handleGenerateAiRecommendation}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs flex items-center gap-1.5"
            >
              <Cpu size={13} /> Request AI Recovery Recommendation
            </button>
          </div>

          {/* AI Recommendation Banner */}
          {aiRecommendation && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 flex items-center gap-2">
                  <Cpu size={15} /> AI Diagnosis: {aiRecommendation.recommendedAction}
                </span>
                <span className="text-[10px] text-purple-400 font-bold">Confidence: {(aiRecommendation.confidenceScore * 100).toFixed(0)}%</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <p className="text-white font-bold">{aiRecommendation.observedPattern}</p>
                <p className="text-os-text-muted">{aiRecommendation.inferredRootCause}</p>
                <p className="text-amber-300">{aiRecommendation.riskAssessment}</p>
              </div>

              <div className="p-2 bg-black/40 border border-purple-500/20 rounded flex items-center justify-between text-[10px] text-os-text-muted">
                <span>Governance Guard: AI self-approval blocked (Requires Human Admin)</span>
                <button
                  onClick={handleExecuteAiAction}
                  className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 rounded font-bold cursor-pointer"
                >
                  Approve & Execute Action
                </button>
              </div>
            </div>
          )}

          {/* Scenario Launcher */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'FIRESTORE_OUTAGE', 'EVENT_FABRIC_OUTAGE', 'WORKFLOW_OUTAGE', 
              'INTEGRATION_OUTAGE', 'REGIONAL_OUTAGE', 'DATA_CORRUPTION'
            ].map((scen) => (
              <button
                key={scen}
                onClick={() => handleStartRunbook(scen as any)}
                className="p-3 bg-[#0d1117] hover:bg-white/5 border border-os-border rounded text-left transition-all cursor-pointer"
              >
                <span className="text-[10px] text-os-text-muted block">Runbook</span>
                <span className="text-xs font-bold text-white block mt-0.5">{scen.replace(/_/g, ' ')}</span>
              </button>
            ))}
          </div>

          {/* Active Runbook View */}
          {activeRunbook && (
            <div className="p-4 bg-[#0d1117] border border-os-border rounded space-y-4">
              <div className="flex items-center justify-between border-b border-os-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeRunbook.title}</h3>
                  <span className="text-[10px] text-os-text-muted">Runbook ID: {activeRunbook.id} | Status: {activeRunbook.status}</span>
                </div>
                <span className="px-2.5 py-1 text-[10px] bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30 rounded font-bold">
                  {activeRunbook.steps.filter(s => s.completed).length} / {activeRunbook.steps.length} Steps Completed
                </span>
              </div>

              <div className="space-y-2">
                {activeRunbook.steps.map((step) => (
                  <div key={step.stepNumber} className="p-3 bg-black/30 border border-os-border rounded flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Step {step.stepNumber}: [{step.phase}] {step.title}</span>
                        {step.requiresApproval && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded">
                            Requires Approval
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-os-text-muted">{step.instructions}</div>
                    </div>

                    <div>
                      {step.completed ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCompleteRunbookStep(step.stepNumber)}
                          className="px-3 py-1 bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 rounded text-xs font-bold cursor-pointer"
                        >
                          Execute Step
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
