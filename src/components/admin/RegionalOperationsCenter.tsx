import React, { useState } from 'react';
import { 
  Globe2, Server, ShieldCheck, Activity, AlertTriangle, 
  CheckCircle2, RefreshCw, Cpu, Database, ArrowRightLeft,
  Lock, EyeOff, Radio
} from 'lucide-react';
import { 
  regionRegistry, 
  RegionDefinition, 
  RegionOperatingStatus 
} from '../../enterprise/region/RegionRegistry';
import { regionHealthService } from '../../enterprise/region/RegionHealthService';
import { 
  dataResidencyPolicyEngine, 
  DataResidencyPolicy 
} from '../../enterprise/residency/DataResidencyPolicyEngine';
import { useAuth } from '../../store/AuthContext';

export const RegionalOperationsCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [regions, setRegions] = useState<RegionDefinition[]>(() => regionRegistry.listRegions());
  const [selectedRegion, setSelectedRegion] = useState<RegionDefinition | null>(() => {
    return regionRegistry.getPrimaryRegion() || null;
  });
  const [policies, setPolicies] = useState<DataResidencyPolicy[]>(() => dataResidencyPolicyEngine.listPolicies(tenantId));

  const refreshTelemetry = () => {
    setRegions(regionRegistry.listRegions());
    setPolicies(dataResidencyPolicyEngine.listPolicies(tenantId));
  };

  const handleStatusChange = (regionId: string, newStatus: RegionOperatingStatus) => {
    regionRegistry.updateRegionStatus(regionId, newStatus);
    refreshTelemetry();
  };

  const getStatusColor = (status: RegionOperatingStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DEGRADED': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DRAINING': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'FAILOVER': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'OFFLINE': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'MAINTENANCE': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="regional-operations-center">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Regional Operations Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              Multi-Region Topology, Sovereignty Boundaries & Data Residency Controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded flex items-center gap-1.5">
            <Radio size={12} className="animate-pulse text-amber-400" />
            RUNTIME: SIMULATED MULTI-REGION
          </span>
          <button
            type="button"
            onClick={refreshTelemetry}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh Telemetry"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Region Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {regions.map((reg) => {
          const assessment = regionHealthService.assessRegion(reg.regionId);
          const isSelected = selectedRegion?.regionId === reg.regionId;

          return (
            <div
              key={reg.regionId}
              onClick={() => setSelectedRegion(reg)}
              className={`p-4 bg-[#0d1117] border rounded cursor-pointer transition-all ${
                isSelected 
                  ? 'border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.15)]' 
                  : 'border-os-border hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-text-muted">
                  {reg.cloudProvider} ({reg.providerRegion})
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold ${getStatusColor(reg.status)}`}>
                  {reg.status}
                </span>
              </div>

              <h2 className="text-sm font-bold text-white mt-2 truncate">{reg.name}</h2>
              <div className="text-[10px] font-mono text-[#00F2FE] mt-0.5">{reg.role}</div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-os-border/50 text-[10px] font-mono">
                <div>
                  <div className="text-os-text-muted">Latency P95</div>
                  <div className="text-white font-bold mt-0.5">{reg.healthMetrics.latencyP95Ms}ms</div>
                </div>
                <div>
                  <div className="text-os-text-muted">Current RPS</div>
                  <div className="text-white font-bold mt-0.5">{reg.capacity.currentRps} / {reg.capacity.maxRps}</div>
                </div>
                <div>
                  <div className="text-os-text-muted">Workers</div>
                  <div className="text-white font-bold mt-0.5">{reg.capacity.activeWorkers}</div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="mt-4 pt-3 border-t border-os-border/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-os-text-muted">Set State:</span>
                <select
                  value={reg.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleStatusChange(reg.regionId, e.target.value as RegionOperatingStatus)}
                  className="text-[10px] font-mono bg-black/50 border border-os-border rounded px-2 py-1 text-white outline-none focus:border-[#00F2FE]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DEGRADED">DEGRADED</option>
                  <option value="DRAINING">DRAINING</option>
                  <option value="FAILOVER">FAILOVER</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split Section: Region Details & Data Residency Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Selected Region Inspector */}
        <div className="bg-[#0d1117] border border-os-border rounded p-4 flex flex-col space-y-4">
          <div className="border-b border-os-border pb-3">
            <span className="text-[10px] font-mono text-os-text-muted uppercase">Regional Inspector</span>
            <h2 className="text-base font-bold text-white mt-1">{selectedRegion?.name}</h2>
            <div className="text-xs font-mono text-[#00F2FE]">{selectedRegion?.regionId}</div>
          </div>

          {selectedRegion && (
            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-black/40 border border-os-border rounded space-y-1">
                <div className="text-[10px] font-mono text-os-text-muted uppercase">Ingress Endpoint URL</div>
                <div className="font-mono text-white text-[11px] break-all">{selectedRegion.endpointUrl}</div>
              </div>

              <div className="p-2.5 bg-black/40 border border-os-border rounded space-y-1">
                <div className="text-[10px] font-mono text-os-text-muted uppercase">Sovereign Jurisdiction</div>
                <div className="font-mono text-emerald-400 font-bold">{selectedRegion.sovereigntyJurisdiction}</div>
              </div>

              <div className="p-2.5 bg-black/40 border border-os-border rounded space-y-2">
                <div className="text-[10px] font-mono text-os-text-muted uppercase">Enabled Regional Capabilities</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {Object.entries(selectedRegion.capabilities).map(([cap, enabled]) => (
                    <div key={cap} className="flex items-center gap-1.5">
                      {enabled ? (
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-os-border shrink-0" />
                      )}
                      <span className={enabled ? 'text-white' : 'text-os-text-muted line-through'}>
                        {cap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-black/40 border border-os-border rounded space-y-1">
                <div className="text-[10px] font-mono text-os-text-muted uppercase">Allowed Tenant Tiers</div>
                <div className="flex flex-wrap gap-1">
                  {selectedRegion.allowedTenantTiers.map(tier => (
                    <span key={tier} className="px-2 py-0.5 text-[9px] font-mono bg-white/5 border border-os-border rounded text-os-text-secondary">
                      {tier}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Cols: Sovereign Data Residency Policies */}
        <div className="lg:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-os-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Sovereign Data Residency Policies</h2>
                <p className="text-[11px] font-mono text-os-text-muted">Fail-Closed Cross-Border Transfer Engine</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
              FAIL-CLOSED ENFORCED
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {policies.map(policy => (
              <div key={policy.policyId} className="p-3 bg-black/30 border border-os-border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-mono rounded border font-bold uppercase ${
                      policy.boundaryType === 'STRICT_SOVEREIGN'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {policy.boundaryType}
                    </span>
                    <span className="text-xs font-bold text-white">{policy.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {policy.sovereignJurisdiction}
                  </span>
                </div>

                <div className="text-[11px] text-os-text-secondary">
                  <span className="text-os-text-muted font-mono">Applicable Entities: </span>
                  {policy.applicableEntities.join(', ')}
                </div>

                {policy.restrictedFields.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                    <span className="text-amber-400 flex items-center gap-1">
                      <EyeOff size={11} /> Redacted Fields:
                    </span>
                    {policy.restrictedFields.map(f => (
                      <span key={f} className="px-1.5 py-0.2 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-os-border/40 text-[10px] font-mono text-os-text-muted">
                  <span>Approved Regions: [{policy.allowedDestinationRegions.join(', ')}]</span>
                  <span>ID: {policy.policyId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
