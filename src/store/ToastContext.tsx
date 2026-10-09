/**
 * Orion Notification (Toast) Context
 * macOS-inspired Liquid Glass system notification engine.
 */

import { useSupplyChain } from './SupplyChainContext';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { toastNotificationVariants } from '../os/motion/OrionMotionVariants';
import { isReducedMotionPreferred } from '../os/motion/OrionMotion';

export type ToastType = 'success' | 'warning' | 'error' | 'info' | 'system';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  /** Optional URL for the app icon. */
  iconUrl?: string;
  appName?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Creation timestamp (ms). */
  createdAt: number;
  /** Deduplication key. */
  dedupKey?: string;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  title?: string;
  /** URL of the application icon to display. */
  iconUrl?: string;
  appName?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextType {
  /** Show a toast – accepts options object or plain message string. */
  showToast: (
    options: ToastOptions | string,
    type?: ToastType,
    title?: string,
    iconUrl?: string,
    appName?: string
  ) => void;
  addToast: (
    options: ToastOptions | string,
    type?: ToastType,
    title?: string,
    iconUrl?: string,
    appName?: string
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/** Auto‑dismiss durations per toast type (ms). 0 = persistent. */
const DURATION_MAP: Record<ToastType, number> = {
  info: 5000,
  success: 4000,
  warning: 6000,
  error: 8000,
  system: 0,
};

/** Produce a stable deduplication key from type, title and message. */
const makeDedupKey = (type: ToastType, title: string | undefined, message: string) =>
  `${type}|${title ?? ''}|${message}`;

function formatRelativeTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supplyChain = useSupplyChain();
  const isReduced = isReducedMotionPreferred(supplyChain?.settings?.reducedMotion);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /** Core method that adds a toast whilst handling deduplication and timing. */
  const showToast = useCallback(
    (options: ToastOptions | string, type: ToastType = 'info', title?: string, iconUrl?: string, appName?: string) => {
      const now = Date.now();
      const opts: ToastOptions = typeof options === 'string' ? { message: options } : options;
      const toastType = opts.type ?? type;
      const toastTitle = opts.title ?? title;
      const toastIcon = opts.iconUrl ?? iconUrl;
      const toastAppName = opts.appName ?? appName ?? (title && typeof options === 'string' ? title : 'ORION SYSTEM');
      const dedupKey = makeDedupKey(toastType, toastTitle, opts.message);

      // If a very recent toast with the same key exists, just refresh its timer.
      const existing = toasts.find(t => t.dedupKey === dedupKey && now - t.createdAt < 2000);
      if (existing) {
        setToasts(prev =>
          prev.map(t => (t.id === existing.id ? { ...t, createdAt: now } : t))
        );
        return;
      }

      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        type: toastType,
        message: opts.message,
        title: toastTitle,
        iconUrl: toastIcon,
        appName: toastAppName,
        actionLabel: opts.actionLabel,
        onAction: opts.onAction,
        createdAt: now,
        dedupKey,
      };
      setToasts(prev => [...prev, newToast]);
    },
    [toasts]
  );

  const addToast = useCallback(
    (options: ToastOptions | string, type: ToastType = 'info', title?: string, iconUrl?: string, appName?: string) => {
      if (typeof options === 'string') {
        showToast(options, type, title, iconUrl, appName);
      } else {
        showToast(options, options.type ?? type, options.title ?? title, options.iconUrl ?? iconUrl, options.appName ?? appName);
      }
    },
    [showToast]
  );

  // Interval to auto‑dismiss expired toasts.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setToasts(prev =>
        prev.filter(t => {
          const duration = DURATION_MAP[t.type];
          if (duration === 0) return true; // persistent
          return now - t.createdAt < duration;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Window event listener for global system toasts
  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        showToast(detail, detail.type, detail.title, detail.iconUrl, detail.appName);
      }
    };
    window.addEventListener('orion:show-toast', handleCustomToast);
    return () => window.removeEventListener('orion:show-toast', handleCustomToast);
  }, [showToast]);

  // Show only the newest three toasts.
  const visibleToasts = toasts.slice(-3);

  return (
    <ToastContext.Provider value={{ showToast, addToast }}>
      {children}
      <div
        data-testid="toast-container"
        style={{
          top: 'calc(var(--orion-os-safe-top, 48px) + 12px)',
          right: '16px',
        }}
        className="fixed z-[10005] flex flex-col items-end pointer-events-none w-[calc(100vw-24px)] max-w-[380px] gap-2.5 transition-all duration-200"
      >
        <AnimatePresence>
          {visibleToasts.map(toast => (
            <motion.div
              key={toast.id}
              data-testid="system-notification-card"
              variants={toastNotificationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: isReduced ? 0.1 : 0.25 }}
              className="pointer-events-auto flex flex-col w-full max-w-[380px] min-w-0 p-3.5 rounded-[18px] bg-[rgba(26,30,40,0.85)] hover:bg-[rgba(30,35,48,0.90)] border border-white/[0.18] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.30)] backdrop-blur-[24px] saturate-[180%] text-xs text-white transition-all select-none"
              onMouseEnter={() => {
                // Refresh timestamp while hovered so it does not expire.
                setToasts(prev =>
                  prev.map(t => (t.id === toast.id ? { ...t, createdAt: Date.now() } : t))
                );
              }}
            >
              {/* HEADER: App Identity + Relative Timestamp + Dismiss Button */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-[6px] bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
                    {toast.iconUrl ? (
                      <img src={toast.iconUrl} alt="" className="w-3.5 h-3.5 rounded-[4px] object-contain" />
                    ) : toast.type === 'success' ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : toast.type === 'warning' ? (
                      <AlertTriangle size={13} className="text-amber-400" />
                    ) : toast.type === 'error' ? (
                      <XCircle size={13} className="text-rose-400" />
                    ) : (
                      <Info size={13} className="text-[var(--orion-accent,#38BDF8)]" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-white/90 tracking-wide uppercase truncate">
                    {toast.appName || toast.title || 'ORION SYSTEM'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-white/50 font-mono">
                    {formatRelativeTime(toast.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* BODY: Title & Message */}
              <div className="pl-7 pr-1 space-y-1">
                {toast.title && toast.title !== toast.appName && (
                  <div className="font-semibold text-[13px] text-white leading-snug">
                    {toast.title}
                  </div>
                )}
                <div className="text-[12px] text-white/80 leading-relaxed font-normal break-words">
                  {toast.message}
                </div>

                {/* ACTIONS */}
                {toast.actionLabel && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (toast.onAction) toast.onAction();
                        removeToast(toast.id);
                      }}
                      className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-medium transition-all shadow-xs border border-white/15 cursor-pointer"
                    >
                      {toast.actionLabel}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {}, addToast: () => {} };
  }
  return context;
};
