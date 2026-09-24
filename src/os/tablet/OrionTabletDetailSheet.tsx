/**
 * ORION-9 TABLET DETAIL MODAL SHEET
 * High-fidelity slide-up drawer / centered modal for entity inspection on tablet.
 */

import React from 'react';
import { useTabletNavigation } from './OrionTabletNavigation';
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

export const OrionTabletDetailSheet: React.FC = () => {
  const { selectedEntity, closeEntityDetail, openApp } = useTabletNavigation();
  const { currency } = useSupplyChain();
  const { showToast } = useToast();

  if (!selectedEntity) {
    return null;
  }

  const raw = selectedEntity.data || {};

  const handleAction = (actionName: string) => {
    showToast(`Action executed: ${actionName} on ${selectedEntity.id}`, 'success', 'Control Tower');
    closeEntityDetail();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-in fade-in transition-opacity"
        onClick={closeEntityDetail}
      />

      {/* Centered / Scaled Modal Box */}
      <div 
        className="relative z-10 w-full max-w-lg max-h-[85vh] bg-os-surface border border-os-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-os-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert size={16} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-os-text-muted">
                {selectedEntity.type} Inspection
              </div>
              <div className="text-sm font-bold text-os-text-primary">
                {selectedEntity.id}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeEntityDetail}
            className="w-8 h-8 rounded-xl bg-os-surface-secondary border border-os-border flex items-center justify-center text-os-text-muted hover:text-os-text-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {raw.description && (
            <div className="bg-os-surface-secondary/60 border border-os-border rounded-xl p-3 text-os-text-secondary leading-relaxed">
              {raw.description}
            </div>
          )}

          {raw.estimatedImpact && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <span className="font-mono text-red-400">Estimated Revenue Exposure</span>
              <span className="font-mono font-bold text-red-400 text-sm">
                {formatCurrency(raw.estimatedImpact, currency)}
              </span>
            </div>
          )}

          {raw.recommendedAction && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
              <span className="font-mono font-bold text-cyan-400 text-[10px] uppercase block">
                Recommended Action
              </span>
              <p className="text-cyan-300">{raw.recommendedAction}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-os-border bg-os-surface-secondary/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeEntityDetail}
            className="px-4 py-2 rounded-xl bg-os-surface-secondary border border-os-border text-os-text-secondary text-xs font-mono font-bold hover:bg-os-surface-hover"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => handleAction('Automated Containment')}
            className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-mono font-bold shadow-xs hover:bg-cyan-300"
          >
            Execute Action
          </button>
        </div>
      </div>
    </div>
  );
};
