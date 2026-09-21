/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Scenario Lab UI Component
 * 
 * Interactive studio for creating, simulating, and evaluating deterministic what-if supply chain scenarios:
 * Baseline selection, sensitivity sliders, multi-scenario comparisons, and impact forecasting.
 */

import React, { useState, useEffect } from 'react';
import {
  Scenario,
  ScenarioType,
  TwinSnapshot,
  SimulationResult,
} from '../../digitalTwin/types';
import {
  scenarioEngine,
  simulationEngine,
  twinSnapshotEngine,
  ScenarioComparisonEngine,
  WhatIfPlanner,
} from '../../digitalTwin';
import {
  FlaskConical,
  Play,
  Layers,
  Sliders,
  TrendingUp,
  AlertOctagon,
  Scale,
  Save,
  Archive,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export const ScenarioLab: React.FC<{ tenantId?: string; onSelectResult?: (res: SimulationResult) => void }> = ({
  tenantId = 'TENANT_A',
  onSelectResult,
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [snapshots, setSnapshots] = useState<TwinSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [scenarioName, setScenarioName] = useState<string>('Q4 Port Delay & Demand Spike');
  const [scenarioType, setScenarioType] = useState<ScenarioType>('SUPPLIER_DELAY');
  const [delayDays, setDelayDays] = useState<number>(14);
  const [demandSpikePct, setDemandSpikePct] = useState<number>(20);
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);
  const [comparisonScenarioIds, setComparisonScenarioIds] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = () => {
    const snps = twinSnapshotEngine.listSnapshots(tenantId);
    setSnapshots(snps);
    if (snps.length > 0 && !selectedSnapshotId) {
      setSelectedSnapshotId(snps[0].snapshotId);
    }
    setScenarios(scenarioEngine.listScenarios(tenantId));
  };

  const handleRunSimulation = () => {
    if (!selectedSnapshotId) return;
    const baseSnp = twinSnapshotEngine.getSnapshot(tenantId, selectedSnapshotId);
    if (!baseSnp) return;

    setIsSimulating(true);

    const { parameters, assumption } = scenarioType === 'SUPPLIER_DELAY'
      ? WhatIfPlanner.createSupplierDelaySensitivity(delayDays)
      : WhatIfPlanner.createDemandSensitivity(demandSpikePct);

    const createdScenario = scenarioEngine.createScenario({
      tenantId,
      name: scenarioName,
      description: `Parametric what-if simulation for ${scenarioType}`,
      scenarioType,
      baseSnapshotId: selectedSnapshotId,
      createdBy: 'operator-admin',
      parameters,
      assumptions: [assumption],
    });

    const result = simulationEngine.simulate(createdScenario, baseSnp);
    scenarioEngine.attachResult(tenantId, createdScenario.scenarioId, result);

    setActiveSimulation(result);
    setScenarios(scenarioEngine.listScenarios(tenantId));
    setIsSimulating(false);

    if (onSelectResult) {
      onSelectResult(result);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-os-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
              WAVE 8 SCENARIO INTELLIGENCE
            </span>
            <span className="text-xs font-mono text-os-text-muted">DETERMINISTIC SIMULATION STUDIO</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1 flex items-center gap-2">
            <FlaskConical className="text-purple-400" size={24} />
            Supply Chain Scenario Lab
          </h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Model forward-looking supply disruptions, demand variations, and carrier delays against immutable snapshots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating || !selectedSnapshotId}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 shadow transition-colors disabled:opacity-50"
          >
            <Play size={14} className={isSimulating ? 'animate-pulse' : ''} />
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Parametric Scenario Setup */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
            <Sliders size={16} className="text-purple-400" />
            Scenario Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-os-text-secondary mb-1">Scenario Name</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-os-surface-hover border border-os-border text-os-text-primary rounded-lg px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="block text-os-text-secondary mb-1">Baseline Digital Twin Snapshot</label>
              <select
                value={selectedSnapshotId}
                onChange={(e) => setSelectedSnapshotId(e.target.value)}
                className="w-full bg-os-surface-hover border border-os-border text-os-text-primary rounded-lg px-3 py-2 outline-none"
              >
                {snapshots.map((s) => (
                  <option key={s.snapshotId} value={s.snapshotId}>
                    Snapshot V{s.stateVersion} ({s.checksum}) — {s.entityCount} entities
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-os-text-secondary mb-1">Disruption Archetype</label>
              <select
                value={scenarioType}
                onChange={(e) => setScenarioType(e.target.value as ScenarioType)}
                className="w-full bg-os-surface-hover border border-os-border text-os-text-primary rounded-lg px-3 py-2 outline-none"
              >
                <option value="SUPPLIER_DELAY">Supplier Lead Time Delay (+days)</option>
                <option value="DEMAND_INCREASE">Demand Spike Surge (+%)</option>
                <option value="SHIPMENT_DELAY">Logistics Port Congestion (+days)</option>
                <option value="CAPACITY_REDUCTION">Warehouse Throughput Bottleneck (-%)</option>
                <option value="FREIGHT_COST_CHANGE">Spot Freight Surcharge (+%)</option>
              </select>
            </div>

            {/* Dynamic Slider */}
            {scenarioType === 'SUPPLIER_DELAY' && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-os-text-secondary mb-1">
                  <span>Vendor Delay Days</span>
                  <span className="font-mono text-purple-400 font-bold">+{delayDays} days</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="45"
                  value={delayDays}
                  onChange={(e) => setDelayDays(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            )}

            {scenarioType === 'DEMAND_INCREASE' && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-os-text-secondary mb-1">
                  <span>Demand Multiplier</span>
                  <span className="font-mono text-purple-400 font-bold">+{demandSpikePct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={demandSpikePct}
                  onChange={(e) => setDemandSpikePct(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Center & Right: Live Simulation Result Preview */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-os-border pb-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-400" />
              Projected Simulation Deltas (Zero Production Mutation)
            </h3>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
              DETERMINISTIC REPRODUCIBILITY
            </span>
          </div>

          {activeSimulation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-os-surface-hover border border-os-border rounded-lg">
                  <div className="text-[11px] text-os-text-muted">OTIF Projection</div>
                  <div className="text-lg font-bold text-red-400">
                    {activeSimulation.kpiDelta['OTIF']?.projected || 85}%
                    <span className="text-xs font-normal ml-1">({activeSimulation.serviceDelta.otifDeltaPercent}%)</span>
                  </div>
                </div>

                <div className="p-3 bg-os-surface-hover border border-os-border rounded-lg">
                  <div className="text-[11px] text-os-text-muted">Revenue At Risk</div>
                  <div className="text-lg font-bold text-amber-400">
                    ${activeSimulation.financialDelta.revenueAtRisk.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-os-surface-hover border border-os-border rounded-lg">
                  <div className="text-[11px] text-os-text-muted">Network Risk Score</div>
                  <div className="text-lg font-bold text-purple-400">
                    {activeSimulation.riskDelta.projectedAverage}/100
                    <span className="text-xs font-normal ml-1">(+{activeSimulation.riskDelta.delta})</span>
                  </div>
                </div>
              </div>

              {/* 9-Vector Highlights */}
              <div className="p-3 bg-os-surface-hover/50 border border-os-border rounded-lg">
                <div className="text-xs font-semibold text-os-text-primary mb-2">9-Vector Impact Summary</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {activeSimulation.impactVectors.slice(0, 6).map((iv) => (
                    <div key={iv.metric} className="p-2 bg-os-surface border border-os-border/70 rounded">
                      <div className="text-[10px] text-os-text-muted">{iv.vector}</div>
                      <div className="font-semibold text-os-text-primary">{iv.metric}</div>
                      <div className={`font-mono text-[11px] ${iv.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {iv.baseline} → {iv.projected} {iv.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-os-text-muted text-xs space-y-2">
              <FlaskConical size={32} className="text-os-text-muted/40" />
              <span>Configure scenario parameters and click "Run Simulation"</span>
            </div>
          )}
        </div>
      </div>

      {/* Historical Scenarios Table */}
      <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
          <Scale size={16} className="text-cyan-400" />
          Tenant Scenario Repository
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-os-border text-os-text-muted font-mono text-[11px]">
                <th className="pb-2">SCENARIO NAME</th>
                <th className="pb-2">TYPE</th>
                <th className="pb-2">STATUS</th>
                <th className="pb-2">BASELINE SNAPSHOT</th>
                <th className="pb-2">SIMULATED AT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border/50">
              {scenarios.map((sc) => (
                <tr key={sc.scenarioId} className="hover:bg-os-surface-hover/50 transition-colors">
                  <td className="py-2.5 font-semibold text-os-text-primary">{sc.name}</td>
                  <td className="py-2.5 font-mono text-purple-400">{sc.scenarioType}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {sc.status}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-os-text-muted">{sc.baseSnapshotId}</td>
                  <td className="py-2.5 text-os-text-secondary">{new Date(sc.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
