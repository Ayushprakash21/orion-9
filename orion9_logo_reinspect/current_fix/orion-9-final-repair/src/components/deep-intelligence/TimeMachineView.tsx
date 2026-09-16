import React, { useState } from 'react';
import { 
  Clock, Play, Pause, ChevronRight, ArrowRight, Sparkles, AlertTriangle, Calendar
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const TimeMachineView: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState(false);

  const timelineData = [
    { label: 'Jan 2026', health: 91, exceptions: 1, stockouts: 0, status: 'Normal State' },
    { label: 'Mar 2026', health: 74, exceptions: 4, stockouts: 2, status: 'Mumbai Port Congestion' },
    { label: 'Jun 2026', health: 88, exceptions: 2, stockouts: 0, status: 'Corridors Stable' },
    { label: 'Sept 2026 (Live)', health: 82, exceptions: 3, stockouts: 1, status: 'Active Delays' }
  ];

  const active = timelineData[selectedIndex];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
              TIME MACHINE
            </span>
            <span className="text-xs font-mono text-slate-500">HISTORICAL STATE PLAYBACK</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Supply Chain Time Machine</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Travel back to any point in supply chain history to audit and scrub past network health, exception volumes, and inventory states.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Playback Scrubber Control */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6 font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <span className="font-bold text-os-text-primary uppercase flex items-center gap-2">
                <Calendar size={14} className="text-cyan-400" />
                HISTORICAL TIME SCRUBBER
              </span>
              <span className="text-cyan-400 font-bold uppercase tracking-widest">{active.label} selected</span>
            </div>

            {/* Scrubber visualization */}
            <div className="py-6 flex items-center justify-between gap-4 relative">
              <div className="absolute top-[43px] left-8 right-8 h-0.5 bg-slate-900 border-b border-slate-800 z-0" />
              {timelineData.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className="flex flex-col items-center gap-3 relative z-10 select-none group w-24"
                >
                  <span className={cn(
                    "text-[10px] font-bold transition-colors uppercase",
                    selectedIndex === idx ? "text-cyan-400" : "text-slate-500 group-hover:text-os-text-secondary"
                  )}>{t.label}</span>
                  <div className={cn(
                    "w-4 h-4 rounded-full border bg-slate-950 flex items-center justify-center transition-all",
                    selectedIndex === idx ? "border-cyan-400 scale-125" : "border-slate-800 group-hover:border-slate-600"
                  )}>
                    {selectedIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </div>
                  <span className="text-[8px] text-slate-600 uppercase font-bold text-center line-clamp-1 h-3">{t.status}</span>
                </button>
              ))}
            </div>

            {/* Simulated state metrics at time */}
            <div className="border-t border-slate-900 pt-6 space-y-4 font-mono text-[11px]">
              <span className="text-slate-500 uppercase font-bold text-[9px] block">NETWORK STATISTICS AT SELECT TIME:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[8px] font-bold block">SCM HEALTH INDEX:</span>
                  <div className="text-xl font-bold text-os-text-primary mt-1">{active.health}%</div>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[8px] font-bold block">ACTIVE EXCEPTIONS:</span>
                  <div className="text-xl font-bold text-red-400 mt-1">{active.exceptions}</div>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[8px] font-bold block">ACTIVE STOCKOUTS:</span>
                  <div className="text-xl font-bold text-amber-500 mt-1">{active.stockouts}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Data Trust */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Snapshotted database logs"
            freshness="Immutable history"
            confidence={100}
            method="Periodic network state snapshot backups"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              SYSTEM RE-LOGGING
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Travel back safely to explore past performance trends and analyze how policy modifications would have impacted historical outcomes under identical simulated circumstances.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
