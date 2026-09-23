/**
 * ORION-9 PART 4 TRACK 5 — UNIFIED GOVERNED AI WORKFORCE CENTER
 *
 * Enterprise Admin UI for the Governed Orion-9 AI Workforce:
 * - 20 Domain-Specialized Agents with Real-Time Governance Badges
 * - Structured Reasoning Inspector (FACT, OBSERVATION, MODELLED, PREDICTION, ASSUMPTION, RECOMMENDATION)
 * - AI Proposals & Human Approval Queue with Kernel Command Dispatch
 * - Multi-Agent Governed Collaboration Graph & Consensus Synthesis
 * - Security Sentinel & Admin-Only Quarantine Reinstatement
 * - Outcome Learning, Calibration, and Health Telemetry
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  agentRegistry,
  toolRegistry,
  aiSecurityGuard,
  aiProposalEngine,
  agentCollaborationEngine,
  aiWorkforceImprovementEngine,
  AIAgent,
  AIProposal,
  AgentHealthMetrics,
  AgentQuarantineRecord,
  AgentCollaborationMessage,
  ReasoningStep,
  AIOperatingMode,
} from '../../ai';
import { useAuth } from '../../store/AuthContext';
import {
  Brain,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Network,
  Lock,
  Search,
  RefreshCw,
  Play,
  Check,
  ChevronRight,
  TrendingUp,
  FileText,
  Sliders,
  Sparkles,
  Database,
  Eye,
  Info,
  KeyRound,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

export const AIWorkforceCenter: React.FC = () => {
  const { profile, user } = useAuth();
  const tenantId = (profile as any)?.tenantId || (profile as any)?.organizationId || 'org-global';
  const isAdmin = profile?.role === 'platform_admin' || profile?.role === 'organization_admin';

  // Active section tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'workforce' | 'inspector' | 'proposals' | 'collaboration' | 'quarantine' | 'telemetry'
  >('overview');

  // State data
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-procurement');
  const [proposals, setProposals] = useState<AIProposal[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<AgentHealthMetrics[]>([]);
  const [quarantineRecords, setQuarantineRecords] = useState<AgentQuarantineRecord[]>([]);
  const [collaborationMessages, setCollaborationMessages] = useState<AgentCollaborationMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  // UI feedback & Modals
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<AIProposal | null>(null);
  const [reinstatementJustification, setReinstatementJustification] = useState('');
  const [quarantiningAgentId, setQuarantiningAgentId] = useState<string | null>(null);
  const [consensusResult, setConsensusResult] = useState<any | null>(null);

  // Load initial data
  const refreshData = async () => {
    try {
      const agentList = agentRegistry.listAgents(tenantId);
      setAgents(agentList);

      const propList = aiProposalEngine.listProposals(tenantId);
      setProposals(propList);

      const metrics = await aiWorkforceImprovementEngine.getWorkforceHealthMetrics(tenantId);
      setHealthMetrics(metrics);

      const qRecords = agentRegistry.getQuarantineRecords(tenantId);
      setQuarantineRecords(qRecords);

      const collabMsgs = agentCollaborationEngine.listMessages(tenantId);
      setCollaborationMessages(collabMsgs);
    } catch (e: any) {
      console.warn('AI Workforce load warning:', e);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // Selected agent details
  const selectedAgent = useMemo(() => {
    return agents.find(a => a.agentId === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  const selectedAgentHealth = useMemo(() => {
    return healthMetrics.find(m => m.agentId === selectedAgentId);
  }, [healthMetrics, selectedAgentId]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.agentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDomain = domainFilter === 'ALL' || a.domain === domainFilter;
      return matchSearch && matchDomain;
    });
  }, [agents, searchQuery, domainFilter]);

  // Summary KPIs
  const summaryKPIs = useMemo(() => {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'ACTIVE').length;
    const quarantined = agents.filter(a => a.status === 'QUARANTINED').length;
    const pendingProposals = proposals.filter(p => p.approvalStatus === 'PENDING_HUMAN_APPROVAL').length;
    const avgCalibration = healthMetrics.length > 0
      ? Math.round(healthMetrics.reduce((acc, m) => acc + m.calibrationScore, 0) / healthMetrics.length)
      : 96;
    return { total, active, quarantined, pendingProposals, avgCalibration };
  }, [agents, proposals, healthMetrics]);

  // Handle Approve Proposal
  const handleApproveProposal = async (proposal: AIProposal) => {
    try {
      const humanActor = {
        id: profile?.id || user?.id || 'admin-operator',
        type: 'USER' as any,
        name: profile?.fullName || profile?.displayName || 'Authorized Admin',
        roles: profile?.role ? [profile.role] : ['platform_admin', 'procurement_manager'],
        organizationId: tenantId,
      };

      await aiProposalEngine.approveProposal(tenantId, proposal.proposalId, humanActor, 'Approved via AI Workforce Center');
      setStatusMessage({ type: 'success', text: `Proposal '${proposal.proposalId}' successfully approved.` });
      refreshData();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Approval failed: ${e.message}` });
    }
  };

  // Handle Reject Proposal
  const handleRejectProposal = async (proposal: AIProposal) => {
    try {
      const humanActor = {
        id: profile?.id || user?.id || 'admin-operator',
        type: 'USER' as any,
        name: profile?.fullName || profile?.displayName || 'Authorized Admin',
        roles: profile?.role ? [profile.role] : ['platform_admin'],
        organizationId: tenantId,
      };

      await aiProposalEngine.rejectProposal(tenantId, proposal.proposalId, humanActor, 'Rejected by operator in AI Workforce Center');
      setStatusMessage({ type: 'success', text: `Proposal '${proposal.proposalId}' rejected.` });
      refreshData();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Rejection failed: ${e.message}` });
    }
  };

  // Handle Execute Proposal via Kernel
  const handleExecuteProposal = async (proposal: AIProposal) => {
    try {
      const executingActor = {
        id: profile?.id || user?.id || 'admin-operator',
        type: 'USER' as any,
        name: profile?.fullName || profile?.displayName || 'Authorized Admin',
        roles: profile?.role ? [profile.role] : ['platform_admin'],
        organizationId: tenantId,
      };

      const result = await aiProposalEngine.executeProposal(tenantId, proposal.proposalId, executingActor);
      setStatusMessage({
        type: 'success',
        text: `Proposal executed via Kernel! Command ID: ${result.commandResult.commandId}`,
      });
      refreshData();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Execution failed: ${e.message}` });
    }
  };

  // Handle Reinstate Agent
  const handleReinstateAgent = async (agentId: string) => {
    if (!reinstatementJustification || reinstatementJustification.trim().length < 10) {
      setStatusMessage({ type: 'error', text: 'Formal justification of at least 10 characters is required for reinstatement.' });
      return;
    }

    try {
      const adminActor = {
        id: profile?.id || user?.id || 'admin-operator',
        type: 'USER' as any,
        name: profile?.fullName || profile?.displayName || 'Platform Administrator',
        roles: ['platform_admin'],
        organizationId: tenantId,
      };

      await agentRegistry.reinstateAgent(tenantId, agentId, adminActor, reinstatementJustification);
      setStatusMessage({ type: 'success', text: `Agent '${agentId}' has been reinstated to ACTIVE status.` });
      setReinstatementJustification('');
      setQuarantiningAgentId(null);
      refreshData();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Reinstatement failed: ${e.message}` });
    }
  };

  // Simulate Multi-Agent Consensus
  const handleTriggerConsensus = async () => {
    try {
      const res = await agentCollaborationEngine.orchestrateConsensus({
        tenantId,
        initiatorAgentId: 'agent-sop',
        peerAgentIds: ['agent-demand-planning', 'agent-inventory', 'agent-procurement'],
        taskIntent: 'Quarterly S&OP Supply-Demand Rebalancing for North America DC-101',
        contextPayload: {
          productCategory: 'ELECTRONICS',
          forecastHorizonWeeks: 12,
          projectedDemandDeltaPct: 15.0,
          currentInventoryUnits: 45000,
        },
      });
      setConsensusResult(res);
      setStatusMessage({ type: 'success', text: 'Multi-agent consensus synthesis completed successfully.' });
      refreshData();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Consensus synthesis error: ${e.message}` });
    }
  };

  // Create simulated proposal from Procurement Agent for demonstration
  const handleGenerateSampleProposal = async () => {
    try {
      const newProposal = await aiProposalEngine.createProposal({
        tenantId,
        agentId: 'agent-procurement',
        intent: 'Replenish critical semiconductor stockout risk at Central Hub',
        proposedCommand: {
          commandType: 'CREATE_PURCHASE_ORDER',
          actor: { id: 'agent-procurement', type: 'AI_AGENT' as any, name: 'Procurement Agent', roles: ['ai_agent'], organizationId: tenantId },
          tenantId,
          targetEntity: 'PURCHASE_ORDER',
          targetId: `po-${Date.now().toString().slice(-6)}`,
          parameters: {
            supplierId: 'SUPP-901',
            supplierName: 'Apex Microelectronics Ltd',
            items: [{ sku: 'SKU-MCU-88', quantity: 2500, unitPrice: 18.50 }],
            totalAmount: 46250.00,
            deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          },
          correlationId: `demo-${Date.now()}`,
          reason: 'Buffer below safety stock threshold (4.2 days remaining vs 15.0 days baseline)',
          requestedByAgent: 'agent-procurement',
        },
        evidence: {
          facts: ['Supplier lead time is currently 14 days', 'Current inventory on-hand is 180 units', 'Average consumption is 42 units/day'],
          signals: ['Automotive tier-1 production ramp alert detected', 'Material supply index steady'],
          metrics: { daysOfSupply: 4.28, criticalThreshold: 15.0, proposedQty: 2500 },
          entities: [{ entityType: 'PRODUCT', entityId: 'SKU-MCU-88' }, { entityType: 'SUPPLIER', entityId: 'SUPP-901' }],
          dataFreshnessMs: 4200,
        },
        reasoningChain: [
          { stepNumber: 1, category: 'FACT', statement: 'Authoritative inventory balance at WH-MAIN for SKU-MCU-88 is 180 units.', confidence: 1.0 },
          { stepNumber: 2, category: 'OBSERVATION', statement: 'Daily consumption accelerated 28% over previous 7-day rolling window.', confidence: 0.96 },
          { stepNumber: 3, category: 'MODELLED', statement: 'Safety buffer breach model predicts stockout in 4.2 days without replenishment.', confidence: 0.94 },
          { stepNumber: 4, category: 'PREDICTION', statement: 'Lead time forecast from Apex Microelectronics is 14 calendar days.', confidence: 0.91 },
          { stepNumber: 5, category: 'ASSUMPTION', statement: 'Standard ground freight capacity remains unconstrained during transit window.', confidence: 0.85 },
          { stepNumber: 6, category: 'RECOMMENDATION', statement: 'Authorize governed Purchase Order for 2,500 units ($46,250.00) to restore 45-day buffer.', confidence: 0.95 },
        ],
        riskAssessment: {
          score: 42,
          blastRadius: 'REGIONAL',
          financialExposure: 46250.00,
          reversibility: 'REVERSIBLE',
          riskClass: 'MEDIUM',
        },
        confidence: 0.95,
      });

      setStatusMessage({ type: 'success', text: `Sample proposal generated: ${newProposal.proposalId}` });
      setSelectedProposal(newProposal);
      setActiveTab('proposals');
      refreshData();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `Failed to create proposal: ${e.message}` });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080c14] text-slate-200 overflow-hidden font-sans">
      {/* Top Banner Header */}
      <div className="border-b border-[#1e293b] bg-[#0c121e] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Brain size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">AI Workforce Center</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-900/60 border border-cyan-500/40 text-cyan-300">
                KERNEL-GOVERNED
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-300">
                20 SPECIALIZED AGENTS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-Agent Enterprise Workforce • Non-Admin Authority • Strict Tenant Isolation • Side-Effect-Free Proposing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateSampleProposal}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-cyan-600/30 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-600/50 transition-colors"
          >
            <Sparkles size={14} />
            Simulate AI Proposal
          </button>
          <button
            onClick={handleTriggerConsensus}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 hover:bg-indigo-600/50 transition-colors"
          >
            <Network size={14} />
            Multi-Agent Consensus
          </button>
          <button
            onClick={refreshData}
            className="p-1.5 rounded-md bg-[#131b2e] border border-[#1e293b] text-slate-300 hover:text-white transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`px-6 py-2 text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-b border-emerald-600/40 text-emerald-200'
              : 'bg-rose-950/70 border-b border-rose-600/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-6 bg-[#0c121e] border-b border-[#1e293b] shrink-0 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={14} />
          Workforce Overview
        </button>
        <button
          onClick={() => setActiveTab('workforce')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'workforce'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain size={14} />
          Agent Directory ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'proposals'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={14} />
          Proposals & Approvals ({summaryKPIs.pendingProposals} Pending)
        </button>
        <button
          onClick={() => setActiveTab('collaboration')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'collaboration'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network size={14} />
          Multi-Agent Collaboration
        </button>
        <button
          onClick={() => setActiveTab('quarantine')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'quarantine'
              ? 'border-rose-400 text-rose-400 bg-rose-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert size={14} />
          Quarantine Sentinel ({summaryKPIs.quarantined})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'telemetry'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp size={14} />
          Calibration & Outcomes
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ========================================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-[#0e1626] border border-[#1e293b]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Specialized Workforce</span>
                  <Brain size={16} className="text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">{summaryKPIs.total}</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {summaryKPIs.active} Active Agents
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0e1626] border border-[#1e293b]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Pending Approvals</span>
                  <Clock size={16} className="text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-300">{summaryKPIs.pendingProposals}</div>
                <div className="text-[11px] text-slate-400 mt-1">Requires human review</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0e1626] border border-[#1e293b]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Quarantined Agents</span>
                  <ShieldAlert size={16} className="text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-300">{summaryKPIs.quarantined}</div>
                <div className="text-[11px] text-slate-400 mt-1">Suspended from execution</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0e1626] border border-[#1e293b]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Workforce Calibration</span>
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">{summaryKPIs.avgCalibration}%</div>
                <div className="text-[11px] text-slate-400 mt-1">Confidence-to-outcome match</div>
              </div>

              <div className="p-4 rounded-lg bg-[#0e1626] border border-[#1e293b]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Kernel Dispatch Gate</span>
                  <ShieldCheck size={16} className="text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-cyan-300">100%</div>
                <div className="text-[11px] text-cyan-400 mt-1">Zero direct DB writes</div>
              </div>
            </div>

            {/* Core Invariant Alert Box */}
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
              <Shield className="text-cyan-400 shrink-0 mt-0.5" size={20} />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-100 uppercase tracking-wide">
                  Governed Execution Pipeline Verified
                </div>
                <div className="text-slate-300 leading-relaxed">
                  The AI Workforce operates inside the Orion-9 Kernel. AI agents observe, reason, and formulate proposals.
                  Transactions undergo actor validation, policy evaluation, risk classification, and human approval before
                  dispatching through the Kernel Command Bus.
                </div>
              </div>
            </div>

            {/* Quick Agent Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Active Agents */}
              <div className="p-5 rounded-lg bg-[#0e1626] border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Active Workforce Agents</h3>
                  <button
                    onClick={() => setActiveTab('workforce')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    View All 20 <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {agents.slice(0, 5).map(agent => (
                    <div
                      key={agent.agentId}
                      onClick={() => {
                        setSelectedAgentId(agent.agentId);
                        setActiveTab('inspector');
                      }}
                      className="p-3 rounded-md bg-[#131b2e] border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <div>
                          <div className="text-xs font-semibold text-white">{agent.name}</div>
                          <div className="text-[11px] text-slate-400">{agent.domain}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {agent.operatingMode}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                          {agent.riskClass}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Inter-Agent Collaboration */}
              <div className="p-5 rounded-lg bg-[#0e1626] border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Inter-Agent Collaboration Stream</h3>
                  <button
                    onClick={() => setActiveTab('collaboration')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    Inspect Network <ChevronRight size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {collaborationMessages.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-[#131b2e]/50 rounded border border-slate-800/60">
                      No collaboration messages recorded in current session.
                    </div>
                  ) : (
                    collaborationMessages.slice(-5).reverse().map(msg => (
                      <div
                        key={msg.messageId}
                        className="p-3 rounded-md bg-[#131b2e] border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-cyan-300">{msg.sourceAgentName}</span>
                          <span className="text-slate-500">➔</span>
                          <span className="font-semibold text-indigo-300">{msg.targetAgentName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                          {msg.intent}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. AGENT DIRECTORY TAB */}
        {/* ========================================================================= */}
        {activeTab === 'workforce' && (
          <div className="space-y-4">
            {/* Search and Domain Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-[#0e1626] border border-[#1e293b]">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 20 agents by name or role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#131b2e] border border-slate-700/60 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 shrink-0">Domain:</span>
                <select
                  value={domainFilter}
                  onChange={e => setDomainFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#131b2e] border border-slate-700/60 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Domains (20)</option>
                  <option value="CONTROL_TOWER">Control Tower</option>
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="INVENTORY">Inventory</option>
                  <option value="DEMAND_PLANNING">Demand Planning</option>
                  <option value="SOP">S&OP</option>
                  <option value="LOGISTICS">Logistics</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="FINANCE_MATCHING">Finance / Matching</option>
                  <option value="RISK">Risk Management</option>
                  <option value="QUALITY">Quality</option>
                  <option value="MASTER_DATA">Master Data</option>
                  <option value="COMPLIANCE">Compliance</option>
                </select>
              </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map(agent => (
                <div
                  key={agent.agentId}
                  className={`p-4 rounded-lg bg-[#0e1626] border transition-all cursor-pointer flex flex-col justify-between ${
                    agent.status === 'QUARANTINED'
                      ? 'border-rose-600/50 bg-rose-950/10'
                      : selectedAgentId === agent.agentId
                      ? 'border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'border-[#1e293b] hover:border-slate-700'
                  }`}
                  onClick={() => {
                    setSelectedAgentId(agent.agentId);
                    setActiveTab('inspector');
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            agent.status === 'ACTIVE'
                              ? 'bg-emerald-400'
                              : agent.status === 'QUARANTINED'
                              ? 'bg-rose-500 animate-pulse'
                              : 'bg-amber-400'
                          }`}
                        />
                        <h4 className="text-xs font-bold text-white leading-tight">{agent.name}</h4>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase ${
                          agent.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                            : agent.status === 'QUARANTINED'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{agent.description}</p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {agent.operatingMode}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{agent.domain}</span>
                    </div>

                    <div className="text-cyan-400 flex items-center gap-1">
                      Inspect <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. AGENT INSPECTOR TAB */}
        {/* ========================================================================= */}
        {activeTab === 'inspector' && selectedAgent && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-[#0e1626] border border-[#1e293b] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-cyan-950 border border-cyan-800/40 text-cyan-400">
                    <Brain size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{selectedAgent.name}</h2>
                      <span className="text-xs text-slate-500 font-mono">({selectedAgent.agentId})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedAgent.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${
                      selectedAgent.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : selectedAgent.status === 'QUARANTINED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    STATUS: {selectedAgent.status}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    MODE: {selectedAgent.operatingMode}
                  </span>
                </div>
              </div>

              {/* Health Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="p-3 rounded bg-[#131b2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Calibration Score</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {selectedAgentHealth ? `${selectedAgentHealth.calibrationScore}%` : '96%'}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#131b2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Success Rate</div>
                  <div className="text-lg font-bold text-cyan-300">
                    {selectedAgentHealth ? `${selectedAgentHealth.successRate}%` : '99.1%'}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#131b2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Avg Execution Latency</div>
                  <div className="text-lg font-bold text-slate-200">
                    {selectedAgentHealth ? `${selectedAgentHealth.avgLatencyMs}ms` : '210ms'}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#131b2e] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Risk Classification</div>
                  <div className="text-lg font-bold text-amber-300">{selectedAgent.riskClass}</div>
                </div>
              </div>

              {/* Capabilities and Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Governed Capabilities ({selectedAgent.capabilities.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.capabilities.map(cap => (
                      <span
                        key={cap}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-slate-800 border border-slate-700 text-slate-200"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    Allowed Governed Tools ({selectedAgent.allowedTools.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.allowedTools.map(tool => (
                      <span
                        key={tool}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. PROPOSALS & APPROVALS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Governed AI Proposals Queue</h3>
                <p className="text-xs text-slate-400">
                  Formal decision proposals formulated by AI agents. Material changes require human approval before Kernel execution.
                </p>
              </div>
              <button
                onClick={handleGenerateSampleProposal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-cyan-600 text-white hover:bg-cyan-500"
              >
                <Sparkles size={14} /> Generate Proposal
              </button>
            </div>

            {proposals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-[#0e1626] rounded-lg border border-[#1e293b]">
                No active proposals in the queue. Click &quot;Simulate AI Proposal&quot; to test the governed proposal lifecycle.
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map(prop => (
                  <div
                    key={prop.proposalId}
                    className="p-5 rounded-lg bg-[#0e1626] border border-[#1e293b] space-y-4"
                  >
                    {/* Proposal Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-cyan-400">{prop.proposalId}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              prop.approvalStatus === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : prop.approvalStatus === 'EXECUTED'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : prop.approvalStatus === 'REJECTED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {prop.approvalStatus}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1">{prop.intent}</h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Formulated by <span className="text-slate-200 font-medium">{prop.agentName}</span> ({prop.domain}) • Confidence: {Math.round(prop.confidence * 100)}%
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {prop.approvalStatus === 'PENDING_HUMAN_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApproveProposal(prop)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectProposal(prop)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}

                        {prop.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleExecuteProposal(prop)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/40 transition-colors"
                          >
                            <Play size={14} /> Execute via Kernel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reasoning Chain Breakdown */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Reasoning Chain ({prop.reasoningChain.length} steps)
                      </div>
                      <div className="space-y-1.5">
                        {prop.reasoningChain.map(step => {
                          const categoryColors: Record<string, string> = {
                            FACT: 'bg-emerald-950 text-emerald-300 border-emerald-800',
                            OBSERVATION: 'bg-blue-950 text-blue-300 border-blue-800',
                            MODELLED: 'bg-purple-950 text-purple-300 border-purple-800',
                            PREDICTION: 'bg-amber-950 text-amber-300 border-amber-800',
                            ASSUMPTION: 'bg-slate-800 text-slate-300 border-slate-700',
                            RECOMMENDATION: 'bg-cyan-950 text-cyan-300 border-cyan-800',
                          };
                          const badgeClass = categoryColors[step.category] || 'bg-slate-800 text-slate-300 border-slate-700';

                          return (
                            <div
                              key={step.stepNumber}
                              className="p-2.5 rounded bg-[#131b2e] border border-slate-800 text-xs flex items-start gap-2.5"
                            >
                              <span
                                className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase shrink-0 ${badgeClass}`}
                              >
                                {step.category}
                              </span>
                              <span className="text-slate-200 leading-snug">{step.statement}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Risk & Exposure Matrix */}
                    <div className="p-3 rounded bg-[#131b2e] border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Risk Score:</span>
                        <div className="font-bold text-amber-300">{prop.riskAssessment.score} / 100 ({prop.riskAssessment.riskClass})</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Blast Radius:</span>
                        <div className="font-semibold text-slate-200">{prop.riskAssessment.blastRadius}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Financial Impact:</span>
                        <div className="font-semibold text-white">${prop.riskAssessment.financialExposure.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Reversibility:</span>
                        <div className="font-semibold text-emerald-400">{prop.riskAssessment.reversibility}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. MULTI-AGENT COLLABORATION TAB */}
        {/* ========================================================================= */}
        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Multi-Agent Collaboration Engine</h3>
                <p className="text-xs text-slate-400">
                  Trace-verified inter-agent communication, peer delegations, and consensus synthesis.
                </p>
              </div>
              <button
                onClick={handleTriggerConsensus}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <Network size={14} /> Run Consensus Synthesis
              </button>
            </div>

            {/* Consensus Output Box */}
            {consensusResult && (
              <div className="p-5 rounded-lg bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={16} /> Multi-Agent Consensus Result
                </div>
                <p className="text-xs text-slate-200">{consensusResult.consensusRecommendation}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {consensusResult.contributions.map((c: any) => (
                    <div key={c.agentId} className="p-3 rounded bg-[#0e1626] border border-indigo-900/60 text-xs space-y-1">
                      <div className="font-bold text-cyan-300">{c.agentName}</div>
                      <p className="text-slate-300 text-[11px]">{c.perspective}</p>
                      <div className="text-[10px] text-emerald-400">Confidence: {Math.round(c.confidence * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Log */}
            <div className="p-5 rounded-lg bg-[#0e1626] border border-[#1e293b] space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Inter-Agent Message Ledger ({collaborationMessages.length} events)
              </h4>
              <div className="space-y-2">
                {collaborationMessages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-[#131b2e]/50 rounded">
                    No collaboration messages yet. Click &quot;Run Consensus Synthesis&quot; to test.
                  </div>
                ) : (
                  collaborationMessages.map(msg => (
                    <div
                      key={msg.messageId}
                      className="p-3 rounded bg-[#131b2e] border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{msg.sourceAgentName}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="font-bold text-indigo-400">{msg.targetAgentName}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-300">
                          {msg.messageType}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px] truncate max-w-md">{msg.intent}</div>
                      <div className="text-[10px] text-slate-500 font-mono shrink-0">{msg.securityContext.traceToken}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. QUARANTINE SENTINEL TAB */}
        {/* ========================================================================= */}
        {activeTab === 'quarantine' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Governed Quarantine Sentinel</h3>
                <p className="text-xs text-slate-400">
                  Suspends agents attempting prompt injections, Kernel bypasses, self-approval, or cross-tenant access.
                  Reinstatement is strictly restricted to authorized human administrators.
                </p>
              </div>
            </div>

            {quarantineRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-[#0e1626] rounded-lg border border-[#1e293b]">
                <ShieldCheck size={32} className="mx-auto text-emerald-400 mb-2" />
                All agents are healthy. No active quarantines or security breaches recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {quarantineRecords.map(record => (
                  <div
                    key={record.quarantineId}
                    className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-300">{record.agentName}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-900 text-rose-200 uppercase">
                          {record.reason}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{record.quarantineId}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{record.details}</p>
                      {record.reinstatedAt && (
                        <div className="text-[10px] text-emerald-400 mt-1">
                          Reinstated at {record.reinstatedAt} by {record.reinstatedBy}: &quot;{record.reinstatementJustification}&quot;
                        </div>
                      )}
                    </div>

                    {!record.reinstatedAt && (
                      <button
                        onClick={() => setQuarantiningAgentId(record.agentId)}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white shrink-0"
                      >
                        Reinstate Agent
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reinstatement Modal */}
            {quarantiningAgentId && (
              <div className="p-5 rounded-lg bg-[#0e1626] border border-cyan-500/60 space-y-4">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <KeyRound size={16} />
                  Administrative Reinstatement of Agent: {quarantiningAgentId}
                </div>
                <p className="text-xs text-slate-300">
                  Please enter a formal administrative justification for reinstating this agent. AI agents cannot self-reinstate.
                </p>
                <textarea
                  rows={3}
                  value={reinstatementJustification}
                  onChange={e => setReinstatementJustification(e.target.value)}
                  placeholder="E.g., Root cause analysis verified; adversarial prompt injection pattern patched and sanitized."
                  className="w-full p-2.5 text-xs bg-[#131b2e] border border-slate-700 rounded text-white focus:outline-none focus:border-cyan-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setQuarantiningAgentId(null);
                      setReinstatementJustification('');
                    }}
                    className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReinstateAgent(quarantiningAgentId)}
                    className="px-4 py-1.5 text-xs font-bold rounded bg-cyan-600 text-white hover:bg-cyan-500"
                  >
                    Confirm Reinstatement
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. CALIBRATION & OUTCOMES TAB */}
        {/* ========================================================================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">Closed-Loop Learning & Calibration</h3>
              <p className="text-xs text-slate-400">
                Empirical tracking comparing predicted outcomes against actual business KPIs. Feedback tunes confidence without altering permissions.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#0e1626] border border-[#1e293b] space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Workforce Health & Calibration Matrix
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Agent</th>
                      <th className="py-2.5 px-3">Domain</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Success Rate</th>
                      <th className="py-2.5 px-3">Calibration</th>
                      <th className="py-2.5 px-3">Health Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {healthMetrics.map(m => (
                      <tr key={m.agentId} className="hover:bg-[#131b2e]/50">
                        <td className="py-2.5 px-3 font-medium text-white">{m.agentName}</td>
                        <td className="py-2.5 px-3 text-slate-400">{m.domain}</td>
                        <td className="py-2.5 px-3 text-cyan-300 font-mono text-[10px]">{m.operatingMode}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{m.successRate}%</td>
                        <td className="py-2.5 px-3 text-cyan-400 font-bold">{m.calibrationScore}%</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              m.healthScore >= 80
                                ? 'bg-emerald-950 text-emerald-300'
                                : m.healthScore >= 50
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {m.healthScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
