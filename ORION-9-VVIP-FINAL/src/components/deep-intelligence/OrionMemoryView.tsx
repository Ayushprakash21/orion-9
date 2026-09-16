import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { 
  Database, Search, HelpCircle, Sparkles, Clock, RefreshCw, 
  ArrowRight, ShieldCheck, FileText, ChevronRight, BookOpen 
} from 'lucide-react';
import { OrionDataTrust, OrionTimeline, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const OrionMemoryView: React.FC = () => {
  const { exceptions, decisions, dataMode } = useSupplyChain();
  const [searchQuery, setSearchQuery] = useState('');
  const [seenBeforeActive, setSeenBeforeActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const historicalMemories = [
    {
      id: 'MEM-001',
      title: 'Supplier Apex Components Late delivery (Mumbai Port Congestion)',
      context: 'Q1 Monsoon storms delayed vessel discharge, resulting in an 18-day shipping delay for material batches.',
      decision: 'Expedited 400 components from secondary supplier logistics channel.',
      action: 'Airfreight alternate route triggered via FedEx.',
      outcome: 'Stockout avoided, Siemens manufacturing lines remained active.',
      effectiveness: 'High (94% recovery rate)',
      lesson: 'Regional monsoon buffers must be adjusted by +7 days during seasonal weather corridors.',
      category: 'Suppliers'
    },
    {
      id: 'MEM-002',
      title: 'Regional Warehouse Alpha Congestion Surge',
      context: 'Seasonal demand spike on high-density SKU group caused WMS staging dock overflow.',
      decision: 'Rerouted 2 inbound shipments to backup logistics depot.',
      action: 'Update terminal routing coordinates in TMS.',
      outcome: 'Dock clearing rate normalized from 14 hours to 4 hours in 3 days.',
      effectiveness: 'Medium (72% speed recovery)',
      lesson: 'Pre-allocate backup logistics depots if regional distribution volume exceeds 80% capability.',
      category: 'Warehouse'
    },
    {
      id: 'MEM-003',
      title: 'Material SKU-402 defect threshold breach',
      context: 'Supplier quality rate fell below 85% due to sub-tier copper batch impurities.',
      decision: 'Issued quality hold on warehouse stocks; switched to certified pre-packaged supply.',
      action: 'Issued formal supplier rectification notice.',
      outcome: 'Customer defect rate minimized, production output stabilized in 5 days.',
      effectiveness: 'High (98% defect reduction)',
      lesson: 'Establish automated multi-batch metallurgical cert checks at port entry.',
      category: 'Quality'
    }
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery) return historicalMemories;
    return historicalMemories.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.context.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.lesson.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSeenBefore = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setSeenBeforeActive(true);
    }, 800);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
              ORION MEMORY ENGINE
            </span>
            <span className="text-xs font-mono text-slate-500">PERSISTENT RETROSPECTIVE RETRIEVAL</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Orion Supply Chain Memory</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Perpetually capturing and indexing past disruptions, counterfactual decisions, overrides, and outcomes to calibrate active recommendations.
          </p>
        </div>
      </div>

      {/* SEARCH SYSTEM */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <Search size={16} className="text-slate-500 shrink-0" />
            <input 
              type="text"
              placeholder="Query memory... E.g., 'Monsoon delay', 'Apex Components quality issue'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-os-text-primary placeholder-slate-600 text-xs w-full"
            />
          </div>
          
          <button 
            onClick={handleSeenBefore}
            disabled={isSearching}
            className="px-5 py-3 bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 text-[#00F2FE] rounded-xl border border-[#00F2FE]/30 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
          >
            {isSearching ? 'SEEKING MEMORY...' : 'HAVE WE SEEN THIS BEFORE?'}
          </button>
        </div>

        {/* Dynamic Search Context Prompt */}
        <div className="text-[10px] text-slate-500 font-mono uppercase flex items-center justify-between">
          <span>INDEXED MEMORY BANKS: 1,420 VECTORS</span>
          <span>SYSTEM ACCELERATION: ACTIVE</span>
        </div>
      </div>

      {/* RECENT MATCHES OR "HAVE WE SEEN THIS BEFORE" BOX */}
      {seenBeforeActive && (
        <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-3 font-mono text-[11px] animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-purple-400" />
            <span className="font-bold text-os-text-primary">ORION RETROSPECTIVE INTELLIGENCE REPORT</span>
          </div>
          <p className="text-xs text-os-text-secondary font-sans leading-relaxed">
            Orion detected **84% similarity** with an incident from Jan 2026. 
            <strong> Monsoon Storms</strong> disrupted the Mumbai ocean corridor. 
            The previous approved recovery playbook was: <strong>Reroute critical ocean POs via secondary airfreight bypass</strong>.
          </p>
          <div className="flex gap-4 text-[9px] text-slate-500 uppercase font-bold">
            <span>PREV OUTCOME: Siemens SLA Saved</span>
            <span>PREV COST: +$14,200</span>
          </div>
        </div>
      )}

      {/* CORE MEMORY CHUNKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Memory Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase flex items-center justify-between">
              <span>Historical Incident Memory Blocks</span>
              <span className="text-[9px] text-slate-500 font-normal">Showing {searchResults.length} incidents</span>
            </div>

            <div className="divide-y divide-slate-900">
              {searchResults.map((m) => (
                <div key={m.id} className="p-5 space-y-4 hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-os-text-primary text-xs uppercase">{m.title}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 text-slate-500 border border-slate-800">
                      {m.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-os-text-muted text-[11px] leading-relaxed">
                    <div className="space-y-1">
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">HISTORICAL CONTEXT:</span>
                      <p className="font-sans text-xs text-os-text-secondary">{m.context}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">DECISION REASONING:</span>
                      <p className="font-sans text-xs text-os-text-secondary">{m.decision}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-os-text-muted text-[10px] bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">ACTION:</span>
                      <span className="text-os-text-primary font-bold">{m.action}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">OUTCOME & EFFECTIVENESS:</span>
                      <span className="text-emerald-400 font-bold">{m.outcome} ({m.effectiveness})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">LESSON LEARNED:</span>
                      <span className="text-amber-400 font-bold">{m.lesson}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Trust & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Orion Memory Ledger"
            freshness="Immutable Records"
            confidence={99}
            method="Outcome audits & vectors"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-purple-400" />
              CHRONO LEDGER
            </h3>
            
            <div className="space-y-4">
              {historicalMemories.map((m, idx) => (
                <div key={idx} className="border-l-2 border-purple-500/20 pl-3 space-y-1">
                  <span className="text-slate-500 text-[9px]">BLOCK #{m.id}</span>
                  <div className="font-bold text-os-text-secondary text-[10px] uppercase truncate">{m.title}</div>
                  <p className="text-os-text-muted font-sans text-xs line-clamp-2">{m.lesson}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
