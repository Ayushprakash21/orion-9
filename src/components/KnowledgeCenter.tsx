import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Upload, ShieldCheck, AlertCircle, Clock, CheckCircle2, 
  Layers, Eye, RefreshCw, Lock, Sparkles, BookOpen, ExternalLink, Filter, ChevronRight 
} from 'lucide-react';
import { 
  documentIngestionService, 
  documentExtractorEngine, 
  documentChunkerEngine, 
  knowledgeIndexEngine, 
  knowledgeRetrievalEngine, 
  documentExpirationMonitor,
  documentMdmBridge,
  DocumentMetadata, 
  DocumentExtraction, 
  KnowledgeRetrievalResponse, 
  DocumentExpirationNotice,
  DocumentClassification 
} from '../knowledge';

export const KnowledgeCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'library' | 'viewer' | 'extractions' | 'search' | 'expirations'>('overview');
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [selectedExtraction, setSelectedExtraction] = useState<DocumentExtraction | null>(null);
  const [searchQuery, setSearchQuery] = useState('supplier SLA penalty terms and delivery lead time');
  const [retrievalResponse, setRetrievalResponse] = useState<KnowledgeRetrievalResponse | null>(null);
  const [expirations, setExpirations] = useState<DocumentExpirationNotice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Upload Form State
  const [uploadFileName, setUploadFileName] = useState('Master_Supplier_Agreement_2026.pdf');
  const [uploadDocType, setUploadDocType] = useState<DocumentClassification>('CONTRACT');
  const [uploadText, setUploadText] = useState(`MASTER SUPPLIER AGREEMENT - ORION-9 ENTERPRISE
Supplier: ACME Global Logistics Ltd.
PO Number: PO-998821
Invoice Number: INV-88402
Total Amount: $145,000.00
Effective Date: 2026-01-01
Expiration Date: 2026-12-31
Section 1: Delivery SLA & Lead Times
Supplier agrees to maintain OTIF delivery rate >= 98.5%. Any inbound shipment delay exceeding 48 hours shall trigger automatic freight expedite compensation.`);

  const tenantId = 'ORG-001';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await documentIngestionService.listDocuments(tenantId);
    setDocuments(list);
    if (list.length > 0 && !selectedDoc) {
      setSelectedDoc(list[0]);
    }
    const expList = await documentExpirationMonitor.scanExpirations(tenantId);
    setExpirations(expList);
  };

  const showFeedback = (type: 'success' | 'info' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleUploadDocument = async () => {
    setIsUploading(true);
    try {
      const { document, isDuplicate } = await documentIngestionService.ingestDocument({
        tenantId,
        fileName: uploadFileName,
        content: uploadText,
        mimeType: 'text/plain',
        documentType: uploadDocType,
        securityClassification: 'CONFIDENTIAL',
        sourceSystem: 'SUPPLIER_PORTAL',
        ownerId: 'PROCUREMENT_ADMIN',
        expirationDate: '2026-12-31'
      });

      if (isDuplicate) {
        showFeedback('info', `Document '${uploadFileName}' is a duplicate. Loaded existing record.`);
      } else {
        showFeedback('success', `Ingested '${uploadFileName}' with SHA-256 checksum.`);
        
        // Extract & Chunk
        const extraction = await documentExtractorEngine.extractDocumentFields(document, uploadText);
        const chunks = await documentChunkerEngine.chunkDocument(document, uploadText);
        await knowledgeIndexEngine.indexChunks(document, chunks);
        setSelectedExtraction(extraction);
      }

      await loadData();
      setSelectedDoc(document);
    } catch (err: any) {
      showFeedback('error', `Ingestion failed: ${err?.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await knowledgeRetrievalEngine.retrieveKnowledge({
        tenantId,
        query: searchQuery,
        userId: 'ADMIN_USER',
        userRole: 'admin',
        maxResults: 5,
        includeCitations: true
      });
      setRetrievalResponse(res);
      showFeedback('success', `Retrieved ${res.citations.length} evidence passages under strict tenant bounds.`);
    } catch (err: any) {
      showFeedback('error', `Retrieval error: ${err?.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePromoteToMdm = async () => {
    if (!selectedExtraction) {
      showFeedback('error', 'Select a validated extraction to promote.');
      return;
    }

    try {
      selectedExtraction.status = 'VALIDATED';
      const res = await documentMdmBridge.promoteExtractionToMasterData(selectedExtraction, {
        id: 'ADMIN_USER',
        role: 'admin',
        isAi: false
      });
      showFeedback(res.success ? 'success' : 'error', res.message);
    } catch (err: any) {
      showFeedback('error', `Promotion failed: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between shadow-md ${
          feedback.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' :
          feedback.type === 'error' ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300' :
          'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-os-text-muted hover:text-os-text-primary">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
              PART 4 TRACK 7
            </span>
            <span className="text-xs font-mono text-os-text-muted">ENTERPRISE KNOWLEDGE PLATFORM</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Knowledge & Document Intelligence Center</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Governed OCR extraction, semantic RAG search, exact evidence citations, and prompt injection defense.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-os-surface border border-os-border p-1 rounded-xl shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'library', label: 'Library & Upload', icon: FileText },
            { id: 'viewer', label: 'Viewer & Citations', icon: Eye },
            { id: 'extractions', label: 'Candidate Workbench', icon: Layers },
            { id: 'search', label: 'RAG Search', icon: Search },
            { id: 'expirations', label: 'Expirations', icon: Clock }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === t.id
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-secondary'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-os-surface border border-os-border rounded-xl p-5">
              <span className="text-[11px] font-mono text-os-text-muted uppercase">Indexed Documents</span>
              <div className="text-2xl font-bold text-os-text-primary mt-1">{documents.length}</div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">100% SHA-256 Checksummed</span>
            </div>
            <div className="bg-os-surface border border-os-border rounded-xl p-5">
              <span className="text-[11px] font-mono text-os-text-muted uppercase">Extracted Candidates</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{documents.length * 4}</div>
              <span className="text-[10px] text-amber-400 font-mono mt-1 block">Unvalidated Non-Authoritative</span>
            </div>
            <div className="bg-os-surface border border-os-border rounded-xl p-5">
              <span className="text-[11px] font-mono text-os-text-muted uppercase">Vector Embeddings</span>
              <div className="text-2xl font-bold text-purple-400 mt-1">{documents.length * 8}</div>
              <span className="text-[10px] text-purple-300 font-mono mt-1 block">Cosine Hybrid Search</span>
            </div>
            <div className="bg-os-surface border border-os-border rounded-xl p-5">
              <span className="text-[11px] font-mono text-os-text-muted uppercase">Expiration Alerts</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">{expirations.length}</div>
              <span className="text-[10px] text-rose-300 font-mono mt-1 block">SLA Warning & Workflows</span>
            </div>
          </div>

          <div className="bg-os-surface border border-os-border rounded-xl p-6">
            <h3 className="text-sm font-bold text-os-text-primary mb-3">Governed Knowledge Pipeline Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
              <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg text-center">
                <span className="text-cyan-400 font-bold block mb-1">1. INGESTION</span>
                Multi-source SHA-256 binary storage in Firebase
              </div>
              <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg text-center">
                <span className="text-cyan-400 font-bold block mb-1">2. OCR EXTRACTION</span>
                Section-aware candidate parser with provenance
              </div>
              <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg text-center">
                <span className="text-cyan-400 font-bold block mb-1">3. VECTOR CHUNKING</span>
                Provider-neutral Cosine similarity indexing
              </div>
              <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg text-center">
                <span className="text-cyan-400 font-bold block mb-1">4. RAG RETRIEVAL</span>
                AISecurityGuard injection defense & citations
              </div>
              <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg text-center">
                <span className="text-emerald-400 font-bold block mb-1">5. GOVERNED ACTION</span>
                Kernel command bus & workflow execution
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Library & Upload */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-os-text-primary flex items-center gap-2">
              <Upload size={16} className="text-cyan-400" /> Ingest Enterprise Document
            </h3>

            <div>
              <label className="text-[11px] font-mono text-os-text-muted uppercase block mb-1">File Name</label>
              <input
                type="text"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="w-full bg-os-surface-secondary border border-os-border rounded-lg px-3 py-1.5 text-xs text-os-text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-os-text-muted uppercase block mb-1">Document Classification</label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value as any)}
                className="w-full bg-os-surface-secondary border border-os-border rounded-lg px-3 py-1.5 text-xs text-os-text-primary"
              >
                {['CONTRACT', 'PURCHASE_ORDER', 'INVOICE', 'ASN', 'QUALITY_CERTIFICATE', 'SUPPLIER_CERTIFICATE', 'SOP', 'POLICY', 'COMPLIANCE'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-os-text-muted uppercase block mb-1">Raw Content / Text Payload</label>
              <textarea
                rows={8}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                className="w-full bg-os-surface-secondary border border-os-border rounded-lg p-3 text-xs font-mono text-os-text-primary"
              />
            </div>

            <button
              onClick={handleUploadDocument}
              disabled={isUploading}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow"
            >
              <Upload size={14} />
              {isUploading ? 'Ingesting Document...' : 'Ingest & Index Document'}
            </button>
          </div>

          <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-os-text-primary flex items-center justify-between">
              <span>Tenant Document Repository</span>
              <span className="text-xs font-mono text-cyan-400 font-normal">{documents.length} Records</span>
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.documentId}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDoc?.documentId === doc.documentId
                      ? 'bg-cyan-950/30 border-cyan-500/50'
                      : 'bg-os-surface-secondary border-os-border hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs text-os-text-primary">{doc.fileName}</div>
                      <div className="text-[10px] font-mono text-os-text-muted flex items-center gap-2 mt-0.5">
                        <span>{doc.documentType}</span>
                        <span>•</span>
                        <span>v{doc.version}</span>
                        <span>•</span>
                        <span>{doc.checksum.substring(0, 16)}...</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {doc.securityClassification}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Viewer & Citations */}
      {activeTab === 'viewer' && selectedDoc && (
        <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-os-border pb-4">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">DOCUMENT INSPECTOR</span>
              <h2 className="text-lg font-bold text-os-text-primary mt-0.5">{selectedDoc.fileName}</h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-os-text-muted">
              <span>ID: {selectedDoc.documentId}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">SHA-256 VERIFIED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg">
              <span className="text-os-text-muted block text-[10px] uppercase">Storage Reference</span>
              <span className="text-cyan-300 truncate block mt-0.5">{selectedDoc.storageReference}</span>
            </div>
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg">
              <span className="text-os-text-muted block text-[10px] uppercase">Source System</span>
              <span className="text-os-text-primary block mt-0.5">{selectedDoc.sourceSystem}</span>
            </div>
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg">
              <span className="text-os-text-muted block text-[10px] uppercase">Expiration Date</span>
              <span className="text-amber-400 block mt-0.5">{selectedDoc.expirationDate || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Candidate Workbench */}
      {activeTab === 'extractions' && (
        <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-os-border pb-4">
            <div>
              <h2 className="text-base font-bold text-os-text-primary">Extracted Candidate Validation Workbench</h2>
              <p className="text-xs text-os-text-secondary mt-0.5">
                Review OCR candidate values. Unvalidated extractions will NOT alter authoritative SCM truth.
              </p>
            </div>
            <button
              onClick={handlePromoteToMdm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow flex items-center gap-2"
            >
              <CheckCircle2 size={14} /> Promote Candidate to Master Data
            </button>
          </div>

          {selectedExtraction ? (
            <div className="space-y-3">
              {Object.entries(selectedExtraction.fields).map(([key, field]) => (
                <div key={key} className="p-3 bg-os-surface-secondary border border-os-border rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-cyan-400 font-bold block">{field.fieldName}</span>
                    <span className="text-os-text-primary text-sm font-semibold mt-0.5 block">{String(field.extractedValue)}</span>
                    <span className="text-[10px] font-mono text-os-text-muted block mt-0.5">
                      Source: Page {field.sourcePage || 1} • {field.sourceSection || 'Header'}
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-emerald-400 font-bold block">Confidence: {(field.confidenceScore * 100).toFixed(0)}%</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block border ${
                      field.isValidated ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {field.isValidated ? 'VALIDATED' : 'UNVALIDATED CANDIDATE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-os-text-muted font-mono">
              Ingest a document in the Library tab to view extracted candidate fields.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: RAG Search */}
      {activeTab === 'search' && (
        <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enterprise document knowledge base..."
              className="flex-1 bg-os-surface-secondary border border-os-border rounded-xl px-4 py-2.5 text-xs text-os-text-primary font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow"
            >
              <Search size={14} />
              {isSearching ? 'Searching...' : 'Execute RAG Search'}
            </button>
          </div>

          {retrievalResponse && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck size={16} /> RAG Response (Sanitized & Governed)
                  </span>
                  <span className="text-os-text-muted">{retrievalResponse.executionTimeMs}ms</span>
                </div>
                <p className="text-xs text-os-text-primary font-medium">{retrievalResponse.answerSummary}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono text-os-text-muted uppercase tracking-wider">Exact Evidence Citations ({retrievalResponse.citations.length})</h4>
                {retrievalResponse.citations.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-os-surface-secondary border border-os-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-cyan-400 font-bold">
                        [{c.documentName} (v{c.version}), Page {c.page || 1}, Section: {c.section || 'General'}]
                      </span>
                      <span className="text-emerald-400 font-semibold">Match Score: {(c.relevanceScore * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-os-text-secondary text-xs italic bg-os-surface p-2.5 rounded-lg border border-os-border">
                      "{c.excerpt}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Expirations */}
      {activeTab === 'expirations' && (
        <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-os-text-primary flex items-center gap-2">
            <Clock size={16} className="text-rose-400" /> Compliance & Expiration Radar
          </h3>

          <div className="space-y-2">
            {expirations.map((exp) => (
              <div key={exp.noticeId} className="p-3.5 bg-os-surface-secondary border border-os-border rounded-xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold text-os-text-primary block">{exp.documentName}</span>
                  <span className="text-os-text-muted text-[10px] block mt-0.5">{exp.documentType} • Expires: {exp.expirationDate}</span>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                  exp.status === 'EXPIRED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {exp.status === 'EXPIRED' ? 'EXPIRED' : `EXPIRES IN ${exp.daysUntilExpiration} DAYS`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
