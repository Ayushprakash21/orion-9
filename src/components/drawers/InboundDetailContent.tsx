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
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Inbound Command & Receiving</div>
          <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{id}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Received Qty</div>
            <div className="text-base font-mono text-[#F5F5F5]">{receivedQty}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Damaged Qty</div>
            <div className="text-base font-mono text-[#FF453A]">{damagedQty}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Rejected Qty</div>
            <div className="text-base font-mono text-[#FF453A]">{rejectedQty}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Accepted Qty</div>
            <div className="text-base font-mono text-[#30D158]">{acceptedQty}</div>
          </div>
        </div>
      </div>

      {/* Lifecycle Workflow */}
      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
        <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Inbound Lifecycle Workflow</div>
        <div className="space-y-2">
          {stages.map((stage, idx) => {
            const isCompleted = idx <= 7; // QC completed
            return (
              <div key={stage} className="flex items-center gap-3 text-xs font-mono">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                  isCompleted ? 'bg-[#30D158] text-black font-bold' : 'bg-[#1B1B1B] border border-[#2A2A2A] text-[#777777]'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={isCompleted ? 'text-[#F5F5F5]' : 'text-[#777777]'}>{stage}</span>
                <span className="ml-auto text-[10px] text-[#777777]">{isCompleted ? 'Completed' : 'Pending'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
