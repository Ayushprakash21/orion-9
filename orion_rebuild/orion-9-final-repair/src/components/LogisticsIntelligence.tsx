import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import {
  Truck, Navigation, Clock, DollarSign, AlertTriangle, CheckCircle2,
  TrendingDown, Globe, Shuffle, BarChart2, ShieldCheck, ArrowRight
} from 'lucide-react';

export const LogisticsIntelligence: React.FC = () => {
  const { carriers, routes, shipments } = useSupplyChain();
  const [activeTab, setActiveTab] = useState<'carriers' | 'routes' | 'consolidation'>('carriers');

  const delayedShipments = shipments.filter(s => s.status === 'Delayed');
  const avgCarrierReliability = Math.round(
    carriers.reduce((acc, c) => acc + c.onTimeReliability, 0) / Math.max(carriers.length, 1) * 10
  ) / 10;

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight">Transportation Planning & Logistics Optimization</h1>
          <p className="text-sm text-os-text-secondary mt-1">
            Carrier reliability scoring, lane congestion analytics, mode selection trade-offs, and freight consolidation.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Carrier Network Reliability</span>
            <ShieldCheck size={16} className="text-[#00F2FE]" />
          </div>
          <div className="text-2xl font-bold text-os-text-primary mt-2">{avgCarrierReliability}%</div>
          <div className="text-xs text-emerald-400 mt-1">Weighted on-time arrival rate</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Monitored Transit Lanes</span>
            <Navigation size={16} className="text-[#00F2FE]" />
          </div>
          <div className="text-2xl font-bold text-os-text-primary mt-2">{routes.length} Active Lanes</div>
          <div className="text-xs text-os-text-muted mt-1">Multimodal ocean, air & road</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Delayed In-Transit Loads</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{delayedShipments.length} Shipments</div>
          <div className="text-xs text-amber-400/80 mt-1">Average delay: 2.8 days</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-os-text-secondary uppercase tracking-wider">
            <span>Consolidation Savings Potential</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">$34,200</div>
          <div className="text-xs text-emerald-400/80 mt-1">3 active multi-drop opportunities</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-os-border space-x-6">
        <button
          onClick={() => setActiveTab('carriers')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'carriers'
              ? 'border-[#00F2FE] text-[#00F2FE]'
              : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
          }`}
        >
          Carrier Performance & Scorecards ({carriers.length})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'routes'
              ? 'border-[#00F2FE] text-[#00F2FE]'
              : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
          }`}
        >
          Transit Lanes & Congestion Analysis ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab('consolidation')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'consolidation'
              ? 'border-[#00F2FE] text-[#00F2FE]'
              : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
          }`}
        >
          Freight Consolidation Opportunities (3)
        </button>
      </div>

      {/* Tab 1: Carriers */}
      {activeTab === 'carriers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carriers.map(carrier => (
            <div key={carrier.id} className="p-5 bg-os-surface border border-os-border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#00F2FE] bg-[#00F2FE]/10 px-2 py-0.5 rounded">
                      {carrier.id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      carrier.status === 'Preferred'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : carrier.status === 'Active'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {carrier.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-os-text-primary mt-1.5">{carrier.name}</h3>
                  <p className="text-xs text-os-text-muted mt-0.5">Modes: {carrier.modes.join(', ')}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#00F2FE]">{carrier.onTimeReliability}%</div>
                  <span className="text-[10px] text-os-text-muted uppercase">OTIF SLA</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-os-border text-xs">
                <div>
                  <span className="text-os-text-muted block text-[10px]">Avg Delay</span>
                  <span className="font-semibold text-os-text-primary">{carrier.averageDelayDays} d</span>
                </div>
                <div>
                  <span className="text-os-text-muted block text-[10px]">Cost/ton-km</span>
                  <span className="font-semibold text-os-text-primary">${carrier.costPerTonKm}</span>
                </div>
                <div>
                  <span className="text-os-text-muted block text-[10px]">Active Loads</span>
                  <span className="font-semibold text-os-text-primary">{carrier.activeShipmentsCount}</span>
                </div>
              </div>

              {carrier.averageDelayDays > 2 && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  <span>High delay latency detected on ocean sailings</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Routes */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="bg-os-surface border border-os-border rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-os-surface text-os-text-muted uppercase font-semibold border-b border-os-border">
                <tr>
                  <th className="p-3.5">Lane ID</th>
                  <th className="p-3.5">Origin & Destination</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Lead Time</th>
                  <th className="p-3.5">Congestion Level</th>
                  <th className="p-3.5">Delay Risk</th>
                  <th className="p-3.5">Freight Index (TEU)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-os-text-primary">
                {routes.map(route => (
                  <tr key={route.id} className="hover:bg-os-surface-hover">
                    <td className="p-3.5 font-mono text-[#00F2FE]">{route.id}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-os-text-primary">{route.origin}</div>
                      <div className="text-os-text-muted flex items-center gap-1 mt-0.5">
                        <ArrowRight size={11} /> {route.destination}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium">{route.mode}</td>
                    <td className="p-3.5 font-semibold text-os-text-primary">{route.standardLeadTimeDays} days</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        route.currentCongestionLevel === 'Severe'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : route.currentCongestionLevel === 'Moderate'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {route.currentCongestionLevel}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-os-text-primary">{route.typicalDelayRisk}%</td>
                    <td className="p-3.5 font-mono font-semibold text-os-text-primary">${route.freightIndexPerTeu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Consolidation Opportunities */}
      {activeTab === 'consolidation' && (
        <div className="space-y-4">
          <div className="p-5 bg-os-surface border border-os-border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-[#00F2FE] bg-[#00F2FE]/10 px-2 py-0.5 rounded">CONSOL-001</span>
                <h3 className="text-base font-bold text-os-text-primary mt-1.5">Shanghai → Nhava Sheva (Mumbai) LCL to FCL Conversion</h3>
                <p className="text-xs text-os-text-secondary mt-0.5">
                  Merge 3 pending Less-than-Container Load orders into single dedicated 40HC container with Maersk.
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">$14,800 Savings</div>
                <div className="text-xs text-os-text-muted">Consolidation readiness: 100%</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-os-border flex justify-between items-center text-xs">
              <span className="text-os-text-secondary">Impact: Reduces ocean freight costs by 26% and eliminates double terminal handling fees.</span>
              <button
                onClick={() => alert('Consolidation instruction dispatched to freight forwarder.')}
                className="px-3 py-1.5 bg-[#00F2FE] text-black font-semibold rounded hover:bg-os-surface/95 transition-colors"
              >
                Execute Consolidation
              </button>
            </div>
          </div>

          <div className="p-5 bg-os-surface border border-os-border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-[#00F2FE] bg-[#00F2FE]/10 px-2 py-0.5 rounded">CONSOL-002</span>
                <h3 className="text-base font-bold text-os-text-primary mt-1.5">Domestic Inter-DC Milk-Run: Delhi North → Mumbai Central</h3>
                <p className="text-xs text-os-text-secondary mt-0.5">
                  Combine outbound customer orders SO-2026-101 and transfer replenishment into one dedicated 32ft FTL truck.
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">$8,200 Savings</div>
                <div className="text-xs text-os-text-muted">Consolidation readiness: 85%</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-os-border flex justify-between items-center text-xs">
              <span className="text-os-text-secondary">Impact: Eliminates 1 empty backhaul run and improves vehicle cubic fill from 54% to 92%.</span>
              <button
                onClick={() => alert('Route optimization dispatched to dispatch desk.')}
                className="px-3 py-1.5 bg-[#00F2FE] text-black font-semibold rounded hover:bg-os-surface/95 transition-colors"
              >
                Execute Consolidation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
