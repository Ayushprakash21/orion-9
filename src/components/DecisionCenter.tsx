import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { BrainCircuit, AlertTriangle, GitBranch, ArrowRight, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { Decision } from '../types';

export const DecisionCenter = () => {
  const { decisions, approveDecision, rejectDecision, userProfile } = useSupplyChain();
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  const pendingDecisions = decisions.filter(d => d.status === 'READY_FOR_REVIEW' || d.status === 'ANALYZING');
  const pastDecisions = decisions.filter(d => d.status !== 'READY_FOR_REVIEW' && d.status !== 'ANALYZING');

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] text-[#E0E0E0] px-4 sm:px-6 md:px-8 py-6 w-full overflow-hidden box-border">
      <header className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <div className="flex items-center gap-2 text-[#A0A0A0] text-sm mb-2">
            <BrainCircuit size={16} />
            <span>INTELLIGENCE</span>
            <span>/</span>
            <span className="text-[#F5F5F5]">DECISION ENGINE</span>
          </div>
          <h1 className="text-3xl font-light text-[#F5F5F5] tracking-tight">Decision Center</h1>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 min-h-0 flex-1">
        <div className="col-span-4 flex flex-col bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A] bg-[#161616] flex justify-between items-center">
            <h2 className="text-sm font-medium text-[#F5F5F5]">PENDING REVIEW</h2>
            <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1C1C1C] border border-[#2A2A2A]">
              {pendingDecisions.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {pendingDecisions.map(d => (
              <div 
                key={d.id}
                onClick={() => setSelectedDecision(d)}
                className={`p-3 rounded-md border cursor-pointer transition-all ${
                  selectedDecision?.id === d.id 
                    ? 'bg-[#1C1C1C] border-[#555555]' 
                    : 'bg-[#0A0A0A] border-[#2A2A2A] hover:border-[#444444]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    d.severity === 'CRITICAL' ? 'text-red-400 bg-red-400/10' :
                    d.severity === 'HIGH' ? 'text-orange-400 bg-orange-400/10' :
                    'text-yellow-400 bg-yellow-400/10'
                  }`}>
                    {d.severity}
                  </span>
                  <span className="text-[10px] text-[#6F6F6F]">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-sm font-medium text-[#F5F5F5] mb-1 line-clamp-1">{d.title}</h3>
                <p className="text-xs text-[#A0A0A0] line-clamp-2">{d.issue}</p>
              </div>
            ))}
            {pendingDecisions.length === 0 && (
              <div className="p-6 text-center text-[#6F6F6F] text-sm">
                No pending decisions.
              </div>
            )}
          </div>
        </div>

        <div className="col-span-8 flex flex-col bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
          {selectedDecision ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-[#2A2A2A] shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-medium text-[#F5F5F5] mb-2">{selectedDecision.title}</h2>
                    <p className="text-sm text-[#A0A0A0]">{selectedDecision.issue}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-[#6F6F6F] uppercase tracking-wider mb-1">Confidence</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${
                      selectedDecision.confidence === 'HIGH' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                      selectedDecision.confidence === 'MEDIUM' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                      'text-red-400 border-red-400/30 bg-red-400/10'
                    }`}>
                      {selectedDecision.confidence}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Evidence & Root Cause */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-[#6F6F6F] font-semibold mb-3 flex items-center gap-2">
                      <Search size={14} /> Evidence
                    </h3>
                    <div className="space-y-2">
                      {selectedDecision.evidence.map(e => (
                        <div key={e.id} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3 text-xs">
                          <span className="text-[#F5F5F5] block mb-1">{e.description}</span>
                          <span className="text-[#6F6F6F]">Source: {e.sourceType} {e.sourceId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-[#6F6F6F] font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} /> Root Cause Analysis
                    </h3>
                    <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-3 text-sm">
                      <div className="mb-2">
                        <span className="text-[#A0A0A0] text-xs block mb-1">Primary Cause</span>
                        <span className="text-[#F5F5F5]">{selectedDecision.rootCause.primaryCause}</span>
                      </div>
                      {selectedDecision.rootCause.contributingFactors.length > 0 && (
                        <div>
                          <span className="text-[#A0A0A0] text-xs block mb-1">Contributing Factors</span>
                          <ul className="list-disc pl-4 text-xs text-[#D0D0D0]">
                            {selectedDecision.rootCause.contributingFactors.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Options & Simulation */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#6F6F6F] font-semibold mb-3 flex items-center gap-2">
                    <GitBranch size={14} /> Options & Simulation
                  </h3>
                  <div className="space-y-3">
                    {selectedDecision.options.map(opt => (
                      <div key={opt.id} className={`bg-[#0A0A0A] border ${opt.id === selectedDecision.recommendedOptionId ? 'border-blue-500/50 relative' : 'border-[#2A2A2A]'} rounded p-4`}>
                        {opt.id === selectedDecision.recommendedOptionId && (
                           <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-500 text-[#F5F5F5] text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                             Recommended
                           </div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-[#F5F5F5]">{opt.name}</h4>
                            <p className="text-xs text-[#A0A0A0]">{opt.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-[#6F6F6F] block mb-1">Score</span>
                            <span className="text-lg font-mono text-[#F5F5F5]">{opt.score}/100</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs pt-3 border-t border-[#1C1C1C]">
                           <div>
                             <span className="text-[#6F6F6F] block mb-1">Cost</span>
                             <span className="text-[#D0D0D0]">${opt.cost.toLocaleString()}</span>
                           </div>
                           <div>
                             <span className="text-[#6F6F6F] block mb-1">Benefit</span>
                             <span className="text-[#D0D0D0]">{opt.benefit}</span>
                           </div>
                           <div>
                             <span className="text-[#6F6F6F] block mb-1">Simulation</span>
                             <span className={opt.simulationResult.delta.exposureDelta < 0 ? 'text-green-400' : 'text-yellow-400'}>
                               ${Math.abs(opt.simulationResult.delta.exposureDelta).toLocaleString()} exposure {opt.simulationResult.delta.exposureDelta < 0 ? 'decrease' : 'increase'}
                             </span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
              <div className="p-4 border-t border-[#2A2A2A] bg-[#161616] flex justify-end gap-3 shrink-0">
                 {selectedDecision.status === 'READY_FOR_REVIEW' && (
                    <>
                      <button 
                        onClick={() => rejectDecision(selectedDecision.id, userProfile?.displayName || 'System User', 'Rejected via Decision Center')}
                        className="px-4 py-2 text-sm font-medium text-[#F5F5F5] bg-transparent border border-[#444444] rounded hover:bg-[#2A2A2A] transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => approveDecision(selectedDecision.id, selectedDecision.recommendedOptionId, userProfile?.displayName || 'System User', 'Approved via Decision Center')}
                        className="px-4 py-2 text-sm font-medium text-[#0A0A0A] bg-[#F5F5F5] rounded hover:bg-white transition-colors"
                      >
                        Approve Recommendation
                      </button>
                    </>
                 )}
                 {selectedDecision.status !== 'READY_FOR_REVIEW' && (
                    <span className="text-sm font-medium text-[#A0A0A0] uppercase tracking-wider">
                       {selectedDecision.status}
                    </span>
                 )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#6F6F6F] p-6">
              <BrainCircuit size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Select a decision to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
