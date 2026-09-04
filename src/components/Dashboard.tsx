import React, { useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { AnalyticsEngine } from '../services/AnalyticsEngine';
import { SupplierEngine } from '../services/SupplierEngine';
import { RootCauseEngine } from '../services/RootCauseEngine';
import { PriorityEngine } from '../services/PriorityEngine';
import { 
  AlertTriangle, PackageSearch, Truck, ShieldAlert, Activity, 
  Database, Network, BrainCircuit, ArrowRight, ArrowRightLeft, ArrowDown,
  Server, ShieldCheck, Box, ShoppingCart, Users, CheckCircle2, FileSearch, TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { MobileRecordCard } from './MobileRecordCard';
import { LiveSupplyChainFlow } from './LiveSupplyChainFlow';
import { SupplyChainPulse } from './SupplyChainPulse';

export const Dashboard = () => {
  const { 
    products, inventory, suppliers, purchaseOrders, shipments, exceptions, actions, importHistory, currency, settings
  } = useSupplyChain();
  const navigate = useNavigate();
  const { openEntity } = useEntityDrawer();

  const handleNodeClick = (node: { type: string; id: string }) => {
    const typeLower = node.type.toLowerCase();
    if (typeLower === 'inventory') {
      openEntity('inventory', node.id);
    } else if (typeLower === 'po') {
      openEntity('po', node.id);
    } else if (typeLower === 'shipment') {
      openEntity('shipment', node.id);
    } else if (typeLower === 'supplier') {
      const supp = suppliers.find(s => s.name === node.id || s.id === node.id);
      if (supp) openEntity('supplier', supp.id);
    } else if (typeLower === 'exception') {
      if (primaryIssue) openEntity('exception', primaryIssue.id);
    }
  };

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
    if (diffMins < 60) lastDataUpdate = `${diffMins} MINS AGO`;
    else if (diffMins < 1440) lastDataUpdate = `${Math.floor(diffMins/60)} HOURS AGO`;
    else lastDataUpdate = `${Math.floor(diffMins/1440)} DAYS AGO`;
  }

  
  const priorities = useMemo(() => {
    return PriorityEngine.getDailyPriorities(inventory, purchaseOrders, shipments, suppliers, exceptions, actions);
  }, [inventory, purchaseOrders, shipments, suppliers, exceptions, actions]);

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
    const avgScore = suppliers.reduce((sum, s) => sum + (s.score || SupplierEngine.calculateScore(s, settings).score), 0) / suppliers.length;
    const riskCount = suppliers.filter(s => (s.score || SupplierEngine.calculateScore(s, settings).score) < 70).length;
    
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
    { name: 'Inventory', status: inventoryData.status, issues: inventoryData.critical, total: inventoryData.total, path: '/inventory?filter=critical' },
    { name: 'Suppliers', status: supplierData.status, issues: supplierData.riskCount, total: supplierData.total, path: '/suppliers?filter=risk' },
    { name: 'Procurement', status: procurementData.status, issues: procurementData.overdue, total: procurementData.total, path: '/procurement?filter=overdue' },
    { name: 'Logistics', status: logisticsData.status, issues: logisticsData.delayed, total: logisticsData.total, path: '/shipments?filter=delayed' },
    { name: 'Inbound', status: logisticsData.active > 0 ? 'MONITOR' : 'NO DATA', issues: logisticsData.delayed, total: logisticsData.active, path: '/inbound' },
    { name: 'Outbound', status: 'NO DATA', issues: 0, total: 0, path: '/outbound' },
    { name: 'Exceptions', status: criticalExceptions.length > 0 ? 'CRITICAL' : 'HEALTHY', issues: criticalExceptions.length, total: exceptions.length, path: '/exceptions?filter=open' }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'CRITICAL': return 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]';
      case 'WARNING': return 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]';
      case 'MONITOR': return 'bg-[#1B1B1B] text-[#B3B3B3] border-[#2A2A2A]';
      case 'NO DATA': return 'bg-[#111111] text-[#777777] border-[#2A2A2A]';
      case 'HEALTHY':
      default: return 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]';
    }
  };

  // 8. ORION ASSESSMENT & 9. ROOT CAUSE CHAIN
  const primaryIssue = criticalExceptions.length > 0 ? criticalExceptions[0] : null;
  
  const rootCauseChain = useMemo(() => {
    if (!primaryIssue) return null;
    const chain = RootCauseEngine.determineRootCause(primaryIssue, inventory, purchaseOrders, shipments, suppliers, exceptions);
    return chain.length > 1 ? chain.map(c => ({ type: c.type, id: c.id })) : null;
  }, [primaryIssue, inventory, purchaseOrders, shipments, suppliers, exceptions]);

// 13. ACTION CENTER (now from context)

  // 7. SUPPLY CHAIN FLOW
  // Rendered directly in LiveSupplyChainFlow now

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-8 box-border">
      {/* 16. SYSTEM STATUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-[#2A2A2A]">
        <div>
          <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Command Center</h2>
          <p className="text-xs text-[#777777] mt-1">Autonomous decision intelligence & real-time telemetry</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#151515] border border-[#2A2A2A] rounded-md text-xs font-mono text-[#F5F5F5]">
            <span className="w-2 h-2 rounded-full bg-[#30D158]"></span>
            Operational
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        
        {/* SUPPLY CHAIN HEALTH */}
        <div className="col-span-1 bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl relative overflow-hidden group min-w-0">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
            <Activity size={120} />
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-4">Supply Chain Health</div>
          <div className="flex items-end gap-2 mb-6">
            <div className="text-5xl font-mono text-[#F5F5F5] tracking-tighter">{overallHealth}</div>
            <div className="text-sm font-mono text-[#777777] mb-2">/ 100</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            {[
              { label: 'INVENTORY', data: inventoryData, path: '/inventory' },
              { label: 'SUPPLIER', data: supplierData, path: '/suppliers' },
              { label: 'PROCUREMENT', data: procurementData, path: '/procurement' },
              { label: 'LOGISTICS', data: logisticsData, path: '/shipments' }
            ].map((k) => (
              <div key={k.label} title={`Based on: ${k.data.total} records. Data updated: ${lastDataUpdate}.`}
              onClick={() => navigate(k.path)} className="cursor-pointer hover:bg-[#202020] p-3 rounded-lg border border-[#2A2A2A] transition-colors group/item relative bg-[#111111]">
                <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-1">{k.label}</div>
                {k.data.score !== null ? (
                  <div className="text-base font-mono text-[#F5F5F5]">{k.data.score}</div>
                ) : (
                  <div className="text-xs font-mono text-[#555555] mt-1">NO DATA</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ORION ASSESSMENT */}
        <div className="col-span-1 lg:col-span-2 bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl relative min-w-0 max-w-full">
           
          <div className="text-[11px] uppercase tracking-wider text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
             <BrainCircuit size={16} className="text-[#30D158]" />
             ORION Management Cockpit
           </div>
           
           <div className="mb-4 bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
             <div className="text-[10px] text-[#777777] uppercase font-mono mb-1">What Requires Management Attention?</div>
             <p className="text-sm text-[#F5F5F5]">
               {primaryIssue ? `Critical ${primaryIssue.type.toLowerCase()} threatening ${primaryIssue.entityId} requires immediate approval. Estimated financial exposure: ${formatCurrency(primaryIssue.estimatedImpact, currency)}.` : 'No critical issues require management intervention at this time.'}
             </p>
           </div>

           
           {primaryIssue ? (
             <div className="space-y-4 w-full min-w-0 max-w-full">
               <div>
                 <div className="text-xs text-[#777777] uppercase tracking-wider mb-1">Primary Issue</div>
                 <div className="text-base text-[#FF453A] font-medium truncate" title={`${primaryIssue.type} on ${primaryIssue.entityId}`}>{primaryIssue.type} on {primaryIssue.entityId}</div>
               </div>
               
               {rootCauseChain && (
                 <div className="bg-[#111111] p-3.5 rounded-lg border border-[#2A2A2A] w-full min-w-0 max-w-full box-border overflow-visible">
                    <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <Network size={12} className="text-[#B3B3B3] shrink-0" />
                      <span>Root Cause Chain Detected</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5 w-full min-w-0">
                      {rootCauseChain.map((node, i) => (
                        <div key={i} className="inline-flex items-center gap-2 max-w-full min-w-0">
                          <div 
                            onClick={() => handleNodeClick(node)}
                            className="px-2.5 py-1 bg-[#151515] border border-[#2A2A2A] hover:border-[#777777] cursor-pointer rounded-md text-[11px] font-mono text-[#F5F5F5] transition-colors max-w-full min-w-0 flex items-center"
                            title={`${node.type}: ${node.id}`}
                          >
                            <span className="text-[#777777] mr-1 select-none shrink-0">{node.type}:</span>
                            <span className="truncate">{node.id}</span>
                          </div>
                          {i < rootCauseChain.length - 1 && (
                            <ArrowRight size={12} className="text-[#555555] shrink-0 select-none" />
                          )}
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#111111] p-3.5 border border-[#2A2A2A] rounded-lg">
                   <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-1">Evidence</div>
                   <div className="text-xs text-[#B3B3B3]">{primaryIssue.description}</div>
                 </div>
                 <div className="bg-[#111111] p-3.5 border border-[#2A2A2A] rounded-lg">
                   <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-1">Estimated Impact</div>
                   <div className="text-xs font-mono text-[#F5F5F5]">{formatCurrency(primaryIssue.estimatedImpact, currency)}</div>
                 </div>
               </div>
               <div className="bg-[#111111] p-3.5 border border-[#2A2A2A] rounded-lg">
                 <div className="text-[10px] text-[#777777] uppercase tracking-wider mb-1">Recommended Action</div>
                 <div className="text-xs text-[#F5F5F5]">{primaryIssue.recommendedAction || 'Execute root cause analysis and mitigate supply delay.'}</div>
               </div>
               <div className="flex gap-3 items-center pt-1">
                 <div className="text-[10px] uppercase font-mono px-2.5 py-1 bg-[#1B1B1B] text-[#FF453A] border border-[#2A2A2A] rounded-md">Priority: {primaryIssue.severity}</div>
                 <div className="text-[10px] uppercase font-mono px-2.5 py-1 bg-[#1B1B1B] text-[#30D158] border border-[#2A2A2A] rounded-md">Confidence: High</div>
               </div>
             </div>
           ) : (
             <div className="h-64 flex flex-col items-center justify-center text-[#777777]">
               <ShieldCheck size={32} className="text-[#30D158] mb-2" />
               <p className="text-sm text-[#B3B3B3]">No critical operational issues detected.</p>
             </div>
           )}
        </div>
      </div>

      {/* LIVE SUPPLY CHAIN FLOW */}
      <LiveSupplyChainFlow />

      {/* SUPPLY CHAIN PULSE */}
      <SupplyChainPulse />


      {/* EXECUTIVE CONTROL TOWER */}
      <div className="bg-[#151515] border border-[#2A2A2A] p-6 rounded-xl space-y-6">
         <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
           <h3 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Executive Control Tower</h3>
           <div className="text-[10px] uppercase tracking-wider text-[#30D158] bg-[#1B1B1B] border border-[#2A2A2A] px-2 py-1 rounded">Daily Priorities Loaded</div>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
               <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Financial Exposure</div>
               <div className="text-sm font-mono text-[#FF453A]">{formatCurrency(priorities.metrics.financialExposure, currency)}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
               <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Inventory Value</div>
               <div className="text-sm font-mono text-[#F5F5F5]">{formatCurrency(priorities.metrics.inventoryValue, currency)}</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
               <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Service Level</div>
               <div className="text-sm font-mono text-[#30D158]">{priorities.metrics.serviceLevel}%</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
               <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Supplier OTIF</div>
               <div className="text-sm font-mono text-[#F5F5F5]">{priorities.metrics.supplierOtif}%</div>
            </div>
            <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
               <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Logistics OTIF</div>
               <div className="text-sm font-mono text-[#F5F5F5]">{priorities.metrics.logisticsOtif}%</div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-3">
             <div className="text-[10px] uppercase tracking-wider text-[#FF453A] font-semibold flex items-center gap-1"><ShieldAlert size={12}/> Top Risks</div>
             {priorities.topRisks.map(r => (
               <div key={r.id} className="bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#777777]" onClick={() => openEntity('exception', r.id)}>
                 <div className="text-[10px] text-[#B3B3B3] font-mono truncate">{r.type}</div>
                 <div className="text-xs font-medium text-[#F5F5F5] truncate mt-1">{r.description}</div>
                 <div className="text-[10px] text-[#FF453A] font-mono mt-1">{formatCurrency(r.estimatedImpact, currency)}</div>
               </div>
             ))}
             {priorities.topRisks.length === 0 && <div className="text-xs text-[#777777]">No active risks.</div>}
           </div>
           
           <div className="space-y-3">
             <div className="text-[10px] uppercase tracking-wider text-[#30D158] font-semibold flex items-center gap-1"><TrendingDown size={12}/> Top Opportunities</div>
             {priorities.topOpportunities.map(o => (
               <div key={o.id} className="bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#777777]">
                 <div className="text-[10px] text-[#B3B3B3] font-mono truncate">{o.title}</div>
                 <div className="text-xs font-medium text-[#F5F5F5] truncate mt-1">{o.description}</div>
                 <div className="text-[10px] text-[#30D158] font-mono mt-1">+ {formatCurrency(o.value, currency)} Savings</div>
               </div>
             ))}
           </div>

           
           <div className="space-y-3 h-full flex flex-col">
             <div className="text-[10px] uppercase tracking-wider text-[#FF9F0A] font-semibold flex items-center gap-1"><CheckCircle2 size={12}/> Orion Action Center</div>
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
               {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => {
                 const levelActions = priorities.pendingActions.filter(a => a.priority === level);
                 if (levelActions.length === 0) return null;
                 return (
                   <div key={level} className="space-y-2">
                     <div className="text-[10px] text-[#777777] font-mono tracking-wider">{level} ({levelActions.length})</div>
                     {levelActions.map(a => (
                       <div key={a.id} className="bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#777777]" onClick={() => openEntity('action', a.id)}>
                         <div className="flex justify-between items-start mb-1">
                           <div className="text-[10px] text-[#B3B3B3] font-mono truncate max-w-[70%]">{a.issue}</div>
                           <div className={`text-[9px] font-mono px-1 rounded ${level === 'CRITICAL' ? 'bg-[#FF453A]/20 text-[#FF453A]' : level === 'HIGH' ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' : 'bg-[#30D158]/20 text-[#30D158]'}`}>{level}</div>
                         </div>
                         <div className="text-xs font-medium text-[#F5F5F5] line-clamp-2">{a.recommendation}</div>
                       </div>
                     ))}
                   </div>
                 );
               })}
               {priorities.pendingActions.length === 0 && <div className="text-xs text-[#777777] mt-4">No pending actions. System optimal.</div>}
             </div>
           </div>

         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SYSTEM AWARENESS PANEL */}
        <div className="col-span-1 bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl flex flex-col">
          <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-4">System Awareness</div>
          <div className="space-y-3.5 flex-1 text-xs">
             <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
               <span className="text-[#B3B3B3]">Datasets Loaded</span>
               <span className="font-mono text-[#F5F5F5]">{datasetsLoaded}</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
               <span className="text-[#B3B3B3]">Enterprise Systems</span>
               <span className="font-mono text-[#777777]">0 CONNECTED</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
               <span className="text-[#B3B3B3]">File Sources</span>
               <span className="font-mono text-[#F5F5F5]">{fileSources} IMPORTED</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
               <span className="text-[#B3B3B3]">Total Records</span>
               <span className="font-mono text-[#F5F5F5]">{formatNumber(totalRecords)}</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
               <span className="text-[#B3B3B3]">Data Quality</span>
               <span className="font-mono text-[#30D158]">{dataQualityScore} / 100</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
               <span className="text-[#B3B3B3]">Critical Events</span>
               <span className="font-mono text-[#FF453A]">{criticalExceptions.length}</span>
             </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2A2A2A] text-[10px] text-[#777777] font-mono">LAST UPDATE: {lastDataUpdate}</div>
        </div>

        {/* ORION INTELLIGENCE MATRIX */}
        <div className="col-span-1 lg:col-span-3 bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl">
          <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-4">Intelligence Matrix</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
             {matrix.map((m) => (
               <div key={m.name} onClick={() => m.path && navigate(m.path)} className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-lg flex flex-col justify-between group hover:border-[#777777] transition-colors cursor-pointer">
                 <div className="text-xs text-[#B3B3B3] uppercase tracking-wider font-medium">{m.name}</div>
                 <div className="mt-3 flex justify-between items-end">
                   {m.status !== 'NO DATA' ? (
                     <div className="text-base font-mono text-[#F5F5F5]">
                       {m.issues} <span className="text-[10px] text-[#777777] tracking-wider">ISSUES</span>
                     </div>
                   ) : (
                     <div className="text-xs font-mono text-[#555555]">Not Configured</div>
                   )}
                   <div className={`text-[10px] uppercase font-mono px-2 py-0.5 border rounded-md ${getStatusColor(m.status)}`}>
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
        <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Action Center</div>
            <button onClick={() => navigate('/exceptions')} className="text-xs text-[#B3B3B3] hover:text-[#F5F5F5] uppercase tracking-wider font-medium transition-colors">View All</button>
          </div>
          
          <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
            {actions.map(act => (
              <MobileRecordCard
                key={act.id}
                onClick={() => openEntity('action', act.id)}
                title={act.issue}
                subtitle={act.recommendation}
                statusNode={
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border ${
                    act.status === 'PROPOSED' ? 'bg-[#1B1B1B] text-[#F5F5F5] border-[#2A2A2A]' : 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]'
                  }`}>
                    {act.status}
                  </span>
                }
                fields={[
                  { label: 'Entity', value: act.entity },
                  { label: 'Impact', value: formatCurrency(Number(act.impact), currency) }
                ]}
              />
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#111111] text-[10px] font-mono text-[#777777] uppercase tracking-wider">
                  <th className="p-3">Status</th>
                  <th className="p-3">Issue</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Recommendation</th>
                  <th className="p-3">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-xs">
                {actions.map(act => (
                  <tr key={act.id} onClick={() => openEntity('action', act.id)} className="hover:bg-[#202020] transition-colors cursor-pointer">
                    <td className="p-3">
                      <span className={`text-[10px] uppercase font-mono px-2 py-1 rounded-md border ${
                        act.status === 'PROPOSED' ? 'bg-[#1B1B1B] text-[#F5F5F5] border-[#2A2A2A]' : 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#F5F5F5] font-medium">{act.issue}</td>
                    <td className="p-3 font-mono text-[#B3B3B3]">{act.entity}</td>
                    <td className="p-3 text-[#B3B3B3]">{act.recommendation}</td>
                    <td className="p-3 font-mono text-[#F5F5F5]">{formatCurrency(Number(act.impact), currency)}</td>
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
