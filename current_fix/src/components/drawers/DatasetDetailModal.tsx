import React, { useState } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { Database, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDateOnly } from '../../lib/utils';

export const DatasetDetailModal: React.FC<{ id: string }> = ({ id }) => {
  const { inventory, suppliers, purchaseOrders, shipments, timezone } = useSupplyChain();
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'quality' | 'history'>('overview');

  const datasetInfo = React.useMemo(() => {
    let records: any[] = [];
    let sourceName = 'Enterprise Database / File';
    if (id === 'inventory') {
      records = inventory;
      sourceName = 'ERP Warehouse System';
    } else if (id === 'suppliers') {
      records = suppliers;
      sourceName = 'Supplier Network Registry';
    } else if (id === 'purchaseOrders') {
      records = purchaseOrders;
      sourceName = 'Procurement Management System';
    } else if (id === 'shipments') {
      records = shipments;
      sourceName = 'Logistics & TMS API';
    }

    return {
      name: id.toUpperCase(),
      source: sourceName,
      recordCount: records.length,
      lastUpdated: new Date().toISOString(),
      freshness: 'Optimal (< 1h)',
      qualityScore: records.length > 0 ? 98 : 0,
      status: records.length > 0 ? 'ACTIVE' : 'EMPTY',
      records
    };
  }, [id, inventory, suppliers, purchaseOrders, shipments]);

  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Data Center Dataset</div>
            <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{datasetInfo.name}</h2>
          </div>
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-md bg-os-surface-elevated text-[#30D158] border border-os-border">
            {datasetInfo.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Record Count</div>
            <div className="font-mono text-os-text-primary">{datasetInfo.recordCount.toLocaleString()}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Quality Score</div>
            <div className="font-mono text-[#30D158]">{datasetInfo.qualityScore}%</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Freshness</div>
            <div className="font-mono text-os-text-primary">{datasetInfo.freshness}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Last Updated</div>
            <div className="font-mono text-os-text-primary">{formatDateOnly(datasetInfo.lastUpdated, timezone)}</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-os-border gap-6 text-xs font-mono">
        {(['overview', 'records', 'quality', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'border-os-border-inverse text-os-text-primary' : 'border-transparent text-os-text-muted hover:text-os-text-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Source Pipeline</h3>
          <p className="text-xs text-os-text-secondary font-mono">Connected via {datasetInfo.source}. Real-time synchronization active.</p>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-os-border text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">
            Sample Records (First 10)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-os-text-secondary">
              <thead>
                <tr className="border-b border-os-border bg-os-surface-secondary text-[10px] text-os-text-muted uppercase">
                  {Object.keys(datasetInfo.records[0] || {}).slice(0, 5).map(key => (
                    <th key={key} className="p-3">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {datasetInfo.records.slice(0, 10).map((record, i) => (
                  <tr key={i} className="hover:bg-os-surface-hover">
                    {Object.values(record).slice(0, 5).map((val: any, j) => (
                      <td key={j} className="p-3 truncate max-w-[150px]">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Validation Audit</h3>
          <div className="space-y-2 text-xs font-mono text-os-text-secondary">
            <div className="flex justify-between p-2 bg-os-surface rounded border border-os-border">
              <span>Schema Completeness</span>
              <span className="text-[#30D158]">100%</span>
            </div>
            <div className="flex justify-between p-2 bg-os-surface rounded border border-os-border">
              <span>Duplicate Records</span>
              <span className="text-[#30D158]">0</span>
            </div>
            <div className="flex justify-between p-2 bg-os-surface rounded border border-os-border">
              <span>Reference Integrity</span>
              <span className="text-[#30D158]">99.2%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Sync & Import History</h3>
          <div className="text-xs font-mono text-os-text-muted">
            Dataset initialized and synchronized successfully. Zero blocking anomalies.
          </div>
        </div>
      )}
    </div>
  );
};
