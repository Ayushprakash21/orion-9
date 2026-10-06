import { useSupplyChain } from './SupplyChainContext';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { toastNotificationVariants } from '../os/motion/OrionMotionVariants';
import { isReducedMotionPreferred } from '../os/motion/OrionMotion';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  addToast: (options: ToastOptions | string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supplyChain = useSupplyChain();
  const isReduced = isReducedMotionPreferred(supplyChain?.settings?.reducedMotion);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const addToast = useCallback(
    (options: ToastOptions | string, type: ToastType = 'success', title?: string) => {
      if (typeof options === 'string') {
        showToast(options, type, title);
      } else {
        showToast(options.message, options.type || 'info', options.title);
      }
    },
    [showToast]
  );

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              variants={toastNotificationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: isReduced ? 0.1 : 0.25 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-os-surface border border-os-border text-xs text-os-text-primary shadow-xl"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {toast.type === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
                {toast.type === 'error' && <XCircle size={16} className="text-red-500" />}
                {toast.type === 'info' && <Info size={16} className="text-os-text-secondary" />}
              </div>
              <div className="flex-1 space-y-0.5">
                {toast.title && <div className="font-medium text-os-text-primary">{toast.title}</div>}
                <div className="text-os-text-secondary font-mono leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-os-text-muted hover:text-os-text-primary transition-colors p-1 -mr-1 -mt-1 cursor-pointer"
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
    return {
      showToast: () => {},
      addToast: () => {},
    };
  }
  return context;
};
