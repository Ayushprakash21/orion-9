/**
 * ORION-9 MASTER DATA & INTEGRATION FABRIC APPLICATION
 * macOS-inspired Desktop Window Application for Layers 6, 7 & 8:
 * - Master Data Lifecycle Management (MDM)
 * - ERP Reconciliation & Drift Detection
 * - Integration Contracts & Field Mappings
 * - ERP Entitlements & License Governance
 * - Event Fabric Stream & Time-Travel Replay
 */

import React, { useState } from 'react';
import {
  Database,
  Layers,
  GitCompare,
  Key,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  X,
  Sparkles,
  Server,
  ArrowRight,
  Info,
  Award,
  BarChart3,
  UploadCloud,
  FileText
} from 'lucide-react';
import { useMasterData } from '../data/useMasterData';
import { useIntegrationFabric } from '../integration/useIntegrationFabric';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { kernelEventBus } from '../kernel/EventBus';
import { MasterDataEntityType, MasterDataRecord } from '../data/MasterDataService';
import { MasterDataLifecycleState, SourceSystemType, DataClassification, GoldenRecord } from '../types';
import { IngestionBatchReport } from '../services/masterdata/MasterDataIngestionPipeline';

type TabType =
  | 'master_data'
  | 'golden_records'
  | 'quality'
  | 'stewardship'
  | 'ingestion'
  | 'reconciliation'
  | 'contracts'
  | 'entitlements'
  | 'event_fabric';

export const MasterDataManager: React.FC = () => {
  const { showToast } = useToast();
  const {
    records,
    goldenRecords,
    proposeRecord,
    validateRecord,
    checkDuplicates,
    submitForApproval,
    activateRecord,
    rejectRecord,
    retireRecord,
    ingestBatch
  } = useMasterData();

  const {
    contracts,
    entitlements,
    reports,
    discrepancies,
    isReconciling,
    runReconciliation,
    resolveDiscrepancy
  } = useIntegrationFabric();

  const { purchaseOrders, inventory, shipments, suppliers, products } = useSupplyChain();

  const [activeTab, setActiveTab] = useState<TabType>('master_data');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(records[0]?.id || null);
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [showNewRecordModal, setShowNewRecordModal] = useState<boolean>(false);
  const [isReplayingEvents, setIsReplayingEvents] = useState<boolean>(false);

  // Ingestion State
  const [ingestEntityType, setIngestEntityType] = useState<MasterDataEntityType>('SUPPLIER');
  const [csvContent, setCsvContent] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestionReport, setIngestionReport] = useState<IngestionBatchReport | null>(null);

  // Stewardship State
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingRecordId, setRejectingRecordId] = useState<string | null>(null);

  // New Record Form State
  const [newEntityType, setNewEntityType] = useState<MasterDataEntityType>('PRODUCT');
  const [newEntityId, setNewEntityId] = useState<string>('');
  const [newEntityName, setNewEntityName] = useState<string>('');
  const [newEntityCategory, setNewEntityCategory] = useState<string>('Mechanical Components');
  const [newEntityCost, setNewEntityCost] = useState<number>(120);
  const [newEntityPrice, setNewEntityPrice] = useState<number>(240);
  const [newEntityLeadTime, setNewEntityLeadTime] = useState<number>(14);
  const [newSourceSystem, setNewSourceSystem] = useState<SourceSystemType>('SAP');
  const [newClassification, setNewClassification] = useState<DataClassification>('CONFIDENTIAL');

  const selectedRecord = records.find(r => r.id === selectedRecordId) || records[0];

  const filteredRecords = records.filter(r => {
    if (entityFilter !== 'ALL' && r.entityType !== entityFilter) return false;
    if (stateFilter !== 'ALL' && r.state !== stateFilter) return false;
    return true;
  });

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityId.trim() || !newEntityName.trim()) {
      showToast('Please enter both an identifier and name for the master record.', 'error', 'Validation Error');
      return;
    }

    let data: Record<string, any>;
    switch (newEntityType) {
      case 'PRODUCT':
        data = {
          id: newEntityId.trim(),
          name: newEntityName.trim(),
          category: newEntityCategory,
          unitCost: newEntityCost,
          sellingPrice: newEntityPrice,
          leadTime: newEntityLeadTime,
          safetyStock: 25,
          reorderPoint: 40,
          uom: 'EA',
          status: 'PENDING'
        };
        break;
      case 'SUPPLIER':
        data = {
          id: newEntityId.trim(),
          name: newEntityName.trim(),
          category: newEntityCategory,
          region: 'North America',
          otif: 95.0,
          qualityRate: 98.0,
          leadTime: newEntityLeadTime,
          defectRate: 1.2,
          spend: 0,
          status: 'PENDING'
        };
        break;
      case 'CUSTOMER':
        data = {
          id: newEntityId.trim(),
          name: newEntityName.trim(),
          customerGroup: 'Enterprise Tier 1',
          currency: 'USD',
          creditLimit: 500000,
          paymentTerms: 'NET30',
          status: 'ACTIVE'
        };
        break;
      case 'LOCATION':
        data = {
          id: newEntityId.trim(),
          name: newEntityName.trim(),
          locationType: 'FACILITY',
          hierarchyPath: `/ENT-01/${newEntityId.trim()}`,
          country: 'US',
          status: 'ACTIVE'
        };
        break;
      case 'WAREHOUSE':
        data = {
          id: newEntityId.trim(),
          name: newEntityName.trim(),
          facilityType: 'DISTRIBUTION_CENTER',
          totalCapacitySqFt: 100000,
          operatingStatus: 'OPERATIONAL'
        };
        break;
      case 'STORAGE_LOCATION':
        data = {
          id: newEntityId.trim(),
          name: newEntityName.trim(),
          warehouseId: 'WH-CENTRAL-01',
          zone: 'ZONE-A',
          aisle: '01',
          shelf: '02',
          bin: '03'
        };
        break;
      case 'UOM':
        data = {
          id: newEntityId.trim(),
          code: newEntityId.trim().toUpperCase(),
          name: newEntityName.trim(),
          category: 'COUNT',
          baseUnit: true,
          conversionFactor: 1.0
        };
        break;
      case 'CURRENCY':
        data = {
          id: newEntityId.trim(),
          code: newEntityId.trim().toUpperCase(),
          name: newEntityName.trim(),
          symbol: '$',
          decimalPlaces: 2,
          baseCurrency: newEntityId.trim().toUpperCase() === 'USD'
        };
        break;
      case 'PAYMENT_TERMS':
        data = {
          id: newEntityId.trim(),
          code: newEntityId.trim().toUpperCase(),
          name: newEntityName.trim(),
          netDays: 30,
          discountDays: 10,
          discountPercentage: 2.0
        };
        break;
      case 'TAX_CLASSIFICATION':
        data = {
          id: newEntityId.trim(),
          taxCode: newEntityId.trim().toUpperCase(),
          description: newEntityName.trim(),
          rate: 8.25,
          country: 'US'
        };
        break;
      case 'RELATIONSHIP':
      default:
        data = {
          id: newEntityId.trim(),
          supplierId: 'SUP-001',
          productId: newEntityId.trim(),
          supplierPartNumber: newEntityName.trim(),
          leadTimeDays: newEntityLeadTime,
          unitPrice: newEntityCost,
          currency: 'USD'
        };
        break;
    }

    const newRec = proposeRecord({
      entityType: newEntityType,
      data,
      sourceSystemType: newSourceSystem,
      sourceSystemId: `${newSourceSystem}-${Date.now().toString(36)}`,
      classification: newClassification,
      actor: 'System Admin'
    });

    setShowNewRecordModal(false);
    setSelectedRecordId(newRec.id);
    showToast(`Master data record ${newRec.id} proposed in DRAFT state.`, 'success', 'Record Proposed');

    // Reset form
    setNewEntityId('');
    setNewEntityName('');
  };

  const handleValidate = (record: MasterDataRecord) => {
    const res = validateRecord(record.id, 'System Operator');
    if (res.isValid) {
      showToast(`Record ${record.id} passed all schema and semantic checks. State updated to VALIDATED.`, 'success', 'Validation Passed');
    } else {
      showToast(`Record ${record.id} failed validation: ${res.errors.join('; ')}`, 'error', 'Validation Failed');
    }
  };

  const handleCheckDuplicates = (record: MasterDataRecord) => {
    const existingPool = record.entityType === 'PRODUCT'
      ? products.map(p => ({ id: p.id, name: p.name }))
      : suppliers.map(s => ({ id: s.id, name: s.name }));

    const matches = checkDuplicates(record.id, existingPool, 'System Operator');
    if (matches.length > 0) {
      showToast(`Duplicate check complete: Found ${matches.length} potential collision(s).`, 'warning', 'Duplicate Warning');
    } else {
      showToast(`Zero duplicate collisions detected. State updated to DUPLICATE_CHECKED.`, 'success', 'Clean Duplicate Scan');
    }
  };

  const handleSubmitForApproval = (record: MasterDataRecord) => {
    try {
      submitForApproval(record.id, 'System Operator');
      showToast(`Record ${record.id} submitted for governance sign-off in Approval Center.`, 'info', 'Approval Requested');
    } catch (err: any) {
      showToast(err.message || 'Cannot submit record.', 'error', 'Submission Blocked');
    }
  };

  const handleActivate = (record: MasterDataRecord) => {
    activateRecord(record.id, 'Principal Architect', 'Authorized for enterprise operational dispatch');
    showToast(`Record ${record.id} activated! State promoted to ACTIVE.`, 'success', 'Master Data Activated');
  };

  const handleRunReconciliation = async () => {
    showToast('Executing bidirectional reconciliation across SAP S/4HANA and Oracle Cloud...', 'info', 'Reconciliation Running');
    await runReconciliation({
      sourceSystem: 'SAP',
      purchaseOrders,
      inventory,
      shipments,
      suppliers,
      actor: 'Enterprise Sync Agent'
    });
    showToast('Reconciliation complete! Audit log and discrepancies updated.', 'success', 'Reconciliation Finished');
  };

  const handleResolveDiscrepancy = (id: string, strategy: 'ALIGN_TO_ORION' | 'ALIGN_TO_ERP' | 'DISMISS') => {
    resolveDiscrepancy(id, strategy, 'Operations Lead');
    showToast(`Discrepancy ${id} resolved with strategy: ${strategy}`, 'success', 'Discrepancy Resolved');
  };

  const handleReplayEvents = async () => {
    if (isReplayingEvents) return;
    setIsReplayingEvents(true);
    showToast('Initiating Event Fabric replay sequence...', 'info', 'Replay Started');
    try {
      const res = await kernelEventBus.replayEvents({ delayMs: 150 });
      showToast(`Successfully replayed ${res.replayedCount} events sequentially across Event Fabric.`, 'success', 'Replay Complete');
    } finally {
      setIsReplayingEvents(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117] text-white overflow-hidden font-sans">
      {/* App Header & KPI Bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#161B22]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Data & Integration Fabric
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Layers 6, 7 & 8
                </span>
              </h1>
              <p className="text-xs text-white/50">
                Master Data Lifecycle, ERP Integration Contracts, State Reconciliation & Event Fabric Replay
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewRecordModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
          >
            <Plus size={14} />
            <span>Propose Master Record</span>
          </button>
          <button
            onClick={handleRunReconciliation}
            disabled={isReconciling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition disabled:opacity-50"
          >
            <GitCompare size={14} className={isReconciling ? 'animate-spin' : ''} />
            <span>{isReconciling ? 'Auditing...' : 'Run ERP Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 border-b border-white/5 bg-[#12161D]">
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Master Data Records</span>
            <div className="text-xl font-bold text-white mt-0.5">{records.length}</div>
          </div>
          <Layers size={20} className="text-indigo-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Pending Governance</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {records.filter(r => r.state === 'APPROVAL_PENDING').length}
            </div>
          </div>
          <Clock size={20} className="text-amber-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">ERP State Discrepancies</span>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{discrepancies.length}</div>
          </div>
          <AlertTriangle size={20} className="text-rose-400 opacity-60" />
        </div>
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Active ERP Entitlements</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{entitlements.length} Systems</div>
          </div>
          <Key size={20} className="text-emerald-400 opacity-60" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 border-b border-white/10 bg-[#161B22]/50 flex items-center gap-6 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('master_data')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'master_data'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Database size={14} />
          <span>Master Catalog</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] text-white/70">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('golden_records')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'golden_records'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Award size={14} />
          <span>Golden Records</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
            {goldenRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'quality'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <BarChart3 size={14} />
          <span>Data Quality Diagnostics</span>
        </button>

        <button
          onClick={() => setActiveTab('stewardship')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stewardship'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Stewardship Queue</span>
          {records.filter(r => r.state === 'APPROVAL_PENDING' || r.state === 'REVIEW_REQUIRED').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
              {records.filter(r => r.state === 'APPROVAL_PENDING' || r.state === 'REVIEW_REQUIRED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ingestion')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ingestion'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <UploadCloud size={14} />
          <span>Batch Ingestion</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reconciliation'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <GitCompare size={14} />
          <span>ERP Reconciliation & Drift</span>
          {discrepancies.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
              {discrepancies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'contracts'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Integration Contracts ({contracts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('entitlements')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'entitlements'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Key size={14} />
          <span>ERP Entitlements</span>
        </button>

        <button
          onClick={() => setActiveTab('event_fabric')}
          className={`py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'event_fabric'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Radio size={14} />
          <span>Event Fabric & Replay</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* TAB 1: MASTER DATA LIFECYCLE */}
        {activeTab === 'master_data' && (
          <div className="h-full flex divide-x divide-white/10">
            {/* Left Sidebar: Master Data Records List */}
            <div className="w-1/3 min-w-[340px] max-w-[440px] h-full flex flex-col bg-[#12161D]">
              {/* Filter controls */}
              <div className="p-3 border-b border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Filter size={12} /> Filter Records
                  </span>
                  <span>{filteredRecords.length} items</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={entityFilter}
                    onChange={e => setEntityFilter(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Entities</option>
                    <option value="PRODUCT">Product</option>
                    <option value="SUPPLIER">Supplier</option>
                    <option value="FACILITY">Facility</option>
                  </select>
                  <select
                    value={stateFilter}
                    onChange={e => setStateFilter(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All States</option>
                    <option value="DRAFT">Draft</option>
                    <option value="VALIDATED">Validated</option>
                    <option value="DUPLICATE_CHECKED">Duplicate Checked</option>
                    <option value="APPROVAL_PENDING">Approval Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>

              {/* Records Scroll List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40">
                    No master data records matching filter criteria.
                  </div>
                ) : (
                  filteredRecords.map(record => {
                    const isSelected = record.id === selectedRecordId;
                    return (
                      <div
                        key={record.id}
                        onClick={() => setSelectedRecordId(record.id)}
                        className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600/15 border-l-2 border-indigo-400'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-medium text-white/90">
                            {record.data?.id || record.id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              record.state === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : record.state === 'APPROVAL_PENDING'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : record.state === 'DRAFT'
                                ? 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {record.state}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-white/70 truncate">
                          {record.data?.name || 'Unnamed Entity'}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                          <span className="flex items-center gap-1">
                            <Server size={11} /> {record.sourceSystemType}
                          </span>
                          <span className="font-mono text-[10px] uppercase">
                            {record.classification}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Main Pane: Master Data Record Detail Inspector */}
            <div className="flex-1 h-full overflow-y-auto p-6 bg-[#0D1117] space-y-6">
              {selectedRecord ? (
                <>
                  {/* Top Details & Lifecycle State Progression Bar */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-indigo-400 font-semibold">
                            {selectedRecord.id}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                            v{selectedRecord.version}.0
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                            {selectedRecord.classification}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white mt-1">
                          {selectedRecord.data?.name || 'Master Record'}
                        </h2>
                      </div>

                      {/* State badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            selectedRecord.state === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : selectedRecord.state === 'APPROVAL_PENDING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {selectedRecord.state}
                        </span>
                      </div>
                    </div>

                    {/* Step Progression Bar */}
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                        Master Data Lifecycle Pipeline
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        {[
                          { state: 'DRAFT', label: '1. Create (Draft)' },
                          { state: 'VALIDATED', label: '2. Validated' },
                          { state: 'DUPLICATE_CHECKED', label: '3. Duplicate Check' },
                          { state: 'APPROVAL_PENDING', label: '4. Governance' },
                          { state: 'ACTIVE', label: '5. Active Pool' }
                        ].map((step, idx) => {
                          const stateWeights: Record<string, number> = {
                            DRAFT: 1,
                            VALIDATED: 2,
                            DUPLICATE_CHECKED: 3,
                            APPROVAL_PENDING: 4,
                            ACTIVE: 5,
                            RETIRED: 6
                          };
                          const currentWeight = stateWeights[selectedRecord.state] || 1;
                          const stepWeight = idx + 1;
                          const isDone = currentWeight >= stepWeight;
                          const isCurrent = currentWeight === stepWeight;

                          return (
                            <div
                              key={step.state}
                              className={`p-2.5 rounded-lg border text-xs font-medium transition ${
                                isCurrent
                                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                  : isDone
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-white/[0.02] border-white/5 text-white/40'
                              }`}
                            >
                              {step.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Lifecycle Action Triggers */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleValidate(selectedRecord)}
                        className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={13} className="text-blue-400" />
                        <span>Run Validation</span>
                      </button>

                      <button
                        onClick={() => handleCheckDuplicates(selectedRecord)}
                        className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition flex items-center gap-1.5"
                      >
                        <Sparkles size={13} className="text-purple-400" />
                        <span>Scan Duplicates</span>
                      </button>

                      {selectedRecord.state !== 'ACTIVE' && selectedRecord.state !== 'APPROVAL_PENDING' && (
                        <button
                          onClick={() => handleSubmitForApproval(selectedRecord)}
                          className="px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/40 transition flex items-center gap-1.5"
                        >
                          <ShieldCheck size={13} />
                          <span>Request Approval</span>
                        </button>
                      )}

                      {selectedRecord.state !== 'ACTIVE' && (
                        <button
                          onClick={() => handleActivate(selectedRecord)}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Check size={13} />
                          <span>Approve & Activate</span>
                        </button>
                      )}

                      {selectedRecord.state === 'ACTIVE' && (
                        <button
                          onClick={() => retireRecord(selectedRecord.id, 'System Operator', 'Decommissioned by governance directive')}
                          className="px-3 py-1.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition flex items-center gap-1.5"
                        >
                          <X size={13} />
                          <span>Retire Record</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Entity Attributes Grid */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Canonical Attributes & Properties
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {Object.entries(selectedRecord.data || {}).map(([key, value]) => (
                        <div key={key} className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-[10px] text-white/40 uppercase font-mono">{key}</span>
                          <div className="text-white font-medium mt-0.5 break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duplicate Collisions Check Panel */}
                  {selectedRecord.duplicateMatches.length > 0 && (
                    <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                        <AlertTriangle size={15} />
                        <span>Duplicate Collisions Detected ({selectedRecord.duplicateMatches.length})</span>
                      </div>
                      <div className="divide-y divide-amber-500/15 text-xs">
                        {selectedRecord.duplicateMatches.map((match, i) => (
                          <div key={i} className="py-2 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{match.existingName}</div>
                              <div className="text-[11px] text-white/50">{match.reason}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                              {(match.matchScore * 100).toFixed(0)}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit & Lifecycle History Chain */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Lifecycle Audit History
                    </h3>
                    <div className="space-y-2">
                      {selectedRecord.history.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs p-2.5 rounded bg-white/[0.01]">
                          <div className="p-1 rounded bg-white/10 text-white/60 mt-0.5">
                            <Clock size={12} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">
                                {h.fromState} <ArrowRight size={11} className="inline mx-1 text-white/40" /> {h.toState}
                              </span>
                              <span className="text-[10px] text-white/40">
                                {new Date(h.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-white/60 text-[11px] mt-0.5">
                              Actor: <span className="text-indigo-300">{h.actor}</span>
                              {h.comment && ` • "${h.comment}"`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-white/40 text-xs">
                  Select a master data record to inspect.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RECONCILIATION & DRIFT */}
        {activeTab === 'reconciliation' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header banner */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-blue-900/20 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Bidirectional State Reconciliation Engine
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Continually compares Orion-9 internal state against SAP S/4HANA and Oracle Cloud SCM snapshots.
                </p>
              </div>
              <button
                onClick={handleRunReconciliation}
                disabled={isReconciling}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
              >
                <GitCompare size={14} className={isReconciling ? 'animate-spin' : ''} />
                <span>{isReconciling ? 'Auditing Enterprise State...' : 'Trigger Full Audit'}</span>
              </button>
            </div>

            {/* Open Discrepancies Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Active State Discrepancies ({discrepancies.length})
                </h4>
                <span className="text-xs text-white/40">Requires operator alignment or auto-sync</span>
              </div>

              {discrepancies.length === 0 ? (
                <div className="p-8 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                  <div className="text-sm font-medium text-emerald-300">Enterprise In Full Sync</div>
                  <div className="text-xs text-white/50">Zero status, quantity, or price drift detected across ERP systems.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discrepancies.map(disc => (
                    <div
                      key={disc.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-medium text-indigo-400">
                            {disc.entityId} ({disc.entityType})
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              disc.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {disc.severity} DRIFT
                          </span>
                        </div>

                        <div className="text-xs text-white font-medium">
                          {disc.suggestedResolution}
                        </div>

                        {/* Value comparison strip */}
                        <div className="grid grid-cols-2 gap-2 p-2 rounded bg-black/40 border border-white/5 text-xs">
                          <div>
                            <span className="text-[10px] text-white/40 uppercase">Orion State</span>
                            <div className="font-semibold text-white mt-0.5">
                              {disc.field}: <span className="text-indigo-300">{String(disc.orionValue)}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-white/40 uppercase">{disc.sourceSystem} State</span>
                            <div className="font-semibold text-white mt-0.5">
                              {disc.field}: <span className="text-emerald-300">{String(disc.externalValue)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resolution Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleResolveDiscrepancy(disc.id, 'DISMISS')}
                          className="px-2.5 py-1 text-xs rounded hover:bg-white/10 text-white/60 transition"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleResolveDiscrepancy(disc.id, 'ALIGN_TO_ORION')}
                          className="px-2.5 py-1 text-xs rounded bg-white/10 hover:bg-white/15 text-white font-medium border border-white/10 transition"
                        >
                          Push Orion to ERP
                        </button>
                        <button
                          onClick={() => handleResolveDiscrepancy(disc.id, 'ALIGN_TO_ERP')}
                          className="px-2.5 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition shadow-sm"
                        >
                          Align to ERP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reconciliation Run Reports History */}
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Reconciliation Execution Reports
              </h4>
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.01] overflow-hidden">
                {reports.map(rep => (
                  <div key={rep.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                        <GitCompare size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          <span>{rep.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">
                            {rep.sourceSystem}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/40">
                          {rep.recordsChecked} checked • {rep.discrepancyCount} discrepancies flagged • Operator: {rep.reconciledBy}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium text-[11px]">
                        {rep.status}
                      </span>
                      <div className="text-[10px] text-white/40 mt-1">
                        {new Date(rep.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INTEGRATION CONTRACTS */}
        {activeTab === 'contracts' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Enterprise Integration Contracts</h3>
              <p className="text-xs text-white/60 mt-0.5">
                Formal canonical ↔ ERP mapping schemas, field transformations, and validation rules.
              </p>
            </div>

            <div className="space-y-4">
              {contracts.map(contract => (
                <div key={contract.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400 font-semibold">{contract.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">
                          v{contract.version}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {contract.direction}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{contract.name}</h4>
                    </div>
                    <span className="text-xs font-mono text-white/40">
                      {contract.sourceSystem} ({contract.sourceSystemVersion})
                    </span>
                  </div>

                  {/* Mapping Schema Table */}
                  <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
                    <div className="grid grid-cols-4 p-2.5 bg-white/5 font-semibold text-white/60 text-[11px] uppercase">
                      <div>ERP Source Field</div>
                      <div>Orion Canonical Field</div>
                      <div>Transformation Rule</div>
                      <div>Notes / Constraints</div>
                    </div>
                    <div className="divide-y divide-white/5 bg-black/20">
                      {contract.mappings.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-4 p-2.5 text-white/80 items-center">
                          <div className="font-mono text-indigo-300">{m.sourceField}</div>
                          <div className="font-mono text-emerald-300">{m.orionField}</div>
                          <div>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono">
                              {m.rule}
                            </span>
                          </div>
                          <div className="text-white/50 text-[11px] truncate">
                            {m.notes || (m.required ? 'Mandatory' : 'Optional')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ERP ENTITLEMENTS */}
        {activeTab === 'entitlements' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">ERP Entitlements & License Governance</h3>
              <p className="text-xs text-white/60 mt-0.5">
                Active customer ERP instances, module subscriptions, and daily throughput usage quotas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entitlements.map(ent => {
                const usagePercent = Math.round((ent.usedTransactionsToday / ent.maxTransactionsPerDay) * 100);
                return (
                  <div key={ent.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-indigo-400 font-semibold">{ent.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                            {ent.connectorStatus}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                            {ent.environment}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{ent.erpSystem}</h4>
                        <div className="text-xs text-white/50">{ent.customerName} • {ent.erpVersion}</div>
                      </div>
                      <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                        {ent.licenseTier}
                      </span>
                    </div>

                    {/* Module badges */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40 uppercase font-medium">Licensed Modules</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ent.licensedModules.map(mod => (
                          <span key={mod} className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/5">
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Daily API Transactions</span>
                        <span className="font-mono text-white font-medium">
                          {ent.usedTransactionsToday.toLocaleString()} / {ent.maxTransactionsPerDay.toLocaleString()} ({usagePercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                      <span>Last Handshake: {new Date(ent.lastHandshake).toLocaleTimeString()}</span>
                      <span>Expires: {new Date(ent.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: EVENT FABRIC & REPLAY */}
        {activeTab === 'event_fabric' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Layer 6 Event Fabric & Replay Engine</h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Immutable event stream with correlation IDs, causation tracing, and time-travel replay.
                </p>
              </div>
              <button
                onClick={handleReplayEvents}
                disabled={isReplayingEvents}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                <Play size={14} className={isReplayingEvents ? 'animate-spin' : ''} />
                <span>{isReplayingEvents ? 'Replaying Events...' : 'Trigger Event Replay'}</span>
              </button>
            </div>

            {/* Event History List */}
            <div className="rounded-xl border border-white/10 bg-[#12161D] overflow-hidden divide-y divide-white/5">
              {kernelEventBus.getHistory().slice(-20).reverse().map((evt, idx) => (
                <div key={idx} className="p-3.5 flex items-start justify-between text-xs hover:bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 mt-0.5">
                      <Radio size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">{evt.eventType}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-mono">
                          {evt.classification}
                        </span>
                        {evt.isReplay && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                            REPLAY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/50 font-mono">
                        Correlation: {evt.correlationId} • Source: {evt.source}
                      </div>
                      <div className="text-[11px] text-white/70">
                        Payload: <span className="font-mono text-[10px] text-white/50">{JSON.stringify(evt.payload).substring(0, 100)}...</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-white/40">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: GOLDEN RECORDS */}
        {activeTab === 'golden_records' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Consolidated Golden Records (Single Source of Truth)
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Authoritative multi-system consolidated records, reconciled cross-system provenance, and lineage.
                </p>
              </div>
              <div className="text-xs text-white/60 font-mono">
                Total Golden Records: <span className="text-amber-400 font-bold">{goldenRecords.length}</span>
              </div>
            </div>

            {goldenRecords.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <Award size={36} className="text-white/20 mx-auto" />
                <div className="text-sm font-medium text-white/70">No Golden Records Generated Yet</div>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  Master data records are consolidated into authoritative Golden Records automatically upon approval and activation in the stewardship pipeline.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goldenRecords.map(gold => (
                  <div key={gold.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400">{gold.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                            {gold.entityType}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                            v{gold.version}.0
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1">
                          {gold.canonicalData?.legalName || gold.canonicalData?.name || gold.canonicalId}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-emerald-400">{gold.qualityScore}%</div>
                        <div className="text-[10px] text-white/40">Quality Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] p-2.5 rounded bg-white/[0.02] border border-white/5">
                      <div>
                        <span className="text-white/40 block">Confidence</span>
                        <span className="text-white font-mono">{Math.round(gold.confidenceScore * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Source Records</span>
                        <span className="text-white font-mono">{gold.sourceRecords.length} Systems</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Tenant</span>
                        <span className="text-white font-mono truncate block">{gold.tenantId}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-white/60">
                      <span className="text-white/40 block mb-1">Source Feeds & Systems:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {gold.sourceRecords.map((src, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                            {src.sourceSystem}: {src.sourceRecordId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: DATA QUALITY DIAGNOSTICS */}
        {activeTab === 'quality' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />
                Explainable 7-Dimension Master Data Quality Diagnostics
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Deterministic mathematical scoring across Completeness, Validity, Consistency, Uniqueness, Referential Integrity, Freshness, and Provenance.
              </p>
            </div>

            {selectedRecord?.qualityScore ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {selectedRecord.qualityScore.overallScore}%
                    </div>
                    <div className="text-[11px] text-white/50 uppercase mt-0.5">Composite Quality Score</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-indigo-400">
                      {selectedRecord.qualityScore.dimensions.completeness.score}%
                    </div>
                    <div className="text-[11px] text-white/50 uppercase mt-0.5">Completeness (20%)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-blue-400">
                      {selectedRecord.qualityScore.dimensions.validity.score}%
                    </div>
                    <div className="text-[11px] text-white/50 uppercase mt-0.5">Validity (20%)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                    <div className="text-2xl font-bold font-mono text-purple-400">
                      {selectedRecord.qualityScore.dimensions.uniqueness.score}%
                    </div>
                    <div className="text-[11px] text-white/50 uppercase mt-0.5">Uniqueness (15%)</div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#12161D] p-5 space-y-4">
                  <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Dimension Diagnostics for {selectedRecord.id}
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(selectedRecord.qualityScore.dimensions).map(([dim, details]) => (
                      <div key={dim} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white capitalize">{dim} (Weight: {details.weight}%)</span>
                          <span className="font-mono font-bold text-white">{details.score}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              details.score >= 90 ? 'bg-emerald-400' : details.score >= 70 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${details.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-white/50">{details.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/10">
                <p className="text-xs text-white/50">Select a record in the Master Catalog to inspect its 7-dimension quality score.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: STEWARDSHIP QUEUE */}
        {activeTab === 'stewardship' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-400" />
                  Master Data Stewardship Governance Queue
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Governed Human-in-the-Loop review for pending proposals, anomaly remediations, and duplicate resolutions.
                </p>
              </div>
              <div className="text-xs font-mono text-white/60">
                Awaiting Sign-off: <span className="text-amber-400 font-bold">
                  {records.filter(r => r.state === 'APPROVAL_PENDING' || r.state === 'REVIEW_REQUIRED').length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {records.filter(r => r.state === 'APPROVAL_PENDING' || r.state === 'REVIEW_REQUIRED' || r.state === 'VALIDATION_PENDING').length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                  <div className="text-sm font-medium text-white/70">Governance Queue Clean</div>
                  <p className="text-xs text-white/40">Zero master data records currently require stewardship intervention.</p>
                </div>
              ) : (
                records
                  .filter(r => r.state === 'APPROVAL_PENDING' || r.state === 'REVIEW_REQUIRED' || r.state === 'VALIDATION_PENDING')
                  .map(rec => (
                    <div key={rec.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{rec.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/70">
                            {rec.entityType}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
                            {rec.state}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white">
                          {rec.data?.legalName || rec.data?.name || 'Unnamed Entity'}
                        </h4>
                        <div className="text-xs text-white/50">
                          Proposed by: <span className="text-white/80">{rec.createdBy}</span> via <span className="font-mono">{rec.sourceSystemType}</span>
                        </div>
                        {rec.validationErrors.length > 0 && (
                          <div className="text-xs text-rose-400 pt-1">
                            ⚠️ {rec.validationErrors.join('; ')}
                          </div>
                        )}
                        {rec.duplicateMatches.length > 0 && (
                          <div className="text-xs text-amber-400 pt-0.5">
                            🔍 {rec.duplicateMatches.length} duplicate candidate(s) flagged for review.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setRejectingRecordId(rec.id);
                            setRejectReason('');
                          }}
                          className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            activateRecord(rec.id, 'Principal MDM Steward', 'Approved for production use');
                            showToast(`Master record ${rec.id} approved and promoted to ACTIVE.`, 'success', 'Record Approved');
                          }}
                          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow"
                        >
                          Approve & Activate
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* TAB 9: BATCH INGESTION */}
        {activeTab === 'ingestion' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <UploadCloud size={18} className="text-indigo-400" />
                  Master Data Batch Ingestion Pipeline
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  11-stage ingestion engine: Normalization, Schema Validation, Deduplication, and Quality Scoring.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-white/60 font-medium">Target Entity:</label>
                  <select
                    value={ingestEntityType}
                    onChange={e => setIngestEntityType(e.target.value as MasterDataEntityType)}
                    className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SUPPLIER">Supplier Master</option>
                    <option value="PRODUCT">Product Master</option>
                    <option value="CUSTOMER">Customer Master</option>
                    <option value="LOCATION">Location Master</option>
                    <option value="UOM">Unit of Measure (UOM)</option>
                    <option value="CURRENCY">Currency Master</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (ingestEntityType === 'SUPPLIER') {
                        setCsvContent(
                          `supplierCode,legalName,country,paymentTerms,currency\nSUP-ACME-01,Acme Industrial Components Inc,US,NET30,USD\nSUP-NIPPON-02,Nippon Precision Optics Co,JP,NET60,JPY`
                        );
                      } else {
                        setCsvContent(
                          `productCode,name,category,baseUom,unitCost,sellingPrice\nSKU-SENS-101,Fiber Optic Multi-Channel Sensor,Electronics,EA,85.00,165.00\nSKU-VALVE-202,High-Pressure Cryogenic Valve,Mechanical,EA,340.00,620.00`
                        );
                      }
                      showToast('Sample CSV template populated.', 'info', 'Template Loaded');
                    }}
                    className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
                  >
                    Load Sample CSV
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 font-medium block mb-1">CSV Data Input</label>
                <textarea
                  rows={6}
                  placeholder="Paste CSV records with headers (e.g. supplierCode, legalName, country, paymentTerms, currency)..."
                  value={csvContent}
                  onChange={e => setCsvContent(e.target.value)}
                  className="w-full bg-[#0D1117] border border-white/10 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  disabled={isIngesting || !csvContent.trim()}
                  onClick={async () => {
                    setIsIngesting(true);
                    try {
                      const lines = csvContent.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
                      if (lines.length < 2) {
                        showToast('CSV must include a header line and at least one data row.', 'error', 'Invalid CSV');
                        return;
                      }
                      const headers = lines[0].split(',').map(h => h.trim());
                      const records = lines.slice(1).map((line, idx) => {
                        const values = line.split(',').map(v => v.trim());
                        const payload: Record<string, any> = {};
                        headers.forEach((h, i) => { payload[h] = values[i]; });
                        return {
                          rawId: `CSV-ROW-${idx + 1}`,
                          sourceSystemType: 'ORION_INTERNAL' as SourceSystemType,
                          sourceRecordId: `CSV-${Date.now().toString(36)}-${idx + 1}`,
                          payload,
                        };
                      });

                      const report = await ingestBatch({
                        tenantId: 'ORG-DEFAULT',
                        entityType: ingestEntityType,
                        records,
                        actor: 'System Admin',
                        autoApproveClean: false,
                      });

                      setIngestionReport(report);
                      showToast(`Ingestion complete! ${report.succeeded} succeeded, ${report.needsReview} require review.`, 'success', 'Batch Processed');
                    } catch (err: any) {
                      showToast(err.message || 'Ingestion failed.', 'error', 'Pipeline Error');
                    } finally {
                      setIsIngesting(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Play size={14} className={isIngesting ? 'animate-spin' : ''} />
                  <span>{isIngesting ? 'Executing Pipeline...' : 'Run Ingestion Pipeline'}</span>
                </button>
              </div>
            </div>

            {ingestionReport && (
              <div className="rounded-xl border border-white/10 bg-[#12161D] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Batch Execution Report: {ingestionReport.jobId}</h4>
                    <p className="text-xs text-white/50">{ingestionReport.summary}</p>
                  </div>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      ✓ {ingestionReport.succeeded} Passed
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      ⚠️ {ingestionReport.needsReview} Review
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
                      ✗ {ingestionReport.rejected} Rejected
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/5 text-white/40 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="py-2">Row</th>
                        <th className="py-2">Identifier</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Quality</th>
                        <th className="py-2">Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ingestionReport.recordResults.map(r => (
                        <tr key={r.rowNumber} className="hover:bg-white/[0.02]">
                          <td className="py-2 font-mono text-white/50">#{r.rowNumber}</td>
                          <td className="py-2 font-mono font-medium text-white">{r.entityId}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              r.status === 'SUCCEEDED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : r.status === 'NEEDS_REVIEW'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2 font-mono">{r.qualityScore.overallScore}%</td>
                          <td className="py-2 text-white/60">
                            {r.errors.length > 0 ? r.errors.join('; ') : 'All validation and deduplication checks passed.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Reject Stewardship Record */}
      {rejectingRecordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#161B22] border border-white/10 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <X size={16} className="text-rose-400" />
              Reject Master Data Record
            </h3>
            <p className="text-xs text-white/60">
              Provide an auditable reason for rejecting record <span className="font-mono text-white">{rejectingRecordId}</span>.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Duplicate supplier code; invalid tax registration format..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingRecordId(null)}
                className="px-3 py-1.5 rounded text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim()}
                onClick={() => {
                  rejectRecord(rejectingRecordId, 'Principal MDM Steward', rejectReason.trim());
                  showToast(`Record ${rejectingRecordId} rejected.`, 'info', 'Record Rejected');
                  setRejectingRecordId(null);
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Propose Master Data Record */}
      {showNewRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#161B22] border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Database size={16} className="text-indigo-400" />
                Propose New Master Data Record
              </h3>
              <button
                onClick={() => setShowNewRecordModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 font-medium block mb-1">Entity Type</label>
                  <select
                    value={newEntityType}
                    onChange={e => setNewEntityType(e.target.value as MasterDataEntityType)}
                    className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PRODUCT">Product Master</option>
                    <option value="SUPPLIER">Supplier Master</option>
                    <option value="CUSTOMER">Customer Master</option>
                    <option value="LOCATION">Location Hierarchy</option>
                    <option value="WAREHOUSE">Warehouse Master</option>
                    <option value="STORAGE_LOCATION">Storage Location (Bin)</option>
                    <option value="UOM">Unit of Measure (UOM)</option>
                    <option value="CURRENCY">Currency Master</option>
                    <option value="PAYMENT_TERMS">Payment Terms</option>
                    <option value="TAX_CLASSIFICATION">Tax Classification</option>
                    <option value="RELATIONSHIP">Partner / Product Relationship</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/60 font-medium block mb-1">Source System</label>
                  <select
                    value={newSourceSystem}
                    onChange={e => setNewSourceSystem(e.target.value as SourceSystemType)}
                    className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SAP">SAP S/4HANA</option>
                    <option value="ORACLE">Oracle Fusion</option>
                    <option value="NETSUITE">NetSuite ERP</option>
                    <option value="MANUAL">Manual Entry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-white/60 font-medium block mb-1">Unique Identifier / SKU</label>
                <input
                  type="text"
                  placeholder="e.g. SKU-TITAN-MOD2 or SUP-099"
                  value={newEntityId}
                  onChange={e => setNewEntityId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-white/60 font-medium block mb-1">Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. High Precision Servo Actuator"
                  value={newEntityName}
                  onChange={e => setNewEntityName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-white/60 font-medium block mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    value={newEntityCost}
                    onChange={e => setNewEntityCost(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 font-medium block mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    value={newEntityPrice}
                    onChange={e => setNewEntityPrice(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 font-medium block mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={newEntityLeadTime}
                    onChange={e => setNewEntityLeadTime(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewRecordModal(false)}
                  className="px-3 py-1.5 rounded text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow"
                >
                  Create in Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
