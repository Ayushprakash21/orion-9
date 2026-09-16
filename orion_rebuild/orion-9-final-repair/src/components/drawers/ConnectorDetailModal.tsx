import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

export const ConnectorDetailModal: React.FC<{ id: string }> = ({ id }) => {
  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Enterprise Integration Connector</div>
          <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{id.toUpperCase()} ERP Connector</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Connection State</div>
            <div className="font-mono text-[#30D158]">CONNECTED</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Authentication</div>
            <div className="font-mono text-os-text-primary">OAuth2 / TLS Encrypted</div>
          </div>
        </div>

        <div className="pt-2">
          <button className="px-4 py-2 bg-os-surface-elevated border border-os-border text-os-text-primary rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-os-surface-hover">
            Run Test Synchronization
          </button>
        </div>
      </div>
    </div>
  );
};
