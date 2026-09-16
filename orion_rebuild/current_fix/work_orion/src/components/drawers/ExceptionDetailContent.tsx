import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatCurrencyPair } from '../../lib/utils';
import { ShieldAlert, ArrowRight, ArrowDown, CheckCircle2, XCircle, UserCheck, BrainCircuit, Network } from 'lucide-react';
import { RootCauseEngine } from '../../services/RootCauseEngine';
import { RiskEngine } from '../../services/RiskEngine';

export const ExceptionDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { exceptions, inventory, purchaseOrders, shipments, suppliers, updateData, currency } = useSupplyChain();
  const { openEntity, showConfirmModal, hideConfirmModal, closeEntity } = useEntityDrawer();
  const [ownerInput, setOwnerInput] = useState('');
  const [assigning, setAssigning] = useState(false);

  const exception = useMemo(() => exceptions.find(e => e.id === id), [exceptions, id]);
  
  const riskData = useMemo(() => {
    if (!exception) return null;
    return RiskEngine.evaluateRisk(exception, inventory, purchaseOrders, shipments, suppliers, exceptions);
  }, [exception, inventory, purchaseOrders, shipments, suppliers, exceptions]);

  if (!exception || !riskData) {
    return <div className="p-12 text-center text-os-text-muted font-mono text-xs">Exception record not found.</div>;
  }

  const handleResolve = () => {
    showConfirmModal(
      'Resolve Exception',
      `Are you sure you want to mark exception ${exception.id} as Resolved?`,
      () => {
        const updated = exceptions.map(e => e.id === id ? { ...e, status: 'Resolved' as const } : e);
        updateData('exceptions', updated);
        hideConfirmModal();
        closeEntity();
      },
      'Resolve'
    );
  };

  const handleDismiss = () => {
    showConfirmModal(
      'Dismiss Exception',
      `Are you sure you want to dismiss exception ${exception.id}?`,
      () => {
        const updated = exceptions.map(e => e.id === id ? { ...e, status: 'Dismissed' as const } : e);
        updateData('exceptions', updated);
        hideConfirmModal();
        closeEntity();
      },
      'Dismiss'
    );
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerInput) return;
    const updated = exceptions.map(e => e.id === id ? { ...e, owner: ownerInput, status: 'Investigating' as const } : e);
    updateData('exceptions', updated);
    setAssigning(false);
    setOwnerInput('');
  };
  
  const handleNodeClick = (node: { type: string, id: string }) => {
    const typeLower = node.type.toLowerCase();
    if (typeLower === 'inventory') openEntity('inventory', node.id);
    else if (typeLower === 'po') openEntity('po', node.id);
    else if (typeLower === 'shipment') openEntity('shipment', node.id);
    else if (typeLower === 'supplier') openEntity('supplier', node.id);
    else if (typeLower === 'exception') openEntity('exception', node.id);
  }

  return (
    <div className="space-y-6">
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">{exception.type}</div>
            <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{exception.id}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            exception.severity === 'Critical' ? 'bg-os-surface-elevated text-[#FF453A] border-os-border' : 'bg-os-surface-elevated text-[#FF9F0A] border-os-border'
          }`}>
            {exception.severity} Severity
          </span>
        </div>
        
        <p className="text-xs text-os-text-secondary leading-relaxed">{exception.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Financial Impact</div>
            {(() => {
              const impPair = formatCurrencyPair(exception.estimatedImpact, currency);
              return (
                <div>
                  <div className="text-base font-mono text-[#FF453A]" title={`Exact: ${impPair.exact}`}>
                    {impPair.compact}
                  </div>
                  <div className="text-[10px] font-mono text-os-text-muted truncate select-all">
                    {impPair.exact}
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Status</div>
            <div className="text-base font-mono text-os-text-primary">{exception.status}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Owner</div>
            <div className="text-base font-mono text-os-text-primary">{exception.owner || 'Unassigned'}</div>
          </div>
        </div>
        
        {/* Root Cause Section */}
        <div className="pt-4 border-t border-os-border">
          <div className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold mb-2 flex items-center gap-2">
            <Network size={12} className="text-os-text-secondary" /> Root Cause & Connected Entity Chain
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {riskData.chain.map((node, i) => (
              <React.Fragment key={i}>
                <button onClick={() => handleNodeClick(node)} className="px-2 py-1 bg-os-surface border border-os-border rounded text-os-text-primary hover:border-os-border transition-colors">
                  <span className="text-os-text-muted mr-1">{node.type}:</span>{node.id}
                </button>
                {i < riskData.chain.length - 1 && <ArrowRight size={12} className="text-os-text-muted shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Evidence */}
        {riskData.evidence.length > 0 && (
          <div className="pt-4 border-t border-os-border">
            <div className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold mb-2">Evidence</div>
            <ul className="list-disc pl-4 text-xs text-os-text-secondary space-y-1">
              {riskData.evidence.map((ev, i) => (
                <li key={i}>{ev}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Action */}
        <div className="bg-os-surface p-4 rounded-lg border border-os-border space-y-1">
          <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Recommended Action</div>
          <div className="text-xs text-os-text-primary">{exception.recommendedAction}</div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-os-border">
          <button
            onClick={handleResolve}
            className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono uppercase tracking-wider text-[#30D158] hover:bg-os-surface-hover"
          >
            Resolve
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono uppercase tracking-wider text-[#FF453A] hover:bg-os-surface-hover"
          >
            Dismiss
          </button>
          <button
            onClick={() => setAssigning(!assigning)}
            className="px-3 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono uppercase tracking-wider text-os-text-primary hover:bg-os-surface-hover"
          >
            Assign Owner
          </button>
        </div>

        {assigning && (
          <form onSubmit={handleAssign} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Enter owner name..."
              className="flex-1 bg-os-surface border border-os-border rounded-lg px-3 py-1.5 text-xs text-os-text-primary"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
            />
            <button type="submit" className="px-4 py-1.5 bg-os-surface-elevated border border-os-border rounded-lg text-xs font-mono text-os-text-primary">
              Save
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
