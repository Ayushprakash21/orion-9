import React, { useState } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { ArrowDown, CheckCircle2, Clock } from 'lucide-react';

export const InboundDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { purchaseOrders, suppliers } = useSupplyChain();
  const { openEntity } = useEntityDrawer();

  // Mock receiving data calculation
  const receivedQty = 500;
  const damagedQty = 12;
  const rejectedQty = 8;
  const acceptedQty = Math.max(0, receivedQty - damagedQty - rejectedQty);

  const stages = ['PO', 'ASN', 'Dispatched', 'In Transit', 'Arrival', 'Dock', 'Unloading', 'QC', 'Received', 'Putaway'];

  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Inbound Command & Receiving</div>
          <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{id}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Received Qty</div>
            <div className="text-base font-mono text-os-text-primary">{receivedQty}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Damaged Qty</div>
            <div className="text-base font-mono text-[#FF453A]">{damagedQty}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Rejected Qty</div>
            <div className="text-base font-mono text-[#FF453A]">{rejectedQty}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Accepted Qty</div>
            <div className="text-base font-mono text-[#30D158]">{acceptedQty}</div>
          </div>
        </div>
      </div>

      {/* Lifecycle Workflow */}
      <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
        <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Inbound Lifecycle Workflow</div>
        <div className="space-y-2">
          {stages.map((stage, idx) => {
            const isCompleted = idx <= 7; // QC completed
            return (
              <div key={stage} className="flex items-center gap-3 text-xs font-mono">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                  isCompleted ? 'bg-[#30D158] text-black font-bold' : 'bg-os-surface-elevated border border-os-border text-os-text-muted'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={isCompleted ? 'text-os-text-primary' : 'text-os-text-muted'}>{stage}</span>
                <span className="ml-auto text-[10px] text-os-text-muted">{isCompleted ? 'Completed' : 'Pending'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
