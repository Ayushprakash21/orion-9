/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Drift Center UI Component
 * 
 * Continuous observability into concept and data distribution shifts across operational variables.
 */

import React, { useState, useEffect } from 'react';
import { DriftSignal, DriftState } from '../../outcomes/types';
import { DriftDetectionEngine } from '../../outcomes';
import {
  Compass,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react';

export const DriftCenter: React.FC<{ tenantId?: string }> = ({ tenantId = 'TENANT_A' }) => {
  const [signals, setSignals] = useState<DriftSignal[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSignals();
  }, [tenantId]);

  const loadSignals = () => {
    const engine = DriftDetectionEngine.getInstance();
    let list = engine.listDriftSignals(tenantId);

    if (list.length === 0) {
      // Seed default monitored features
      const s1 = engine.evaluateDrift({
        tenantId,
        featureName: 'transpacific_ocean_transit_days',
        baselineMean: 14.2,
        currentMean: 17.8,
        threshold: 15.0,
      });

      const s2 = engine.evaluateDrift({
        tenantId,
        featureName: 'port_dwell_time_rotterdam_hours',
        baselineMean: 36.0,
        currentMean: 41.5,
        threshold: 15.0,
      });

      const s3 = engine.evaluateDrift({
        tenantId,
        featureName: 'supplier_po_acknowledgment_lead_hours',
        baselineMean: 12.0,
        currentMean: 12.4,
        threshold: 20.0,
      });

      const s4 = engine.evaluateDrift({
        tenantId,
        featureName: 'spot_container_freight_feus_usd',
        baselineMean: 2400,
        currentMean: 3250,
        threshold: 20.0,
      });

      list = [s1, s2, s3, s4];
    }

    setSignals(list);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadSignals();
      setIsRefreshing(false);
    }, 400);
  };

  const criticalCount = signals.filter(s => s.driftState === 'CRITICAL_DRIFT').length;
  const driftCount = signals.filter(s => s.driftState === 'DRIFT').length;
  const watchCount = signals.filter(s => s.driftState === 'WATCH').length;
  const normalCount = signals.filter(s => s.driftState === 'NORMAL').length;

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Drift Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Continuous Telemetry Monitor
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Detects concept and distribution drift across lead times, supplier execution, and cost parameters before SLA failure.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          Recalculate Drift Metrics
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Normal Operations</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{normalCount}</div>
          <div className="text-xs text-slate-500 mt-1">&lt; 5% divergence from baseline</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Watchlist Features</div>
          <div className="mt-2 text-2xl font-bold text-blue-400">{watchCount}</div>
          <div className="text-xs text-slate-500 mt-1">5% - 15% mild divergence</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Active Drift</div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{driftCount}</div>
          <div className="text-xs text-slate-500 mt-1">15% - 30% calibration recommended</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Critical Drift</div>
          <div className="mt-2 text-2xl font-bold text-red-400">{criticalCount}</div>
          <div className="text-xs text-slate-500 mt-1">&gt; 30% emergency retuning required</div>
        </div>
      </div>

      {/* Drift Signals Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            Operational Feature Distribution Telemetry
          </h3>
          <span className="text-xs text-slate-500">{signals.length} features tracked</span>
        </div>

        <div className="divide-y divide-slate-800">
          {signals.map(signal => {
            const isCritical = signal.driftState === 'CRITICAL_DRIFT';
            const isDrift = signal.driftState === 'DRIFT';
            const isWatch = signal.driftState === 'WATCH';

            const badgeColor = isCritical
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : isDrift
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : isWatch
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

            return (
              <div key={signal.driftId} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">{signal.featureName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${badgeColor}`}>
                      {signal.driftState}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-4">
                    <span>Baseline Mean: <strong className="text-slate-200">{signal.baselineDistributionMean}</strong></span>
                    <span>Current Mean: <strong className="text-slate-200">{signal.currentDistributionMean}</strong></span>
                    <span>Alert Threshold: {signal.threshold}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Divergence Score</div>
                    <div className={`text-base font-bold ${isCritical ? 'text-red-400' : isDrift ? 'text-amber-400' : 'text-slate-200'}`}>
                      +{signal.divergenceScore}%
                    </div>
                  </div>

                  <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isCritical ? 'bg-red-500' : isDrift ? 'bg-amber-500' : isWatch ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, signal.divergenceScore * 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
