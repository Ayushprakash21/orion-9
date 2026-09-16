import React, { useEffect, useState } from 'react';
import { Power, AlertTriangle, Cpu, Globe } from 'lucide-react';
import { useBranding } from '../../store/BrandingContext';

interface OrionShutdownConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OrionShutdownConfirmModal: React.FC<OrionShutdownConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  const { branding } = useBranding();
  const [mounted, setMounted] = useState(false);
  const appName = branding.appName || branding.productName || branding.applicationName || branding.osName || 'ORION-9';

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  return (
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 bg-black/60 backdrop-blur-sm' : 'opacity-0 bg-transparent backdrop-blur-none pointer-events-none'}`}>
      <div 
        className={`w-full max-w-md bg-os-bg border-t-2 border-t-red-500 border-x border-b border-os-border rounded-lg shadow-2xl overflow-hidden transition-all duration-300 transform font-sans ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        {/* Header / Circuit details */}
        <div className="relative h-16 w-full border-b border-white/5 flex items-center px-6 overflow-hidden bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <svg width="100" height="40" viewBox="0 0 100 40">
              <path d="M100 0 L50 40 L0 40" stroke="#EF4444" strokeWidth="1" fill="none" />
              <path d="M100 10 L60 40" stroke="#EF4444" strokeWidth="1" fill="none" />
              <circle cx="50" cy="40" r="2" fill="#EF4444" />
              <circle cx="60" cy="40" r="2" fill="#EF4444" />
            </svg>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-500/80 leading-none">ORION SYSTEM</span>
              <span className="text-[13px] font-mono tracking-wider text-os-text-primary mt-1 uppercase leading-none">SYSTEM TERMINATION REQUEST</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <h2 className="text-lg font-mono font-bold text-os-text-primary mb-3 tracking-wide">
            Shut Down {appName}
          </h2>
          <p className="text-sm text-os-text-muted mb-6 leading-relaxed">
            This will terminate the active ORION session and stop the current operational environment.
          </p>

          <div className="space-y-2 mb-8">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <Cpu className="w-4 h-4 text-slate-600" />
              <span>All unsaved world model parameters will be discarded.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <Globe className="w-4 h-4 text-slate-600" />
              <span>External telemetry listeners will be gracefully severed.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-xs font-mono font-medium text-os-text-secondary hover:text-os-text-primary bg-os-surface-hover hover:bg-os-surface-active rounded border border-os-border transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={onConfirm}
              className="flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold text-os-text-primary bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 hover:border-red-500 rounded transition-colors group shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              <Power className="w-3.5 h-3.5 group-hover:animate-pulse" />
              <span>SHUT DOWN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
