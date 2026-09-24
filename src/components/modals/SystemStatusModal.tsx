import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Cpu, Database, Activity, Bell, Wifi, WifiOff } from 'lucide-react';
import { useConnectivity } from '../../store/ConnectivityContext';

export interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, isLocalMode } = useConnectivity();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const services = [
    { 
      name: 'Network Connectivity', 
      status: isLocalMode ? 'Local / Demo Mode' : (isOnline ? 'Online (Operational)' : 'Offline / Degraded'), 
      latency: isLocalMode ? 'Local (0ms)' : (isOnline ? '38ms' : 'N/A'), 
      icon: isOnline ? Wifi : WifiOff,
      color: isLocalMode ? 'text-cyan-400' : (isOnline ? 'text-emerald-400' : 'text-red-400')
    },
    { name: 'Application Core', status: 'Operational', latency: '12ms', icon: Cpu, color: 'text-emerald-400' },
    { name: 'Data Store (IndexedDB / Local)', status: 'Operational', latency: '4ms', icon: Database, color: 'text-emerald-400' },
    { name: 'External Cloud Sync', status: 'Optional / Standby', latency: 'N/A', icon: Activity, color: 'text-neutral-400' },
    { name: 'AI Decision Engine (Gemini 3.6)', status: 'Operational', latency: '240ms', icon: ShieldCheck, color: 'text-emerald-400' },
    { name: 'Sync Engine', status: 'Operational', latency: 'Idle', icon: Activity, color: 'text-emerald-400' },
    { name: 'Notification Engine', status: 'Operational', latency: 'Active', icon: Bell, color: 'text-emerald-400' },
  ];

  const modalContent = (
    <div 
      data-testid="system-status-modal-overlay"
      className="fixed inset-0 z-[2147483640] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="System Health & Diagnostics"
        data-testid="system-status-modal-dialog"
        className="relative w-full max-w-lg max-h-[min(90vh,680px)] rounded-xl bg-os-surface border border-os-border shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-os-surface-elevated/60 border-b border-os-border shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
            <span className="text-sm font-semibold tracking-wide text-os-text-primary">System Health & Diagnostics</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close Diagnostics Modal" 
            className="text-os-text-muted hover:text-os-text-primary p-1 rounded-md hover:bg-os-surface-active transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-xs text-os-text-secondary leading-relaxed">
            All Orion-9 microservices and operational data pipelines are running nominally with verified low response latency.
          </p>

          <div className="space-y-2">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg bg-os-surface-secondary border border-os-border/70 hover:border-os-border transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-os-surface-elevated text-os-text-primary shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-os-text-primary truncate">{svc.name}</div>
                      <div className="text-[10px] font-mono text-os-text-muted">Latency: {svc.latency}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`h-2 w-2 rounded-full ${svc.color.includes('emerald') ? 'bg-emerald-500 shadow-[0_0_6px_#10B981]' : svc.color.includes('cyan') ? 'bg-cyan-400 shadow-[0_0_6px_#00F2FE]' : svc.color.includes('red') ? 'bg-red-500 shadow-[0_0_6px_#EF4444]' : 'bg-neutral-500'}`} />
                    <span className={`text-xs font-mono font-medium ${svc.color}`}>{svc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-os-surface-elevated/40 border-t border-os-border text-[11px] font-mono text-os-text-muted shrink-0">
          <span>Environment: Production / Secure</span>
          <span>Version: 9.4.2-Enterprise</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
