/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Incident Center UI Component
 * 
 * Enterprise SEV1-SEV4 incident management, real-time triage board,
 * blast radius calculation, and append-only incident timeline ledgers.
 */

import React, { useState, useEffect } from 'react';
import {
  incidentManager,
  IncidentRecord,
  IncidentSeverity,
  IncidentStatus,
} from '../../operations';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  ShieldAlert,
  Flame,
  User,
  Activity,
  Layers,
} from 'lucide-react';

export const IncidentCenter: React.FC<{ tenantId?: string }> = ({ tenantId = 'GLOBAL' }) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [showDeclareModal, setShowDeclareModal] = useState(false);

  // Form states for new incident
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('SEV2');
  const [impactedModules, setImpactedModules] = useState('orders, shipments');
  const [rootCause, setRootCause] = useState('');

  // Event append state
  const [eventDescription, setEventDescription] = useState('');

  const loadIncidents = () => {
    const list = incidentManager.getAllIncidents(tenantId);
    setIncidents(list);
    if (list.length > 0 && !selectedIncident) {
      setSelectedIncident(list[0]);
    } else if (selectedIncident) {
      const updated = list.find(i => i.id === selectedIncident.id);
      if (updated) setSelectedIncident(updated);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [tenantId]);

  const handleDeclareIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const modules = impactedModules.split(',').map(m => m.trim()).filter(Boolean);
    const created = incidentManager.declareIncident({
      tenantId,
      title,
      description,
      severity,
      declaredBy: 'platform_admin',
      impactedModules: modules,
      rootCause: rootCause.trim() || undefined,
    });

    setTitle('');
    setDescription('');
    setRootCause('');
    setShowDeclareModal(false);
    loadIncidents();
    setSelectedIncident(created);
  };

  const handleUpdateStatus = (newStatus: IncidentStatus) => {
    if (!selectedIncident) return;
    incidentManager.updateIncidentStatus(
      selectedIncident.id,
      newStatus,
      'platform_admin',
      `Status transitioned to ${newStatus}`,
      `ACTION_${newStatus}`
    );
    loadIncidents();
  };

  const handleAppendEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !eventDescription.trim()) return;

    incidentManager.updateIncidentStatus(
      selectedIncident.id,
      selectedIncident.status,
      'platform_admin',
      eventDescription.trim()
    );
    setEventDescription('');
    loadIncidents();
  };

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'SEV1':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">SEV1 CRITICAL</span>;
      case 'SEV2':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">SEV2 MAJOR</span>;
      case 'SEV3':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">SEV3 MINOR</span>;
      case 'SEV4':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">SEV4 INFO</span>;
    }
  };

  const getStatusBadge = (st: IncidentStatus) => {
    switch (st) {
      case 'DETECTED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">DETECTED</span>;
      case 'INVESTIGATING':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">INVESTIGATING</span>;
      case 'MITIGATED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">MITIGATED</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">CLOSED</span>;
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <AlertOctagon className="h-6 w-6 text-rose-400" />
              Incident Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              SEV1–SEV4 Triage
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise operational outage management, root-cause linking, blast radius calculation, and immutable timeline auditing.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowDeclareModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition shadow-lg shadow-rose-600/20"
          >
            <PlusCircle className="h-4 w-4" />
            Declare Incident
          </button>
        </div>
      </div>

      {/* Main Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incidents List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Incident Queue ({incidents.length})</span>
            <span className="text-[10px] text-slate-500 font-mono">Sorted by recency</span>
          </div>

          <div className="space-y-2">
            {incidents.map(inc => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedIncident?.id === inc.id
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(inc.severity)}
                    <span className="text-xs font-mono text-slate-400">{inc.id}</span>
                  </div>
                  {getStatusBadge(inc.status)}
                </div>
                <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{inc.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.description}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Blast: {inc.blastRadiusScore}%</span>
                  <span>{new Date(inc.declaredAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Columns (2-col): Incident Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Detail Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getSeverityBadge(selectedIncident.severity)}
                    {getStatusBadge(selectedIncident.status)}
                    <span className="text-xs font-mono text-slate-500">{selectedIncident.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedIncident.description}</p>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2">
                  {selectedIncident.status === 'DETECTED' && (
                    <button
                      onClick={() => handleUpdateStatus('INVESTIGATING')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition"
                    >
                      Investigate
                    </button>
                  )}
                  {selectedIncident.status === 'INVESTIGATING' && (
                    <button
                      onClick={() => handleUpdateStatus('MITIGATED')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition"
                    >
                      Mitigate
                    </button>
                  )}
                  {selectedIncident.status === 'MITIGATED' && (
                    <button
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
                    >
                      Resolve
                    </button>
                  )}
                  {selectedIncident.status === 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus('CLOSED')}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 transition"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics & Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">Blast Radius Score</span>
                  <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-rose-400" />
                    {selectedIncident.blastRadiusScore}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">Impacted Modules</span>
                  <div className="text-xs font-medium text-slate-200 mt-1 truncate">
                    {selectedIncident.impactedModules.join(', ')}
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">Declared By</span>
                  <div className="text-xs font-medium text-slate-200 mt-1 truncate">
                    {selectedIncident.declaredBy}
                  </div>
                </div>
              </div>

              {/* Root Cause Analysis */}
              {selectedIncident.rootCause && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                    Confirmed Root Cause
                  </span>
                  <p className="text-xs text-slate-300">{selectedIncident.rootCause}</p>
                </div>
              )}

              {/* Timeline Ledger */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  Append-Only Timeline Ledger ({selectedIncident.timeline.length} events)
                </h3>

                <div className="space-y-3 pl-2 border-l-2 border-slate-800">
                  {selectedIncident.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative pl-4 space-y-1">
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-950"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs font-medium text-slate-300">by {event.actor}</span>
                        {event.statusChange && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-cyan-300 font-mono">
                            {event.statusChange}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{event.description}</p>
                    </div>
                  ))}
                </div>

                {/* Append Event Input */}
                <form onSubmit={handleAppendEvent} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={eventDescription}
                    onChange={e => setEventDescription(e.target.value)}
                    placeholder="Log an update or operational mitigation..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition"
                  >
                    Append Log
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">
              Select an incident from the queue to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Declare Incident Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-rose-400" />
                Declare Production Incident
              </h3>
              <button
                onClick={() => setShowDeclareModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeclareIncident} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Regional Logistics API Latency Spike"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SEV1">SEV1 - Critical Outage</option>
                    <option value="SEV2">SEV2 - Major Degradation</option>
                    <option value="SEV3">SEV3 - Minor Disruption</option>
                    <option value="SEV4">SEV4 - Informational</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Impacted Modules</label>
                  <input
                    type="text"
                    value={impactedModules}
                    onChange={e => setImpactedModules(e.target.value)}
                    placeholder="orders, shipments, twin"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the operational impact, observed errors, and affected customer orders..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Suspected Root Cause (Optional)</label>
                <input
                  type="text"
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  placeholder="e.g., Upstream carrier SSL certificate expiration"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclareModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white rounded-lg transition shadow-lg shadow-rose-600/20"
                >
                  Confirm Declaration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
