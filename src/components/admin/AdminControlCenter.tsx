import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BrainCircuit, ChevronRight, Play, Save, Shield, CheckCircle2, AlertTriangle, Lock, Eye, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { KernelAuditEngine } from '../../kernel/AuditEngine';
import { AutonomyGovernanceEngine } from '../../workflows/AutonomyGovernanceEngine';
import {
  controlPolicyService,
  ControlPolicyRecord,
  ControlProposalRecord,
  SimulationRunRecord,
  Mode,
  Policy,
  Scope,
} from '../../services/ControlPolicyService';

export type { Mode, Policy, Scope };

export type Capability = {
  id: string;
  name: string;
  description: string;
  defaultMode: Mode;
  risk: 'Low' | 'Medium' | 'High';
};

export type Domain = {
  id: string;
  name: string;
  priority: string;
  description: string;
  capabilities: Capability[];
};

export const DOMAINS: Domain[] = [
  {
    id: 'users-rbac',
    name: 'Users & RBAC',
    priority: 'P0',
    description: 'Identity, roles, permissions, sessions and access governance.',
    capabilities: [
      { id: 'role-management', name: 'Role Management', description: 'Create and govern roles and permissions.', defaultMode: 'Manual', risk: 'High' },
      { id: 'mfa-policy', name: 'MFA Policy', description: 'Control multi-factor authentication requirements.', defaultMode: 'Manual', risk: 'High' },
      { id: 'session-policy', name: 'Session Policy', description: 'Configure session duration and concurrent access rules.', defaultMode: 'AI Copilot', risk: 'Medium' },
    ],
  },
  {
    id: 'security',
    name: 'Security',
    priority: 'P0',
    description: 'Security controls, secrets, audit and resilience.',
    capabilities: [
      { id: 'security-policy', name: 'Security Policy', description: 'Review and enforce platform security controls.', defaultMode: 'Manual', risk: 'High' },
      { id: 'audit-retention', name: 'Audit Retention', description: 'Define audit retention and evidence requirements.', defaultMode: 'AI Copilot', risk: 'Medium' },
      { id: 'security-controls', name: 'Security controls', description: 'Review security posture, encryption and compliance guardrails.', defaultMode: 'Manual', risk: 'High' },
    ],
  },
  {
    id: 'master-data',
    name: 'Master Data',
    priority: 'P0',
    description: 'Canonical suppliers, customers, SKUs, facilities and reference data.',
    capabilities: [
      { id: 'sku-governance', name: 'SKU Governance', description: 'Approve and control SKU master-data changes.', defaultMode: 'Manual', risk: 'Medium' },
      { id: 'supplier-master', name: 'Supplier Master', description: 'Govern supplier onboarding and master-data quality.', defaultMode: 'AI Copilot', risk: 'High' },
    ],
  },
  {
    id: 'procurement',
    name: 'Procurement',
    priority: 'P0',
    description: 'Sourcing, purchase orders, approvals and supplier decisions.',
    capabilities: [
      { id: 'vendor-selection', name: 'Vendor Selection', description: 'Control supplier selection recommendations and approvals.', defaultMode: 'AI Copilot', risk: 'High' },
      { id: 'po-approval', name: 'PO Approval', description: 'Govern purchase order authorization thresholds.', defaultMode: 'Manual', risk: 'High' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    priority: 'P0',
    description: 'Stock, replenishment, allocation and inventory policy.',
    capabilities: [
      { id: 'stock-reallocation', name: 'Stock Reallocation', description: 'Control inventory movement recommendations and execution.', defaultMode: 'Manual', risk: 'High' },
      { id: 'replenishment', name: 'Replenishment', description: 'Govern reorder recommendations and execution limits.', defaultMode: 'AI Copilot', risk: 'Medium' },
    ],
  },
  {
    id: 'order-management',
    name: 'Order Management',
    priority: 'P0',
    description: 'Order lifecycle, pricing, allocation and returns.',
    capabilities: [
      { id: 'order-allocation', name: 'Order Allocation', description: 'Manage allocation rules and exceptions.', defaultMode: 'AI Copilot', risk: 'Medium' },
      { id: 'returns', name: 'Returns / RMA', description: 'Govern return authorization and disposition.', defaultMode: 'Manual', risk: 'Medium' },
    ],
  },
  {
    id: 'warehouse',
    name: 'Warehouse Management',
    priority: 'P1',
    description: 'Warehouse execution, locations, picking, packing and scanning.',
    capabilities: [
      { id: 'wave-planning', name: 'Wave Planning', description: 'Optimize warehouse release and wave rules.', defaultMode: 'AI Autopilot', risk: 'Medium' },
      { id: 'cycle-count', name: 'Cycle Counting', description: 'Govern inventory count policies and variance handling.', defaultMode: 'AI Copilot', risk: 'Low' },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    priority: 'P1',
    description: 'Routes, freight, docks, carriers and delivery execution.',
    capabilities: [
      { id: 'route-optimization', name: 'Route Optimization', description: 'Optimize routes within policy and cost boundaries.', defaultMode: 'AI Autopilot', risk: 'High' },
      { id: 'carrier-selection', name: 'Carrier Selection', description: 'Govern carrier recommendations and awards.', defaultMode: 'AI Copilot', risk: 'High' },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    priority: 'P1',
    description: 'Production, quality, maintenance and OEE.',
    capabilities: [
      { id: 'production-planning', name: 'Production Planning', description: 'Coordinate production plans with supply constraints.', defaultMode: 'AI Copilot', risk: 'High' },
      { id: 'maintenance', name: 'Maintenance Policy', description: 'Govern maintenance scheduling and escalation.', defaultMode: 'AI Copilot', risk: 'Medium' },
    ],
  },
  {
    id: 'forecasting',
    name: 'Forecasting / S&OP',
    priority: 'P1',
    description: 'Demand forecasting, sensing, consensus and planning.',
    capabilities: [
      { id: 'demand-forecasting', name: 'Demand Forecasting', description: 'Review forecasts, confidence and overrides.', defaultMode: 'AI Copilot', risk: 'Medium' },
      { id: 'demand-sensing', name: 'Demand Sensing', description: 'Use near-real-time signals within approved bounds.', defaultMode: 'AI Autopilot', risk: 'Medium' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    priority: 'P1',
    description: 'KPIs, reports, anomalies and executive intelligence.',
    capabilities: [
      { id: 'kpi-governance', name: 'KPI Governance', description: 'Define trusted KPI formulas and ownership.', defaultMode: 'Manual', risk: 'Medium' },
      { id: 'anomaly-detection', name: 'Anomaly Detection', description: 'Configure AI detection thresholds and review flows.', defaultMode: 'AI Copilot', risk: 'Low' },
    ],
  },
  {
    id: 'integrations',
    name: 'Integrations',
    priority: 'P1',
    description: 'ERP, API, EDI, event and IoT connectivity.',
    capabilities: [
      { id: 'integration-health', name: 'Integration Health', description: 'Monitor connectors, mappings and synchronization.', defaultMode: 'AI Copilot', risk: 'High' },
      { id: 'mapping-governance', name: 'Data Mapping', description: 'Approve canonical-to-source field mappings.', defaultMode: 'Manual', risk: 'High' },
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance',
    priority: 'P1',
    description: 'Regulatory, sanctions, documents and evidence.',
    capabilities: [
      { id: 'compliance-rules', name: 'Compliance Rules', description: 'Manage policy rules and exception thresholds.', defaultMode: 'Manual', risk: 'High' },
      { id: 'document-compliance', name: 'Document Compliance', description: 'Validate required documents and expiry.', defaultMode: 'AI Copilot', risk: 'Medium' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    priority: 'P1',
    description: 'Runtime monitoring, releases, backups and operational health.',
    capabilities: [
      { id: 'release-governance', name: 'Release Governance', description: 'Control deployment approvals and rollback gates.', defaultMode: 'Manual', risk: 'High' },
      { id: 'backup-policy', name: 'Backup Policy', description: 'Govern backup cadence, retention and recovery tests.', defaultMode: 'Manual', risk: 'High' },
    ],
  },
  {
    id: 'ai-ml',
    name: 'AI / ML',
    priority: 'P1',
    description: 'Models, Copilot, Autopilot, optimization and learning.',
    capabilities: [
      { id: 'ai-policy', name: 'AI Operating Policy', description: 'Set where AI may recommend, simulate or execute.', defaultMode: 'Manual', risk: 'High' },
      { id: 'model-monitoring', name: 'Model Monitoring', description: 'Monitor model quality, drift and reliability.', defaultMode: 'AI Copilot', risk: 'High' },
    ],
  },
  {
    id: 'portals',
    name: 'Portals',
    priority: 'P2',
    description: 'Supplier, customer, carrier and distributor portals.',
    capabilities: [
      { id: 'supplier-portal', name: 'Supplier Portal', description: 'Govern external supplier access and workflows.', defaultMode: 'Manual', risk: 'High' },
      { id: 'customer-portal', name: 'Customer Portal', description: 'Govern customer visibility and self-service.', defaultMode: 'Manual', risk: 'Medium' },
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile',
    priority: 'P2',
    description: 'Mobile execution, devices, offline work and notifications.',
    capabilities: [
      { id: 'device-policy', name: 'Device Policy', description: 'Control enrolled devices and access posture.', defaultMode: 'Manual', risk: 'High' },
      { id: 'offline-policy', name: 'Offline Policy', description: 'Define offline data and synchronization rules.', defaultMode: 'AI Copilot', risk: 'Medium' },
    ],
  },
];

const DOMAIN_ALIAS_MAP: Record<string, string> = {
  'users-rbac': 'users-rbac',
  'roles-capabilities': 'users-rbac',
  'orgs-tenants': 'master-data',
  'ai-governance': 'ai-ml',
  'workflows-approvals': 'operations',
  'planning-engine': 'forecasting',
  'inventory-optimization': 'inventory',
  'fulfillment-engine': 'order-management',
  'logistics-transport': 'transportation',
  'sop-demand': 'forecasting',
  'multi-echelon': 'inventory',
  'distributed-ledger': 'security',
  'security-controls': 'security',
  'audit-compliance': 'compliance',
  'integrations-fabric': 'integrations',
  'simulation-scenarios': 'analytics',
  'mobile-edge': 'mobile',
};

export function AdminControlCenter({ initialDomainId, initialCapabilityId }: { initialDomainId?: string; initialCapabilityId?: string }) {
  const navigate = useNavigate();
  const routeParams = useParams();
  const rawDomainId = initialDomainId || routeParams.domainId;
  const domainId = rawDomainId ? (DOMAIN_ALIAS_MAP[rawDomainId] || rawDomainId) : undefined;
  const capabilityId = initialCapabilityId || routeParams.capabilityId;
  const { profile, user, hasRole, organization } = useAuth();

  // Admin access gate: Only authorized Admin / privileged roles may access Control Center
  const isPlatformAdmin = profile?.role === 'platform_admin' || hasRole(['platform_admin']);
  const isOrgAdmin = profile?.role === 'organization_admin' || hasRole(['organization_admin']);

  const currentTenant = organization?.id || profile?.organizationId || 'default-tenant';

  const initialDomain = DOMAINS.find(d => d.id === domainId) || DOMAINS[0];
  const initialCapability = initialDomain.capabilities.find(c => c.id === capabilityId) || initialDomain.capabilities[0];
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [selectedCapability, setSelectedCapability] = useState(initialCapability);
  const [mode, setMode] = useState<Mode>(initialCapability.defaultMode);
  const [policy, setPolicy] = useState<Policy>('Standard');
  const [scope, setScope] = useState<Scope>('Capability');
  const [approval, setApproval] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Authoritative Audit Logger via KernelAuditEngine
  const audit = async (action: string, detail: string) => {
    try {
      await KernelAuditEngine.getInstance().record({
        actor: { id: user?.id || profile?.id || 'admin', type: 'USER', name: profile?.fullName || 'Admin', role: profile?.role },
        tenantId: currentTenant,
        action,
        entityType: 'policy',
        entityId: selectedCapability.id,
        result: 'SUCCESS',
        classification: 'INTERNAL',
        details: { domain: selectedDomain.name, capability: selectedCapability.name, detail },
      });
    } catch (e) {
      console.warn('[ControlCenter] Audit logging error:', e);
    }
  };

  // Record initial view audit on mount
  useEffect(() => {
    if (isPlatformAdmin || isOrgAdmin) {
      audit('CONTROL_CENTER_OPENED', `Control Center opened by ${profile?.fullName || 'Admin'}`);
    }
  }, []);

  // Sync state with selected domain / capability & load authoritative policy
  useEffect(() => {
    const d = DOMAINS.find(x => x.id === domainId) || DOMAINS[0];
    const c = d.capabilities.find(x => x.id === capabilityId) || d.capabilities[0];
    setSelectedDomain(d);
    setSelectedCapability(c);

    let active = true;
    controlPolicyService.getPolicy(currentTenant, c.id).then((saved) => {
      if (!active) return;
      if (saved) {
        setMode(saved.mode);
        setPolicy(saved.policy);
        setScope(saved.scope);
        setApproval(saved.approvalRequired !== false);
        setEnabled(saved.enabled !== false);
      } else {
        setMode(c.defaultMode);
        setPolicy('Standard');
        setScope('Capability');
        setApproval(true);
        setEnabled(true);
      }
    });

    if (isPlatformAdmin || isOrgAdmin) {
      audit('POLICY_VIEWED', `Viewed policy for ${c.name}`);
    }

    return () => {
      active = false;
    };
  }, [domainId, capabilityId, currentTenant]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOMAINS;
    return DOMAINS.map(d => ({
      ...d,
      capabilities: d.capabilities.filter(c => `${d.name} ${d.description} ${c.name} ${c.description}`.toLowerCase().includes(q)),
    })).filter(d => d.capabilities.length || `${d.name} ${d.description}`.toLowerCase().includes(q));
  }, [query]);

  const selectDomain = (d: Domain) => {
    setSelectedDomain(d);
    const c = d.capabilities[0];
    setSelectedCapability(c);
    navigate(`/admin/control-center/domains/${d.id}`);
  };

  const selectCapability = (d: Domain, c: Capability) => {
    setSelectedDomain(d);
    setSelectedCapability(c);
    navigate(`/admin/control-center/capabilities/${d.id}/${c.id}`);
  };

  // Save policy through governed Kernel CommandBus
  const save = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const actor = {
        id: user?.id || profile?.id || 'admin-user',
        type: 'USER',
        name: profile?.fullName || 'Admin',
        roles: profile?.role ? [profile.role] : ['platform_admin'],
        organizationId: currentTenant,
      };

      const result = await controlPolicyService.updatePolicy({
        actor,
        tenantId: currentTenant,
        organizationId: currentTenant,
        domainId: selectedDomain.id,
        capabilityId: selectedCapability.id,
        mode,
        policy,
        scope,
        approvalRequired: approval,
        enabled,
      });

      if (result.success) {
        setSavedAt(new Date().toLocaleTimeString());
        setSaveMessage('Policy saved & governed in kernel.');
      } else {
        setSaveMessage(`Save error: ${result.error || 'Permission denied'}`);
      }
    } catch (e: any) {
      setSaveMessage(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const reset = async () => {
    setMode(selectedCapability.defaultMode);
    setPolicy('Standard');
    setScope('Capability');
    setApproval(true);
    setEnabled(true);
    await audit('POLICY_RESET', `Restored capability defaults for ${selectedCapability.name}`);
    setSavedAt(new Date().toLocaleTimeString());
  };

  // Create real AI proposal
  const propose = async () => {
    try {
      await controlPolicyService.createAIProposal({
        tenantId: currentTenant,
        organizationId: currentTenant,
        domainId: selectedDomain.id,
        capabilityId: selectedCapability.id,
        risk: selectedCapability.risk,
        proposerActor: {
          id: 'ai-copilot-engine',
          type: 'AI',
          name: 'AI Copilot Engine',
          roles: ['ai_agent'],
        },
        currentState: {
          mode,
          policy,
          scope,
          approval,
          enabled,
        },
        proposedState: {
          mode: selectedCapability.defaultMode,
          policy: 'Strict',
          scope: 'Capability',
          approval: true,
          enabled: true,
        },
        reason: `Automated governance review for ${selectedCapability.name}: optimize under strict policy boundaries.`,
      });
      navigate('/admin/control-center/approvals');
    } catch (e) {
      console.warn('Proposal creation error:', e);
    }
  };

  // Safe simulation: ZERO production mutations
  const simulate = async () => {
    const actor = {
      id: user?.id || profile?.id || 'admin',
      type: 'USER',
      name: profile?.fullName || 'Admin',
      roles: profile?.role ? [profile.role] : ['platform_admin'],
      organizationId: currentTenant,
    };

    await controlPolicyService.simulatePolicy({
      tenantId: currentTenant,
      domainId: selectedDomain.id,
      domainName: selectedDomain.name,
      capabilityId: selectedCapability.id,
      capabilityName: selectedCapability.name,
      mode,
      policy,
      scope,
      actor,
    });

    navigate('/admin/control-center/simulations');
  };

  // Compute operational execution status
  const executionStatus = useMemo(() => {
    if (!enabled) return { label: 'PROHIBITED / DISABLED', color: 'text-red-400', badge: 'bg-red-500/10 border-red-500/30' };
    if (mode === 'Manual') return { label: 'MANUAL OPERATOR ACTION', color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/30' };
    if (mode === 'AI Copilot') return { label: 'RECOMMENDATION ONLY', color: 'text-cyan-400', badge: 'bg-cyan-500/10 border-cyan-500/30' };
    if (approval) return { label: 'HUMAN APPROVAL REQUIRED', color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/30' };
    return { label: 'AUTOMATIC EXECUTION', color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30' };
  }, [enabled, mode, approval]);

  // Deny access if unauthorized user
  if (!isPlatformAdmin && !isOrgAdmin) {
    return (
      <div className="p-8 rounded-lg border border-red-500/30 bg-red-500/10 text-center" data-testid="access-denied">
        <h2 className="text-lg font-semibold text-red-400">Access Denied</h2>
        <p className="text-xs text-os-text-secondary mt-2">Administrator privileges required for platform control plane.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-os-text-primary">AI + Manual Control Center</h1>
          <p className="text-sm text-os-text-secondary mt-1">One governed path from domain policy to approved execution and audit.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/control-center/approvals" className="px-3 py-2 rounded-md border border-os-border text-xs hover:bg-white/5 transition-colors">
            Approval Queue
          </Link>
          <Link to="/admin/control-center/audit" className="px-3 py-2 rounded-md border border-os-border text-xs hover:bg-white/5 transition-colors">
            Audit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_330px] gap-4">
        {/* Left Column: Domain / Capability Navigator */}
        <section className="rounded-lg border border-os-border bg-os-bg overflow-hidden flex flex-col">
          <div className="p-3 border-b border-os-border">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search domains or capabilities..."
              className="w-full rounded-md border border-os-border bg-black/20 px-3 py-2 text-xs outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="max-h-[680px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {matches.map(d => (
              <div key={d.id} className="rounded-md border border-os-border/60 bg-white/[0.02] p-2">
                <button
                  type="button"
                  onClick={() => selectDomain(d)}
                  className="w-full text-left flex items-center justify-between text-xs font-semibold text-os-text-primary hover:text-cyan-400 py-1"
                >
                  <span>{d.name}</span>
                  <span className="text-[10px] font-mono uppercase text-os-text-muted">{d.priority}</span>
                </button>
                <div className="mt-1 space-y-1">
                  {d.capabilities.map(c => {
                    const isSelected = selectedDomain.id === d.id && selectedCapability.id === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => selectCapability(d, c)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/30' : 'text-os-text-secondary hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] opacity-70 ml-2 shrink-0">{c.risk}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Center Column: Policy Editor */}
        <main className="rounded-lg border border-os-border bg-os-bg p-5 space-y-5">
          <div className="border-b border-os-border pb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-cyan-400">{selectedDomain.name}</div>
              <h2 className="text-xl font-light text-os-text-primary mt-1">{selectedCapability.name}</h2>
              <p className="text-xs text-os-text-secondary mt-1">{selectedCapability.description}</p>
            </div>
            <div className={`px-2.5 py-1 rounded text-[11px] font-mono border ${executionStatus.badge} ${executionStatus.color}`}>
              {executionStatus.label}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-os-text-secondary mb-2">Operating Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Manual', 'AI Copilot', 'AI Autopilot'] as Mode[]).map(m => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-2 px-3 rounded-md text-xs font-medium border text-center transition-all ${
                      mode === m ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400 font-semibold' : 'border-os-border bg-white/[0.02] text-os-text-secondary hover:bg-white/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-os-text-muted mt-1.5">
                {mode === 'Manual' && 'Requires full manual human execution. Zero autonomous AI operations.'}
                {mode === 'AI Copilot' && 'AI recommends options and drafts actions; human reviews before execution.'}
                {mode === 'AI Autopilot' && 'AI executes permitted actions directly within configured risk boundaries.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-os-text-secondary mb-2">Policy Enforcement</label>
                <select
                  value={policy}
                  onChange={e => setPolicy(e.target.value as Policy)}
                  className="w-full rounded-md border border-os-border bg-black/30 px-3 py-2 text-xs text-os-text-primary outline-none focus:border-cyan-500"
                >
                  <option value="Standard">Standard</option>
                  <option value="Strict">Strict</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-os-text-secondary mb-2">Execution Scope</label>
                <select
                  value={scope}
                  onChange={e => setScope(e.target.value as Scope)}
                  className="w-full rounded-md border border-os-border bg-black/30 px-3 py-2 text-xs text-os-text-primary outline-none focus:border-cyan-500"
                >
                  <option value="Capability">Capability</option>
                  <option value="Domain">Domain</option>
                  <option value="Organization">Organization</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-os-border space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-os-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={approval}
                  onChange={e => setApproval(e.target.checked)}
                  className="rounded border-os-border text-cyan-500 focus:ring-cyan-500/20"
                />
                <span>Human Approval Required for Material Actions</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-os-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                  className="rounded border-os-border text-cyan-500 focus:ring-cyan-500/20"
                />
                <span>Enable this Capability</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-os-border flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={isSaving}
                className="px-4 py-2 rounded-md bg-cyan-500 text-black font-semibold text-xs hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save size={13} /> {isSaving ? 'Governing...' : 'Save Policy'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-3 py-2 rounded-md border border-os-border text-xs text-os-text-secondary hover:bg-white/5"
              >
                Restore Defaults
              </button>
            </div>
            {saveMessage && (
              <span className="text-xs text-cyan-400 font-mono animate-in fade-in">{saveMessage}</span>
            )}
            {savedAt && !saveMessage && (
              <span className="text-[11px] text-os-text-muted font-mono">Last governed at {savedAt}</span>
            )}
          </div>
        </main>

        {/* Right Column: Governance Controls, AI Proposals & Safe Simulation */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-os-border bg-os-bg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-os-text-secondary">
              <Shield size={14} className="text-cyan-400" /> Kernel Governance Gate
            </div>
            <div className="text-xs space-y-2 text-os-text-muted">
              <div className="flex justify-between">
                <span>Tenant:</span>
                <span className="font-mono text-os-text-primary">{currentTenant}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Class:</span>
                <span className="font-mono text-os-text-primary">{selectedCapability.risk}</span>
              </div>
              <div className="flex justify-between">
                <span>Default Mode:</span>
                <span className="font-mono text-os-text-primary">{selectedCapability.defaultMode}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-os-border bg-os-bg p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-os-text-secondary">
              <BrainCircuit size={14} className="text-cyan-400" /> AI Actions
            </div>
            <p className="text-[11px] text-os-text-muted">
              AI propose actions within governed boundaries. High-impact operations halt for human approval.
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={propose}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-cyan-500/30 text-cyan-400 text-xs hover:bg-cyan-500/10 transition-colors"
              >
                <span>Create AI Proposal</span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={simulate}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/10 transition-colors"
              >
                <span>Run Safe Simulation</span>
                <Play size={13} />
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-os-border bg-os-bg p-4 space-y-2">
            <div className="text-xs uppercase tracking-wider text-os-text-secondary">Quick Links</div>
            <div className="space-y-1.5 text-xs">
              <Link to="/admin/control-center/policies" className="block py-1 text-os-text-secondary hover:text-cyan-400 flex items-center justify-between">
                <span>Policy Registry</span>
                <ChevronRight size={12} />
              </Link>
              <Link to="/admin/control-center/approvals" className="block py-1 text-os-text-secondary hover:text-cyan-400 flex items-center justify-between">
                <span>Review Approvals</span>
                <ChevronRight size={12} />
              </Link>
              <Link to="/admin/control-center/simulations" className="block py-1 text-os-text-secondary hover:text-cyan-400 flex items-center justify-between">
                <span>Simulations Ledger</span>
                <ChevronRight size={12} />
              </Link>
              <Link to="/admin/control-center/audit" className="block py-1 text-os-text-secondary hover:text-cyan-400 flex items-center justify-between">
                <span>View Audit</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ControlCenterApprovals() {
  const { profile, organization } = useAuth();
  const currentTenant = organization?.id || profile?.organizationId || 'default-tenant';
  const [items, setItems] = useState<ControlProposalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    controlPolicyService.listProposals(currentTenant).then((proposals) => {
      if (mounted) {
        setItems(proposals);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentTenant]);

  const act = async (proposalId: string, decision: 'APPROVED' | 'REJECTED') => {
    const approver = {
      id: profile?.id || 'admin-user',
      type: 'USER',
      name: profile?.fullName || 'Admin',
      roles: profile?.role ? [profile.role] : ['platform_admin'],
      organizationId: currentTenant,
    };

    try {
      await controlPolicyService.resolveProposal({
        proposalId,
        decision,
        approver,
        comments: `Resolved by ${approver.name}`,
      });
      // Refresh list
      const updated = await controlPolicyService.listProposals(currentTenant);
      setItems(updated);
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    }
  };

  return (
    <SubPage title="Approval Queue" subtitle="Human review is the authoritative gate for high-impact AI proposals.">
      <div className="space-y-3">
        {isLoading ? (
          <Empty text="Loading authoritative proposals..." />
        ) : items.length === 0 ? (
          <Empty text="No pending AI proposals." />
        ) : (
          items.map(p => (
            <div key={p.id} className="rounded-lg border border-os-border bg-os-bg p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-os-text-primary">{p.capabilityId}</div>
                <div className="text-xs text-os-text-muted mt-0.5">
                  {p.domainId} · Risk: <span className="font-semibold text-amber-400">{p.risk}</span> · Proposer: {p.proposerActor?.name || 'AI'}
                </div>
                <p className="text-xs text-os-text-secondary mt-2">{p.reason}</p>
                <div className="text-[10px] text-os-text-muted mt-1 font-mono">
                  Requested: {p.proposedState.mode} ({p.proposedState.policy} / {p.proposedState.scope}) · Status: {p.status}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={p.status !== 'PENDING'}
                  onClick={() => act(p.id, 'APPROVED')}
                  className="px-3 py-2 rounded-md border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/10 disabled:opacity-40"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={p.status !== 'PENDING'}
                  onClick={() => act(p.id, 'REJECTED')}
                  className="px-3 py-2 rounded-md border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SubPage>
  );
}

export function ControlCenterSimulations() {
  const { profile, organization } = useAuth();
  const currentTenant = organization?.id || profile?.organizationId || 'default-tenant';
  const items = controlPolicyService.listSimulations(currentTenant);

  return (
    <SubPage title="Safe Simulation" subtitle="Simulations test policy outcomes without changing operational data.">
      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
        SIMULATION ONLY · ZERO PRODUCTION MUTATION
      </div>
      <div className="space-y-3 mt-4">
        {items.length === 0 ? (
          <Empty text="No simulations have been run yet." />
        ) : (
          items.map(x => (
            <div key={x.id} className="rounded-lg border border-os-border bg-os-bg p-4">
              <div className="text-sm font-medium">{x.capabilityName}</div>
              <div className="text-xs text-os-text-muted mt-0.5">{x.domainName} · {x.mode} · {x.policy} · {x.scope}</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono">{x.result}</div>
            </div>
          ))
        )}
      </div>
    </SubPage>
  );
}

export function ControlCenterAudit() {
  const { profile, organization } = useAuth();
  const currentTenant = organization?.id || profile?.organizationId || 'default-tenant';
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const list = KernelAuditEngine.getInstance().getRecords({ tenantId: currentTenant, limit: 100 });
    setRecords(list);
  }, [currentTenant]);

  return (
    <SubPage title="Control Center Audit" subtitle="Immutable audit ledger recording all policy views, mutations, AI proposals and simulation runs.">
      <div className="space-y-2">
        {records.length === 0 ? (
          <Empty text="No Control Center audit records found for this tenant." />
        ) : (
          records.map(r => (
            <div key={r.auditId} className="rounded-md border border-os-border bg-os-bg px-4 py-3">
              <div className="flex justify-between gap-3">
                <span className="text-xs text-cyan-400 font-mono">{r.action}</span>
                <span className="text-[10px] text-os-text-muted">{new Date(r.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-xs text-os-text-secondary mt-1">
                Actor: {r.actor?.name || r.actor?.id} ({r.actor?.type}) · Entity: {r.entityType} ({r.entityId})
              </div>
            </div>
          ))
        )}
      </div>
    </SubPage>
  );
}

export function ControlCenterPolicies() {
  const { profile, organization } = useAuth();
  const currentTenant = organization?.id || profile?.organizationId || 'default-tenant';
  const [policies, setPolicies] = useState<Record<string, ControlPolicyRecord>>({});

  useEffect(() => {
    let mounted = true;
    controlPolicyService.listPolicies(currentTenant).then((list) => {
      if (mounted) {
        const map: Record<string, ControlPolicyRecord> = {};
        list.forEach((p) => {
          map[p.capabilityId] = p;
        });
        setPolicies(map);
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentTenant]);

  return (
    <SubPage title="Policy Registry" subtitle="Review the saved policy state for every governed capability.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {DOMAINS.flatMap(d => d.capabilities.map(c => ({ d, c }))).map(({ d, c }) => {
          const p = policies[c.id] || {
            mode: c.defaultMode,
            policy: 'Standard',
            scope: 'Capability',
            approvalRequired: true,
            enabled: true,
          };
          return (
            <Link
              key={c.id}
              to={`/admin/control-center/capabilities/${d.id}/${c.id}`}
              className="rounded-lg border border-os-border bg-os-bg p-4 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex justify-between">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-[10px] text-os-text-muted">{d.name}</span>
              </div>
              <div className="mt-2 text-xs text-cyan-400 font-semibold">{p.mode}</div>
              <div className="text-[10px] text-os-text-muted mt-1">
                {p.policy} · {p.scope} · {p.approvalRequired ? 'Approval Required' : 'Approval Not Required'}
              </div>
            </Link>
          );
        })}
      </div>
    </SubPage>
  );
}

function SubPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/control-center" className="inline-flex items-center gap-1 text-xs text-os-text-muted hover:text-os-text-primary mb-3">
          <ArrowLeft size={13} /> Control Center
        </Link>
        <h1 className="text-2xl font-light">{title}</h1>
        <p className="text-sm text-os-text-secondary mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-os-border p-10 text-center text-xs text-os-text-muted">
      {text}
    </div>
  );
}
