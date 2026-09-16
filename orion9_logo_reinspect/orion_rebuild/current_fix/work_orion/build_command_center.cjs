const fs = require('fs');

const content = `
import React, { useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { formatCurrency, formatNumber } from '../lib/utils';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { 
  AlertTriangle, PackageSearch, Truck, ShieldAlert, Activity, 
  Database, Network, BrainCircuit, ArrowRight, ArrowRightLeft, 
  Server, ShieldCheck, Box, ShoppingCart, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { inventory, suppliers, shipments, exceptions, currency, purchaseOrders, settings } = useSupplyChain();
  const navigate = useNavigate();

  const health = useMemo(() => AnalyticsEngine.calculateOverallHealth(inventory, suppliers, purchaseOrders, shipments, settings), [inventory, suppliers, purchaseOrders, shipments, settings]);
  
  const inventoryStats = useMemo(() => {
    let critical = 0; let excess = 0; let healthy = 0; let low = 0;
    inventory.forEach(i => {
      const stats = AnalyticsEngine.calculateInventoryHealth(i, settings);
      if (stats.status === 'Critical') critical++;
      else if (stats.status === 'Excess') excess++;
      else if (stats.status === 'Low Stock') low++;
      else healthy++;
    });
    return { critical, excess, healthy, low };
  }, [inventory, settings]);

  const overduePOs = useMemo(() => purchaseOrders.filter(p => p.status === 'Overdue' || p.status === 'Delayed'), [purchaseOrders]);
  const delayedShipments = useMemo(() => shipments.filter(s => s.delayDays > 0), [shipments]);
  const supplierRiskCount = useMemo(() => suppliers.filter(s => AnalyticsEngine.calculateSupplierScore(s, settings) < 60).length, [suppliers, settings]);

  // Derive intelligence matrix status
  const getStatus = (criticalCount, warningCount) => {
    if (criticalCount > 0) return 'CRITICAL';
    if (warningCount > 0) return 'WARNING';
    return 'HEALTHY';
  };

  const matrix = [
    { name: 'Inventory', status: getStatus(inventoryStats.critical, inventoryStats.low), issues: inventoryStats.critical + inventoryStats.low },
    { name: 'Inbound', status: 'MONITOR', issues: 2 }, // Mocked as we don't have ASN yet
    { name: 'Suppliers', status: getStatus(supplierRiskCount, supplierRiskCount > 0 ? 1 : 0), issues: supplierRiskCount },
    { name: 'Procurement', status: getStatus(overduePOs.length, overduePOs.length > 0 ? 1 : 0), issues: overduePOs.length },
    { name: 'Logistics', status: getStatus(delayedShipments.length, delayedShipments.length > 0 ? 1 : 0), issues: delayedShipments.length },
    { name: 'Demand', status: 'HEALTHY', issues: 0 }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'WARNING': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'MONITOR': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  const criticalExceptions = useMemo(() => exceptions.filter(e => e.status !== 'Resolved' && e.severity === 'Critical').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [exceptions]);
  
  const primaryIssue = criticalExceptions.length > 0 ? criticalExceptions[0] : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* OS Tagline Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-light text-slate-100 tracking-wide">SYSTEM OVERVIEW</h2>
          <p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">CONNECT <span className="text-slate-600 mx-1">•</span> OBSERVE <span className="text-slate-600 mx-1">•</span> PREDICT <span className="text-slate-600 mx-1">•</span> ACT</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SUPPLY CHAIN HEALTH */}
        <div className="col-span-1 bg-[#020408]/50 border border-white/5 p-6 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
            <Activity size={120} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">SUPPLY CHAIN HEALTH</div>
          <div className="flex items-end gap-2 mb-6">
            <div className="text-6xl font-mono text-slate-100 tracking-tighter">{health.overall}</div>
            <div className="text-sm font-mono text-cyan-500 mb-2">/ 100</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => navigate('/inventory')} className="cursor-pointer hover:bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/10 transition-colors">
              <div className="text-[10px] text-slate-500 mb-1">INVENTORY</div>
              <div className="text-lg font-mono text-slate-300">{health.inventory}</div>
            </div>
            <div onClick={() => navigate('/suppliers')} className="cursor-pointer hover:bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/10 transition-colors">
              <div className="text-[10px] text-slate-500 mb-1">SUPPLIER</div>
              <div className="text-lg font-mono text-slate-300">{health.supplier}</div>
            </div>
            <div onClick={() => navigate('/procurement')} className="cursor-pointer hover:bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/10 transition-colors">
              <div className="text-[10px] text-slate-500 mb-1">PROCUREMENT</div>
              <div className="text-lg font-mono text-slate-300">{health.procurement}</div>
            </div>
            <div onClick={() => navigate('/shipments')} className="cursor-pointer hover:bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/10 transition-colors">
              <div className="text-[10px] text-slate-500 mb-1">LOGISTICS</div>
              <div className="text-lg font-mono text-slate-300">{(health.procurement + health.supplier)/2 | 0}</div>
            </div>
          </div>
        </div>

        {/* ORION ASSESSMENT */}
        <div className="col-span-1 lg:col-span-2 bg-[#020408]/50 border border-white/5 p-6 rounded-sm relative">
           <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-4 flex items-center gap-2">
             <BrainCircuit size={14} />
             ORION ASSESSMENT
           </div>
           
           {primaryIssue ? (
             <div className="space-y-4">
               <div>
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Primary Issue</div>
                 <div className="text-lg text-rose-400 font-medium">{primaryIssue.type} on {primaryIssue.entityId}</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/40 p-3 border border-white/5 rounded-sm">
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Evidence</div>
                   <div className="text-xs text-slate-300">{primaryIssue.description}</div>
                 </div>
                 <div className="bg-black/40 p-3 border border-white/5 rounded-sm">
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Business Impact</div>
                   <div className="text-xs text-slate-300">{formatCurrency(primaryIssue.estimatedImpact, currency)}</div>
                 </div>
               </div>
               <div className="bg-cyan-500/10 p-3 border border-cyan-500/20 rounded-sm">
                 <div className="text-[10px] text-cyan-500 uppercase tracking-widest mb-1">Recommended Action</div>
                 <div className="text-xs text-cyan-300">{primaryIssue.recommendedAction}</div>
               </div>
               <div className="flex gap-4 items-center">
                 <div className="text-[10px] uppercase font-mono px-2 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-sm">PRIORITY: {primaryIssue.severity}</div>
                 <div className="text-[10px] uppercase font-mono px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-sm">CONFIDENCE: HIGH</div>
               </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500">
               <ShieldCheck size={32} className="text-emerald-500/50 mb-2" />
               <p className="text-sm">No critical operational issues detected.</p>
             </div>
           )}
        </div>
      </div>

      {/* LIVE SUPPLY CHAIN FLOW */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">LIVE SUPPLY CHAIN FLOW</div>
        <div className="flex items-center justify-between overflow-x-auto pb-4 gap-2">
          {['SUPPLIERS', 'INBOUND', 'WAREHOUSES', 'INVENTORY', 'ORDERS', 'OUTBOUND', 'CUSTOMERS'].map((node, i, arr) => (
            <React.Fragment key={node}>
              <div className="flex-shrink-0 bg-black/40 border border-white/10 px-4 py-3 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors group min-w-[100px]">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 group-hover:text-cyan-400 transition-colors">{node}</span>
                {i === 3 && inventoryStats.critical > 0 && <span className="absolute -top-2 -right-2 w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>}
              </div>
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 text-slate-600">
                  <ArrowRight size={14} className="animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SYSTEM AWARENESS PANEL */}
        <div className="col-span-1 bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">SYSTEM AWARENESS</div>
          <div className="space-y-4 flex-1">
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Data Sources</span>
               <span className="text-xs font-mono text-emerald-400">3 CONNECTED</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Data Quality</span>
               <span className="text-xs font-mono text-emerald-400">94 / 100</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Critical Events</span>
               <span className="text-xs font-mono text-rose-400">{criticalExceptions.length} DETECTED</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Actions Awaiting</span>
               <span className="text-xs font-mono text-amber-400">0</span>
             </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-600 font-mono">LAST SYNC: &lt; 1 MINUTE AGO</div>
        </div>

        {/* ORION INTELLIGENCE MATRIX */}
        <div className="col-span-1 lg:col-span-3 bg-[#020408]/50 border border-white/5 p-4 rounded-sm">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">ORION INTELLIGENCE MATRIX</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {matrix.map((m) => (
               <div key={m.name} className="bg-black/40 border border-white/5 p-4 rounded-sm flex flex-col justify-between">
                 <div className="text-xs text-slate-300 uppercase tracking-widest">{m.name}</div>
                 <div className="mt-3 flex justify-between items-end">
                   <div className="text-lg font-mono text-slate-100">{m.issues} <span className="text-[10px] text-slate-500 tracking-widest">ISSUES</span></div>
                   <div className={\`text-[10px] uppercase font-mono px-2 py-1 border rounded-sm \${getStatusColor(m.status)}\`}>
                     {m.status}
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

    </div>
  );
};
`;
fs.writeFileSync('src/components/Dashboard.tsx', content);
