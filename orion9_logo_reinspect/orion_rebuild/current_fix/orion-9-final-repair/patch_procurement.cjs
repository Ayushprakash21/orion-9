const fs = require('fs');
const code = `import React, { useMemo, useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { safeFormatDate } from '../lib/utils';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Filter, AlertTriangle, Clock, ArrowRight, ArrowRightCircle } from 'lucide-react';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';

export const Procurement = () => {
  const { purchaseOrders, suppliers, currency, timezone } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'overdue') {
      setStatusFilter('Delayed');
    }
  }, [searchParams]);

  const enrichedPOs = useMemo(() => {
    return purchaseOrders.map(po => {
      const supplier = suppliers.find(s => s.id === po.supplierId);
      return {
        ...po,
        supplierName: supplier?.name || 'Unknown'
      };
    });
  }, [purchaseOrders, suppliers]);

  const filteredPOs = useMemo(() => {
    return enrichedPOs.filter(item => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      
      if (searchParams.get('filter') === 'open') {
        if (['Received', 'Cancelled', 'Closed'].includes(item.status)) return false;
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q) ||
          item.buyer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedPOs, statusFilter, searchQuery, searchParams]);

  // KPIs
  const totalValue = enrichedPOs.reduce((sum, po) => sum + po.totalValue, 0);
  const openCount = enrichedPOs.filter(po => !['Received', 'Cancelled', 'Closed'].includes(po.status)).length;
  const delayedCount = enrichedPOs.filter(po => po.status === 'Delayed' || po.status === 'Overdue').length;
  const partialCount = enrichedPOs.filter(po => po.status === 'Partially Received').length;
  const onTimePercent = enrichedPOs.length > 0 
    ? (enrichedPOs.filter(po => po.status === 'Received').length / enrichedPOs.filter(po => po.status === 'Received' || po.status === 'Delayed').length || 1) * 100 
    : 100;
  
  const atRiskValue = enrichedPOs
    .filter(po => po.status === 'Delayed' || po.status === 'Overdue')
    .reduce((sum, po) => sum + po.totalValue, 0);

  // Pipeline stages
  const pipeline = {
    approved: enrichedPOs.filter(po => po.status === 'Approved').length,
    inTransit: enrichedPOs.filter(po => po.status === 'In Transit').length,
    partial: partialCount,
    received: enrichedPOs.filter(po => po.status === 'Received').length,
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-6 box-border">
      
      <PageHeader 
        title="Procurement Control" 
        description="Manage purchase order pipeline, monitor delivery schedules, and track financial exposure."
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
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="In Transit">In Transit</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received</option>
              <option value="Delayed">Delayed</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total PO Value" value={formatCurrency(totalValue, currency)} />
        <KPICard label="Open POs" value={openCount} />
        <KPICard label="Delayed" value={delayedCount} status={delayedCount > 0 ? "critical" : "neutral"} trend={delayedCount > 0 ? "Requires action" : "On track"} trendUp={delayedCount === 0} />
        <KPICard label="Partially Recv." value={partialCount} />
        <KPICard label="On-Time Recv." value={\`\${formatNumber(onTimePercent, 1)}%\`} status={onTimePercent < 90 ? "warning" : "healthy"} />
        <KPICard label="At-Risk Value" value={formatCurrency(atRiskValue, currency)} status={atRiskValue > 0 ? "critical" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Procurement Pipeline */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRightCircle size={16} className="text-os-text-secondary" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Procurement Pipeline</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center w-full mt-8 mb-4 px-4 sm:px-10">
            <div className="flex flex-col items-center relative z-10 w-full sm:w-auto mb-4 sm:mb-0">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-2 font-mono text-lg">{pipeline.approved}</div>
              <div className="text-[10px] uppercase font-bold text-os-text-secondary tracking-widest text-center">Approved</div>
            </div>
            
            <div className="hidden sm:block flex-1 h-px bg-os-border mx-2 relative top-[-10px]"></div>
            
            <div className="flex flex-col items-center relative z-10 w-full sm:w-auto mb-4 sm:mb-0">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-2 font-mono text-lg">{pipeline.inTransit}</div>
              <div className="text-[10px] uppercase font-bold text-os-text-secondary tracking-widest text-center">In Transit</div>
            </div>

            <div className="hidden sm:block flex-1 h-px bg-os-border mx-2 relative top-[-10px]"></div>
            
            <div className="flex flex-col items-center relative z-10 w-full sm:w-auto mb-4 sm:mb-0">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-2 font-mono text-lg">{pipeline.partial}</div>
              <div className="text-[10px] uppercase font-bold text-os-text-secondary tracking-widest text-center">Partial</div>
            </div>

            <div className="hidden sm:block flex-1 h-px bg-os-border mx-2 relative top-[-10px]"></div>
            
            <div className="flex flex-col items-center relative z-10 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2 font-mono text-lg">{pipeline.received}</div>
              <div className="text-[10px] uppercase font-bold text-os-text-secondary tracking-widest text-center">Received</div>
            </div>
          </div>
        </div>

        {/* Management Attention */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-red-500" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Management Attention</h3>
          </div>
          
          {delayedCount > 0 ? (() => {
            const topRisk = enrichedPOs.filter(i => i.status === 'Delayed' || i.status === 'Overdue').sort((a,b) => b.totalValue - a.totalValue)[0];
            return (
              <div className="mt-2">
                <div className="text-lg font-mono text-os-text-primary">{topRisk.id}</div>
                <div className="text-xs text-os-text-secondary truncate">{topRisk.supplierName}</div>
                
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] uppercase text-red-500 font-bold tracking-wider">{topRisk.status}</div>
                    <div className="text-xs font-mono text-red-500">{formatCurrency(topRisk.totalValue, currency)}</div>
                  </div>
                  <div className="text-[10px] text-os-text-secondary">Expected: {safeFormatDate(topRisk.expectedDelivery, 'dd MMM yyyy', timezone)}</div>
                </div>

                <button 
                  onClick={() => openEntity('po', topRisk.id)}
                  className="mt-6 w-full py-1.5 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-md text-[10px] font-bold uppercase tracking-widest text-os-text-primary transition-colors"
                >
                  Expedite Order
                </button>
              </div>
            );
          })() : (
            <div className="flex-1 flex items-center justify-center text-xs text-os-text-muted italic">
              No delayed orders detected.
            </div>
          )}
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full shadow-sm">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {filteredPOs.slice(0, 50).map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('po', item.id)}
              title={item.id}
              subtitle={item.supplierName}
              statusNode={
                <StatusBadge 
                  status={item.status} 
                  type={
                    item.status === 'Received' ? 'healthy' : 
                    (item.status === 'Delayed' || item.status === 'Overdue') ? 'critical' : 
                    item.status === 'Partially Received' ? 'warning' : 'neutral'
                  } 
                />
              }
              fields={[
                { label: 'Expected', value: safeFormatDate(item.expectedDelivery, 'dd MMM yyyy', timezone) },
                { label: 'Total Value', value: formatCurrency(item.totalValue, currency), valueClassName: 'font-mono' },
                { label: 'Buyer', value: item.buyer }
              ]}
            />
          ))}
          {filteredPOs.length === 0 && (
            <div className="p-8 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching purchase orders found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-os-text-secondary">
            <thead className="bg-os-surface-secondary text-[10px] uppercase font-mono text-os-text-secondary border-b border-os-border">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">PO Number</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Supplier</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Order Date</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Expected</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Total Value</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {filteredPOs.slice(0, 50).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('po', item.id)}
                  className="hover:bg-os-surface-hover cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-os-text-primary">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-os-text-secondary">
                    {item.supplierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {safeFormatDate(item.orderDate, 'dd MMM yyyy', timezone)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {safeFormatDate(item.expectedDelivery, 'dd MMM yyyy', timezone)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatCurrency(item.totalValue, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge 
                      status={item.status} 
                      type={
                        item.status === 'Received' ? 'healthy' : 
                        (item.status === 'Delayed' || item.status === 'Overdue') ? 'critical' : 
                        item.status === 'Partially Received' ? 'warning' : 'neutral'
                      } 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPOs.length === 0 && (
            <div className="p-12 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching purchase orders found
            </div>
          )}
          {filteredPOs.length > 50 && (
            <div className="px-6 py-3 border-t border-os-border bg-os-surface-secondary text-center text-[10px] text-os-text-muted font-mono uppercase tracking-widest">
              Showing top 50 of {filteredPOs.length} results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/Procurement.tsx', code);
