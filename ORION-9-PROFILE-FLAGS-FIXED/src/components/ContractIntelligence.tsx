import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { ContractEngine } from '../services/ContractEngine';
import { Contract, DocumentRecord } from '../types';
import {
  FileText, ShieldAlert, AlertTriangle, CheckCircle2, Clock,
  Upload, Search, Filter, ExternalLink, ArrowUpRight, Plus, Eye
} from 'lucide-react';
import { format } from 'date-fns';

export const ContractIntelligence: React.FC = () => {
  const { contracts, documents, suppliers, updateContract, addDocumentRecord, addSupplierCommunication } = useSupplyChain();
  const [activeTab, setActiveTab] = useState<'contracts' | 'documents'>('contracts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // Evaluate contracts with live supplier performance data
  const contractAnalyses = useMemo(() => {
    return ContractEngine.evaluateContracts(contracts, suppliers);
  }, [contracts, suppliers]);

  // Aggregate Metrics
  const totalValue = contracts.reduce((sum, c) => sum + c.annualValue, 0);
  const expiringCount = contractAnalyses.filter(a => a.isRenewalWindowOpen).length;
  const breachRiskCount = contractAnalyses.filter(a => a.obligationsCompliance === 'BREACH_RISK').length;
  const totalPenaltyExposure = contractAnalyses.reduce((sum, a) => sum + a.penaltyRiskExposure, 0);

  // Filtered lists
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      return d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.linkedEntityId.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [documents, searchTerm]);

  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let content = "";
      let base64 = "";

      const fileExtension = (file.name.split('.').pop() || '').toLowerCase();
      const isBinary = ['pdf', 'xlsx', 'xls', 'doc', 'docx'].includes(fileExtension);

      if (isBinary) {
        // Read file as base64 for multi-modal server-side extraction
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        // Plain text formats: csv, txt, json, markdown
        content = await file.text();
      }

      const res = await fetch('/api/ai/document-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: content,
          fileBase64: base64,
          mimeType: file.type || (fileExtension === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
          documentType: file.type || 'text/plain'
        })
      });
      const data = await res.json();
      
      const extracted = data.result || {};
      
      let docType: 'PDF' | 'Excel' | 'CSV' | 'Text' = 'Text';
      if (fileExtension === 'pdf') docType = 'PDF';
      else if (fileExtension === 'xlsx' || fileExtension === 'xls') docType = 'Excel';
      else if (fileExtension === 'csv') docType = 'CSV';

      const newDoc: DocumentRecord = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        title: file.name,
        fileName: file.name,
        fileType: docType,
        fileSizeKb: Math.round(file.size / 1024),
        category: extracted.category || 'Contract',
        linkedEntityType: extracted.linkedEntityType || 'Contract',
        linkedEntityId: extracted.linkedEntityId || '',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User',
        extractedFields: extracted.extractedFields || {},
        summary: extracted.summary || 'Document ingested and metadata indexed.',
        anomalyDetected: extracted.anomalyDetected || undefined
      };
      
      addDocumentRecord(newDoc);
      setActiveTab('documents');
      showNotification('success', `Document '${file.name}' processed and indexed.`);
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.message || 'Error processing document');
    } finally {
      setIsUploading(false);
      // clear input
      if (event.target) event.target.value = '';
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateRenewalNotice = (contract: Contract) => {
    addSupplierCommunication({
      supplierId: contract.supplierId,
      supplierName: contract.supplierName,
      contactEmail: `contracts@${contract.supplierName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      subject: `[RENEWAL NOTICE] Contract Review — ${contract.contractNumber}`,
      body: `Dear ${contract.supplierName} Commercial Operations,\n\nOur Orion-9 has flagged that agreement ${contract.contractNumber} (${contract.title}) has entered its ${contract.renewalNoticeDays}-day renewal window.\n\nWe request a scheduled review of operational performance, volume commitments, and SLA benchmarks.\n\nBest regards,\nOrion-9 Procurement Team`,
      type: 'CONTRACT_RENEWAL',
      status: 'DRAFT',
      requiresAuthorization: true
    });
    showNotification('success', `Draft renewal communication staged for ${contract.supplierName}. You can review and authorize it in Supplier Communications.`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-6 box-border min-w-0">
      {/* Feedback Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between transition-all shadow-md ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
            : notification.type === 'error'
            ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
            : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-os-text-muted hover:text-os-text-primary">✕</button>
        </div>
      )}

      {/* Module Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight">Contract & Document Intelligence</h1>
          <p className="text-sm text-os-text-secondary mt-1">
            Autonomous extraction, contractual SLA obligation monitoring, penalty clauses, and renewal lifecycles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt,.csv,.json,.md,.pdf,.xlsx,.xls"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] hover:bg-[#00F2FE]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
          >
            <Upload size={16} />
            <span>{isUploading ? 'Analyzing...' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-os-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Value Managed</span>
            <FileText size={16} className="text-[#00F2FE]" />
          </div>
          <div className="text-2xl font-bold text-os-text-primary mt-2">
            ${(totalValue / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-os-text-muted mt-1">{contracts.length} active supplier agreements</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-os-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Renewal Window Open</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {expiringCount} Contracts
          </div>
          <div className="text-xs text-os-text-muted mt-1">Expiring within notice window</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-os-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>SLA Compliance Risk</span>
            <ShieldAlert size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">
            {breachRiskCount} Contracts
          </div>
          <div className="text-xs text-os-text-muted mt-1">OTIF gap exceeding SLA threshold</div>
        </div>

        <div className="p-4 bg-os-surface border border-os-border rounded-lg">
          <div className="flex justify-between items-center text-os-text-secondary text-xs font-semibold uppercase tracking-wider">
            <span>Penalty Risk Exposure</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            ${totalPenaltyExposure.toLocaleString()}
          </div>
          <div className="text-xs text-os-text-muted mt-1">Estimated liquidated damages</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-os-border space-x-6">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 sm:px-5 h-12 flex items-center text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'contracts'
              ? 'border-[#00F2FE] text-[#00F2FE]'
              : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
          }`}
        >
          Contract Intelligence & Obligations ({contracts.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 sm:px-5 h-12 flex items-center text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'documents'
              ? 'border-[#00F2FE] text-[#00F2FE]'
              : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
          }`}
        >
          Document Intelligence & Extractions ({documents.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted" />
          <input
            type="text"
            placeholder={activeTab === 'contracts' ? 'Search contracts by title, supplier, or number...' : 'Search documents by title or entity...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-os-surface border border-os-border rounded-md pl-9 pr-4 py-2 text-sm text-os-text-primary placeholder-[#737373] focus:outline-none focus:border-[#00F2FE]"
          />
        </div>
        {activeTab === 'contracts' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-os-surface border border-os-border rounded-md px-3 py-2 text-sm text-os-text-primary focus:outline-none focus:border-[#00F2FE]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Under Review">Under Review</option>
          </select>
        )}
      </div>

      {/* Tab 1: Contracts List */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
          <div className="space-y-4">
            {filteredContracts.map(contract => {
              const analysis = contractAnalyses.find(a => a.contractId === contract.id);
              const isSelected = selectedContract?.id === contract.id;

              return (
                <div
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className={`p-5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-os-surface-elevated border-[#00F2FE]/50 shadow-md shadow-[#00F2FE]/5'
                      : 'bg-os-surface border-os-border hover:border-os-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#00F2FE] bg-[#00F2FE]/10 px-2 py-0.5 rounded">
                          {contract.contractNumber}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          contract.status === 'Expiring Soon'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {contract.status}
                        </span>
                        {analysis?.obligationsCompliance === 'BREACH_RISK' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-medium flex items-center gap-1">
                            <ShieldAlert size={12} /> Breach Exposure
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-os-text-primary mt-1.5">{contract.title}</h3>
                      <p className="text-xs text-os-text-secondary mt-0.5">Supplier: {contract.supplierName}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-os-text-primary">
                        ${(contract.annualValue / 1000).toLocaleString()}k/yr
                      </div>
                      <div className="text-xs text-os-text-muted mt-0.5">
                        Expires: {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>

                  {/* Highlights Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-os-border/70 text-xs">
                    <div>
                      <span className="text-os-text-muted">Agreed OTIF:</span>{' '}
                      <span className="text-os-text-primary font-semibold">{contract.agreedOtifTarget}%</span>
                    </div>
                    <div>
                      <span className="text-os-text-muted">Max Defect:</span>{' '}
                      <span className="text-os-text-primary font-semibold">{contract.maxDefectRateAllowed}%</span>
                    </div>
                    <div>
                      <span className="text-os-text-muted">Notice Window:</span>{' '}
                      <span className="text-os-text-primary font-semibold">{contract.renewalNoticeDays} days</span>
                    </div>
                  </div>

                  {analysis && analysis.recommendations.length > 0 && (
                    <div className="mt-3 p-2.5 bg-os-surface border border-os-border rounded text-xs text-os-text-secondary flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>{analysis.recommendations[0]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Contract Side Panel */}
          <div className="bg-os-surface border border-os-border rounded-lg p-5 sticky top-24 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
            {selectedContract ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-[#00F2FE]">{selectedContract.contractNumber}</span>
                    <h3 className="text-lg font-bold text-os-text-primary mt-1">{selectedContract.title}</h3>
                    <p className="text-xs text-os-text-secondary">Supplier: {selectedContract.supplierName}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-3 border-t border-os-border">
                  <div>
                    <span className="text-os-text-muted block mb-1">Penalty Clause Structure:</span>
                    <p className="text-os-text-primary bg-os-surface-elevated p-2.5 rounded border border-os-border leading-relaxed">
                      {selectedContract.penaltyClauseSummary}
                    </p>
                  </div>

                  <div>
                    <span className="text-os-text-muted block mb-1">Pricing & Commercial Terms:</span>
                    <p className="text-os-text-primary bg-os-surface-elevated p-2.5 rounded border border-os-border">
                      {selectedContract.pricingTerms}
                    </p>
                  </div>

                  <div>
                    <span className="text-os-text-muted block mb-1.5">Monitored Supplier Obligations:</span>
                    <ul className="space-y-1.5">
                      {selectedContract.keyObligations.map((ob, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-os-text-secondary">
                          <CheckCircle2 size={13} className="text-[#00F2FE] shrink-0 mt-0.5" />
                          <span>{ob}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-os-border flex flex-col gap-2">
                  <button
                    onClick={() => handleCreateRenewalNotice(selectedContract)}
                    className="w-full py-2 bg-[#00F2FE] text-black font-semibold text-xs rounded hover:bg-os-surface/95 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock size={14} />
                    <span>Initiate Supplier Review Notice</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-os-text-muted text-sm">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                Select a contract to review obligations, penalty clauses, and SLA adherence.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Document Intelligence List */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
          <div className="space-y-4">
            {filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-os-surface-elevated border-[#00F2FE]/50'
                      : 'bg-os-surface border-os-border hover:border-os-border'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-os-surface-elevated border border-os-border rounded text-[#00F2FE]">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 bg-os-surface-active text-os-text-secondary rounded">
                            {doc.category}
                          </span>
                          <span className="text-xs font-mono text-os-text-muted">{doc.fileType} • {doc.fileSizeKb} KB</span>
                          {doc.anomalyDetected && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle size={11} /> Anomaly
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-os-text-primary mt-1">{doc.title}</h4>
                        <p className="text-xs text-os-text-secondary mt-1 line-clamp-2">{doc.summary}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-os-text-muted">
                      {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                    </div>
                  </div>

                  {doc.anomalyDetected && (
                    <div className="mt-3 p-2 bg-amber-500/5 border border-amber-500/20 rounded text-xs text-amber-400 flex items-center gap-2">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>{doc.anomalyDetected}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Document Extraction Detail Panel */}
          <div className="bg-os-surface border border-os-border rounded-lg p-5 sticky top-24 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
            {selectedDoc ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-[#00F2FE]">{selectedDoc.category}</span>
                  <h3 className="text-base font-bold text-os-text-primary mt-1">{selectedDoc.title}</h3>
                  <p className="text-xs text-os-text-muted">Uploaded by {selectedDoc.uploadedBy} on {format(new Date(selectedDoc.uploadedAt), 'MMM dd, yyyy')}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-os-border">
                  <h4 className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider">Extracted Operational Fields</h4>
                  <div className="bg-os-surface-elevated p-3 rounded border border-os-border space-y-1.5 text-xs font-mono">
                    {Object.entries(selectedDoc.extractedFields).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-os-border/50 pb-1">
                        <span className="text-os-text-muted">{key}:</span>
                        <span className="text-os-text-primary font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider mb-1">Summary</h4>
                  <p className="text-xs text-os-text-secondary leading-relaxed bg-os-surface-elevated p-2.5 rounded border border-os-border">
                    {selectedDoc.summary}
                  </p>
                </div>

                {selectedDoc.anomalyDetected && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Flagged Anomaly</h4>
                    <p className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                      {selectedDoc.anomalyDetected}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-os-text-muted text-sm">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                Select a document to view extracted fields, summary, and anomaly flags.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
