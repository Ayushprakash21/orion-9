import React from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { formatDateOnly } from '../../lib/utils';

export const SyncDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { timezone } = useSupplyChain();
  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Sync Job Details</div>
            <h2 className="text-xl font-medium text-os-text-primary mt-0.5">Job ID: {id}</h2>
          </div>
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-md bg-os-surface-elevated text-[#30D158] border border-os-border">
            SUCCESS
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Environment</div>
            <div className="font-mono text-os-text-primary">Production Cloud</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Duration</div>
            <div className="font-mono text-os-text-primary">2.4s</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Records Read</div>
            <div className="font-mono text-os-text-primary">1,042</div>
          </div>
        </div>
      </div>

      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-3">
        <h3 className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Execution Logs</h3>
        <div className="bg-os-surface p-4 rounded-lg border border-os-border font-mono text-xs text-os-text-secondary space-y-1">
          <div>[INFO] Initializing connector authentication handshake...</div>
          <div>[INFO] Fetching incremental records from source repository...</div>
          <div>[SUCCESS] Successfully validated 1,042 records against schema definitions.</div>
          <div>[SUCCESS] Pipeline execution completed with zero blocking errors.</div>
        </div>
      </div>
    </div>
  );
};
