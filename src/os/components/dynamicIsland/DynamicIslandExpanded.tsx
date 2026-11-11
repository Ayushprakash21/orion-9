import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ExternalLink,
  Pin,
  PinOff,
  RefreshCw,
  X,
} from 'lucide-react';
import { ORION_SPRING_SNAPPY } from '../../motion/OrionMotion';
import { useOrionTheme } from '../../theme/useOrionTheme';
import {
  DynamicIslandActivity,
  DynamicIslandEventItem,
  DynamicIslandMetrics,
} from './DynamicIslandTypes';

interface DynamicIslandExpandedProps {
  activity: DynamicIslandActivity;
  activities: DynamicIslandEventItem[];
  metrics: DynamicIslandMetrics;
  isPinned: boolean;
  isReducedMotion: boolean;
  onTogglePin: () => void;
  onCollapse: () => void;
  onAction: (appId: string) => void;
  onDismissActivity: (id: string) => void;
}

export const DynamicIslandExpanded: React.FC<DynamicIslandExpandedProps> = React.memo(({
  activity,
  activities,
  metrics,
  isPinned,
  isReducedMotion,
  onTogglePin,
  onCollapse,
  onAction,
  onDismissActivity,
}) => {
  const { isDark } = useOrionTheme();

  return (
    <motion.div
      data-testid="dynamic-island-expanded-panel"
      initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
      animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
      transition={isReducedMotion ? { duration: 0.08 } : ORION_SPRING_SNAPPY}
      className={`mt-2 w-[min(392px,calc(100vw-20px))] rounded-2xl backdrop-blur-xl border p-3.5 flex flex-col gap-3 pointer-events-auto ${
        isDark
          ? 'bg-[rgba(14,17,24,0.95)] border-white/[0.15] shadow-[0_24px_60px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.18)] text-white'
          : 'bg-[rgba(252,253,254,0.97)] border-[rgba(15,23,42,0.16)] shadow-[0_20px_50px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] text-[var(--orion-text-primary)]'
      }`}
    >
      {/* 1. System Header Row */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--orion-border)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[10px] font-bold text-[var(--orion-text-primary)]">
            O9
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-wide text-[var(--orion-text-primary)] truncate">
              ORION-9 • {metrics.runtimeMode}
            </div>
            <div className="text-[10px] text-[var(--orion-text-muted)] truncate">
              {metrics.activeAppName ? `Active: ${metrics.activeAppName}` : 'Desktop Shell Nominal'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onTogglePin}
            aria-label={isPinned ? 'Unpin Dynamic Island' : 'Pin Dynamic Island'}
            title={isPinned ? 'Unpin Dynamic Island' : 'Pin Dynamic Island open'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isPinned
                ? 'bg-[var(--orion-accent)] border-[var(--orion-border-strong)] text-[var(--orion-on-accent)]'
                : 'bg-[var(--orion-surface-hover)] border-[var(--orion-border)] text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)]'
            }`}
          >
            {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse Dynamic Island"
            title="Collapse (Esc)"
            className="p-1.5 rounded-lg bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Active Event / Telemetry Feed */}
      <div className="space-y-1.5 max-h-[168px] overflow-y-auto custom-scrollbar">
        {activities.length > 0 ? (
          activities.map(item => (
            <div
              key={item.id}
              className={`rounded-xl border p-2.5 flex items-start gap-2.5 ${
                item.severity === 'critical'
                  ? 'bg-rose-500/12 border-rose-500/30'
                  : item.severity === 'active'
                    ? 'bg-sky-500/10 border-sky-500/25'
                    : 'bg-white/[0.04] border-white/[0.08]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.severity === 'critical' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-300" />
                ) : item.source === 'copilot' ? (
                  <Brain className="w-4 h-4 text-indigo-300" />
                ) : item.source === 'connector' ? (
                  <RefreshCw className="w-4 h-4 text-sky-300" />
                ) : (
                  <Activity className="w-4 h-4 text-purple-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-[var(--orion-text-primary)] truncate">{item.title}</div>
                {item.subtitle && (
                  <div className="text-[10px] text-[var(--orion-text-muted)] truncate mt-0.5">{item.subtitle}</div>
                )}
                {typeof item.progress === 'number' && (
                  <div className="mt-1.5 h-1 rounded-full bg-[var(--orion-surface-active)] overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.actionAppId && (
                  <button
                    type="button"
                    onClick={() => onAction(item.actionAppId!)}
                    className="px-2 py-1 rounded-lg bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] text-[10px] font-medium text-[var(--orion-text-primary)] cursor-pointer transition-colors"
                  >
                    {item.actionLabel || 'Open'}
                  </button>
                )}
                {item.source === 'user' && (
                  <button
                    type="button"
                    onClick={() => onDismissActivity(item.id)}
                    aria-label={`Dismiss ${item.title}`}
                    className="p-1 rounded-md text-[var(--orion-text-muted)] hover:text-[var(--orion-text-primary)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : activity === 'system-ready' ? (
          <div className="rounded-xl bg-[var(--orion-surface)] border border-[var(--orion-border)] p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-medium text-[var(--orion-text-primary)]">
                All supply chain flows nominal
              </span>
            </div>
            <span className="text-[10px] text-[var(--orion-text-muted)] font-mono">0 disruptions</span>
          </div>
        ) : null}
      </div>

      {/* 3. Concise Supply-Chain Health Summary */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-2.5 flex items-center justify-around text-center">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-wider font-semibold text-[var(--orion-text-muted)] mb-0.5">
            Exceptions
          </div>
          <div className={`text-[12px] font-bold font-mono ${metrics.criticalExceptionsCount > 0 ? 'text-[var(--orion-danger)]' : 'text-[var(--orion-text-primary)]'}`}>
            {metrics.activeExceptionsCount}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--orion-border)]" />

        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-wider font-semibold text-[var(--orion-text-muted)] mb-0.5">
            Stock Coverage
          </div>
          <div className={`text-[12px] font-bold ${metrics.stockoutRisksCount > 0 ? 'text-[var(--orion-warning)]' : 'text-[var(--orion-success)]'}`}>
            {metrics.stockoutRisksCount > 0 ? `${metrics.stockoutRisksCount} Low` : 'Optimal'}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-[var(--orion-border)]" />

        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-wider font-semibold text-[var(--orion-text-muted)] mb-0.5">
            Shipments
          </div>
          <div className={`text-[12px] font-bold ${metrics.delayedShipmentsCount > 0 ? 'text-[var(--orion-warning)]' : 'text-[var(--orion-text-primary)]'}`}>
            {metrics.delayedShipmentsCount > 0 ? `${metrics.delayedShipmentsCount} Delay` : 'On Track'}
          </div>
        </div>
      </div>

      {/* 4. Quick Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={() => onAction('ai-copilot')}
          className="flex-1 py-2 px-3 bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium text-[var(--orion-text-primary)] transition-colors cursor-pointer"
          type="button"
          aria-label="Open Orion Copilot"
        >
          <Brain className="w-3.5 h-3.5 text-indigo-500" />
          <span>Open Copilot</span>
        </button>

        <button
          onClick={() => onAction('command-center')}
          className="flex-1 py-2 px-3 bg-[var(--orion-accent)] hover:bg-[var(--orion-accent-hover)] border border-[var(--orion-border-strong)] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[var(--orion-on-accent)] transition-colors cursor-pointer"
          type="button"
          aria-label="Open Control Tower"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Control Tower</span>
        </button>
      </div>

      {/* 5. Footer Link */}
      <div className="border-t border-[var(--orion-border)] pt-2 flex items-center justify-center">
        <button
          onClick={() => onAction('command-center')}
          className="text-[10px] text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)] transition-colors flex items-center gap-1 cursor-pointer font-medium"
          type="button"
          aria-label="Open full Control Tower workspace"
        >
          <span>Open Full Control Tower</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
    </motion.div>
  );
});
