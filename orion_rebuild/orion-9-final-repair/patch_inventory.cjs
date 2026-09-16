const fs = require('fs');

const code = `import React, { useState, useMemo, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { Search, Filter, AlertTriangle, TrendingUp, Package, Activity } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';

export const Inventory = () => {
  const { inventory, products, warehouses, currency, settings } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'critical') {
      setStatusFilter('Critical');
    } else if (filterParam === 'excess') {
      setStatusFilter('Excess');
    }
  }, [searchParams]);

  const enrichedInventory = useMemo(() => {
    return inventory.map(inv => {
      const product = products.find(p => p.id === inv.productId);
      const warehouse = warehouses.find(w => w.id === inv.warehouseId);
      const available = inv.onHand - inv.reserved;
      const value = inv.onHand * inv.unitCost;
      
      const healthStats = AnalyticsEngine.calculateInventoryHealth(inv, settings);
      return {
        ...inv,
        product,
        warehouse,
        available,
        daysOfSupply: healthStats.daysOfSupply,
        value,
        status: healthStats.status,
        risk: healthStats.status === 'Critical' ? 'High' : (healthStats.status === 'Low Stock' || healthStats.status === 'Excess' ? 'Medium' : 'Low')
      };
    });
  }, [inventory, products, warehouses, settings]);

  const filteredInventory = useMemo(() => {
    return enrichedInventory.filter(item => {
      if (selectedWarehouse !== 'All' && item.warehouseId !== selectedWarehouse) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.productId.toLowerCase().includes(q) ||
          item.product?.name.toLowerCase().includes(q) ||
          item.product?.category.toLowerCase().includes(q) ||
          item.warehouse?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedInventory, selectedWarehouse, statusFilter, searchQuery]);

  // KPIs
  const totalValue = enrichedInventory.reduce((sum, item) => sum + item.value, 0);
  const criticalCount = enrichedInventory.filter(i => i.status === 'Critical').length;
  const lowCount = enrichedInventory.filter(i => i.status === 'Low Stock').length;
  const excessCount = enrichedInventory.filter(i => i.status === 'Excess').length;
  
  const avgDaysSupply = enrichedInventory.length > 0 
    ? enrichedInventory.reduce((sum, i) => sum + (i.daysOfSupply || 0), 0) / enrichedInventory.length 
    : 0;

  // Chart data (simple visual representation)
  const healthData = {
    Healthy: enrichedInventory.filter(i => i.status === 'Healthy').length,
    Low: lowCount,
    Critical: criticalCount,
    Excess: excessCount
  };
  const totalItems = enrichedInventory.length;

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-6 box-border">
      
      <PageHeader 
        title="Inventory Intelligence" 
        description="Monitor availability, days of supply, valuation and stock-out exposure across the network."
        actions={
          <div className="flex flex-wrap gap-2 w-full">
            <select 
              className="flex-1 sm:w-auto rounded-lg border border-os-border-strong bg-os-surface px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-os-border transition-colors"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="All">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select 
              className="flex-1 sm:w-auto rounded-lg border border-os-border-strong bg-os-surface px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-os-border transition-colors"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSearchParams({});
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical">Critical</option>
              <option value="Excess">Excess</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Value" value={formatCurrency(totalValue, currency)} trend="Current exposure" />
        <KPICard label="Total SKUs" value={formatNumber(totalItems)} />
        <KPICard label="Critical Stock" value={criticalCount} status={criticalCount > 0 ? "critical" : "neutral"} trend={criticalCount > 0 ? "Needs attention" : "Stable"} trendUp={criticalCount === 0} />
        <KPICard label="Low Stock" value={lowCount} status={lowCount > 0 ? "warning" : "neutral"} />
        <KPICard label="Excess Inv" value={excessCount} status={excessCount > 0 ? "warning" : "neutral"} />
        <KPICard label="Avg Days Supply" value={formatNumber(avgDaysSupply, 1)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Health Bar */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-os-text-secondary" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Inventory Health Distribution</h3>
          </div>
          <div className="w-full h-8 flex rounded-md overflow-hidden mb-4 bg-os-surface-secondary border border-os-border">
            {totalItems > 0 ? (
              <>
                <div style={{width: \`\${(healthData.Healthy / totalItems) * 100}%\`}} className="bg-emerald-500 h-full border-r border-os-border transition-all" title={\`Healthy: \${healthData.Healthy}\`}></div>
                <div style={{width: \`\${(healthData.Low / totalItems) * 100}%\`}} className="bg-amber-500 h-full border-r border-os-border transition-all" title={\`Low: \${healthData.Low}\`}></div>
                <div style={{width: \`\${(healthData.Critical / totalItems) * 100}%\`}} className="bg-red-500 h-full border-r border-os-border transition-all" title={\`Critical: \${healthData.Critical}\`}></div>
                <div style={{width: \`\${(healthData.Excess / totalItems) * 100}%\`}} className="bg-blue-500 h-full transition-all" title={\`Excess: \${healthData.Excess}\`}></div>
              </>
            ) : (
              <div className="w-full h-full bg-os-surface-active"></div>
            )}
          </div>
          <div className="flex justify-between text-[10px] uppercase font-mono text-os-text-secondary tracking-widest">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Healthy ({healthData.Healthy})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Low ({healthData.Low})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical ({healthData.Critical})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Excess ({healthData.Excess})</span>
          </div>
        </div>

        {/* Highest Risk SKU (AI Signal Concept) */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Top Risk Exposure</h3>
          </div>
          
          {criticalCount > 0 ? (() => {
            const topRisk = enrichedInventory.filter(i => i.status === 'Critical').sort((a,b) => b.value - a.value)[0];
            return (
              <div className="mt-2">
                <div className="text-lg font-mono text-os-text-primary">{topRisk.productId}</div>
                <div className="text-xs text-os-text-secondary truncate">{topRisk.product?.name}</div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-os-text-muted uppercase">Available</div>
                    <div className="text-os-text-primary">{formatNumber(topRisk.available)} units</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-os-text-muted uppercase">Exposure</div>
                    <div className="text-red-500">{formatCurrency(topRisk.value, currency)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => openEntity('inventory', topRisk.productId)}
                  className="mt-4 w-full py-1.5 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-md text-[10px] font-bold uppercase tracking-widest text-os-text-primary transition-colors"
                >
                  Investigate
                </button>
              </div>
            );
          })() : (
            <div className="flex-1 flex items-center justify-center text-xs text-os-text-muted italic">
              No critical risks detected.
            </div>
          )}
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full shadow-sm">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {filteredInventory.slice(0, 50).map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('inventory', item.productId)}
              title={item.productId}
              subtitle={item.product?.name}
              statusNode={
                <StatusBadge 
                  status={item.status} 
                  type={item.status === 'Healthy' ? 'healthy' : item.status === 'Critical' ? 'critical' : item.status === 'Low Stock' ? 'warning' : 'neutral'} 
                />
              }
              fields={[
                { label: 'Warehouse', value: item.warehouse?.name },
                { label: 'Available', value: formatNumber(item.available) },
                { label: 'Days Supply', value: formatNumber(item.daysOfSupply, 1) },
                { label: 'Value', value: formatCurrency(item.value, currency) },
                { label: 'Risk', value: item.risk, valueClassName: \`font-mono \${item.risk === 'High' ? 'text-red-500' : item.risk === 'Medium' ? 'text-amber-500' : 'text-os-text-secondary'}\` }
              ]}
            />
          ))}
          {filteredInventory.length === 0 && (
            <div className="p-8 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching inventory records found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-os-text-secondary">
            <thead className="bg-os-surface-secondary text-[10px] uppercase font-mono text-os-text-secondary border-b border-os-border">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">SKU / Product</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Warehouse</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Available</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Days Supply</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Value</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {filteredInventory.slice(0, 50).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('inventory', item.productId)}
                  className="hover:bg-os-surface-hover cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-os-text-primary font-medium">{item.productId}</div>
                    <div className="text-[10px] text-os-text-muted truncate max-w-[200px] mt-0.5">{item.product?.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-os-text-secondary">
                    {item.warehouse?.name}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatNumber(item.available)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatNumber(item.daysOfSupply, 1)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatCurrency(item.value, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge 
                      status={item.status} 
                      type={item.status === 'Healthy' ? 'healthy' : item.status === 'Critical' ? 'critical' : item.status === 'Low Stock' ? 'warning' : 'neutral'} 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge 
                      status={item.risk} 
                      type={item.risk === 'High' ? 'critical' : item.risk === 'Medium' ? 'warning' : 'neutral'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div className="p-12 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching inventory records found
            </div>
          )}
          {filteredInventory.length > 50 && (
            <div className="px-6 py-3 border-t border-os-border bg-os-surface-secondary text-center text-[10px] text-os-text-muted font-mono uppercase tracking-widest">
              Showing top 50 of {filteredInventory.length} results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/Inventory.tsx', code);
