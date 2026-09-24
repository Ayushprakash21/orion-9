import React, { useState } from 'react';
import { 
  Network, GitBranch, RefreshCw, CheckCircle2, 
  MapPin, Truck, Layers, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';
import { 
  networkDesignEngine, 
  multiTierSupplierEngine, 
  logisticsOptimizationEngine, 
  NetworkDesignScenarioRecord, 
  MultiTierSupplierNetworkRecord,
  LogisticsOptimizationPlanRecord
} from '../scm';
import { useAuth } from '../store/AuthContext';

export const NetworkDesignCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [scenarios, setScenarios] = useState<NetworkDesignScenarioRecord[]>(() => 
    networkDesignEngine.getScenarios(tenantId)
  );
  const [multiTierNetworks, setMultiTierNetworks] = useState<MultiTierSupplierNetworkRecord[]>(() => 
    multiTierSupplierEngine.getNetworks(tenantId)
  );
  const [logisticsPlans, setLogisticsPlans] = useState<LogisticsOptimizationPlanRecord[]>(() => 
    logisticsOptimizationEngine.getPlans(tenantId)
  );

  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'MULTI_TIER' | 'LOGISTICS'>('SCENARIOS');

  const refreshAll = () => {
    setScenarios(networkDesignEngine.getScenarios(tenantId));
    setMultiTierNetworks(multiTierSupplierEngine.getNetworks(tenantId));
    setLogisticsPlans(logisticsOptimizationEngine.getPlans(tenantId));
  };

  const handleSimulateScenario = () => {
    networkDesignEngine.createScenario({
      tenantId,
      name: 'Regionalized EMEA Distribution Hub Model',
      description: 'Decentralizes Central European distribution into two regional fulfillment clusters in Rotterdam & Munich.',
      isBaseline: false,
      facilitiesCount: 14,
      supplierNodesCount: 38,
      totalProjectedFreightCost: 1420000,
      totalProjectedWarehouseCost: 890000,
      averageLeadTimeDays: 2.4,
      networkResilienceScore: 94,
      serviceLevelProjectedPct: 99.1,
      approvalStatus: 'SIMULATED'
    });
    refreshAll();
  };

  const handleSimulateMultiTier = () => {
    multiTierSupplierEngine.registerNetwork({
      tenantId,
      productId: 'PROD-AUTONOMOUS-DRONE',
      nodes: [
        {
          nodeId: 'NODE-T1-AVIONICS',
          supplierName: 'Avionics Prime Inc',
          tier: 1,
          country: 'US',
          criticalMaterial: 'Flight Controller Modules',
          singleSource: false,
          disruptionRiskScore: 18,
          parentSupplierIds: []
        },
        {
          nodeId: 'NODE-T2-SEMICON',
          supplierName: 'Silicon Wafer Fab Taiwan',
          tier: 2,
          country: 'TW',
          criticalMaterial: '3nm ARM Core Microprocessors',
          singleSource: true,
          disruptionRiskScore: 68,
          parentSupplierIds: ['NODE-T1-AVIONICS']
        },
        {
          nodeId: 'NODE-T3-RARE-EARTH',
          supplierName: 'High-Purity Silicon Refineries',
          tier: 3,
          country: 'AU',
          criticalMaterial: 'Electronic Grade Monocrystalline Silicon',
          singleSource: false,
          disruptionRiskScore: 24,
          parentSupplierIds: ['NODE-T2-SEMICON']
        }
      ]
    });
    refreshAll();
  };

  const handleSimulateLogistics = () => {
    logisticsOptimizationEngine.optimizeLane({
      tenantId,
      originHub: 'HUB-CHICAGO-MIDWEST',
      destinationHub: 'HUB-DALLAS-SOUTH',
      shipmentCount: 18,
      baselineCost: 42000,
      preferredMode: 'INTERMODAL_RAIL'
    });
    refreshAll();
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="network-design-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Network className="w-6 h-6 text-purple-400" />
              Supply Chain Network Design & Optimization Lab
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              TOPOLOGY & TIER 1→2→3 VISIBILITY
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Network Scenarios, Upstream Multi-Tier Dependency Mapping, and Lane-Level Freight Optimization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={refreshAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {activeTab === 'SCENARIOS' && (
            <button 
              onClick={handleSimulateScenario}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Simulate Candidate Network
            </button>
          )}
          {activeTab === 'MULTI_TIER' && (
            <button 
              onClick={handleSimulateMultiTier}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Analyze Multi-Tier Graph
            </button>
          )}
          {activeTab === 'LOGISTICS' && (
            <button 
              onClick={handleSimulateLogistics}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              Optimize Freight Lane
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('SCENARIOS')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'SCENARIOS' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Network Topologies & Scenarios ({scenarios.length})
        </button>
        <button 
          onClick={() => setActiveTab('MULTI_TIER')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'MULTI_TIER' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Multi-Tier Supplier Graphs ({multiTierNetworks.length})
        </button>
        <button 
          onClick={() => setActiveTab('LOGISTICS')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'LOGISTICS' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-white/60 hover:text-white'
          }`}
        >
          Freight Lane Consolidation ({logisticsPlans.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'SCENARIOS' ? (
        <div className="space-y-4">
          {scenarios.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No candidate scenarios active. Click "Simulate Candidate Network" above.
            </div>
          ) : (
            scenarios.map(sc => (
              <div key={sc.scenarioId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">{sc.name}</h3>
                    <p className="text-xs text-white/60 mt-1">{sc.description}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {sc.approvalStatus}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] p-2 rounded bg-black/40 border border-white/5">
                  <div>
                    <span className="text-white/40 block">Total Freight Cost</span>
                    <span className="font-semibold text-white">${sc.totalProjectedFreightCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Avg Lead Time</span>
                    <span className="font-semibold text-emerald-400">{sc.averageLeadTimeDays} days</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Resilience Score</span>
                    <span className="font-bold text-purple-400">{sc.networkResilienceScore}/100</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Projected Service Level</span>
                    <span className="font-semibold text-emerald-400">{sc.serviceLevelProjectedPct}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'MULTI_TIER' ? (
        <div className="space-y-4">
          {multiTierNetworks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No multi-tier supplier network mapped. Click "Analyze Multi-Tier Graph" above.
            </div>
          ) : (
            multiTierNetworks.map(net => (
              <div key={net.networkId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-white">Bill of Material Network: {net.productId}</span>
                    <p className="text-[11px] text-white/50">
                      Resilience Score: <span className="text-emerald-400 font-bold">{net.overallResilienceScore}/100</span> • Concentration Risk: <span className="text-amber-300 font-bold">{net.concentrationRisk}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {net.nodes.map(node => (
                    <div key={node.nodeId} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          node.tier === 1 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          node.tier === 2 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          TIER {node.tier}
                        </span>
                        <div>
                          <span className="font-semibold text-white">{node.supplierName}</span>
                          <span className="text-white/50 text-[11px] block">{node.criticalMaterial} ({node.country})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {node.singleSource && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                            SINGLE SOURCE BOTTLENECK
                          </span>
                        )}
                        <span className="text-xs text-white/60">Risk: <strong className="text-white">{node.disruptionRiskScore}/100</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {logisticsPlans.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
              No lane optimization plans active. Click "Optimize Freight Lane" above.
            </div>
          ) : (
            logisticsPlans.map(plan => (
              <div key={plan.planId} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-white">{plan.originHub} → {plan.destinationHub}</span>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Carrier: <span className="text-white">{plan.recommendedCarrier}</span> • Mode: <span className="text-emerald-300 font-mono">{plan.mode}</span>
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {plan.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] p-2 rounded bg-black/40 border border-white/5">
                  <div>
                    <span className="text-white/40 block">Baseline Cost</span>
                    <span className="font-semibold text-white/60 line-through">${plan.baselineCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Optimized Cost</span>
                    <span className="font-bold text-emerald-400 text-sm">${plan.optimizedCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Cost Reduction</span>
                    <span className="font-bold text-emerald-400">-{plan.costSavingsPct}%</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">CO2 Reduction</span>
                    <span className="font-semibold text-emerald-300">-{plan.co2ReductionKg} kg</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
