import React, { useMemo, useState, useEffect } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell, Legend 
} from 'recharts';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { useEntityContextMenu } from '../os/contextMenu/useEntityContextMenu';
import { formatCurrency, formatCurrencyCompact, formatCurrencyPair, formatNumber } from '../lib/formatters';
import { safeFormatDate } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import { useOrionSearch } from '../os/OrionSearchContext';
import { 
  Filter, AlertTriangle, Clock, ArrowRight, ArrowRightCircle, 
  DollarSign, TrendingUp, TrendingDown, Layers, Building2, Search, RefreshCw,
  Calendar, CheckCircle2, ChevronRight
} from 'lucide-react';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';
import { subDays, format } from 'date-fns';

export const Procurement: React.FC = () => {
  const { purchaseOrders, suppliers, currency, timezone } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { openPurchaseOrderContextMenu } = useEntityContextMenu();
  const { searchQuery } = useOrionSearch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('All');
  const [trendMetric, setTrendMetric] = useState<'value' | 'count'>('value');

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'overdue') {
      setStatusFilter('Delayed');
    }
  }, [searchParams]);

  const enrichedPOs = useMemo(() => {
    return purchaseOrders.map(po => {
      const supplier = suppliers.find(s => s.id === po.supplierId);
      const valPair = formatCurrencyPair(po.totalValue, currency);
      return {
        ...po,
        supplierName: supplier?.name || 'Authorized Supplier',
        valPair
      };
    });
  }, [purchaseOrders, suppliers, currency]);

  const filteredPOs = useMemo(() => {
    return enrichedPOs.filter(item => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (selectedSupplierId !== 'All' && item.supplierId !== selectedSupplierId) return false;
      
      if (searchParams.get('filter') === 'open') {
        if (['Received', 'Cancelled', 'Closed'].includes(item.status)) return false;
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          Boolean(item.id?.toLowerCase().includes(q)) ||
          Boolean(item.supplierName?.toLowerCase().includes(q)) ||
          Boolean(item.buyer?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [enrichedPOs, statusFilter, selectedSupplierId, searchQuery, searchParams]);

  // Aggregate Financial Calculations
  const totalValue = useMemo(() => {
    return enrichedPOs.reduce((sum, po) => sum + po.totalValue, 0);
  }, [enrichedPOs]);
  const totalValueFormatted = formatCurrencyPair(totalValue, currency);

  const openPOs = useMemo(() => {
    return enrichedPOs.filter(po => !['Received', 'Cancelled', 'Closed'].includes(po.status));
  }, [enrichedPOs]);
  const openValue = openPOs.reduce((sum, po) => sum + po.totalValue, 0);
  const openValueFormatted = formatCurrencyPair(openValue, currency);

  const delayedPOs = useMemo(() => {
    return enrichedPOs.filter(po => po.status === 'Delayed' || po.status === 'Overdue');
  }, [enrichedPOs]);
  const atRiskValue = delayedPOs.reduce((sum, po) => sum + po.totalValue, 0);
  const atRiskValueFormatted = formatCurrencyPair(atRiskValue, currency);

  const partialCount = enrichedPOs.filter(po => po.status === 'Partially Received').length;
  const onTimePercent = enrichedPOs.length > 0 
    ? (enrichedPOs.filter(po => po.status === 'Received').length / Math.max(1, enrichedPOs.filter(po => po.status === 'Received' || po.status === 'Delayed' || po.status === 'Overdue').length)) * 100 
    : 100;

  // Breakdown by PO Status
  const statusBreakdown = useMemo(() => {
    const statuses = ['Approved', 'In Transit', 'Partially Received', 'Received', 'Delayed', 'Draft'];
    const colors: Record<string, string> = {
      'Approved': '#0A84FF',
      'In Transit': '#64D2FF',
      'Partially Received': '#BF5AF2',
      'Received': '#30D158',
      'Delayed': '#FF453A',
      'Draft': '#98989D'
    };

    return statuses.map(st => {
      const matching = enrichedPOs.filter(p => p.status === st);
      const val = matching.reduce((sum, p) => sum + p.totalValue, 0);
      const count = matching.length;
      const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
      return {
        status: st,
        value: val,
        valFormatted: formatCurrencyPair(val, currency),
        count,
        pct,
        color: colors[st] || '#98989D'
      };
    }).sort((a, b) => b.value - a.value);
  }, [enrichedPOs, totalValue, currency]);

  // Top Supplier PO Exposures
  const topSupplierExposures = useMemo(() => {
    const map = new Map<string, { id: string; name: string; totalValue: number; openCount: number; delayedCount: number }>();
    
    enrichedPOs.forEach(po => {
      const existing = map.get(po.supplierId) || {
        id: po.supplierId,
        name: po.supplierName,
        totalValue: 0,
        openCount: 0,
        delayedCount: 0
      };
      existing.totalValue += po.totalValue;
      if (!['Received', 'Cancelled', 'Closed'].includes(po.status)) {
        existing.openCount += 1;
      }
      if (po.status === 'Delayed' || po.status === 'Overdue') {
        existing.delayedCount += 1;
      }
      map.set(po.supplierId, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map(s => ({
        ...s,
        valFormatted: formatCurrencyPair(s.totalValue, currency)
      }));
  }, [enrichedPOs, currency]);

  // Trend Graph Data (30-Day Historical Projection based on order dates)
  const trendData = useMemo(() => {
    const days = 14;
    const list = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'MMM dd');
      const isoPrefix = format(date, 'yyyy-MM-dd');

      // Aggregate POs created or expected on or prior to this slice
      const posUpToDay = enrichedPOs.filter(p => p.orderDate <= isoPrefix);
      const totalDayVal = posUpToDay.reduce((sum, p) => sum + p.totalValue, 0);
      const openDayVal = posUpToDay.filter(p => !['Received', 'Cancelled', 'Closed'].includes(p.status)).reduce((sum, p) => sum + p.totalValue, 0);
      const delayedDayVal = posUpToDay.filter(p => p.status === 'Delayed' || p.status === 'Overdue').reduce((sum, p) => sum + p.totalValue, 0);

      const openDayCount = posUpToDay.filter(p => !['Received', 'Cancelled', 'Closed'].includes(p.status)).length;
      const delayedDayCount = posUpToDay.filter(p => p.status === 'Delayed' || p.status === 'Overdue').length;

      list.push({
        date: dateStr,
        totalValue: totalDayVal,
        openValue: openDayVal,
        delayedValue: delayedDayVal,
        openCount: openDayCount,
        delayedCount: delayedDayCount
      });
    }

    return list;
  }, [enrichedPOs]);

  // Pipeline stages count
  const pipeline = {
    approved: enrichedPOs.filter(po => po.status === 'Approved').length,
    inTransit: enrichedPOs.filter(po => po.status === 'In Transit').length,
    partial: partialCount,
    received: enrichedPOs.filter(po => po.status === 'Received').length,
  };

  const topDelayedPO = useMemo(() => {
    return enrichedPOs
      .filter(i => i.status === 'Delayed' || i.status === 'Overdue')
      .sort((a, b) => b.totalValue - a.totalValue)[0];
  }, [enrichedPOs]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      
      {/* PAGE HEADER */}
      <PageHeader 
        title="Procurement Control & Capital Commitments" 
        description="Monitor purchase order execution, supplier commitments, and schedule slippage exposure."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setStatusFilter('All');
                setSelectedSupplierId('All');
                setSearchParams({});
              }}
              className="px-3 py-1.5 text-xs font-mono text-os-text-muted hover:text-os-text-primary border border-os-border rounded-lg bg-os-surface hover:bg-os-surface-hover transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
            <select 
              className="rounded-lg border border-os-border bg-os-surface px-3 py-1.5 text-xs font-mono text-os-text-primary focus:outline-none focus:border-os-border-strong transition-colors cursor-pointer"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSearchParams({});
              }}
            >
              <option value="All">All Statuses ({enrichedPOs.length})</option>
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

      {/* EXECUTIVE FINANCIAL KPIS WITH CENTRALIZED FORMATTING */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard 
          label="Total Committed POs" 
          value={totalValueFormatted.compact}
          exactValue={totalValueFormatted.exact}
          subLabel="Committed"
          status="neutral"
        />
        <KPICard 
          label="Open PO Value" 
          value={openValueFormatted.compact}
          exactValue={openValueFormatted.exact}
          subLabel={`${openPOs.length} Open Orders`}
          status="healthy"
          onClick={() => setSearchParams({ filter: 'open' })}
        />
        <KPICard 
          label="PO Value at Risk" 
          value={atRiskValueFormatted.compact}
          exactValue={atRiskValueFormatted.exact}
          subLabel={`${delayedPOs.length} Delayed Orders`}
          status={delayedPOs.length > 0 ? "critical" : "healthy"}
          trend={delayedPOs.length > 0 ? "Action required" : "On schedule"} 
          trendUp={delayedPOs.length === 0}
          onClick={() => setStatusFilter('Delayed')}
        />
        <KPICard 
          label="Partially Received" 
          value={partialCount.toString()} 
          subValue={`${formatCurrencyCompact(enrichedPOs.filter(p => p.status === 'Partially Received').reduce((s, p) => s + p.totalValue, 0), currency)} in intake`}
          status={partialCount > 0 ? "warning" : "neutral"}
          onClick={() => setStatusFilter('Partially Received')}
        />
        <KPICard 
          label="On-Time Fulfillment" 
          value={`${formatNumber(onTimePercent, 1)}%`} 
          subValue="Target: 95.0%"
          status={onTimePercent < 90 ? "warning" : "healthy"} 
        />
        <KPICard 
          label="Active Suppliers" 
          value={new Set(enrichedPOs.map(p => p.supplierId)).size.toString()} 
          subValue="Contracted vendors"
          status="neutral"
        />
      </div>

      {/* PROCUREMENT ANALYTICS WORKBENCH (TREND & STATUS BREAKDOWN) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT: PROCUREMENT CAPITAL & DELAY TREND (7 COLS) */}
        <div className="xl:col-span-7 bg-os-surface border border-os-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-os-text-primary" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-os-text-primary">
                  Procurement Capital Trajectory & Exposure
                </h3>
              </div>
              <div className="flex rounded-lg border border-os-border bg-os-surface-secondary p-0.5 text-xs font-mono">
                <button
                  onClick={() => setTrendMetric('value')}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    trendMetric === 'value' 
                      ? 'bg-os-surface-active text-os-text-primary font-bold shadow-sm' 
                      : 'text-os-text-muted hover:text-os-text-primary'
                  }`}
                >
                  By Capital Value
                </button>
                <button
                  onClick={() => setTrendMetric('count')}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    trendMetric === 'count' 
                      ? 'bg-os-surface-active text-os-text-primary font-bold shadow-sm' 
                      : 'text-os-text-muted hover:text-os-text-primary'
                  }`}
                >
                  By PO Count
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono mb-3">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF]"></span>
                Open POs
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]"></span>
                Delayed Capital
              </span>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="openValGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0A84FF" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="delayedValGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF453A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF453A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#292C2F" strokeDasharray="3 3" vertical={false} opacity={0.4} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#777873" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#292C2F' }}
                  />
                  <YAxis 
                    stroke="#777873" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => trendMetric === 'value' ? formatCurrencyCompact(val, currency) : val}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-os-surface border border-os-border-strong p-3 rounded-lg shadow-xl text-xs font-mono space-y-1 z-30">
                            <div className="text-[10px] text-os-text-muted uppercase border-b border-os-border pb-1 mb-1">
                              {label}
                            </div>
                            {trendMetric === 'value' ? (
                              <>
                                <div className="flex justify-between gap-4 text-blue-400">
                                  <span>Open Capital:</span>
                                  <span>{formatCurrencyCompact(d.openValue, currency)}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-red-400">
                                  <span>Delayed Exposure:</span>
                                  <span>{formatCurrencyCompact(d.delayedValue, currency)}</span>
                                </div>
                                <div className="text-[9px] text-os-text-muted pt-1 border-t border-os-border">
                                  Exact Delayed: {formatCurrency(d.delayedValue, currency)}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between gap-4 text-blue-400">
                                  <span>Open Orders:</span>
                                  <span>{d.openCount} POs</span>
                                </div>
                                <div className="flex justify-between gap-4 text-red-400">
                                  <span>Delayed Orders:</span>
                                  <span>{d.delayedCount} POs</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={trendMetric === 'value' ? 'openValue' : 'openCount'} 
                    name="Open POs" 
                    stroke="#0A84FF" 
                    strokeWidth={2} 
                    fill="url(#openValGrad)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={trendMetric === 'value' ? 'delayedValue' : 'delayedCount'} 
                    name="Delayed" 
                    stroke="#FF453A" 
                    strokeWidth={2} 
                    fill="url(#delayedValGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-os-border flex items-center justify-between text-xs font-mono text-os-text-muted">
            <span>Historical order release vs arrival variance</span>
            <span>Refreshed live from purchase orders ledger</span>
          </div>
        </div>

        {/* RIGHT: PO VALUE BY STATUS & BREAKDOWN (5 COLS) */}
        <div className="xl:col-span-5 bg-os-surface border border-os-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-os-text-primary" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-os-text-primary">
                  PO Value by Lifecycle Status
                </h3>
              </div>
              <span className="text-[10px] font-mono text-os-text-muted">Click to filter table</span>
            </div>

            <div className="space-y-3">
              {statusBreakdown.map(st => {
                const isSelected = statusFilter === st.status;
                return (
                  <div
                    key={st.status}
                    onClick={() => setStatusFilter(isSelected ? 'All' : st.status)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-os-border-strong bg-os-surface-active ring-1 ring-os-border-strong' 
                        : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                        <span className="text-xs font-mono font-semibold text-os-text-primary">
                          {st.status}
                        </span>
                        <span className="text-[10px] font-mono text-os-text-muted">
                          ({st.count} {st.count === 1 ? 'PO' : 'POs'})
                        </span>
                      </div>
                      <div className="text-right">
                        <span 
                          className="text-xs font-mono font-semibold text-os-text-primary"
                          title={`Exact: ${st.valFormatted.exact}`}
                        >
                          {st.valFormatted.compact}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-os-surface overflow-hidden border border-os-border">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ width: `${Math.max(3, st.pct)}%`, backgroundColor: st.color }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted mt-1.5">
                      <span>{st.pct.toFixed(1)}% of committed total</span>
                      <span className="truncate max-w-[140px] select-all" title={`Exact: ${st.valFormatted.exact}`}>
                        {st.valFormatted.exact}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-os-border mt-4 flex items-center justify-between text-xs font-mono text-os-text-muted">
            <span>Filter Active: <strong className="text-os-text-primary">{statusFilter}</strong></span>
            {statusFilter !== 'All' && (
              <button 
                onClick={() => setStatusFilter('All')} 
                className="text-blue-400 hover:underline cursor-pointer"
              >
                Clear Status Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PIPELINE & MANAGEMENT ATTENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Procurement Pipeline */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ArrowRightCircle size={16} className="text-os-text-secondary" />
              <h3 className="text-xs font-bold text-os-text-primary uppercase tracking-widest">
                Procurement Pipeline Flow
              </h3>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center w-full my-6 px-4 sm:px-8">
              <div 
                onClick={() => setStatusFilter('Approved')}
                className="flex flex-col items-center relative z-10 w-full sm:w-auto mb-4 sm:mb-0 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2 font-mono text-xl font-bold group-hover:scale-105 transition-transform">
                  {pipeline.approved}
                </div>
                <div className="text-[10px] uppercase font-bold text-os-text-primary tracking-widest text-center">Approved</div>
                <div className="text-[10px] font-mono text-os-text-muted">Issued to vendor</div>
              </div>
              
              <div className="hidden sm:block flex-1 h-px bg-os-border mx-2 relative top-[-15px]"></div>
              
              <div 
                onClick={() => setStatusFilter('In Transit')}
                className="flex flex-col items-center relative z-10 w-full sm:w-auto mb-4 sm:mb-0 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 font-mono text-xl font-bold group-hover:scale-105 transition-transform">
                  {pipeline.inTransit}
                </div>
                <div className="text-[10px] uppercase font-bold text-os-text-primary tracking-widest text-center">In Transit</div>
                <div className="text-[10px] font-mono text-os-text-muted">En route to dock</div>
              </div>

              <div className="hidden sm:block flex-1 h-px bg-os-border mx-2 relative top-[-15px]"></div>
              
              <div 
                onClick={() => setStatusFilter('Partially Received')}
                className="flex flex-col items-center relative z-10 w-full sm:w-auto mb-4 sm:mb-0 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2 font-mono text-xl font-bold group-hover:scale-105 transition-transform">
                  {pipeline.partial}
                </div>
                <div className="text-[10px] uppercase font-bold text-os-text-primary tracking-widest text-center">Partial</div>
                <div className="text-[10px] font-mono text-os-text-muted">In dock intake</div>
              </div>

              <div className="hidden sm:block flex-1 h-px bg-os-border mx-2 relative top-[-15px]"></div>
              
              <div 
                onClick={() => setStatusFilter('Received')}
                className="flex flex-col items-center relative z-10 w-full sm:w-auto cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 font-mono text-xl font-bold group-hover:scale-105 transition-transform">
                  {pipeline.received}
                </div>
                <div className="text-[10px] uppercase font-bold text-os-text-primary tracking-widest text-center">Received</div>
                <div className="text-[10px] font-mono text-os-text-muted">Inventory booked</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-os-border flex items-center justify-between text-xs font-mono text-os-text-muted">
            <span>Click any node to filter purchase orders</span>
            <span>Total Lifecycle POs: {enrichedPOs.length}</span>
          </div>
        </div>

        {/* Management Attention & Expedite Action */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-red-500" />
              <h3 className="text-xs font-bold text-os-text-primary uppercase tracking-widest">
                Management Attention
              </h3>
            </div>
            
            {topDelayedPO ? (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-bold text-os-text-primary">{topDelayedPO.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold uppercase">
                    {topDelayedPO.status}
                  </span>
                </div>
                <div className="text-xs text-os-text-secondary truncate mt-0.5">{topDelayedPO.supplierName}</div>
                
                <div className="mt-4 p-3.5 bg-red-500/5 border border-red-500/20 rounded-lg space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase text-os-text-muted font-bold tracking-wider">Capital at Risk</span>
                    <span 
                      className="text-sm font-mono font-bold text-red-400"
                      title={`Exact: ${topDelayedPO.valPair.exact}`}
                    >
                      {topDelayedPO.valPair.compact}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-os-text-muted select-all truncate">
                    Exact: {topDelayedPO.valPair.exact}
                  </div>
                  <div className="text-[11px] text-os-text-secondary pt-1 border-t border-red-500/10">
                    Scheduled delivery was: <strong className="text-os-text-primary">{safeFormatDate(topDelayedPO.expectedDelivery, 'dd MMM yyyy', timezone)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-os-text-muted italic flex flex-col items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-80" />
                <p className="font-semibold text-os-text-primary">Zero Delayed Purchase Orders</p>
                <p className="text-os-text-muted mt-1">All orders are tracking on time with suppliers.</p>
              </div>
            )}
          </div>

          {topDelayedPO && (
            <button 
              onClick={() => openEntity('po', topDelayedPO.id)}
              className="mt-4 w-full py-2 bg-os-surface-secondary hover:bg-os-surface-hover border border-os-border rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Expedite Order Details</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TOP SUPPLIER EXPOSURE WORKBENCH */}
      <div className="bg-os-surface border border-os-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-os-text-primary" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-os-text-primary">
              Top Supplier Capital Exposures
            </h3>
          </div>
          <span className="text-[10px] font-mono text-os-text-muted">Ranked by total committed purchase volume</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topSupplierExposures.map(s => {
            const isSelected = selectedSupplierId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedSupplierId(isSelected ? 'All' : s.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-os-border-strong bg-os-surface-active ring-1 ring-os-border-strong' 
                    : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="text-xs font-semibold text-os-text-primary truncate max-w-[140px]" title={s.name}>
                    {s.name}
                  </div>
                  {s.delayedCount > 0 && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-500/20 text-red-300 font-bold">
                      {s.delayedCount} delayed
                    </span>
                  )}
                </div>

                <div 
                  className="text-base font-mono font-bold text-os-text-primary mt-2"
                  title={`Exact: ${s.valFormatted.exact}`}
                >
                  {s.valFormatted.compact}
                </div>
                <div className="text-[9px] font-mono text-os-text-muted truncate select-all">
                  {s.valFormatted.exact}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted pt-2 mt-2 border-t border-os-border">
                  <span>{s.openCount} Open POs</span>
                  <span className="text-blue-400 hover:underline">{isSelected ? 'Selected' : 'Filter'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PURCHASE ORDERS RECORD TABLE */}
      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden w-full shadow-sm">
        <div className="px-5 py-4 border-b border-os-border bg-os-surface-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs uppercase tracking-wider text-os-text-primary font-bold">
              Purchase Orders Ledger ({filteredPOs.length})
            </h3>
            {selectedSupplierId !== 'All' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-os-surface border border-os-border text-os-text-secondary">
                Supplier: {topSupplierExposures.find(s => s.id === selectedSupplierId)?.name || selectedSupplierId}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-os-text-muted">
            Click any row to open procurement inspection drawer
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {filteredPOs.slice(0, 50).map((item) => (
            <MobileRecordCard
              key={item.id}
              onClick={() => openEntity('po', item.id)}
              onContextMenu={(e) => openPurchaseOrderContextMenu(e, item)}
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
                { label: 'Total Value', value: item.valPair.compact, valueClassName: 'font-mono text-os-text-primary font-bold' },
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
                <th className="px-6 py-4 font-semibold tracking-wider">Expected Delivery</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Committed Value</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {filteredPOs.slice(0, 50).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openEntity('po', item.id)}
                  onContextMenu={(e) => openPurchaseOrderContextMenu(e, item)}
                  className="hover:bg-os-surface-hover cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-os-text-primary group-hover:text-blue-400 transition-colors">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-os-text-primary">
                    {item.supplierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {safeFormatDate(item.orderDate, 'dd MMM yyyy', timezone)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">
                    {safeFormatDate(item.expectedDelivery, 'dd MMM yyyy', timezone)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-mono">
                    <div 
                      className="text-os-text-primary font-semibold"
                      title={`Exact: ${item.valPair.exact}`}
                    >
                      {item.valPair.compact}
                    </div>
                    <div 
                      className="text-[9px] text-os-text-muted select-all truncate max-w-[130px] ml-auto"
                      title={`Exact: ${item.valPair.exact}`}
                    >
                      {item.valPair.exact}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
