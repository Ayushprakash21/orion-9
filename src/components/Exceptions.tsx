import React, { useMemo, useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { Search, Filter, AlertCircle, ShieldAlert } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { MobileRecordCard } from './MobileRecordCard';

export const Exceptions = () => {
  const { exceptions, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'open') {
      setStatusFilter('Open');
    } else if (filterParam === 'stockout') {
      // Need a way to filter stockout logic
    }
  }, [searchParams]);

  const filteredExceptions = useMemo(() => {
    return exceptions.filter(item => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (severityFilter !== 'All' && item.severity !== severityFilter) return false;
      
      if (searchParams.get('filter') === 'stockout') {
        if (!item.type.toLowerCase().includes('stock') && !item.description.toLowerCase().includes('stock')) return false;
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.entityId.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [exceptions, statusFilter, severityFilter, searchQuery, searchParams]);

  // Sort by severity (Critical first) and then by impact
  const sortedExceptions = [...filteredExceptions].sort((a, b) => {
    const sevScore = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    if (sevScore[a.severity] !== sevScore[b.severity]) {
      return sevScore[b.severity] - sevScore[a.severity];
    }
    return b.estimatedImpact - a.estimatedImpact;
  });

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-4 sm:space-y-6 box-border">
      <div className="flex flex-col gap-4 pb-4 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">System Exceptions</h2>
            <p className="text-xs text-[#777777] mt-1 hidden sm:block">Track, prioritize, and resolve supply chain disruptions.</p>
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
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select 
            className="w-full sm:w-auto rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Action Required">Action Required</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden w-full">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
          {sortedExceptions.map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('exception', item.id)}
              title={item.id}
              subtitle={
                <div>
                  <div className="uppercase tracking-wider text-[#F5F5F5] mb-0.5">{item.type}</div>
                  <div className="line-clamp-2">{item.description}</div>
                </div>
              }
              statusNode={
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                  item.severity === 'Critical' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                  item.severity === 'High' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                  item.severity === 'Medium' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                  'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                }`}>
                  {item.severity === 'Critical' && <ShieldAlert size={10} />}
                  {item.severity}
                </span>
              }
              fields={[
                { label: 'Entity', value: item.entityId },
                { label: 'Status', value: item.status, valueClassName: 'text-[#B3B3B3]' },
                { label: 'Impact', value: formatCurrency(item.estimatedImpact, currency) }
              ]}
            />
          ))}
          {sortedExceptions.length === 0 && (
            <div className="p-8 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching exceptions found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-[#B3B3B3]">
            <thead className="bg-[#111111] text-[10px] uppercase font-mono text-[#777777] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-3.5 font-medium">Exception / Entity</th>
                <th className="px-6 py-3.5 font-medium">Type</th>
                <th className="px-6 py-3.5 font-medium">Severity</th>
                <th className="px-6 py-3.5 font-medium">Description</th>
                <th className="px-6 py-3.5 font-medium text-right">Impact</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {sortedExceptions.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('exception', item.id)}
                  className="hover:bg-[#202020] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-[#F5F5F5]">{item.id}</div>
                    <div className="text-[10px] text-[#777777] font-mono uppercase">{item.entityId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs uppercase text-[#F5F5F5]">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono font-medium border ${
                      item.severity === 'Critical' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                      item.severity === 'High' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      item.severity === 'Medium' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                    }`}>
                      {item.severity === 'Critical' && <ShieldAlert size={12} />}
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-[#B3B3B3] line-clamp-2 max-w-xs" title={item.description}>
                      {item.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap text-[#F5F5F5] font-mono">
                    {formatCurrency(item.estimatedImpact, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-medium border ${
                      item.status === 'Open' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                      item.status === 'Investigating' ? 'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]' :
                      item.status === 'Action Required' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-[#777777] uppercase">
                    {item.owner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedExceptions.length === 0 && (
            <div className="p-8 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching records
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
