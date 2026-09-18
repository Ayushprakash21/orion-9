import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { Network, Server, Database, Truck, Boxes, Shield, ArrowRight, X, Play, RotateCcw } from 'lucide-react';

export const DigitalTwin: React.FC = () => {
  const { suppliers, inventory, shipments } = useSupplyChain();
  const { showToast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simScenario, setSimScenario] = useState<string>('demand-spike');

  const handleRunSimulation = () => {
    setSimulationRunning(true);
    setTimeout(() => {
      setSimulationRunning(false);
      showToast(`Simulation completed for scenario: ${simScenario}. Digital twin rebalanced inventory buffers.`, 'success', 'Digital Twin');
    }, 1500);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
              INTELLIGENCE LAYER
            </span>
            <span className="text-xs font-mono text-os-text-muted">LIVE TOPOLOGY GRAPH</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Supply Chain Digital Twin</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Graphical representation of suppliers, plants, warehouses, transit nodes, and customer demand clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={simScenario} 
            onChange={(e) => setSimScenario(e.target.value)}
            className="bg-os-surface border border-os-border text-os-text-primary text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="demand-spike">Scenario: Demand +20% Spike</option>
            <option value="supplier-disruption">Scenario: Supplier Unavailable (10 Days)</option>
            <option value="port-delay">Scenario: Logistics Port Congestion (+3 Days)</option>
          </select>
          <button
            onClick={handleRunSimulation}
            disabled={simulationRunning}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 shadow transition-colors disabled:opacity-50"
          >
            <Play size={14} /> {simulationRunning ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Interactive Topology Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-os-surface border border-os-border rounded-xl p-6 relative min-h-[450px] flex flex-col justify-between overflow-hidden">
          {/* Background grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

          {/* Top Tier: Suppliers */}
          <div className="space-y-2 z-10">
            <div className="text-[10px] font-mono uppercase text-os-text-muted">Tier-1 Suppliers ({suppliers.length})</div>
            <div className="grid grid-cols-3 gap-3">
              {suppliers.slice(0, 3).map((sup: any, idx: number) => (
                <div
                  key={sup.id || idx}
                  onClick={() => setSelectedEntity({ type: 'Supplier', data: sup })}
                  className="bg-os-surface-secondary border border-os-border hover:border-cyan-500/50 p-3 rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-os-text-primary truncate">{sup.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-os-text-muted mt-1 font-mono">Risk: {sup.riskScore || 'Low'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Tier: Warehouses & Inventory */}
          <div className="space-y-2 z-10 my-6">
            <div className="text-[10px] font-mono uppercase text-os-text-muted">Orion Regional Distribution Hubs & Warehouses</div>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setSelectedEntity({ type: 'Warehouse', data: { name: 'North America Central Hub', capacity: '84%', stock: inventory.length } })}
                className="bg-os-surface-secondary border border-os-border hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg"><Boxes size={18} /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-os-text-primary">North America Central Hub</h4>
                    <span className="text-[10px] text-os-text-muted">Utilization: 84% • SKU Count: {inventory.length}</span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setSelectedEntity({ type: 'Warehouse', data: { name: 'European Logistics Center', capacity: '72%', stock: Math.floor(inventory.length * 0.8) } })}
                className="bg-os-surface-secondary border border-os-border hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Truck size={18} /></div>
                  <div>
                    <h4 className="text-xs font-semibold text-os-text-primary">European Logistics Center</h4>
                    <span className="text-[10px] text-os-text-muted">Utilization: 72% • Active Transit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tier: Shipments & Customers */}
          <div className="space-y-2 z-10">
            <div className="text-[10px] font-mono uppercase text-os-text-muted">Active Shipments & Customer Delivery Networks ({shipments.length})</div>
            <div className="grid grid-cols-2 gap-4">
              {shipments.slice(0, 2).map((sh: any, idx: number) => (
                <div
                  key={sh.id || idx}
                  onClick={() => setSelectedEntity({ type: 'Shipment', data: sh })}
                  className="bg-os-surface-secondary border border-os-border hover:border-cyan-500/50 p-3 rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-os-text-primary">{sh.id || `SH-${idx+1000}`}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{sh.status || 'In Transit'}</span>
                  </div>
                  <div className="text-[10px] text-os-text-muted mt-1">ETA: {sh.eta || 'Tomorrow'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Entity Inspector Drawer */}
        <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-os-text-muted">Entity Inspector</h3>
          {selectedEntity ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-os-surface-secondary rounded-lg border border-os-border space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase">{selectedEntity.type}</span>
                <h4 className="font-bold text-os-text-primary text-sm">{selectedEntity.data.name || selectedEntity.data.id}</h4>
              </div>

              <div className="space-y-2 text-os-text-secondary">
                <div className="flex justify-between py-1 border-b border-os-border">
                  <span>Status:</span>
                  <span className="font-mono text-emerald-400">Operational</span>
                </div>
                <div className="flex justify-between py-1 border-b border-os-border">
                  <span>Risk Exposure:</span>
                  <span className="font-mono text-os-text-primary">{selectedEntity.data.riskScore || 'Low'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Sync Timestamp:</span>
                  <span className="font-mono text-os-text-muted">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedEntity(null)}
                className="w-full py-2 bg-os-surface-hover hover:bg-os-surface border border-os-border text-os-text-primary font-medium rounded-lg mt-4"
              >
                Close Inspector
              </button>
            </div>
          ) : (
            <p className="text-xs text-os-text-muted italic py-8 text-center">Click any node in the digital twin topology to inspect real-time state and telemetry.</p>
          )}
        </div>
      </div>
    </div>
  );
};
