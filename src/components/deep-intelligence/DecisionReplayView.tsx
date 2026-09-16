import React, { useState } from 'react';
import { 
  RefreshCw, Play, Pause, ChevronRight, ArrowRight, Sparkles, AlertTriangle 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const DecisionReplayView: React.FC = () => {
  const [selectedReplay, setSelectedReplay] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const replays = [
    {
      id: 'REP-01',
      title: 'Disruption Response: Ocean Transit Delay (Sept 1st)',
      time: 'Sept 1, 2026, 09:12 AM',
      stateAtTime: 'Inbound raw materials vessel delayed at Aden Gulf (+4 days). Safety stock down to 2.1 days.',
      infoAvailable: 'API Maersk GPS Coordinate + Custom Clearance Speed estimates.',
      alternatives: [
        { name: 'Option A: Do Nothing', cost: '$0', consequence: 'High Stockout Risk (84% chance in 4 days)' },
        { name: 'Option B: Expedite via Airfreight', cost: '+$14,500', consequence: 'Saves Siemens assembly lines (96% certainty)' }
      ],
      chosen: 'Option B: Expedite via Airfreight',
      outcome: 'Actual: Batch arrived Sept 6th. Zero manufacturing lines disrupted. Siemens SLA protected.'
    }
  ];

  const activeRep = replays[selectedReplay];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
              DECISION REPLAY
            </span>
            <span className="text-xs font-mono text-slate-500">OPERATIONAL TIME-TRAVEL AUDITS</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Decision Replay</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Replay critical past decisions to analyze available context, alternative paths, and outcome accuracy in full simulated playback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Playback Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6 font-mono text-[11px] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <span className="font-bold text-os-text-primary uppercase">{activeRep.title}</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-cyan-400 flex items-center gap-1.5 uppercase font-bold text-[9px]"
                >
                  {isPlaying ? <Pause size={10} fill="#00F2FE" /> : <Play size={10} fill="#00F2FE" />}
                  <span>{isPlaying ? 'PAUSE PLAYBACK' : 'START REPLAY'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 leading-relaxed">
              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                <span className="text-slate-500 block uppercase font-bold text-[8px]">SYSTEM STATE AT DECISION TIME ({activeRep.time}):</span>
                <p className="text-os-text-secondary font-sans text-xs">{activeRep.stateAtTime}</p>
              </div>

              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                <span className="text-slate-500 block uppercase font-bold text-[8px]">INFORMATION AVAILABLE FOR AI INFERENCE:</span>
                <p className="text-os-text-secondary font-sans text-xs">{activeRep.infoAvailable}</p>
              </div>

              <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3">
                <span className="text-slate-500 block uppercase font-bold text-[8px]">ALTERNATIVES CONSIDERED:</span>
                <div className="space-y-2">
                  {activeRep.alternatives.map((alt, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] text-os-text-muted border-b border-slate-900/40 pb-2 last:border-b-0">
                      <span>{alt.name} (Cost: <strong className="text-os-text-primary">{alt.cost}</strong>)</span>
                      <span className="text-os-text-secondary font-sans">{alt.consequence}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-cyan-950/15 border border-cyan-500/30 rounded-xl space-y-1">
                <span className="text-cyan-400 block uppercase font-bold text-[8px]">CHOSEN PATH & OUTCOME REPLAYED:</span>
                <p className="text-os-text-primary font-sans text-xs font-bold">{activeRep.chosen}</p>
                <p className="text-os-text-secondary font-sans text-xs mt-1">{activeRep.outcome}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Data Trust */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Immutable blockchain ledger"
            freshness="Archived history"
            confidence={100}
            method="Cryptographically verifiable history"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              PLAYBACK INSIGHTS
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Replaying previous decisions helps supply chain directors audit past behaviors, isolate human-judgment biases, and trace exactly why automated autopilot algorithms chose specific alternate sourcing lanes.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
