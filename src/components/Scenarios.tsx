import React, { useState, useMemo } from 'react';
import { Workflow, Play, Plus, Server, Database, ArrowRight, TrendingDown, AlertTriangle, CheckCircle2, RefreshCw, FileText, Layers, ExternalLink, HelpCircle, X, ShieldAlert } from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { useToast } from '../store/ToastContext';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/formatters';

interface ScenarioDefinition {
  id: string;
  name: string;
  type: 'Supplier Delay' | 'Demand Spike' | 'Port Congestion' | 'Custom';
  params: {
    delayDays?: number;
    demandIncreasePercent?: number;
    portName?: string;
  };
  description: string;
  createdAt: string;
}

interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  executedAt: string;
  affectedSkusCount: number;
  affectedPosCount: number;
  newStockoutsCount: number;
  financialExposure: number;
  riskIncreasePercent: number;
  affectedInventory: any[];
  affectedPos: any[];
  affectedShipments: any[];
  status: 'READY' | 'RUNNING' | 'COMPLETE' | 'FAILED';
}

export const Scenarios: React.FC = () => {
  const { inventory, purchaseOrders, shipments, suppliers, settings, dataMode, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const { showToast } = useToast();

  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([
    {
      id: 'sc-1',
      name: 'Global Supplier Delay',
      type: 'Supplier Delay',
      params: { delayDays: 7 },
      description: 'Simulate a 7-day global supplier delay across all inbound shipments and open purchase orders.',
      createdAt: '2026-08-01'
    },
    {
      id: 'sc-2',
      name: 'Q3 Demand Spike Surge',
      type: 'Demand Spike',
      params: { demandIncreasePercent: 50 },
      description: 'Simulate a sudden 50% increase in daily customer demand across inventory SKUs.',
      createdAt: '2026-08-05'
    },
    {
      id: 'sc-3',
      name: 'Mumbai Port Congestion',
      type: 'Port Congestion',
      params: { portName: 'Mumbai', delayDays: 14 },
      description: 'Simulate a 14-day customs and logistics hold on all shipments routing through Mumbai port.',
      createdAt: '2026-08-10'
    }
  ]);

  const [activeScenarioId, setActiveScenarioId] = useState<string>('sc-1');
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAffectedModal, setShowAffectedModal] = useState(false);
  const [showOrionModal, setShowOrionModal] = useState(false);

  // New scenario form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Supplier Delay' | 'Demand Spike' | 'Port Congestion' | 'Custom'>('Supplier Delay');
  const [newParamVal, setNewParamVal] = useState(7);
  const [newDesc, setNewDesc] = useState('');

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  const currentResult = simulationResults[activeScenarioId];

  const handleExecute = () => {
    if (isExecuting) return;
    setIsExecuting(true);
    showToast(`Executing simulation for "${activeScenario.name}"...`, 'info', 'Simulation Started');

    // Update result status to running
    setSimulationResults(prev => ({
      ...prev,
      [activeScenarioId]: {
        scenarioId: activeScenario.id,
        scenarioName: activeScenario.name,
        executedAt: '',
        affectedInventory: [],
        affectedPos: [],
        affectedShipments: [],
        financialExposure: 0,
        riskIncreasePercent: 0,
        affectedSkusCount: 0,
        affectedPosCount: 0,
        newStockoutsCount: 0,
        status: 'RUNNING'
      }
    }));

    setTimeout(() => {
      try {
        let affectedSkus = 0;
        let affectedPos = 0;
        let newStockouts = 0;
        let financialExposure = 0;
        let riskIncrease = 15;
        let affectedInvList: any[] = [];
        let affectedPoList: any[] = [];
        let affectedShpList: any[] = [];

        if (activeScenario.type === 'Supplier Delay') {
          const delay = activeScenario.params.delayDays || 7;
          affectedPoList = purchaseOrders.filter(po => po.status !== 'Received' && po.status !== 'Cancelled');
          affectedPos = affectedPoList.length;
          
          affectedInvList = inventory.filter(item => {
            const avgDemand = item.averageDailyDemand || 1;
            const currentDays = item.onHand / avgDemand;
            return currentDays < (10 + delay);
          });
          affectedSkus = affectedInvList.length;
          newStockouts = inventory.filter(item => (item.onHand / (item.averageDailyDemand || 1)) < delay).length;
          
          financialExposure = affectedPoList.reduce((sum, po) => sum + (po.totalValue || 0), 0) +
                              affectedInvList.reduce((sum, inv) => sum + (inv.onHand * inv.unitCost || 0), 0);
          riskIncrease = Math.min(85, delay * 3.5);
        } else if (activeScenario.type === 'Demand Spike') {
          const pct = activeScenario.params.demandIncreasePercent || 50;
          const mult = 1 + pct / 100;

          affectedInvList = inventory.filter(item => {
            const projectedDemand = (item.averageDailyDemand || 1) * mult;
            const projectedDays = item.onHand / projectedDemand;
            return projectedDays < (settings.criticalStockOutDays || 5);
          });
          affectedSkus = affectedInvList.length;
          newStockouts = affectedSkus;
          affectedPoList = purchaseOrders.filter(po => po.status === 'Submitted' || po.status === 'Approved');
          affectedPos = affectedPoList.length;

          financialExposure = affectedInvList.reduce((sum, inv) => sum + (inv.onHand * inv.unitCost || 0) * 1.2, 0);
          riskIncrease = Math.min(95, pct * 0.8);
        } else if (activeScenario.type === 'Port Congestion') {
          const delay = activeScenario.params.delayDays || 14;
          const port = activeScenario.params.portName || 'Mumbai';

          affectedShpList = shipments.filter(s => s.status === 'In Transit' || s.status === 'Delayed');
          affectedInvList = inventory.slice(0, Math.min(inventory.length, 12));
          affectedSkus = affectedInvList.length;
          affectedPoList = purchaseOrders.slice(0, Math.min(purchaseOrders.length, 8));
          affectedPos = affectedPoList.length;
          newStockouts = Math.floor(affectedSkus * 0.4);

          financialExposure = affectedShpList.reduce((sum, s) => sum + (s.freightCost || 1000) * 10, 50000);
          riskIncrease = 42;
        } else {
          affectedInvList = inventory.slice(0, 5);
          affectedSkus = affectedInvList.length;
          affectedPos = 3;
          newStockouts = 2;
          financialExposure = 125000;
          riskIncrease = 25;
        }

        const result: SimulationResult = {
          scenarioId: activeScenario.id,
          scenarioName: activeScenario.name,
          executedAt: new Date().toLocaleTimeString(),
          affectedSkusCount: affectedSkus,
          affectedPosCount: affectedPos,
          newStockoutsCount: newStockouts,
          financialExposure,
          riskIncreasePercent: riskIncrease,
          affectedInventory: affectedInvList,
          affectedPos: affectedPoList,
          affectedShipments: affectedShpList,
          status: 'COMPLETE'
        };

        setSimulationResults(prev => ({ ...prev, [activeScenarioId]: result }));
        setIsExecuting(false);
        showToast('Simulation successfully completed. Review impact metrics below.', 'success', 'Simulation Complete');
      } catch (err) {
        setIsExecuting(false);
        setSimulationResults(prev => ({
          ...prev,
          [activeScenarioId]: {
            ...(prev[activeScenarioId] || {
              scenarioId: activeScenario.id,
              scenarioName: activeScenario.name,
              executedAt: '',
              affectedSkusCount: 0,
              affectedPosCount: 0,
              newStockoutsCount: 0,
              financialExposure: 0,
              riskIncreasePercent: 0,
              affectedInventory: [],
              affectedPos: [],
              affectedShipments: []
            }),
            status: 'FAILED'
          }
        }));
        showToast('Simulation execution failed due to data constraints.', 'error', 'Simulation Error');
      }
    }, 1200);
  };

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Scenario name is required.', 'error');
      return;
    }

    const newSc: ScenarioDefinition = {
      id: `sc-${Date.now()}`,
      name: newName,
      type: newType,
      params: newType === 'Supplier Delay' ? { delayDays: newParamVal } :
              newType === 'Demand Spike' ? { demandIncreasePercent: newParamVal } :
              { portName: 'Default Port', delayDays: newParamVal },
      description: newDesc || `Custom simulation scenario testing ${newType}.`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setScenarios(prev => [...prev, newSc]);
    setActiveScenarioId(newSc.id);
    setShowNewModal(false);
    setNewName('');
    showToast('New scenario created and saved successfully.', 'success');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Scenario Engine</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#1B1B1B] text-[#B3B3B3] border border-[#2A2A2A] rounded">
              SIMULATION BASED ON: {dataMode === 'real' ? 'REAL DATA' : 'DEMO DATA'}
            </span>
          </div>
          <p className="text-xs text-[#777777] mt-1 hidden sm:block">Simulate supply chain shocks, supplier delays, and demand spikes without affecting live operational state.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-[#202020] transition-colors cursor-pointer"
          >
            <Plus size={14} />
            New Scenario
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Saved Simulations Sidebar */}
        <div className="col-span-1 space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Saved Simulations</div>
          <div className="space-y-3">
            {scenarios.map(sc => {
              const res = simulationResults[sc.id];
              return (
                <div 
                  key={sc.id} 
                  onClick={() => setActiveScenarioId(sc.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                    activeScenarioId === sc.id 
                      ? 'bg-[#1B1B1B] border-[#777777]' 
                      : 'bg-[#151515] border-[#2A2A2A] hover:border-[#777777]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-[#F5F5F5]">{sc.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#111111] border border-[#2A2A2A] rounded-md text-[#B3B3B3]">
                      {sc.type === 'Supplier Delay' ? `+${sc.params.delayDays}d` :
                       sc.type === 'Demand Spike' ? `+${sc.params.demandIncreasePercent}%` :
                       `${sc.params.portName} (${sc.params.delayDays}d)`}
                    </span>
                  </div>
                  <p className="text-xs text-[#777777] mb-3 line-clamp-2">{sc.description}</p>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#777777]">Status:</span>
                    <span className={`uppercase px-2 py-0.5 rounded border ${
                      res?.status === 'COMPLETE' ? 'bg-[#111111] text-[#30D158] border-[#2A2A2A]' :
                      res?.status === 'RUNNING' ? 'bg-[#111111] text-[#FF9F0A] border-[#2A2A2A]' :
                      'bg-[#111111] text-[#777777] border-[#2A2A2A]'
                    }`}>
                      {res?.status || 'READY'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Scenario Configuration & Results */}
        <div className="col-span-1 md:col-span-2 bg-[#151515] border border-[#2A2A2A] p-4 sm:p-6 rounded-xl flex flex-col justify-between">
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-[#2A2A2A]">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-[#111111] border border-[#2A2A2A] flex items-center justify-center text-[#B3B3B3]">
                   <Workflow size={18} />
                 </div>
                 <div>
                   <div className="text-base font-medium text-[#F5F5F5]">{activeScenario.name}</div>
                   <div className="text-[10px] text-[#30D158] font-mono uppercase tracking-wider mt-0.5">
                     Simulation Environment Isolated
                   </div>
                 </div>
               </div>
               
               <div className="flex gap-2 w-full sm:w-auto">
                 {currentResult?.status === 'COMPLETE' && (
                   <button 
                     onClick={() => {
                       setSimulationResults(prev => {
                         const copy = { ...prev };
                         delete copy[activeScenarioId];
                         return copy;
                       });
                       showToast('Simulation reset to ready state.', 'info');
                     }}
                     className="px-3 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#777777] hover:text-[#F5F5F5] rounded-lg text-xs uppercase tracking-wider transition-colors"
                   >
                     Reset
                   </button>
                 )}
                 <button 
                   onClick={handleExecute}
                   disabled={isExecuting}
                   className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-[#202020] transition-colors disabled:opacity-50 cursor-pointer"
                 >
                   <Play size={14} className={isExecuting ? 'animate-pulse' : ''} />
                   {isExecuting ? 'Running Simulation...' : currentResult?.status === 'COMPLETE' ? 'Run Again' : 'Execute'}
                 </button>
               </div>
             </div>

             {/* Scenario Assumptions Parameter Panel */}
             <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl space-y-3">
               <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Scenario Assumptions</div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                 <div className="flex justify-between p-2 bg-[#151515] rounded border border-[#2A2A2A]">
                   <span className="text-[#777777]">Scenario Type:</span>
                   <span className="text-[#F5F5F5]">{activeScenario.type}</span>
                 </div>
                 <div className="flex justify-between p-2 bg-[#151515] rounded border border-[#2A2A2A]">
                   <span className="text-[#777777]">Primary Parameter:</span>
                   <span className="text-[#30D158]">
                     {activeScenario.type === 'Supplier Delay' ? `${activeScenario.params.delayDays || 7} Days Delay` :
                      activeScenario.type === 'Demand Spike' ? `+${activeScenario.params.demandIncreasePercent || 50}% Demand` :
                      `${activeScenario.params.portName || 'Port'} (${activeScenario.params.delayDays || 14}d Hold)`}
                   </span>
                 </div>
               </div>
               <p className="text-xs text-[#B3B3B3] font-mono">{activeScenario.description}</p>
             </div>

             {/* Result Metrics Grid */}
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Simulation Impact Analysis</div>
                 {currentResult?.status === 'COMPLETE' && (
                   <button 
                     onClick={() => setShowAffectedModal(true)}
                     className="text-xs font-mono text-[#30D158] hover:underline flex items-center gap-1 cursor-pointer"
                   >
                     View Affected Records ({currentResult.affectedSkusCount + currentResult.affectedPosCount}) <ExternalLink size={12} />
                   </button>
                 )}
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                 <div className="bg-[#111111] p-4 border border-[#2A2A2A] rounded-lg text-center">
                   <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Affected SKUs</div>
                   <div className="text-xl font-mono text-[#F5F5F5]">
                     {currentResult?.status === 'COMPLETE' ? formatNumber(currentResult.affectedSkusCount) : '--'}
                   </div>
                 </div>
                 <div className="bg-[#111111] p-4 border border-[#2A2A2A] rounded-lg text-center">
                   <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Affected POs</div>
                   <div className="text-xl font-mono text-[#F5F5F5]">
                     {currentResult?.status === 'COMPLETE' ? formatNumber(currentResult.affectedPosCount) : '--'}
                   </div>
                 </div>
                 <div className="bg-[#111111] p-4 border border-[#2A2A2A] rounded-lg text-center">
                   <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">New Stockouts</div>
                   <div className="text-xl font-mono text-[#FF453A]">
                     {currentResult?.status === 'COMPLETE' ? formatNumber(currentResult.newStockoutsCount) : '--'}
                   </div>
                 </div>
                 <div className="bg-[#111111] p-4 border border-[#2A2A2A] rounded-lg text-center">
                   <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">Financial Exposure</div>
                   <div className="text-xl font-mono text-[#F5F5F5]">
                     {currentResult?.status === 'COMPLETE' ? formatCurrency(currentResult.financialExposure, currency) : '--'}
                   </div>
                 </div>
               </div>
             </div>

             {/* Execution Status / Empty / Completed State */}
             {isExecuting ? (
               <div className="flex flex-col items-center justify-center py-12 text-[#777777] space-y-3">
                  <RefreshCw size={28} className="animate-spin text-[#30D158]" />
                  <p className="text-xs font-mono uppercase tracking-wider">Running simulation across inventory & supply graph...</p>
               </div>
             ) : currentResult?.status === 'COMPLETE' ? (
               <div className="bg-[#111111] border border-[#2A2A2A] p-4 rounded-xl space-y-3">
                 <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2 text-[#30D158] text-xs font-mono uppercase">
                     <CheckCircle2 size={14} />
                     Simulation Complete ({currentResult.executedAt})
                   </div>
                   <button 
                     onClick={() => setShowOrionModal(true)}
                     className="px-3 py-1.5 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded text-xs font-mono uppercase tracking-wider hover:bg-[#202020] transition-colors cursor-pointer"
                   >
                     Ask ORION AI Analysis
                   </button>
                 </div>
                 <p className="text-xs text-[#B3B3B3] font-mono leading-relaxed">
                   Simulation projects a <span className="text-[#FF9F0A] font-bold">+{currentResult.riskIncreasePercent}%</span> risk increase in network stability. {currentResult.newStockoutsCount} inventory items require preemptive safety stock buffers or expedited re-routing.
                 </p>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-12 text-[#777777]">
                  <Database size={32} className="mb-4 opacity-50" />
                  <p className="text-xs font-mono">Click Execute to run the simulation across the current active data model.</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* New Scenario Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
              <h3 className="text-base font-medium text-[#F5F5F5]">Create New Scenario</h3>
              <button onClick={() => setShowNewModal(false)} className="text-[#777777] hover:text-[#F5F5F5]">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateScenario} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#777777] mb-1">Scenario Name</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. European Supplier Strike"
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#777777]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#777777] mb-1">Scenario Type</label>
                <select 
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#777777]"
                >
                  <option value="Supplier Delay">Supplier Delay</option>
                  <option value="Demand Spike">Demand Spike</option>
                  <option value="Port Congestion">Port Congestion</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#777777] mb-1">
                  {newType === 'Demand Spike' ? 'Demand Increase (%)' : 'Delay Duration (Days)'}
                </label>
                <input 
                  type="number"
                  value={newParamVal}
                  onChange={e => setNewParamVal(Number(e.target.value))}
                  min={1}
                  max={365}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#777777]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#777777] mb-1">Description</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Briefly describe simulation rationale..."
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#777777]"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#777777] hover:text-[#F5F5F5] rounded-lg text-xs uppercase tracking-wider font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-[#202020] transition-colors"
                >
                  Save Scenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Affected Records Modal / Drawer */}
      {showAffectedModal && currentResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
              <div>
                <h3 className="text-base font-medium text-[#F5F5F5]">Affected Records: {currentResult.scenarioName}</h3>
                <p className="text-xs font-mono text-[#777777]">Click any record to inspect details in the enterprise drawer.</p>
              </div>
              <button onClick={() => setShowAffectedModal(false)} className="text-[#777777] hover:text-[#F5F5F5]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] uppercase font-mono text-[#777777] mb-2">Affected Inventory SKUs ({currentResult.affectedInventory.length})</h4>
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-mono text-[#B3B3B3]">
                    <thead>
                      <tr className="border-b border-[#2A2A2A] text-[10px] text-[#777777] uppercase bg-[#151515]">
                        <th className="p-3">Product ID</th>
                        <th className="p-3">Warehouse</th>
                        <th className="p-3 text-right">On Hand</th>
                        <th className="p-3 text-right">Holding Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {currentResult.affectedInventory.map((item, idx) => (
                        <tr 
                          key={item.id || idx}
                          onClick={() => {
                            setShowAffectedModal(false);
                            openEntity({ type: 'inventory', id: item.productId });
                          }}
                          className="hover:bg-[#202020] cursor-pointer transition-colors"
                        >
                          <td className="p-3 text-[#F5F5F5]">{item.productId}</td>
                          <td className="p-3 text-[#777777]">{item.warehouseId}</td>
                          <td className="p-3 text-right text-[#F5F5F5]">{formatNumber(item.onHand)}</td>
                          <td className="p-3 text-right text-[#F5F5F5]">{formatCurrency(item.onHand * item.unitCost || 0, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] uppercase font-mono text-[#777777] mb-2">Affected Purchase Orders ({currentResult.affectedPos.length})</h4>
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-mono text-[#B3B3B3]">
                    <thead>
                      <tr className="border-b border-[#2A2A2A] text-[10px] text-[#777777] uppercase bg-[#151515]">
                        <th className="p-3">PO ID</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {currentResult.affectedPos.map((po, idx) => (
                        <tr 
                          key={po.id || idx}
                          onClick={() => {
                            setShowAffectedModal(false);
                            openEntity({ type: 'po', id: po.id });
                          }}
                          className="hover:bg-[#202020] cursor-pointer transition-colors"
                        >
                          <td className="p-3 text-[#F5F5F5]">{po.id}</td>
                          <td className="p-3 text-[#777777]">{po.supplierId}</td>
                          <td className="p-3 text-[#30D158]">{po.status}</td>
                          <td className="p-3 text-right text-[#F5F5F5]">{formatCurrency(po.totalValue || 0, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowAffectedModal(false)}
                className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-[#202020] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ask ORION AI Analysis Modal */}
      {showOrionModal && currentResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <Workflow size={18} className="text-[#30D158]" />
                <h3 className="text-base font-medium text-[#F5F5F5]">ORION AI Simulation Analysis</h3>
              </div>
              <button onClick={() => setShowOrionModal(false)} className="text-[#777777] hover:text-[#F5F5F5]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-[#B3B3B3]">
              <div className="p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] space-y-1">
                <div className="text-[10px] uppercase text-[#777777]">Executive Summary</div>
                <p className="text-[#F5F5F5] leading-relaxed">
                  Executing <span className="text-[#30D158]">{currentResult.scenarioName}</span> creates immediate downstream vulnerability across {currentResult.affectedSkusCount} SKUs, putting {formatCurrency(currentResult.financialExposure, currency)} of inventory & procurement at risk of disruption.
                </p>
              </div>

              <div className="p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] space-y-1">
                <div className="text-[10px] uppercase text-[#777777]">Key Findings</div>
                <ul className="list-disc list-inside space-y-1 text-[#F5F5F5]">
                  <li>{currentResult.newStockoutsCount} inventory locations will breach critical stock-out thresholds within the forecast window.</li>
                  <li>{currentResult.affectedPosCount} open purchase orders require vendor schedule renegotiation.</li>
                  <li>Estimated network volatility score increased by {currentResult.riskIncreasePercent}%.</li>
                </ul>
              </div>

              <div className="p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] space-y-1">
                <div className="text-[10px] uppercase text-[#777777]">Recommended Mitigations</div>
                <p className="text-[#F5F5F5] leading-relaxed">
                  1. Reroute priority shipments via alternative carriers.<br />
                  2. Pre-allocate buffer stock from regional warehouses.<br />
                  3. Issue expedited re-orders for high-velocity SKUs.
                </p>
              </div>

              <div className="text-[10px] text-[#777777] italic pt-1">
                Note: This is a hypothetical analytical simulation based on current repository state. Real operational records remain unmodified.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowOrionModal(false)}
                className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-[#202020] transition-colors"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
