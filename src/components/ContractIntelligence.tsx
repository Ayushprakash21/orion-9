import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { EnterpriseContract, SourcingRfq, ContractState, IncotermCode, PaymentTermsCode } from '../types/contract';
import { DocumentRecord } from '../types';
import { contractService } from '../services/contractService';
import { formatCurrency } from '../lib/formatters';
import {
  FileText, ShieldAlert, AlertTriangle, CheckCircle2, Clock,
  Upload, Search, Filter, ArrowUpRight, Plus, Eye,
  Sparkles, Award, Scale, DollarSign, ChevronRight, ShieldCheck,
  Check, X, RefreshCw, Send, AlertCircle, FileCheck, Layers
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export const ContractIntelligence: React.FC = () => {
  const {
    contracts,
    rfqs,
    documents,
    suppliers,
    addContract,
    updateContract,
    addRfq,
    awardRfqBid,
    addDocumentRecord,
    addSupplierCommunication
  } = useSupplyChain();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'redline' | 'rfq' | 'sla' | 'documents'>('portfolio');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedContractId, setSelectedContractId] = useState<string>(contracts[0]?.id || '');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  // New Contract Modal State
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [newContractForm, setNewContractForm] = useState({
    contractNumber: `MSA-${Date.now().toString().slice(-4)}`,
    title: '',
    supplierId: suppliers[0]?.id || 'SUP-001',
    category: 'Raw Materials' as const,
    annualValue: 500000,
    incoterm: 'DDP' as IncotermCode,
    paymentTerms: 'NET_60' as PaymentTermsCode,
    renewalNoticeDays: 60,
    liabilityCapUsd: 1000000,
    forceMajeureClause: true,
    agreedOtifTarget: 95.0,
    maxDefectRateAllowed: 1.5,
  });

  // Selected contract typed as EnterpriseContract
  const selectedContract = useMemo(() => {
    return (contracts.find(c => c.id === selectedContractId) as EnterpriseContract) || (contracts[0] as EnterpriseContract) || null;
  }, [contracts, selectedContractId]);

  // Real-time evaluation of all contracts
  const contractEvaluations = useMemo(() => {
    return contracts.map(c => {
      const enterpriseC = c as EnterpriseContract;
      const supplier = suppliers.find(s => s.id === c.supplierId);
      const otif = supplier?.otif ?? 95.0;
      const defectRate = 1.0;
      return {
        contract: enterpriseC,
        eval: contractService.evaluateContractPerformance(enterpriseC, otif, defectRate)
      };
    });
  }, [contracts, suppliers]);

  // Aggregate Metrics
  const totalValue = contracts.reduce((sum, c) => sum + (c.annualValue || 0), 0);
  const expiringCount = contractEvaluations.filter(e => e.eval.isRenewalWindowOpen).length;
  const totalPenaltyExposure = contractEvaluations.reduce((sum, e) => sum + e.eval.totalLiquidatedDamagesUsd, 0);
  const redlineAlertsCount = contractEvaluations.reduce((sum, e) => sum + e.eval.redlineAlertsCount, 0);
  const activeAgreementsCount = contracts.filter(c => (c as EnterpriseContract).contractState === 'ACTIVE' || c.status === 'Active').length;

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const state = (c as EnterpriseContract).contractState || c.status;
      const matchStatus = statusFilter === 'ALL' || state === statusFilter || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      return d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.linkedEntityId && d.linkedEntityId.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [documents, searchTerm]);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);

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
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
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
        linkedEntityId: extracted.linkedEntityId || selectedContract?.id || '',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Elena Vance (VP Sourcing)',
        extractedFields: extracted.extractedFields || {
          contractValue: `$${(selectedContract?.annualValue || 500000).toLocaleString()}`,
          governingJurisdiction: 'Delaware Commercial Law',
          indemnityCap: '$1,000,000 USD'
        },
        summary: extracted.summary || 'Contract document scanned and indexed with cryptographic SHA-256 integrity seal.',
        anomalyDetected: extracted.anomalyDetected || undefined
      };

      addDocumentRecord(newDoc);
      setActiveTab('documents');
      showToast(`Document '${file.name}' ingested and indexed in Document Vault.`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error processing document', 'error');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  // State Machine Action: Submit to Legal Review
  const handleLegalReviewTransition = async (contract: EnterpriseContract) => {
    try {
      const res = await contractService.handleSubmitLegalReview(contract.id);
      updateContract(contract.id, {
        contractState: res.newState,
        status: 'Under Review'
      });
      showToast(`Contract ${contract.contractNumber} submitted to Legal Review. Neural redline audit initiated.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Transition error', 'error');
    }
  };

  // State Machine Action: Request Executive Approval
  const handleExecutiveApprovalRequest = async (contract: EnterpriseContract) => {
    try {
      const note = `Commercial commitment of ${formatCurrency(contract.annualValue)} requires Executive Sign-off per Policy POL-CTR-001.`;
      const res = await contractService.handleRequestExecutiveApproval(contract.id, note);
      updateContract(contract.id, {
        contractState: res.newState,
        status: 'Under Review'
      });
      showToast(`Dispatched to Approval Center: Executive sign-off requested for ${contract.contractNumber}.`, 'warning');
    } catch (err: any) {
      showToast(err.message || 'Approval error', 'error');
    }
  };

  // State Machine Action: Execute Digital Signature
  const handleExecuteContractSign = async (contract: EnterpriseContract) => {
    try {
      const res = await contractService.handleExecuteContract(contract.id, 'Elena Vance (VP Strategic Sourcing)');
      updateContract(contract.id, {
        contractState: res.newState,
        status: 'Active',
        signatures: {
          ...contract.signatures,
          buyerSigner: 'Elena Vance (VP Strategic Sourcing)',
          buyerSignedAt: res.timestamp
        }
      });
      showToast(`Contract ${contract.contractNumber} successfully countersigned and sealed with SHA-256 integrity proof.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Signature error', 'error');
    }
  };

  // Accept AI Redline Revision
  const handleAcceptRedline = (findingId: string) => {
    if (!selectedContract) return;
    const updatedFindings = (selectedContract.redlineFindings || []).map(f => {
      if (f.id === findingId) return { ...f, status: 'ACCEPTED' as const };
      return f;
    });
    updateContract(selectedContract.id, { redlineFindings: updatedFindings });
    showToast('AI standard legal revision accepted. Clause updated in agreement draft.', 'success');
  };

  // Award Sourcing RFQ Bid
  const handleAwardBid = async (rfqId: string, bidId: string) => {
    try {
      await awardRfqBid(rfqId, bidId);
      showToast('Sourcing RFQ awarded! Generated draft Master Supply Agreement in Contracts Portfolio.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Award error', 'error');
    }
  };

  // Initiate SLA Cure Notice
  const handleCreateSlaCureNotice = (contract: EnterpriseContract) => {
    addSupplierCommunication({
      supplierId: contract.supplierId,
      supplierName: contract.supplierName,
      contactEmail: `contracts@${contract.supplierName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      subject: `[FORMAL SLA CURE NOTICE] Contract Breach — ${contract.contractNumber}`,
      body: `Dear ${contract.supplierName} Operations,\n\nOur Orion-9 telemetry indicates a persistent delivery shortfall below agreed contractual benchmarks (${contract.agreedOtifTarget}% SLA).\n\nUnder Section 8.1 of Agreement ${contract.contractNumber}, Orion-9 is calculating accrued liquidated damages. You have a 14-day cure window to restore compliant fulfillment rates.\n\nBest regards,\nOrion-9 Strategic Procurement`,
      type: 'CONTRACT_RENEWAL',
      status: 'DRAFT',
      requiresAuthorization: true
    });
    showToast(`Draft SLA cure notice staged for ${contract.supplierName}. Ready for authorization in Supplier Communications.`, 'success');
  };

  // Handle New Contract Submission
  const handleCreateNewContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === newContractForm.supplierId);
    const newContract: EnterpriseContract = {
      id: `CNT-${Date.now().toString().slice(-4)}`,
      contractNumber: newContractForm.contractNumber,
      title: newContractForm.title || `${newContractForm.category} Master Supply Agreement`,
      version: 'v1.0-DRAFT',
      supplierId: newContractForm.supplierId,
      supplierName: sup?.name || 'Selected Supplier',
      category: newContractForm.category,
      currency: 'USD',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      renewalNoticeDays: newContractForm.renewalNoticeDays,
      annualValue: Number(newContractForm.annualValue),
      totalCommitmentValue: Number(newContractForm.annualValue) * 2,
      status: 'Under Review',
      contractState: 'DRAFT',
      incoterm: newContractForm.incoterm,
      paymentTerms: newContractForm.paymentTerms,
      governingLaw: 'State of Delaware, USA',
      liabilityCapUsd: Number(newContractForm.liabilityCapUsd),
      indemnificationScope: 'MUTUAL',
      forceMajeureClause: newContractForm.forceMajeureClause,
      agreedOtifTarget: Number(newContractForm.agreedOtifTarget),
      maxDefectRateAllowed: Number(newContractForm.maxDefectRateAllowed),
      penaltyClauseSummary: '2% liquidated damages per week delay capped at 10% order value.',
      pricingTerms: `Payment terms ${newContractForm.paymentTerms} with tiered volume breakpoints.`,
      riskRating: Number(newContractForm.annualValue) > 1000000 ? 'High' : 'Moderate',
      keyObligations: [
        'Maintain 30-day buffer inventory at regional fulfillment hub',
        'Bi-weekly production telemetry feed via Orion-9 Integration Fabric',
        'Mandatory notice of component shortage within 24 hours'
      ],
      volumeTiers: [
        { minUnits: 1, maxUnits: 10000, unitPrice: 50, discountPercent: 0 },
        { minUnits: 10001, maxUnits: 50000, unitPrice: 45, discountPercent: 10 }
      ],
      slaTargets: [
        {
          id: `SLA-${Date.now()}-1`,
          metricKey: 'OTIF_PERCENT',
          name: 'On-Time In-Full Delivery Target',
          targetValue: Number(newContractForm.agreedOtifTarget),
          actualValue: sup?.otif ?? 95,
          unit: '%',
          penaltyRatePercent: 2.0,
          status: 'COMPLIANT',
          curePeriodDays: 14
        }
      ],
      clauses: [
        {
          clauseNumber: 'Sec 1.1',
          title: 'Scope of Supply & Quality Compliance',
          category: 'OPERATIONS',
          body: 'Supplier shall supply goods meeting all published engineering drawings and quality tolerances.',
          isStandard: true
        }
      ],
      redlineFindings: [],
      cryptoIntegrityHash: 'pending-signature-seal',
      classification: 'CONFIDENTIAL',
      sourceSystem: 'ORION_INTERNAL_CLM',
      signatures: {}
    };

    const finalized = await contractService.handleCreateContract(newContract);
    addContract(finalized);
    setSelectedContractId(finalized.id);
    setIsNewContractOpen(false);
    showToast(`Contract ${finalized.contractNumber} initialized in DRAFT state.`, 'success');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1720px] mx-auto space-y-6 box-border min-w-0">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/20">
              <Scale size={20} />
            </span>
            <h1 className="text-xl font-bold text-os-text-primary tracking-tight">Contract Lifecycle & Strategic Sourcing</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30 font-mono">
              Layer 4 CLM
            </span>
          </div>
          <p className="text-xs text-os-text-secondary mt-1">
            Automated obligation compliance, SLA liquidated damages, neural redlines, and human-in-the-loop sourcing awards.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-3.5 py-1.5 bg-os-surface-elevated hover:bg-os-surface border border-os-border rounded-md text-xs font-medium text-os-text-primary flex items-center gap-2 transition-colors">
            <Upload size={14} className={isUploading ? "animate-spin text-[#00F2FE]" : "text-os-text-secondary"} />
            <span>{isUploading ? 'Analyzing OCR...' : 'Upload Agreement'}</span>
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.xlsx,.csv,.txt" />
          </label>

          <button
            onClick={() => setIsNewContractOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:opacity-90 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>Draft New Contract</span>
          </button>
        </div>
      </div>

      {/* Top Executive Operational HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 bg-os-surface/80 backdrop-blur-md rounded-lg border border-os-border hover:border-os-border/80 transition-all">
          <div className="flex justify-between items-start text-xs text-os-text-muted">
            <span>Active Portfolio Spend</span>
            <DollarSign size={14} className="text-[#10B981]" />
          </div>
          <div className="text-lg font-bold font-mono text-os-text-primary mt-1">
            {formatCurrency(totalValue)}
          </div>
          <div className="text-[11px] text-os-text-muted mt-0.5">
            Across {contracts.length} enterprise agreements
          </div>
        </div>

        <div className="p-3.5 bg-os-surface/80 backdrop-blur-md rounded-lg border border-os-border hover:border-os-border/80 transition-all">
          <div className="flex justify-between items-start text-xs text-os-text-muted">
            <span>Active Strategic Contracts</span>
            <ShieldCheck size={14} className="text-[#00F2FE]" />
          </div>
          <div className="text-lg font-bold font-mono text-os-text-primary mt-1">
            {activeAgreementsCount}
          </div>
          <div className="text-[11px] text-[#10B981] mt-0.5 flex items-center gap-1">
            <CheckCircle2 size={11} /> 100% SHA-256 sealed
          </div>
        </div>

        <div className="p-3.5 bg-os-surface/80 backdrop-blur-md rounded-lg border border-os-border hover:border-os-border/80 transition-all">
          <div className="flex justify-between items-start text-xs text-os-text-muted">
            <span>60-Day Renewal Window</span>
            <Clock size={14} className="text-[#F59E0B]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#F59E0B] mt-1">
            {expiringCount} Agreements
          </div>
          <div className="text-[11px] text-os-text-muted mt-0.5">
            Initiate commercial term renegotiation
          </div>
        </div>

        <div className="p-3.5 bg-os-surface/80 backdrop-blur-md rounded-lg border border-os-border hover:border-os-border/80 transition-all">
          <div className="flex justify-between items-start text-xs text-os-text-muted">
            <span>Accrued Liquidated Damages</span>
            <AlertTriangle size={14} className="text-[#EF4444]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#EF4444] mt-1">
            {formatCurrency(totalPenaltyExposure)}
          </div>
          <div className="text-[11px] text-os-text-muted mt-0.5">
            Active OTIF / defect penalties
          </div>
        </div>

        <div className="p-3.5 bg-os-surface/80 backdrop-blur-md rounded-lg border border-os-border hover:border-os-border/80 transition-all">
          <div className="flex justify-between items-start text-xs text-os-text-muted">
            <span>AI Redline Alerts</span>
            <Sparkles size={14} className="text-[#8B5CF6]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#8B5CF6] mt-1">
            {redlineAlertsCount} Flagged
          </div>
          <div className="text-[11px] text-os-text-muted mt-0.5">
            Non-standard clauses detected
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-os-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'portfolio'
                ? 'border-[#6366F1] text-os-text-primary font-semibold'
                : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            <FileText size={14} />
            <span>Contracts Portfolio ({contracts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('redline')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'redline'
                ? 'border-[#8B5CF6] text-os-text-primary font-semibold'
                : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            <Sparkles size={14} className="text-[#8B5CF6]" />
            <span>AI Neural Redlines ({redlineAlertsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('rfq')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'rfq'
                ? 'border-[#00F2FE] text-os-text-primary font-semibold'
                : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            <Award size={14} className="text-[#00F2FE]" />
            <span>Strategic Sourcing & RFQs ({rfqs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('sla')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sla'
                ? 'border-[#EF4444] text-os-text-primary font-semibold'
                : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            <Scale size={14} className="text-[#EF4444]" />
            <span>Live SLA & Liquidated Damages</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-[#10B981] text-os-text-primary font-semibold'
                : 'border-transparent text-os-text-secondary hover:text-os-text-primary'
            }`}
          >
            <Layers size={14} />
            <span>Document Vault ({documents.length})</span>
          </button>
        </div>

        {/* Global Filter & Search */}
        <div className="flex items-center gap-2 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-os-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search agreements, SKUs, clauses..."
              className="pl-8 pr-3 py-1 bg-os-surface border border-os-border rounded text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none focus:border-[#6366F1] w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="py-1 px-2.5 bg-os-surface border border-os-border rounded text-xs text-os-text-secondary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* TAB 1: CONTRACTS PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(380px,1.2fr)] gap-6 items-start">
          
          {/* Contracts Table */}
          <div className="bg-os-surface/60 border border-os-border rounded-lg overflow-hidden backdrop-blur-sm">
            <div className="p-3.5 border-b border-os-border flex justify-between items-center bg-os-surface-elevated/40">
              <span className="text-xs font-semibold text-os-text-primary uppercase tracking-wider">
                Enterprise Agreements ({filteredContracts.length})
              </span>
              <span className="text-[11px] text-os-text-muted">
                Sorted by spend commitment
              </span>
            </div>

            <div className="divide-y divide-os-border overflow-x-auto">
              {filteredContracts.map(c => {
                const ec = c as EnterpriseContract;
                const isSelected = selectedContract?.id === c.id;
                const daysRemaining = differenceInDays(parseISO(c.endDate), new Date());
                const state = ec.contractState || c.status;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContractId(c.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-os-surface-elevated/50 ${
                      isSelected ? 'bg-os-surface-elevated/80 border-l-4 border-l-[#6366F1]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-os-text-primary">
                            {c.contractNumber}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-os-surface-active text-os-text-secondary border border-os-border font-mono">
                            {ec.category || 'Procurement'}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-os-surface-active text-os-text-muted font-mono">
                            Incoterm: {ec.incoterm || 'DDP'}
                          </span>

                          {/* Status Pill */}
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            state === 'ACTIVE' || c.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : state === 'EXPIRING_SOON' || c.status === 'Expiring Soon'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : state === 'UNDER_LEGAL_REVIEW' || c.status === 'Under Review'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                          }`}>
                            {state}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-os-text-primary truncate">
                          {c.title}
                        </h3>

                        <div className="text-xs text-os-text-secondary flex items-center gap-3">
                          <span>Supplier: <strong className="text-os-text-primary">{c.supplierName}</strong></span>
                          <span>•</span>
                          <span>Cap: <strong>{formatCurrency(ec.liabilityCapUsd || c.annualValue)}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-sm font-bold font-mono text-os-text-primary">
                          {formatCurrency(c.annualValue)}/yr
                        </div>
                        <div className={`text-xs font-mono ${
                          daysRemaining <= 60 ? 'text-amber-400 font-semibold' : 'text-os-text-muted'
                        }`}>
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Inspector Drawer */}
          {selectedContract ? (
            <div className="bg-os-surface/80 border border-os-border rounded-lg p-5 sticky top-24 backdrop-blur-md shadow-sm space-y-5">
              
              {/* Header */}
              <div className="border-b border-os-border pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#818CF8]">
                      {selectedContract.contractNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-os-surface-elevated border border-os-border font-mono text-os-text-muted">
                      {selectedContract.version || 'v1.0'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      selectedContract.classification === 'RESTRICTED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}>
                      {selectedContract.classification || 'CONFIDENTIAL'}
                    </span>
                  </div>

                  <div className="text-[11px] text-os-text-muted font-mono flex items-center gap-1">
                    <ShieldCheck size={13} className="text-[#00F2FE]" />
                    <span>SHA-256 SEALED</span>
                  </div>
                </div>

                <h2 className="text-base font-bold text-os-text-primary mt-1.5">
                  {selectedContract.title}
                </h2>
                <p className="text-xs text-os-text-secondary mt-0.5">
                  Counterparty: <strong className="text-os-text-primary">{selectedContract.supplierName}</strong> ({selectedContract.supplierId})
                </p>
              </div>

              {/* Commercial & Legal Terms Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-os-surface-elevated/60 p-3.5 rounded border border-os-border">
                <div>
                  <span className="text-os-text-muted block text-[11px]">Annual Spend</span>
                  <span className="text-os-text-primary font-bold">{formatCurrency(selectedContract.annualValue)}</span>
                </div>
                <div>
                  <span className="text-os-text-muted block text-[11px]">Liability Cap</span>
                  <span className="text-os-text-primary font-bold">{formatCurrency(selectedContract.liabilityCapUsd || selectedContract.annualValue)}</span>
                </div>
                <div>
                  <span className="text-os-text-muted block text-[11px]">Incoterm & Terms</span>
                  <span className="text-os-text-primary font-bold">{selectedContract.incoterm || 'DDP'} • {selectedContract.paymentTerms || 'NET_30'}</span>
                </div>
                <div>
                  <span className="text-os-text-muted block text-[11px]">Governing Law</span>
                  <span className="text-os-text-primary font-bold truncate block">{selectedContract.governingLaw || 'Delaware, USA'}</span>
                </div>
              </div>

              {/* Volume Discount Schedule */}
              {selectedContract.volumeTiers && selectedContract.volumeTiers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Tiered Volume Breakpoints</span>
                    <span className="text-[10px] text-os-text-muted">Quarterly Draw</span>
                  </h4>
                  <div className="space-y-1.5">
                    {selectedContract.volumeTiers.map((tier, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-os-surface-elevated/40 border border-os-border/60">
                        <span className="text-os-text-secondary font-mono">
                          {tier.minUnits.toLocaleString()} – {tier.maxUnits ? tier.maxUnits.toLocaleString() : '∞'} units
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-os-text-primary font-mono">{formatCurrency(tier.unitPrice)}</span>
                          {tier.discountPercent > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                              -{tier.discountPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLA Metrics Adherence */}
              <div>
                <h4 className="text-xs font-semibold text-os-text-secondary uppercase tracking-wider mb-2">
                  Key Contractual SLAs & Target Benchmarks
                </h4>
                <div className="space-y-2">
                  {(selectedContract.slaTargets || []).map((sla) => (
                    <div key={sla.id} className="p-2.5 rounded bg-os-surface-elevated border border-os-border text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-os-text-primary">{sla.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          sla.status === 'BREACH'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {sla.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-os-text-muted font-mono">
                        <span>Target: <strong>{sla.targetValue}{sla.unit}</strong></span>
                        <span>Live Actual: <strong className={sla.actualValue && sla.actualValue < sla.targetValue ? 'text-rose-400' : 'text-emerald-400'}>
                          {sla.actualValue ?? sla.targetValue}{sla.unit}
                        </strong></span>
                        <span>Penalty: {sla.penaltyRatePercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* State Machine Action Controls */}
              <div className="pt-4 border-t border-os-border space-y-2">
                <div className="text-[11px] text-os-text-muted uppercase tracking-wider font-semibold">
                  Governed Execution Controls
                </div>

                {selectedContract.contractState === 'DRAFT' && (
                  <button
                    onClick={() => handleLegalReviewTransition(selectedContract)}
                    className="w-full py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Scale size={14} />
                    <span>Submit for Legal Redline Review</span>
                  </button>
                )}

                {selectedContract.contractState === 'UNDER_LEGAL_REVIEW' && (
                  <button
                    onClick={() => handleExecutiveApprovalRequest(selectedContract)}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-semibold text-xs rounded transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={14} />
                    <span>Submit for Executive Approval Gate</span>
                  </button>
                )}

                {selectedContract.contractState === 'PENDING_EXECUTIVE_APPROVAL' && (
                  <button
                    onClick={() => handleExecuteContractSign(selectedContract)}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-semibold text-xs rounded transition-all flex items-center justify-center gap-2"
                  >
                    <FileCheck size={14} />
                    <span>Countersign & Apply SHA-256 Seal</span>
                  </button>
                )}

                <button
                  onClick={() => handleCreateSlaCureNotice(selectedContract)}
                  className="w-full py-2 bg-os-surface hover:bg-os-surface-elevated border border-os-border text-os-text-primary text-xs rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={14} className="text-[#F59E0B]" />
                  <span>Initiate Commercial Review / Cure Notice</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-os-text-muted text-xs bg-os-surface/40 rounded border border-os-border">
              Select an agreement from the portfolio to inspect canonical clauses and SLAs.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI NEURAL REDLINE LAB */}
      {activeTab === 'redline' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#6366F1]/10 border border-[#8B5CF6]/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-[#8B5CF6]/20 rounded-md text-[#8B5CF6]">
                <Sparkles size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-os-text-primary">Orion Neural Legal Redline Assistant</h3>
                <p className="text-xs text-os-text-secondary">
                  Continuous comparison of supplier terms against Orion-9 Standard SCM Playbook & Liability Boundaries.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-os-surface text-[#8B5CF6] border border-[#8B5CF6]/30">
              Rule Set: SCM-LEGAL-2026-R4
            </span>
          </div>

          <div className="space-y-4">
            {contracts.flatMap(c => {
              const ec = c as EnterpriseContract;
              return (ec.redlineFindings || []).map(f => ({ ...f, contract: ec }));
            }).map((finding) => (
              <div
                key={finding.id}
                className="p-5 rounded-lg bg-os-surface/80 border border-os-border space-y-4 hover:border-[#8B5CF6]/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      finding.riskSeverity === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {finding.riskSeverity} RISK
                    </span>
                    <span className="text-xs font-mono font-bold text-os-text-primary">
                      {finding.contract.contractNumber}
                    </span>
                    <span className="text-xs text-os-text-muted">•</span>
                    <span className="text-xs text-os-text-secondary">
                      {finding.contract.supplierName}
                    </span>
                  </div>

                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    finding.status === 'ACCEPTED'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {finding.status}
                  </span>
                </div>

                {/* Analysis Box */}
                <div className="text-xs text-os-text-secondary bg-os-surface-elevated/70 p-3 rounded border border-os-border/70 flex items-start gap-2">
                  <AlertCircle size={14} className="text-[#8B5CF6] shrink-0 mt-0.5" />
                  <span>{finding.issueAnalysis}</span>
                </div>

                {/* Side by Side Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-md">
                    <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <X size={12} />
                      <span>Original Supplier Draft Clause</span>
                    </div>
                    <p className="text-os-text-secondary leading-relaxed line-through opacity-80">
                      {finding.originalText}
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-md">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Check size={12} />
                      <span>Orion-9 Recommended Standard Provision</span>
                    </div>
                    <p className="text-os-text-primary leading-relaxed">
                      {finding.proposedRevision}
                    </p>
                  </div>
                </div>

                {/* Accept Action */}
                {finding.status === 'PENDING' && (
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleAcceptRedline(finding.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:opacity-90 text-white rounded text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Check size={13} />
                      <span>Accept Revision & Apply to Draft</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STRATEGIC SOURCING & RFQS */}
      {activeTab === 'rfq' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-os-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-os-text-primary">Multi-Criteria Sourcing RFQs</h3>
              <p className="text-xs text-os-text-secondary">
                Autonomous bidding matrix weighted across Unit Cost (40%), Lead Time (25%), Quality/OTIF (20%), and ESG (15%).
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {(rfqs || []).map(rfq => (
              <div key={rfq.id} className="bg-os-surface/70 border border-os-border rounded-lg p-5 space-y-4 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-os-border/70 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#00F2FE]">{rfq.rfqNumber}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-os-surface-elevated text-os-text-secondary font-mono">
                        {rfq.sku}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        rfq.status === 'AWARDED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {rfq.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-os-text-primary mt-1">{rfq.title}</h4>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <div className="text-os-text-muted">Target Budget: <strong>{formatCurrency(rfq.targetBudgetUsd)}</strong></div>
                    <div className="text-os-text-muted">Target Units: <strong>{rfq.targetUnits.toLocaleString()}</strong></div>
                  </div>
                </div>

                {/* Bidding Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-os-border/60 text-os-text-muted font-mono uppercase text-[10px]">
                        <th className="py-2 px-3">Supplier</th>
                        <th className="py-2 px-3">Unit Price</th>
                        <th className="py-2 px-3">Lead Time</th>
                        <th className="py-2 px-3">Terms & Incoterm</th>
                        <th className="py-2 px-3">OTIF / ESG</th>
                        <th className="py-2 px-3">Composite Score</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-os-border/40 font-mono">
                      {rfq.bids.map(bid => {
                        const isWinning = bid.calculatedScore >= 90;
                        return (
                          <tr key={bid.id} className={bid.awarded ? "bg-emerald-500/10" : ""}>
                            <td className="py-3 px-3 font-sans">
                              <div className="font-semibold text-os-text-primary">{bid.supplierName}</div>
                              <div className="text-[10px] text-os-text-muted font-mono">{bid.supplierId}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-os-text-primary">{formatCurrency(bid.unitPrice)}</span>
                              <div className="text-[10px] text-os-text-muted">MOQ: {bid.moq.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span>{bid.leadTimeDays} days</span>
                            </td>
                            <td className="py-3 px-3">
                              <span>{bid.paymentTerms} • {bid.incoterm}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div>OTIF: <strong className="text-os-text-primary">{bid.historicalOtif}%</strong></div>
                              <div>ESG: <strong className="text-os-text-primary">{bid.esgScore}/100</strong></div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isWinning ? 'text-[#00F2FE]' : 'text-os-text-primary'}`}>
                                  {bid.calculatedScore}/100
                                </span>
                                {isWinning && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00F2FE]/15 text-[#00F2FE]">
                                    RANK #1
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-sans">
                              {bid.awarded ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                                  <CheckCircle2 size={13} />
                                  <span>Contract Awarded</span>
                                </span>
                              ) : rfq.status !== 'AWARDED' ? (
                                <button
                                  onClick={() => handleAwardBid(rfq.id, bid.id)}
                                  className="px-3 py-1 bg-[#00F2FE] hover:bg-[#00F2FE]/90 text-black font-semibold text-xs rounded transition-colors shadow-sm"
                                >
                                  Award & Draft
                                </button>
                              ) : (
                                <span className="text-os-text-muted text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE SLA & LIQUIDATED DAMAGES ENGINE */}
      {activeTab === 'sla' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/30 rounded-lg">
            <h3 className="text-sm font-bold text-os-text-primary">Autonomous Liquidated Damages & SLA Tracker</h3>
            <p className="text-xs text-os-text-secondary mt-0.5">
              Live cross-referencing between ERP inbound receipt telemetry and contractual penalty clauses.
            </p>
          </div>

          <div className="bg-os-surface/70 border border-os-border rounded-lg overflow-hidden backdrop-blur-sm">
            <div className="divide-y divide-os-border">
              {contractEvaluations.map(({ contract, eval: ce }) => (
                <div key={contract.id} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-os-text-primary">
                          {contract.contractNumber}
                        </span>
                        <span className="text-xs text-os-text-muted">•</span>
                        <span className="text-xs font-semibold text-os-text-primary">
                          {contract.supplierName}
                        </span>
                      </div>
                      <div className="text-xs text-os-text-secondary mt-0.5">
                        {contract.title}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs text-os-text-muted">Calculated Penalty Accrual:</div>
                      <div className={`text-base font-bold ${
                        ce.totalLiquidatedDamagesUsd > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {formatCurrency(ce.totalLiquidatedDamagesUsd)}
                      </div>
                    </div>
                  </div>

                  {/* SLA Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-os-surface-elevated/40 p-3 rounded border border-os-border text-xs font-mono">
                    <div>
                      <span className="text-os-text-muted block text-[10px]">Agreed OTIF SLA</span>
                      <span className="font-bold text-os-text-primary">{contract.agreedOtifTarget}%</span>
                    </div>
                    <div>
                      <span className="text-os-text-muted block text-[10px]">Live Supplier OTIF</span>
                      <span className={`font-bold ${ce.otifGap < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(contract.agreedOtifTarget + ce.otifGap).toFixed(1)}% ({ce.otifGap > 0 ? `+${ce.otifGap}` : ce.otifGap}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-os-text-muted block text-[10px]">Liquidated Damages Formula</span>
                      <span className="text-os-text-secondary truncate block">{contract.penaltyClauseSummary}</span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-1 text-xs">
                    {ce.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-os-text-secondary">
                        <ChevronRight size={12} className="text-[#00F2FE]" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>

                  {ce.totalLiquidatedDamagesUsd > 0 && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleCreateSlaCureNotice(contract)}
                        className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <AlertTriangle size={13} />
                        <span>Claim Liquidated Damages & Issue Cure Notice</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENT VAULT & OCR */}
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
                      : 'bg-os-surface border-os-border hover:border-os-border/80'
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

      {/* DRAFT NEW CONTRACT MODAL */}
      {isNewContractOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-os-border pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#6366F1]" />
                <h3 className="text-base font-bold text-os-text-primary">Draft Master Supply Agreement</h3>
              </div>
              <button
                onClick={() => setIsNewContractOpen(false)}
                className="p-1 text-os-text-muted hover:text-os-text-primary rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewContractSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-os-text-muted block mb-1">Agreement Number</label>
                  <input
                    type="text"
                    value={newContractForm.contractNumber}
                    onChange={e => setNewContractForm(prev => ({ ...prev, contractNumber: e.target.value }))}
                    className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-os-text-muted block mb-1">Category</label>
                  <select
                    value={newContractForm.category}
                    onChange={e => setNewContractForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Semiconductors">Semiconductors</option>
                    <option value="Logistics & 3PL">Logistics & 3PL</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Direct Procurement">Direct Procurement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-os-text-muted block mb-1">Contract Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lithium-Ion Battery Anode Long-Term Agreement"
                  value={newContractForm.title}
                  onChange={e => setNewContractForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-os-text-muted block mb-1">Supplier Counterparty</label>
                  <select
                    value={newContractForm.supplierId}
                    onChange={e => setNewContractForm(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-os-text-muted block mb-1">Annual Commitment ($ USD)</label>
                  <input
                    type="number"
                    value={newContractForm.annualValue}
                    onChange={e => setNewContractForm(prev => ({ ...prev, annualValue: Number(e.target.value) }))}
                    className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-os-text-muted block mb-1">Incoterm</label>
                  <select
                    value={newContractForm.incoterm}
                    onChange={e => setNewContractForm(prev => ({ ...prev, incoterm: e.target.value as any }))}
                    className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                  >
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                    <option value="FCA">FCA (Free Carrier)</option>
                    <option value="FOB">FOB (Free On Board)</option>
                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    <option value="EXW">EXW (Ex Works)</option>
                  </select>
                </div>
                <div>
                  <label className="text-os-text-muted block mb-1">Payment Terms</label>
                  <select
                    value={newContractForm.paymentTerms}
                    onChange={e => setNewContractForm(prev => ({ ...prev, paymentTerms: e.target.value as any }))}
                    className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                  >
                    <option value="NET_30">Net 30</option>
                    <option value="NET_60">Net 60</option>
                    <option value="NET_90">Net 90</option>
                    <option value="2_10_NET_30">2/10 Net 30</option>
                  </select>
                </div>
                <div>
                  <label className="text-os-text-muted block mb-1">Target OTIF SLA (%)</label>
                  <input
                    type="number"
                    value={newContractForm.agreedOtifTarget}
                    onChange={e => setNewContractForm(prev => ({ ...prev, agreedOtifTarget: Number(e.target.value) }))}
                    className="w-full p-2 bg-os-surface-elevated border border-os-border rounded text-os-text-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-os-border">
                <button
                  type="button"
                  onClick={() => setIsNewContractOpen(false)}
                  className="px-4 py-2 bg-os-surface-elevated text-os-text-secondary hover:text-os-text-primary rounded text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded text-xs transition-colors shadow-sm"
                >
                  Initialize Governed Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
