import React, { useEffect, useState } from 'react';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { X, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Send, BrainCircuit, FileText } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { InventoryDetailContent } from './InventoryDetailContent';
import { ProductDetailContent } from './ProductDetailContent';
import { SupplierDetailContent } from './SupplierDetailContent';
import { PoDetailContent } from './PoDetailContent';
import { ShipmentDetailContent } from './ShipmentDetailContent';
import { InboundDetailContent } from './InboundDetailContent';
import { ExceptionDetailContent } from './ExceptionDetailContent';
import { ActionDetailContent } from './ActionDetailContent';
import { ImportDetailModal } from './ImportDetailModal';
import { ConnectorDetailModal } from './ConnectorDetailModal';
import { DatasetDetailModal } from './DatasetDetailModal';
import { PredictionDetailContent } from './PredictionDetailContent';
import { SyncDetailContent } from './SyncDetailContent';

export const EntityDrawer: React.FC = () => {
  const { activeEntity, closeEntity } = useEntityDrawer();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Discard changes?')) {
        setHasUnsavedChanges(false);
        closeEntity();
        if (window.location.pathname.startsWith('/inventory/')) {
          navigate('/inventory');
        }
      }
    } else {
      closeEntity();
      if (window.location.pathname.startsWith('/inventory/')) {
        navigate('/inventory');
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeEntity) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeEntity, hasUnsavedChanges, closeEntity]);

  if (!activeEntity) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={handleClose} 
      />
      
      <div className="relative w-full md:max-w-2xl bg-[#0F0F0F] border-l border-[#2A2A2A] h-full flex flex-col shadow-2xl z-10 overflow-hidden text-[#F5F5F5] animate-in slide-in-from-right duration-200">
        {/* Universal Detail Header */}
        <div className="px-4 md:px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1B1B1B] border border-[#2A2A2A] text-[#B3B3B3]">
              {activeEntity.type.toUpperCase()}
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight text-[#F5F5F5] truncate">{activeEntity.id}</span>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-[10px] font-mono text-[#777777] hidden sm:block">
              UPDATED: {format(new Date(), 'HH:mm:ss')}
            </div>
            <button 
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-[#1B1B1B] border border-[#2A2A2A] text-[#B3B3B3] hover:text-[#F5F5F5] hover:border-[#777777] transition-colors"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#0A0A0A]">
          {activeEntity.type === 'inventory' && <InventoryDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'product' && <ProductDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'supplier' && <SupplierDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'po' && <PoDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'shipment' && <ShipmentDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'inbound' && <InboundDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'exception' && <ExceptionDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'action' && <ActionDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'import' && <ImportDetailModal id={activeEntity.id} />}
          {activeEntity.type === 'connector' && <ConnectorDetailModal id={activeEntity.id} />}
          {activeEntity.type === 'dataset' && <DatasetDetailModal id={activeEntity.id} />}
          {activeEntity.type === 'prediction' && <PredictionDetailContent id={activeEntity.id} />}
          {activeEntity.type === 'sync' && <SyncDetailContent id={activeEntity.id} />}
          {!['inventory', 'product', 'supplier', 'po', 'shipment', 'inbound', 'exception', 'action', 'import', 'connector', 'dataset', 'prediction', 'sync'].includes(activeEntity.type || '') && (
            <div className="p-6 text-center text-xs font-mono text-[#777777]">
              Detail view unavailable for this record type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
