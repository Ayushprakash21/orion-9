/**
 * ORION-9 SUPPLY CHAIN OPERATING SYSTEM — UNIFIED APPROVAL CENTER
 * Layer 1 / Layer 3: Centralized human-in-the-loop governance interface.
 * Aggregates all approval-gated operational workflows, high-exposure financial commitments,
 * quality holds, and halted AI actions.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useKernel } from '../kernel/useKernel';
import { useIntelligence } from '../intelligence/useIntelligence';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Bot,
  User,
  Filter,
  Search,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  ChevronRight,
  ShieldAlert,
  Send,
  RefreshCw,
} from 'lucide-react';
import { ApprovalRecord } from '../kernel/types';

export const ApprovalCenter: React.FC = () => {
  const {
    purchaseOrders,
    decisions,
    actions,
    exceptions,
    userProfile,
    organizationProfile,
    approveAction,
    executeAction,
    cancelAction,
    approveDecision,
    rejectDecision,
  } = useSupplyChain();

  const { commandBus, eventBus, recordAudit } = useKernel();
  const { agentRegistry } = useIntelligence();

  const [activeTab, setActiveTab] = useState<'ALL' | 'AI_ACTIONS' | 'PURCHASE_ORDERS' | 'DECISIONS' | 'QUALITY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'DECIDED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  // Synthesize all approval items across POs, AI actions, Decisions, and Quality Holds
  const approvalItems = useMemo(() => {
    const items: Array<{
      id: string;
      sourceType: 'AI_ACTION' | 'PURCHASE_ORDER' | 'DECISION' | 'ACTION' | 'QUALITY';
      title: string;
      entityType: string;
      entityId: string;
      amount?: number;
      requester: {
        id: string;
        name: string;
        type: 'USER' | 'AI_AGENT' | 'SYSTEM' | 'EXTERNAL_INTEGRATION';
        model?: string;
      };
      policyReason: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      createdAt: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
      details: any;
    }> = [];

    // 1. Pending Kernel Approvals (AI & High-Value Commands)
    const pendingFromKernel = commandBus.getPendingApprovals();
    pendingFromKernel.forEach(rec => {
      items.push({
        id: rec.approvalId,
        sourceType: 'AI_ACTION',
        title: `AI Action: ${rec.action.replace(/_/g, ' ')}`,
        entityType: rec.entityType,
        entityId: rec.entityId,
        amount: rec.amount,
        requester: {
          id: rec.requester.id,
          name: rec.requester.name || 'AI Agent',
          type: rec.requester.type,
          model: 'Gemini 3.8 Flash',
        },
        policyReason: rec.policyId ? `Triggered Policy [${rec.policyId}]` : 'AI Architectural Constitution Rule 9: Human Approval Gate',
        status: rec.status === 'PENDING' ? 'PENDING' : rec.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        createdAt: rec.createdAt,
        severity: rec.amount && rec.amount > 50000 ? 'CRITICAL' : 'HIGH',
        details: rec,
      });
    });

    // 2. High-Value Purchase Orders (> $50,000 or Draft/Submitted status)
    purchaseOrders.forEach(po => {
      const isPending = po.status === 'Draft' || po.status === 'Submitted';
      const isHighValue = po.totalValue > 50000;
      if (isPending || isHighValue) {
        items.push({
          id: `po-appr-${po.id}`,
          sourceType: 'PURCHASE_ORDER',
          title: `Purchase Order Release: ${po.id}`,
          entityType: 'purchase_order',
          entityId: po.id,
          amount: po.totalValue,
          requester: {
            id: po.buyer || 'procurement-user',
            name: po.buyer || 'Procurement Team',
            type: 'USER',
          },
          policyReason: isHighValue
            ? 'Monetary exposure exceeds $50,000 limit. Human Manager release required.'
            : 'Standard purchase order validation gate.',
          status: isPending ? 'PENDING' : 'APPROVED',
          createdAt: po.orderDate || new Date().toISOString(),
          severity: isHighValue ? 'CRITICAL' : 'MEDIUM',
          details: po,
        });
      }
    });

    // 3. Pending Decisions in Decision Center
    decisions.forEach(dec => {
      const isPending = (dec.status as any) === 'ANALYZING' || (dec.status as any) === 'READY_FOR_REVIEW' || (dec.status as any) === 'DETECTED';
      items.push({
        id: `dec-appr-${dec.id}`,
        sourceType: 'DECISION',
        title: dec.title || `Operational Decision ${dec.id}`,
        entityType: 'decision',
        entityId: dec.entityId || dec.id,
        requester: {
          id: 'decision-engine',
          name: 'Decision Science Engine',
          type: 'AI_AGENT',
          model: 'Gemini 3.8 Flash',
        },
        policyReason: 'Strategic supply chain intervention requires operator approval.',
        status: isPending ? 'PENDING' : dec.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        createdAt: dec.approval?.approvedAt || new Date().toISOString(),
        severity: 'HIGH',
        details: dec,
      });
    });

    // 4. Proposed Actions in Action Center
    actions.forEach(act => {
      const isPending = act.status === 'PROPOSED' || act.status === 'AWAITING_APPROVAL';
      items.push({
        id: `act-appr-${act.id}`,
        sourceType: 'ACTION',
        title: act.recommendation || `Recommended Action ${act.id}`,
        entityType: 'action',
        entityId: act.entity || act.id,
        amount: typeof act.impact === 'object' ? (act.impact as any)?.financialExposure : undefined,
        requester: {
          id: 'action-engine',
          name: 'Autonomous Action Engine',
          type: 'AI_AGENT',
          model: 'Gemini 3.8 Flash',
        },
        policyReason: act.reason || 'Operational remediation proposal.',
        status: isPending ? 'PENDING' : act.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        createdAt: act.createdAt || new Date().toISOString(),
        severity: act.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        details: act,
      });
    });

    return items;
  }, [purchaseOrders, decisions, actions, commandBus]);

  // Filtering
  const filteredItems = useMemo(() => {
    return approvalItems.filter(item => {
      if (statusFilter === 'PENDING' && item.status !== 'PENDING') return false;
      if (statusFilter === 'DECIDED' && item.status === 'PENDING') return false;

      if (activeTab === 'AI_ACTIONS' && item.sourceType !== 'AI_ACTION') return false;
      if (activeTab === 'PURCHASE_ORDERS' && item.sourceType !== 'PURCHASE_ORDER') return false;
      if (activeTab === 'DECISIONS' && item.sourceType !== 'DECISION') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.entityId.toLowerCase().includes(q) ||
          item.requester.name.toLowerCase().includes(q) ||
          item.policyReason.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [approvalItems, activeTab, statusFilter, searchQuery]);

  // Select first item by default
  useEffect(() => {
    if (!selectedId && filteredItems.length > 0) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selectedItem = useMemo(() => {
    return approvalItems.find(i => i.id === selectedId) || null;
  }, [approvalItems, selectedId]);

  // Handle Approve
  const handleApprove = () => {
    if (!selectedItem) return;
    const approver = {
      id: userProfile?.id || 'operator',
      name: userProfile?.fullName || 'Platform Operator',
      role: userProfile?.role || 'supply_chain_manager',
    };

    if (selectedItem.sourceType === 'AI_ACTION') {
      commandBus.resolveApproval(selectedItem.id, 'APPROVED', approver);
    } else if (selectedItem.sourceType === 'PURCHASE_ORDER') {
      const po = selectedItem.details;
      po.status = 'Approved';
    } else if (selectedItem.sourceType === 'DECISION') {
      const dec = selectedItem.details;
      approveDecision(dec.id, dec.options?.[0]?.id || 'OPT-1', approver.name, commentInput || 'Approved via Approval Center');
    } else if (selectedItem.sourceType === 'ACTION') {
      const act = selectedItem.details;
      approveAction(act.id);
      executeAction(act.id);
    }

    recordAudit({
      eventId: selectedItem.id,
      correlationId: `appr-${selectedItem.id}`,
      actor: { id: approver.id, type: 'USER', name: approver.name, role: approver.role },
      tenantId: organizationProfile?.id || 'ORION_PLATFORM',
      action: 'APPROVAL_GRANTED',
      entityType: selectedItem.entityType,
      entityId: selectedItem.entityId,
      result: 'SUCCESS',
      afterState: { comment: commentInput || 'Approved via Approval Center' },
      classification: 'INTERNAL',
    });

    setCommentInput('');
    setActionNotice({ type: 'success', text: `Approved: ${selectedItem.title}` });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Handle Reject
  const handleReject = () => {
    if (!selectedItem) return;
    const approver = {
      id: userProfile?.id || 'operator',
      name: userProfile?.fullName || 'Platform Operator',
      role: userProfile?.role || 'supply_chain_manager',
    };

    if (selectedItem.sourceType === 'AI_ACTION') {
      commandBus.resolveApproval(selectedItem.id, 'REJECTED', approver);
    } else if (selectedItem.sourceType === 'DECISION') {
      rejectDecision(selectedItem.details.id, approver.name, commentInput || 'Rejected via Approval Center');
    } else if (selectedItem.sourceType === 'ACTION') {
      cancelAction(selectedItem.details.id);
    }

    recordAudit({
      eventId: selectedItem.id,
      correlationId: `rej-${selectedItem.id}`,
      actor: { id: approver.id, type: 'USER', name: approver.name, role: approver.role },
      tenantId: organizationProfile?.id || 'ORION_PLATFORM',
      action: 'APPROVAL_REJECTED',
      entityType: selectedItem.entityType,
      entityId: selectedItem.entityId,
      result: 'BLOCKED',
      afterState: { comment: commentInput || 'Rejected via Approval Center' },
      classification: 'INTERNAL',
    });

    setCommentInput('');
    setActionNotice({ type: 'warn', text: `Rejected: ${selectedItem.title}` });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Metrics
  const pendingCount = approvalItems.filter(i => i.status === 'PENDING').length;
  const criticalCount = approvalItems.filter(i => i.status === 'PENDING' && i.severity === 'CRITICAL').length;
  const totalExposure = approvalItems
    .filter(i => i.status === 'PENDING' && i.amount)
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="w-full h-full flex flex-col bg-os-bg text-os-text-primary overflow-hidden font-sans select-none">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-os-border flex items-center justify-between bg-os-surface/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-os-accent/15 border border-os-accent/30 flex items-center justify-center text-os-accent">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-wide uppercase">Unified Approval Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-os-accent/15 text-os-accent border border-os-accent/30 font-bold">
                {pendingCount} Pending Gates
              </span>
            </div>
            <p className="text-xs text-os-text-muted">
              Centralized human-in-the-loop governance for high-value commitments, quality holds, and halted AI actions.
            </p>
          </div>
        </div>

        {/* Action notification toast */}
        {actionNotice && (
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border animate-fade-in flex items-center gap-2 ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{actionNotice.text}</span>
          </div>
        )}
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 px-6 py-3 border-b border-os-border bg-os-surface/20">
        <div className="p-3 rounded-xl bg-os-surface/60 border border-os-border flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-os-text-muted">Pending Reviews</div>
            <div className="text-xl font-mono font-bold text-os-text-primary mt-0.5">{pendingCount}</div>
          </div>
          <Clock className="w-5 h-5 text-os-text-muted" />
        </div>

        <div className="p-3 rounded-xl bg-os-surface/60 border border-os-border flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-os-text-muted">Critical Tier (&gt;$50K)</div>
            <div className="text-xl font-mono font-bold text-amber-400 mt-0.5">{criticalCount}</div>
          </div>
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>

        <div className="p-3 rounded-xl bg-os-surface/60 border border-os-border flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-os-text-muted">Capital Under Gate</div>
            <div className="text-xl font-mono font-bold text-os-accent mt-0.5">
              ${totalExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <DollarSign className="w-5 h-5 text-os-accent" />
        </div>

        <div className="p-3 rounded-xl bg-os-surface/60 border border-os-border flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-os-text-muted">AI Guardrail Compliance</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">100%</div>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-2.5 border-b border-os-border flex flex-wrap items-center justify-between gap-3 bg-os-surface/10">
        {/* Domain Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'AI_ACTIONS', 'PURCHASE_ORDERS', 'DECISIONS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-os-accent/20 text-os-accent border border-os-accent/40 font-semibold'
                  : 'bg-os-surface/40 text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface border border-transparent'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Right filters: Status toggle and Search */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-os-border p-0.5 bg-os-surface/40 text-[11px] font-mono">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'PENDING' ? 'bg-os-accent/20 text-os-accent font-semibold' : 'text-os-text-muted'
              }`}
            >
              PENDING
            </button>
            <button
              onClick={() => setStatusFilter('DECIDED')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'DECIDED' ? 'bg-os-accent/20 text-os-accent font-semibold' : 'text-os-text-muted'
              }`}
            >
              DECIDED
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'ALL' ? 'bg-os-accent/20 text-os-accent font-semibold' : 'text-os-text-muted'
              }`}
            >
              ALL
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-os-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter approvals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-os-surface/60 border border-os-border text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none focus:border-os-accent/50 w-48 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left List (~42%) / Right Inspector (~58%) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Approval Items List */}
        <div className="w-full lg:w-[420px] xl:w-[460px] border-r border-os-border flex flex-col min-h-0 bg-os-bg overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-os-text-muted">
              <ShieldCheck className="w-10 h-10 text-emerald-400/40 mb-3" />
              <div className="text-sm font-medium text-os-text-secondary">No Pending Approvals</div>
              <p className="text-xs text-os-text-muted max-w-xs mt-1">
                All supply chain workflows and AI recommendations are compliant and executed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-os-border">
              {filteredItems.map(item => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-os-accent/10 border-l-4 border-l-os-accent'
                        : 'hover:bg-os-surface/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            item.severity === 'CRITICAL'
                              ? 'bg-red-950/60 text-red-400 border border-red-500/30'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-[10px] font-mono text-os-text-muted">{item.entityId}</span>
                      </div>

                      {item.amount && (
                        <span className="text-xs font-mono font-bold text-os-text-primary">
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-os-text-primary mt-1 line-clamp-1">
                      {item.title}
                    </div>

                    <div className="text-[11px] text-os-text-muted line-clamp-1 mt-0.5">
                      {item.policyReason}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-os-border/50 text-[10px] text-os-text-muted">
                      <div className="flex items-center gap-1 font-mono">
                        {item.requester.type === 'AI_AGENT' ? (
                          <span className="flex items-center gap-1 text-os-accent">
                            <Bot className="w-3 h-3" />
                            {item.requester.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-os-text-secondary">
                            <User className="w-3 h-3" />
                            {item.requester.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            item.status === 'PENDING'
                              ? 'bg-amber-950/40 text-amber-300'
                              : item.status === 'APPROVED'
                              ? 'bg-emerald-950/40 text-emerald-300'
                              : 'bg-red-950/40 text-red-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Inspection & Decision Pane */}
        <div className="flex-1 flex flex-col min-h-0 bg-os-surface/20 overflow-y-auto">
          {selectedItem ? (
            <div className="p-6 flex flex-col gap-5 max-w-3xl">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-os-surface border border-os-border flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-os-accent/15 text-os-accent border border-os-accent/30 font-bold">
                      {selectedItem.sourceType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-os-text-muted">{selectedItem.id}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-os-text-primary mt-1.5">{selectedItem.title}</h2>
                  <div className="text-xs text-os-text-muted mt-0.5">
                    Target Entity: <span className="font-mono text-os-text-secondary">{selectedItem.entityType} / {selectedItem.entityId}</span>
                  </div>
                </div>

                {selectedItem.amount && (
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-os-text-muted">Exposure</div>
                    <div className="text-xl font-mono font-bold text-os-accent mt-0.5">
                      ${selectedItem.amount.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Policy Trigger Banner */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-amber-300 uppercase tracking-wide">Governance Policy Gate</div>
                  <p className="mt-0.5 leading-relaxed">{selectedItem.policyReason}</p>
                </div>
              </div>

              {/* Requester Identity & Grounding */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-os-surface border border-os-border">
                  <div className="text-[10px] font-mono uppercase text-os-text-muted">Originating Actor</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {selectedItem.requester.type === 'AI_AGENT' ? (
                      <Bot className="w-4 h-4 text-os-accent" />
                    ) : (
                      <User className="w-4 h-4 text-os-text-secondary" />
                    )}
                    <span className="text-xs font-semibold text-os-text-primary">{selectedItem.requester.name}</span>
                  </div>
                  {selectedItem.requester.model && (
                    <div className="text-[11px] font-mono text-os-accent/80 mt-1">
                      Model: {selectedItem.requester.model}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-os-surface border border-os-border">
                  <div className="text-[10px] font-mono uppercase text-os-text-muted">Submission Timestamp</div>
                  <div className="text-xs font-mono text-os-text-primary mt-1.5">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-1">
                    Audited: Immutable Kernel Trace Logged
                  </div>
                </div>
              </div>

              {/* Action / Entity Details Payload */}
              <div className="p-4 rounded-xl bg-os-surface border border-os-border">
                <div className="text-xs font-mono uppercase text-os-text-muted mb-2 font-bold flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-os-accent" />
                  Operational Parameters &amp; Evidence
                </div>
                <div className="rounded-lg bg-os-bg/60 p-3 border border-os-border font-mono text-xs overflow-x-auto max-h-48 text-os-text-secondary">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedItem.details, null, 2)}</pre>
                </div>
              </div>

              {/* Decision / Approval Action Card */}
              {selectedItem.status === 'PENDING' ? (
                <div className="p-4 rounded-xl bg-os-surface border border-os-accent/30 flex flex-col gap-3">
                  <div className="text-xs font-semibold text-os-text-primary uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-os-accent" />
                    Operator Decision &amp; Audit Rationale
                  </div>

                  <input
                    type="text"
                    placeholder="Enter approval rationale or rejection justification..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-os-bg border border-os-border text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none focus:border-os-accent transition-all"
                  />

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      onClick={handleReject}
                      className="px-4 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Action
                    </button>

                    <button
                      onClick={handleApprove}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Authorize &amp; Execute
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-os-surface border border-os-border text-xs text-os-text-muted font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Decision recorded. Status: <span className="font-bold text-os-text-primary">{selectedItem.status}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-os-text-muted text-sm">
              Select an item to inspect its governance details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
