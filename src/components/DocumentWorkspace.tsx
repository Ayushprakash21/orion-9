import React, { useState } from 'react';
import { 
  FileText, Upload, Shield, Eye, Download, CheckCircle2, AlertTriangle, 
  Search, Filter, Clock, Link as LinkIcon, RefreshCw, FileCheck, Lock,
  ChevronRight, ArrowUpRight, Cpu, Tag, Calendar, Database, ShieldAlert,
  ShieldCheck, Star, LayoutGrid, List, Folder, DollarSign, PackageCheck, FileSearch, Network
} from 'lucide-react';
import { useToast } from '../store/ToastContext';
import { KernelAuditEngine } from '../kernel/AuditEngine';
import { cn } from '../lib/utils';

export interface EnterpriseDocument {
  id: string;
  name: string;
  category: 'Commercial Invoice' | 'Bill of Lading' | 'Certificate of Analysis' | 'Purchase Contract' | 'Customs Declaration' | 'ESG Certification';
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  version: string;
  fileSize: string;
  fileFormat: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt: string;
  status: 'VERIFIED' | 'OCR_PENDING' | 'VALIDATING' | 'FLAGGED';
  linkedEntityType: 'Purchase Order' | 'Invoice' | 'Shipment' | 'Supplier' | 'Quality Record';
  linkedEntityId: string;
  ocrConfidence: number;
  extractedFields: Record<string, any>;
  sha256Hash: string;
}

const INITIAL_DOCS: EnterpriseDocument[] = [
  {
    id: 'DOC-INV-9921',
    name: 'Commercial_Invoice_Global_Freight_9921.pdf',
    category: 'Commercial Invoice',
    classification: 'CONFIDENTIAL',
    version: 'v1.1',
    fileSize: '1.4 MB',
    fileFormat: 'PDF',
    uploadedBy: 'Automated Carrier EDI',
    uploadedAt: '2026-09-17 14:22',
    expiresAt: '2027-09-17',
    status: 'VERIFIED',
    linkedEntityType: 'Invoice',
    linkedEntityId: 'INV-2026-0884',
    ocrConfidence: 99.2,
    extractedFields: {
      invoiceNumber: 'INV-9921-X',
      totalAmount: '$142,500.00',
      currency: 'USD',
      vendorTaxId: 'DE-811-923-441',
      lineItemsDetected: 14
    },
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'DOC-BL-4019',
    name: 'Ocean_Bill_of_Lading_MSC_Titan.pdf',
    category: 'Bill of Lading',
    classification: 'RESTRICTED',
    version: 'v1.0',
    fileSize: '3.2 MB',
    fileFormat: 'PDF',
    uploadedBy: 'Port of Rotterdam Agent',
    uploadedAt: '2026-09-18 08:15',
    expiresAt: '2027-03-18',
    status: 'VERIFIED',
    linkedEntityType: 'Shipment',
    linkedEntityId: 'SHP-ROT-NYC-102',
    ocrConfidence: 98.6,
    extractedFields: {
      vesselName: 'MSC TITAN V.24B',
      containerCount: 42,
      grossWeightKg: 840200,
      portOfDischarge: 'USNYC (New York)'
    },
    sha256Hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
  },
  {
    id: 'DOC-COA-8812',
    name: 'CoA_Silicon_Wafer_Purity_Batch8812.pdf',
    category: 'Certificate of Analysis',
    classification: 'RESTRICTED',
    version: 'v1.0',
    fileSize: '890 KB',
    fileFormat: 'PDF',
    uploadedBy: 'Quality Assurance Lab',
    uploadedAt: '2026-09-18 09:40',
    expiresAt: '2028-09-18',
    status: 'VERIFIED',
    linkedEntityType: 'Quality Record',
    linkedEntityId: 'QR-AQL-8812',
    ocrConfidence: 97.4,
    extractedFields: {
      lotNumber: 'LOT-9921-SI',
      purityGrade: '99.999999%',
      defectPpm: 0.04,
      inspectorId: 'QA-CERT-09'
    },
    sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
  },
  {
    id: 'DOC-CTR-2026',
    name: 'Master_Supply_Agreement_Aurora_Semi.pdf',
    category: 'Purchase Contract',
    classification: 'RESTRICTED',
    version: 'v2.4',
    fileSize: '5.8 MB',
    fileFormat: 'PDF',
    uploadedBy: 'Legal Procurement Counsel',
    uploadedAt: '2026-08-01 11:00',
    expiresAt: '2027-12-31',
    status: 'VERIFIED',
    linkedEntityType: 'Supplier',
    linkedEntityId: 'SUP-AURORA-SEM',
    ocrConfidence: 100.0,
    extractedFields: {
      contractType: 'Master Service Agreement',
      liabilityCap: '$5,000,000.00',
      governingLaw: 'Delaware Commercial Law',
      incoterms: 'DDP (Delivered Duty Paid)'
    },
    sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
  },
  {
    id: 'DOC-ESG-2025',
    name: 'Carbon_Footprint_Scope3_Audit_Report.pdf',
    category: 'ESG Certification',
    classification: 'INTERNAL',
    version: 'v1.0',
    fileSize: '4.1 MB',
    fileFormat: 'PDF',
    uploadedBy: 'Sustainability Auditor',
    uploadedAt: '2026-09-15 16:30',
    expiresAt: '2027-09-15',
    status: 'VERIFIED',
    linkedEntityType: 'Supplier',
    linkedEntityId: 'SUP-AURORA-SEM',
    ocrConfidence: 96.8,
    extractedFields: {
      auditAgency: 'SGS International',
      carbonIntensity: '1.2 kg CO2e/kg',
      renewablePowerPct: '84%'
    },
    sha256Hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae'
  }
];

export const DocumentWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<EnterpriseDocument[]>(INITIAL_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<EnterpriseDocument | null>(INITIAL_DOCS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeFolder, setActiveFolder] = useState<string>('documents');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isUploading, setIsUploading] = useState(false);

  const sidebarFolders = [
    { id: 'all', label: 'All Documents', icon: Folder, count: documents.length },
    { id: 'favorites', label: 'Favorites', icon: Star, count: 2 },
    { id: 'recent', label: 'Recent', icon: Clock, count: documents.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'downloads', label: 'Downloads', icon: Download, count: 4 },
    { id: 'supply_chain', label: 'Supply Chain', icon: Database, count: documents.length },
    { id: 'suppliers', label: 'Suppliers', icon: Network, count: 2 },
    { id: 'contracts', label: 'Contracts', icon: FileCheck, count: 1 },
    { id: 'invoices', label: 'Invoices', icon: DollarSign, count: 1 },
    { id: 'shipments', label: 'Shipments', icon: PackageCheck, count: 1 },
    { id: 'quality', label: 'Quality', icon: ShieldCheck, count: 1 },
    { id: 'reports', label: 'Reports', icon: FileSearch, count: 3 },
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.linkedEntityId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassification === 'ALL' || doc.classification === selectedClassification;
    const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
    return matchesSearch && matchesClass && matchesCat;
  });

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: EnterpriseDocument = {
        id: `DOC-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
        name: `Inbound_GRN_Inspection_Batch_${Date.now().toString().slice(-4)}.pdf`,
        category: 'Certificate of Analysis',
        classification: 'RESTRICTED',
        version: 'v1.0',
        fileSize: '2.1 MB',
        fileFormat: 'PDF',
        uploadedBy: 'Operator Terminal 4',
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        expiresAt: '2027-09-18',
        status: 'VERIFIED',
        linkedEntityType: 'Quality Record',
        linkedEntityId: 'QR-GATE-904',
        ocrConfidence: 99.4,
        extractedFields: {
          batchInspectionCode: 'PASS-AQL-0.65',
          sampleQuantity: 125,
          defectCount: 0,
          analystSignature: 'VERIFIED_DIGITAL_SIG'
        },
        sha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
      };

      setDocuments(prev => [newDoc, ...prev]);
      setSelectedDoc(newDoc);
      setIsUploading(false);

      KernelAuditEngine.getInstance().record({
        actor: {
          id: 'usr-operator-01',
          type: 'USER',
          role: 'OPERATOR',
          name: 'Supply Chain Specialist'
        },
        tenantId: 'ORION_PLATFORM',
        action: 'DOCUMENT_UPLOAD_AND_OCR_INGESTED',
        entityId: newDoc.id,
        entityType: 'Document',
        result: 'SUCCESS',
        classification: newDoc.classification,
        details: {
          ocrConfidence: newDoc.ocrConfidence,
          sha256: newDoc.sha256Hash
        }
      });

      showToast(`Document ${newDoc.name} parsed via OCR and cryptographically signed.`, 'success', 'Document Workspace');
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full bg-os-bg text-os-text-primary overflow-hidden font-sans">
      {/* Top Header Strip */}
      <div className="px-6 py-4 border-b border-os-border bg-os-surface/60 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
              SYSTEM SERVICES • LAYER 5
            </span>
            <span className="text-xs font-mono text-os-text-muted">ENTERPRISE REPOSITORY & OCR ENGINE</span>
          </div>
          <h1 className="text-xl font-bold text-os-text-primary tracking-tight">Document Workspace</h1>
          <p className="text-xs text-os-text-muted">
            Tamper-evident document lifecycle, OCR extraction, cryptographic hash verification, and entity binding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateUpload}
            disabled={isUploading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
            {isUploading ? 'OCR Parsing & Ingesting...' : 'Upload & Ingest Document'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 border-b border-os-border bg-os-surface/30 shrink-0">
        <div className="bg-os-surface border border-os-border/60 rounded-xl p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-os-text-muted mb-1">Total Repository</div>
          <div className="text-xl font-bold text-os-text-primary font-mono">{documents.length} Records</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <CheckCircle2 size={11} /> 100% Cryptographically Verified
          </div>
        </div>
        <div className="bg-os-surface border border-os-border/60 rounded-xl p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-os-text-muted mb-1">Restricted / Confidential</div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {documents.filter(d => d.classification === 'RESTRICTED' || d.classification === 'CONFIDENTIAL').length}
          </div>
          <div className="text-[10px] text-os-text-muted flex items-center gap-1 mt-1">
            <Lock size={11} /> Strict RBAC & ABAC Enforced
          </div>
        </div>
        <div className="bg-os-surface border border-os-border/60 rounded-xl p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-os-text-muted mb-1">Avg OCR Extraction</div>
          <div className="text-xl font-bold text-cyan-400 font-mono">98.4%</div>
          <div className="text-[10px] text-os-text-muted flex items-center gap-1 mt-1">
            <Cpu size={11} /> Deep OCR Neural Model
          </div>
        </div>
        <div className="bg-os-surface border border-os-border/60 rounded-xl p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-os-text-muted mb-1">Audit Ledger</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">Synced</div>
          <div className="text-[10px] text-os-text-muted flex items-center gap-1 mt-1">
            <Shield size={11} /> Kernel EventBus Connected
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns (Document List + Document Inspector) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Document List */}
        <div className="w-full md:w-1/2 lg:w-5/12 border-r border-os-border flex flex-col overflow-hidden bg-os-surface/20">
          {/* Filters Bar */}
          <div className="p-4 border-b border-os-border space-y-3 bg-os-surface/40 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-os-text-muted" size={14} />
              <input
                type="text"
                placeholder="Search by name, ID, or linked entity..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-os-input-bg border border-os-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-os-text-primary focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              <span className="text-[10px] font-mono text-os-text-muted uppercase">Class:</span>
              {['ALL', 'RESTRICTED', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC'].map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClassification(cls)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors shrink-0",
                    selectedClassification === cls
                      ? "bg-indigo-600 text-white font-medium"
                      : "bg-os-surface text-os-text-secondary hover:text-os-text-primary border border-os-border"
                  )}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* List of Documents */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between gap-3",
                  selectedDoc?.id === doc.id
                    ? "bg-indigo-500/10 border-indigo-500/40 shadow-xs"
                    : "bg-os-surface/60 border-os-border hover:bg-os-surface-hover"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-os-text-primary truncate">{doc.name}</div>
                    <div className="text-[10px] text-os-text-muted flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{doc.id}</span>
                      <span>•</span>
                      <span>{doc.fileSize}</span>
                      <span>•</span>
                      <span className="font-mono text-cyan-400">{doc.version}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={cn(
                        "px-1.5 py-0.5 text-[9px] font-mono rounded border",
                        doc.classification === 'RESTRICTED' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        doc.classification === 'CONFIDENTIAL' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        doc.classification === 'INTERNAL' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        doc.classification === 'PUBLIC' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      )}>
                        {doc.classification}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-mono bg-os-surface-hover text-os-text-secondary rounded border border-os-border truncate max-w-[140px]">
                        {doc.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-emerald-400 font-medium">OCR {doc.ocrConfidence}%</div>
                  <div className="text-[9px] text-os-text-muted mt-1">{doc.uploadedAt.split(' ')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Document Inspector & OCR Extraction Detail */}
        {selectedDoc ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 custom-scrollbar bg-os-bg">
            {/* Document Header Card */}
            <div className="bg-os-surface border border-os-border rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-os-border pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-indigo-400 font-semibold">{selectedDoc.id}</span>
                    <span className="text-xs text-os-text-muted">•</span>
                    <span className="text-xs font-mono text-os-text-secondary">{selectedDoc.category}</span>
                  </div>
                  <h2 className="text-lg font-bold text-os-text-primary tracking-tight">{selectedDoc.name}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Downloaded cryptographic proof for ${selectedDoc.id}`, 'info', 'Document')}
                    className="px-3 py-1.5 text-xs bg-os-surface-hover border border-os-border hover:bg-os-border text-os-text-primary rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={13} /> Export
                  </button>
                  <button
                    onClick={() => showToast(`Document integrity verified against SHA-256 ledger.`, 'success', 'Audit')}
                    className="px-3 py-1.5 text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                  >
                    <ShieldCheck size={13} /> Verify Hash
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">Classification</div>
                  <div className="font-semibold text-rose-400 mt-0.5">{selectedDoc.classification}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">Version</div>
                  <div className="font-mono text-os-text-primary mt-0.5">{selectedDoc.version}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">File Size / Type</div>
                  <div className="text-os-text-primary mt-0.5">{selectedDoc.fileSize} ({selectedDoc.fileFormat})</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-os-text-muted uppercase">Retention Expiry</div>
                  <div className="font-mono text-os-text-primary mt-0.5">{selectedDoc.expiresAt}</div>
                </div>
              </div>
            </div>

            {/* OCR Extracted Parameters */}
            <div className="bg-os-surface border border-os-border rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-os-text-primary">OCR Extracted Metadata & Entities</h3>
                </div>
                <div className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  Confidence: {selectedDoc.ocrConfidence}%
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedDoc.extractedFields).map(([key, val]) => (
                  <div key={key} className="bg-os-surface-hover/50 border border-os-border rounded-lg p-3">
                    <div className="text-[10px] font-mono uppercase text-os-text-muted tracking-wider">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="text-sm font-mono font-medium text-cyan-300 mt-1 truncate">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity Binding & Lineage */}
            <div className="bg-os-surface border border-os-border rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-os-text-primary">Supply Chain Entity Binding</h3>
              </div>
              <p className="text-xs text-os-text-muted mb-4">
                This document is immutably linked to an active supply chain business transaction in the Orion Data Fabric.
              </p>

              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-indigo-400">Target Entity: {selectedDoc.linkedEntityType}</div>
                  <div className="text-sm font-mono font-bold text-os-text-primary mt-1">{selectedDoc.linkedEntityId}</div>
                </div>
                <button
                  onClick={() => showToast(`Navigating to ${selectedDoc.linkedEntityId} in entity graph...`, 'info', 'Graph')}
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View Entity <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            {/* Cryptographic SHA-256 Audit Seal */}
            <div className="bg-os-surface border border-os-border rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-os-text-primary">Cryptographic Integrity Seal</h3>
              </div>
              <p className="text-xs text-os-text-muted mb-3">
                SHA-256 digest generated at ingestion time. Verified against tamper attempts in the Kernel Audit ledger.
              </p>
              <div className="bg-os-input-bg border border-os-border rounded-lg p-3 font-mono text-[11px] text-os-text-secondary select-all break-all">
                {selectedDoc.sha256Hash}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-os-text-muted p-12">
            Select a document from the repository to inspect metadata and OCR extraction.
          </div>
        )}
      </div>
    </div>
  );
};
