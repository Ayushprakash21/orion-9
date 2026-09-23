import React, { useState } from 'react';
import { 
  Network, Activity, Zap, ShieldAlert, AlertCircle, 
  RotateCcw, CheckCircle2, Play, RefreshCw, Layers,
  Terminal, ShieldCheck, Database
} from 'lucide-react';
import { integrationGateway } from '../../integration/gateway/IntegrationGateway';
import { deadLetterQueueManager, DeadLetterRecord } from '../../enterprise/events/DeadLetterQueueManager';
import { messageBroker } from '../../enterprise/events/MessageBroker';
import { useAuth } from '../../store/AuthContext';

export const IntegrationControlCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [activeTab, setActiveTab] = useState<'GATEWAY' | 'CIRCUIT_BREAKERS' | 'DLQ' | 'EVENT_TOPICS'>('GATEWAY');
  const [dlqRecords, setDlqRecords] = useState<DeadLetterRecord[]>(() => deadLetterQueueManager.listRecords(tenantId));
  const [selectedDlq, setSelectedDlq] = useState<DeadLetterRecord | null>(() => dlqRecords[0] || null);
  const [redriveSuccess, setRedriveSuccess] = useState<string | null>(null);

  // Circuit Breakers
  const systems = ['SAP', 'ORACLE', 'EDI_X12', 'REST_WEBHOOK'];
  const [breakers, setBreakers] = useState(() => 
    systems.map(s => ({
      system: s,
      breaker: integrationGateway.getCircuitBreaker(tenantId, s),
      telemetry: integrationGateway.getCircuitBreaker(tenantId, s).getTelemetry()
    }))
  );

  const refreshAll = () => {
    const updatedDlq = deadLetterQueueManager.listRecords(tenantId);
    setDlqRecords(updatedDlq);
    if (selectedDlq) {
      const refreshed = deadLetterQueueManager.getRecord(selectedDlq.dlqId);
      if (refreshed) setSelectedDlq(refreshed);
    }
    setBreakers(systems.map(s => ({
      system: s,
      breaker: integrationGateway.getCircuitBreaker(tenantId, s),
      telemetry: integrationGateway.getCircuitBreaker(tenantId, s).getTelemetry()
    })));
  };

  const handleRedrive = async (dlqId: string) => {
    const res = await deadLetterQueueManager.redriveMessage(dlqId);
    if (res.success) {
      setRedriveSuccess(`Message ${dlqId} successfully redriven to broker offset ${res.redriveOffset}`);
      setTimeout(() => setRedriveSuccess(null), 4000);
      refreshAll();
    }
  };

  const handleResetBreaker = (system: string) => {
    const b = integrationGateway.getCircuitBreaker(tenantId, system);
    b.reset('Admin Operator');
    refreshAll();
  };

  const handleSimulateFailure = (system: string) => {
    const b = integrationGateway.getCircuitBreaker(tenantId, system);
    b.onFailure('Operator injected test fault');
    refreshAll();
  };

  return (
    <div className="space-y-6 pb-12" data-testid="integration-control-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Network size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Integration Control Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              Perimeter Gateway, Token Bucket Rate Limiters, Circuit Breakers & DLQ Quarantine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh All Telemetry"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {redriveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={16} /> {redriveSuccess}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-os-border pb-2 text-xs font-mono">
        {[
          { id: 'GATEWAY', label: 'Perimeter Gateway' },
          { id: 'CIRCUIT_BREAKERS', label: 'Circuit Breakers' },
          { id: 'DLQ', label: `Dead Letter Queue (${dlqRecords.filter(d => d.status === 'QUARANTINED').length})` },
          { id: 'EVENT_TOPICS', label: 'Distributed Event Topics' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === t.id
                ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 font-bold'
                : 'text-os-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'GATEWAY' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="p-4 bg-[#0d1117] border border-os-border rounded space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-[#00F2FE]" />
                Perimeter Gateway Health & Inbound Telemetry
              </h2>
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-black/40 border border-os-border rounded">
                  <div className="text-[10px] text-os-text-muted uppercase">Rate Limiter Model</div>
                  <div className="text-[#00F2FE] font-bold mt-1">TOKEN BUCKET</div>
                  <div className="text-[10px] text-os-text-muted mt-0.5">100 burst / 20 req/s</div>
                </div>
                <div className="p-3 bg-black/40 border border-os-border rounded">
                  <div className="text-[10px] text-os-text-muted uppercase">Circuit Breakers</div>
                  <div className="text-emerald-400 font-bold mt-1">4 ACTIVE</div>
                  <div className="text-[10px] text-os-text-muted mt-0.5">Threshold: 5 failures</div>
                </div>
                <div className="p-3 bg-black/40 border border-os-border rounded">
                  <div className="text-[10px] text-os-text-muted uppercase">Idempotency Dedup</div>
                  <div className="text-purple-400 font-bold mt-1">STRICT HASH</div>
                  <div className="text-[10px] text-os-text-muted mt-0.5">TTL: 3600s cache</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0d1117] border border-os-border rounded space-y-3">
              <h2 className="text-sm font-bold text-white">Partner Token Bucket Rate Limiters</h2>
              <div className="space-y-2">
                {[
                  { partnerId: 'PARTNER_GLOBAL_SUPPLY', tokens: 94, max: 100 },
                  { partnerId: 'SAP_PRD_100', tokens: 99, max: 100 },
                  { partnerId: 'ORACLE_FA_TEST', tokens: 88, max: 100 },
                  { partnerId: 'ACME_LOGISTICS', tokens: 100, max: 100 }
                ].map(p => (
                  <div key={p.partnerId} className="p-2.5 bg-black/30 border border-os-border rounded flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{p.partnerId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#00F2FE] h-full"
                          style={{ width: `${(p.tokens / p.max) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-os-text-secondary">{p.tokens} / {p.max} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#0d1117] border border-os-border rounded p-4 space-y-4">
            <h2 className="text-sm font-bold text-white">Security & Zero-Plaintext Policy</h2>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-[11px]">
                  <ShieldCheck size={14} /> SecretReference Architecture
                </div>
                <p className="text-[11px] text-os-text-secondary">
                  Zero plaintext credentials stored in code, logs, UI, or Firestore. All ERP and EDI adapters reference KMS-secured vault paths.
                </p>
              </div>
              <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold text-[11px]">
                  <CheckCircle2 size={14} /> Replay Attack Prevention
                </div>
                <p className="text-[11px] text-os-text-secondary">
                  Idempotency keys prevent duplicate transaction executions. Secondary requests return cached results without re-executing business logic.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Circuit Breakers */}
      {activeTab === 'CIRCUIT_BREAKERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {breakers.map(b => (
            <div key={b.system} className="p-4 bg-[#0d1117] border border-os-border rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm font-mono">{b.system} Breaker</span>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded border font-bold uppercase ${
                  b.telemetry.state === 'CLOSED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : b.telemetry.state === 'HALF_OPEN'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {b.telemetry.state}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 bg-black/40 border border-os-border rounded">
                  <span className="text-os-text-muted">Consecutive Failures:</span>
                  <div className="text-white font-bold mt-0.5">{b.telemetry.consecutiveFailures} / 5</div>
                </div>
                <div className="p-2 bg-black/40 border border-os-border rounded">
                  <span className="text-os-text-muted">Last State Change:</span>
                  <div className="text-white font-bold mt-0.5 truncate">{new Date(b.telemetry.lastStateChange).toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-os-border/40">
                <button
                  type="button"
                  onClick={() => handleResetBreaker(b.system)}
                  className="px-2.5 py-1 text-[10px] font-mono bg-white/5 hover:bg-white/10 text-white rounded border border-os-border transition-colors"
                >
                  Manual Reset (Closed)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateFailure(b.system)}
                  className="px-2.5 py-1 text-[10px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded border border-rose-500/30 transition-colors"
                >
                  Inject Failure Probe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Dead Letter Queue */}
      {activeTab === 'DLQ' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <span className="text-sm font-bold text-white font-mono">Quarantined Messages ({dlqRecords.length})</span>
              <span className="text-xs text-os-text-muted font-mono">Poison Pill Protection Active</span>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
              {dlqRecords.map(record => (
                <div
                  key={record.dlqId}
                  onClick={() => setSelectedDlq(record)}
                  className={`p-3 bg-black/30 border rounded cursor-pointer transition-colors ${
                    selectedDlq?.dlqId === record.dlqId
                      ? 'border-[#00F2FE] bg-[#00F2FE]/10'
                      : 'border-os-border hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{record.dlqId}</span>
                      {record.isPoisonPill && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                          POISON PILL
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold uppercase ${
                      record.status === 'QUARANTINED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {record.status}
                    </span>
                  </div>

                  <div className="text-xs text-rose-300 mt-1 truncate">{record.failureReason}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted mt-2">
                    <span>Topic: {record.originalTopic}</span>
                    <span>Attempts: {record.attemptCount} / {record.maxAttempts}</span>
                  </div>
                </div>
              ))}
              {dlqRecords.length === 0 && (
                <div className="p-8 text-center text-os-text-muted text-xs italic">
                  Dead Letter Queue is empty. No quarantined messages.
                </div>
              )}
            </div>
          </div>

          {/* DLQ Inspector */}
          <div className="bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[560px] overflow-y-auto space-y-3">
            {selectedDlq ? (
              <>
                <div className="border-b border-os-border pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#00F2FE]">{selectedDlq.dlqId}</span>
                    <span className="text-[10px] font-mono text-os-text-muted">
                      {new Date(selectedDlq.quarantinedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-rose-400 mt-2">{selectedDlq.failureReason}</h3>
                </div>

                {selectedDlq.stackTrace && (
                  <div className="p-2.5 bg-black/60 border border-os-border rounded">
                    <div className="text-[10px] font-mono text-os-text-muted uppercase mb-1">Stack Trace</div>
                    <pre className="text-[10px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">{selectedDlq.stackTrace}</pre>
                  </div>
                )}

                <div className="p-2.5 bg-black/60 border border-os-border rounded">
                  <div className="text-[10px] font-mono text-os-text-muted uppercase mb-1">Original Payload</div>
                  <pre className="text-[10px] font-mono text-os-text-secondary overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedDlq.envelope.payload, null, 2)}
                  </pre>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRedrive(selectedDlq.dlqId)}
                    className="flex-1 py-2 bg-[#00F2FE]/20 hover:bg-[#00F2FE]/30 text-[#00F2FE] font-mono text-xs font-bold rounded border border-[#00F2FE]/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={13} /> Re-Drive Message
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-os-text-muted text-xs">
                Select a quarantined message to inspect
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Distributed Event Topics */}
      {activeTab === 'EVENT_TOPICS' && (
        <div className="space-y-3">
          {[
            { topic: 'enterprise.events.orders', partitions: 8, retention: '72h', count: messageBroker.getTopicMessages('enterprise.events.orders').length },
            { topic: 'enterprise.events.shipments', partitions: 8, retention: '72h', count: messageBroker.getTopicMessages('enterprise.events.shipments').length },
            { topic: 'enterprise.events.sap.inbound', partitions: 4, retention: '168h', count: messageBroker.getTopicMessages('enterprise.events.sap.inbound').length },
            { topic: 'enterprise.events.oracle.inbound', partitions: 4, retention: '168h', count: messageBroker.getTopicMessages('enterprise.events.oracle.inbound').length },
            { topic: 'enterprise.events.edi.inbound', partitions: 4, retention: '168h', count: messageBroker.getTopicMessages('enterprise.events.edi.inbound').length },
            { topic: 'enterprise.events.reconciliation', partitions: 4, retention: '72h', count: messageBroker.getTopicMessages('enterprise.events.reconciliation').length },
            { topic: 'enterprise.events.dlq', partitions: 2, retention: '720h', count: messageBroker.getTopicMessages('enterprise.events.dlq').length }
          ].map(t => (
            <div key={t.topic} className="p-3 bg-[#0d1117] border border-os-border rounded flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[#00F2FE]" />
                <span className="font-bold text-white">{t.topic}</span>
              </div>
              <div className="flex items-center gap-4 text-os-text-muted">
                <span>{t.partitions} Partitions</span>
                <span>Retention: {t.retention}</span>
                <span className="px-2 py-0.5 bg-black/40 text-white rounded border border-os-border">{t.count} messages</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
