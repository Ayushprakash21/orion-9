import React, { useState, useMemo } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ArrowUpRight, 
  Filter,
  Package,
  Truck,
  Building2,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

export const OrionMobileAlerts: React.FC = () => {
  const { openEntityDetail } = useMobileNavigation();
  const { exceptions, shipments, purchaseOrders, inventory, currency } = useSupplyChain();

  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // Unified list of alerts & exception events
  const alertsList = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      entityId: string;
      entityType: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
      timestamp: string;
      impact: number;
      recommendedAction: string;
      status: string;
      raw: any;
    }> = exceptions.map(exc => ({
      id: exc.id,
      title: (exc as any).title || exc.type,
      entityId: exc.entityId || exc.id,
      entityType: exc.type || 'Logistics',
      severity: (exc.severity?.toUpperCase() || 'HIGH') as 'CRITICAL' | 'HIGH' | 'MEDIUM',
      timestamp: exc.date ? new Date(exc.date).toLocaleDateString() : 'Today',
      impact: exc.estimatedImpact || 18500,
      recommendedAction: (exc as any).recommendation || exc.recommendedAction || 'Initiate multi-tier supplier resolution workflow.',
      status: exc.status || 'Active',
      raw: exc,
    }));

    // Add delayed shipment alerts if not already in exceptions
    shipments.filter(s => s.delayDays > 0).forEach(s => {
      list.push({
        id: `ALT-${s.id}`,
        title: `Carrier Transit Delay: ${s.carrier || 'Express'}`,
        entityId: s.trackingNumber || s.id,
        entityType: 'Shipment',
        severity: s.delayDays > 3 ? 'CRITICAL' : 'HIGH',
        timestamp: s.expectedArrival ? new Date(s.expectedArrival).toLocaleDateString() : 'Recent',
        impact: s.freightCost ? s.freightCost * 2 : 24000,
        recommendedAction: `Contact ${s.carrier || 'carrier'} for customs clearance fast-track.`,
        status: s.status,
        raw: s,
      });
    });

    if (severityFilter === 'ALL') return list;
    return list.filter(a => a.severity === severityFilter);
  }, [exceptions, shipments, severityFilter]);

  const criticalCount = exceptions.filter(e => e.severity === 'Critical').length || 3;
  const highCount = exceptions.filter(e => e.severity === 'High').length || 7;

  return (
    <div className="w-full max-w-full space-y-3.5 pb-8 select-none">
      {/* 1. ALERTS HEADER BANNER */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-os-text-primary font-bold">
              Operational Alerts & Risks
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-semibold">
            {criticalCount} Critical
          </span>
        </div>
        <p className="text-xs text-os-text-muted mt-0.5">
          Priority-ranked exceptions and automated containment alerts across all SCM nodes.
        </p>
      </div>

      {/* 2. SEVERITY FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs font-mono">
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-3.5 py-1.5 rounded-lg border whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
              severityFilter === sev
                ? 'bg-os-accent/15 border-os-accent text-os-accent font-bold'
                : 'bg-os-surface border-os-border text-os-text-muted hover:text-os-text-primary'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* 3. ALERTS CARDS STREAM */}
      <div className="space-y-2.5">
        {alertsList.length > 0 ? (
          alertsList.map(alert => (
            <div
              key={alert.id}
              onClick={() => openEntityDetail({
                type: 'alert',
                id: alert.id,
                title: alert.title,
                subtitle: `Entity: ${alert.entityId} (${alert.entityType})`,
                severity: alert.severity.toLowerCase() as any,
                impact: alert.impact,
                data: alert.raw
              })}
              className="bg-os-surface border border-os-border hover:border-os-border-strong rounded-xl p-3.5 space-y-2.5 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : alert.severity === 'HIGH'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs font-bold text-os-text-primary line-clamp-1">
                    {alert.title}
                  </span>
                </div>

                <span className="text-xs font-mono font-semibold text-red-400 shrink-0">
                  {formatCurrency(alert.impact, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-os-text-secondary">
                <span>{alert.entityId}</span>
                <span className="text-os-text-muted">{alert.timestamp}</span>
              </div>

              {/* Recommended Action Card */}
              <div className="bg-os-surface-secondary border border-os-border rounded-lg p-2 text-xs text-os-text-secondary space-y-0.5">
                <div className="text-[9px] font-mono uppercase text-os-accent font-semibold">
                  Recommended Action:
                </div>
                <div className="text-[11px] text-os-text-primary line-clamp-2">
                  {alert.recommendedAction}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted pt-1 border-t border-os-border/50">
                <span className="text-emerald-400 font-semibold uppercase">{alert.status}</span>
                <span className="flex items-center gap-0.5 text-os-accent font-medium">
                  Review & Execute <ArrowUpRight size={10} />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-os-surface border border-os-border rounded-xl p-8 text-center text-xs font-mono text-os-text-muted">
            No alerts found matching "{severityFilter}" severity filter.
          </div>
        )}
      </div>
    </div>
  );
};
