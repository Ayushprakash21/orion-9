import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { 
  Zap, Search, Filter, Clock, ArrowRight, ShieldAlert, CheckCircle, 
  HelpCircle, ChevronRight, Activity, Database, AlertCircle, RefreshCw 
} from 'lucide-react';
import { OrionDataTrust, OrionTimeline, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const EventFabricView: React.FC = () => {
  const { purchaseOrders, shipments, exceptions, decisions, dataMode } = useSupplyChain();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const rawEvents = useMemo(() => {
    const list: any[] = [
      { id: 'EV-101', time: '10:42 AM', entity: 'PO-2026-0012', type: 'PO Updated', source: 'ERP SAP Ingest', severity: 'Medium', prev: 'Approved', next: 'In Transit', impact: '$45,000', status: 'PROCESSED', decision: 'Auto-Route' },
      { id: 'EV-102', time: '09:15 AM', entity: 'SUP-001', type: 'Supplier Promise Changed', source: 'Supplier Portal', severity: 'High', prev: 'OTIF 92%', next: 'OTIF 74%', impact: '$120,000', status: 'ACTION REQUIRED', decision: 'Buffer Rebalance' },
      { id: 'EV-103', time: '08:30 AM', entity: 'SHP-2026-0044', type: 'Shipment Delayed', source: 'Maersk GPS API', severity: 'High', prev: 'On Time', next: 'Delayed +4 Days', impact: '$85,000', status: 'INVESTIGATING', decision: 'Expedite Alternate' },
      { id: 'EV-104', time: 'Yesterday', entity: 'INV-1024', type: 'Inventory Threshold Crossed', source: 'Delhi WMS', severity: 'Medium', prev: 'Healthy', next: 'Below Safety Stock', impact: '$25,000', status: 'PROCESSED', decision: 'Reorder Trigger' },
      { id: 'EV-105', time: 'Yesterday', entity: 'FCST-02', type: 'Forecast Changed', source: 'Demand Planner', severity: 'Low', prev: 'Normal', next: '+12% Spike (Europe)', impact: '$18,000', status: 'RESOLVED', decision: 'Supply Align' },
      { id: 'EV-106', time: '2 days ago', entity: 'DEC-402', type: 'Decision Approved', source: 'Workflow Engine', severity: 'Low', prev: 'Proposed', next: 'Approved', impact: '$0', status: 'COMPLETE', decision: 'N/A' },
      { id: 'EV-107', time: '3 days ago', entity: 'SHP-2026-0021', type: 'Shipment Departed', source: 'Carrier Feed', severity: 'Low', prev: 'Planned', next: 'Picked Up', impact: '$0', status: 'RESOLVED', decision: 'N/A' }
    ];

    // Merge in dynamic data if exceptions exist
    exceptions.slice(0, 5).forEach((ex, idx) => {
      list.push({
        id: `EV-DYN-${idx}`,
        time: 'Active Now',
        entity: ex.entityId,
        type: ex.type,
        source: 'Orion Rules Engine',
        severity: ex.severity === 'Critical' ? 'High' : ex.severity === 'High' ? 'High' : 'Medium',
        prev: 'Normal State',
        next: ex.severity,
        impact: `$${Math.round(ex.estimatedImpact || 15000).toLocaleString()}`,
        status: ex.status.toUpperCase(),
        decision: ex.recommendedAction ? 'Resolve' : 'N/A'
      });
    });

    return list;
  }, [exceptions, refreshKey]);

  const filteredEvents = useMemo(() => {
    return rawEvents.filter(ev => {
      const matchSearch = ev.entity.toLowerCase().includes(searchQuery.toLowerCase()) || ev.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = selectedSeverity === 'ALL' || ev.severity.toUpperCase() === selectedSeverity;
      return matchSearch && matchSeverity;
    });
  }, [rawEvents, searchQuery, selectedSeverity]);

  const timelineEvents = useMemo(() => {
    return filteredEvents.map(e => ({
      time: e.time,
      title: `${e.type} (${e.entity})`,
      desc: `State shift: ${e.prev} → ${e.next}. Calculated exposure: ${e.impact}. Source: ${e.source}`,
      category: e.source,
      severity: e.severity.toLowerCase() as any
    }));
  }, [filteredEvents]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              PLATFORM OPERABILITY
            </span>
            <span className="text-xs font-mono text-slate-500">REAL-TIME OPERATIONAL SIGNAL ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Orion Event Fabric</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Unifying transactional changes, IoT telemetry, predictive alerts, and governance audits into a single, high-fidelity operational log.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setRefreshKey(prev => prev + 1); }}
            className="p-2 bg-slate-950 border border-slate-900 rounded-lg hover:border-slate-800 text-os-text-secondary flex items-center gap-2 font-mono text-xs"
            title="Refresh event stream"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>SYNC DATA</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OrionMetric label="Total Daily Events" value={rawEvents.length} icon={<Activity size={16} />} />
        <OrionMetric label="High Severity Events" value={rawEvents.filter(e => e.severity === 'High').length} icon={<AlertCircle size={16} className="text-red-400" />} severity="critical" />
        <OrionMetric label="Pending Exceptions" value={exceptions.filter(ex => ex.status !== 'Resolved').length} icon={<ShieldAlert size={16} />} severity="warning" />
        <OrionMetric label="Data Mode" value={dataMode.toUpperCase()} icon={<Database size={16} />} />
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950 border border-slate-900 p-4 rounded-xl font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Filter event stream..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-os-text-primary placeholder-slate-600 w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold uppercase">SEVERITY FILTER:</span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSeverity(s)}
              className={cn(
                "px-2.5 py-1 rounded text-[10px] font-bold transition-all border",
                selectedSeverity === s 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/40" 
                  : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-os-text-secondary"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* LAYOUT WITH STREAM & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Detailed Telemetry Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase">
              Operational Event Ingest Log
            </div>
            <div className="divide-y divide-slate-900">
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="p-4 bg-slate-950/20 hover:bg-slate-900/40 transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">{ev.time}</span>
                      <span className="font-bold text-os-text-primary">{ev.type}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-[9px] font-bold rounded uppercase border",
                      ev.severity === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      ev.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-900 text-slate-500 border-slate-800'
                    )}>
                      {ev.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-os-text-muted text-[10px]">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">ENTITY:</span>
                      <span className="text-os-text-secondary font-mono font-bold text-xs">{ev.entity}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">SOURCE GATEWAY:</span>
                      <span className="text-os-text-secondary">{ev.source}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">STATE SHIFT:</span>
                      <div className="flex items-center gap-1 text-os-text-secondary font-bold">
                        <span>{ev.prev}</span>
                        <ArrowRight size={10} className="text-slate-500 shrink-0" />
                        <span className="text-[#00F2FE]">{ev.next}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">EST. IMPACT:</span>
                      <span className="text-red-400 font-bold">{ev.impact}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 text-[9px] text-slate-500 uppercase font-bold">
                    <span>Related decision path: <strong className="text-os-text-secondary">{ev.decision}</strong></span>
                    <span>Status: <strong className="text-os-text-secondary">{ev.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Causal Timeline Sidecar */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Vite Operational Store Context"
            freshness="Continuous Sync active"
            confidence={95}
            method="Deterministic event triggers"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3">
              CAUSAL SEED TIMELINE
            </h3>
            <OrionTimeline events={timelineEvents} />
          </div>
        </div>
      </div>
    </div>
  );
};
