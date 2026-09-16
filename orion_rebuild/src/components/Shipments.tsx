import React, { useMemo, useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { useEntityContextMenu } from '../os/contextMenu/useEntityContextMenu';
import { formatCurrency, formatCurrencyPair } from '../lib/formatters';
import { safeFormatDate } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import { useOrionSearch } from '../os/OrionSearchContext';
import { Filter, Truck, AlertTriangle, Navigation, MapPin, ArrowRight } from 'lucide-react';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';

export const Shipments = () => {
  const { shipments, currency, timezone } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { openShipmentContextMenu } = useEntityContextMenu();
  const { searchQuery } = useOrionSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'delayed') {
      setStatusFilter('Delayed');
    }
  }, [searchParams]);

  const filteredShipments = useMemo(() => {
    return (shipments || []).filter(item => {
      if (!item) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          Boolean(item.id?.toLowerCase().includes(q)) ||
          Boolean(item.poId?.toLowerCase().includes(q)) ||
          Boolean(item.carrier?.toLowerCase().includes(q)) ||
          Boolean(item.origin?.toLowerCase().includes(q)) ||
          Boolean(item.destination?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [shipments, statusFilter, searchQuery]);

  // KPIs
  const activeShipments = useMemo(() => (shipments || []).filter(s => s && s.status !== 'Delivered' && s.status !== 'Cancelled'), [shipments]);
  const activeCount = activeShipments.length;
  const delayedShipments = useMemo(() => activeShipments.filter(s => s.status === 'Delayed'), [activeShipments]);
  const delayedCount = delayedShipments.length;
  
  const inTransitCount = activeShipments.filter(s => s.status === 'In Transit').length;
  const customsCount = activeShipments.filter(s => s.status === 'Exception').length;
  
  const totalValue = activeShipments.reduce((sum, s) => sum + (s.freightCost || 0), 0);
  const totalValueFormatted = formatCurrencyPair(totalValue, currency);
  const atRiskValue = delayedShipments.reduce((sum, s) => sum + (s.freightCost || 0), 0);
  const atRiskValueFormatted = formatCurrencyPair(atRiskValue, currency);

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      
      <PageHeader 
        title="Logistics & Transit Intelligence" 
        description="Monitor active shipments, track delays, and manage estimated time of arrivals."
        actions={
          <div className="flex flex-wrap gap-2 w-full">
            <select 
              className="flex-1 sm:w-auto rounded-lg border border-os-border-strong bg-os-surface px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-os-border transition-colors"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSearchParams({});
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Transit">In Transit</option>
              <option value="Exception">Exception</option>
              <option value="Picked Up">Picked Up</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Active Shipments" value={activeCount} />
        <KPICard label="In Transit" value={inTransitCount} />
        <KPICard label="Delayed" value={delayedCount} status={delayedCount > 0 ? "critical" : "neutral"} trend={delayedCount > 0 ? "Action needed" : "On schedule"} trendUp={delayedCount === 0} />
        <KPICard label="Exceptions" value={customsCount} status={customsCount > 0 ? "warning" : "neutral"} />
        <KPICard 
          label="Freight Cost in Transit" 
          value={totalValueFormatted.compact}
          exactValue={totalValueFormatted.exact}
          subLabel="Total Freight"
        />
        <KPICard 
          label="At-Risk Freight" 
          value={atRiskValueFormatted.compact}
          exactValue={atRiskValueFormatted.exact}
          subLabel="Delayed Freight"
          status={atRiskValue > 0 ? "critical" : "neutral"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Transit Network Map */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors relative overflow-hidden min-h-[250px] flex flex-col">
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <Navigation size={16} className="text-os-text-secondary" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Transit Network</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative z-10 mt-4">
            <div className="w-full max-w-lg">
              {activeShipments.slice(0, 3).map((shipment, idx) => (
                <div key={shipment.id} className="mb-6 last:mb-0">
                  <div className="flex justify-between text-[10px] uppercase font-mono text-os-text-secondary tracking-widest mb-2">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {shipment.origin}</span>
                    <span className={shipment.status === 'Delayed' ? 'text-red-500 font-bold' : 'text-os-text-primary'}>{shipment.id}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {shipment.destination}</span>
                  </div>
                  <div className="relative w-full h-1.5 bg-os-surface-secondary border border-os-border rounded-full overflow-hidden">
                    {/* Simulated progress based on status */}
                    <div 
                      className={`absolute top-0 left-0 h-full ${shipment.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{
                        width: shipment.status === 'Planned' ? '10%' :
                               shipment.status === 'In Transit' || shipment.status === 'Delayed' ? '50%' :
                               shipment.status === 'Exception' ? '75%' :
                               shipment.status === 'Picked Up' ? '90%' : '100%'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-os-text-muted mt-1">
                    <span>Dep: {safeFormatDate(shipment.shipDate, 'dd MMM', timezone)}</span>
                    <span>ETA: {safeFormatDate(shipment.expectedArrival, 'dd MMM', timezone)}</span>
                  </div>
                </div>
              ))}
              {activeShipments.length === 0 && (
                <div className="text-center text-xs text-os-text-muted italic">No active shipments in transit.</div>
              )}
            </div>
          </div>
        </div>

        {/* Highest Risk Shipment */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Logistics Attention</h3>
          </div>
          
          {delayedCount > 0 ? (() => {
            const topRisk = delayedShipments.slice().sort((a,b) => (b.delayDays || 0) - (a.delayDays || 0))[0];
            if (!topRisk) {
              return (
                <div className="flex-1 flex items-center justify-center text-xs text-os-text-muted italic">
                  No delayed shipments detected.
                </div>
              );
            }
            return (
              <div className="mt-2">
                <div className="text-lg font-mono text-os-text-primary">{topRisk.id}</div>
                <div className="text-xs text-os-text-secondary truncate">{topRisk.carrier} •</div>
                
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] uppercase text-red-500 font-bold tracking-wider">{topRisk.status}</div>
                    <div className="text-xs font-mono text-red-500">Delay: {topRisk.delayDays} days</div>
                  </div>
                  <div className="text-[10px] text-os-text-primary mb-1">{topRisk.origin} → {topRisk.destination}</div>
                  <div className="text-[10px] text-os-text-muted mt-1">New ETA: {safeFormatDate(topRisk.expectedArrival, 'dd MMM yyyy', timezone)}</div>
                </div>

                <div className="mt-4">
                   <div className="text-[10px] text-os-text-muted uppercase mb-1">PO Link</div>
                   <div className="font-mono text-xs text-os-text-primary border border-os-border bg-os-surface-secondary px-2 py-1 rounded inline-block">{topRisk.poId}</div>
                </div>

                <button 
                  onClick={() => openEntity('shipment', topRisk.id)}
                  className="mt-6 w-full py-1.5 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-md text-[10px] font-bold uppercase tracking-widest text-os-text-primary transition-colors"
                >
                  Track Shipment
                </button>
              </div>
            );
          })() : (
            <div className="flex-1 flex items-center justify-center text-xs text-os-text-muted italic">
              No delayed shipments detected.
            </div>
          )}
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full shadow-sm">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {filteredShipments.slice(0, 50).map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('shipment', item.id)}
              onContextMenu={(e) => openShipmentContextMenu(e, item)}
              title={item.id}
              subtitle={`${item.origin} → ${item.destination}`}
              statusNode={
                <StatusBadge 
                  status={item.status} 
                  type={
                    item.status === 'Delivered' ? 'healthy' : 
                    item.status === 'Delayed' ? 'critical' : 
                    (item.status === 'Exception' || item.status === 'Planned') ? 'warning' : 'info'
                  } 
                />
              }
              fields={[
                { label: 'Carrier', value: item.carrier },
                { label: 'ETA', value: safeFormatDate(item.expectedArrival, 'dd MMM yyyy', timezone), valueClassName: 'font-mono' },
                { label: 'PO Reference', value: item.poId, valueClassName: 'font-mono' }
              ]}
            />
          ))}
          {filteredShipments.length === 0 && (
            <div className="p-8 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching shipments found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-os-text-secondary">
            <thead className="bg-os-surface-secondary text-[10px] uppercase font-mono text-os-text-secondary border-b border-os-border">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Tracking / Carrier</th>
                <th className="px-6 py-4 font-semibold tracking-wider">PO Reference</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Route</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Departure</th>
                <th className="px-6 py-4 font-semibold tracking-wider">ETA</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Delay</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {filteredShipments.slice(0, 50).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('shipment', item.id)}
                  onContextMenu={(e) => openShipmentContextMenu(e, item)}
                  className="hover:bg-os-surface-hover cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono font-medium text-os-text-primary">{item.id}</div>
                    <div className="text-[10px] text-os-text-muted mt-0.5">{item.carrier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-os-text-secondary">
                    {item.poId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[100px]">{item.origin}</span>
                      <ArrowRight size={10} className="text-os-text-muted shrink-0" />
                      <span className="truncate max-w-[100px]">{item.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {safeFormatDate(item.shipDate, 'dd MMM yyyy', timezone)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {safeFormatDate(item.expectedArrival, 'dd MMM yyyy', timezone)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {item.delayDays > 0 ? (
                      <span className="text-red-500 font-medium">+{item.delayDays} days</span>
                    ) : (
                      <span className="text-os-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge 
                      status={item.status} 
                      type={
                        item.status === 'Delivered' ? 'healthy' : 
                        item.status === 'Delayed' ? 'critical' : 
                        (item.status === 'Exception' || item.status === 'Planned') ? 'warning' : 'info'
                      } 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredShipments.length === 0 && (
            <div className="p-12 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching shipments found
            </div>
          )}
          {filteredShipments.length > 50 && (
            <div className="px-6 py-3 border-t border-os-border bg-os-surface-secondary text-center text-[10px] text-os-text-muted font-mono uppercase tracking-widest">
              Showing top 50 of {filteredShipments.length} results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
