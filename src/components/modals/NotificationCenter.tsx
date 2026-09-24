import React, { useEffect } from 'react';
import { useNotifications, AppNotification } from '../../store/NotificationContext';
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';

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
        className="w-full h-full max-h-[calc(100dvh-140px)] sm:max-h-[460px] rounded-xl bg-os-surface border border-os-border shadow-2xl overflow-hidden flex flex-col z-40 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 bg-os-surface-secondary border-b border-os-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-os-accent" />
            <span className="text-xs font-mono font-bold text-os-text-primary tracking-wide">NOTIFICATIONS</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-[10px] text-os-text-secondary hover:text-os-text-primary transition-colors flex items-center gap-1 font-mono px-2 py-1 rounded bg-os-surface hover:bg-os-surface-hover min-h-[36px]"
              >
                <CheckCheck size={12} /> <span>Read all</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className="text-os-text-muted hover:text-os-text-primary p-1.5 rounded-lg hover:bg-os-surface min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              aria-label="Close Notifications"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-os-border/50 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-os-text-muted font-mono">
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
                className={`p-3.5 hover:bg-os-surface-hover cursor-pointer transition-colors relative active:bg-os-surface-active ${!n.read ? 'bg-os-accent/[0.03]' : ''}`}
              >
                {!n.read && (
                  <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                )}
                <div className="flex items-start gap-2.5 pl-1.5">
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'critical' && <AlertCircle size={15} className="text-red-400" />}
                    {n.type === 'warning' && <AlertTriangle size={15} className="text-amber-400" />}
                    {n.type === 'success' && <Check size={15} className="text-emerald-400" />}
                    {n.type === 'info' && <Info size={15} className="text-cyan-400" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-os-text-primary break-words leading-tight">{n.title}</span>
                      <span className="text-[10px] font-mono text-os-text-muted shrink-0 mt-0.5">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-os-text-secondary leading-relaxed break-words font-sans">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-os-surface-secondary border-t border-os-border text-center shrink-0">
          <span className="text-[10px] font-mono text-os-text-muted">
            Orion-9 Event & Notification Engine
          </span>
        </div>
      </div>
    </>
  );
};

