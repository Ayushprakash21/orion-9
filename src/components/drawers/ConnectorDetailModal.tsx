import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

export const ConnectorDetailModal: React.FC<{ id: string }> = ({ id }) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Enterprise Integration Connector</div>
          <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{id.toUpperCase()} ERP Connector</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Connection State</div>
            <div className="font-mono text-[#30D158]">CONNECTED</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Authentication</div>
            <div className="font-mono text-[#F5F5F5]">OAuth2 / TLS Encrypted</div>
          </div>
        </div>

        <div className="pt-2">
          <button className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020]">
            Run Test Synchronization
          </button>
        </div>
      </div>
    </div>
  );
};
