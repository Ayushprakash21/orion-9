import { PageHeader } from './ui/PageHeader';
import React, { useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { brandingRepository } from '../repositories/BrandingRepository';
import { BrandingConfig } from '../types/auth';
import { formatCurrency, formatCurrencyPair, formatNumber, formatPercentage } from '../lib/formatters';
import { PriorityEngine } from '../services/PriorityEngine';
import { WarehouseEngine } from '../services/WarehouseEngine';
import { 
  AlertTriangle, PackageSearch, Truck, ShieldAlert, Activity,
  Database, Network, BrainCircuit, ArrowRight, Server, ShieldCheck, 
  Factory, Box, ShoppingCart, Users, CheckCircle2, TrendingDown, Clock, 
  TrendingUp, BarChart2, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { LiveSupplyChainFlow } from './LiveSupplyChainFlow';
import { CommandCenterAnalytics } from './CommandCenterAnalytics';

export const Dashboard = () => {
  const {
    products, inventory, suppliers, purchaseOrders, shipments, exceptions, 
    actions, importHistory, currency, settings, warehouseDetails, warehouses
  } = useSupplyChain();
  const navigate = useNavigate();
  const [branding, setBranding] = React.useState<BrandingConfig>(() => brandingRepository.getBrandingSync());
  
  React.useEffect(() => {
    const handleBrandingUpdate = () => {
      setBranding(brandingRepository.getBrandingSync());
    };
    window.addEventListener("orion-branding-updated", handleBrandingUpdate);
    window.addEventListener("storage", handleBrandingUpdate);
    return () => {
      window.removeEventListener("orion-branding-updated", handleBrandingUpdate);
      window.removeEventListener("storage", handleBrandingUpdate);
    };
  }, []);
  const { openEntity } = useEntityDrawer();

  const safeProducts = products || [];
  const safeInventory = inventory || [];
  const safeSuppliers = suppliers || [];
  const safePurchaseOrders = purchaseOrders || [];
  const safeShipments = shipments || [];
  const safeExceptions = exceptions || [];
  const safeActions = actions || [];
  const safeWarehouses = warehouses || [];
  const safeWarehouseDetails = warehouseDetails || [];
  const safeImportHistory = importHistory || [];

  const handleNodeClick = (node: { type: string; id: string }) => {
    const typeLower = node.type.toLowerCase();
    if (typeLower === 'inventory') {
      openEntity('inventory', node.id);
    } else if (typeLower === 'po') {
      openEntity('po', node.id);
    } else if (typeLower === 'shipment') {
      openEntity('shipment', node.id);
    } else if (typeLower === 'supplier') {
      const supp = safeSuppliers.find(s => s.name === node.id || s.id === node.id);
      if (supp) openEntity('supplier', supp.id);
    } else if (typeLower === 'exception') {
      openEntity('exception', node.id);
    }
  };

  // 1. DATA SOURCE VS DATASET DISTINCTION
  const totalRecords = safeProducts.length + safeInventory.length + safeSuppliers.length + safePurchaseOrders.length + safeShipments.length;

  let lastDataUpdate = 'UNKNOWN';
  if (safeImportHistory.length > 0) {
    const latest = new Date(Math.max(...safeImportHistory.map(h => new Date(h.importedAt).getTime())));
    const diffMins = Math.floor((Date.now() - latest.getTime()) / 60000);
    if (diffMins < 60) lastDataUpdate = `${diffMins} MINS AGO`;
    else if (diffMins < 1440) lastDataUpdate = `${Math.floor(diffMins / 60)} HOURS AGO`;
    else lastDataUpdate = `${Math.floor(diffMins / 1440)} DAYS AGO`;
  }

  // Calculate Health
  const activeSuppliers = safeSuppliers.filter(s => s.status === 'Active' || s.status === 'Approved');
  const delayedShipments = safeShipments.filter(s => s.delayDays > 0 && s.status !== 'Delivered');
  const criticalExceptions = safeExceptions.filter(e => e.status !== 'Resolved' && e.severity === 'Critical');

  const invValue = safeInventory.reduce((sum, item) => sum + ((item.onHand * item.unitCost) || 0), 0);
  const totalPOValue = safePurchaseOrders.reduce((sum, po) => sum + (po.totalValue || 0), 0);
  const invValPair = formatCurrencyPair(invValue, currency);
  const poValPair = formatCurrencyPair(totalPOValue, currency);

  const otifValues = activeSuppliers.map(s => s.otif || 100);
  const avgOtif = otifValues.length ? otifValues.reduce((a, b) => a + b, 0) / otifValues.length : 100;
  
  const warehouseAnalyses = WarehouseEngine.analyzeWarehouses(safeWarehouses, safeWarehouseDetails, safeInventory);
  const warehouseMetrics = WarehouseEngine.getAggregateMetrics(warehouseAnalyses);

  const pendingDecisions = safeActions.filter(a => a.status === 'PROPOSED');

  const healthScores = {
    inventory: { score: 87, status: 'Healthy', trend: '↓ 2.1%' },
    supplier: { score: Math.round(avgOtif), status: avgOtif > 90 ? 'Healthy' : 'Watch', trend: '→ Stable' },
    procurement: { score: 72, status: 'Watch', trend: '↑ 1.4%' },
    logistics: { score: Math.max(0, 100 - (delayedShipments.length * 5)), status: delayedShipments.length > 5 ? 'Risk' : 'Watch', trend: '↓ 4.0%' },
    demand: { score: 81, status: 'Healthy', trend: '↑ 3.2%' },
    warehouse: { score: Math.max(0, 100 - (warehouseMetrics.highCongestionFacilities * 15)), status: warehouseMetrics.highCongestionFacilities > 0 ? 'Watch' : 'Healthy', trend: '→ Stable' }
  };

  const topRisks = useMemo(() => {
    return PriorityEngine.getDailyPriorities(safeInventory, safePurchaseOrders, safeShipments, safeSuppliers, safeExceptions, safeActions);
  }, [safeInventory, safePurchaseOrders, safeShipments, safeSuppliers, safeExceptions, safeActions]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      {/* COMMAND CENTER HEADER */}
      <PageHeader 
        title={`${branding.appName || "ORION SCM OS"} Command Center`} 
        description={branding.description || "AI Supply Chain Operating System"}
        actions={
          <div className="flex gap-4 sm:gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Active Exceptions</span>
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className={criticalExceptions.length > 0 ? 'text-red-500' : 'text-os-text-muted'} />
              <span className="text-xl font-mono text-os-text-primary tracking-tight">{safeExceptions.filter(e => e.status !== 'Resolved').length}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-os-border"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Pending Decisions</span>
            <div className="flex items-center gap-2">
              <Activity size={14} className={pendingDecisions.length > 0 ? 'text-amber-500' : 'text-os-text-muted'} />
              <span className="text-xl font-mono text-os-text-primary tracking-tight">{pendingDecisions.length}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-os-border"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Last Updated</span>
            <div className="flex items-center gap-2">
              <Database size={14} className="text-os-text-muted" />
              <span className="text-sm font-mono text-os-text-secondary">{lastDataUpdate}</span>
            </div>
          </div>
          </div>
        }
      />

      {/* EXECUTIVE SUPPLY CHAIN HEALTH */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(healthScores).map(([key, data]) => (
          <div key={key} className="bg-os-surface border border-os-border rounded-xl p-4 hover:border-os-border-inverse transition-colors group cursor-pointer" onClick={() => navigate(`/${key}`)}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider text-os-text-muted font-medium group-hover:text-os-text-primary transition-colors">{key}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                data.status === 'Healthy' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' : 
                data.status === 'Watch' ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' : 
                'text-red-500 border-red-500/30 bg-red-500/5'
              }`}>{data.status}</span>
            </div>
            <div className="flex items-end gap-3">
              <span className={`text-2xl font-light font-mono ${getHealthColor(data.score)}`}>{data.score}</span>
              <span className={`text-[10px] font-mono pb-1 ${data.trend.includes('↓') ? 'text-red-500' : data.trend.includes('↑') ? 'text-emerald-500' : 'text-os-text-muted'}`}>{data.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* EXECUTIVE KPI STRIP WITH CENTRALIZED FINANCIAL FORMATTING */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 border-y border-os-border py-5">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Total Inventory Value</span>
          <span className="text-base font-mono text-os-text-primary font-medium" title={`Exact: ${invValPair.exact}`}>
            {invValPair.compact}
          </span>
          <span className="text-[10px] font-mono text-os-text-muted select-all whitespace-normal break-words leading-tight" title={`Exact: ${invValPair.exact}`}>
            Exact: {invValPair.exact}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Committed PO Value</span>
          <span className="text-base font-mono text-os-text-primary font-medium" title={`Exact: ${poValPair.exact}`}>
            {poValPair.compact}
          </span>
          <span className="text-[10px] font-mono text-os-text-muted select-all whitespace-normal break-words leading-tight" title={`Exact: ${poValPair.exact}`}>
            Exact: {poValPair.exact}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Avg Supplier OTIF</span>
          <span className="text-base font-mono text-os-text-primary font-medium">{formatPercentage(avgOtif)}</span>
          <span className="text-[10px] font-mono text-emerald-400">Target: 95.0%</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Delayed Shipments</span>
          <span className="text-base font-mono text-amber-500 font-medium">{delayedShipments.length}</span>
          <span className="text-[10px] font-mono text-os-text-muted">In transit issues</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Critical Exceptions</span>
          <span className="text-base font-mono text-red-500 font-medium">{criticalExceptions.length}</span>
          <span className="text-[10px] font-mono text-red-400">Immediate action</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1 font-bold">Pending Decisions</span>
          <span className="text-base font-mono text-amber-500 font-medium">{pendingDecisions.length}</span>
          <span className="text-[10px] font-mono text-os-text-muted">In Copilot queue</span>
        </div>
      </div>

      {/* COMMAND CENTER TIME-SERIES & RISK ANALYTICS */}
      <CommandCenterAnalytics />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* WHAT REQUIRES MANAGEMENT ATTENTION */}
        <div className="xl:col-span-2 bg-os-surface border border-os-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-os-border flex justify-between items-center bg-os-surface-secondary">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h2 className="text-xs uppercase tracking-wider text-os-text-primary font-semibold">Requires Management Attention</h2>
            </div>
          </div>
          <div className="divide-y divide-os-border flex-1">
            {topRisks.topRisks.slice(0, 5).map((risk, idx) => {
              const impactPair = formatCurrencyPair(risk.estimatedImpact, currency);
              return (
                <div key={idx} className="p-4 sm:p-5 hover:bg-os-surface-hover transition-colors cursor-pointer group" onClick={() => handleNodeClick({ type: 'exception', id: risk.id })}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          risk.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                          risk.severity === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                          'bg-os-surface-elevated text-os-text-secondary border-os-border'
                        }`}>{risk.severity}</span>
                        <span className="text-[10px] uppercase tracking-wider text-os-text-muted">{risk.type}</span>
                      </div>
                      <h3 className="text-sm text-os-text-primary font-medium mb-1 group-hover:text-blue-400 transition-colors">{risk.description}</h3>
                      <p className="text-xs text-os-text-secondary line-clamp-1">{risk.recommendedAction}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-os-text-primary mb-0.5 font-semibold" title={`Exact: ${impactPair.exact}`}>{impactPair.compact}</div>
                      <div className="text-[9px] font-mono text-os-text-muted select-all whitespace-normal break-words leading-tight">{impactPair.exact}</div>
                      <div className="text-[10px] uppercase tracking-wider text-os-text-muted mt-0.5">Est. Impact</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {topRisks.topRisks.length === 0 && (
              <div className="p-8 text-center text-os-text-muted text-sm flex flex-col items-center justify-center h-full">
                <ShieldCheck size={32} className="mb-3 opacity-50" />
                <p>No critical risks require immediate attention.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI MANAGEMENT BRIEF */}
        <div className="bg-os-surface border border-emerald-500/30 rounded-xl flex flex-col overflow-hidden relative shadow-[0_0_15px_rgba(48,209,88,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#30D158]/50 to-transparent"></div>
          <div className="p-4 sm:p-5 border-b border-os-border flex justify-between items-center bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <BrainCircuit size={16} className="text-emerald-500" />
              <h2 className="text-xs uppercase tracking-wider text-os-text-primary font-semibold">Today's Orion Brief</h2>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-mono border border-emerald-500/30 px-1.5 py-0.5 rounded">AI Generated</span>
          </div>
          <div className="p-5 space-y-5 flex-1 bg-gradient-to-b from-os-surface to-os-bg/30">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold block mb-1">Biggest Risk</span>
              <p className="text-xs text-os-text-primary leading-relaxed">{topRisks.topRisks[0]?.description || 'Supply chain is currently stable with no severe identified risks.'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold block mb-1">Biggest Opportunity</span>
              <p className="text-xs text-os-text-primary leading-relaxed">Inventory rebalancing could free up {formatCurrency(invValue * 0.05, currency)} in working capital this quarter.</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold block mb-1">Most Important Decision</span>
              <p className="text-xs text-os-text-primary leading-relaxed">{pendingDecisions[0]?.issue || 'No pending critical decisions.'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#64D2FF] font-bold block mb-1">Emerging Trend</span>
              <p className="text-xs text-os-text-primary leading-relaxed">Regional carrier delays in APAC are increasing. Lead times for ocean freight have stretched by 3.2 days average.</p>
            </div>
          </div>
        </div>
      </div>

      {/* END-TO-END SUPPLY CHAIN FLOW */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 sm:p-5">
        <h2 className="text-xs uppercase tracking-wider text-os-text-primary font-semibold mb-4 flex items-center gap-2">
          <Network size={16} className="text-os-text-secondary" /> End-to-End Supply Chain Flow
        </h2>
        <LiveSupplyChainFlow />
      </div>

      {/* INTELLIGENCE PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* INVENTORY */}
        <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-os-border flex items-center gap-2">
            <Box size={14} className="text-os-text-secondary" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-os-text-primary">Inventory</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase text-os-text-muted mb-1">Stockout Risk</div>
                <div className="text-sm font-mono text-red-500">{safeInventory.filter(i => (i.onHand / (i.dailyDemand || 1)) < settings.criticalStockOutDays).length} SKUs</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-os-text-muted mb-1">Excess Stock</div>
                <div className="text-sm font-mono text-amber-500">{safeInventory.filter(i => (i.onHand / (i.dailyDemand || 1)) > settings.excessInventoryDays).length} SKUs</div>
              </div>
            </div>
            <button onClick={() => navigate('/inventory')} className="w-full py-2 text-xs text-os-text-primary bg-os-surface-hover hover:bg-os-surface-active rounded border border-os-border transition-colors">View Inventory Optimization</button>
          </div>
        </div>

        {/* SUPPLIERS */}
        <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-os-border flex items-center gap-2">
            <Factory size={14} className="text-os-text-secondary" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-os-text-primary">Suppliers</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase text-os-text-muted mb-1">High Risk</div>
                <div className="text-sm font-mono text-red-500">{safeSuppliers.filter(s => s.riskLevel === 'High').length} Vendors</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-os-text-muted mb-1">Avg OTIF</div>
                <div className="text-sm font-mono text-os-text-primary">{formatPercentage(avgOtif)}</div>
              </div>
            </div>
            <button onClick={() => navigate('/suppliers')} className="w-full py-2 text-xs text-os-text-primary bg-os-surface-hover hover:bg-os-surface-active rounded border border-os-border transition-colors">View Supplier Intelligence</button>
          </div>
        </div>

        {/* LOGISTICS */}
        <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-os-border flex items-center gap-2">
            <Truck size={14} className="text-os-text-secondary" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-os-text-primary">Logistics</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase text-os-text-muted mb-1">Active Shipments</div>
                <div className="text-sm font-mono text-os-text-primary">{safeShipments.filter(s => s.status !== 'Delivered').length}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-os-text-muted mb-1">Delayed</div>
                <div className="text-sm font-mono text-red-500">{delayedShipments.length}</div>
              </div>
            </div>
            <button onClick={() => navigate('/shipments')} className="w-full py-2 text-xs text-os-text-primary bg-os-surface-hover hover:bg-os-surface-active rounded border border-os-border transition-colors">View Shipment Tracking</button>
          </div>
        </div>

      </div>

    </div>
  );
};
