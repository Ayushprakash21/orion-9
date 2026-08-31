import React, { useState, useMemo, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { MobileRecordCard } from './MobileRecordCard';

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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 pb-4 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Inventory Management</h2>
            <p className="text-xs text-[#777777] mt-1 hidden sm:block">Monitor stock levels, valuation, and days of supply across warehouses.</p>
          </div>
          <div className="sm:hidden">
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] border border-[#2A2A2A] rounded-md text-[10px] font-mono uppercase text-[#F5F5F5]"
            >
              <Filter size={12} />
              Filters
            </button>
          </div>
        </div>
        
        <div className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${showMobileFilters ? 'flex' : 'hidden sm:flex'}`}>
          <select 
            className="w-full sm:w-auto rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="All">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select 
            className="w-full sm:w-auto rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSearchParams({}); // Clear query params on manual override
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Critical">Critical</option>
            <option value="Excess">Excess</option>
          </select>
        </div>
      </div>

      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden w-full">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
          {filteredInventory.slice(0, 50).map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('inventory', item.productId)}
              title={item.productId}
              subtitle={item.product?.name}
              statusNode={
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                  item.status === 'Healthy' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                  item.status === 'Critical' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                  item.status === 'Low Stock' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                  'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                }`}>
                  {item.status}
                </span>
              }
              fields={[
                { label: 'Warehouse', value: item.warehouse?.name },
                { label: 'Available', value: formatNumber(item.available) },
                { label: 'Days Supply', value: formatNumber(item.daysOfSupply) },
                { label: 'Value', value: formatCurrency(item.value, currency) },
                { label: 'Risk', value: item.risk, valueClassName: `font-mono ${item.risk === 'High' ? 'text-[#FF453A]' : item.risk === 'Medium' ? 'text-[#FF9F0A]' : 'text-[#B3B3B3]'}` }
              ]}
            />
          ))}
          {filteredInventory.length === 0 && (
            <div className="p-8 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching inventory records found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-[#B3B3B3]">
            <thead className="bg-[#111111] text-[10px] uppercase font-mono text-[#777777] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-3.5 font-medium">SKU / Product</th>
                <th className="px-6 py-3.5 font-medium">Warehouse</th>
                <th className="px-6 py-3.5 font-medium text-right">Available</th>
                <th className="px-6 py-3.5 font-medium text-right">Days Supply</th>
                <th className="px-6 py-3.5 font-medium text-right">Value</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredInventory.slice(0, 50).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('inventory', item.productId)}
                  className="hover:bg-[#202020] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="font-mono text-[#F5F5F5] font-medium">{item.productId}</div>
                    <div className="text-[10px] text-[#777777] truncate max-w-[200px]">{item.product?.name}</div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-medium text-[#B3B3B3]">
                    {item.warehouse?.name}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatNumber(item.available)}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatNumber(item.daysOfSupply)}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatCurrency(item.value, currency)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                      item.status === 'Healthy' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                      item.status === 'Critical' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                      item.status === 'Low Stock' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                      item.risk === 'High' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                      item.risk === 'Medium' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                    }`}>
                      {item.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <div className="p-12 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching inventory records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
