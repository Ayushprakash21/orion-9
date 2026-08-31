import React, { useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { Lightbulb, ShieldAlert, ArrowRight, Activity, Clock, FileText } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { formatDateOnly } from '../../lib/utils';

export const PredictionDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { exceptions, inventory, shipments, purchaseOrders, suppliers, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();

  const predData = useMemo(() => {
    if (id === 'pred-1' || id.includes('Stock-Out')) {
      const stockOuts = exceptions.filter(e => e.type === 'Stock-Out Risk');
      return {
        type: 'Stock-Out Risk',
        entity: `${stockOuts.length} SKUs at Risk`,
        status: 'Active Monitoring',
        riskLevel: 'HIGH',
        horizon: '7 Days',
        evidence: `Identified ${stockOuts.length} SKUs currently at risk of stock-out based on average daily demand, lead times, and inbound PO schedules.`,
        impact: stockOuts.reduce((sum, e) => sum + e.estimatedImpact, 0),
        confidence: 'HIGH',
        dataUsed: ['Inventory Levels', 'Daily Demand History', 'Purchase Orders', 'Inbound Shipments'],
        lastUpdated: new Date().toISOString(),
        relatedExceptions: stockOuts
      };
    } else if (id === 'pred-2' || id.includes('Shipment')) {
      const delays = exceptions.filter(e => e.type === 'Shipment Delay');
      return {
        type: 'Shipment Delay Risk',
        entity: `${delays.length} Active Shipments`,
        status: 'Active Monitoring',
        riskLevel: 'MEDIUM',
        horizon: '14 Days',
        evidence: `Carrier performance trends and transit logs suggest ${delays.length} active shipments are likely to be delayed beyond expected arrival times.`,
        impact: delays.reduce((sum, e) => sum + e.estimatedImpact, 0),
        confidence: 'MEDIUM',
        dataUsed: ['Carrier Tracking Logs', 'Shipment ETA', 'Route Weather & Port Data'],
        lastUpdated: new Date().toISOString(),
        relatedExceptions: delays
      };
    } else {
      return {
        type: 'Demand Anomaly',
        entity: 'System-wide SKUs',
        status: 'Not Configured / Insufficient Data',
        riskLevel: 'LOW',
        horizon: '30 Days',
        evidence: 'Insufficient historical time-series demand dataset to compute reliable multi-variate anomaly spikes.',
        impact: 0,
        confidence: 'NOT AVAILABLE',
        dataUsed: ['Historical Sales Orders'],
        lastUpdated: new Date().toISOString(),
        relatedExceptions: []
      };
    }
  }, [id, exceptions]);

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Predictive Engine Model</div>
            <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{predData.type}</h2>
          </div>
          <span className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded-md border ${
            predData.confidence === 'HIGH' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
            predData.confidence === 'MEDIUM' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
            'bg-[#1B1B1B] text-[#777777] border-[#2A2A2A]'
          }`}>
            Confidence: {predData.confidence}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Time Horizon</div>
            <div className="font-mono text-[#F5F5F5]">{predData.horizon}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Business Impact</div>
            <div className="font-mono text-[#F5F5F5]">{formatCurrency(predData.impact, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Status</div>
            <div className="font-mono text-[#30D158]">{predData.status}</div>
          </div>
        </div>
      </div>

      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-3">
        <h3 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Evidence & Rationale</h3>
        <p className="text-xs text-[#B3B3B3] leading-relaxed font-mono">{predData.evidence}</p>
      </div>

      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-3">
        <h3 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Data Sources Used</h3>
        <div className="flex flex-wrap gap-2">
          {predData.dataUsed.map((src, idx) => (
            <span key={idx} className="text-xs font-mono px-2.5 py-1 bg-[#111111] text-[#F5F5F5] border border-[#2A2A2A] rounded-md">
              {src}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">
          Related Events ({predData.relatedExceptions.length})
        </h3>
        {predData.relatedExceptions.length === 0 ? (
          <div className="bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl text-center text-xs text-[#777777] font-mono">
            No related events found.
          </div>
        ) : (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden divide-y divide-[#2A2A2A]">
            {predData.relatedExceptions.map(ex => (
              <div 
                key={ex.id}
                onClick={() => openEntity({ type: 'exception', id: ex.id })}
                className="p-4 hover:bg-[#202020] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-[#F5F5F5] mb-1">{ex.description}</div>
                  <div className="text-[10px] text-[#777777] font-mono">Entity: {ex.entityId} | Impact: {formatCurrency(ex.estimatedImpact, currency)}</div>
                </div>
                <ArrowRight size={14} className="text-[#777777]" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[10px] font-mono text-[#777777] pt-2">
        Last Updated: {formatDateOnly(predData.lastUpdated)} (Deterministic AI Reasoning Engine)
      </div>
    </div>
  );
};
