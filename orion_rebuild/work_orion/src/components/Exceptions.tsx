import React, { useMemo, useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { useEntityContextMenu } from '../os/contextMenu/useEntityContextMenu';
import { formatCurrency, formatCurrencyPair } from '../lib/formatters';
import { useSearchParams } from 'react-router-dom';
import { useOrionSearch } from '../os/OrionSearchContext';
import { Filter, AlertTriangle, ShieldAlert, Zap, Activity } from 'lucide-react';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';

export const Exceptions = () => {
  const { exceptions, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { openExceptionContextMenu } = useEntityContextMenu();
  const { searchQuery } = useOrionSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'open') {
      setStatusFilter('Open');
    }
  }, [searchParams]);

  const filteredExceptions = useMemo(() => {
    return exceptions.filter(item => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (severityFilter !== 'All' && item.severity !== severityFilter) return false;
      
      if (searchParams.get('filter') === 'stockout') {
        if (!item.type?.toLowerCase().includes('stock') && !item.description?.toLowerCase().includes('stock')) return false;
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          Boolean(item.id?.toLowerCase().includes(q)) ||
          Boolean(item.entityId?.toLowerCase().includes(q)) ||
          Boolean(item.type?.toLowerCase().includes(q)) ||
          Boolean(item.description?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [exceptions, statusFilter, severityFilter, searchQuery, searchParams]);

  // Sort by severity (Critical first) and then by impact
  const sortedExceptions = useMemo(() => {
    return [...filteredExceptions].sort((a, b) => {
      const sevScore: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const aScore = sevScore[a.severity] || 0;
      const bScore = sevScore[b.severity] || 0;
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      return (b.estimatedImpact || 0) - (a.estimatedImpact || 0);
    });
  }, [filteredExceptions]);

  // KPIs
  const activeExceptions = exceptions.filter(e => !['Resolved', 'Dismissed'].includes(e.status));
  const criticalCount = activeExceptions.filter(e => e.severity === 'Critical').length;
  const highCount = activeExceptions.filter(e => e.severity === 'High').length;
  const openCount = activeExceptions.filter(e => e.status === 'Open').length;
  const totalImpact = activeExceptions.reduce((sum, e) => sum + (e.estimatedImpact || 0), 0);
  const totalImpactFormatted = formatCurrencyPair(totalImpact, currency);

  // Matrix counts
  const getMatrixCount = (severity, status) => {
    return activeExceptions.filter(e => e.severity === severity && e.status === status).length;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      
      <PageHeader 
        title="Exception Control Center" 
        description="Track, prioritize, and resolve supply chain disruptions and risk signals."
        actions={
          <div className="flex flex-wrap gap-2 w-full">
            <select 
              className="flex-1 sm:w-auto rounded-lg border border-os-border-strong bg-os-surface px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-os-border transition-colors"
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
              className="flex-1 sm:w-auto rounded-lg border border-os-border-strong bg-os-surface px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-os-border transition-colors"
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
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Critical" value={criticalCount} status={criticalCount > 0 ? "critical" : "neutral"} trend={criticalCount > 0 ? "Immediate Action" : "Clear"} trendUp={criticalCount === 0} />
        <KPICard label="High" value={highCount} status={highCount > 0 ? "warning" : "neutral"} />
        <KPICard label="Total Open" value={openCount} />
        <KPICard 
          label="Total Impact" 
          value={totalImpactFormatted.compact} 
          exactValue={totalImpactFormatted.exact}
          subLabel="Total Estimated"
          status={totalImpact > 0 ? "critical" : "neutral"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Top Attention (Single highest impact critical exception) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-os-surface border border-red-500/30 rounded-xl p-5 shadow-sm flex flex-col justify-between min-w-0 h-full">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={16} className="text-red-500" />
              <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest text-red-500">Management Attention</h3>
            </div>
            
            {criticalCount > 0 || highCount > 0 ? (() => {
              const topExc = activeExceptions.sort((a,b) => {
                const sevScore = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                if (sevScore[a.severity] !== sevScore[b.severity]) return sevScore[b.severity] - sevScore[a.severity];
                return b.estimatedImpact - a.estimatedImpact;
              })[0];
              
              return (
                <div className="mt-2 flex flex-col">
                  <div className="text-lg font-mono text-os-text-primary">{topExc.type}</div>
                  <div className="text-xs text-os-text-secondary mt-1">{topExc.description}</div>
                  
                  <div className="mt-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                    <div className="text-[10px] uppercase font-bold text-red-500 tracking-wider">{topExc.severity} SEVERITY</div>
                    {(() => {
                      const impactPair = formatCurrencyPair(topExc.estimatedImpact, currency);
                      return (
                        <>
                          <div className="text-xl font-mono text-os-text-primary mt-1" title={`Exact: ${impactPair.exact}`}>
                            {impactPair.compact}
                          </div>
                          <div className="text-[10px] font-mono text-os-text-muted mt-0.5 select-all">
                            Exact: {impactPair.exact}
                          </div>
                        </>
                      );
                    })()}
                    <div className="text-[10px] text-os-text-muted mt-1 uppercase tracking-widest">Est. Financial Impact</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-os-text-muted uppercase tracking-widest mb-2">Affected Entity</div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-os-surface-secondary border border-os-border rounded text-[10px] font-mono text-os-text-primary">{topExc.entityId}</span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="flex items-center justify-center text-xs text-os-text-muted italic py-10">
                No critical exceptions detected.
              </div>
            )}
          </div>

          {criticalCount > 0 || highCount > 0 ? (() => {
            const topExc = activeExceptions.sort((a,b) => {
              const sevScore = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
              if (sevScore[a.severity] !== sevScore[b.severity]) return sevScore[b.severity] - sevScore[a.severity];
              return b.estimatedImpact - a.estimatedImpact;
            })[0];
            return (
              <div className="pt-2">
                <button 
                  onClick={() => openEntity('exception', topExc.id)}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md text-[10px] font-bold uppercase tracking-widest text-red-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={12} />
                  Resolve Exception
                </button>
              </div>
            );
          })() : null}
        </div>

        {/* Risk Matrix */}
        <div className="lg:col-span-7 xl:col-span-8 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between min-w-0 h-full">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-os-text-secondary" />
            <h3 className="text-sm font-medium text-os-text-primary uppercase tracking-widest">Exception Landscape</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-4 gap-2 mb-2 text-center text-[10px] text-os-text-muted uppercase font-mono tracking-widest">
              <div></div>
              <div>Open</div>
              <div>Investigating</div>
              <div>Action Req.</div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-2 h-20">
              <div className="flex items-center justify-end pr-4 text-[10px] text-red-500 uppercase font-bold tracking-widest">Critical</div>
              <div className="bg-red-500/10 border border-red-500/20 rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-red-500">{getMatrixCount('Critical', 'Open')}</span>
              </div>
              <div className="bg-red-500/5 border border-red-500/10 rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-red-500/70">{getMatrixCount('Critical', 'Investigating')}</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-red-500">{getMatrixCount('Critical', 'Action Required')}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2 h-20">
              <div className="flex items-center justify-end pr-4 text-[10px] text-amber-500 uppercase font-bold tracking-widest">High</div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-amber-500">{getMatrixCount('High', 'Open')}</span>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-amber-500/70">{getMatrixCount('High', 'Investigating')}</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-amber-500">{getMatrixCount('High', 'Action Required')}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 h-20">
              <div className="flex items-center justify-end pr-4 text-[10px] text-os-text-secondary uppercase font-bold tracking-widest">Med/Low</div>
              <div className="bg-os-surface-secondary border border-os-border rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-os-text-primary">{getMatrixCount('Medium', 'Open') + getMatrixCount('Low', 'Open')}</span>
              </div>
              <div className="bg-os-surface-secondary border border-os-border rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-os-text-primary">{getMatrixCount('Medium', 'Investigating') + getMatrixCount('Low', 'Investigating')}</span>
              </div>
              <div className="bg-os-surface-secondary border border-os-border rounded flex flex-col items-center justify-center">
                <span className="text-xl font-mono text-os-text-primary">{getMatrixCount('Medium', 'Action Required') + getMatrixCount('Low', 'Action Required')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full shadow-sm">
        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {sortedExceptions.map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('exception', item.id)}
              onContextMenu={(e) => openExceptionContextMenu(e, item)}
              title={item.id}
              subtitle={
                <div>
                  <div className="uppercase tracking-wider text-os-text-primary mb-0.5">{item.type}</div>
                  <div className="line-clamp-2">{item.description}</div>
                </div>
              }
              statusNode={
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge 
                    status={item.severity} 
                    type={item.severity === 'Critical' ? 'critical' : item.severity === 'High' ? 'warning' : 'neutral'} 
                  />
                  <span className="text-[10px] uppercase font-mono text-os-text-secondary">{item.status}</span>
                </div>
              }
              fields={[
                { label: 'Entity', value: item.entityId, valueClassName: 'font-mono' },
                { label: 'Impact', value: formatCurrency(item.estimatedImpact, currency), valueClassName: 'font-mono text-red-500' }
              ]}
            />
          ))}
          {sortedExceptions.length === 0 && (
            <div className="p-8 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching exceptions found
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-os-text-secondary">
            <thead className="bg-os-surface-secondary text-[10px] uppercase font-mono text-os-text-secondary border-b border-os-border">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Exception ID</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Type / Description</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Entity</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Severity</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Est. Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {sortedExceptions.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('exception', item.id)}
                  onContextMenu={(e) => openExceptionContextMenu(e, item)}
                  className="hover:bg-os-surface-hover cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-os-text-primary">
                    {item.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-os-text-primary">{item.type}</div>
                    <div className="text-[10px] text-os-text-muted line-clamp-1 mt-0.5 max-w-md">{item.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    <span className="px-1.5 py-0.5 bg-os-surface-secondary border border-os-border rounded">{item.entityId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge 
                      status={item.severity} 
                      type={item.severity === 'Critical' ? 'critical' : item.severity === 'High' ? 'warning' : 'neutral'} 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap uppercase text-[10px] font-bold tracking-wider">
                    {item.status}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                    {(() => {
                      const imp = formatCurrencyPair(item.estimatedImpact, currency);
                      return (
                        <div>
                          <div className="text-red-500 font-semibold" title={`Exact: ${imp.exact}`}>
                            {imp.compact}
                          </div>
                          <div className="text-[9px] text-os-text-muted select-all truncate max-w-[100px] ml-auto">
                            {imp.exact}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedExceptions.length === 0 && (
            <div className="p-12 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching exceptions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
