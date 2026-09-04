import React, { useMemo, useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency } from '../lib/formatters';
import { safeFormatDate } from '../lib/utils';
import { format } from 'date-fns';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Truck, Filter } from 'lucide-react';
import { MobileRecordCard } from './MobileRecordCard';

export const Shipments = () => {
  const { shipments, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'delayed') {
      setStatusFilter('Delayed');
    }
  }, [searchParams]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(item => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      
      if (searchParams.get('filter') === 'delayed' && item.delayDays === 0) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.poId.toLowerCase().includes(q) ||
          item.carrier.toLowerCase().includes(q) ||
          item.origin.toLowerCase().includes(q) ||
          item.destination.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shipments, statusFilter, searchQuery, searchParams]);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-4 sm:space-y-6 box-border">
      <div className="flex flex-col gap-4 pb-4 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Shipments & Logistics</h2>
            <p className="text-xs text-[#777777] mt-1 hidden sm:block">Track shipments, delays, and freight costs.</p>
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
              setSearchParams({}); // Clear query overrides
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="Picked Up">Picked Up</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>
      </div>

      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden w-full">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
          {filteredShipments.slice(0, 50).map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('shipment', item.id)}
              title={item.id}
              subtitle={`PO: ${item.poId}`}
              statusNode={
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-medium border ${
                  item.status === 'Delivered' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                  item.status === 'Delayed' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                  item.status === 'In Transit' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                  'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                }`}>
                  {item.status}
                </span>
              }
              fields={[
                { label: 'Expected', value: safeFormatDate(item.expectedArrival) },
                { label: 'Carrier', value: item.carrier, valueClassName: 'text-[#B3B3B3]' },
                { label: 'Delay', value: item.delayDays > 0 ? `+${item.delayDays}d` : 'On Time', valueClassName: `font-mono font-medium ${item.delayDays > 0 ? "text-[#FF453A]" : "text-[#30D158]"}` },
                { label: 'Cost', value: formatCurrency(item.freightCost, currency) }
              ]}
            />
          ))}
          {filteredShipments.length === 0 && (
            <div className="p-8 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching records found.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-[#B3B3B3]">
            <thead className="bg-[#111111] text-[10px] uppercase font-mono text-[#777777] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-3.5 font-medium">Shipment ID</th>
                <th className="px-6 py-3.5 font-medium">Route</th>
                <th className="px-6 py-3.5 font-medium">Carrier</th>
                <th className="px-6 py-3.5 font-medium">Expected</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium text-right">Delay</th>
                <th className="px-6 py-3.5 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredShipments.slice(0, 50).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('shipment', item.id)}
                  className="hover:bg-[#202020] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono font-medium text-[#F5F5F5]">{item.id}</div>
                    <div className="text-xs text-[#777777] font-mono">PO: {item.poId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#F5F5F5]">{item.origin}</span>
                      <span className="text-[10px] text-[#777777] flex items-center gap-1 uppercase">
                        <Truck size={10} className="text-[#B3B3B3]" /> {item.destination}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.carrier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[#B3B3B3]">
                    {safeFormatDate(item.expectedArrival)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-medium border ${
                      item.status === 'Delivered' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                      item.status === 'Delayed' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                      item.status === 'In Transit' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                    <span className={item.delayDays > 0 ? "text-[#FF453A] font-medium" : "text-[#30D158] font-medium"}>
                      {item.delayDays > 0 ? `+${item.delayDays}d` : 'On Time'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap text-[#F5F5F5] font-mono font-medium">
                    {formatCurrency(item.freightCost, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredShipments.length === 0 && (
            <div className="p-8 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
