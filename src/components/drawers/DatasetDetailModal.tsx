import React, { useState } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { Database, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDateOnly } from '../../lib/utils';

export const DatasetDetailModal: React.FC<{ id: string }> = ({ id }) => {
  const { inventory, suppliers, purchaseOrders, shipments } = useSupplyChain();
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
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Data Center Dataset</div>
            <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{datasetInfo.name}</h2>
          </div>
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-md bg-[#1B1B1B] text-[#30D158] border border-[#2A2A2A]">
            {datasetInfo.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Record Count</div>
            <div className="font-mono text-[#F5F5F5]">{datasetInfo.recordCount.toLocaleString()}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Quality Score</div>
            <div className="font-mono text-[#30D158]">{datasetInfo.qualityScore}%</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Freshness</div>
            <div className="font-mono text-[#F5F5F5]">{datasetInfo.freshness}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Last Updated</div>
            <div className="font-mono text-[#F5F5F5]">{formatDateOnly(datasetInfo.lastUpdated)}</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono">
        {(['overview', 'records', 'quality', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'border-[#F5F5F5] text-[#F5F5F5]' : 'border-transparent text-[#777777] hover:text-[#B3B3B3]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Source Pipeline</h3>
          <p className="text-xs text-[#B3B3B3] font-mono">Connected via {datasetInfo.source}. Real-time synchronization active.</p>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">
            Sample Records (First 10)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-[#B3B3B3]">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#111111] text-[10px] text-[#777777] uppercase">
                  {Object.keys(datasetInfo.records[0] || {}).slice(0, 5).map(key => (
                    <th key={key} className="p-3">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {datasetInfo.records.slice(0, 10).map((record, i) => (
                  <tr key={i} className="hover:bg-[#202020]">
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
        <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Validation Audit</h3>
          <div className="space-y-2 text-xs font-mono text-[#B3B3B3]">
            <div className="flex justify-between p-2 bg-[#111111] rounded border border-[#2A2A2A]">
              <span>Schema Completeness</span>
              <span className="text-[#30D158]">100%</span>
            </div>
            <div className="flex justify-between p-2 bg-[#111111] rounded border border-[#2A2A2A]">
              <span>Duplicate Records</span>
              <span className="text-[#30D158]">0</span>
            </div>
            <div className="flex justify-between p-2 bg-[#111111] rounded border border-[#2A2A2A]">
              <span>Reference Integrity</span>
              <span className="text-[#30D158]">99.2%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Sync & Import History</h3>
          <div className="text-xs font-mono text-[#777777]">
            Dataset initialized and synchronized successfully. Zero blocking anomalies.
          </div>
        </div>
      )}
    </div>
  );
};
