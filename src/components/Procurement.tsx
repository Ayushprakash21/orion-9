import React, { useMemo, useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { safeFormatDate } from '../lib/utils';
import { format } from 'date-fns';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { MobileRecordCard } from './MobileRecordCard';

export const Procurement = () => {
  const { purchaseOrders, suppliers, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'overdue') {
      setStatusFilter('Delayed'); // Maps to overdue logic generally
    } else if (filterParam === 'open') {
      // In a real app we might have a specific Open state, here we just show all non-completed
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

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-4 sm:space-y-6 box-border">
      <div className="flex flex-col gap-4 pb-4 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Procurement Logs</h2>
            <p className="text-xs text-[#777777] mt-1 hidden sm:block">Manage purchase orders and monitor delivery schedules.</p>
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSearchParams({}); // Clear overrides
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
      </div>

      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden w-full">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
          {filteredPOs.slice(0, 50).map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('po', item.id)}
              title={item.id}
              subtitle={item.supplierName}
              statusNode={
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                  item.status === 'Received' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                  item.status === 'Delayed' || item.status === 'Overdue' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                  item.status === 'Partially Received' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                  'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                }`}>
                  {item.status}
                </span>
              }
              fields={[
                { label: 'Expected', value: safeFormatDate(item.expectedDelivery) },
                { label: 'Value', value: formatCurrency(item.totalValue, currency) },
                { label: 'Lines', value: item.lines.length }
              ]}
            />
          ))}
          {filteredPOs.length === 0 && (
            <div className="p-8 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching purchase orders found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-[#B3B3B3]">
            <thead className="bg-[#111111] text-[10px] uppercase font-mono text-[#777777] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-3.5 font-medium">PO Number</th>
                <th className="px-6 py-3.5 font-medium">Supplier</th>
                <th className="px-6 py-3.5 font-medium">Order Date</th>
                <th className="px-6 py-3.5 font-medium">Expected</th>
                <th className="px-6 py-3.5 font-medium text-right">Value</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium text-right">Lines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredPOs.slice(0, 50).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('po', item.id)}
                  className="hover:bg-[#202020] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="font-mono text-[#F5F5F5] font-medium">{item.id}</div>
                    <div className="text-[10px] text-[#777777] uppercase">Buyer: {item.buyer}</div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-medium text-[#B3B3B3]">
                    {item.supplierName}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-mono text-[#B3B3B3]">
                    {safeFormatDate(item.orderDate)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-mono text-[#B3B3B3]">
                    {safeFormatDate(item.expectedDelivery)}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatCurrency(item.totalValue, currency)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                      item.status === 'Received' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                      item.status === 'Delayed' || item.status === 'Overdue' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                      item.status === 'Partially Received' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#B3B3B3]">
                    {item.lines.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPOs.length === 0 && (
            <div className="p-12 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching purchase orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
