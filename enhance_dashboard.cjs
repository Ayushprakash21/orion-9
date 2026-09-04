const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add import
content = content.replace("import { RootCauseEngine } from '../services/RootCauseEngine';", "import { RootCauseEngine } from '../services/RootCauseEngine';\nimport { PriorityEngine } from '../services/PriorityEngine';");

// Add data extraction
const oldMemo = `// 3. LOGISTICS HEALTH`;
const newMemo = `
  const priorities = useMemo(() => {
    return PriorityEngine.getDailyPriorities(inventory, purchaseOrders, shipments, suppliers, exceptions, actions);
  }, [inventory, purchaseOrders, shipments, suppliers, exceptions, actions]);

  // 3. LOGISTICS HEALTH`;
content = content.replace(oldMemo, newMemo);

// Create the new layout section right before System Awareness Panel
const beforeSystemAwareness = `      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SYSTEM AWARENESS PANEL */}`;
        
const controlTowerUI = `
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

           <div className="space-y-3">
             <div className="text-[10px] uppercase tracking-wider text-[#FF9F0A] font-semibold flex items-center gap-1"><CheckCircle2 size={12}/> Actions Requiring Approval</div>
             {priorities.pendingActions.map(a => (
               <div key={a.id} className="bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#777777]" onClick={() => openEntity('action', a.id)}>
                 <div className="text-[10px] text-[#B3B3B3] font-mono truncate">{a.issue}</div>
                 <div className="text-xs font-medium text-[#F5F5F5] truncate mt-1">{a.recommendation}</div>
                 <div className="text-[10px] text-[#FF9F0A] font-mono mt-1">{a.status}</div>
               </div>
             ))}
             {priorities.pendingActions.length === 0 && <div className="text-xs text-[#777777]">No pending actions.</div>}
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SYSTEM AWARENESS PANEL */}`;
content = content.replace(beforeSystemAwareness, controlTowerUI);

fs.writeFileSync(file, content);
console.log("Dashboard enhanced with priorities");
