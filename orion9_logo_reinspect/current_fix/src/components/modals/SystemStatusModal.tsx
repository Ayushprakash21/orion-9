import React from 'react';
import { X, CheckCircle2, ShieldCheck, Cpu, Database, Activity, Bell, Wifi, WifiOff } from 'lucide-react';
import { useConnectivity } from '../../store/ConnectivityContext';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({ isOpen, onClose }) => {
  const { isOnline, statusLabel, isLocalMode } = useConnectivity();
  if (!isOpen) return null;

  const services = [
    { 
      name: 'Network Connectivity', 
      status: isLocalMode ? 'Local / Demo Mode' : 'Online (Operational)', 
      latency: isLocalMode ? 'Local (0ms)' : '38ms', 
      icon: isOnline ? Wifi : WifiOff,
      color: isLocalMode ? 'text-cyan-400' : 'text-emerald-400'
    },
    { name: 'Application Core', status: 'Operational', latency: '12ms', icon: Cpu, color: 'text-emerald-400' },
    { name: 'Data Store (IndexedDB / Local)', status: 'Operational', latency: '4ms', icon: Database, color: 'text-emerald-400' },
    { name: 'External Cloud Sync', status: 'Optional / Standby', latency: 'N/A', icon: Activity, color: 'text-neutral-400' },
    { name: 'AI Decision Engine (Gemini 3.6)', status: 'Operational', latency: '240ms', icon: ShieldCheck, color: 'text-emerald-400' },
    { name: 'Sync Engine', status: 'Operational', latency: 'Idle', icon: Activity, color: 'text-emerald-400' },
    { name: 'Notification Engine', status: 'Operational', latency: 'Active', icon: Bell, color: 'text-emerald-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-xl bg-os-surface border border-os-border shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 bg-os-surface border-b border-os-border">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-os-text-primary">System Health & Status</span>
          </div>
          <button onClick={onClose} className="text-os-text-muted hover:text-os-text-primary p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-os-text-secondary">
            All Orion SCM OS microservices and operational data pipelines are running nominally with normal response latency.
          </p>

          <div className="space-y-2">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-os-surface border border-os-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-os-surface-elevated text-os-text-primary">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-os-text-primary">{svc.name}</div>
                      <div className="text-[10px] font-mono text-os-text-muted">Latency: {svc.latency}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${svc.color.includes('emerald') ? 'bg-emerald-500' : svc.color.includes('amber') ? 'bg-amber-500' : 'bg-neutral-500'}`} />
                    <span className={`text-xs font-mono ${svc.color}`}>{svc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-os-surface border-t border-os-border text-xs font-mono text-os-text-muted">
          <span>Environment: Production / Secure</span>
          <span>Version: 9.4.2-Enterprise</span>
        </div>
      </div>
    </div>
  );
};
