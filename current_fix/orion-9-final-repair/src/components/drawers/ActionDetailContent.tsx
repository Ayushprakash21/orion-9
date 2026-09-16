import React, { useState } from 'react';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { formatCurrency } from '../../lib/formatters';
import { ShieldAlert, CheckCircle2, AlertCircle, BrainCircuit } from 'lucide-react';

export const ActionDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { actions, approveAction, executeAction, cancelAction } = useSupplyChain() as any;
  const { closeEntity } = useEntityDrawer();
  const [simulated, setSimulated] = useState(false);
  
  const action = actions.find((a: any) => a.id === id);

  if (!action) return <div className="text-red-500">Action not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Automated / Manual Control Action</div>
          <h2 className="text-xl font-medium text-os-text-primary mt-0.5">Action ID: {id}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Approval Status</div>
            <div className="text-base font-mono text-[#30D158]">{action.status}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Priority</div>
            <div className="text-base font-mono text-[#FF453A]">{action.priority}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Issue (WHAT)</div>
            <div className="text-sm font-medium text-os-text-primary">{action.issue}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Affected Entity</div>
            <div className="text-sm font-medium text-os-text-primary">{action.entity}</div>
          </div>
        </div>

        <div className="bg-os-surface p-4 rounded-lg border border-os-border space-y-3">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider mb-1">Root Cause / Reason (WHY)</div>
            <p className="text-xs text-os-text-secondary">{action.reason || 'System identified pattern deviation.'}</p>
          </div>
          
          <div className="pt-3 border-t border-os-border">
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider mb-1">Evidence</div>
            <p className="text-xs text-os-text-secondary">{action.evidence || 'Anomaly detected in entity historical data.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Impact Exposure</div>
            <div className="text-base font-mono text-[#FF453A]">{action.impact}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">AI Confidence</div>
            <div className="text-base font-mono text-os-text-primary">{action.confidence || 'MEDIUM'}</div>
          </div>
        </div>
        
        <div className="bg-os-surface p-4 rounded-lg border border-[#30D158]/30 space-y-2 mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#30D158]"></div>
          <div className="text-[10px] font-mono text-[#30D158] uppercase tracking-wider">Recommended Action</div>
          <p className="text-sm text-os-text-primary font-medium">{action.recommendation}</p>
          <div className="pt-2">
            <button 
              onClick={() => setSimulated(!simulated)} 
              className="text-[10px] uppercase font-mono text-[#30D158] hover:underline flex items-center gap-1"
            >
              <BrainCircuit size={12} /> {simulated ? 'Hide Simulation' : 'Run What-If Simulation'}
            </button>
            {simulated && (
              <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs space-y-1 animate-in fade-in">
                <div className="font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Simulation Outcome:</div>
                <div>• Projected risk reduction: HIGH &rarr; LOW</div>
                <div>• Estimated savings: {action.impact}</div>
                <div>• Predicted SLA recovery: 99.4% within policy threshold</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {action.status === 'PROPOSED' || action.status === 'AWAITING_APPROVAL' ? (
            <button 
              onClick={() => { approveAction(id); closeEntity(); }} 
              className="px-4 py-2 bg-os-surface-elevated border border-os-border text-[#FF9F0A] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-os-surface-hover disabled:opacity-50">
              Approve Action
            </button>
          ) : action.status === 'APPROVED' ? (
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => { executeAction(id); closeEntity(); }} 
                className="px-4 py-2 bg-os-surface-elevated border border-os-border text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-os-surface-hover disabled:opacity-50">
                Execute Action
              </button>
              <span className="text-[9px] text-os-text-muted uppercase text-center font-mono">Simulated Execution</span>
            </div>
          ) : action.status === 'EXECUTED' ? (
            <button 
              disabled={true}
              className="px-4 py-2 bg-os-surface-elevated border border-os-border text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-50">
              Executed (Simulated)
            </button>
          ) : (
            <button 
              disabled={true}
              className="px-4 py-2 bg-os-surface-elevated border border-os-border text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-50">
              Approve & Execute
            </button>
          )}
          <button 
            disabled={action.status === 'EXECUTED' || action.status === 'CANCELLED'}
            onClick={() => { cancelAction(id); closeEntity(); }} 
            className="px-4 py-2 bg-os-surface-elevated border border-os-border text-[#FF453A] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-os-surface-hover disabled:opacity-50">
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
};
