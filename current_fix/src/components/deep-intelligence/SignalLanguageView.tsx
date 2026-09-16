import React from 'react';
import { Activity, ShieldCheck, AlertCircle, MessageSquare } from 'lucide-react';

export const SignalLanguageView: React.FC = () => {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
            DEEP INTELLIGENCE
          </span>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Operational Signal Language</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Capturing informal operational word-of-mouth, supplier promises, and unspoken workflow signals into structured intelligence.
          </p>
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-os-text-primary">Classified Operational Signals</h3>
        <div className="space-y-3">
          {[
            { source: 'Supplier Comms', text: '"Supplier says they should be okay for Friday delivery."', type: 'Claim', confidence: '68%' },
            { source: 'Warehouse Radio', text: '"Loading dock experienced fork-lift maintenance delay."', type: 'Warning', confidence: '94%' },
            { source: 'Logistics Partner', text: '"Carrier noted potential highway congestion near transit hub."', type: 'Uncertainty', typeColor: 'text-amber-400', confidence: '52%' }
          ].map((sig, idx) => (
            <div key={idx} className="p-4 bg-os-surface-secondary border border-os-border rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-os-text-primary">{sig.source}</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                    {sig.type}
                  </span>
                </div>
                <p className="text-xs text-os-text-secondary">{sig.text}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-os-text-muted uppercase">Confidence</span>
                <div className="text-sm font-mono font-bold text-cyan-400">{sig.confidence}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
