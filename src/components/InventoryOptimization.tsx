import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { 
  EchelonNode, 
  SKUBuffer, 
  ReplenishmentOrder, 
  BullwhipMetric, 
  BufferStatus,
  ReplenishmentOrderType
} from '../types/inventoryOptimization';
import {
  Package, Layers, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown,
  Activity, ArrowRight, RefreshCw, Plus, Search, Filter, Eye, Check,
  X, Cpu, Zap, DollarSign, Database, Building2, GitBranch, ArrowLeftRight,
  ShieldAlert, Clock, BarChart3, CheckCircle2, Sliders, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';

export const InventoryOptimization: React.FC = () => {
  const { 
    echelonNodes, 
    skuBuffers, 
    replenishmentOrders, 
    bullwhipMetrics,
    recalculateBuffer,
    generateReplenishmentOrder,
    approveReplenishmentOrder,
    rebalanceEchelonStock,
    currency 
  } = useSupplyChain();
  
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'topology' | 'safety_stock' | 'replenishment' | 'diagnostics'>('topology');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Selected SKU Buffer for Inspector and Variance Tool
  const [selectedBufferId, setSelectedBufferId] = useState<string>(skuBuffers[0]?.id || 'BUF-701-ORD');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectorBuffer, setInspectorBuffer] = useState<SKUBuffer | null>(null);

  // Variance & Safety Stock interactive modeling parameters
  const [interactiveSla, setInteractiveSla] = useState<number>(99.0);
  const [leadTimeVarMultiplier, setLeadTimeVarMultiplier] = useState<number>(1.2);

  // Modal 1: Generate Autonomous Replenishment Requisition
  const [showReplenishModal, setShowReplenishModal] = useState<boolean>(false);
  const [repSku, setRepSku] = useState<string>('SKU-OR9-701');
  const [repType, setRepType] = useState<ReplenishmentOrderType>('STOCK_TRANSFER_ORDER');
  const [repSourceNode, setRepSourceNode] = useState<string>('ECH-001');
  const [repDestNode, setRepDestNode] = useState<string>('ECH-002');
  const [repUnits, setRepUnits] = useState<number>(50);
  const [repUnitCost, setRepUnitCost] = useState<number>(1450);
  const [repUrgency, setRepUrgency] = useState<'ROUTINE' | 'ELEVATED' | 'EXPEDITE_CRITICAL'>('EXPEDITE_CRITICAL');

  // Modal 2: Inter-Echelon STO Transfer
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferSourceBufferId, setTransferSourceBufferId] = useState<string>('BUF-402-MUC');
  const [transferTargetBufferId, setTransferTargetBufferId] = useState<string>('BUF-108-AUS');
  const [transferUnits, setTransferUnits] = useState<number>(15);

  const activeBuffer = useMemo(() => {
    return skuBuffers.find(b => b.id === selectedBufferId) || skuBuffers[0];
  }, [skuBuffers, selectedBufferId]);

  // Operational HUD Metrics
  const hudMetrics = useMemo(() => {
    const totalBuffers = skuBuffers.length;
    const criticalBuffers = skuBuffers.filter(b => b.bufferStatus === 'CRITICAL_RED' || b.bufferStatus === 'STOCKOUT_BLACK');
    const warningBuffers = skuBuffers.filter(b => b.bufferStatus === 'WARNING_YELLOW');
    const healthyBuffers = skuBuffers.filter(b => b.bufferStatus === 'HEALTHY_GREEN');

    const totalWorkingCapital = skuBuffers.reduce((sum, b) => sum + (b.onHandUnits * b.unitCost), 0);
    const capitalAtRisk = criticalBuffers.reduce((sum, b) => sum + (b.calculatedSafetyStock * b.unitCost), 0);

    const pendingOrders = replenishmentOrders.filter(o => o.status === 'PENDING_APPROVAL');
    const totalOrderValue = replenishmentOrders.reduce((sum, o) => sum + o.totalValue, 0);

    const networkHealthPct = totalBuffers > 0 
      ? Math.round(((healthyBuffers.length + warningBuffers.length * 0.7) / totalBuffers) * 1000) / 10 
      : 100;

    return {
      networkHealthPct,
      totalWorkingCapital,
      capitalAtRisk,
      criticalCount: criticalBuffers.length,
      pendingOrdersCount: pendingOrders.length,
      totalOrderValue
    };
  }, [skuBuffers, replenishmentOrders]);

  // Filtered SKU Buffers for Tab 1
  const filteredBuffers = useMemo(() => {
    return skuBuffers.filter(b => {
      const matchesSearch = 
        b.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.skuName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.echelonNodeName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const node = echelonNodes.find(n => n.id === b.echelonNodeId);
      const matchesTier = tierFilter === 'ALL' || node?.tier === tierFilter;
      const matchesStatus = statusFilter === 'ALL' || b.bufferStatus === statusFilter;

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [skuBuffers, echelonNodes, searchQuery, tierFilter, statusFilter]);

  // Dynamic Safety Stock Chart Data for Tab 2
  const varianceChartData = useMemo(() => {
    if (!activeBuffer) return [];
    const D = activeBuffer.avgDailyDemand;
    const sigmaD = activeBuffer.demandStdDev;
    const L = activeBuffer.replenishmentLeadTimeDays;
    const sigmaLT = activeBuffer.leadTimeStdDevDays * leadTimeVarMultiplier;

    // Simulate across varying lead time days (1 to 14)
    return Array.from({ length: 14 }).map((_, idx) => {
      const day = idx + 1;
      const demandDuringLT = Math.round(D * day);
      // Conventional static safety stock (demand variance only)
      const staticSS = Math.round(activeBuffer.zScore * Math.sqrt(day * sigmaD * sigmaD));
      // Multi-echelon dynamic safety stock (joint demand + lead time variance)
      const meioSS = Math.round(activeBuffer.zScore * Math.sqrt((day * sigmaD * sigmaD) + (D * D * sigmaLT * sigmaLT)));

      return {
        day: `Day ${day}`,
        leadTimeDays: day,
        demandDuringLT,
        staticSafetyStock: staticSS,
        meioSafetyStock: meioSS,
        dampenedBuffer: Math.round(meioSS * 0.88),
      };
    });
  }, [activeBuffer, leadTimeVarMultiplier]);

  // Helper for Status Badges
  const renderBufferStatusBadge = (status: BufferStatus) => {
    switch (status) {
      case 'HEALTHY_GREEN':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Healthy Buffer
          </span>
        );
      case 'WARNING_YELLOW':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Reorder Warning
          </span>
        );
      case 'CRITICAL_RED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Critical Stockout Risk
          </span>
        );
      case 'STOCKOUT_BLACK':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-red-950 text-red-300 border border-red-700/50 rounded flex items-center gap-1">
            <ShieldAlert size={12} className="text-red-400" />
            Stockout Depleted
          </span>
        );
      case 'OVERSTOCK_BLUE':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Overstock Buffer
          </span>
        );
    }
  };

  // Actions
  const handleRecalculate = async () => {
    if (!activeBuffer) return;
    try {
      await recalculateBuffer(activeBuffer.id, interactiveSla, leadTimeVarMultiplier);
      showToast(`Successfully recalculated safety stock and ROP for ${activeBuffer.sku}.`, 'success', 'MEIO Buffer Recalculated');
    } catch (err: any) {
      showToast(err.message, 'error', 'Recalculation Failed');
    }
  };

  const handleCreateReplenishment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const srcNode = echelonNodes.find(n => n.id === repSourceNode);
      const destNode = echelonNodes.find(n => n.id === repDestNode);
      const skuItem = skuBuffers.find(b => b.sku === repSku);

      const order = await generateReplenishmentOrder({
        orderType: repType,
        sku: repSku,
        skuName: skuItem?.skuName || 'Quantum Solid-State Sensor Core',
        sourceNodeId: repType === 'STOCK_TRANSFER_ORDER' ? repSourceNode : undefined,
        sourceNodeName: repType === 'STOCK_TRANSFER_ORDER' ? srcNode?.name : undefined,
        destinationNodeId: repDestNode,
        destinationNodeName: destNode?.name || 'Chicago Central Logistics Center',
        requestedUnits: Number(repUnits),
        unitCost: Number(repUnitCost),
        urgency: repUrgency,
      });

      setShowReplenishModal(false);
      showToast(
        `Order ${order.orderNumber} ($${order.totalValue.toLocaleString()}) created with policy compliance.`,
        order.status === 'PENDING_APPROVAL' ? 'warning' : 'success',
        order.status === 'PENDING_APPROVAL' ? 'Order Routed to Unified Approval Center' : 'Autonomous Order Approved'
      );
    } catch (err: any) {
      showToast(err.message, 'error', 'Replenishment Generation Failed');
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const approved = await approveReplenishmentOrder(orderId);
      showToast(`Order ${approved.orderNumber} successfully transmitted to SAP S/4HANA ERP.`, 'success', 'Replenishment Order Approved');
    } catch (err: any) {
      showToast(err.message, 'error', 'Approval Failed');
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await rebalanceEchelonStock(transferSourceBufferId, transferTargetBufferId, Number(transferUnits));
      setShowTransferModal(false);
      showToast(
        `Transferred ${transferUnits} units from ${result.sourceBuffer.echelonNodeName} to ${result.targetBuffer.echelonNodeName}.`,
        'success',
        'Inter-Echelon STO Dispatched'
      );
    } catch (err: any) {
      showToast(err.message, 'error', 'Stock Transfer Failed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#07090E] text-slate-100 overflow-hidden font-sans">
      {/* TOP OPERATIONAL HUD */}
      <div className="flex-none p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                MULTI-ECHELON AUTOPILOT ACTIVE
              </span>
              <span className="text-xs text-slate-400 font-mono">KERNEL POLICY ENGINE POL-MEIO-001 ENFORCED</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <Layers className="text-cyan-400" size={24} />
              Autonomous Replenishment & MEIO Engine
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowReplenishModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition-all"
            >
              <Plus size={15} />
              New Replenishment Requisition
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowLeftRight size={15} className="text-cyan-400" />
              Inter-Echelon STO Transfer
            </button>
          </div>
        </div>

        {/* HUD KPI Cards Row */}
        <div className="max-w-[1700px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Network Buffer Health</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {hudMetrics.networkHealthPct}%
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {skuBuffers.filter(b => b.bufferStatus === 'HEALTHY_GREEN').length} of {skuBuffers.length} buffers green
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Working Capital Managed</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {formatCurrency(hudMetrics.totalWorkingCapital, currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {skuBuffers.reduce((sum, b) => sum + b.onHandUnits, 0).toLocaleString()} physical units on hand
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Critical Stockout Risk SKUs</span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1 flex items-center gap-2">
              {hudMetrics.criticalCount}
              {hudMetrics.criticalCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-sans font-medium">
                  Immediate Action
                </span>
              )}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1">
              {formatCurrency(hudMetrics.capitalAtRisk, currency)} buffer value breached
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">Active Replenishment Pipeline</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {formatCurrency(hudMetrics.totalOrderValue, currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono text-[10px]">
                {hudMetrics.pendingOrdersCount} Pending Approval
              </span>
              <span className="text-slate-400">gated by POL-MEIO-001</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS SEGMENTED CONTROL */}
      <div className="flex-none px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-[1700px] mx-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'topology'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Building2 size={14} />
            Multi-Echelon Topology & Buffers
          </button>

          <button
            onClick={() => setActiveTab('safety_stock')}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'safety_stock'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sliders size={14} />
            Dynamic Safety Stock & Variance Dampener
          </button>

          <button
            onClick={() => setActiveTab('replenishment')}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'replenishment'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Zap size={14} />
            Autonomous Replenishment & STO Orders ({replenishmentOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'diagnostics'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 size={14} />
            Working Capital & Bullwhip Diagnostics
          </button>
        </div>
      </div>

      {/* MAIN TAB CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-[1700px] mx-auto space-y-6">
          
          {/* TAB 1: MULTI-ECHELON TOPOLOGY & BUFFERS */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              {/* Echelon Hierarchy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {echelonNodes.map((node) => (
                  <div 
                    key={node.id} 
                    className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400">{node.code}</span>
                        {node.isDecouplingPoint && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                            Decoupling Point
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{node.name}</h4>
                      <p className="text-[10px] text-slate-400">{node.location}, {node.country}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Capacity Utilization</span>
                        <span className="text-slate-200 font-bold">{node.currentUtilizationPct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            node.currentUtilizationPct > 85 ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${node.currentUtilizationPct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                        <Clock size={11} className="text-cyan-400" />
                        <span>Transit Lead: {node.leadTimeDaysToNextEchelon} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters and Search Bar */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full md:w-96 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU code, description, or echelon node..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
                    <Filter size={13} />
                    <span>Tier:</span>
                    <select
                      value={tierFilter}
                      onChange={(e) => setTierFilter(e.target.value)}
                      className="bg-transparent text-slate-200 focus:outline-none text-xs"
                    >
                      <option value="ALL" className="bg-slate-900">All Tiers</option>
                      <option value="TIER_1_CENTRAL_PLANT" className="bg-slate-900">Tier 1 Central Plant</option>
                      <option value="TIER_2_REGIONAL_DC" className="bg-slate-900">Tier 2 Regional DC</option>
                      <option value="TIER_3_LOCAL_SPOKE" className="bg-slate-900">Tier 3 Local Spoke</option>
                      <option value="TIER_4_FORWARD_BUFFER" className="bg-slate-900">Tier 4 Forward Buffer</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
                    <span>Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent text-slate-200 focus:outline-none text-xs"
                    >
                      <option value="ALL" className="bg-slate-900">All Statuses</option>
                      <option value="HEALTHY_GREEN" className="bg-slate-900">Healthy Buffer</option>
                      <option value="WARNING_YELLOW" className="bg-slate-900">Reorder Warning</option>
                      <option value="CRITICAL_RED" className="bg-slate-900">Critical Red</option>
                      <option value="STOCKOUT_BLACK" className="bg-slate-900">Stockout</option>
                      <option value="OVERSTOCK_BLUE" className="bg-slate-900">Overstock</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SKU Buffers Data Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-mono uppercase text-slate-400">
                        <th className="py-3 px-4">SKU & Item Details</th>
                        <th className="py-3 px-4">Echelon Node</th>
                        <th className="py-3 px-4 text-right">On Hand</th>
                        <th className="py-3 px-4 text-right">In Transit</th>
                        <th className="py-3 px-4 text-right">Safety Stock (SS)</th>
                        <th className="py-3 px-4 text-right">Reorder Point (ROP)</th>
                        <th className="py-3 px-4">Buffer Positioning</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredBuffers.map((buffer) => {
                        const bufferPct = Math.min(100, Math.round((buffer.effectiveStock / (buffer.orderUpToLevel || 100)) * 100));
                        return (
                          <tr 
                            key={buffer.id} 
                            className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedBufferId(buffer.id);
                              setInspectorBuffer(buffer);
                              setIsInspectorOpen(true);
                            }}
                          >
                            <td className="py-3 px-4">
                              <div className="font-mono font-semibold text-cyan-300">{buffer.sku}</div>
                              <div className="text-white font-medium text-[11px]">{buffer.skuName}</div>
                              <div className="text-[10px] text-slate-400">{buffer.category} · {formatCurrency(buffer.unitCost, currency)}/unit</div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="text-slate-200 font-medium">{buffer.echelonNodeName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Lead Time: {buffer.replenishmentLeadTimeDays}d (±{buffer.leadTimeStdDevDays}d)</div>
                            </td>

                            <td className="py-3 px-4 text-right font-mono font-medium text-slate-200">
                              {buffer.onHandUnits.toLocaleString()}
                            </td>

                            <td className="py-3 px-4 text-right font-mono text-cyan-400 font-medium">
                              +{buffer.inTransitUnits.toLocaleString()}
                            </td>

                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                              {buffer.calculatedSafetyStock.toLocaleString()}
                              <span className="block text-[9px] text-slate-400">SLA {buffer.targetSlaPct}%</span>
                            </td>

                            <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">
                              {buffer.reorderPoint.toLocaleString()}
                            </td>

                            <td className="py-3 px-4 w-44">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                  <span>{buffer.effectiveStock} eff.</span>
                                  <span>{bufferPct}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      buffer.bufferStatus === 'CRITICAL_RED' ? 'bg-rose-500' :
                                      buffer.bufferStatus === 'STOCKOUT_BLACK' ? 'bg-red-700' :
                                      buffer.bufferStatus === 'WARNING_YELLOW' ? 'bg-amber-400' :
                                      buffer.bufferStatus === 'OVERSTOCK_BLUE' ? 'bg-blue-400' :
                                      'bg-emerald-400'
                                    }`}
                                    style={{ width: `${Math.max(5, bufferPct)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {renderBufferStatusBadge(buffer.bufferStatus)}
                            </td>

                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedBufferId(buffer.id);
                                    setActiveTab('safety_stock');
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                                  title="Model Variance & Safety Stock"
                                >
                                  <Sliders size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    setInspectorBuffer(buffer);
                                    setIsInspectorOpen(true);
                                  }}
                                  className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 transition-colors"
                                  title="Inspect Buffer Manifest"
                                >
                                  <Eye size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DYNAMIC SAFETY STOCK & VARIANCE DAMPENER */}
          {activeTab === 'safety_stock' && (
            <div className="space-y-6">
              {/* Formula and Control Header */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Multi-Echelon Variance Modeling</span>
                    <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                      <Sliders size={18} className="text-cyan-400" />
                      Dynamic Safety Stock Formula & Lead-Time Variance Dampener
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Models Demand During Lead Time (DDLT) with joint demand standard deviation (<span className="font-mono text-cyan-300">σ_D</span>) and supplier lead-time standard deviation (<span className="font-mono text-cyan-300">σ_LT</span>).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRecalculate}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all"
                    >
                      <RefreshCw size={14} />
                      Recalculate & Persist Buffer
                    </button>
                  </div>
                </div>

                {/* Mathematical Equation Pill */}
                <div className="p-3 bg-slate-950/80 border border-cyan-500/20 rounded-lg flex items-center justify-between flex-wrap gap-3">
                  <div className="font-mono text-xs text-cyan-300 flex items-center gap-2">
                    <span className="text-slate-400">MEIO Equation:</span>
                    <span>SS = Z × √[ L · (σ_D)² + D² · (σ_LT)² ]</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Current Decoupling Factor: <span className="text-emerald-400 font-bold">1.24×</span>
                  </div>
                </div>

                {/* Interactive Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* SKU Buffer Selector */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400">Target SKU Buffer</label>
                    <select
                      value={selectedBufferId}
                      onChange={(e) => setSelectedBufferId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs focus:outline-none"
                    >
                      {skuBuffers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.sku} — {b.skuName} ({b.echelonNodeName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Service Level SLA Slider */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400">
                      <span>Target Service Level (SLA)</span>
                      <span className="text-cyan-400 font-bold">{interactiveSla}% (Z = {interactiveSla >= 99.5 ? '2.58' : interactiveSla >= 99 ? '2.33' : '1.96'})</span>
                    </div>
                    <input
                      type="range"
                      min="90"
                      max="99.9"
                      step="0.5"
                      value={interactiveSla}
                      onChange={(e) => setInteractiveSla(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>90% Standard</span>
                      <span>98.5% Critical</span>
                      <span>99.9% Aerospace</span>
                    </div>
                  </div>

                  {/* Lead-Time Standard Deviation Multiplier */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400">
                      <span>Lead-Time Variance (σ_LT) Multiplier</span>
                      <span className="text-amber-400 font-bold">{leadTimeVarMultiplier}× Volatility</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={leadTimeVarMultiplier}
                      onChange={(e) => setLeadTimeVarMultiplier(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>0.5× Calm Supply</span>
                      <span>1.0× Nominal</span>
                      <span>3.0× Disruption</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart: Simulated Safety Stock vs Conventional Model */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Dynamic MEIO Buffer vs Static Model Curve</h4>
                    <p className="text-xs text-slate-400">Comparing required buffer levels across increasing replenishment lead-time horizons.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      MEIO Safety Stock
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Static Conventional
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      Dampened Decoupling
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={varianceChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="meioGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="staticGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" textAnchor="end" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="meioSafetyStock" name="MEIO Dynamic SS" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#meioGradient)" />
                      <Area type="monotone" dataKey="staticSafetyStock" name="Static SS" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#staticGradient)" />
                      <Area type="monotone" dataKey="dampenedBuffer" name="Dampened Decoupling" stroke="#10b981" strokeWidth={2} fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTONOMOUS REPLENISHMENT & STO ORDERS */}
          {activeTab === 'replenishment' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap size={18} className="text-amber-400" />
                    Autonomous Replenishment Requisitions & Stock Transfer Orders (STO)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Orders generated by AI Autopilot and MEIO dynamic buffer triggers, strictly governed by POL-MEIO-001.
                  </p>
                </div>

                <button
                  onClick={() => setShowReplenishModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} />
                  New Autonomous Requisition
                </button>
              </div>

              {/* Order Cards List */}
              <div className="grid grid-cols-1 gap-3.5">
                {replenishmentOrders.map((order) => {
                  const isPending = order.status === 'PENDING_APPROVAL';
                  const isAutoApproved = order.status === 'AUTO_APPROVED';
                  const isErpTransmitted = order.status === 'TRANSMITTED_TO_ERP';

                  return (
                    <div 
                      key={order.id} 
                      className={`bg-slate-900/60 border rounded-xl p-4 transition-all ${
                        isPending ? 'border-amber-500/40 shadow-lg shadow-amber-950/20' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${
                            order.orderType === 'PURCHASE_REQUISITION' 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {order.orderType === 'PURCHASE_REQUISITION' ? <DollarSign size={18} /> : <ArrowLeftRight size={18} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm">{order.orderNumber}</span>
                              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-slate-800 text-slate-300 rounded border border-slate-700">
                                {order.orderType.replace(/_/g, ' ')}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded ${
                                order.urgency === 'EXPEDITE_CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' :
                                order.urgency === 'ELEVATED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {order.urgency}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium mt-0.5">{order.sku} — {order.skuName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] font-mono uppercase text-slate-400">Total Commitment</span>
                            <div className="text-lg font-mono font-bold text-white">{formatCurrency(order.totalValue, currency)}</div>
                            <span className="text-[10px] text-slate-400">{order.requestedUnits} units @ {formatCurrency(order.unitCost, currency)}</span>
                          </div>

                          {isPending && (
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                            >
                              <CheckCircle2 size={14} />
                              Approve & Push to ERP
                            </button>
                          )}

                          {isErpTransmitted && (
                            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded flex items-center gap-1.5">
                              <Check size={14} />
                              ERP TRANSMITTED
                            </span>
                          )}

                          {isAutoApproved && (
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                            >
                              <ArrowRight size={14} />
                              Transmit to ERP
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Echelon Routing & Policy Clearance */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-slate-400">Source to Destination</span>
                          <div className="text-slate-200 font-medium flex items-center gap-1.5 truncate">
                            <span>{order.sourceNodeName || 'External Vendor Tier-1'}</span>
                            <ArrowRight size={12} className="text-cyan-400 flex-none" />
                            <span className="text-cyan-300">{order.destinationNodeName}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-slate-400">Policy Clearance & AI Engine</span>
                          <div className="text-slate-200 flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded ${
                              order.policyClearance.cleared ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {order.policyClearance.cleared ? 'POL-MEIO-001 Cleared' : 'Approval Gated'}
                            </span>
                            <span className="text-[11px] text-slate-400">Confidence: {order.confidencePct}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{order.policyClearance.reason}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-slate-400">SHA-256 Audit Seal</span>
                          <div className="font-mono text-[10px] text-slate-400 truncate bg-slate-950/60 p-1.5 rounded border border-slate-800">
                            {order.cryptographicSeal}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: WORKING CAPITAL & BULLWHIP DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bullwhip Effect Metrics */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Network Variance Diagnostics</span>
                    <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                      <BarChart3 size={16} className="text-cyan-400" />
                      Bullwhip Ratio & Demand Variance Suppression
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Ratio of order variance to demand variance (<span className="font-mono">Var(Orders) / Var(Demand)</span>) across tiers.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {bullwhipMetrics.map((bw) => (
                      <div key={bw.nodeId} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">{bw.nodeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Demand Var: {bw.demandVariance} · Order Var: {bw.orderVariance}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-sm font-mono font-bold ${
                            bw.bullwhipRatio > 1.3 ? 'text-rose-400' :
                            bw.bullwhipRatio > 1.15 ? 'text-amber-400' :
                            'text-emerald-400'
                          }`}>
                            {bw.bullwhipRatio}× Bullwhip
                          </div>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                            bw.status === 'AMPLIFIED' ? 'bg-rose-500/10 text-rose-400' :
                            bw.status === 'DAMPENING' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {bw.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capital Efficiency & Holding Cost Trade-off */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Financial Optimization</span>
                    <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-400" />
                      Holding Cost vs Stockout Penalty Curve
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Optimal multi-echelon safety stock minimises total cost of capital + stockout penalty.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Total Annual Carrying Cost</span>
                      <div className="text-xl font-bold font-mono text-cyan-400">
                        {formatCurrency(skuBuffers.reduce((sum, b) => sum + b.holdingCostAnnual, 0), currency)}
                      </div>
                      <span className="text-[10px] text-slate-400">Calculated at 22% WACC capital cost</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Stockout Loss Avoidance</span>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {formatCurrency(184000, currency)}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">99.2% Network Fill Rate protected</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2 text-xs text-slate-300">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-cyan-400" />
                      MEIO Strategic Decoupling Advantage
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      By positioning inventory at designated Tier-1 and Tier-2 Decoupling Points (Munich Plant & Chicago CDC), downstream spokes like Austin Spoke absorb customer demand spikes without amplifying purchase orders upstream, suppressing the bullwhip effect by 32%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SLIDE-OUT SKU BUFFER INSPECTOR DRAWER */}
      {isInspectorOpen && inspectorBuffer && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-950/95 border-l border-slate-800 backdrop-blur-2xl shadow-2xl z-50 flex flex-col justify-between">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 rounded border border-cyan-500/20">
                  {inspectorBuffer.sku}
                </span>
                {renderBufferStatusBadge(inspectorBuffer.bufferStatus)}
              </div>
              <h3 className="text-base font-bold text-white mt-1">{inspectorBuffer.skuName}</h3>
              <p className="text-xs text-slate-400">{inspectorBuffer.echelonNodeName}</p>
            </div>

            <button
              onClick={() => setIsInspectorOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
            {/* Stock Quantities Breakdown */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">Inventory Positioning</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">On Hand</span>
                  <div className="text-base font-bold font-mono text-white mt-0.5">{inspectorBuffer.onHandUnits}</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">Committed</span>
                  <div className="text-base font-bold font-mono text-rose-400 mt-0.5">{inspectorBuffer.committedUnits}</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">In Transit</span>
                  <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">+{inspectorBuffer.inTransitUnits}</div>
                </div>
              </div>
            </div>

            {/* Buffer Math & Parameters */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400">Statistical Parameters</span>
              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Daily Demand (D):</span>
                  <span className="text-white font-semibold">{inspectorBuffer.avgDailyDemand} units/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Demand Std Dev (σ_D):</span>
                  <span className="text-cyan-300 font-semibold">±{inspectorBuffer.demandStdDev} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Replenishment Lead Time (L):</span>
                  <span className="text-white font-semibold">{inspectorBuffer.replenishmentLeadTimeDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lead Time Std Dev (σ_LT):</span>
                  <span className="text-amber-400 font-semibold">±{inspectorBuffer.leadTimeStdDevDays} days</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Target SLA / Z-Score:</span>
                  <span className="text-emerald-400 font-semibold">{inspectorBuffer.targetSlaPct}% (Z={inspectorBuffer.zScore})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Calculated Safety Stock (SS):</span>
                  <span className="text-cyan-400 font-bold">{inspectorBuffer.calculatedSafetyStock} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reorder Point (ROP):</span>
                  <span className="text-amber-400 font-bold">{inspectorBuffer.reorderPoint} units</span>
                </div>
              </div>
            </div>

            {/* Actions in Drawer */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSelectedBufferId(inspectorBuffer.id);
                  setActiveTab('safety_stock');
                  setIsInspectorOpen(false);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Sliders size={14} />
                Open in Variance Dampener
              </button>
              <button
                onClick={() => {
                  setTransferSourceBufferId(inspectorBuffer.id);
                  setShowTransferModal(true);
                  setIsInspectorOpen(false);
                }}
                className="w-full py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeftRight size={14} />
                Initiate Inter-Echelon STO
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Last Rebalanced:</span>
            <span>{new Date(inspectorBuffer.lastRebalancedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* MODAL 1: GENERATE AUTONOMOUS REPLENISHMENT REQUISITION */}
      {showReplenishModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Enterprise Replenishment</span>
                <h3 className="text-base font-bold text-white">Generate Autonomous Requisition / STO</h3>
              </div>
              <button 
                onClick={() => setShowReplenishModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateReplenishment} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono">Order Type</label>
                  <select
                    value={repType}
                    onChange={(e) => setRepType(e.target.value as ReplenishmentOrderType)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                  >
                    <option value="STOCK_TRANSFER_ORDER">Inter-Echelon STO</option>
                    <option value="PURCHASE_REQUISITION">Vendor Purchase Requisition</option>
                    <option value="EXPEDITE_ORDER">Expedite Air Order</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono">SKU Selection</label>
                  <select
                    value={repSku}
                    onChange={(e) => setRepSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                  >
                    {skuBuffers.map((b) => (
                      <option key={b.id} value={b.sku}>
                        {b.sku} — {b.skuName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {repType === 'STOCK_TRANSFER_ORDER' && (
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono">Source Echelon Node</label>
                  <select
                    value={repSourceNode}
                    onChange={(e) => setRepSourceNode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                  >
                    {echelonNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 font-mono">Destination Echelon Node</label>
                <select
                  value={repDestNode}
                  onChange={(e) => setRepDestNode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                >
                  {echelonNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono">Units</label>
                  <input
                    type="number"
                    min="1"
                    value={repUnits}
                    onChange={(e) => setRepUnits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono">Unit Cost ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={repUnitCost}
                    onChange={(e) => setRepUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono">Urgency</label>
                  <select
                    value={repUrgency}
                    onChange={(e) => setRepUrgency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="ELEVATED">Elevated</option>
                    <option value="EXPEDITE_CRITICAL">Expedite Critical</option>
                  </select>
                </div>
              </div>

              {/* Dynamic POL-MEIO-001 Validation Alert */}
              <div className={`p-3 rounded-lg border ${
                (repUnits * repUnitCost) > 25000 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="flex items-center justify-between font-mono font-bold">
                  <span>Computed Total: {formatCurrency(repUnits * repUnitCost, currency)}</span>
                  <span>{(repUnits * repUnitCost) > 25000 ? 'POLICY GATED' : 'AUTONOMOUS CLEARANCE'}</span>
                </div>
                <p className="text-[11px] mt-1 text-slate-300 font-sans">
                  {(repUnits * repUnitCost) > 25000 
                    ? 'Total exceeds $25,000 threshold. In compliance with POL-MEIO-001, this order will route to the Unified Approval Center for VP authorization.' 
                    : 'Within autonomous threshold ($25,000). Order will execute immediately into SAP ERP upon dispatch.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReplenishModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Dispatch Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INTER-ECHELON STOCK TRANSFER (STO) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Inter-Echelon Rebalancing</span>
                <h3 className="text-base font-bold text-white">Execute Stock Transfer Order (STO)</h3>
              </div>
              <button 
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-mono">Source Node Buffer (Donor)</label>
                <select
                  value={transferSourceBufferId}
                  onChange={(e) => setTransferSourceBufferId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                >
                  {skuBuffers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.echelonNodeName} ({b.sku} — {b.onHandUnits} units on hand)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono">Target Node Buffer (Recipient)</label>
                <select
                  value={transferTargetBufferId}
                  onChange={(e) => setTransferTargetBufferId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                >
                  {skuBuffers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.echelonNodeName} ({b.sku} — {b.bufferStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono">Transfer Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={transferUnits}
                  onChange={(e) => setTransferUnits(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-slate-300 text-[11px]">
                Inter-echelon transfer directly moves inventory from donor node to recipient in-transit pool, mitigating local stockout risk without generating new supplier procurement lead-time delays.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Confirm Inter-Echelon Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
