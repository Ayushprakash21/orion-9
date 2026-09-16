import React, { useState } from 'react';
import { 
  Shield, Brain, Zap, Clock, CheckCircle2, AlertTriangle, HelpCircle, 
  Search, ArrowRight, Eye, Play, Sparkles, Filter, ChevronRight, X, Info, HelpCircle as HelpIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ==========================================
// 1. DATA TRUST INDICATOR
// ==========================================
export const OrionDataTrust: React.FC<{
  source?: string;
  freshness?: string;
  confidence?: number;
  method?: string;
  aiConfidence?: number;
  mode?: 'demo' | 'real' | 'simulated' | 'insufficient';
}> = ({
  source = 'ERP Ingestion + Inbound GPS',
  freshness = '5 mins ago',
  confidence = 94,
  method = 'Deterministic state calculation',
  aiConfidence = 88,
  mode = 'real'
}) => {
  return (
    <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 font-mono text-[11px] text-os-text-muted space-y-3">
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <span className="font-bold text-os-text-primary flex items-center gap-1.5 uppercase">
          <Shield size={12} className="text-cyan-400" /> DATA FIDELITY VENEER
        </span>
        <span className={cn(
          "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
          mode === 'real' ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30' :
          mode === 'demo' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
          mode === 'simulated' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
          'bg-amber-500/10 text-amber-500 border-amber-500/30'
        )}>
          {mode} MODE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">DATA SOURCE:</span>
            <span className="text-os-text-secondary font-bold">{source}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">DATA FRESHNESS:</span>
            <span className="text-os-text-secondary font-bold">{freshness}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">DETERMINISTIC CONFIDENCE:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-os-text-primary font-bold">{confidence}%</span>
              <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${confidence}%` }} />
              </div>
            </div>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">COGNITIVE AI CONFIDENCE:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-os-text-primary font-bold">{aiConfidence}%</span>
              <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${aiConfidence}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-2 flex items-center gap-1.5 leading-relaxed">
        <Info size={11} className="text-cyan-400 shrink-0" />
        <span>CALCULATION: {method}</span>
      </div>
    </div>
  );
};

// ==========================================
// 2. ORION METRIC WITH TREND
// ==========================================
export const OrionMetric: React.FC<{
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  icon?: React.ReactNode;
  severity?: 'normal' | 'warning' | 'critical';
}> = ({ label, value, subValue, trend, trendLabel, icon, severity = 'normal' }) => {
  return (
    <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex items-center justify-between hover:border-slate-800 transition-all font-mono">
      <div className="space-y-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-xl font-bold tracking-tight",
            severity === 'critical' ? 'text-red-400' : severity === 'warning' ? 'text-amber-400' : 'text-os-text-primary'
          )}>{value}</span>
          {trend && (
            <span className={cn(
              "text-[9px] font-bold uppercase",
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
            )}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
            </span>
          )}
        </div>
        {subValue && <span className="text-[10px] text-os-text-muted block">{subValue}</span>}
      </div>
      {icon && <div className="text-slate-700 bg-slate-900/40 p-2 rounded-lg border border-slate-900">{icon}</div>}
    </div>
  );
};

// ==========================================
// 3. CONFIDENCE RATING
// ==========================================
export const OrionConfidence: React.FC<{
  score: number;
  label?: string;
  color?: string;
}> = ({ score, label = 'SYSTEM CONFIDENCE', color = 'text-cyan-400' }) => {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px]">
      <span className="text-slate-500 uppercase tracking-widest font-bold">{label}:</span>
      <div className="flex items-center gap-1.5">
        <span className={cn("font-bold", color)}>{score}%</span>
        <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${score}%`, backgroundColor: score > 80 ? '#30D158' : score > 50 ? '#FF9F0A' : '#FF453A' }} />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. EVIDENCE PANEL
// ==========================================
export const OrionEvidencePanel: React.FC<{
  evidences: string[];
}> = ({ evidences }) => {
  return (
    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2 font-mono text-[10px] text-os-text-muted">
      <span className="font-bold text-os-text-primary block uppercase tracking-wider">SUPPORTING EVIDENCE:</span>
      <ul className="space-y-1.5 list-none pl-0">
        {evidences.map((ev, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-cyan-400 shrink-0 font-bold">✓</span>
            <span className="text-os-text-secondary leading-relaxed">{ev}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ==========================================
// 5. GLOBAL INTELLIGENCE DRAWER
// ==========================================
export const OrionIntelligenceDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  contextEntity?: { type: string; id: string; name?: string };
}> = ({ isOpen, onClose, contextEntity }) => {
  if (!isOpen) return null;

  const entityName = contextEntity?.name || contextEntity?.id || 'GLOBAL SYSTEM';
  const entityType = contextEntity?.type || 'CORE NETWORK';

  const questions = [
    { text: 'WHY IS THIS AT RISK?', ans: 'Inbound PO is delayed due to customs congestion at Port of Mumbai (+1.2 days above threshold).' },
    { text: 'WHAT BREAKS FIRST?', ans: 'Warehouse staging inventory levels drop to 0 in 3 days. Affected production batches: Batch 102A.' },
    { text: 'SHOW ME THE BLAST RADIUS', ans: 'Downstream impact covers 2 core customer deliveries (BMW, Siemens) with total potential margin impact of $120,000.' },
    { text: 'WHAT HAPPENS IF WE DO NOTHING?', ans: 'Out-of-stock exception triggers in 4 days, resulting in production stoppage and an automatic $15,000 SLA penalty.' },
    { text: 'SHOW ME THE ALTERNATIVE', ans: 'Rerouting shipment SHP-402 via FedEx Express reduces transit time by 4.5 days, retaining Siemens SLA integrity (Cost: +$4,200).' },
    { text: 'WHAT SHOULD I NOT DO?', ans: 'Do NOT delay alternate route selection past tomorrow 4:00 PM, as flight space reservations decay by 12% hourly.' },
    { text: 'WHAT INFORMATION AM I MISSING?', ans: 'Carrier ETA verification for the final land-haul portion is currently unconfirmed (Awaiting GPS stream).' },
    { text: 'HAVE WE SEEN THIS BEFORE?', ans: 'Yes, 3 times with Supplier A Tech in Q1. Primary resolution pattern: Expedite Air Shipping.' },
    { text: 'WHAT IS QUIETLY GETTING WORSE?', ans: 'Supplier Promise Strength has quietly drifted from 94% to 72% over 60 days without triggering threshold alert limits.' },
    { text: 'WHAT IS THE NEXT CONSTRAINT?', ans: 'Labor availability at Warehouse Delhi docks if air shipment is expedited and received concurrently.' },
    { text: 'WHAT CAN BE AUTOMATED?', ans: 'Supplier delay communication dispatch can be safely handed over to Level 4 autopilot workflow.' }
  ];

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#07090e] border-l border-slate-900 shadow-2xl flex flex-col font-mono text-os-text-secondary animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold uppercase">
              {entityType}
            </span>
            <span className="text-slate-500 text-[10px] uppercase font-bold">ORION HUD CONTEXT</span>
          </div>
          <h2 className="text-sm font-bold text-os-text-primary uppercase truncate max-w-[280px]">
            {entityName} Diagnostics
          </h2>
        </div>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-os-text-primary hover:bg-slate-900 rounded transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">CONTEXT SENSE REASONING:</span>
          <p className="text-xs text-os-text-secondary font-sans leading-relaxed">
            Select a telemetry diagnostic query below. Orion will decompose the current active graph database state using the Gemini LLM engine to deliver instant evidence-backed answers.
          </p>
        </div>

        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div key={idx} className="border border-slate-900 bg-slate-950 rounded-xl overflow-hidden hover:border-slate-800 transition-colors">
              <button 
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                className="w-full text-left p-3 flex items-center justify-between text-[11px] font-bold text-os-text-primary"
              >
                <span className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">▪</span>
                  <span>{q.text}</span>
                </span>
                <ChevronRight size={12} className={cn("text-slate-500 transition-transform", activeIdx === idx && "rotate-90 text-cyan-400")} />
              </button>
              {activeIdx === idx && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-900 bg-slate-950/40 text-[11px] font-sans leading-relaxed text-os-text-muted">
                  <p className="p-2 border border-[#00F2FE]/20 bg-[#00F2FE]/5 rounded-lg text-os-text-secondary mb-2 font-mono text-[10px] leading-relaxed">
                    {q.ans}
                  </p>
                  <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500">
                    <span>Source: Live Twin Stream</span>
                    <span>Confidence: 96%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-500 uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
        <Sparkles size={11} className="text-cyan-400" />
        <span>Gemini LLM Cognitive Layer Active</span>
      </div>
    </div>
  );
};

// ==========================================
// 6. EVENT TIMELINE
// ==========================================
export const OrionTimeline: React.FC<{
  events: { time: string; title: string; desc: string; category?: string; severity?: 'high' | 'medium' | 'low' }[];
}> = ({ events }) => {
  return (
    <div className="space-y-4 font-mono text-[11px]">
      <div className="relative border-l border-slate-900 pl-4 space-y-6">
        {events.map((ev, i) => (
          <div key={i} className="relative">
            <div className={cn(
              "absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border bg-slate-950",
              ev.severity === 'high' ? 'border-red-400 shadow-[0_0_8px_#FF453A]' :
              ev.severity === 'medium' ? 'border-amber-400 shadow-[0_0_8px_#FF9F0A]' :
              'border-cyan-400 shadow-[0_0_8px_#00F2FE]'
            )} />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">{ev.time}</span>
                {ev.category && <span className="text-cyan-400 uppercase tracking-widest">{ev.category}</span>}
              </div>
              <h4 className="font-bold text-os-text-primary">{ev.title}</h4>
              <p className="text-os-text-muted leading-relaxed font-sans text-xs">{ev.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 7. ORION GRAPH REPRESENTATION
// ==========================================
export const OrionGraph: React.FC<{
  nodes: { id: string; label: string; group: string; status?: string; x: number; y: number }[];
  links: { source: string; target: string; active?: boolean }[];
  onNodeClick?: (node: any) => void;
}> = ({ nodes, links, onNodeClick }) => {
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 relative overflow-hidden h-[400px]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#090d16_1px,transparent_1px),linear-gradient(to_bottom,#090d16_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />
      
      {/* HUD Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-10 font-mono text-[9px] text-slate-500 uppercase tracking-widest space-y-1">
        <div>LIVE ORION KNOWLEDGE TOPOLOGY</div>
        <div className="text-cyan-400">Status: Synced with World Model</div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {/* Render actual visual map instead of absolute empty */}
        <svg className="w-full h-full max-w-[600px] max-h-[300px]" viewBox="0 0 600 300">
          {/* SVG Links */}
          {links.map((link, i) => {
            const sn = nodes.find(n => n.id === link.source);
            const tn = nodes.find(n => n.id === link.target);
            if (!sn || !tn) return null;
            return (
              <g key={i}>
                <line 
                  x1={sn.x} y1={sn.y} 
                  x2={tn.x} y2={tn.y} 
                  stroke={link.active ? '#00F2FE' : '#1e293b'} 
                  strokeWidth={link.active ? 1.5 : 1}
                  strokeDasharray={link.active ? "4 4" : "0"}
                  className={cn(link.active && "animate-pulse")}
                />
              </g>
            );
          })}

          {/* SVG Nodes */}
          {nodes.map((node, i) => (
            <g 
              key={i} 
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer group"
              onClick={() => onNodeClick && onNodeClick(node)}
            >
              <circle 
                r={10} 
                fill="#07090e" 
                stroke={node.status === 'risk' ? '#FF453A' : node.status === 'warning' ? '#FF9F0A' : '#00F2FE'} 
                strokeWidth={2}
                className="group-hover:scale-125 transition-transform"
              />
              <circle 
                r={4} 
                fill={node.status === 'risk' ? '#FF453A' : node.status === 'warning' ? '#FF9F0A' : '#00F2FE'} 
              />
              <text 
                y={22} 
                textAnchor="middle" 
                fill="#cbd5e1" 
                fontSize={9} 
                fontFamily="monospace"
                className="font-bold select-none uppercase tracking-wider bg-slate-950"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
