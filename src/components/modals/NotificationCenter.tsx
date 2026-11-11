import React, { useEffect } from 'react';
import { useNotifications, AppNotification } from '../../store/NotificationContext';
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, openNotification } = useNotifications();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 1. Backdrop for mobile (z-35: below bottom nav z-50 so bottom nav is never blocked) */}
      <div 
        className="fixed inset-0 z-35 bg-black/40 backdrop-blur-xs sm:hidden animate-in fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Notification Center Surface */}
      <div 
        className="w-full h-full max-h-[calc(100dvh-140px)] sm:max-h-[480px] rounded-2xl bg-[var(--orion-morph-surface-elevated)] text-[var(--orion-text-primary)] backdrop-blur-[24px] saturate-[180%] border border-[var(--orion-border-strong)] shadow-[var(--orion-morph-elevation-modal)] overflow-hidden flex flex-col z-40 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--orion-surface)]/80 border-b border-[var(--orion-border)] shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-[var(--orion-accent)]" />
            <span className="text-xs font-semibold text-[var(--orion-text-primary)] tracking-wide uppercase">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-[var(--orion-success)] text-[10px] font-semibold border border-emerald-500/35">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-[10px] text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)] transition-colors flex items-center gap-1 font-medium px-2.5 py-1 rounded-lg bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] border border-[var(--orion-border)] cursor-pointer"
              >
                <CheckCheck size={12} /> <span>Mark all read</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className="text-[var(--orion-text-muted)] hover:text-[var(--orion-text-primary)] p-1 rounded-lg hover:bg-[var(--orion-surface-hover)] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close Notifications"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-xs text-[var(--orion-text-muted)] font-mono">
              No active notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  openNotification(n);
                  onClose();
                }}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer relative group",
                  !n.read 
                    ? "bg-[var(--orion-surface-elevated)] hover:bg-[var(--orion-surface-hover)] border-[var(--orion-border-strong)] shadow-sm" 
                    : "bg-[var(--orion-surface)]/75 hover:bg-[var(--orion-surface-hover)] border-[var(--orion-border)]"
                )}
              >
                {!n.read && (
                  <span className="absolute left-2.5 top-3.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                )}
                <div className="flex items-start gap-3 pl-2.5">
                  <div className="shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] flex items-center justify-center shadow-xs">
                    {n.type === 'critical' && <AlertCircle size={14} className="text-[var(--orion-danger)]" />}
                    {n.type === 'warning' && <AlertTriangle size={14} className="text-[var(--orion-warning)]" />}
                    {n.type === 'success' && <Check size={14} className="text-[var(--orion-success)]" />}
                    {n.type === 'info' && <Info size={14} className="text-[var(--orion-info)]" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--orion-text-primary)] break-words leading-tight">{n.title}</span>
                      <span className="text-[10px] font-mono text-[var(--orion-text-muted)] shrink-0 mt-0.5">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[var(--orion-text-secondary)] leading-relaxed break-words font-normal">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[var(--orion-surface)]/80 border-t border-[var(--orion-border)] text-center shrink-0">
          <span className="text-[10px] font-mono text-[var(--orion-text-muted)]">
            Orion-9 Liquid Glass Event Engine
          </span>
        </div>
      </div>
    </>
  );
};

