import React, { useMemo, useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { Search, Filter, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { MobileRecordCard } from './MobileRecordCard';

export const Suppliers = () => {
  const { suppliers, currency, settings } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'risk') {
      setStatusFilter('High Risk');
    }
  }, [searchParams]);

  const enrichedSuppliers = useMemo(() => {
    return suppliers.map(sup => {
      const score = AnalyticsEngine.calculateSupplierScore(sup, settings);
      const status = AnalyticsEngine.determineSupplierStatus(score);
      const riskScore = status === 'High Risk' ? 'High' : (status === 'Watchlist' ? 'Medium' : 'Low');
      
      return {
        ...sup,
        score,
        status,
        riskScore
      };
    });
  }, [suppliers, settings]);

  const filteredSuppliers = useMemo(() => {
    return enrichedSuppliers.filter(item => {
      if (regionFilter !== 'All' && item.region !== regionFilter) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      
      if (searchParams.get('filter') === 'risk' && item.status !== 'High Risk' && item.status !== 'Watchlist') return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedSuppliers, regionFilter, statusFilter, searchQuery, searchParams]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 pb-4 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Supplier Network</h2>
            <p className="text-xs text-[#777777] mt-1 hidden sm:block">Monitor supplier performance scores, OTIF rates, quality, and risk levels.</p>
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
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="All">All Regions</option>
            <option value="APAC">APAC</option>
            <option value="EMEA">EMEA</option>
            <option value="AMER">AMER</option>
          </select>
          <select 
            className="w-full sm:w-auto rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSearchParams({}); // Clear query overrides
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Preferred">Preferred</option>
            <option value="Approved">Approved</option>
            <option value="Watchlist">Watchlist</option>
            <option value="High Risk">High Risk</option>
          </select>
        </div>
      </div>

      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden w-full">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
          {filteredSuppliers.map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('supplier', item.id)}
              title={item.id}
              subtitle={item.name}
              statusNode={
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                  item.status === 'Preferred' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                  item.status === 'High Risk' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                  item.status === 'Watchlist' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                  'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                }`}>
                  {item.status}
                </span>
              }
              fields={[
                { label: 'Category', value: item.category, valueClassName: 'text-[#B3B3B3]' },
                { label: 'Score', value: formatNumber(item.score) },
                { label: 'OTIF %', value: `${formatNumber(item.otif)}%` },
                { label: 'Quality %', value: `${formatNumber(item.qualityRate)}%` },
                { label: 'Spend', value: formatCurrency(item.spend, currency) },
                { label: 'Risk', value: item.riskScore, valueClassName: `font-mono ${item.riskScore === 'High' ? 'text-[#FF453A]' : item.riskScore === 'Medium' ? 'text-[#FF9F0A]' : 'text-[#B3B3B3]'}` }
              ]}
            />
          ))}
          {filteredSuppliers.length === 0 && (
            <div className="p-8 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching suppliers found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-[#B3B3B3]">
            <thead className="bg-[#111111] text-[10px] uppercase font-mono text-[#777777] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-3.5 font-medium">Supplier</th>
                <th className="px-6 py-3.5 font-medium">Category</th>
                <th className="px-6 py-3.5 font-medium">Region</th>
                <th className="px-6 py-3.5 font-medium text-right">OTIF %</th>
                <th className="px-6 py-3.5 font-medium text-right">Quality %</th>
                <th className="px-6 py-3.5 font-medium text-right">Score</th>
                <th className="px-6 py-3.5 font-medium text-right">Spend</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredSuppliers.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('supplier', item.id)}
                  className="hover:bg-[#202020] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="font-medium text-[#F5F5F5]">{item.name}</div>
                    <div className="text-[10px] text-[#777777] font-mono">{item.id}</div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-[#B3B3B3]">
                    {item.category}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-mono text-[#B3B3B3]">
                    {item.region}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatNumber(item.otif)}%
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatNumber(item.qualityRate)}%
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatNumber(item.score)}
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap font-mono text-[#F5F5F5]">
                    {formatCurrency(item.spend, currency)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border ${
                      item.status === 'Preferred' ? 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]' :
                      item.status === 'High Risk' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :
                      item.status === 'Watchlist' ? 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && (
            <div className="p-12 text-center text-[#777777] font-mono text-xs uppercase tracking-wider">
              No matching suppliers found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
