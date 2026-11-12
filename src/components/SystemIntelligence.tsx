import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XOctagon, 
  RefreshCw, 
  Sliders, 
  ArrowRight, 
  Clock, 
  Users, 
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  Server
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dbManager } from '../core/database/DatabaseConnectionManager';
import { ORION_OS_METADATA } from '../os/constants/OrionOsMetadata';
import { useWindowManager } from '../os/WindowManagerContext';

interface SystemIncident {
  id: string;
  subsystem: 'API' | 'Database' | 'Integrations' | 'AI Core' | 'Window Manager' | 'Widgets';
  title: string;
  severity: 'Critical' | 'Warning' | 'Info';
  status: 'Open' | 'Investigating' | 'Resolved';
  timestamp: string;
  rootCause: string;
  recommendation: string;
  owner: string;
}

export const SystemIntelligence: React.FC = () => {
  const { openApplication } = useWindowManager();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<SystemIncident | null>(null);

  const incidents: SystemIncident[] = useMemo(() => [
    {
      id: 'INC-2026-081',
      subsystem: 'Integrations',
      title: 'SAP S/4HANA PO Ingestion Rate Fluctuation',
      severity: 'Warning',
      status: 'Open',
      timestamp: '12 mins ago',
      rootCause: 'ERP gateway reported transient throttling during scheduled batch run.',
      recommendation: 'Verify idempotency retry buffer and trigger reconciliation report.',
      owner: 'Integration Services',
    },
    {
      id: 'INC-2026-080',
      subsystem: 'AI Core',
      title: 'AI Proposal Execution Safety Check Enforced',
      severity: 'Info',
      status: 'Resolved',
      timestamp: '42 mins ago',
      rootCause: 'Autonomous replenishment proposal over $50k threshold routed to Human-in-the-Loop approval.',
      recommendation: 'Governance gate operated as designed under Rule 15.5.',
      owner: 'AI Governance',
    },
    {
      id: 'INC-2026-079',
      subsystem: 'Database',
      title: 'Outbox Sync Replay Verified',
      severity: 'Info',
      status: 'Resolved',
      timestamp: '2 hours ago',
      rootCause: 'Network reconnection after transient edge switch.',
      recommendation: 'All 24 pending transactions persisted without loss.',
      owner: 'Database Reliability',
    },
    {
      id: 'INC-2026-078',
      subsystem: 'Widgets',
      title: 'Supply Chain Pulse Reseed Validation',
      severity: 'Info',
      status: 'Resolved',
      timestamp: '4 hours ago',
      rootCause: 'Initial desktop widget hydrate routine initialized with telemetry feeds.',
      recommendation: 'Verified desktop workspace persistence active.',
      owner: 'Desktop Shell',
    },
  ], []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (filterSeverity !== 'all' && inc.severity.toLowerCase() !== filterSeverity.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          inc.title.toLowerCase().includes(q) ||
          inc.subsystem.toLowerCase().includes(q) ||
          inc.rootCause.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [incidents, filterSeverity, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white select-none overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Orion System Intelligence</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                HEALTH NOMINAL
              </span>
            </div>
            <div className="text-[11px] text-white/50">Continuous autonomous operational assessment, root-cause diagnostics, and health governance</div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-white/50 font-mono">DATABASE MODE</div>
            <div className="text-xs font-bold font-mono text-emerald-400">{dbManager.getEnvironment()}</div>
          </div>
          <button
            type="button"
            onClick={() => openApplication('activity-monitor')}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Activity Monitor</span>
          </button>
        </div>
      </div>

      {/* Subsystem Health Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 bg-white/[0.02] border-b border-white/[0.06] shrink-0 text-xs">
        {[
          { name: 'API Gateway', status: 'HEALTHY', latency: '< 60ms', color: 'text-emerald-400' },
          { name: 'Database Fabric', status: 'SYNCHRONIZED', latency: 'Zero lag', color: 'text-emerald-400' },
          { name: 'Integration Fabric', status: 'ACTIVE', latency: '4 Adapters', color: 'text-emerald-400' },
          { name: 'AI Reasoning Core', status: 'GOVERNED', latency: 'Deterministic', color: 'text-sky-400' },
          { name: 'Window Manager', status: 'OPTIMAL', latency: 'Z-Indexed', color: 'text-emerald-400' },
          { name: 'Desktop Widgets', status: 'MOUNTED', latency: 'Autonomous', color: 'text-emerald-400' },
        ].map((sub, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
            <div className="text-[10px] text-white/50 font-semibold uppercase truncate">{sub.name}</div>
            <div className={cn("text-xs font-bold font-mono mt-1", sub.color)}>{sub.status}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{sub.latency}</div>
          </div>
        ))}
      </div>

      {/* Incident Filtering & Roster */}
      <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Operational Incidents & Events</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
              {filteredIncidents.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents..."
                className="pl-8 pr-3 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 w-44"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all" className="bg-[#161b22]">All Severities</option>
              <option value="critical" className="bg-[#161b22]">Critical</option>
              <option value="warning" className="bg-[#161b22]">Warning</option>
              <option value="info" className="bg-[#161b22]">Info</option>
            </select>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="flex-1 border border-white/10 rounded-xl overflow-y-auto bg-white/[0.02] custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.05] text-white/60 font-semibold border-b border-white/10 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-3">Incident ID</th>
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3">Summary</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Detected</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => setSelectedIncident(inc)}>
                  <td className="py-2.5 px-3 font-bold text-sky-400">{inc.id}</td>
                  <td className="py-2.5 px-3 text-white/70 font-sans">{inc.subsystem}</td>
                  <td className="py-2.5 px-3 text-white font-sans font-medium">{inc.title}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      inc.severity === 'Critical' ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                      inc.severity === 'Warning' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                      "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    )}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "text-[10px] font-semibold uppercase",
                      inc.status === 'Resolved' ? "text-emerald-400" : "text-amber-400"
                    )}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white/50 font-sans">{inc.timestamp}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      className="text-white/50 hover:text-white p-1"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Incident Inspector */}
        {selectedIncident && (
          <div className="p-3.5 rounded-xl border border-sky-400/30 bg-sky-950/20 text-xs shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span>{selectedIncident.id}: {selectedIncident.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-white/40 hover:text-white text-xs"
              >
                Close Inspector
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-white/80">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-mono block mb-1">Root Cause Analysis</span>
                <span>{selectedIncident.rootCause}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-mono block mb-1">Recovery Recommendation</span>
                <span>{selectedIncident.recommendation}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.08] bg-[#161b22] flex items-center justify-between text-xs text-white/50 shrink-0 font-mono">
        <div>ORION-9 SYSTEM INTELLIGENCE ENGINE • CONTINUOUS OBSERVABILITY</div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Governance</span>
        </div>
      </div>
    </div>
  );
};

export default SystemIntelligence;
