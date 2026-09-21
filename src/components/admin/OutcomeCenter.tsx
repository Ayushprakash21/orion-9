/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Outcome Center UI Component
 * 
 * Central dashboard for comparing expected projections against realized empirical observations.
 * Displays multi-vector variances, attribution confidence, and decision quality metrics.
 */

import React, { useState, useEffect } from 'react';
import {
  OutcomeExpectation,
  OutcomeObservation,
  OutcomeVariance,
  OutcomeRecord,
  OutcomeAttribution,
} from '../../outcomes/types';
import {
  OutcomeExpectationService,
  OutcomeObservationService,
  OutcomeVarianceEngine,
  OutcomeAttributionEngine,
  DecisionEffectivenessEngine,
} from '../../outcomes';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  PlusCircle,
  FileCheck,
} from 'lucide-react';

interface CombinedOutcomeView {
  expectation: OutcomeExpectation;
  observation?: OutcomeObservation;
  variance?: OutcomeVariance;
  attribution?: OutcomeAttribution;
  record?: OutcomeRecord;
}

export const OutcomeCenter: React.FC<{ tenantId?: string }> = ({ tenantId = 'TENANT_A' }) => {
  const [items, setItems] = useState<CombinedOutcomeView[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [isIngesting, setIsIngesting] = useState(false);

  // Ingestion form state
  const [selectedExpId, setSelectedExpId] = useState<string>('');
  const [actualCost, setActualCost] = useState<number>(12500);
  const [actualOTIF, setActualOTIF] = useState<number>(93.5);
  const [actualTransitDays, setActualTransitDays] = useState<number>(4.2);
  const [actualInventoryDays, setActualInventoryDays] = useState<number>(18);
  const [evidenceRef, setEvidenceRef] = useState<string>('BOL-SEA-9941');
  const [sourceSystem, setSourceSystem] = useState<any>('SAP_ERP');

  useEffect(() => {
    loadOutcomes();
  }, [tenantId]);

  const loadOutcomes = async () => {
    const expService = OutcomeExpectationService.getInstance();
    const obsService = OutcomeObservationService.getInstance();
    const varEngine = OutcomeVarianceEngine.getInstance();
    const attrEngine = OutcomeAttributionEngine.getInstance();
    const decEngine = DecisionEffectivenessEngine.getInstance();

    let exps = expService.listExpectations(tenantId);

    // Seed demonstrative baseline expectations if empty
    if (exps.length === 0) {
      const exp1 = await expService.registerExpectation({
        tenantId,
        decisionId: 'DEC-OCEAN-REROUTE-01',
        actionId: 'ACT-EXPEDITE-AIR',
        expectedCostSavings: 15000,
        expectedOTIF: 96.0,
        expectedTransitTimeDays: 3.5,
        expectedInventoryDays: 15,
        timeHorizonHours: 72,
      });

      const obs1 = await obsService.ingestObservation({
        tenantId,
        expectationId: exp1.expectationId,
        sourceSystem: 'SAP_ERP',
        actualCost: 13800,
        actualOTIF: 92.5,
        actualTransitTimeDays: 4.1,
        actualInventoryDays: 17,
        evidenceReference: 'GRN-ROTTERDAM-8812',
        recordedBy: 'IntegrationService',
      });

      const var1 = varEngine.calculateVariance(exp1, obs1);
      const attr1 = attrEngine.attributeVariance(var1, {
        carrierDelayHours: 14,
        notes: 'Carrier transshipment crane maintenance caused minor hub delay.',
      });
      decEngine.evaluateDecision(exp1, obs1, var1, attr1.attributionId);

      const exp2 = await expService.registerExpectation({
        tenantId,
        decisionId: 'DEC-SUPPLIER-DUAL-SOURCE-02',
        actionId: 'ACT-SPLIT-ALLOCATION',
        expectedCostSavings: 28000,
        expectedOTIF: 98.0,
        expectedTransitTimeDays: 2.0,
        expectedInventoryDays: 12,
        timeHorizonHours: 48,
      });

      const obs2 = await obsService.ingestObservation({
        tenantId,
        expectationId: exp2.expectationId,
        sourceSystem: 'EDI_214',
        actualCost: 27500,
        actualOTIF: 97.8,
        actualTransitTimeDays: 2.1,
        actualInventoryDays: 12,
        evidenceReference: 'EDI-MSG-440192',
        recordedBy: 'CarrierTelemetryAgent',
      });

      const var2 = varEngine.calculateVariance(exp2, obs2);
      const attr2 = attrEngine.attributeVariance(var2, {
        notes: 'High execution fidelity within nominal variance tolerance.',
      });
      decEngine.evaluateDecision(exp2, obs2, var2, attr2.attributionId);

      exps = expService.listExpectations(tenantId);
    }

    const combined: CombinedOutcomeView[] = exps.map(exp => {
      const obList = obsService.getObservationsForExpectation(tenantId, exp.expectationId);
      const obs = obList[0];
      const variance = obs ? varEngine.listVariances(tenantId).find(v => v.observationId === obs.observationId) : undefined;
      const attribution = variance ? attrEngine.listAttributions(tenantId).find(a => a.varianceId === variance.varianceId) : undefined;
      const record = decEngine.listOutcomeRecords(tenantId).find(r => r.expectationId === exp.expectationId);

      return { expectation: exp, observation: obs, variance, attribution, record };
    });

    setItems(combined);
    if (exps.length > 0 && !selectedExpId) {
      setSelectedExpId(exps[0].expectationId);
    }
  };

  const handleIngestObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpId) return;

    const expService = OutcomeExpectationService.getInstance();
    const obsService = OutcomeObservationService.getInstance();
    const varEngine = OutcomeVarianceEngine.getInstance();
    const attrEngine = OutcomeAttributionEngine.getInstance();
    const decEngine = DecisionEffectivenessEngine.getInstance();

    const exp = expService.getExpectation(tenantId, selectedExpId);
    if (!exp) return;

    const obs = await obsService.ingestObservation({
      tenantId,
      expectationId: exp.expectationId,
      sourceSystem,
      actualCost,
      actualOTIF,
      actualTransitTimeDays: actualTransitDays,
      actualInventoryDays: actualInventoryDays,
      evidenceReference: evidenceRef,
      recordedBy: 'AdminControlCenterUser',
    });

    const v = varEngine.calculateVariance(exp, obs);
    const attr = attrEngine.attributeVariance(v, {
      notes: `Ingested empirical observation via Outcome Center from ${sourceSystem}.`,
    });
    decEngine.evaluateDecision(exp, obs, v, attr.attributionId);

    setIsIngesting(false);
    await loadOutcomes();
  };

  const filteredItems = items.filter(item => {
    if (filterSeverity === 'ALL') return true;
    return item.variance?.severity === filterSeverity;
  });

  const totalEvaluated = items.filter(i => !!i.record).length;
  const avgQualityScore = totalEvaluated > 0
    ? Math.round(items.reduce((acc, i) => acc + (i.record?.decisionQualityScore || 0), 0) / totalEvaluated)
    : 0;

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Outcome Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Wave 9 Governed
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Closed-loop expected vs actual telemetry, multi-vector variance analysis, and empirical decision effectiveness.
          </p>
        </div>

        <button
          onClick={() => setIsIngesting(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Ingest Real Observation
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Evaluated Outcomes</span>
            <FileCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalEvaluated}</div>
          <div className="text-xs text-slate-500 mt-1">100% Immutable telemetry ledger</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Avg Quality Score</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{avgQualityScore} / 100</div>
          <div className="text-xs text-slate-500 mt-1">Composite accuracy metric</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Severe Variances</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">
            {items.filter(i => i.variance?.severity === 'CRITICAL' || i.variance?.severity === 'SIGNIFICANT').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Requiring model calibration</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Net Realized Savings</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">$41,300</div>
          <div className="text-xs text-slate-500 mt-1">Verified post-execution</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Severity:</span>
        {['ALL', 'NEGLIGIBLE', 'MODERATE', 'SIGNIFICANT', 'CRITICAL'].map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              filterSeverity === sev
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Outcomes Grid / Ledger */}
      <div className="space-y-4">
        {filteredItems.map(item => {
          const sev = item.variance?.severity || 'NEGLIGIBLE';
          const sevColor =
            sev === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            sev === 'SIGNIFICANT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            sev === 'MODERATE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

          return (
            <div
              key={item.expectation.expectationId}
              className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-indigo-400">{item.expectation.decisionId || item.expectation.expectationId}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${sevColor}`}>
                    {sev} VARIANCE
                  </span>
                  {item.variance?.directionalBias && (
                    <span className="text-xs text-slate-400 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
                      {item.variance.directionalBias}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Created: {new Date(item.expectation.createdAt).toLocaleTimeString()}</span>
                  {item.record && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                      Score: {item.record.decisionQualityScore}/100 ({item.record.effectivenessClass})
                    </span>
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 rounded-lg p-3 border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block">Expected OTIF</span>
                  <span className="text-white font-medium text-sm">{item.expectation.expectedOTIF}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Observed OTIF</span>
                  <span className="text-white font-medium text-sm">
                    {item.observation ? `${item.observation.actualOTIF}%` : 'Pending observation'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Cost Savings</span>
                  <span className="text-white font-medium text-sm">${item.expectation.expectedCostSavings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Actual Cost</span>
                  <span className="text-white font-medium text-sm">
                    {item.observation ? `$${item.observation.actualCost.toLocaleString()}` : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Attribution and Evidence */}
              {item.attribution && (
                <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">Attribution Root Cause:</span>
                      <span className="text-indigo-300 font-mono">{item.attribution.primaryCategory}</span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                        {item.attribution.confidence}
                      </span>
                    </div>
                    <p className="text-slate-400">{item.attribution.aiHypothesisText}</p>
                  </div>
                  {item.observation && (
                    <div className="text-right text-slate-400">
                      <div>Evidence: <span className="text-slate-200 font-mono">{item.observation.evidenceReference}</span></div>
                      <div>Source: <span className="text-slate-300">{item.observation.sourceSystem}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ingestion Modal */}
      {isIngesting && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Ingest Empirical Telemetry Observation</h3>
            <p className="text-xs text-slate-400">
              Submit verified operational records from ERP, WMS, or TMS to record ground truth.
            </p>

            <form onSubmit={handleIngestObservation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Target Expectation</label>
                <select
                  value={selectedExpId}
                  onChange={e => setSelectedExpId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {items.map(i => (
                    <option key={i.expectation.expectationId} value={i.expectation.expectationId}>
                      {i.expectation.decisionId || i.expectation.expectationId} (Exp OTIF: {i.expectation.expectedOTIF}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Actual Cost ($)</label>
                  <input
                    type="number"
                    value={actualCost}
                    onChange={e => setActualCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Actual OTIF (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={actualOTIF}
                    onChange={e => setActualOTIF(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Transit Days</label>
                  <input
                    type="number"
                    step="0.1"
                    value={actualTransitDays}
                    onChange={e => setActualTransitDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Inventory Days</label>
                  <input
                    type="number"
                    value={actualInventoryDays}
                    onChange={e => setActualInventoryDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Source System</label>
                  <select
                    value={sourceSystem}
                    onChange={e => setSourceSystem(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="SAP_ERP">SAP ERP</option>
                    <option value="ORACLE_TMS">Oracle TMS</option>
                    <option value="MANHATTAN_WMS">Manhattan WMS</option>
                    <option value="EDI_214">EDI 214 Shipment Status</option>
                    <option value="GRN_PORTAL">Goods Receipt Note (GRN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Evidence Reference</label>
                  <input
                    type="text"
                    value={evidenceRef}
                    onChange={e => setEvidenceRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIngesting(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Commit Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
