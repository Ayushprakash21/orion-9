import React, { useMemo, useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { 
  ArrowDownToLine, Package, Truck, Clock, AlertTriangle, CheckCircle2, 
  ShieldAlert, Calendar, DollarSign, ChevronRight, Search, Filter,
  ArrowRight, Anchor, Warehouse, AlertCircle, RefreshCw
} from 'lucide-react';
import { formatDateOnly } from '../lib/utils';
import { formatCurrency, formatCurrencyCompact, formatCurrencyPair, formatNumber } from '../lib/formatters';
import { MobileRecordCard } from './MobileRecordCard';
import { KPICard } from './ui/KPICard';
import { PageHeader } from './ui/PageHeader';
import { StatusBadge } from './ui/StatusBadge';

type LifecycleStage = 'ALL' | 'ASN CREATED' | 'DISPATCHED' | 'IN TRANSIT' | 'ARRIVED' | 'QC' | 'PUTAWAY';

export const Inbound: React.FC = () => {
  const { purchaseOrders, shipments, suppliers, exceptions, currency, timezone } = useSupplyChain();
  const { openEntity } = useEntityDrawer();

  const [selectedStage, setSelectedStage] = useState<LifecycleStage>('ALL');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ALL');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyDelayed, setOnlyDelayed] = useState<boolean>(false);

  // Filter only active inbound shipments (not Delivered or Cancelled)
  const activeInboundShipments = useMemo(() => {
    return shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled');
  }, [shipments]);

  // Enrich shipments with connected PO and Supplier information
  const enrichedShipments = useMemo(() => {
    const todayStr = formatDateOnly(new Date(), timezone);
    const todayDate = new Date();

    return activeInboundShipments.map(s => {
      const po = purchaseOrders.find(p => p.id === s.poId);
      const supplier = suppliers.find(sup => sup.id === (s.supplierId || po?.supplierId));
      const connectedExceptions = exceptions.filter(e => e.entityId === s.id || e.entityId === s.poId);
      
      const cargoValue = po?.totalValue || s.freightCost * 5 || 50000;
      const isDelayed = s.delayDays > 0 || s.status === 'Delayed';
      
      // Calculate days until arrival
      let daysUntilArrival = 0;
      if (s.expectedArrival) {
        const arrivalDate = new Date(s.expectedArrival);
        const diffTime = arrivalDate.getTime() - todayDate.getTime();
        daysUntilArrival = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Assign normalized lifecycle stage for control tower tracking
      let stage: LifecycleStage = 'IN TRANSIT';
      if (s.status === 'Exception') stage = 'QC';
      else if (s.status === 'Booked' || s.status === 'Planned') stage = 'ASN CREATED';
      else if (s.status === 'Picked Up') stage = 'DISPATCHED';
      else if (daysUntilArrival <= 0 && !isDelayed) stage = 'ARRIVED';
      else stage = 'IN TRANSIT';

      return {
        ...s,
        po,
        supplier,
        connectedExceptions,
        cargoValue,
        cargoValueFormatted: formatCurrencyPair(cargoValue, currency),
        isDelayed,
        daysUntilArrival,
        stage
      };
    });
  }, [activeInboundShipments, purchaseOrders, suppliers, exceptions, currency, timezone]);

  // Total Inbound Pipeline Financials
  const totalInboundValue = useMemo(() => {
    return enrichedShipments.reduce((sum, s) => sum + s.cargoValue, 0);
  }, [enrichedShipments]);

  const totalInboundValueFormatted = formatCurrencyPair(totalInboundValue, currency);

  // Total Inbound Value at Risk
  const delayedShipments = useMemo(() => {
    return enrichedShipments.filter(s => s.isDelayed);
  }, [enrichedShipments]);

  const inboundValueAtRisk = useMemo(() => {
    return delayedShipments.reduce((sum, s) => sum + s.cargoValue, 0);
  }, [delayedShipments]);

  const inboundValueAtRiskFormatted = formatCurrencyPair(inboundValueAtRisk, currency);

  // Arriving Today
  const shipmentsArrivingToday = useMemo(() => {
    const todayStr = formatDateOnly(new Date(), timezone);
    return enrichedShipments.filter(s => {
      return String(s.expectedArrival || '').startsWith(todayStr) || s.daysUntilArrival === 0;
    });
  }, [enrichedShipments, timezone]);

  const arrivingTodayValue = useMemo(() => {
    return shipmentsArrivingToday.reduce((sum, s) => sum + s.cargoValue, 0);
  }, [shipmentsArrivingToday]);

  const arrivingTodayValueFormatted = formatCurrencyPair(arrivingTodayValue, currency);

  // Unique carriers
  const carriers = useMemo(() => {
    const set = new Set<string>();
    enrichedShipments.forEach(s => {
      if (s.carrier) set.add(s.carrier);
    });
    return Array.from(set);
  }, [enrichedShipments]);

  // Arrival Horizon Buckets
  const arrivalHorizons = useMemo(() => {
    const overdue = enrichedShipments.filter(s => s.isDelayed || s.daysUntilArrival < 0);
    const today = shipmentsArrivingToday;
    const tomorrow = enrichedShipments.filter(s => s.daysUntilArrival === 1 && !s.isDelayed);
    const next2to3Days = enrichedShipments.filter(s => s.daysUntilArrival >= 2 && s.daysUntilArrival <= 3 && !s.isDelayed);
    const next4to7Days = enrichedShipments.filter(s => s.daysUntilArrival >= 4 && s.daysUntilArrival <= 7 && !s.isDelayed);
    const later = enrichedShipments.filter(s => s.daysUntilArrival > 7 && !s.isDelayed);

    return [
      { id: 'overdue', label: 'Overdue / Delayed', items: overdue, color: '#FF453A' },
      { id: 'today', label: 'Arriving Today', items: today, color: '#30D158' },
      { id: 'tomorrow', label: 'Tomorrow (24h)', items: tomorrow, color: '#0A84FF' },
      { id: 'days2_3', label: '2 - 3 Days', items: next2to3Days, color: '#64D2FF' },
      { id: 'days4_7', label: '4 - 7 Days', items: next4to7Days, color: '#BF5AF2' },
      { id: 'later', label: '8+ Days', items: later, color: '#98989D' },
    ];
  }, [enrichedShipments, shipmentsArrivingToday]);

  // Stage definitions with real counts
  const stages: Array<{ stage: LifecycleStage; label: string; icon: any }> = [
    { stage: 'ALL', label: 'ALL INBOUND', icon: ArrowDownToLine },
    { stage: 'ASN CREATED', label: 'ASN BOOKED', icon: Package },
    { stage: 'DISPATCHED', label: 'ORIGIN DISPATCH', icon: Truck },
    { stage: 'IN TRANSIT', label: 'IN TRANSIT', icon: Anchor },
    { stage: 'ARRIVED', label: 'PORT / DOCK', icon: Warehouse },
    { stage: 'QC', label: 'QC & INSPECT', icon: AlertCircle },
    { stage: 'PUTAWAY', label: 'PUTAWAY READY', icon: CheckCircle2 },
  ];

  // Filtered shipment list
  const filteredShipments = useMemo(() => {
    return enrichedShipments.filter(s => {
      // Stage filter
      if (selectedStage !== 'ALL' && s.stage !== selectedStage) {
        return false;
      }
      // Carrier filter
      if (selectedCarrier !== 'ALL' && s.carrier !== selectedCarrier) {
        return false;
      }
      // Delayed only filter
      if (onlyDelayed && !s.isDelayed) {
        return false;
      }
      // Horizon filter
      if (selectedHorizon !== 'ALL') {
        const horizonObj = arrivalHorizons.find(h => h.id === selectedHorizon);
        if (horizonObj && !horizonObj.items.some(item => item.id === s.id)) {
          return false;
        }
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = s.id.toLowerCase().includes(term);
        const matchesPo = s.poId?.toLowerCase().includes(term);
        const matchesCarrier = s.carrier?.toLowerCase().includes(term);
        const matchesOrigin = s.origin?.toLowerCase().includes(term);
        const matchesDest = s.destination?.toLowerCase().includes(term);
        const matchesSup = s.supplier?.name?.toLowerCase().includes(term);
        return matchesId || matchesPo || matchesCarrier || matchesOrigin || matchesDest || matchesSup;
      }
      return true;
    });
  }, [enrichedShipments, selectedStage, selectedCarrier, onlyDelayed, selectedHorizon, searchTerm, arrivalHorizons]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      {/* CONTROL TOWER HEADER */}
      <PageHeader 
        title="Inbound Command & Logistics Tower"
        description="End-to-end inbound shipment visibility, arrival timelines, and dock risk mitigation"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedStage('ALL');
                setSelectedCarrier('ALL');
                setSelectedHorizon('ALL');
                setOnlyDelayed(false);
                setSearchTerm('');
              }}
              className="px-3 py-1.5 text-xs font-mono text-os-text-muted hover:text-os-text-primary border border-os-border rounded-lg bg-os-surface hover:bg-os-surface-hover transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-mono tracking-wider text-os-text-muted block">Inbound Active</span>
              <span className="text-sm font-mono text-os-text-primary font-bold">{enrichedShipments.length} Cargo Units</span>
            </div>
          </div>
        }
      />

      {/* EXECUTIVE INBOUND KPI WORKBENCH */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Inbound Cargo Value"
          value={totalInboundValueFormatted.compact}
          exactValue={totalInboundValueFormatted.exact}
          subLabel="Exact"
          status="neutral"
        />
        <KPICard
          label="Inbound Value at Risk"
          value={inboundValueAtRiskFormatted.compact}
          exactValue={inboundValueAtRiskFormatted.exact}
          subLabel="Exact"
          status={delayedShipments.length > 0 ? 'critical' : 'healthy'}
          onClick={() => setOnlyDelayed(!onlyDelayed)}
        />
        <KPICard
          label="Arriving Today"
          value={`${shipmentsArrivingToday.length} Shipments`}
          exactValue={arrivingTodayValueFormatted.exact}
          subLabel="Today's Cargo"
          status={shipmentsArrivingToday.length > 0 ? 'healthy' : 'neutral'}
          onClick={() => setSelectedHorizon(selectedHorizon === 'today' ? 'ALL' : 'today')}
        />
        <KPICard
          label="On-Time Delivery Rate"
          value={`${enrichedShipments.length > 0 ? Math.round(((enrichedShipments.length - delayedShipments.length) / enrichedShipments.length) * 100) : 100}%`}
          subValue={`${enrichedShipments.length - delayedShipments.length} of ${enrichedShipments.length} on schedule`}
          status={delayedShipments.length > 5 ? 'critical' : delayedShipments.length > 0 ? 'warning' : 'healthy'}
        />
      </div>

      {/* INTERACTIVE INBOUND LIFECYCLE CONTROLLER */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-os-text-primary" />
            <span className="text-xs uppercase tracking-wider text-os-text-primary font-bold">
              Interactive Inbound Lifecycle Pipeline
            </span>
            <span className="text-[10px] font-mono text-os-text-muted">
              (Click any stage to filter stream)
            </span>
          </div>
          {selectedStage !== 'ALL' && (
            <button 
              onClick={() => setSelectedStage('ALL')}
              className="text-[11px] font-mono text-blue-400 hover:underline cursor-pointer"
            >
              Clear stage filter (Currently: {selectedStage})
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stages.map((item, index) => {
            const count = item.stage === 'ALL' 
              ? enrichedShipments.length 
              : enrichedShipments.filter(s => s.stage === item.stage).length;
            const isSelected = selectedStage === item.stage;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.stage}>
                <button
                  onClick={() => setSelectedStage(item.stage)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-2 border cursor-pointer ${
                    isSelected 
                      ? 'bg-os-surface-active border-os-border-strong text-os-text-primary shadow-sm ring-1 ring-os-border-strong' 
                      : 'bg-os-surface-secondary border-os-border text-os-text-secondary hover:text-os-text-primary hover:border-os-border-strong'
                  }`}
                >
                  <Icon size={13} className={isSelected ? 'text-emerald-400' : 'text-os-text-muted'} />
                  <span className="font-medium text-[11px]">{item.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-os-surface text-os-text-primary' : 'bg-os-surface-elevated text-os-text-muted'
                  }`}>
                    {count}
                  </span>
                </button>
                {index < stages.length - 1 && (
                  <div className="hidden lg:block w-3 h-px bg-os-border"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* TWO-COLUMN WORKBENCH: ARRIVAL TIMELINE HORIZON & CRITICAL AT-RISK PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: ARRIVAL HORIZON TIMELINE (7 COLS) */}
        <div className="lg:col-span-7 bg-os-surface border border-os-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-os-text-primary" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-os-text-primary">
                  Inbound Arrival Horizon & Dock Schedule
                </h3>
              </div>
              {selectedHorizon !== 'ALL' && (
                <button
                  onClick={() => setSelectedHorizon('ALL')}
                  className="text-[10px] font-mono text-blue-400 hover:underline cursor-pointer"
                >
                  Reset horizon filter
                </button>
              )}
            </div>

            <p className="text-xs text-os-text-secondary mb-4">
              Cargo pipeline distribution by scheduled arrival date. Click any horizon to filter shipment records.
            </p>

            <div className="space-y-3">
              {arrivalHorizons.map(h => {
                const totalVal = h.items.reduce((sum, item) => sum + item.cargoValue, 0);
                const valFormatted = formatCurrencyPair(totalVal, currency);
                const isSelected = selectedHorizon === h.id;
                const pct = totalInboundValue > 0 ? (totalVal / totalInboundValue) * 100 : 0;

                return (
                  <div 
                    key={h.id}
                    onClick={() => setSelectedHorizon(isSelected ? 'ALL' : h.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-os-border-strong bg-os-surface-active ring-1 ring-os-border-strong' 
                        : 'border-os-border bg-os-surface-secondary hover:border-os-border-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }}></span>
                        <span className="text-xs font-mono font-semibold text-os-text-primary">
                          {h.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-os-surface border border-os-border text-os-text-muted">
                          {h.items.length} {h.items.length === 1 ? 'Shipment' : 'Shipments'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span 
                          className="text-xs font-mono font-semibold text-os-text-primary"
                          title={`Exact: ${valFormatted.exact}`}
                        >
                          {valFormatted.compact}
                        </span>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="w-full h-1.5 rounded-full bg-os-surface overflow-hidden border border-os-border">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ width: `${Math.max(3, pct)}%`, backgroundColor: h.color }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted mt-1.5">
                      <span>{pct.toFixed(1)}% of total inbound valuation</span>
                      <span className="truncate max-w-[150px] select-all" title={`Exact: ${valFormatted.exact}`}>
                        {valFormatted.exact}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: INBOUND RISK PANEL (5 COLS) */}
        <div className="lg:col-span-5 bg-os-surface border border-os-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-os-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-500" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-os-text-primary">
                  Inbound Capital-at-Risk
                </h3>
              </div>
              <span className="text-[10px] font-mono text-red-400 font-semibold uppercase">
                {delayedShipments.length} High-Risk Units
              </span>
            </div>

            {delayedShipments.length > 0 ? (
              <div className="space-y-3">
                {delayedShipments.slice(0, 4).map(s => (
                  <div 
                    key={s.id}
                    onClick={() => openEntity('shipment', s.id)}
                    className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:border-red-500/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-os-text-primary group-hover:text-red-400 transition-colors">
                          <span>{s.id}</span>
                          <span className="text-os-text-muted">/ {s.poId}</span>
                        </div>
                        <div className="text-[11px] text-os-text-secondary truncate mt-0.5">
                          {s.supplier?.name || 'Authorized Supplier'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div 
                          className="text-xs font-mono font-bold text-red-400"
                          title={`Exact: ${s.cargoValueFormatted.exact}`}
                        >
                          {s.cargoValueFormatted.compact}
                        </div>
                        <span className="inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                          +{s.delayDays}d Delayed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted border-t border-red-500/10 pt-2 mt-2">
                      <span className="truncate max-w-[160px]">{s.origin} → {s.destination}</span>
                      <span className="flex items-center gap-1 group-hover:text-os-text-primary transition-colors">
                        Carrier: {s.carrier} <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-os-text-muted text-xs font-mono flex flex-col items-center justify-center h-48">
                <CheckCircle2 size={32} className="text-emerald-500 mb-2 opacity-80" />
                <p className="text-os-text-primary font-semibold">Zero Inbound Transit Exceptions</p>
                <p className="text-os-text-muted mt-1">All active inbound shipments are moving on scheduled ETA.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-os-border mt-4">
            <button
              onClick={() => setOnlyDelayed(!onlyDelayed)}
              className={`w-full py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer border ${
                onlyDelayed 
                  ? 'bg-red-500/20 border-red-500 text-red-400 font-bold' 
                  : 'bg-os-surface-secondary border-os-border hover:bg-os-surface-hover text-os-text-primary'
              }`}
            >
              <AlertTriangle size={13} className={onlyDelayed ? 'text-red-400' : 'text-amber-500'} />
              <span>{onlyDelayed ? 'Showing Delayed Only (Click to reset)' : 'Filter Table to Delayed Cargo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted" />
          <input 
            type="text"
            placeholder="Search Shipment, PO, Carrier, Origin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-os-surface-secondary border border-os-border rounded-lg text-xs font-mono text-os-text-primary placeholder:text-os-text-muted focus:outline-none focus:border-os-border-strong"
          />
        </div>

        {/* Carrier and quick toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-os-text-muted">Carrier:</span>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="bg-os-surface-secondary border border-os-border rounded-lg px-2.5 py-1 text-xs font-mono text-os-text-primary focus:outline-none focus:border-os-border-strong"
            >
              <option value="ALL">All Carriers ({carriers.length})</option>
              {carriers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setOnlyDelayed(!onlyDelayed)}
            className={`px-3 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
              onlyDelayed 
                ? 'bg-red-500/20 text-red-400 border-red-500/40 font-bold' 
                : 'bg-os-surface-secondary text-os-text-muted hover:text-os-text-primary border-os-border'
            }`}
          >
            Delayed Only ({delayedShipments.length})
          </button>
        </div>
      </div>

      {/* SHIPMENTS RECORD TABLE */}
      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-os-border bg-os-surface-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownToLine size={16} className="text-os-text-primary" />
            <h3 className="text-xs uppercase tracking-wider text-os-text-primary font-bold">
              Active Inbound Manifest Records ({filteredShipments.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-os-text-muted">
            Click row to view full logistics & PO audit drawer
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-os-border w-full">
          {filteredShipments.slice(0, 30).map(s => (
            <MobileRecordCard
              key={s.id}
              onClick={() => openEntity('shipment', s.id)}
              title={s.id}
              subtitle={`PO: ${s.poId} • ${s.carrier}`}
              statusNode={
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                  s.isDelayed ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {s.status}
                </span>
              }
              fields={[
                { label: 'Carrier', value: s.carrier },
                { label: 'Origin → Dest', value: `${s.origin} → ${s.destination}` },
                { label: 'ETA', value: formatDateOnly(s.expectedArrival, timezone) },
                { label: 'Cargo Value', value: s.cargoValueFormatted.compact, valueClassName: 'font-mono text-os-text-primary font-bold' }
              ]}
            />
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-os-text-secondary">
            <thead>
              <tr className="border-b border-os-border bg-os-surface-secondary text-[10px] font-mono text-os-text-muted uppercase tracking-wider">
                <th className="p-3.5">Shipment ID</th>
                <th className="p-3.5">PO Ref</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Route</th>
                <th className="p-3.5">Carrier</th>
                <th className="p-3.5">Scheduled ETA</th>
                <th className="p-3.5 text-right">Inbound Value</th>
                <th className="p-3.5 text-center">Lifecycle Stage</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border">
              {filteredShipments.slice(0, 50).map(s => (
                <tr 
                  key={s.id} 
                  onClick={() => openEntity('shipment', s.id)} 
                  className="hover:bg-os-surface-hover transition-colors cursor-pointer group"
                >
                  <td className="p-3.5 font-mono font-semibold text-os-text-primary group-hover:text-blue-400 transition-colors">
                    {s.id}
                  </td>
                  <td className="p-3.5 font-mono text-os-text-secondary">
                    {s.poId}
                  </td>
                  <td className="p-3.5 text-os-text-primary max-w-[140px] truncate">
                    {s.supplier?.name || 'Global Supplier'}
                  </td>
                  <td className="p-3.5 text-os-text-muted text-[11px] font-mono max-w-[160px] truncate">
                    {s.origin} → {s.destination}
                  </td>
                  <td className="p-3.5 text-os-text-secondary">
                    {s.carrier}
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="text-os-text-primary">{formatDateOnly(s.expectedArrival, timezone)}</div>
                    <div className={`text-[10px] ${
                      s.isDelayed ? 'text-red-400' : s.daysUntilArrival === 0 ? 'text-emerald-400' : 'text-os-text-muted'
                    }`}>
                      {s.isDelayed ? `Delayed (+${s.delayDays}d)` : s.daysUntilArrival === 0 ? 'Arriving Today' : `In ${s.daysUntilArrival} days`}
                    </div>
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    <div 
                      className="text-os-text-primary font-semibold"
                      title={`Exact: ${s.cargoValueFormatted.exact}`}
                    >
                      {s.cargoValueFormatted.compact}
                    </div>
                    <div 
                      className="text-[9px] text-os-text-muted select-all truncate max-w-[120px] ml-auto"
                      title={`Exact: ${s.cargoValueFormatted.exact}`}
                    >
                      {s.cargoValueFormatted.exact}
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-os-border bg-os-surface-elevated text-os-text-secondary">
                      {s.stage}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      s.isDelayed 
                        ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                        : s.status === 'In Transit' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredShipments.length === 0 && (
            <div className="p-12 text-center text-os-text-muted font-mono text-xs uppercase tracking-wider">
              No matching inbound shipments found
            </div>
          )}
          {filteredShipments.length > 50 && (
            <div className="px-6 py-3 border-t border-os-border bg-os-surface-secondary text-center text-[10px] text-os-text-muted font-mono uppercase tracking-widest">
              Showing top 50 of {filteredShipments.length} inbound shipments
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
