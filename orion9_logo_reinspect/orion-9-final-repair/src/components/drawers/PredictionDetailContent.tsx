import React, { useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { Lightbulb, ShieldAlert, ArrowRight, Activity, Clock, FileText } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { formatDateOnly } from '../../lib/utils';

export const PredictionDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { exceptions, inventory, shipments, purchaseOrders, suppliers, currency, timezone } = useSupplyChain();
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
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Predictive Engine Model</div>
            <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{predData.type}</h2>
          </div>
          <span className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded-md border ${
            predData.confidence === 'HIGH' ? 'bg-os-surface-elevated text-[#FF453A] border-os-border' :
            predData.confidence === 'MEDIUM' ? 'bg-os-surface-elevated text-[#FF9F0A] border-os-border' :
            'bg-os-surface-elevated text-os-text-muted border-os-border'
          }`}>
            Confidence: {predData.confidence}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Time Horizon</div>
            <div className="font-mono text-os-text-primary">{predData.horizon}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Business Impact</div>
            <div className="font-mono text-os-text-primary">{formatCurrency(predData.impact, currency)}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Status</div>
            <div className="font-mono text-[#30D158]">{predData.status}</div>
          </div>
        </div>
      </div>

      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-3">
        <h3 className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Evidence & Rationale</h3>
        <p className="text-xs text-os-text-secondary leading-relaxed font-mono">{predData.evidence}</p>
      </div>

      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-3">
        <h3 className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Data Sources Used</h3>
        <div className="flex flex-wrap gap-2">
          {predData.dataUsed.map((src, idx) => (
            <span key={idx} className="text-xs font-mono px-2.5 py-1 bg-os-surface text-os-text-primary border border-os-border rounded-md">
              {src}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">
          Related Events ({predData.relatedExceptions.length})
        </h3>
        {predData.relatedExceptions.length === 0 ? (
          <div className="bg-os-surface border border-os-border p-6 rounded-xl text-center text-xs text-os-text-muted font-mono">
            No related events found.
          </div>
        ) : (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden divide-y divide-[#2A2A2A]">
            {predData.relatedExceptions.map(ex => (
              <div 
                key={ex.id}
                onClick={() => openEntity({ type: 'exception', id: ex.id })}
                className="p-4 hover:bg-os-surface-hover transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-os-text-primary mb-1">{ex.description}</div>
                  <div className="text-[10px] text-os-text-muted font-mono">Entity: {ex.entityId} | Impact: {formatCurrency(ex.estimatedImpact, currency)}</div>
                </div>
                <ArrowRight size={14} className="text-os-text-muted" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[10px] font-mono text-os-text-muted pt-2">
        Last Updated: {formatDateOnly(predData.lastUpdated, timezone)} (Deterministic AI Reasoning Engine)
      </div>
    </div>
  );
};
