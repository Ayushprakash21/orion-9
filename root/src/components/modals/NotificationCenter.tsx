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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[1190] bg-black/50 sm:hidden animate-in fade-in" 
        onClick={onClose}
      />
      <div className="w-full h-full max-h-[calc(100vh-66px)] rounded-lg bg-os-surface overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-os-surface border-b border-os-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-os-text-primary" />
            <span className="text-xs font-medium text-os-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-[10px] text-os-text-secondary hover:text-os-text-primary transition-colors flex items-center gap-1 font-mono"
              >
                <CheckCheck size={12} /> <span className="hidden sm:inline">Mark all read</span><span className="sm:hidden">Read all</span>
              </button>
            )}
            <button onClick={onClose} className="text-os-text-muted hover:text-os-text-primary p-1 ml-1">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto sm:max-h-[400px] divide-y divide-[#2A2A2A]">
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
                className={`p-4 hover:bg-os-surface cursor-pointer transition-colors relative ${!n.read ? 'bg-os-surface' : ''}`}
              >
                {!n.read && (
                  <span className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                <div className="flex items-start gap-3 pl-2">
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'critical' && <AlertCircle size={14} className="text-red-500" />}
                    {n.type === 'warning' && <AlertTriangle size={14} className="text-amber-500" />}
                    {n.type === 'success' && <Check size={14} className="text-emerald-500" />}
                    {n.type === 'info' && <Info size={14} className="text-os-text-secondary" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-os-text-primary break-words">{n.title}</span>
                      <span className="text-[10px] font-mono text-os-text-muted shrink-0 mt-0.5">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-os-text-secondary leading-relaxed break-words">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 bg-os-surface border-t border-os-border text-center shrink-0">
          <span className="text-[10px] font-mono text-os-text-muted">
            ORION-9 Event & Notification Engine
          </span>
        </div>
      </div>
    </>
  );
};
