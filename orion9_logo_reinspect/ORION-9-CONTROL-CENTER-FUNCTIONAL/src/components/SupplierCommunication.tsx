import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { orionAI } from '../services/ai/AIProvider';
import { SupplierCommunication as CommType } from '../types';
import {
  Mail, Send, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  Plus, Edit2, Trash2, Eye, User, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

export const SupplierCommunication: React.FC = () => {
  const {
    supplierCommunications,
    suppliers,
    purchaseOrders,
    addSupplierCommunication,
    approveSupplierCommunication,
    dispatchSupplierCommunication
  } = useSupplyChain();

  const [selectedComm, setSelectedComm] = useState<CommType | null>(supplierCommunications[0] || null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [issueType, setIssueType] = useState<'PO_DELAY' | 'QUALITY_DEFECT' | 'CONFIRMATION_REQUEST' | 'EXPEDITE_REQUEST' | 'PRICE_VARIANCE' | 'CONTRACT_RENEWAL'>('PO_DELAY');
  const [poNumber, setPoNumber] = useState('');
  const [details, setDetails] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  const handleGenerateAIDraft = () => {
    setIsGenerating(true);
    try {
      const contactEmail = typeof selectedSupplier?.contact === 'string' && selectedSupplier.contact.includes('@')
        ? selectedSupplier.contact
        : `contact@${(selectedSupplier?.name || 'supplier').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

      const generated = orionAI.draftSupplierCommunication({
        supplierName: selectedSupplier?.name || 'Supplier Partner',
        contactEmail,
        poNumber: poNumber || 'PO-2026-0001',
        issueType,
        severity: 'High',
        details: details || 'Delivery milestone overdue by 4 business days. Assembly line impacted.'
      });
      setDraftSubject(generated.subject);
      setDraftBody(generated.body);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftSubject || !draftBody) return;

    const contactEmail = typeof selectedSupplier?.contact === 'string' && selectedSupplier.contact.includes('@')
      ? selectedSupplier.contact
      : `contact@${(selectedSupplier?.name || 'supplier').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    addSupplierCommunication({
      supplierId: selectedSupplier?.id || 'SUP-001',
      supplierName: selectedSupplier?.name || 'Supplier Partner',
      contactEmail,
      subject: draftSubject,
      body: draftBody,
      type: issueType === 'PO_DELAY' ? 'DELAY_NOTICE' : issueType === 'QUALITY_DEFECT' ? 'QUALITY_ISSUE' : issueType === 'EXPEDITE_REQUEST' ? 'EXPEDITE_REQUEST' : 'PO_STATUS',
      status: 'DRAFT',
      requiresAuthorization: true,
      linkedPoId: poNumber || undefined
    });

    setIsDraftModalOpen(false);
    setDraftSubject('');
    setDraftBody('');
    setDetails('');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight">Supplier Communications</h1>
          <p className="text-sm text-os-text-secondary mt-1">
            Grounded AI drafting, contractual notifications, escalation threads, and explicit human authorization gates.
          </p>
        </div>
        <button
          onClick={() => {
            handleGenerateAIDraft();
            setIsDraftModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#00F2FE] text-black font-semibold rounded-md text-sm hover:bg-os-surface/95 transition-colors shadow-sm"
        >
          <Sparkles size={16} />
          <span>New AI Supplier Draft</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <span className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Total Communications</span>
          <div className="text-2xl font-bold text-os-text-primary mt-1">{supplierCommunications.length}</div>
        </div>
        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <span className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Pending Approval</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {supplierCommunications.filter(c => c.status === 'DRAFT').length}
          </div>
        </div>
        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <span className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Authorized / Ready</span>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {supplierCommunications.filter(c => c.status === 'APPROVED').length}
          </div>
        </div>
        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <span className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Dispatched</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {supplierCommunications.filter(c => c.status === 'DISPATCHED').length}
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Message Log */}
        <div className="lg:col-span-1 bg-os-surface border border-os-border rounded-lg overflow-hidden flex flex-col min-h-[600px] lg:h-[640px]">
          <div className="p-3.5 border-b border-os-border bg-os-surface font-semibold text-xs text-os-text-secondary uppercase tracking-wider">
            Communications Log
          </div>
          <div className="divide-y divide-[#2A2A2A] overflow-y-auto flex-1">
            {supplierCommunications.map(comm => {
              const isSelected = selectedComm?.id === comm.id;
              return (
                <div
                  key={comm.id}
                  onClick={() => setSelectedComm(comm)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-os-surface-hover border-l-2 border-[#00F2FE]' : 'hover:bg-os-surface'
                  }`}
                >
                  <div className="flex justify-between items-start text-xs">
                    <span className="font-semibold text-os-text-primary truncate max-w-[170px]">
                      {comm.supplierName}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      comm.status === 'DISPATCHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : comm.status === 'APPROVED'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {comm.status}
                    </span>
                  </div>
                  <p className="text-xs text-os-text-secondary mt-1 line-clamp-1 font-medium">{comm.subject}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-os-text-muted">
                    <Clock size={12} />
                    <span>{comm.sentAt ? format(new Date(comm.sentAt), 'MMM dd, HH:mm') : 'Draft staged'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Message Detail & Action Gates */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-lg p-6 flex flex-col justify-between min-h-[600px] lg:h-[640px]">
          {selectedComm ? (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4 overflow-y-auto pr-2">
                <div className="flex justify-between items-start border-b border-os-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 bg-os-surface-active text-[#00F2FE] rounded">
                        {selectedComm.type}
                      </span>
                      {selectedComm.requiresAuthorization && (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded flex items-center gap-1 font-medium">
                          <ShieldCheck size={12} /> Requires Human Sign-Off
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-os-text-primary">{selectedComm.subject}</h2>
                    <div className="text-xs text-os-text-secondary mt-1 space-x-2">
                      <span>To: <strong className="text-os-text-primary">{selectedComm.supplierName}</strong> ({selectedComm.contactEmail})</span>
                      {selectedComm.linkedPoId && <span>• Ref PO: <strong className="text-[#00F2FE] font-mono">{selectedComm.linkedPoId}</strong></span>}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-os-text-muted uppercase tracking-wider mb-2">Message Body</div>
                  <div className="bg-os-surface border border-os-border rounded-lg p-4 font-mono text-xs text-os-text-primary whitespace-pre-wrap leading-relaxed">
                    {selectedComm.body}
                  </div>
                </div>

                {selectedComm.status === 'DISPATCHED' && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-md text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Dispatched on {format(new Date(selectedComm.sentAt || new Date()), 'MMMM dd, yyyy at HH:mm')} by {selectedComm.sentBy || 'SC Ops'}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-os-border flex justify-end items-center gap-3">
                {selectedComm.status === 'DRAFT' && (
                  <button
                    onClick={() => approveSupplierCommunication(selectedComm.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-os-surface-active hover:bg-os-surface-active text-os-text-primary text-xs font-semibold rounded transition-colors"
                  >
                    <ShieldCheck size={14} className="text-[#00F2FE]" />
                    <span>Authorize Communication</span>
                  </button>
                )}

                {selectedComm.status === 'APPROVED' && (
                  <button
                    onClick={() => dispatchSupplierCommunication(selectedComm.id)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#00F2FE] hover:bg-os-surface/95 text-black text-xs font-bold rounded transition-colors shadow-sm"
                  >
                    <Send size={14} />
                    <span>Send Official Notice</span>
                  </button>
                )}

                {selectedComm.status === 'DISPATCHED' && (
                  <div className="text-xs text-os-text-muted italic">
                    Formal communication delivered. Awaiting supplier status response.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-os-text-muted text-sm">
              <Mail size={32} className="mx-auto mb-2 opacity-40" />
              Select a message from the log to view details or generate a new notice.
            </div>
          )}
        </div>
      </div>

      {/* AI Draft Creation Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-os-surface border border-os-border rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-os-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#00F2FE]" />
                <h3 className="text-base font-bold text-os-text-primary">AI Supplier Communication Assistant</h3>
              </div>
              <button
                onClick={() => setIsDraftModalOpen(false)}
                className="text-os-text-muted hover:text-os-text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDraft} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-os-text-secondary mb-1">Target Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-os-surface-elevated border border-os-border rounded px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-os-text-secondary mb-1">Issue / Template Type</label>
                  <select
                    value={issueType}
                    onChange={e => setIssueType(e.target.value as any)}
                    className="w-full bg-os-surface-elevated border border-os-border rounded px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
                  >
                    <option value="PO_DELAY">Delivery Delay Escalation</option>
                    <option value="QUALITY_DEFECT">Quality Defect / 8D Notice</option>
                    <option value="EXPEDITE_REQUEST">Expedited Handling Request</option>
                    <option value="CONFIRMATION_REQUEST">PO Confirmation Request</option>
                    <option value="CONTRACT_RENEWAL">Contract Renewal Review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-os-text-secondary mb-1">Associated Purchase Order</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-0001"
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    className="w-full bg-os-surface-elevated border border-os-border rounded px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-os-text-secondary mb-1">Specific Operational Details</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 days overdue, manufacturing idle"
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    className="w-full bg-os-surface-elevated border border-os-border rounded px-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateAIDraft}
                  className="px-3 py-1.5 bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] hover:bg-[#00F2FE]/20 text-xs font-medium rounded flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Regenerate Draft with AI</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-os-text-secondary mb-1">Subject Line</label>
                <input
                  type="text"
                  value={draftSubject}
                  onChange={e => setDraftSubject(e.target.value)}
                  required
                  className="w-full bg-os-surface-elevated border border-os-border rounded px-3 py-2 text-xs text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-os-text-secondary mb-1">Notice Content</label>
                <textarea
                  rows={6}
                  value={draftBody}
                  onChange={e => setDraftBody(e.target.value)}
                  required
                  className="w-full bg-os-surface-elevated border border-os-border rounded p-3 text-xs font-mono text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2 bg-os-surface-active hover:bg-os-surface-active text-xs font-medium text-os-text-secondary rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00F2FE] text-black font-semibold text-xs rounded hover:bg-os-surface/95 transition-colors"
                >
                  Save Draft for Authorization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
