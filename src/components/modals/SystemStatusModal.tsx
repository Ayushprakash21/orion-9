import React from 'react';
import { X, CheckCircle2, ShieldCheck, Cpu, Database, Activity, Bell } from 'lucide-react';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const services = [
    { name: 'Application Core', status: 'Operational', latency: '12ms', icon: Cpu },
    { name: 'Data Store (IndexedDB / Local)', status: 'Operational', latency: '4ms', icon: Database },
    { name: 'AI Decision Engine (Gemini 3.6)', status: 'Operational', latency: '240ms', icon: ShieldCheck },
    { name: 'Data Sources & Connectors', status: 'Operational', latency: '18ms', icon: Activity },
    { name: 'Sync Engine', status: 'Operational', latency: 'Idle', icon: Activity },
    { name: 'Notification Engine', status: 'Operational', latency: 'Active', icon: Bell },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-xl bg-[#151515] border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 bg-[#111111] border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-[#F5F5F5]">System Health & Status</span>
          </div>
          <button onClick={onClose} className="text-[#777777] hover:text-[#F5F5F5] p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[#B3B3B3]">
            All Orion SCM OS microservices and operational data pipelines are running nominally with normal response latency.
          </p>

          <div className="space-y-2">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#111111] border border-[#2A2A2A]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#1C1C1C] text-[#F5F5F5]">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#F5F5F5]">{svc.name}</div>
                      <div className="text-[10px] font-mono text-[#777777]">Latency: {svc.latency}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-emerald-400">{svc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-[#111111] border-t border-[#2A2A2A] text-xs font-mono text-[#777777]">
          <span>Environment: Production / Secure</span>
          <span>Version: 9.4.2-Enterprise</span>
        </div>
      </div>
    </div>
  );
};
