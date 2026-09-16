const fs = require('fs');
const code = `import React, { useState, useMemo, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { Filter, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';

export const Suppliers = () => {
  const { suppliers, currency, settings } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'watchlist') {
      setStatusFilter('Watchlist');
    } else if (filterParam === 'high-risk') {
      setStatusFilter('High Risk');
    }
  }, [searchParams]);

  const enrichedSuppliers = useMemo(() => {
    return suppliers.map(sup => {
      const perf = AnalyticsEngine.evaluateSupplierPerformance(sup, settings);
      return {
        ...sup,
        score: perf.score,
        status: perf.status,
        riskLevel: perf.riskLevel
      };
    });
  }, [suppliers, settings]);

  const filteredSuppliers = useMemo(() => {
    return enrichedSuppliers.filter(item => {
      if (regionFilter !== 'All' && item.region !== regionFilter) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      
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

  // KPIs
  const totalSuppliers = enrichedSuppliers.length;
  const preferredCount = enrichedSuppliers.filter(s => s.status === 'Preferred').length;
  const watchlistCount = enrichedSuppliers.filter(s => s.status === 'Watchlist' || s.status === 'High Risk').length;
  
  const avgOtif = enrichedSuppliers.length > 0 ? enrichedSuppliers.reduce((sum, s) => sum + s.otif, 0) / enrichedSuppliers.length : 0;
  const avgQuality = enrichedSuppliers.length > 0 ? enrichedSuppliers.reduce((sum, s) => sum + s.qualityRate, 0) / enrichedSuppliers.length : 0;
  
  const atRiskSpend = enrichedSuppliers
    .filter(s => s.status === 'High Risk' || s.status === 'Watchlist')
    .reduce((sum, s) => sum + s.spend, 0);

  // Matrix counts
  const highRiskLowPerf = enrichedSuppliers.filter(s => s.riskLevel === 'High' && s.score < 70).length;
  const highRiskHighPerf = enrichedSuppliers.filter(s => s.riskLevel === 'High' && s.score >= 70).length;
  const lowRiskLowPerf = enrichedSuppliers.filter(s => s.riskLevel !== 'High' && s.score < 70).length;
  const lowRiskHighPerf = enrichedSuppliers.filter(s => s.riskLevel !== 'High' && s.score >= 70).length;

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-6 box-border">
      
      <PageHeader 
        title="Supplier Intelligence" 
        description="Monitor network performance, quality, OTIF rates, and at-risk spend exposure."
        actions={
          <div className="flex flex-wrap gap-2 w-full">
            <select 
              className="flex-1 sm:w-auto rounded-lg border border-os-border-strong bg-os-surface px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-os-border transition-colors"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="All">All Regions</option>
              <option value="APAC">APAC</option>
              <option value="EMEA">EMEA</option>
              <option value="AMER">AMER</option>
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
              <option value="Preferred">Preferred</option>
              <option value="Approved">Approved</option>
              <option value="Watchlist">Watchlist</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Suppliers" value={totalSuppliers} />
        <KPICard label="Preferred" value={preferredCount} status={preferredCount > 0 ? "healthy" : "neutral"} />
        <KPICard label="Watchlist & Risk" value={watchlistCount} status={watchlistCount > 0 ? "warning" : "neutral"} trend={watchlistCount > 0 ? "Needs attention" : "Stable"} trendUp={watchlistCount === 0} />
        <KPICard label="Avg OTIF" value={\`\${formatNumber(avgOtif, 1)}%\`} status={avgOtif < 90 ? "warning" : "healthy"} />
        <KPICard label="Avg Quality" value={\`\${formatNumber(avgQuality, 1)}%\`} status={avgQuality < 95 ? "warning" : "healthy"} />
        <KPICard label="At-Risk Spend" value={formatCurrency(atRiskSpend, currency)} status={atRiskSpend > 0 ? "critical" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Risk Landscape Matrix */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-os-text-secondary" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Supplier Risk Landscape</h3>
          </div>
          
          <div className="flex w-full h-[180px]">
            <div className="flex flex-col justify-between pr-4 py-8 text-[10px] text-os-text-muted uppercase font-mono tracking-widest items-end border-r border-os-border">
              <span>High Risk</span>
              <span>Low Risk</span>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex border-b border-os-border">
                <div className="flex-1 bg-red-500/10 border-r border-os-border flex items-center justify-center flex-col p-2">
                  <div className="text-2xl font-mono text-red-500 mb-1">{highRiskLowPerf}</div>
                  <div className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Critical</div>
                </div>
                <div className="flex-1 bg-amber-500/5 flex items-center justify-center flex-col p-2">
                  <div className="text-2xl font-mono text-amber-500 mb-1">{highRiskHighPerf}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Watch</div>
                </div>
              </div>
              <div className="flex-1 flex">
                <div className="flex-1 bg-amber-500/5 border-r border-os-border flex items-center justify-center flex-col p-2">
                  <div className="text-2xl font-mono text-amber-500 mb-1">{lowRiskLowPerf}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Watch</div>
                </div>
                <div className="flex-1 bg-emerald-500/5 flex items-center justify-center flex-col p-2">
                  <div className="text-2xl font-mono text-emerald-500 mb-1">{lowRiskHighPerf}</div>
                  <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Healthy</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-around mt-4 pl-16 text-[10px] text-os-text-muted uppercase font-mono tracking-widest">
            <span>Low Performance</span>
            <span>High Performance</span>
          </div>
        </div>

        {/* Top Supplier Signals */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Top Supplier Signal</h3>
          </div>
          
          {watchlistCount > 0 ? (() => {
            const topRisk = enrichedSuppliers.filter(i => i.status === 'High Risk' || i.status === 'Watchlist').sort((a,b) => b.spend - a.spend)[0];
            return (
              <div className="mt-2">
                <div className="text-lg font-mono text-os-text-primary">{topRisk.id}</div>
                <div className="text-xs text-os-text-secondary truncate">{topRisk.name}</div>
                
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <div className="text-[10px] uppercase text-red-500 font-bold mb-1 tracking-wider">{topRisk.status}</div>
                  <div className="text-xs text-os-text-primary">At-risk spend: <span className="font-mono">{formatCurrency(topRisk.spend, currency)}</span></div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-os-text-muted uppercase">OTIF</div>
                    <div className={topRisk.otif < 90 ? "text-red-500" : "text-os-text-primary"}>{topRisk.otif}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-os-text-muted uppercase">Qual</div>
                    <div className={topRisk.qualityRate < 95 ? "text-red-500" : "text-os-text-primary"}>{topRisk.qualityRate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-os-text-muted uppercase">Score</div>
                    <div className={topRisk.score < 70 ? "text-red-500" : "text-os-text-primary"}>{topRisk.score}</div>
                  </div>
                </div>

                <button 
                  onClick={() => openEntity('supplier', topRisk.id)}
                  className="mt-6 w-full py-1.5 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-md text-[10px] font-bold uppercase tracking-widest text-os-text-primary transition-colors"
                >
                  View Supplier
                </button>
              </div>
            );
          })() : (
            <div className="flex-1 flex items-center justify-center text-xs text-os-text-muted italic">
              No watchlist suppliers detected.
            </div>
          )}
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full shadow-sm">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {filteredSuppliers.map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('supplier', item.id)}
              title={item.id}
              subtitle={item.name}
              statusNode={
                <StatusBadge 
                  status={item.status} 
                  type={item.status === 'Preferred' ? 'healthy' : item.status === 'High Risk' ? 'critical' : item.status === 'Watchlist' ? 'warning' : 'neutral'} 
                />
              }
              fields={[
                { label: 'Category', value: item.category, valueClassName: 'text-os-text-secondary' },
                { label: 'Score', value: formatNumber(item.score) },
                { label: 'OTIF %', value: \`\${formatNumber(item.otif)}%\` },
                { label: 'Quality %', value: \`\${formatNumber(item.qualityRate)}%\` },
                { label: 'Spend', value: formatCurrency(item.spend, currency) },
                { label: 'Risk', value: item.riskLevel, valueClassName: \`font-mono \${item.riskLevel === 'High' ? 'text-red-500' : item.riskLevel === 'Medium' ? 'text-amber-500' : 'text-os-text-secondary'}\` }
              ]}
            />
          ))}
          {filteredSuppliers.length === 0 && (
            <div className="p-8 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching suppliers found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-os-text-secondary">
            <thead className="bg-os-surface-secondary text-[10px] uppercase font-mono text-os-text-secondary border-b border-os-border">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Supplier</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Category</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Region</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">OTIF %</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Quality %</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Score</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Spend</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {filteredSuppliers.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('supplier', item.id)}
                  className="hover:bg-os-surface-hover cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-os-text-primary">{item.name}</div>
                    <div className="text-[10px] text-os-text-muted font-mono mt-0.5">{item.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-os-text-secondary">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-os-text-secondary">
                    {item.region}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatNumber(item.otif)}%
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatNumber(item.qualityRate)}%
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatNumber(item.score)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-os-text-primary">
                    {formatCurrency(item.spend, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge 
                      status={item.status} 
                      type={item.status === 'Preferred' ? 'healthy' : item.status === 'High Risk' ? 'critical' : item.status === 'Watchlist' ? 'warning' : 'neutral'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && (
            <div className="p-12 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching suppliers found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/Suppliers.tsx', code);
