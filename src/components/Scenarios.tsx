import React, { useState, useMemo } from 'react';
import { 
  Network, Play, Plus, Server, Database, ArrowRight, TrendingDown, 
  AlertTriangle, CheckCircle2, RefreshCw, FileText, Layers, ExternalLink, 
  HelpCircle, X, ShieldAlert, Zap, Globe, Cpu, Plane, Compass, Activity, 
  BarChart3, Boxes, Truck, ShieldCheck, ChevronRight, Sparkles, Filter, Search
} from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { useToast } from '../store/ToastContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { EnterpriseScenario, DigitalTwinNode, ContingencyPlaybook, ScenarioShockType } from '../types/scenario';

export const Scenarios: React.FC = () => {
  const { 
    scenarios, 
    digitalTwinNodes, 
    contingencyPlans, 
    runScenarioSimulation, 
    generateContingencyPlaybooks, 
    dispatchContingencyPlan, 
    addScenario,
    currency 
  } = useSupplyChain();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'digital_twin' | 'monte_carlo' | 'playbooks'>('portfolio');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || 'SCN-2026-001');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [shockTypeFilter, setShockTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isGeneratingPlaybooks, setIsGeneratingPlaybooks] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Scenario Form State
  const [formName, setFormName] = useState<string>('');
  const [formShockType, setFormShockType] = useState<ScenarioShockType>('PORT_BLOCKADE');
  const [formSeverity, setFormSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC'>('HIGH');
  const [formDuration, setFormDuration] = useState<number>(14);
  const [formMagnitude, setFormMagnitude] = useState<number>(75);
  const [formEpicenter, setFormEpicenter] = useState<string>('Port of Singapore (Malacca Choke)');
  const [formDesc, setFormDesc] = useState<string>('');

  const selectedScenario = useMemo(() => {
    return scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  }, [scenarios, selectedScenarioId]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const matchesFilter = shockTypeFilter === 'ALL' || s.shockType === shockTypeFilter;
      const matchesSearch = !searchQuery || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.targetEpicenter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [scenarios, shockTypeFilter, searchQuery]);

  // Operational HUD Metrics
  const totalExposure = useMemo(() => {
    return scenarios.reduce((acc, s) => acc + (s.financialExposure || 0), 0);
  }, [scenarios]);

  const avgResilience = useMemo(() => {
    if (scenarios.length === 0) return 0;
    return Math.round(scenarios.reduce((acc, s) => acc + (s.networkResilienceScore || 0), 0) / scenarios.length);
  }, [scenarios]);

  const totalDisruptedNodes = useMemo(() => {
    const nodeSet = new Set<string>();
    scenarios.forEach(s => s.affectedNodeIds?.forEach(id => nodeSet.add(id)));
    return nodeSet.size;
  }, [scenarios]);

  const pendingApprovalsCount = useMemo(() => {
    return contingencyPlans.filter(p => p.status === 'SUBMITTED_TO_APPROVAL').length;
  }, [contingencyPlans]);

  // Actions
  const handleExecuteSimulation = async (scenarioId: string) => {
    setIsSimulating(true);
    showToast('Executing multi-tier digital twin propagation & Monte Carlo stress model...', 'info', 'Simulation Running');
    try {
      const updated = await runScenarioSimulation(scenarioId);
      showToast(`Simulation converged. Network Resilience: ${updated.networkResilienceScore}%, Exposure: ${formatCurrency(updated.financialExposure, currency)}.`, 'success', 'Simulation Complete');
    } catch (err: any) {
      showToast(err.message || 'Simulation error', 'error', 'Simulation Failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateAiPlaybooks = async (scenarioId: string) => {
    setIsGeneratingPlaybooks(true);
    showToast('Synthesizing neural contingency playbooks with cryptographic seals...', 'info', 'AI Reasoning');
    try {
      const playbooks = await generateContingencyPlaybooks(scenarioId);
      showToast(`Generated ${playbooks.length} actionable mitigation playbooks.`, 'success', 'Playbooks Ready');
      setActiveTab('playbooks');
    } catch (err: any) {
      showToast(err.message || 'Error generating playbooks', 'error', 'AI Synthesis Failed');
    } finally {
      setIsGeneratingPlaybooks(false);
    }
  };

  const handleDispatch = async (scenarioId: string, playbook: ContingencyPlaybook) => {
    setIsDispatching(playbook.id);
    try {
      await dispatchContingencyPlan(scenarioId, playbook.id, 'Emergency Disruption Mitigation Response');
      if (playbook.costToExecute > 50000 || playbook.requiresExecutiveApproval) {
        showToast(`Playbook "${playbook.title}" routed to Unified Approval Center (Policy POL-SCN-001 gated).`, 'info', 'Approval Gated');
      } else {
        showToast(`Playbook "${playbook.title}" committed autonomously within $50,000 threshold.`, 'success', 'Mitigation Active');
      }
    } catch (err: any) {
      showToast(err.message || 'Dispatch failed', 'error', 'Governance Error');
    } finally {
      setIsDispatching(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newScenario: EnterpriseScenario = {
      id: `SCN-2026-00${scenarios.length + 1}`,
      name: formName.trim(),
      shockType: formShockType,
      state: 'READY',
      severity: formSeverity,
      description: formDesc.trim() || `Enterprise stress test for ${formName}`,
      targetEpicenter: formEpicenter,
      durationDays: formDuration,
      magnitudePercent: formMagnitude,
      affectedNodeIds: ['NODE-PORT-01', 'NODE-WH-01'],
      affectedPoIds: [],
      affectedShipmentIds: [],
      affectedSkus: [
        {
          sku: 'SKU-SEMI-001',
          name: 'Orion Neural Coprocessor 4nm',
          currentOnHand: 1420,
          dailyBurnRate: 180,
          daysOfSupplyRemaining: 7.8,
          projectedStockoutDay: 8,
          revenueImpact: 780000,
          criticality: 'CRITICAL'
        }
      ],
      financialExposure: 850000,
      networkResilienceScore: 70,
      cascadingFailureNodesCount: 3,
      playbooks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Risk Architect (Console)',
      version: 1,
    };

    await addScenario(newScenario);
    showToast(`Enterprise stress test "${newScenario.name}" initialized.`, 'success', 'Scenario Created');
    setShowCreateModal(false);
    setSelectedScenarioId(newScenario.id);
  };
﻿  return (
    <div className="flex flex-col h-full w-full bg-[#080B11] text-slate-100 overflow-hidden select-none font-sans">
      {/* TOP OPERATIONAL HUD */}
      <div className="flex-none px-6 py-4 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
                INTELLIGENCE LAYER 2 & 7
              </span>
              <span className="text-[11px] font-mono text-slate-400 tracking-wider">
                ORION-9 DISASTER SIMULATION TWIN & STRESS TESTING
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
              <Compass className="text-cyan-400" size={22} />
              Scenario Lab & Digital Twin Stress Testing Engine
            </h1>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
            <div className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center gap-3 min-w-[140px]">
              <Activity size={18} className="text-cyan-400 flex-none" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Active Tests</div>
                <div className="text-sm font-bold text-white">{scenarios.length} Scenarios</div>
              </div>
            </div>

            <div className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center gap-3 min-w-[150px]">
              <AlertTriangle size={18} className="text-amber-400 flex-none" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Exposure at Risk</div>
                <div className="text-sm font-bold text-amber-400">{formatCurrency(totalExposure, currency)}</div>
              </div>
            </div>

            <div className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center gap-3 min-w-[140px]">
              <ShieldCheck size={18} className="text-emerald-400 flex-none" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Resilience Index</div>
                <div className="text-sm font-bold text-emerald-400">{avgResilience} / 100</div>
              </div>
            </div>

            <div className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center gap-3 min-w-[140px]">
              <Network size={18} className="text-rose-400 flex-none" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Stressed Nodes</div>
                <div className="text-sm font-bold text-rose-400">{totalDisruptedNodes} Affected</div>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-cyan-950/40 flex-none"
            >
              <Plus size={15} /> Inject Shock Test
            </button>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="flex items-center gap-6 mt-4 border-t border-slate-800/60 pt-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`pb-1.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'portfolio'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} /> Stress Test Scenarios ({scenarios.length})
          </button>

          <button
            onClick={() => setActiveTab('digital_twin')}
            className={`pb-1.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'digital_twin'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network size={14} /> Digital Twin Cascading Failure Graph
          </button>

          <button
            onClick={() => setActiveTab('monte_carlo')}
            className={`pb-1.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'monte_carlo'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={14} /> Monte Carlo Stochastic Projections (10k Iterations)
          </button>

          <button
            onClick={() => setActiveTab('playbooks')}
            className={`pb-1.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'playbooks'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} /> AI Neural Contingency Playbooks ({selectedScenario?.playbooks?.length || 0})
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px]">
                {pendingApprovalsCount} Gated
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE BODY */}
      <div className="flex-1 overflow-hidden p-6">
        {/* TAB 1: SCENARIO PORTFOLIO & INSPECTOR */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
            {/* Left Column: Scenario Cards */}
            <div className="lg:col-span-7 flex flex-col h-full bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden">
              {/* Search and Filters Bar */}
              <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                  <Search size={14} className="text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search scenarios, shock epicenters, or SKUs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-slate-200 placeholder-slate-500 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-500" />
                  <select
                    value={shockTypeFilter}
                    onChange={(e) => setShockTypeFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                  >
                    <option value="ALL">All Shock Types</option>
                    <option value="GEOPOLITICAL_CANAL_CRISIS">Geopolitical Maritime</option>
                    <option value="SUPPLIER_INSOLVENCY">Supplier Outage</option>
                    <option value="DEMAND_SURGE">Demand Surge</option>
                    <option value="CYBER_OUTAGE">Cyber Ransomware</option>
                  </select>
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredScenarios.map((sc) => {
                  const isSelected = sc.id === selectedScenarioId;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setSelectedScenarioId(sc.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/60 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-cyan-400 font-bold">{sc.id}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              sc.severity === 'CATASTROPHIC' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              sc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {sc.severity}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
                              {sc.shockType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1">{sc.name}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{sc.description}</p>
                        </div>

                        <div className="flex flex-col items-end flex-none">
                          <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                            sc.state === 'CONVERGED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            sc.state === 'SIMULATING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse' :
                            sc.state === 'ROUTED_TO_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {sc.state}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 mt-2">v{sc.version}.0</span>
                        </div>
                      </div>

                      {/* Card Metric Badges */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs">
                        <div>
                          <div className="text-[10px] uppercase font-mono text-slate-500">Gross Exposure</div>
                          <div className="font-bold text-amber-400 mt-0.5">{formatCurrency(sc.financialExposure, currency)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono text-slate-500">Resilience Score</div>
                          <div className="font-bold text-emerald-400 mt-0.5">{sc.networkResilienceScore} / 100</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono text-slate-500">Blast Radius</div>
                          <div className="font-bold text-rose-400 mt-0.5">{sc.cascadingFailureNodesCount} Nodes Affected</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Slide-Out Inspector Drawer */}
            <div className="lg:col-span-5 flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              {selectedScenario ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">SCENARIO AUDIT & CONTROLS</div>
                      <h2 className="text-base font-bold text-white truncate max-w-[340px]">{selectedScenario.name}</h2>
                    </div>
                    <span className="px-2 py-0.5 font-mono text-[10px] bg-slate-800 text-slate-300 rounded">
                      {selectedScenario.id}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
                    {/* Disruption Parameters Panel */}
                    <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-3">
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Zap size={14} className="text-amber-400" /> Shock Injection Parameters
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-slate-300">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">TARGET EPICENTER</span>
                          <span className="font-semibold text-white">{selectedScenario.targetEpicenter}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">DURATION HORIZON</span>
                          <span className="font-semibold text-white">{selectedScenario.durationDays} Days</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">SEVERITY MAGNITUDE</span>
                          <span className="font-semibold text-amber-400">+{selectedScenario.magnitudePercent}% Delay / Load</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">BLAST RADIUS</span>
                          <span className="font-semibold text-rose-400">{selectedScenario.affectedNodeIds.length} Network Nodes</span>
                        </div>
                      </div>
                    </div>

                    {/* Affected SKUs Vulnerability Matrix */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>SKU Vulnerability Analysis</span>
                        <span className="text-[10px] font-mono text-slate-500">{selectedScenario.affectedSkus.length} Tracked</span>
                      </div>
                      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900/80 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="p-2">SKU & Item</th>
                              <th className="p-2 text-right">On Hand</th>
                              <th className="p-2 text-right">Burn Rate</th>
                              <th className="p-2 text-right">Stockout</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {selectedScenario.affectedSkus.map((sku) => (
                              <tr key={sku.sku} className="hover:bg-slate-800/30">
                                <td className="p-2">
                                  <div className="font-semibold text-white truncate max-w-[140px]">{sku.name}</div>
                                  <span className="text-[10px] font-mono text-slate-500">{sku.sku}</span>
                                </td>
                                <td className="p-2 text-right font-mono text-slate-300">{formatNumber(sku.currentOnHand)}</td>
                                <td className="p-2 text-right font-mono text-slate-400">{sku.dailyBurnRate}/day</td>
                                <td className="p-2 text-right font-mono font-bold text-rose-400">
                                  Day {sku.projectedStockoutDay}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Monte Carlo Summary */}
                    {selectedScenario.monteCarlo && (
                      <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-lg space-y-2">
                        <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Monte Carlo Confidence (10k runs)</span>
                          <span className="text-[10px] font-mono text-cyan-400">{selectedScenario.monteCarlo.stockoutConfidencePercent}% Confidence</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                          <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                            <div className="text-[10px] font-mono text-slate-500">P10 BEST</div>
                            <div className="font-bold text-emerald-400">{selectedScenario.monteCarlo.p10BestCaseDays} Days</div>
                          </div>
                          <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                            <div className="text-[10px] font-mono text-slate-500">P50 MEDIAN</div>
                            <div className="font-bold text-amber-400">{selectedScenario.monteCarlo.p50ExpectedDays} Days</div>
                          </div>
                          <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                            <div className="text-[10px] font-mono text-slate-500">P90 TAIL RISK</div>
                            <div className="font-bold text-rose-400">{selectedScenario.monteCarlo.p90WorstCaseDays} Days</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inspector Footer Actions */}
                  <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
                    <button
                      onClick={() => handleExecuteSimulation(selectedScenario.id)}
                      disabled={isSimulating}
                      className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md"
                    >
                      <Play size={14} /> {isSimulating ? 'Simulating...' : 'Run Simulation'}
                    </button>

                    <button
                      onClick={() => handleGenerateAiPlaybooks(selectedScenario.id)}
                      disabled={isGeneratingPlaybooks}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-400 border border-cyan-500/30 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Sparkles size={14} /> {isGeneratingPlaybooks ? 'Synthesizing...' : 'AI Playbooks'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Select a scenario to view detailed stress test telemetry.
                </div>
              )}
            </div>
          </div>
        )}
﻿        {/* TAB 2: DIGITAL TWIN CASCADING FAILURE GRAPH */}
        {activeTab === 'digital_twin' && (
          <div className="h-full flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Network className="text-cyan-400" size={18} />
                  Live Digital Twin Network Topology & Cascading Stress Paths
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Active scenario: <span className="text-cyan-300 font-semibold">{selectedScenario?.name}</span>. Epicenter: <span className="text-amber-400 font-semibold">{selectedScenario?.targetEpicenter}</span>.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Healthy (90-100%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Stressed (50-89%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Severely Disrupted</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-ping" /> Epicenter Shock</span>
              </div>
            </div>

            {/* Visual Topology Grid (Tier 1 through Tier 5) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 overflow-y-auto">
              {/* TIER 1: SUPPLIERS */}
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Cpu size={14} className="text-cyan-400" /> Tier-1 Suppliers
                </div>
                {digitalTwinNodes.filter(n => n.type === 'SUPPLIER').map(node => {
                  const isAffected = selectedScenario?.affectedNodeIds?.includes(node.id);
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isAffected
                          ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{node.name}</span>
                        <span className={`w-2 h-2 rounded-full ${isAffected ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{node.country} • Tier {node.tier}</div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5">Cap: {isAffected ? '45%' : `${node.capacityRemainingPercent}%`}</div>
                    </div>
                  );
                })}
              </div>

              {/* TIER 2: LOGISTICS PORTS */}
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Globe size={14} className="text-blue-400" /> Maritime & Air Ports
                </div>
                {digitalTwinNodes.filter(n => n.type === 'PORT').map(node => {
                  const isAffected = selectedScenario?.affectedNodeIds?.includes(node.id);
                  const isEpicenter = node.id === selectedScenario?.epicenterNodeId;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isEpicenter
                          ? 'bg-rose-950/50 border-rose-500 shadow-md ring-1 ring-rose-500'
                          : isAffected
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{node.name}</span>
                        <span className={`w-2 h-2 rounded-full ${isEpicenter ? 'bg-rose-500 animate-pulse' : isAffected ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{node.country} • Latency: +{isAffected ? node.latencyImpactDays : 0}d</div>
                      <div className="text-[10px] font-mono text-amber-400 mt-0.5">Cap: {isEpicenter ? '20%' : `${node.capacityRemainingPercent}%`}</div>
                    </div>
                  );
                })}
              </div>

              {/* TIER 3: MANUFACTURING PLANTS */}
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Server size={14} className="text-amber-400" /> Assembly Plants
                </div>
                {digitalTwinNodes.filter(n => n.type === 'PLANT').map(node => {
                  const isAffected = selectedScenario?.affectedNodeIds?.includes(node.id);
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isAffected
                          ? 'bg-amber-950/30 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{node.name}</span>
                        <span className={`w-2 h-2 rounded-full ${isAffected ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{node.country} • Tier {node.tier}</div>
                      <div className="text-[10px] font-mono text-emerald-400 mt-0.5">Output: {isAffected ? '62%' : `${node.capacityRemainingPercent}%`}</div>
                    </div>
                  );
                })}
              </div>

              {/* TIER 4: REGIONAL DISTRIBUTION HUBS */}
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Boxes size={14} className="text-emerald-400" /> Regional Distribution Hubs
                </div>
                {digitalTwinNodes.filter(n => n.type === 'WAREHOUSE').map(node => {
                  const isAffected = selectedScenario?.affectedNodeIds?.includes(node.id);
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isAffected
                          ? 'bg-amber-950/30 border-amber-500/50 shadow-sm'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{node.name}</span>
                        <span className={`w-2 h-2 rounded-full ${isAffected ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{node.country} • Hub</div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5">Buffer: {isAffected ? '12 days' : '38 days'}</div>
                    </div>
                  );
                })}
              </div>

              {/* TIER 5: CUSTOMER DEMAND CLUSTERS */}
              <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Truck size={14} className="text-purple-400" /> Customer Markets
                </div>
                {digitalTwinNodes.filter(n => n.type === 'CUSTOMER_CLUSTER').map(node => {
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="p-3 rounded-lg border bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{node.name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{node.country} • Commercial</div>
                      <div className="text-[10px] font-mono text-purple-400 mt-0.5">Fulfillment: 98.4%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONTE CARLO STOCHASTIC PROJECTIONS */}
        {activeTab === 'monte_carlo' && (
          <div className="h-full flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="text-cyan-400" size={18} />
                  10,000-Iteration Monte Carlo Stochastic Stockout Simulation
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Confidence intervals and revenue exposure projection for <span className="text-cyan-300 font-semibold">{selectedScenario?.name}</span>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono">
                  Confidence: {selectedScenario?.monteCarlo?.stockoutConfidencePercent || 92.8}%
                </span>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono">
                  Iterations: 10,000
                </span>
              </div>
            </div>

            {/* Monte Carlo Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">P10 Best Case Horizon</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{selectedScenario?.monteCarlo?.p10BestCaseDays || 6} Days</div>
                <div className="text-[11px] text-slate-400 mt-1">Min Exposure: {formatCurrency(selectedScenario?.monteCarlo?.revenueExposureMin || 840000, currency)}</div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">P50 Expected Median</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">{selectedScenario?.monteCarlo?.p50ExpectedDays || 14} Days</div>
                <div className="text-[11px] text-slate-400 mt-1">Expected Exposure: {formatCurrency(selectedScenario?.monteCarlo?.revenueExposureExpected || 1420000, currency)}</div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">P90 Tail Risk (Worst)</div>
                <div className="text-2xl font-bold text-rose-400 mt-1">{selectedScenario?.monteCarlo?.p90WorstCaseDays || 22} Days</div>
                <div className="text-[11px] text-slate-400 mt-1">Max Tail Exposure: {formatCurrency(selectedScenario?.monteCarlo?.revenueExposureMax || 2180000, currency)}</div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">Network Resilience</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">{selectedScenario?.networkResilienceScore || 54} / 100</div>
                <div className="text-[11px] text-slate-400 mt-1">{selectedScenario?.cascadingFailureNodesCount || 5} Downstream Nodes Gapped</div>
              </div>
            </div>

            {/* Stochastic Day-by-Day Probability Curve */}
            <div className="flex-1 bg-slate-950/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-hidden">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Cumulative Probability of Severe Network Stockout vs Horizon (Days)</span>
                <span className="text-[10px] font-mono text-slate-500">Stochastic Kernel Engine</span>
              </div>

              <div className="flex-1 grid grid-cols-6 gap-3 items-end pb-4">
                {(selectedScenario?.monteCarlo?.timelineSeries || []).map((pt) => (
                  <div key={pt.day} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="text-[10px] font-mono text-amber-400">{formatCurrency(pt.cumulativeRevenueAtRisk, currency)}</div>
                    <div className="w-full flex items-end gap-1 h-36 bg-slate-900/60 rounded-lg p-1">
                      {/* P10 Bar */}
                      <div
                        style={{ height: `${pt.p10StockoutProb}%` }}
                        className="flex-1 bg-emerald-500/50 hover:bg-emerald-400 rounded-t transition-all"
                        title={`P10: ${pt.p10StockoutProb}%`}
                      />
                      {/* P50 Bar */}
                      <div
                        style={{ height: `${pt.p50StockoutProb}%` }}
                        className="flex-1 bg-amber-500/60 hover:bg-amber-400 rounded-t transition-all"
                        title={`P50: ${pt.p50StockoutProb}%`}
                      />
                      {/* P90 Bar */}
                      <div
                        style={{ height: `${pt.p90StockoutProb}%` }}
                        className="flex-1 bg-rose-500/70 hover:bg-rose-400 rounded-t transition-all"
                        title={`P90: ${pt.p90StockoutProb}%`}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">Day {pt.day}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-800/80 text-xs font-mono">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500/50 rounded" /> P10 Best Case</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-500/60 rounded" /> P50 Expected Median</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500/70 rounded" /> P90 Tail Risk</span>
              </div>
            </div>
          </div>
        )}
﻿        {/* TAB 4: AI CONTINGENCY PLAYBOOKS & GOVERNANCE GATE */}
        {activeTab === 'playbooks' && (
          <div className="h-full flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-cyan-400" size={18} />
                  AI-Synthesized Mitigation Playbooks & Governance Gate (POL-SCN-001)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Actions with expenditure exceeding $50,000 are automatically routed to the <span className="text-cyan-300 font-semibold">Unified Approval Center</span>.
                </p>
              </div>

              <button
                onClick={() => handleGenerateAiPlaybooks(selectedScenario?.id)}
                disabled={isGeneratingPlaybooks}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
              >
                <RefreshCw size={14} className={isGeneratingPlaybooks ? 'animate-spin' : ''} />
                Regenerate Neural Playbooks
              </button>
            </div>

            {/* Playbooks Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
              {(selectedScenario?.playbooks || []).map((pb) => {
                const isOverBudget = pb.costToExecute > 50000;
                return (
                  <div
                    key={pb.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold">{pb.id}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          pb.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          pb.status === 'SUBMITTED_TO_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {pb.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">{pb.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{pb.description}</p>

                      {/* Trade-off Matrix */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs">
                        <div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">Cost</div>
                          <div className="font-bold text-white">{formatCurrency(pb.costToExecute, currency)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">Protected</div>
                          <div className="font-bold text-emerald-400">{formatCurrency(pb.revenueProtected, currency)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase">Recovery</div>
                          <div className="font-bold text-cyan-400">{pb.timeToRecoverDays} Days</div>
                        </div>
                      </div>

                      {/* Action Steps */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono uppercase text-slate-400">Execution Steps:</div>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {pb.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-cyan-400 text-[10px] mt-0.5">•</span>
                              <span className="leading-tight">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cryptographic Seal */}
                      {pb.sha256Seal && (
                        <div className="p-2 bg-slate-900/40 rounded border border-slate-800/60 font-mono text-[9px] text-slate-500 truncate">
                          SHA-256: {pb.sha256Seal}
                        </div>
                      )}
                    </div>

                    {/* Footer Action Button */}
                    <div className="pt-3 border-t border-slate-800">
                      {pb.status === 'ACTIVE' ? (
                        <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                          <CheckCircle2 size={14} /> Plan Active in Production
                        </div>
                      ) : pb.status === 'SUBMITTED_TO_APPROVAL' ? (
                        <div className="w-full py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-center rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                          <ShieldAlert size={14} /> Gated at Approval Center
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDispatch(selectedScenario.id, pb)}
                          disabled={isDispatching === pb.id}
                          className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                            isOverBudget
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          }`}
                        >
                          {isOverBudget ? (
                            <>
                              <ShieldAlert size={14} /> Dispatch to Approval Center
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} /> Execute Autonomous Mitigation
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CREATE SHOCK TEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="text-cyan-400" size={18} />
                Inject Enterprise Shock Scenario
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Scenario Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Red Sea Maritime Choke Point & Canal Shutdown"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Shock Type</label>
                  <select
                    value={formShockType}
                    onChange={(e) => setFormShockType(e.target.value as ScenarioShockType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none"
                  >
                    <option value="PORT_BLOCKADE">Port Blockade</option>
                    <option value="GEOPOLITICAL_CANAL_CRISIS">Geopolitical Canal Crisis</option>
                    <option value="SUPPLIER_INSOLVENCY">Supplier Insolvency</option>
                    <option value="DEMAND_SURGE">Demand Surge (+50%)</option>
                    <option value="CYBER_OUTAGE">Cyber Ransomware Outage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Severity Rating</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none"
                  >
                    <option value="CATASTROPHIC">CATASTROPHIC</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Duration (Days): {formDuration}</label>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Magnitude (%): +{formMagnitude}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={formMagnitude}
                    onChange={(e) => setFormMagnitude(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Epicenter Node / Gateway</label>
                <select
                  value={formEpicenter}
                  onChange={(e) => setFormEpicenter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none"
                >
                  <option value="Port of Singapore (Malacca Choke)">Port of Singapore (Malacca Choke)</option>
                  <option value="Port of Shanghai (Deepwater Terminal)">Port of Shanghai (Deepwater Terminal)</option>
                  <option value="Apex Semiconductor Fab 18 (Foundry)">Apex Semiconductor Fab 18 (Foundry)</option>
                  <option value="North America Central Hub (Chicago)">North America Central Hub (Chicago)</option>
                  <option value="Port of Rotterdam (Euro Gateway)">Port of Rotterdam (Euro Gateway)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Scenario Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed rationale and expected disruption cascade..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center gap-2"
                >
                  <Plus size={14} /> Initialize Stress Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
