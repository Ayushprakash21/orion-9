import React, { useState } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { NavLink } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Compass, 
  Clock, 
  Zap, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  HelpCircle,
  ChevronRight,
  Database,
  BarChart2,
  DollarSign,
  Cpu
} from 'lucide-react';

export const OrionIntelligenceCenter: React.FC = () => {
  const { exceptions, inventory, suppliers } = useSupplyChain();
  const [activeQuestion, setActiveQuestion] = useState<string>('changing');
  const [activeCommand, setActiveCommand] = useState<string | null>(null);

  const coreQuestions = [
    { id: 'changing', title: 'WHAT IS CHANGING?', desc: 'Observed shifts in lead time, supplier reliability, or demand signals.' },
    { id: 'accelerating', title: 'WHAT IS ACCELERATING?', desc: 'Risk velocity, inventory depletion rate, and exception frequency.' },
    { id: 'fragile', title: 'WHAT IS BECOMING FRAGILE?', desc: 'Nodes or SKUs where resilience buffer is declining without active stockouts.' },
    { id: 'decisions', title: 'WHAT IS ABOUT TO BECOME A DECISION?', desc: 'Closing decision windows and urgent option decay.' },
    { id: 'not_seeing', title: 'WHAT ARE WE NOT SEEING?', desc: 'Silence intelligence and negative space analysis (missing expected signals).' },
    { id: 'dont_know', title: 'WHAT DON\'T WE KNOW?', desc: 'Uncertainty budget and missing supplier confirmation data.' },
    { id: 'costing_time', title: 'WHAT IS COSTING TIME?', desc: 'Process friction, approval hesitation, and shadow work.' },
    { id: 'costing_money', title: 'WHAT IS COSTING MONEY?', desc: 'Cost of waiting, expedite surcharges, and inventory holding debt.' },
    { id: 'automate', title: 'WHAT SHOULD WE AUTOMATE?', desc: 'High-confidence Level 4/5 autonomy ready workflows.' },
    { id: 'human_attention', title: 'WHAT NEEDS HUMAN ATTENTION?', desc: 'High financial impact or policy-constrained decisions requiring authorization.' }
  ];

  const signatureCommands = [
    { id: 'breaks_first', label: 'WHAT BREAKS FIRST?', icon: ShieldAlert, color: 'text-red-400' },
    { id: 'blast_radius', label: 'SHOW THE BLAST RADIUS', icon: Zap, color: 'text-amber-400' },
    { id: 'root_cause', label: 'SHOW THE ROOT CAUSE', icon: Search, color: 'text-[#00F2FE]' },
    { id: 'do_nothing', label: 'WHAT IF WE DO NOTHING?', icon: Clock, color: 'text-purple-400' },
    { id: 'avoid', label: 'WHAT SHOULD I NOT DO?', icon: AlertCircle, color: 'text-rose-400' }
  ];

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto font-sans text-os-text-secondary">
      {/* Top Hero Section */}
      <div className="bg-os-surface border border-os-border rounded-xl p-8 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F2FE]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30 rounded">
                DEEP INTELLIGENCE CENTER
              </span>
              <span className="text-xs font-mono text-os-text-muted">ORION-9</span>
            </div>
            <h1 className="text-3xl font-bold text-os-text-primary tracking-tight">ORION INTELLIGENCE</h1>
            <p className="text-sm text-[#00F2FE] font-mono mt-1 italic">
              "What is quietly changing across the supply chain?"
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink to="/signal-language" className="px-3 py-2 bg-os-surface-secondary border border-os-border hover:border-[#00F2FE] rounded-lg text-xs font-mono text-os-text-primary transition-colors">
              Signal Language
            </NavLink>
            <NavLink to="/network-intelligence" className="px-3 py-2 bg-os-surface-secondary border border-os-border hover:border-[#00F2FE] rounded-lg text-xs font-mono text-os-text-primary transition-colors">
              Network Topology
            </NavLink>
            <NavLink to="/decision-science" className="px-3 py-2 bg-os-surface-secondary border border-os-border hover:border-[#00F2FE] rounded-lg text-xs font-mono text-os-text-primary transition-colors">
              Counterfactual Lab
            </NavLink>
          </div>
        </div>

        {/* Signature Commands Strip */}
        <div className="pt-4 border-t border-os-border flex flex-wrap gap-3">
          <span className="text-xs font-mono text-os-text-muted self-center mr-2">Signature Commands:</span>
          {signatureCommands.map((cmd) => {
            const Icon = cmd.icon;
            const isActive = activeCommand === cmd.id;
            return (
              <button
                key={cmd.id}
                onClick={() => setActiveCommand(isActive ? null : cmd.id)}
                className={`px-3 py-2 rounded-lg border font-mono text-xs flex items-center gap-2 transition-all duration-200
                  ${isActive ? 'bg-os-surface-hover border-[#00F2FE] shadow-[0_0_12px_rgba(0,242,254,0.15)] text-os-text-primary' : 'bg-os-surface-secondary border-os-border text-os-text-secondary hover:border-os-border-hover'}`}
              >
                <Icon size={14} className={cmd.color} />
                <span>{cmd.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Signature Command Analysis Drawer / Banner if Active */}
      {activeCommand && (
        <div className="p-6 bg-os-surface-secondary border border-[#00F2FE]/40 rounded-xl space-y-3 font-mono text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b border-os-border pb-3">
            <span className="font-bold text-os-text-primary text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-[#00F2FE]" /> Command Result: {signatureCommands.find(c => c.id === activeCommand)?.label}
            </span>
            <button onClick={() => setActiveCommand(null)} className="text-os-text-muted hover:text-os-text-primary text-xs">Close</button>
          </div>

          {activeCommand === 'breaks_first' && (
            <div className="space-y-2 text-os-text-secondary font-sans text-xs">
              <p><strong className="text-red-400">First Likely Constraint:</strong> Precision Microchips SKU-402 buffer depletion at European Assembly Center in 4.2 days.</p>
              <p><strong className="text-os-text-primary">Root Cause:</strong> Apex Components PO-8821 dispatch delay (+18 hours) combined with 14% European demand acceleration.</p>
              <p><strong className="text-cyan-400">Confidence:</strong> 92.4% (Grounded in PO Tracking + Demand Forecast model).</p>
            </div>
          )}

          {activeCommand === 'blast_radius' && (
            <div className="space-y-2 text-os-text-secondary font-sans text-xs">
              <p><strong className="text-amber-400">Propagated Blast Radius:</strong> 1 Supplier → 2 Inbound POs → 4 SKUs → 2 Distribution Hubs → 3 Major Customer Orders.</p>
              <p><strong className="text-os-text-primary">Financial Exposure:</strong> ₹1,250,000 potential revenue at risk across Orders #ORD-9912 and #ORD-9940.</p>
            </div>
          )}

          {activeCommand === 'root_cause' && (
            <div className="space-y-2 text-os-text-secondary font-sans text-xs">
              <p><strong className="text-[#00F2FE]">Primary Causal Node:</strong> Raw Material Silicon Wafer shortage at Tier-2 supplier level.</p>
              <p><strong className="text-os-text-primary">Causal Chain:</strong> Tier-2 Material Lag → Apex Components Dispatch Shift → Safety Stock Buffer Erosion → Downstream Assembly Bottleneck.</p>
            </div>
          )}

          {activeCommand === 'do_nothing' && (
            <div className="space-y-2 text-os-text-secondary font-sans text-xs">
              <p><strong className="text-purple-400">Counterfactual Analysis (Do Nothing):</strong> Stockout occurs on Sept 12. 3 customer deliveries delayed. SLA breach penalty: ₹185,000/day.</p>
            </div>
          )}

          {activeCommand === 'avoid' && (
            <div className="space-y-2 text-os-text-secondary font-sans text-xs">
              <p><strong className="text-rose-400">Actions to Avoid:</strong> Do NOT cancel PO-8821 or initiate unverified spot-market purchase from unapproved vendor (Quality Gate Blocked).</p>
            </div>
          )}
        </div>
      )}

      {/* 10 Core Intelligence Questions Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-os-text-primary border-l-2 border-[#00F2FE] pl-3">
          10 Core Intelligence Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {coreQuestions.map((q) => {
            const isSelected = activeQuestion === q.id;
            return (
              <div
                key={q.id}
                onClick={() => setActiveQuestion(q.id)}
                className={`p-4 border rounded-xl bg-os-surface cursor-pointer transition-all duration-200 hover:border-[#00F2FE] flex flex-col justify-between space-y-2
                  ${isSelected ? 'border-[#00F2FE] bg-os-surface-hover shadow-[0_0_15px_rgba(0,242,254,0.1)]' : 'border-os-border'}`}
              >
                <div>
                  <div className={`text-xs font-bold uppercase font-mono tracking-tight ${isSelected ? 'text-[#00F2FE]' : 'text-os-text-primary'}`}>
                    {q.title}
                  </div>
                  <p className="text-[10px] text-os-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {q.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-os-border text-[9px] font-mono text-os-text-muted">
                  <span>Explore Analysis</span>
                  <ChevronRight size={12} className={isSelected ? 'text-[#00F2FE]' : 'text-os-text-muted'} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Question Deep Analysis Screen */}
      <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-os-border pb-3">
          <div>
            <span className="text-[10px] uppercase text-os-text-muted">Deep Analysis Module</span>
            <h3 className="text-lg font-bold text-os-text-primary">{coreQuestions.find(q => q.id === activeQuestion)?.title}</h3>
          </div>
          <span className="px-3 py-1 bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30 rounded text-[10px] uppercase font-bold">
            Real-Time Engine Sync
          </span>
        </div>

        <div className="p-4 bg-os-surface-secondary border border-os-border rounded-xl space-y-3">
          {activeQuestion === 'changing' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">3 Detected Operational Shifts:</div>
              <ul className="list-disc pl-5 space-y-1 text-os-text-secondary">
                <li>Apex Components PO dispatch cadence slowed by 12% over past 14 days.</li>
                <li>European Sales Region demand acceleration +14% above baseline forecast.</li>
                <li>Transit corridor Rotterdam-Duisburg dwell time increased +1.2 days.</li>
              </ul>
            </div>
          )}

          {activeQuestion === 'accelerating' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Risk Velocity Trends:</div>
              <p className="text-os-text-secondary">Inventory depletion rate for Microprocessor Core-X accelerating at +3.4 units/day above plan.</p>
            </div>
          )}

          {activeQuestion === 'fragile' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Fragility Index:</div>
              <p className="text-os-text-secondary">Regional DC Safety Buffer consumed from 100% to 32% capacity without triggering explicit stockout alert.</p>
            </div>
          )}

          {activeQuestion === 'decisions' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Closing Decision Windows:</div>
              <p className="text-os-text-secondary">Air Freight Expedite option for PO-8821 closes in 14 hours before carrier cutoff.</p>
            </div>
          )}

          {activeQuestion === 'not_seeing' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Silence Intelligence & Negative Space:</div>
              <p className="text-os-text-secondary">Supplier confirmation expected 12 hours ago has not been received. Delay threshold exceeded by 8 hours.</p>
            </div>
          )}

          {activeQuestion === 'dont_know' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Uncertainty Budget:</div>
              <p className="text-os-text-secondary">Tier-2 Wafer availability unconfirmed. Data trust score: 64% (Awaiting supplier ASN submission).</p>
            </div>
          )}

          {activeQuestion === 'costing_time' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Process Friction & Delay:</div>
              <p className="text-os-text-secondary">Manual PO re-approval process causing an average workflow hesitation of +18.4 hours.</p>
            </div>
          )}

          {activeQuestion === 'costing_money' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Economic Exposure:</div>
              <p className="text-os-text-secondary">Cost of waiting on PO-8821 re-route decision: ₹185,000 per day in potential downtime penalties.</p>
            </div>
          )}

          {activeQuestion === 'automate' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Automation Readiness:</div>
              <p className="text-os-text-secondary">Safety Buffer Rebalancing (under ₹50,000) qualifies for Level 5 Autonomous Autopilot execution.</p>
            </div>
          )}

          {activeQuestion === 'human_attention' && (
            <div className="space-y-2 font-sans text-xs">
              <div className="font-bold text-os-text-primary font-mono">Human Authorization Required:</div>
              <p className="text-os-text-secondary">Vendor switch recommendation exceeds financial policy threshold (₹210,000). Requires VP approval.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
