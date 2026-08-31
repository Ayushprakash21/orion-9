import React from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { FileText, CheckCircle2 } from 'lucide-react';

export const ImportDetailModal: React.FC<{ id: string }> = ({ id }) => {
  const { importHistory } = useSupplyChain();
  const item = importHistory.find(h => h.id === id);

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Data Import Log</div>
          <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{item?.filename || 'Dataset Import'}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Entity Type</div>
            <div className="font-mono text-[#F5F5F5]">{item?.entityType || 'inventory'}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Total Rows</div>
            <div className="font-mono text-[#F5F5F5]">{item?.totalRows || 0}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Successful</div>
            <div className="font-mono text-[#30D158]">{item?.successfulRows || 0}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Warnings</div>
            <div className="font-mono text-[#FF9F0A]">{item?.warnings || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
