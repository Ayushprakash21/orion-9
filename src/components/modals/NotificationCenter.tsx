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
        className="fixed inset-0 z-40 bg-black/50 sm:hidden animate-in fade-in" 
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:top-12 z-50 w-full sm:w-96 max-h-[90vh] sm:max-h-none rounded-t-xl sm:rounded-xl bg-[#121212] border-t sm:border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-top-2 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-[#181818] border-b border-[#2A2A2A] shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-[#F5F5F5]" />
            <span className="text-xs font-medium text-[#F5F5F5]">Notifications</span>
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
                className="text-[10px] text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors flex items-center gap-1 font-mono"
              >
                <CheckCheck size={12} /> <span className="hidden sm:inline">Mark all read</span><span className="sm:hidden">Read all</span>
              </button>
            )}
            <button onClick={onClose} className="text-[#777777] hover:text-[#F5F5F5] p-1 ml-1">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto sm:max-h-[400px] divide-y divide-[#2A2A2A]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#777777] font-mono">
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
                className={`p-4 hover:bg-[#1A1A1A] cursor-pointer transition-colors relative ${!n.read ? 'bg-[#161616]' : ''}`}
              >
                {!n.read && (
                  <span className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                <div className="flex items-start gap-3 pl-2">
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'critical' && <AlertCircle size={14} className="text-red-500" />}
                    {n.type === 'warning' && <AlertTriangle size={14} className="text-amber-500" />}
                    {n.type === 'success' && <Check size={14} className="text-emerald-500" />}
                    {n.type === 'info' && <Info size={14} className="text-[#A0A0A0]" />}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-[#F5F5F5] break-words">{n.title}</span>
                      <span className="text-[10px] font-mono text-[#777777] shrink-0 mt-0.5">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#B3B3B3] leading-relaxed break-words">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 bg-[#111111] border-t border-[#2A2A2A] text-center shrink-0">
          <span className="text-[10px] font-mono text-[#777777]">
            ORION-9 Event & Notification Engine
          </span>
        </div>
      </div>
    </>
  );
};
