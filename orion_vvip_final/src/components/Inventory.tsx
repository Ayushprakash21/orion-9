import React, { useState, useMemo, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { useEntityContextMenu } from '../os/contextMenu/useEntityContextMenu';
import { formatCurrency, formatCurrencyCompact, formatCurrencyPair, formatNumber } from '../lib/formatters';
import { Search, Filter, AlertTriangle, TrendingUp, Package, Activity, Building2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useOrionSearch } from '../os/OrionSearchContext';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';

export const Inventory = () => {
  const { inventory, products, warehouses, currency, settings } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { openInventoryContextMenu } = useEntityContextMenu();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery } = useOrionSearch();
  
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
          Boolean(item.productId?.toLowerCase().includes(q)) ||
          Boolean(item.product?.name?.toLowerCase().includes(q)) ||
          Boolean(item.product?.category?.toLowerCase().includes(q)) ||
          Boolean(item.warehouse?.name?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [enrichedInventory, selectedWarehouse, statusFilter, searchQuery]);

  // KPIs derived from exact underlying valuation
  const totalValue = enrichedInventory.reduce((sum, item) => sum + item.value, 0);
  const totalValFormatted = formatCurrencyPair(totalValue, currency);
  
  const criticalCount = enrichedInventory.filter(i => i.status === 'Critical').length;
  const lowCount = enrichedInventory.filter(i => i.status === 'Low Stock').length;
  const excessCount = enrichedInventory.filter(i => i.status === 'Excess').length;
  
  const avgDaysSupply = enrichedInventory.length > 0 
    ? enrichedInventory.reduce((sum, i) => sum + (i.daysOfSupply || 0), 0) / enrichedInventory.length 
    : 0;

  // Warehouse breakdown
  const warehouseDistribution = useMemo(() => {
    const map: Record<string, { id: string; name: string; value: number; count: number }> = {};
    enrichedInventory.forEach(item => {
      const wId = item.warehouseId || 'unknown';
      const wName = item.warehouse?.name || 'Unassigned';
      if (!map[wId]) map[wId] = { id: wId, name: wName, value: 0, count: 0 };
      map[wId].value += item.value;
      map[wId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [enrichedInventory]);

  // Chart data (health representation)
  const healthData = {
    Healthy: enrichedInventory.filter(i => i.status === 'Healthy').length,
    Low: lowCount,
    Critical: criticalCount,
    Excess: excessCount
  };
  const totalItems = enrichedInventory.length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      
      <PageHeader 
        title="Inventory Intelligence" 
        description="Monitor availability, days of supply, network valuation and stock-out exposure across the network."
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
              <option value="All">All Statuses ({totalItems})</option>
              <option value="Healthy">Healthy ({healthData.Healthy})</option>
              <option value="Low Stock">Low Stock ({healthData.Low})</option>
              <option value="Critical">Critical ({healthData.Critical})</option>
              <option value="Excess">Excess ({healthData.Excess})</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard 
          label="Total Inventory Value" 
          value={totalValFormatted.compact} 
          exactValue={totalValFormatted.exact}
          subLabel="Exact"
          trend="Authoritative valuation" 
        />
        <KPICard label="Total SKUs" value={formatNumber(totalItems)} />
        <KPICard label="Critical Stock" value={criticalCount} status={criticalCount > 0 ? "critical" : "neutral"} trend={criticalCount > 0 ? "Action required" : "Stable"} trendUp={criticalCount === 0} />
        <KPICard label="Low Stock" value={lowCount} status={lowCount > 0 ? "warning" : "neutral"} />
        <KPICard label="Excess Inv" value={excessCount} status={excessCount > 0 ? "warning" : "neutral"} />
        <KPICard label="Avg Days Supply" value={formatNumber(avgDaysSupply, 1)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Health Bar & Distribution */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-os-text-secondary" />
                <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Inventory Health Distribution</h3>
              </div>
              <span className="text-[10px] font-mono text-os-text-muted">Click segment to filter</span>
            </div>
            
            <div className="w-full h-8 flex rounded-md overflow-hidden mb-4 bg-os-surface-secondary border border-os-border cursor-pointer">
              {totalItems > 0 ? (
                <>
                  <div 
                    style={{width: `${(healthData.Healthy / totalItems) * 100}%`}} 
                    onClick={() => setStatusFilter(statusFilter === 'Healthy' ? 'All' : 'Healthy')}
                    className={`bg-emerald-500 h-full border-r border-os-border transition-all hover:opacity-90 ${statusFilter === 'Healthy' ? 'ring-2 ring-emerald-300 z-10' : ''}`} 
                    title={`Healthy: ${healthData.Healthy} SKUs (${((healthData.Healthy / totalItems) * 100).toFixed(1)}%) - Click to filter`}
                  />
                  <div 
                    style={{width: `${(healthData.Low / totalItems) * 100}%`}} 
                    onClick={() => setStatusFilter(statusFilter === 'Low Stock' ? 'All' : 'Low Stock')}
                    className={`bg-amber-500 h-full border-r border-os-border transition-all hover:opacity-90 ${statusFilter === 'Low Stock' ? 'ring-2 ring-amber-300 z-10' : ''}`} 
                    title={`Low Stock: ${healthData.Low} SKUs (${((healthData.Low / totalItems) * 100).toFixed(1)}%) - Click to filter`}
                  />
                  <div 
                    style={{width: `${(healthData.Critical / totalItems) * 100}%`}} 
                    onClick={() => setStatusFilter(statusFilter === 'Critical' ? 'All' : 'Critical')}
                    className={`bg-red-500 h-full border-r border-os-border transition-all hover:opacity-90 ${statusFilter === 'Critical' ? 'ring-2 ring-red-300 z-10' : ''}`} 
                    title={`Critical: ${healthData.Critical} SKUs (${((healthData.Critical / totalItems) * 100).toFixed(1)}%) - Click to filter`}
                  />
                  <div 
                    style={{width: `${(healthData.Excess / totalItems) * 100}%`}} 
                    onClick={() => setStatusFilter(statusFilter === 'Excess' ? 'All' : 'Excess')}
                    className={`bg-blue-500 h-full transition-all hover:opacity-90 ${statusFilter === 'Excess' ? 'ring-2 ring-blue-300 z-10' : ''}`} 
                    title={`Excess: ${healthData.Excess} SKUs (${((healthData.Excess / totalItems) * 100).toFixed(1)}%) - Click to filter`}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-os-surface-active"></div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] uppercase font-mono text-os-text-secondary tracking-wider">
              <button 
                onClick={() => setStatusFilter(statusFilter === 'Healthy' ? 'All' : 'Healthy')}
                className={`p-2 rounded border flex items-center justify-between transition-colors ${statusFilter === 'Healthy' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'}`}
              >
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Healthy</span>
                <span className="font-bold">{healthData.Healthy}</span>
              </button>
              <button 
                onClick={() => setStatusFilter(statusFilter === 'Low Stock' ? 'All' : 'Low Stock')}
                className={`p-2 rounded border flex items-center justify-between transition-colors ${statusFilter === 'Low Stock' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'}`}
              >
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Low</span>
                <span className="font-bold">{healthData.Low}</span>
              </button>
              <button 
                onClick={() => setStatusFilter(statusFilter === 'Critical' ? 'All' : 'Critical')}
                className={`p-2 rounded border flex items-center justify-between transition-colors ${statusFilter === 'Critical' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'}`}
              >
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
                <span className="font-bold">{healthData.Critical}</span>
              </button>
              <button 
                onClick={() => setStatusFilter(statusFilter === 'Excess' ? 'All' : 'Excess')}
                className={`p-2 rounded border flex items-center justify-between transition-colors ${statusFilter === 'Excess' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'}`}
              >
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Excess</span>
                <span className="font-bold">{healthData.Excess}</span>
              </button>
            </div>
          </div>

          {/* Warehouse Valuation Split */}
          <div className="mt-5 pt-4 border-t border-os-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-os-text-muted tracking-wider flex items-center gap-1.5">
                <Building2 size={12} /> Warehouse Capital Allocation
              </span>
              <span className="text-[10px] font-mono text-os-text-muted">Total: {totalValFormatted.compact}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {warehouseDistribution.slice(0, 5).map(wh => {
                const whPair = formatCurrencyPair(wh.value, currency);
                const pct = totalValue > 0 ? (wh.value / totalValue) * 100 : 0;
                return (
                  <div 
                    key={wh.id} 
                    onClick={() => setSelectedWarehouse(wh.id === selectedWarehouse ? 'All' : wh.id)}
                    className={`p-2 rounded border cursor-pointer transition-colors ${selectedWarehouse === wh.id ? 'border-os-border-inverse bg-os-surface-hover' : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'}`}
                    title={`${wh.name}: Exact ${whPair.exact} (${pct.toFixed(1)}%)`}
                  >
                    <div className="text-[10px] text-os-text-muted truncate">{wh.name}</div>
                    <div className="text-xs font-mono text-os-text-primary font-semibold">{whPair.compact}</div>
                    <div className="text-[9px] font-mono text-os-text-muted">{pct.toFixed(0)}% • {wh.count} SKUs</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Highest Risk SKU Card */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Top Risk Exposure</h3>
            </div>
            
            {criticalCount > 0 ? (() => {
              const topRisk = enrichedInventory.filter(i => i.status === 'Critical').sort((a,b) => b.value - a.value)[0];
              const riskVal = formatCurrencyPair(topRisk.value, currency);
              return (
                <div className="mt-2">
                  <div className="text-lg font-mono text-os-text-primary font-semibold">{topRisk.productId}</div>
                  <div className="text-xs text-os-text-secondary truncate mt-0.5">{topRisk.product?.name}</div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-os-surface-secondary p-2 rounded border border-os-border">
                      <div className="text-[10px] text-os-text-muted uppercase">Available</div>
                      <div className="text-os-text-primary font-semibold">{formatNumber(topRisk.available)} units</div>
                      <div className="text-[10px] text-os-text-muted">{formatNumber(topRisk.daysOfSupply, 1)} days supply</div>
                    </div>
                    <div className="bg-os-surface-secondary p-2 rounded border border-os-border">
                      <div className="text-[10px] text-os-text-muted uppercase">Exposure</div>
                      <div className="text-red-500 font-semibold" title={`Exact: ${riskVal.exact}`}>{riskVal.compact}</div>
                      <div className="text-[10px] text-os-text-muted truncate select-all" title={`Exact: ${riskVal.exact}`}>
                        {riskVal.exact}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-red-500/5 border border-red-500/20 rounded text-[11px] text-red-400">
                    Warehouse: {topRisk.warehouse?.name}
                  </div>
                  <button 
                    onClick={() => openEntity('inventory', topRisk.productId)}
                    className="mt-4 w-full py-2 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-md text-[10px] font-bold uppercase tracking-widest text-os-text-primary transition-colors cursor-pointer"
                  >
                    Investigate SKU Exposure
                  </button>
                </div>
              );
            })() : (
              <div className="flex-1 flex items-center justify-center text-xs text-os-text-muted italic py-10">
                No critical risks detected across active SKUs.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full shadow-sm">
        {/* Table Header Summary */}
        <div className="px-6 py-3 border-b border-os-border bg-os-surface-secondary flex justify-between items-center text-xs text-os-text-muted font-mono">
          <span>SHOWING {filteredInventory.length} OF {enrichedInventory.length} SKUS</span>
          <span>FILTER: {statusFilter.toUpperCase()} | WH: {selectedWarehouse.toUpperCase()}</span>
        </div>

        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {filteredInventory.slice(0, 50).map((item) => {
            const itemVal = formatCurrencyPair(item.value, currency);
            return (
              <MobileRecordCard
                key={item.id}
                onClick={() => openEntity('inventory', item.productId)}
                onContextMenu={(e) => openInventoryContextMenu(e, item)}
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
                  { label: 'Available', value: `${formatNumber(item.available)} units` },
                  { label: 'Days Supply', value: formatNumber(item.daysOfSupply, 1) },
                  { label: 'Value', value: itemVal.exact, valueClassName: 'font-mono' },
                  { label: 'Risk', value: item.risk, valueClassName: `font-mono ${item.risk === 'High' ? 'text-red-500' : item.risk === 'Medium' ? 'text-amber-500' : 'text-os-text-secondary'}` }
                ]}
              />
            );
          })}
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
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Holding Value</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {filteredInventory.slice(0, 50).map((item) => {
                const itemVal = formatCurrencyPair(item.value, currency);
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => openEntity('inventory', item.productId)}
                    onContextMenu={(e) => openInventoryContextMenu(e, item)}
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
                      <div title={`Exact: ${itemVal.exact}`} className="select-all">
                        {itemVal.exact}
                      </div>
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
                );
              })}
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
