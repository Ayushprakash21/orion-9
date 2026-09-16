import React, { useState } from 'react';
import { 
  Dna, Award, Sparkles, Shield, BarChart2, Info 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const DecisionDnaView: React.FC = () => {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
              DECISION DNA
            </span>
            <span className="text-xs font-mono text-slate-500">ORGANIZATIONAL BEHAVIOR LEARNING</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Decision DNA & Organizational Learning</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Analyze the cultural DNA of your supply chain operations, tracking strengths in sourcing speed, logistics agility, and risk resilience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DNA Attributes Cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6 font-mono text-[11px]">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-4">
              <Dna size={16} className="text-purple-400" />
              <span className="font-bold text-os-text-primary uppercase">CORE ORGANIZATIONAL DNA MATRICES</span>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Sourcing Resilience DNA', desc: 'Agility to transition and ramp up secondary supply lines during material disruption.', rating: 'Excellent (92%)', trend: '↑ 2.4% over 30 days' },
                { name: 'Logistics Diversification DNA', desc: 'Multipath transit allocation speeds and air/sea/land switching efficiency.', rating: 'Good (84%)', trend: '→ Stable' },
                { name: 'Constraint Adaptability DNA', desc: 'Response speeds and throughput elasticity during warehouse buffer surges.', rating: 'Fair (71%)', trend: '↓ 1.2% (Labor constraints)' }
              ].map((dna, idx) => (
                <div key={idx} className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-os-text-primary uppercase">{dna.name}</span>
                    <span className="text-purple-400 font-bold">{dna.rating}</span>
                  </div>
                  <p className="font-sans text-xs text-os-text-muted">{dna.desc}</p>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">{dna.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Behavioral audit ledger"
            freshness="Updated weekly"
            confidence={94}
            method="Multivariate organizational pattern mapping"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-400" />
              EVOLUTION INSIGHTS
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Orion measures Decision DNA by auditing historical performance logs. Over time, the organization shows high maturity in **Sourcing**, while seeking further optimization in **Warehouse Staging Adaptability**.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
