import React, { useState } from 'react';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { formatCurrency } from '../../lib/formatters';
import { ShieldAlert, CheckCircle2, AlertCircle, BrainCircuit } from 'lucide-react';

export const ActionDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { actions, approveAction, executeAction, cancelAction } = useSupplyChain() as any;
  const { closeEntity } = useEntityDrawer();
  
  const action = actions.find(a => a.id === id);

  if (!action) return <div className="text-red-500">Action not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Automated / Manual Control Action</div>
          <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">Action ID: {id}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Approval Status</div>
            <div className="text-base font-mono text-[#30D158]">{action.status}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Priority</div>
            <div className="text-base font-mono text-[#FF453A]">{action.priority}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Issue (WHAT)</div>
            <div className="text-sm font-medium text-[#F5F5F5]">{action.issue}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Affected Entity</div>
            <div className="text-sm font-medium text-[#F5F5F5]">{action.entity}</div>
          </div>
        </div>

        <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-3">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider mb-1">Root Cause / Reason (WHY)</div>
            <p className="text-xs text-[#B3B3B3]">{action.reason || 'System identified pattern deviation.'}</p>
          </div>
          
          <div className="pt-3 border-t border-[#2A2A2A]">
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider mb-1">Evidence</div>
            <p className="text-xs text-[#B3B3B3]">{action.evidence || 'Anomaly detected in entity historical data.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Impact Exposure</div>
            <div className="text-base font-mono text-[#FF453A]">{action.impact}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">AI Confidence</div>
            <div className="text-base font-mono text-[#F5F5F5]">{action.confidence || 'MEDIUM'}</div>
          </div>
        </div>
        
        <div className="bg-[#151515] p-4 rounded-lg border border-[#30D158]/30 space-y-2 mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#30D158]"></div>
          <div className="text-[10px] font-mono text-[#30D158] uppercase tracking-wider">Recommended Action</div>
          <p className="text-sm text-[#F5F5F5] font-medium">{action.recommendation}</p>
          <div className="pt-2">
            <button onClick={() => alert('Simulating scenario... Projected risk reduced to LOW. Estimated savings: ' + action.impact)} className="text-[10px] uppercase font-mono text-[#30D158] hover:underline flex items-center gap-1">
              <BrainCircuit size={12} /> Run What-If Simulation
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {action.status === 'PROPOSED' || action.status === 'AWAITING_APPROVAL' ? (
            <button 
              onClick={() => { approveAction(id); closeEntity(); }} 
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#FF9F0A] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
              Approve Action
            </button>
          ) : action.status === 'APPROVED' ? (
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => { executeAction(id); closeEntity(); }} 
                className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
                Execute Action
              </button>
              <span className="text-[9px] text-[#777777] uppercase text-center font-mono">Simulated Execution</span>
            </div>
          ) : action.status === 'EXECUTED' ? (
            <button 
              disabled={true}
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-50">
              Executed (Simulated)
            </button>
          ) : (
            <button 
              disabled={true}
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-50">
              Approve & Execute
            </button>
          )}
          <button 
            disabled={action.status === 'EXECUTED' || action.status === 'CANCELLED'}
            onClick={() => { cancelAction(id); closeEntity(); }} 
            className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#FF453A] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
};
