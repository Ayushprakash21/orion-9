import { useSupplyChain } from './SupplyChainContext';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

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
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const addToast = useCallback((options: ToastOptions | string, type: ToastType = 'success', title?: string) => {
    if (typeof options === 'string') {
      showToast(options, type, title);
    } else {
      showToast(options.message, options.type || 'info', options.title);
    }
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-os-surface border border-os-border text-xs text-os-text-primary shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
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
              className="text-os-text-muted hover:text-os-text-primary transition-colors p-1 -mr-1 -mt-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
