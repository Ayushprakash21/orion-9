import React from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useToast } from '../../store/ToastContext';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Truck, 
  Package, 
  Target, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

export const OrionMobileDetailSheet: React.FC = () => {
  const { selectedEntity, isDetailSheetOpen, closeEntityDetail, openApp } = useMobileNavigation();
  const { currency } = useSupplyChain();
  const { showToast } = useToast();

  if (!isDetailSheetOpen || !selectedEntity) {
    return null;
  }

  const raw = selectedEntity.data || {};

  const handleAction = (actionName: string) => {
    showToast(`Action executed: ${actionName} on ${selectedEntity.id}`, 'success', 'Control Tower');
    closeEntityDetail();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in transition-opacity"
        onClick={closeEntityDetail}
      />

      {/* Bottom Sheet Drawer */}
      <div 
        className="relative z-10 w-full max-h-[85vh] bg-os-surface border-t border-os-border rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom,16px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1 bg-os-border-strong rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Sheet Header */}
        <div className="px-4 py-3 border-b border-os-border flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                selectedEntity.severity === 'critical'
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : selectedEntity.severity === 'high'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {selectedEntity.severity || 'INFO'}
              </span>
              <span className="text-xs font-mono text-os-text-muted">{selectedEntity.id}</span>
            </div>
            <h3 className="text-sm font-bold text-os-text-primary mt-1 line-clamp-1">
              {selectedEntity.title}
            </h3>
          </div>

          <button
            onClick={closeEntityDetail}
            className="p-2 rounded-full bg-os-surface-secondary text-os-text-muted hover:text-os-text-primary active:bg-os-surface-hover transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Close detail sheet"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sheet Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
          {/* Capital Impact Card */}
          {selectedEntity.impact ? (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase text-red-400 font-bold">Estimated Financial Exposure</div>
                <div className="text-lg font-bold text-red-500 mt-0.5">
                  {formatCurrency(selectedEntity.impact, currency)}
                </div>
              </div>
              <ShieldAlert size={24} className="text-red-400 shrink-0" />
            </div>
          ) : null}

          {/* Key Attributes Key-Value Grid */}
          <div className="bg-os-surface-secondary border border-os-border rounded-xl p-3 space-y-2.5">
            <div className="text-[10px] uppercase tracking-wider text-os-text-muted font-bold pb-1 border-b border-os-border">
              Telemetry Parameters
            </div>

            {selectedEntity.subtitle && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Entity Context:</span>
                <span className="text-os-text-primary font-medium text-right truncate max-w-[200px]">{selectedEntity.subtitle}</span>
              </div>
            )}

            {raw.status && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Status:</span>
                <span className="text-emerald-400 font-bold uppercase">{raw.status}</span>
              </div>
            )}

            {raw.carrier && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Carrier:</span>
                <span className="text-os-text-primary">{raw.carrier}</span>
              </div>
            )}

            {raw.origin && raw.destination && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Transit Route:</span>
                <span className="text-os-text-primary">{raw.origin} → {raw.destination}</span>
              </div>
            )}

            {raw.delayDays !== undefined && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Delay Days:</span>
                <span className="text-amber-400 font-bold">+{raw.delayDays} days</span>
              </div>
            )}

            {raw.onHand !== undefined && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Current On-Hand:</span>
                <span className="text-os-text-primary">{formatNumber(raw.onHand)} units</span>
              </div>
            )}

            {raw.safetyStock !== undefined && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Safety Stock Threshold:</span>
                <span className="text-os-text-primary">{formatNumber(raw.safetyStock)} units</span>
              </div>
            )}

            {raw.warehouseId && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-os-text-muted">Warehouse Node:</span>
                <span className="text-os-text-primary">{raw.warehouseId}</span>
              </div>
            )}
          </div>

          {/* Description / Mitigation */}
          {raw.description && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-os-text-muted font-bold">
                Operational Observation
              </div>
              <div className="p-3 bg-os-surface-secondary border border-os-border rounded-xl text-os-text-secondary leading-relaxed font-sans text-xs">
                {raw.description}
              </div>
            </div>
          )}

          {raw.recommendation && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-os-accent font-bold">
                Governed AI Recommendation
              </div>
              <div className="p-3 bg-os-accent/10 border border-os-accent/30 rounded-xl text-os-text-primary leading-relaxed font-sans text-xs">
                {raw.recommendation}
              </div>
            </div>
          )}
        </div>

        {/* Sheet Actions Footer */}
        <div className="p-4 border-t border-os-border bg-os-surface shrink-0 space-y-2">
          <button
            onClick={() => handleAction('Contain Risk & Acknowledge')}
            className="w-full py-3 bg-os-accent text-black font-mono font-bold rounded-xl text-xs active:scale-[0.98] transition-transform min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <CheckCircle2 size={16} />
            <span>Acknowledge & Contain Risk</span>
          </button>

          <button
            onClick={() => {
              closeEntityDetail();
              if (selectedEntity.type === 'shipment') openApp('shipments');
              else if (selectedEntity.type === 'inventory') openApp('inventory');
              else if (selectedEntity.type === 'po') openApp('procurement');
              else openApp('exceptions');
            }}
            className="w-full py-2.5 bg-os-surface-secondary border border-os-border text-os-text-primary hover:bg-os-surface-hover font-mono font-medium rounded-xl text-xs active:scale-[0.98] transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open Dedicated Application View</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
