const fs = require('fs');

const content = `
import React, { useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { formatCurrency, formatNumber } from '../lib/utils';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { 
  AlertTriangle, PackageSearch, Truck, ShieldAlert, Activity, 
  Database, Network, BrainCircuit, ArrowRight, ArrowRightLeft, 
  Server, ShieldCheck, Box, ShoppingCart, Users, CheckCircle2, FileSearch, TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { 
    products, inventory, suppliers, purchaseOrders, shipments, exceptions, importHistory, currency, settings
  } = useSupplyChain();
  const navigate = useNavigate();

  // 1. DATA SOURCE VS DATASET DISTINCTION
  const datasetsLoaded = [
    products.length > 0, inventory.length > 0, suppliers.length > 0, 
    purchaseOrders.length > 0, shipments.length > 0
  ].filter(Boolean).length;
  
  const totalRecords = products.length + inventory.length + suppliers.length + purchaseOrders.length + shipments.length;
  
  const fileSources = new Set(importHistory.map(h => h.filename)).size;
  
  const dataExceptions = exceptions.filter(e => e.type === 'Data Quality');
  const dataQualityScore = Math.max(0, 100 - (dataExceptions.length * 2));
  
  const criticalExceptions = exceptions.filter(e => e.status !== 'Resolved' && e.severity === 'Critical');
  
  let lastDataUpdate = 'UNKNOWN';
  if (importHistory.length > 0) {
    const latest = new Date(Math.max(...importHistory.map(h => new Date(h.importedAt).getTime())));
    const diffMins = Math.floor((Date.now() - latest.getTime()) / 60000);
    if (diffMins < 60) lastDataUpdate = \`\${diffMins} MINS AGO\`;
    else if (diffMins < 1440) lastDataUpdate = \`\${Math.floor(diffMins/60)} HOURS AGO\`;
    else lastDataUpdate = \`\${Math.floor(diffMins/1440)} DAYS AGO\`;
  }

  // 3. LOGISTICS HEALTH
  const logisticsData = useMemo(() => {
    if (shipments.length === 0) return { score: null, onTime: 0, delayed: 0, active: 0, status: 'NO DATA' };
    const active = shipments.filter(s => ['Booked', 'Planned', 'Picked Up', 'In Transit'].includes(s.status));
    const delayed = shipments.filter(s => s.delayDays > 0);
    const completed = shipments.filter(s => s.status === 'Delivered');
    
    let score = 100;
    if (shipments.length > 0) {
      score = Math.max(0, 100 - (delayed.length / shipments.length) * 100 * 1.5);
    }
    
    return {
      score: Math.round(score),
      onTime: shipments.length - delayed.length,
      delayed: delayed.length,
      active: active.length,
      total: shipments.length,
      status: score < 70 ? 'CRITICAL' : score < 90 ? 'WARNING' : 'HEALTHY'
    };
  }, [shipments]);

  // 4. SUPPLIER HEALTH
  const supplierData = useMemo(() => {
    if (suppliers.length === 0) return { score: null, riskCount: 0, total: 0, status: 'NO DATA' };
    const avgScore = suppliers.reduce((sum, s) => sum + (s.score || 85), 0) / suppliers.length;
    const riskCount = suppliers.filter(s => (s.score || 85) < 70).length;
    
    return {
      score: Math.round(avgScore),
      riskCount,
      total: suppliers.length,
      status: riskCount > 0 ? (riskCount > suppliers.length * 0.2 ? 'CRITICAL' : 'WARNING') : 'HEALTHY'
    };
  }, [suppliers]);
  
  // INVENTORY HEALTH
  const inventoryData = useMemo(() => {
    if (inventory.length === 0) return { score: null, critical: 0, total: 0, status: 'NO DATA' };
    let critical = 0;
    inventory.forEach(i => {
      const available = i.onHand - i.reserved;
      const dos = i.averageDailyDemand > 0 ? available / i.averageDailyDemand : null;
      if (dos !== null && dos <= (settings.criticalStockOutDays || 7)) critical++;
    });
    const score = Math.max(0, 100 - (critical / inventory.length) * 100 * 2);
    return {
      score: Math.round(score),
      critical,
      total: inventory.length,
      status: critical > 0 ? 'CRITICAL' : 'HEALTHY'
    };
  }, [inventory, settings]);
  
  // PROCUREMENT HEALTH
  const procurementData = useMemo(() => {
    if (purchaseOrders.length === 0) return { score: null, overdue: 0, open: 0, status: 'NO DATA' };
    const overdue = purchaseOrders.filter(p => p.status === 'Overdue' || p.status === 'Delayed');
    const open = purchaseOrders.filter(p => !['Received', 'Cancelled', 'Closed'].includes(p.status));
    const score = Math.max(0, 100 - (overdue.length / purchaseOrders.length) * 100 * 1.5);
    return {
      score: Math.round(score),
      overdue: overdue.length,
      open: open.length,
      total: purchaseOrders.length,
      status: overdue.length > purchaseOrders.length * 0.1 ? 'CRITICAL' : overdue.length > 0 ? 'WARNING' : 'HEALTHY'
    };
  }, [purchaseOrders]);

  // OVERALL HEALTH
  const overallHealth = useMemo(() => {
    const scores = [inventoryData.score, supplierData.score, procurementData.score, logisticsData.score].filter(s => s !== null);
    if (scores.length === 0) return '--';
    return Math.round(scores.reduce((a,b) => a+b, 0) / scores.length);
  }, [inventoryData, supplierData, procurementData, logisticsData]);

  // 6. INTELLIGENCE MATRIX
  const matrix = [
    { name: 'Inventory', status: inventoryData.status, issues: inventoryData.critical, total: inventoryData.total },
    { name: 'Suppliers', status: supplierData.status, issues: supplierData.riskCount, total: supplierData.total },
    { name: 'Procurement', status: procurementData.status, issues: procurementData.overdue, total: procurementData.total },
    { name: 'Logistics', status: logisticsData.status, issues: logisticsData.delayed, total: logisticsData.total },
    { name: 'Inbound', status: logisticsData.active > 0 ? 'MONITOR' : 'NO DATA', issues: logisticsData.delayed, total: logisticsData.active },
    { name: 'Outbound', status: 'NO DATA', issues: 0, total: 0 },
    { name: 'Demand', status: 'NO DATA', issues: 0, total: 0 }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'WARNING': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'MONITOR': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
      case 'NO DATA': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'HEALTHY':
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  // 8. ORION ASSESSMENT & 9. ROOT CAUSE CHAIN
  const primaryIssue = criticalExceptions.length > 0 ? criticalExceptions[0] : null;
  
  const rootCauseChain = useMemo(() => {
    if (!primaryIssue) return null;
    const chain = [];
    
    // Find related entities based on entityId (assume it's a SKU for stock outs)
    if (primaryIssue.type.includes('Stock') || primaryIssue.type.includes('Inventory')) {
      const sku = primaryIssue.entityId;
      chain.push({ type: 'Inventory', id: sku });
      
      const relatedPO = purchaseOrders.find(p => p.lines.some(l => l.productId === sku) && !['Received', 'Cancelled'].includes(p.status));
      if (relatedPO) {
        chain.push({ type: 'PO', id: relatedPO.id });
        const relatedShipment = shipments.find(s => s.poId === relatedPO.id);
        if (relatedShipment) {
          chain.push({ type: 'Shipment', id: relatedShipment.id });
          if (relatedShipment.delayDays > 0) chain.push({ type: 'Exception', id: 'Carrier Delay' });
        }
        const supplier = suppliers.find(s => s.id === relatedPO.supplierId);
        if (supplier && supplier.score < 70) chain.push({ type: 'Supplier', id: supplier.name });
      }
    }
    return chain.length > 1 ? chain : null;
  }, [primaryIssue, purchaseOrders, shipments, suppliers]);

  // 13. ACTION CENTER (Derived from Exceptions)
  const actions = exceptions.slice(0, 3).map((e, i) => ({
    id: \`ACT-\${i}\`,
    issue: e.type,
    entity: e.entityId,
    recommendation: e.recommendedAction || 'Investigate root cause and update planning parameters.',
    status: i === 0 ? 'PROPOSED' : 'AWAITING APPROVAL',
    priority: e.severity,
    impact: e.estimatedImpact
  }));

  // 7. SUPPLY CHAIN FLOW
  const flowNodes = [
    { name: 'SUPPLIERS', val: supplierData.total > 0 ? \`\${supplierData.total} / \${supplierData.riskCount} RISK\` : 'NO DATA', active: supplierData.total > 0 },
    { name: 'INBOUND', val: logisticsData.active > 0 ? \`\${logisticsData.active} ACTIVE / \${logisticsData.delayed} DELAY\` : 'NO DATA', active: logisticsData.active > 0 },
    { name: 'WAREHOUSES', val: 'NO DATA', active: false },
    { name: 'INVENTORY', val: inventoryData.total > 0 ? \`\${inventoryData.total} SKUs / \${inventoryData.critical} CRITICAL\` : 'NO DATA', active: inventoryData.total > 0 },
    { name: 'ORDERS', val: procurementData.total > 0 ? \`\${procurementData.open} OPEN\` : 'NO DATA', active: procurementData.total > 0 },
    { name: 'OUTBOUND', val: 'NO DATA', active: false },
    { name: 'CUSTOMERS', val: 'NO DATA', active: false }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* 16. SYSTEM STATUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-light text-slate-100 tracking-wide">COMMAND CENTER</h2>
          <p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">ORION-9: AI SUPPLY CHAIN OPERATING SYSTEM</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OPERATIONAL
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
            <div className="text-6xl font-mono text-slate-100 tracking-tighter">{overallHealth}</div>
            <div className="text-sm font-mono text-cyan-500 mb-2">/ 100</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {[
              { label: 'INVENTORY', data: inventoryData, path: '/inventory' },
              { label: 'SUPPLIER', data: supplierData, path: '/suppliers' },
              { label: 'PROCUREMENT', data: procurementData, path: '/procurement' },
              { label: 'LOGISTICS', data: logisticsData, path: '/shipments' }
            ].map((k) => (
              <div key={k.label} onClick={() => navigate(k.path)} className="cursor-pointer hover:bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/10 transition-colors group/item">
                <div className="text-[10px] text-slate-500 mb-1">{k.label}</div>
                {k.data.score !== null ? (
                  <div className="text-lg font-mono text-slate-300 group-hover/item:text-cyan-400 transition-colors">{k.data.score}</div>
                ) : (
                  <div className="text-xs font-mono text-slate-600 mt-1">NO DATA</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ORION ASSESSMENT */}
        <div className="col-span-1 lg:col-span-2 bg-[#020408]/50 border border-white/5 p-6 rounded-sm relative">
           <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-4 flex items-center gap-2">
             <BrainCircuit size={14} />
             ORION AI ASSESSMENT
           </div>
           
           {primaryIssue ? (
             <div className="space-y-4">
               <div>
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Primary Issue</div>
                 <div className="text-lg text-rose-400 font-medium">{primaryIssue.type} on {primaryIssue.entityId}</div>
               </div>
               
               {rootCauseChain && (
                 <div className="bg-white/5 p-3 rounded-sm border border-white/10">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Network size={12} />
                      ROOT CAUSE CHAIN DETECTED
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {rootCauseChain.map((node, i) => (
                        <React.Fragment key={i}>
                          <div className="px-2 py-1 bg-black/40 border border-white/10 rounded-sm text-[10px] font-mono text-slate-300 whitespace-nowrap">
                            <span className="text-slate-500 mr-1">{node.type}:</span>{node.id}
                          </div>
                          {i < rootCauseChain.length - 1 && <ArrowRight size={10} className="text-slate-600" />}
                        </React.Fragment>
                      ))}
                    </div>
                 </div>
               )}

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
                 <div className="text-xs text-cyan-300">{primaryIssue.recommendedAction || 'Execute root cause analysis and mitigate supply delay.'}</div>
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
          {flowNodes.map((node, i, arr) => (
            <React.Fragment key={node.name}>
              <div className={\`flex-shrink-0 bg-black/40 border \${node.active ? 'border-white/10 hover:border-cyan-500/50 cursor-pointer' : 'border-white/5 opacity-50'} px-4 py-3 rounded-sm flex flex-col items-center justify-center transition-colors group min-w-[120px]\`}>
                <span className={\`text-[10px] font-mono tracking-widest \${node.active ? 'text-slate-400 group-hover:text-cyan-400' : 'text-slate-600'} transition-colors\`}>{node.name}</span>
                <span className={\`text-[10px] font-mono mt-1 \${node.val === 'NO DATA' ? 'text-slate-600' : 'text-slate-300'}\`}>{node.val}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 text-slate-600">
                  <ArrowRight size={14} className={node.active && arr[i+1].active ? 'animate-pulse text-slate-400' : 'opacity-30'} />
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
               <span className="text-xs text-slate-400">Datasets Loaded</span>
               <span className="text-xs font-mono text-cyan-400">{datasetsLoaded}</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Enterprise Systems</span>
               <span className="text-xs font-mono text-slate-500">0 CONNECTED</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">File Sources</span>
               <span className="text-xs font-mono text-slate-300">{fileSources} IMPORTED</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Total Records</span>
               <span className="text-xs font-mono text-slate-300">{formatNumber(totalRecords)}</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Data Quality</span>
               <span className="text-xs font-mono text-emerald-400">{dataQualityScore} / 100</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-white/5">
               <span className="text-xs text-slate-400">Critical Events</span>
               <span className="text-xs font-mono text-rose-400">{criticalExceptions.length}</span>
             </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-600 font-mono">LAST UPDATE: {lastDataUpdate}</div>
        </div>

        {/* ORION INTELLIGENCE MATRIX */}
        <div className="col-span-1 lg:col-span-3 bg-[#020408]/50 border border-white/5 p-4 rounded-sm">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">INTELLIGENCE MATRIX</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {matrix.map((m) => (
               <div key={m.name} className="bg-black/40 border border-white/5 p-4 rounded-sm flex flex-col justify-between group hover:border-white/10 transition-colors cursor-pointer">
                 <div className="text-xs text-slate-300 uppercase tracking-widest">{m.name}</div>
                 <div className="mt-3 flex justify-between items-end">
                   {m.status !== 'NO DATA' ? (
                     <div className="text-lg font-mono text-slate-100">
                       {m.issues} <span className="text-[10px] text-slate-500 tracking-widest">ISSUES</span>
                     </div>
                   ) : (
                     <div className="text-xs font-mono text-slate-600">DATA NOT CONFIGURED</div>
                   )}
                   <div className={\`text-[10px] uppercase font-mono px-2 py-1 border rounded-sm \${getStatusColor(m.status)}\`}>
                     {m.status}
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* ACTION CENTER */}
      {actions.length > 0 && (
        <div className="bg-[#020408]/50 border border-white/5 rounded-sm p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">ACTION CENTER</div>
            <button onClick={() => navigate('/exceptions')} className="text-xs text-cyan-500 hover:text-cyan-400 uppercase tracking-widest">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/40">
                  <th className="p-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Issue</th>
                  <th className="p-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="p-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Recommendation</th>
                  <th className="p-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {actions.map(act => (
                  <tr key={act.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <span className={\`text-[10px] uppercase font-mono px-2 py-1 rounded-sm border \${
                        act.status === 'PROPOSED' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }\`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-300">{act.issue}</td>
                    <td className="p-3 text-xs font-mono text-slate-400">{act.entity}</td>
                    <td className="p-3 text-xs text-slate-400">{act.recommendation}</td>
                    <td className="p-3 text-xs font-mono text-slate-300">{formatCurrency(act.impact, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
`
fs.writeFileSync('src/components/Dashboard.tsx', content);
