/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Configuration Center UI Component
 * 
 * Versioned immutable configuration management, side-by-side diff inspection,
 * 1-click rollback, secret reference masking, and feature flag controls.
 */

import React, { useState, useEffect } from 'react';
import {
  configurationService,
  secretReferenceService,
  featureFlagService,
  SystemConfig,
  ConfigVersion,
  SecretReference,
  FeatureFlag,
} from '../../operations';
import {
  Sliders,
  RotateCcw,
  Key,
  Flag,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Lock,
  Search,
  EyeOff,
  History,
} from 'lucide-react';

export const ConfigurationCenter: React.FC<{ tenantId?: string }> = ({ tenantId = 'GLOBAL' }) => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [secrets, setSecrets] = useState<SecretReference[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [activeTab, setActiveTab] = useState<'CONFIGS' | 'VERSIONS' | 'SECRETS' | 'FLAGS'>('CONFIGS');

  // Edit config modal
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  // Diff inspection
  const [fromVersionId, setFromVersionId] = useState<string>('');
  const [toVersionId, setToVersionId] = useState<string>('');
  const [diffResult, setDiffResult] = useState<any>(null);

  const loadData = () => {
    setConfigs(configurationService.getAllConfigs(tenantId));
    const allVers = configurationService.getAllVersions();
    setVersions(allVers);
    if (allVers.length >= 2 && !fromVersionId) {
      setFromVersionId(allVers[1].versionId);
      setToVersionId(allVers[0].versionId);
    }
    setSecrets(secretReferenceService.getAllSecretReferences());
    setFlags(featureFlagService.getAllFlags());
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    let parsedVal: any = editValue;
    try {
      parsedVal = JSON.parse(editValue);
    } catch {
      // keep as string
    }

    configurationService.setConfig(
      editingConfig.key,
      parsedVal,
      'platform_admin',
      editReason.trim() || 'Manual configuration update'
    );

    setEditingConfig(null);
    setEditReason('');
    loadData();
  };

  const handleInspectDiff = () => {
    if (!fromVersionId || !toVersionId) return;
    const diff = configurationService.diffVersions(fromVersionId, toVersionId);
    setDiffResult(diff);
  };

  const handleRollback = (targetVersionId: string) => {
    if (window.confirm(`Confirm 1-click rollback to configuration version ${targetVersionId}?`)) {
      configurationService.rollbackToVersion(
        targetVersionId,
        'platform_admin',
        'Emergency operational rollback via Configuration Center'
      );
      loadData();
    }
  };

  const handleToggleFlag = (flagKey: string) => {
    const flag = flags.find(f => f.key === flagKey);
    if (!flag) return;
    const updated = {
      ...flag,
      enabled: !flag.enabled,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'platform_admin',
    };
    featureFlagService.setFlag(updated);
    setFlags(featureFlagService.getAllFlags());
  };

  const handleToggleKillSwitch = (flagKey: string) => {
    const flag = flags.find(f => f.key === flagKey);
    if (!flag) return;
    if (flag.emergencyKillSwitch) {
      featureFlagService.resetEmergencyKillSwitch(flagKey, 'platform_admin');
    } else {
      featureFlagService.tripEmergencyKillSwitch(flagKey, 'platform_admin');
    }
    setFlags(featureFlagService.getAllFlags());
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sliders className="h-6 w-6 text-cyan-400" />
              Configuration Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Immutable Governance
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise system parameter versioning, side-by-side diff audits, 1-click atomic rollback, and secret masking.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('CONFIGS')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'CONFIGS' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-4 w-4" />
          System Parameters ({configs.length})
        </button>
        <button
          onClick={() => setActiveTab('VERSIONS')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'VERSIONS' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="h-4 w-4" />
          Version Diffs & Rollback ({versions.length})
        </button>
        <button
          onClick={() => setActiveTab('SECRETS')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'SECRETS' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="h-4 w-4" />
          Secret References ({secrets.length})
        </button>
        <button
          onClick={() => setActiveTab('FLAGS')}
          className={`pb-3 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'FLAGS' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flag className="h-4 w-4" />
          Feature Flags ({flags.length})
        </button>
      </div>

      {/* TAB 1: SYSTEM CONFIGS */}
      {activeTab === 'CONFIGS' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configs.map(cfg => (
              <div
                key={cfg.key}
                className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-400">{cfg.key}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                      v{cfg.version} • {cfg.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{cfg.description}</p>
                  <div className="mt-3 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-white">
                    Value: <strong>{JSON.stringify(cfg.value)}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>{cfg.requiresRestart ? '⚠️ Requires Restart' : '⚡ Hot-Reloadable'}</span>
                  <button
                    onClick={() => {
                      setEditingConfig(cfg);
                      setEditValue(JSON.stringify(cfg.value));
                    }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition"
                  >
                    Edit Parameter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VERSION DIFFS & ROLLBACK */}
      {activeTab === 'VERSIONS' && (
        <div className="space-y-6">
          {/* Diff Controls */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Compare From:</span>
              <select
                value={fromVersionId}
                onChange={e => setFromVersionId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                {versions.map(v => (
                  <option key={v.versionId} value={v.versionId}>
                    {v.versionId} ({new Date(v.createdAt).toLocaleTimeString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">To:</span>
              <select
                value={toVersionId}
                onChange={e => setToVersionId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              >
                {versions.map(v => (
                  <option key={v.versionId} value={v.versionId}>
                    {v.versionId} ({new Date(v.createdAt).toLocaleTimeString()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleInspectDiff}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded transition"
            >
              Inspect Diff
            </button>
          </div>

          {/* Diff Result Card */}
          {diffResult && (
            <div className="p-5 bg-slate-900/70 border border-cyan-500/30 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-cyan-400" />
                Diff Inspection: {diffResult.fromVersionId} $\rightarrow$ {diffResult.toVersionId}
              </h3>

              {diffResult.modifiedKeys.length === 0 &&
              diffResult.addedKeys.length === 0 &&
              diffResult.removedKeys.length === 0 ? (
                <p className="text-xs text-slate-400">Identical parameter configurations. Zero diff detected.</p>
              ) : (
                <div className="space-y-2">
                  {diffResult.modifiedKeys.map((m: any) => (
                    <div key={m.key} className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                      <span className="text-cyan-400 font-semibold">{m.key}</span>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-rose-400">- {JSON.stringify(m.oldValue)}</span>
                        <span className="text-slate-500">$\rightarrow$</span>
                        <span className="text-emerald-400">+ {JSON.stringify(m.newValue)}</span>
                        {m.requiresRestart && (
                          <span className="text-[10px] text-amber-400 ml-auto">[Restart Required]</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Version History Table with 1-Click Rollback */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Immutable Version Catalog
            </div>
            <div className="divide-y divide-slate-800">
              {versions.map((ver, idx) => (
                <div key={ver.versionId} className="p-4 flex items-center justify-between hover:bg-slate-900/70 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{ver.versionId}</span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ACTIVE
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-mono">[{ver.checksum}]</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{ver.reason}</p>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                      Created by {ver.createdBy} at {new Date(ver.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {idx !== 0 && (
                    <button
                      onClick={() => handleRollback(ver.versionId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Rollback to this
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECRET REFERENCES */}
      {activeTab === 'SECRETS' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center gap-3">
            <Lock className="h-5 w-5 text-emerald-400" />
            <p className="text-xs text-slate-300">
              Provider-Agnostic SecretReference architecture. Plaintext values are strictly forbidden in client bundles and UI views.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secrets.map(sec => (
              <div key={sec.secretId} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">{sec.secretId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-400 font-mono">
                    {sec.provider}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-400 space-y-1">
                  <div>Ref: <span className="text-slate-300">{sec.referenceKey}</span></div>
                  <div>Masked: <span className="text-emerald-400 font-bold">{sec.maskedValue}</span></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Last rotated: {new Date(sec.lastRotatedAt || '').toLocaleDateString()}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <EyeOff className="h-3 w-3" /> Fully Redacted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FEATURE FLAGS */}
      {activeTab === 'FLAGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flags.map(flag => (
            <div key={flag.key} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{flag.key}</span>
                <span className="text-xs text-slate-400 font-mono">{flag.rolloutPercentage}% Rollout</span>
              </div>
              <p className="text-xs text-slate-300">{flag.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleToggleFlag(flag.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    flag.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {flag.enabled ? 'ENABLED' : 'DISABLED'}
                </button>

                <button
                  onClick={() => handleToggleKillSwitch(flag.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    flag.emergencyKillSwitch
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {flag.emergencyKillSwitch ? 'KILL SWITCH TRIPPED' : 'Kill Switch Armed'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Config Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Edit Parameter: {editingConfig.key}</h3>
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Value (JSON or string)</label>
                <input
                  type="text"
                  required
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  placeholder="Reason for parameter calibration..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
                  className="px-3 py-1.5 bg-slate-800 text-xs rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 text-xs font-semibold text-white rounded"
                >
                  Save & Bump Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
