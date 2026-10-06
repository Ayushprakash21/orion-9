/**
 * Orion Notification (Toast) Context
 * Updated to provide Windows‑11‑style OS notifications.
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
}

interface ToastContextType {
  /** Show a toast – accepts options object or plain message string. */
  showToast: (
    options: ToastOptions | string,
    type?: ToastType,
    title?: string,
    iconUrl?: string
  ) => void;
  addToast: (
    options: ToastOptions | string,
    type?: ToastType,
    title?: string,
    iconUrl?: string
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

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supplyChain = useSupplyChain();
  const isReduced = isReducedMotionPreferred(supplyChain?.settings?.reducedMotion);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /** Core method that adds a toast whilst handling deduplication and timing. */
  const showToast = useCallback(
    (options: ToastOptions | string, type: ToastType = 'info', title?: string, iconUrl?: string) => {
      const now = Date.now();
      const opts: ToastOptions = typeof options === 'string' ? { message: options } : options;
      const toastType = opts.type ?? type;
      const toastTitle = opts.title ?? title;
      const toastIcon = opts.iconUrl ?? iconUrl;
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
        createdAt: now,
        dedupKey,
      };
      setToasts(prev => [...prev, newToast]);
    },
    [toasts]
  );

  const addToast = useCallback(
    (options: ToastOptions | string, type: ToastType = 'info', title?: string, iconUrl?: string) => {
      if (typeof options === 'string') {
        showToast(options, type, title, iconUrl);
      } else {
        showToast(options, options.type ?? type, options.title ?? title, options.iconUrl ?? iconUrl);
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

  // Show only the newest three toasts (newest on top).
  const visibleToasts = toasts.slice(-3).reverse();

  return (
    <ToastContext.Provider value={{ showToast, addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end pointer-events-none max-w-[380px] w-full sm:max-w-[380px]">
        <AnimatePresence>
          {visibleToasts.map(toast => (
            <motion.div
              key={toast.id}
              variants={toastNotificationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: isReduced ? 0.1 : 0.25 }}
              className="pointer-events-auto flex w-full max-w-[380px] min-w-[340px] gap-3 p-4 rounded-[12px] bg-[rgba(24,27,32,0.94)] border border-[rgba(255,255,255,0.08)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-[18px] text-xs text-white"
              onMouseEnter={() => {
                // Refresh timestamp while hovered so it does not expire.
                setToasts(prev =>
                  prev.map(t => (t.id === toast.id ? { ...t, createdAt: Date.now() } : t))
                );
              }}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center">
                {toast.iconUrl ? (
                  <img src={toast.iconUrl} alt="" className="w-5 h-5 rounded" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : toast.type === 'warning' ? (
                  <AlertTriangle size={16} className="text-amber-500" />
                ) : toast.type === 'error' ? (
                  <XCircle size={16} className="text-red-500" />
                ) : (
                  <Info size={16} className="text-gray-400" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 space-y-0.5">
                {toast.title && <div className="font-medium text-white">{toast.title}</div>}
                <div className="text-gray-300 font-mono leading-relaxed">{toast.message}</div>
              </div>
              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 -mr-1 -mt-1 text-white/45 hover:text-white transition-opacity duration-200"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
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
