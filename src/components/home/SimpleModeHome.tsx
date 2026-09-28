import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { useWindowManager } from '../../os/WindowManagerContext';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import {
  ShoppingBag,
  Package,
  Truck,
  FileText,
  AlertTriangle,
  Bell,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  Compass,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { GuidedBuyWorkflow } from '../guided/GuidedBuyWorkflow';
import { cn } from '../../lib/utils';

export const SimpleModeHome: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { 
    products,
    inventory, 
    shipments, 
    purchaseOrders, 
    exceptions, 
    suppliers, 
    currency, 
    settings, 
    updateSettings 
  } = useSupplyChain();
  const { currentUser } = useAuth();
  const { openApplication } = useWindowManager();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [showAllAttention, setShowAllAttention] = useState(false);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = currentUser?.fullName?.split(' ')[0] || currentUser?.username || 'there';

  // Real operational attention metrics
  const delayedShipments = useMemo(() => {
    return (shipments || []).filter(s => s.delayDays > 0 && s.status !== 'Delivered');
  }, [shipments]);

  const lowStockItems = useMemo(() => {
    return (inventory || []).filter(i => (i.onHand - (i.reserved || 0)) < (i.safetyStock || 0));
  }, [inventory]);

  const pendingConfirmations = useMemo(() => {
    return (purchaseOrders || []).filter(p => p.status === 'Draft' || p.status === 'Submitted');
  }, [purchaseOrders]);

  const unresolvedExceptions = useMemo(() => {
    return (exceptions || []).filter(e => e.status !== 'Resolved');
  }, [exceptions]);

  // Combined attention items for unified human list
  const attentionItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      type: 'delay' | 'stock' | 'supplier' | 'exception';
      severity: 'critical' | 'warning' | 'info';
      actionLabel: string;
      onClick: () => void;
    }> = [];

    delayedShipments.forEach(s => {
      list.push({
        id: `ship-${s.id}`,
        title: `Shipment ${s.carrier ? s.carrier + ' (' + s.id + ')' : s.id} is delayed`,
        description: `${s.origin || 'Origin'} → ${s.destination || 'Destination'} (${s.delayDays} day delay)`,
        type: 'delay',
        severity: s.delayDays > 3 ? 'critical' : 'warning',
        actionLabel: 'Track shipment',
        onClick: () => {
          navigate('/shipments');
          try { openApplication('shipments'); } catch {}
        }
      });
    });

    lowStockItems.forEach(i => {
      const avail = i.onHand - (i.reserved || 0);
      const prodName = products?.find(p => p.id === i.productId)?.name || i.productId || 'Item';
      list.push({
        id: `inv-${i.id}`,
        title: `${prodName} is running low`,
        description: `${avail} available (Safety stock: ${i.safetyStock})`,
        type: 'stock',
        severity: avail <= 0 ? 'critical' : 'warning',
        actionLabel: 'Buy more',
        onClick: () => setIsBuyModalOpen(true)
      });
    });

    pendingConfirmations.slice(0, 3).forEach(p => {
      const supName = suppliers?.find(s => s.id === p.supplierId)?.name || p.supplierId || 'Assigned vendor';
      list.push({
        id: `po-${p.id}`,
        title: `Order ${p.id} awaiting confirmation`,
        description: `Supplier: ${supName} • ${formatCurrency(p.totalValue || 0, currency)}`,
        type: 'supplier',
        severity: 'info',
        actionLabel: 'Review order',
        onClick: () => {
          navigate('/procurement');
          try { openApplication('procurement'); } catch {}
        }
      });
    });

    unresolvedExceptions.slice(0, 3).forEach(e => {
      list.push({
        id: `exc-${e.id}`,
        title: e.type || 'Operational issue reported',
        description: e.description || 'Action required to restore normal operations',
        type: 'exception',
        severity: e.severity === 'Critical' ? 'critical' : 'warning',
        actionLabel: 'View issue',
        onClick: () => {
          navigate('/exceptions');
          try { openApplication('exceptions'); } catch {}
        }
      });
    });

    return list;
  }, [delayedShipments, lowStockItems, pendingConfirmations, unresolvedExceptions, navigate, openApplication, currency]);

  const displayedAttentionItems = showAllAttention ? attentionItems : attentionItems.slice(0, 4);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 select-none animate-in fade-in duration-200">
      
      {/* 1. GREETING & MODE SWITCHER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-os-surface border border-os-border shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Simple Mode Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-os-text-primary">
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-os-text-secondary">
            What do you want to do today? Choose an action below or let Orion assist you.
          </p>
        </div>

        {/* Mode Switcher Button */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <div className="p-1 rounded-xl bg-os-surface-secondary border border-os-border flex items-center gap-1 text-xs font-mono">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
            >
              ● Simple
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ userExperienceMode: 'ADVANCED' })}
              className="px-3 py-1.5 rounded-lg text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer"
              title="Switch to Advanced SCM Mode"
            >
              Advanced Mode
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY ACTION CARDS ("WHAT DO YOU WANT TO DO?") */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider px-1">
          Quick Actions
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Action 1: Buy something */}
          <button
            type="button"
            onClick={() => setIsBuyModalOpen(true)}
            data-testid="simple-action-buy"
            className="p-5 rounded-2xl bg-os-surface border border-os-border hover:border-emerald-500/60 hover:bg-os-surface-elevated text-left transition-all group cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag size={22} />
              </div>
              <ArrowRight size={16} className="text-os-text-muted group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-base font-semibold text-os-text-primary group-hover:text-emerald-400 transition-colors">
              Buy something
            </div>
            <p className="text-xs text-os-text-secondary mt-1 leading-relaxed">
              Order materials, parts, or supplies with guided smart sourcing.
            </p>
          </button>

          {/* Action 2: Check inventory */}
          <button
            type="button"
            onClick={() => {
              navigate('/inventory');
              try { openApplication('inventory'); } catch {}
            }}
            data-testid="simple-action-inventory"
            className="p-5 rounded-2xl bg-os-surface border border-os-border hover:border-sky-500/60 hover:bg-os-surface-elevated text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform">
                <Package size={22} />
              </div>
              <ArrowRight size={16} className="text-os-text-muted group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-base font-semibold text-os-text-primary group-hover:text-sky-400 transition-colors">
              Check inventory
            </div>
            <p className="text-xs text-os-text-secondary mt-1 leading-relaxed">
              See what is in stock, where items are located, and check stock levels.
            </p>
          </button>

          {/* Action 3: Track a shipment */}
          <button
            type="button"
            onClick={() => {
              navigate('/shipments');
              try { openApplication('shipments'); } catch {}
            }}
            data-testid="simple-action-shipments"
            className="p-5 rounded-2xl bg-os-surface border border-os-border hover:border-amber-500/60 hover:bg-os-surface-elevated text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Truck size={22} />
              </div>
              <ArrowRight size={16} className="text-os-text-muted group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-base font-semibold text-os-text-primary group-hover:text-amber-400 transition-colors">
              Track a shipment
            </div>
            <p className="text-xs text-os-text-secondary mt-1 leading-relaxed">
              Check delivery status, estimated arrival times, and active routes.
            </p>
          </button>

          {/* Action 4: Check an order */}
          <button
            type="button"
            onClick={() => {
              navigate('/procurement');
              try { openApplication('procurement'); } catch {}
            }}
            data-testid="simple-action-orders"
            className="p-5 rounded-2xl bg-os-surface border border-os-border hover:border-purple-500/60 hover:bg-os-surface-elevated text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <FileText size={22} />
              </div>
              <ArrowRight size={16} className="text-os-text-muted group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-base font-semibold text-os-text-primary group-hover:text-purple-400 transition-colors">
              Check an order
            </div>
            <p className="text-xs text-os-text-secondary mt-1 leading-relaxed">
              View purchase orders, approvals, supplier confirmations, and history.
            </p>
          </button>

          {/* Action 5: Report an issue */}
          <button
            type="button"
            onClick={() => {
              navigate('/exceptions');
              try { openApplication('exceptions'); } catch {}
            }}
            data-testid="simple-action-issues"
            className="p-5 rounded-2xl bg-os-surface border border-os-border hover:border-red-500/60 hover:bg-os-surface-elevated text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-105 transition-transform">
                <AlertTriangle size={22} />
              </div>
              <ArrowRight size={16} className="text-os-text-muted group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-base font-semibold text-os-text-primary group-hover:text-red-400 transition-colors">
              Report an issue
            </div>
            <p className="text-xs text-os-text-secondary mt-1 leading-relaxed">
              Flag a delay, shortage, damaged goods, or quality concern.
            </p>
          </button>

          {/* Action 6: Ask Orion AI */}
          <button
            type="button"
            onClick={() => {
              try { openApplication('orion-ai'); } catch {}
            }}
            data-testid="simple-action-ai"
            className="p-5 rounded-2xl bg-os-surface border border-os-border hover:border-cyan-500/60 hover:bg-os-surface-elevated text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <Sparkles size={22} />
              </div>
              <ArrowRight size={16} className="text-os-text-muted group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-base font-semibold text-os-text-primary group-hover:text-cyan-400 transition-colors">
              Ask AI Assistant
            </div>
            <p className="text-xs text-os-text-secondary mt-1 leading-relaxed">
              Get natural-language answers, recommendations, and assistance.
            </p>
          </button>
        </div>
      </div>

      {/* 3. WHAT NEEDS YOUR ATTENTION */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="text-sm font-bold tracking-tight text-os-text-primary flex items-center gap-2">
              <Bell size={16} className="text-amber-400" />
              <span>WHAT NEEDS YOUR ATTENTION</span>
            </div>
            <div className="text-xs text-os-text-secondary mt-0.5">
              Clear items requiring action or review across your supply chain
            </div>
          </div>

          {attentionItems.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllAttention(!showAllAttention)}
              className="text-xs font-mono font-medium text-sky-400 hover:text-sky-300 underline cursor-pointer"
            >
              {showAllAttention ? 'Show less' : `View all (${attentionItems.length})`}
            </button>
          )}
        </div>

        {/* Attention Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-os-surface border border-os-border flex items-center justify-between">
            <span className="text-xs text-os-text-secondary">Delayed shipments</span>
            <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded-full", delayedShipments.length > 0 ? "bg-amber-500/20 text-amber-400" : "bg-os-surface-secondary text-os-text-muted")}>
              {delayedShipments.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-os-surface border border-os-border flex items-center justify-between">
            <span className="text-xs text-os-text-secondary">Low stock items</span>
            <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded-full", lowStockItems.length > 0 ? "bg-red-500/20 text-red-400" : "bg-os-surface-secondary text-os-text-muted")}>
              {lowStockItems.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-os-surface border border-os-border flex items-center justify-between">
            <span className="text-xs text-os-text-secondary">Pending orders</span>
            <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded-full", pendingConfirmations.length > 0 ? "bg-sky-500/20 text-sky-400" : "bg-os-surface-secondary text-os-text-muted")}>
              {pendingConfirmations.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-os-surface border border-os-border flex items-center justify-between">
            <span className="text-xs text-os-text-secondary">Open issues</span>
            <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded-full", unresolvedExceptions.length > 0 ? "bg-purple-500/20 text-purple-400" : "bg-os-surface-secondary text-os-text-muted")}>
              {unresolvedExceptions.length}
            </span>
          </div>
        </div>

        {/* Attention List */}
        {attentionItems.length > 0 ? (
          <div className="space-y-2.5">
            {displayedAttentionItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-os-surface border border-os-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-os-border/90 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0 mt-0.5",
                    item.severity === 'critical' ? "bg-red-500/10 text-red-400" : item.severity === 'warning' ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"
                  )}>
                    {item.type === 'delay' ? <Truck size={15} /> : item.type === 'stock' ? <Package size={15} /> : item.type === 'supplier' ? <FileText size={15} /> : <AlertTriangle size={15} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-os-text-primary">{item.title}</div>
                    <div className="text-[11px] text-os-text-secondary mt-0.5">{item.description}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={item.onClick}
                  className="px-3.5 py-1.5 rounded-lg bg-os-surface-elevated border border-os-border hover:bg-os-surface-active text-xs font-medium text-os-text-primary shrink-0 transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-center"
                >
                  <span>{item.actionLabel}</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-os-surface border border-os-border text-center space-y-2">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto opacity-80" />
            <div className="text-sm font-semibold text-os-text-primary">All operations are running smoothly</div>
            <p className="text-xs text-os-text-secondary max-w-sm mx-auto">
              No delayed shipments, low stock alerts, or pending confirmations requiring immediate attention.
            </p>
          </div>
        )}
      </div>

      {/* Guided Buy Modal */}
      {isBuyModalOpen && (
        <div
          className="fixed inset-0 z-[2147483640] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsBuyModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            <GuidedBuyWorkflow
              onCancel={() => setIsBuyModalOpen(false)}
              onComplete={() => {
                showToast('Purchase request created successfully', 'success');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
