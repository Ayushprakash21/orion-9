import React, { useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { WarehouseEngine } from '../services/WarehouseEngine';
import {
  Boxes, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight,
  Maximize2, Clock, Users, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

export const WarehouseOptimization: React.FC = () => {
  const { warehouses, warehouseDetails, inventory } = useSupplyChain();

  const analyses = useMemo(() => {
    return WarehouseEngine.analyzeWarehouses(warehouses, warehouseDetails, inventory);
  }, [warehouses, warehouseDetails, inventory]);

  const aggregate = useMemo(() => {
    return WarehouseEngine.getAggregateMetrics(analyses);
  }, [analyses]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-os-text-primary tracking-tight">Warehouse Optimization & Capacity Planning</h1>
        <p className="text-sm text-os-text-secondary mt-1">
          Dynamic pallet capacity utilization, dock door scheduling, inbound congestion alerts, and picking flow balance.
        </p>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Network Utilization</span>
            <Maximize2 size={16} className="text-[#00F2FE]" />
          </div>
          <div className="text-2xl font-bold text-os-text-primary mt-2">{aggregate.averageUtilization}%</div>
          <div className="text-xs text-os-text-muted mt-1">
            {aggregate.totalUsedPallets.toLocaleString()} of {aggregate.totalCapacityPallets.toLocaleString()} pallets
          </div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Critical Congestion</span>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{aggregate.highCongestionFacilities} Facilities</div>
          <div className="text-xs text-red-400/80 mt-1">Utilization or dock queue &gt; 85%</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Avg Dock Door Usage</span>
            <Clock size={16} className="text-[#00F2FE]" />
          </div>
          <div className="text-2xl font-bold text-os-text-primary mt-2">78.4%</div>
          <div className="text-xs text-emerald-400 mt-1">Optimal turnover window</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Labor Fill Rate</span>
            <Users size={16} className="text-[#00F2FE]" />
          </div>
          <div className="text-2xl font-bold text-os-text-primary mt-2">88.5%</div>
          <div className="text-xs text-os-text-muted mt-1">Across 3 daily warehouse shifts</div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analyses.map(facility => (
          <div key={facility.warehouseId} className="p-5 bg-os-surface border border-os-border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#00F2FE] bg-[#00F2FE]/10 px-2 py-0.5 rounded">
                    {facility.warehouseId}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    facility.status === 'CRITICAL_CONGESTION'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : facility.status === 'NEAR_CAPACITY'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {facility.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-os-text-primary mt-1.5">{facility.name}</h3>
                <p className="text-xs text-os-text-muted">{facility.location}</p>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-os-text-primary">{facility.utilizationRate}%</div>
                <span className="text-[10px] text-os-text-muted uppercase">Pallet Space</span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-os-text-muted">
                <span>Pallet Storage</span>
                <span>{facility.usedCapacityPallets.toLocaleString()} / {facility.totalCapacityPallets.toLocaleString()}</span>
              </div>
              <div className="w-full bg-os-surface-active h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    facility.utilizationRate > 90 ? 'bg-red-400' : facility.utilizationRate > 80 ? 'bg-amber-400' : 'bg-[#00F2FE]'
                  }`}
                  style={{ width: `${Math.min(facility.utilizationRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Flow Indicators */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-os-surface-elevated border border-os-border rounded">
                <div className="flex items-center justify-between text-os-text-muted">
                  <span className="flex items-center gap-1"><ArrowDownLeft size={13} className="text-sky-400" /> Inbound Congestion</span>
                  <span className="font-bold text-os-text-primary">{facility.inboundCongestionScore}/100</span>
                </div>
                <div className="w-full bg-os-surface-active h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-sky-400 h-full" style={{ width: `${facility.inboundCongestionScore}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-os-surface-elevated border border-os-border rounded">
                <div className="flex items-center justify-between text-os-text-muted">
                  <span className="flex items-center gap-1"><ArrowUpRight size={13} className="text-emerald-400" /> Outbound Flow</span>
                  <span className="font-bold text-os-text-primary">{facility.outboundCongestionScore}/100</span>
                </div>
                <div className="w-full bg-os-surface-active h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${facility.outboundCongestionScore}%` }} />
                </div>
              </div>
            </div>

            {/* Bottleneck alert if present */}
            {facility.bottleneck && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{facility.bottleneck}</span>
              </div>
            )}

            {/* Action Recommendations */}
            <div className="pt-2 border-t border-os-border">
              <span className="text-[11px] font-semibold text-os-text-muted uppercase tracking-wider block mb-1.5">
                Recommended Actions
              </span>
              <ul className="space-y-1 text-xs text-os-text-secondary">
                {facility.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="text-[#00F2FE] shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
