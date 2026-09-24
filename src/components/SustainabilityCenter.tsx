import React, { useState } from 'react';
import { 
  Leaf, RefreshCw, CheckCircle2, AlertTriangle, 
  BarChart2, Wind, Zap, Package, Award
} from 'lucide-react';
import { sustainabilityEngine, SustainabilityMetricsRecord } from '../scm';
import { useAuth } from '../store/AuthContext';

export const SustainabilityCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [metricsHistory, setMetricsHistory] = useState<SustainabilityMetricsRecord[]>(() => 
    sustainabilityEngine.getMetricsHistory(tenantId)
  );

  const [period, setPeriod] = useState('2026-M10');
  const [freightTkm, setFreightTkm] = useState(485000);
  const [warehouseKwh, setWarehouseKwh] = useState(124000);
  const [unitsShipped, setUnitsShipped] = useState(35000);
  const [recycledPackagingPct, setRecycledPackagingPct] = useState(88);
  const [supplierEsg, setSupplierEsg] = useState(84);
  const [offsetPurchased, setOffsetPurchased] = useState(15000);

  const refreshList = () => {
    setMetricsHistory(sustainabilityEngine.getMetricsHistory(tenantId));
  };

  const handleComputeMetrics = () => {
    sustainabilityEngine.calculateMetrics({
      tenantId,
      period,
      freightTkm,
      warehouseKwh,
      totalUnitsShipped: unitsShipped,
      packagingRecycledPct: recycledPackagingPct,
      supplierEsggAvg: supplierEsg,
      offsetPurchasedKg: offsetPurchased
    });
    refreshList();
  };

  const latest = metricsHistory[0];

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6 bg-[#03060E] text-white overflow-y-auto font-sans" data-testid="sustainability-center">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Leaf className="w-6 h-6 text-emerald-400" />
              Supply Chain Sustainability & Carbon Accounting (ESG)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              SCOPE 1 / 2 / 3 ACCOUNTING
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Freight Ton-Kilometers (tkm), Warehouse Energy Emissions, Circular Packaging, and Supplier ESG Scores.
          </p>
        </div>
        <button 
          onClick={refreshList}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-white/50 block">Scope 1 Direct CO2</span>
            <span className="text-xl font-bold text-white mt-1 block">{(latest.scope1DirectCo2Kg / 1000).toFixed(1)} MT</span>
            <span className="text-[10px] text-white/40">Direct fleet transport</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-white/50 block">Scope 2 Indirect Power</span>
            <span className="text-xl font-bold text-white mt-1 block">{(latest.scope2IndirectCo2Kg / 1000).toFixed(1)} MT</span>
            <span className="text-[10px] text-white/40">Warehouse electrical load</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-white/50 block">Scope 3 Freight Value Chain</span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">{(latest.scope3ValueChainCo2Kg / 1000).toFixed(1)} MT</span>
            <span className="text-[10px] text-white/40">Upstream + Carrier networks</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-white/50 block">Net Carbon Intensity</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">{latest.netCarbonIntensityKgPerUnit} kg/unit</span>
            <span className="text-[10px] text-emerald-400">Target &lt; 2.5 kg/unit</span>
          </div>
        </div>
      )}

      {/* Calculator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Audit Period Parameters
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-white/60 block mb-1">Accounting Month / Period</label>
              <input 
                type="text" 
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 block mb-1">Freight Transport Ton-Kilometers (tkm)</label>
              <input 
                type="number" 
                value={freightTkm}
                onChange={e => setFreightTkm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/60 block mb-1">Warehouse Energy Consumption (kWh)</label>
              <input 
                type="number" 
                value={warehouseKwh}
                onChange={e => setWarehouseKwh(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/60 block mb-1">Units Shipped</label>
                <input 
                  type="number" 
                  value={unitsShipped}
                  onChange={e => setUnitsShipped(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1">Recycled Packaging %</label>
                <input 
                  type="number" 
                  value={recycledPackagingPct}
                  onChange={e => setRecycledPackagingPct(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-white/60 block mb-1">Supplier ESG Score</label>
                <input 
                  type="number" 
                  value={supplierEsg}
                  onChange={e => setSupplierEsg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/60 block mb-1">Carbon Offsets (kg)</label>
                <input 
                  type="number" 
                  value={offsetPurchased}
                  onChange={e => setOffsetPurchased(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white"
                />
              </div>
            </div>

            <button 
              onClick={handleComputeMetrics}
              className="w-full py-2.5 mt-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Leaf className="w-4 h-4" />
              Calculate Period Emissions
            </button>
          </div>
        </div>

        {/* Historical Ledger */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Audited ESG & Carbon Ledger
            </h2>
            <span className="text-xs text-white/40">{metricsHistory.length} audit records</span>
          </div>

          <div className="space-y-3">
            {metricsHistory.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
                No sustainability audits executed yet. Calculate period emissions on the left.
              </div>
            ) : (
              metricsHistory.map(met => (
                <div key={met.sustainabilityId} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-sm text-white">Period: {met.period}</span>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        Supplier ESG Score: <strong className="text-emerald-400">{met.supplierEsggAvgScore}/100</strong> • Packaging Circularity: <strong className="text-blue-300">{met.packagingRecycledContentPct}%</strong>
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {met.netCarbonIntensityKgPerUnit} kg CO2/unit
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] p-2 rounded bg-white/5 border border-white/5">
                    <div>
                      <span className="text-white/40 block">Transport CO2</span>
                      <span className="font-semibold text-white">{(met.totalTransportCo2Kg / 1000).toFixed(1)} MT</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Warehouse Energy</span>
                      <span className="font-semibold text-white">{met.totalWarehouseEnergyKwh.toLocaleString()} kWh</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Scope 3 Total</span>
                      <span className="font-semibold text-amber-300">{(met.scope3ValueChainCo2Kg / 1000).toFixed(1)} MT</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Offset Applied</span>
                      <span className="font-semibold text-emerald-300">-{(met.offsetPurchasedKg / 1000).toFixed(1)} MT</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
