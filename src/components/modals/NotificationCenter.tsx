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
        className="w-full h-full max-h-[calc(100dvh-140px)] sm:max-h-[480px] rounded-2xl bg-[rgba(20,24,32,0.88)] backdrop-blur-[24px] saturate-[180%] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] overflow-hidden flex flex-col z-40 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-[var(--orion-accent,#38BDF8)]" />
            <span className="text-xs font-semibold text-white tracking-wide uppercase">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-[10px] text-white/70 hover:text-white transition-colors flex items-center gap-1 font-medium px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer"
              >
                <CheckCheck size={12} /> <span>Mark all read</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close Notifications"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-xs text-white/50 font-mono">
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
                    ? "bg-white/[0.07] hover:bg-white/[0.12] border-white/20 shadow-md" 
                    : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
                )}
              >
                {!n.read && (
                  <span className="absolute left-2.5 top-3.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                )}
                <div className="flex items-start gap-3 pl-2.5">
                  <div className="shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shadow-xs">
                    {n.type === 'critical' && <AlertCircle size={14} className="text-red-400" />}
                    {n.type === 'warning' && <AlertTriangle size={14} className="text-amber-400" />}
                    {n.type === 'success' && <Check size={14} className="text-emerald-400" />}
                    {n.type === 'info' && <Info size={14} className="text-[var(--orion-accent,#38BDF8)]" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-white break-words leading-tight">{n.title}</span>
                      <span className="text-[10px] font-mono text-white/50 shrink-0 mt-0.5">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed break-words font-normal">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-white/[0.02] border-t border-white/10 text-center shrink-0">
          <span className="text-[10px] font-mono text-white/40">
            Orion-9 Liquid Glass Event Engine
          </span>
        </div>
      </div>
    </>
  );
};

