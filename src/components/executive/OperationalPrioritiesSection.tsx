import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight,
  Layers,
  Sparkles,
  Inbox
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ProductionIntelligenceData {
  activeCycles: number;
  totalPlanned: number;
  onScheduleRate: number;
  activeWorkCenters: number;
  bottlenecksCount: number;
}

export interface TaskPriorityItem {
  id: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  dueTime: string;
  domain: string;
}

export interface PendingActionItem {
  id: string;
  title: string;
  requestedBy: string;
  financialImpact?: string;
  riskTier: 'LOW' | 'MEDIUM' | 'MATERIAL';
  onApprove?: () => void;
  onReview?: () => void;
}

interface OperationalPrioritiesSectionProps {
  productionData?: ProductionIntelligenceData;
  priorities?: TaskPriorityItem[];
  pendingActions?: PendingActionItem[];
  onOpenProduction?: () => void;
  onOpenTasks?: () => void;
  onOpenApprovals?: () => void;
  className?: string;
}

export const OperationalPrioritiesSection: React.FC<OperationalPrioritiesSectionProps> = ({
  productionData = {
    activeCycles: 14,
    totalPlanned: 18,
    onScheduleRate: 94.2,
    activeWorkCenters: 8,
    bottlenecksCount: 0,
  },
  priorities = [], // Reference 3 shows 0 active tasks: "You're all caught up!"
  pendingActions = [], // Reference 3 shows 0 pending approvals
  onOpenProduction,
  onOpenTasks,
  onOpenApprovals,
  className,
}) => {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-3.5", className)}>
      {/* 1. Production Intelligence Card */}
      <div 
        className="p-4 rounded-xl flex flex-col justify-between transition-all"
        style={{
          backgroundColor: 'var(--orion-morph-surface)',
          borderColor: 'var(--orion-morph-border)',
          borderWidth: '1px',
          borderStyle: 'solid',
          boxShadow: 'var(--orion-morph-shadow-soft)',
          backdropFilter: 'blur(var(--orion-morph-blur))',
          WebkitBackdropFilter: 'blur(var(--orion-morph-blur))',
        }}
      >
        <div>
          <div 
            className="flex items-center justify-between pb-3 border-b"
            style={{ borderColor: 'var(--orion-morph-border)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#39C77A]/15 border border-[#39C77A]/30 flex items-center justify-center text-[#39C77A]">
                <Activity size={13} />
              </div>
              <h4 className="font-semibold text-[var(--orion-text-primary)] text-xs uppercase tracking-wider font-mono">
                Production Intelligence
              </h4>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#39C77A]/10 text-[#39C77A] border border-[#39C77A]/30">
              Live Cycles
            </span>
          </div>

          <div className="py-4 space-y-3.5">
            <div className="flex items-baseline justify-between font-mono">
              <div>
                <span className="text-3xl font-light text-[var(--orion-text-primary)]">
                  {productionData.activeCycles}
                </span>
                <span className="text-xs text-[var(--orion-text-muted)] ml-1.5">
                  / {productionData.totalPlanned} active runs
                </span>
              </div>
              <span className="text-xs text-[#39C77A] font-medium">
                {productionData.onScheduleRate}% On-Time
              </span>
            </div>

            {/* Micro stats strip */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div 
                className="p-2 rounded-lg border transition-all"
                style={{
                  backgroundColor: 'var(--orion-morph-surface-subtle)',
                  borderColor: 'var(--orion-morph-border)',
                }}
              >
                <span className="text-[var(--orion-text-muted)] block text-[10px]">Work Centers</span>
                <span className="text-[var(--orion-text-primary)] font-medium">{productionData.activeWorkCenters} Online</span>
              </div>
              <div 
                className="p-2 rounded-lg border transition-all"
                style={{
                  backgroundColor: 'var(--orion-morph-surface-subtle)',
                  borderColor: 'var(--orion-morph-border)',
                }}
              >
                <span className="text-[var(--orion-text-muted)] block text-[10px]">Bottlenecks</span>
                <span className="text-[#39C77A] font-medium">
                  {productionData.bottlenecksCount === 0 ? 'None Detected' : `${productionData.bottlenecksCount} At Risk`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {onOpenProduction && (
          <button
            type="button"
            onClick={onOpenProduction}
            className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer border"
            style={{
              backgroundColor: 'var(--orion-morph-surface-subtle)',
              borderColor: 'var(--orion-morph-border)',
              color: 'var(--orion-text-secondary)',
            }}
          >
            <span>Manufacturing Execution</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* 2. My Priorities Card (With Reference 3 Zero-State Design) */}
      <div 
        className="p-4 rounded-xl flex flex-col justify-between transition-all"
        style={{
          backgroundColor: 'var(--orion-morph-surface)',
          borderColor: 'var(--orion-morph-border)',
          borderWidth: '1px',
          borderStyle: 'solid',
          boxShadow: 'var(--orion-morph-shadow-soft)',
          backdropFilter: 'blur(var(--orion-morph-blur))',
          WebkitBackdropFilter: 'blur(var(--orion-morph-blur))',
        }}
      >
        <div>
          <div 
            className="flex items-center justify-between pb-3 border-b"
            style={{ borderColor: 'var(--orion-morph-border)' }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md border flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--orion-morph-surface-subtle)',
                  borderColor: 'var(--orion-morph-border)',
                  color: 'var(--orion-text-secondary)',
                }}
              >
                <Clock size={13} />
              </div>
              <h4 className="font-semibold text-[var(--orion-text-primary)] text-xs uppercase tracking-wider font-mono">
                My Priorities
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[var(--orion-text-muted)]">
              {priorities.length} Tasks
            </span>
          </div>

          <div className="py-4">
            {priorities.length === 0 ? (
              /* Reference 3 Empty State */
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#39C77A]/10 border border-[#39C77A]/20 flex items-center justify-center text-[#39C77A] mb-3">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-xs font-medium text-[var(--orion-text-primary)]">
                  You're all caught up!
                </p>
                <p className="text-[11px] font-mono text-[var(--orion-text-muted)] mt-1 max-w-[220px]">
                  No active operational exceptions require your immediate intervention.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {priorities.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-2.5 rounded-lg border text-xs flex justify-between items-center"
                    style={{
                      backgroundColor: 'var(--orion-morph-surface-subtle)',
                      borderColor: 'var(--orion-morph-border)',
                    }}
                  >
                    <div>
                      <p className="text-[var(--orion-text-primary)] font-medium">{item.title}</p>
                      <span className="text-[10px] font-mono text-[var(--orion-text-muted)]">{item.domain} · {item.dueTime}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {onOpenTasks && (
          <button
            type="button"
            onClick={onOpenTasks}
            className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer border"
            style={{
              backgroundColor: 'var(--orion-morph-surface-subtle)',
              borderColor: 'var(--orion-morph-border)',
              color: 'var(--orion-text-secondary)',
            }}
          >
            <span>View Task Queue</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* 3. Pending Actions Card (Governance-Gated Approvals) */}
      <div 
        className="p-4 rounded-xl flex flex-col justify-between transition-all"
        style={{
          backgroundColor: 'var(--orion-morph-surface)',
          borderColor: 'var(--orion-morph-border)',
          borderWidth: '1px',
          borderStyle: 'solid',
          boxShadow: 'var(--orion-morph-shadow-soft)',
          backdropFilter: 'blur(var(--orion-morph-blur))',
          WebkitBackdropFilter: 'blur(var(--orion-morph-blur))',
        }}
      >
        <div>
          <div 
            className="flex items-center justify-between pb-3 border-b"
            style={{ borderColor: 'var(--orion-morph-border)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#39C77A]/15 border border-[#39C77A]/30 flex items-center justify-center text-[#39C77A]">
                <ShieldCheck size={13} />
              </div>
              <h4 className="font-semibold text-[var(--orion-text-primary)] text-xs uppercase tracking-wider font-mono">
                Pending Actions
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[var(--orion-text-muted)]">
              {pendingActions.length} Actions
            </span>
          </div>

          <div className="py-4">
            {pendingActions.length === 0 ? (
              /* Reference 3 Empty State */
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div 
                  className="w-10 h-10 rounded-full border flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: 'var(--orion-morph-surface-subtle)',
                    borderColor: 'var(--orion-morph-border)',
                    color: 'var(--orion-text-muted)',
                  }}
                >
                  <Inbox size={20} />
                </div>
                <p className="text-xs font-medium text-[var(--orion-text-primary)]">
                  No pending approvals required
                </p>
                <p className="text-[11px] font-mono text-[var(--orion-text-muted)] mt-1 max-w-[220px]">
                  All AI recommendations and purchase orders have passed policy validation.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingActions.slice(0, 2).map((action) => (
                  <div 
                    key={action.id} 
                    className="p-2.5 rounded-lg border text-xs space-y-2"
                    style={{
                      backgroundColor: 'var(--orion-morph-surface-subtle)',
                      borderColor: 'var(--orion-morph-border)',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-[var(--orion-text-primary)] font-medium">{action.title}</p>
                      {action.financialImpact && (
                        <span className="text-[10px] font-mono text-[#39C77A]">{action.financialImpact}</span>
                      )}
                    </div>
                    <div 
                      className="flex items-center justify-end gap-2 pt-1 border-t"
                      style={{ borderColor: 'var(--orion-morph-border)' }}
                    >
                      {action.onReview && (
                        <button 
                          onClick={action.onReview} 
                          className="px-2 py-0.5 text-[11px] text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)] transition-colors"
                        >
                          Review
                        </button>
                      )}
                      {action.onApprove && (
                        <button onClick={action.onApprove} className="px-2.5 py-0.5 text-[11px] bg-[#39C77A] text-[#0B0C0C] font-semibold rounded">
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {onOpenApprovals && (
          <button
            type="button"
            onClick={onOpenApprovals}
            className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer border"
            style={{
              backgroundColor: 'var(--orion-morph-surface-subtle)',
              borderColor: 'var(--orion-morph-border)',
              color: 'var(--orion-text-secondary)',
            }}
          >
            <span>Governance Approval Center</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
