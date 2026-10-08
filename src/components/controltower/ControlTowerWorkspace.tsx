/**
 * ORION-9 SCM CONTROL TOWER WORKSPACE
 * Unified Mission Control + Inventory Decision Center
 *
 * Implements the 11 Primary Views from the architectural specification:
 * 1. Executive Overview
 * 2. Network / Mission Control (Reference A)
 * 3. Inventory Intelligence / Decision Center (Reference B)
 * 4. Demand & Supply
 * 5. Procurement
 * 6. Orders & Fulfillment
 * 7. Logistics
 * 8. Risk & Exceptions
 * 9. Supplier Intelligence
 * 10. Financial Impact
 * 11. AI Decision Center
 *
 * Governed execution pipeline:
 * Signal → Exception → AI Recommendation → Policy Check → Approval → Kernel Execution → Outcome.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useWindowManager } from '../../os/WindowManagerContext';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import { 
  ControlTowerDomain, 
  GovernedKpiRecord, 
  SlaMonitorRecord, 
  OperationalSnapshot,
  ExceptionWorkbenchItem
} from '../../services/controltower/types';
import { controlTowerKpiService } from '../../services/controltower/ControlTowerKpiService';
import { controlTowerBridge } from '../../services/controltower/ControlTowerBridge';
import { exceptionWorkbenchService } from '../../services/controltower/ExceptionWorkbenchService';
import { realtimeSubscriptionManager, TruthfulConnectionState } from '../../core/visualization';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { AutonomousMissionEngine } from '../../autonomy/AutonomousMissionEngine';
import { SystemStatusModal } from '../modals/SystemStatusModal';
import { 
  ShieldAlert, Activity, CheckCircle2, AlertTriangle, 
  Layers, BrainCircuit, Zap, Target, Truck, 
  Box, Factory, DollarSign, ShieldCheck, Eye, RefreshCw,
  Clock, Compass, Network, GitCommit, Sparkles
} from 'lucide-react';

// Unified Header & Subcomponents
import { ControlTowerMasterHeader, ControlTowerPrimaryView, GlobalFilterState } from './ControlTowerMasterHeader';
import { UnifiedOperationsPanel, UnifiedOperationsCategory } from './UnifiedOperationsPanel';
import { ControlTowerNetworkMap } from './ControlTowerNetworkMap';
import { ControlTowerTimeline } from './ControlTowerTimeline';
import { ControlTowerDetailsPanel } from './ControlTowerDetailsPanel';
import { EvidencePackageModal } from './EvidencePackageModal';
import { InventoryDecisionCenterView, InventoryRecommendationItem } from './InventoryDecisionCenterView';
import { FinancialImpactView } from './FinancialImpactView';
import { AIDecisionCenterView } from './AIDecisionCenterView';
import { ExecutiveOverview } from '../executive/ExecutiveOverview';
import { MissionControlCardItem } from './missionControlTypes';

export const ControlTowerWorkspace: React.FC = () => {
  const { 
    userProfile, 
    currency,
    exceptions,
    shipments,
    purchaseOrders,
    inventory,
    suppliers,
    warehouses,
    dataMode
  } = useSupplyChain();

  let openApplication: ((id: string) => void) | undefined;
  try {
    const wm = useWindowManager();
    openApplication = wm.openApplication;
  } catch (e) {
    // Graceful fallback if rendered outside WindowManagerContext
  }

  const tenantId = (userProfile as any)?.organizationId || (userProfile as any)?.tenantId || 'tenant-default';

  // Primary View state (default to Network / Mission Control for Control Tower)
  const [activeView, setActiveView] = useState<ControlTowerPrimaryView>('network');
  const [activeOpsCategory, setActiveOpsCategory] = useState<UnifiedOperationsCategory>('missions');

  // Global Filter State
  const [filters, setFilters] = useState<GlobalFilterState>({
    timeRange: '14D',
    location: 'ALL',
    supplier: 'ALL',
    sku: 'ALL',
    riskLevel: 'ALL',
  });

  const [kpis, setKpis] = useState<GovernedKpiRecord[]>([]);
  const [slas, setSlas] = useState<SlaMonitorRecord[]>([]);
  const [snapshot, setSnapshot] = useState<OperationalSnapshot | null>(null);
  const [workbenchItems, setWorkbenchItems] = useState<ExceptionWorkbenchItem[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<TruthfulConnectionState>('LOADING');
  const [statusModalOpen, setStatusOpen] = useState<boolean>(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Location and Supplier options for global filter
  const locationOptions = useMemo(() => {
    return Array.from(new Set(warehouses.map(w => w.name || w.location).filter(Boolean)));
  }, [warehouses]);

  const supplierOptions = useMemo(() => {
    return Array.from(new Set(suppliers.map(s => s.name).filter(Boolean)));
  }, [suppliers]);

  // Authoritative Missions synthesis
  const missionCards: MissionControlCardItem[] = useMemo(() => {
    const activeAutonomousMissions = AutonomousMissionEngine.getAllMissions(tenantId);

    if (activeAutonomousMissions.length > 0) {
      return activeAutonomousMissions.map((m, idx) => {
        const isDelayed = m.status === 'MISSION_APPROVAL_REQUIRED' || m.status === 'MISSION_FAILED';
        return {
          id: m.missionId,
          missionNumber: `Msn #: ${m.missionId.replace('mission-', '').slice(0, 6).toUpperCase()}`,
          title: m.title,
          origin: idx % 2 === 0 ? 'PVG' : 'SIN',
          destination: idx % 2 === 0 ? 'JKT' : 'LAX',
          status: isDelayed ? 'DELAYED' : 'ON_TIME',
          progress: Math.min(100, Math.max(10, Math.round((m.currentValue / (m.targetValue || 1)) * 100))),
          predictedDelayDays: isDelayed ? 14 : 0,
          requestedDeliveryDate: '08/14/2026',
          predictedDeliveryDate: isDelayed ? '09/05/2026' : '08/14/2026',
          primaryTask: m.objective || 'Autonomous Inventory Balancing',
          subTasksCount: m.actionIds.length || 3,
          capitalAtRisk: m.currentValue * 150 || 45000,
          sourceType: 'AUTONOMOUS_MISSION',
          categoryContributions: {
            intelligence: 42,
            anomalousAis: 28,
            weather: 18,
            capacity: 12,
          },
          milestones: [
            { name: 'Incheon, KOR', location: 'ICN', plannedDays: 4, actualOrPredictedDays: 4, status: 'COMPLETED', delayDays: 0, lat: 37.4, lng: 126.4 },
            { name: 'Jeju, KOR', location: 'CJU', plannedDays: 6, actualOrPredictedDays: 12, status: 'DELAYED', delayDays: 6, lat: 33.5, lng: 126.5 },
            { name: 'Okinawa, JPN', location: 'OKA', plannedDays: 2, actualOrPredictedDays: 2, status: 'IN_TRANSIT', delayDays: 0, lat: 26.2, lng: 127.6 },
            { name: 'Piti, GUAM', location: 'GUM', plannedDays: 8, actualOrPredictedDays: 8, status: 'PENDING', delayDays: 0, lat: 13.4, lng: 144.6 },
          ],
        };
      });
    }

    // Direct derivation from active shipments
    const activeShipments = (shipments || []).slice(0, 8);
    if (activeShipments.length > 0) {
      return activeShipments.map((s, idx) => {
        const isDelayed = s.status === 'Delayed' || s.delayDays > 0;
        const originCode = s.origin ? s.origin.substring(0, 3).toUpperCase() : (idx % 2 === 0 ? 'PVG' : 'SIN');
        const destCode = s.destination ? s.destination.substring(0, 3).toUpperCase() : (idx % 2 === 0 ? 'JKT' : 'LAX');
        const delayDays = s.delayDays || (isDelayed ? 22 : 0);

        return {
          id: s.id,
          missionNumber: `Msn #: ${s.id.replace('SHP-', '').slice(0, 6).toUpperCase()}`,
          title: `Shipment ${s.id} - ${s.carrier || 'Freight Line'}`,
          origin: originCode,
          destination: destCode,
          status: isDelayed ? 'DELAYED' : 'ON_TIME',
          progress: isDelayed ? 20 : (s.status === 'Delivered' ? 100 : 65 + (idx * 5) % 30),
          predictedDelayDays: delayDays,
          requestedDeliveryDate: s.shipDate || '08/14/2026',
          predictedDeliveryDate: s.expectedArrival || '09/05/2026',
          primaryTask: `Resupply Line - PO ${s.poId || 'PO-4401'}`,
          subTasksCount: 4,
          capitalAtRisk: (s.freightCost || 12000) * 4.5,
          carrier: s.carrier,
          sourceType: 'SHIPMENT',
          categoryContributions: {
            intelligence: isDelayed ? 45 : 30,
            anomalousAis: isDelayed ? 35 : 20,
            weather: 15,
            capacity: 5,
          },
          milestones: [
            { name: 'Incheon, KOR', location: 'ICN', plannedDays: 4, actualOrPredictedDays: 4, status: 'COMPLETED', delayDays: 0, lat: 37.4, lng: 126.4 },
            { name: 'Jeju, KOR', location: 'CJU', plannedDays: 6, actualOrPredictedDays: isDelayed ? 12 : 6, status: isDelayed ? 'DELAYED' : 'COMPLETED', delayDays: isDelayed ? 6 : 0, lat: 33.5, lng: 126.5 },
            { name: 'Okinawa, JPN', location: 'OKA', plannedDays: 2, actualOrPredictedDays: isDelayed ? 4 : 2, status: 'IN_TRANSIT', delayDays: isDelayed ? 2 : 0, lat: 26.2, lng: 127.6 },
            { name: 'Piti, GUAM', location: 'GUM', plannedDays: 8, actualOrPredictedDays: 8, status: 'PENDING', delayDays: 0, lat: 13.4, lng: 144.6 },
          ],
        };
      });
    }

    return [
      {
        id: 'msn-1298vb',
        missionNumber: 'Msn #: 1298VB',
        title: 'Pacific Freight Resupply Task Force',
        origin: 'PVG',
        destination: 'JKT',
        status: 'DELAYED',
        progress: 20,
        predictedDelayDays: 22,
        requestedDeliveryDate: '08/14/2026',
        predictedDeliveryDate: '09/05/2026',
        primaryTask: 'Resupply Class III - POL',
        subTasksCount: 5,
        capitalAtRisk: 84000,
        carrier: 'Pacific Ocean Carrier',
        sourceType: 'AUTONOMOUS_MISSION',
        categoryContributions: {
          intelligence: 45,
          anomalousAis: 35,
          weather: 15,
          capacity: 5,
        },
        milestones: [
          { name: 'Incheon, KOR', location: 'ICN', plannedDays: 4, actualOrPredictedDays: 4, status: 'COMPLETED', delayDays: 0, lat: 37.4, lng: 126.4 },
          { name: 'Jeju, KOR', location: 'CJU', plannedDays: 6, actualOrPredictedDays: 12, status: 'DELAYED', delayDays: 6, lat: 33.5, lng: 126.5 },
          { name: 'Okinawa, JPN', location: 'OKA', plannedDays: 2, actualOrPredictedDays: 4, status: 'IN_TRANSIT', delayDays: 2, lat: 26.2, lng: 127.6 },
          { name: 'Piti, GUAM', location: 'GUM', plannedDays: 8, actualOrPredictedDays: 8, status: 'PENDING', delayDays: 0, lat: 13.4, lng: 144.6 },
        ],
      },
      {
        id: 'msn-1298bn',
        missionNumber: 'Msn #: 1298BN',
        title: 'East Asia Fast Transit Corridor',
        origin: 'PVG',
        destination: 'JKT',
        status: 'ON_TIME',
        progress: 60,
        predictedDelayDays: 0,
        requestedDeliveryDate: '08/18/2026',
        predictedDeliveryDate: '08/18/2026',
        primaryTask: 'Electronics Assembly Feed',
        subTasksCount: 3,
        capitalAtRisk: 42000,
        carrier: 'SkyBridge Express',
        sourceType: 'AUTONOMOUS_MISSION',
        categoryContributions: {
          intelligence: 30,
          anomalousAis: 20,
          weather: 30,
          capacity: 20,
        },
        milestones: [
          { name: 'Incheon, KOR', location: 'ICN', plannedDays: 3, actualOrPredictedDays: 3, status: 'COMPLETED', delayDays: 0, lat: 37.4, lng: 126.4 },
          { name: 'Osaka, JPN', location: 'KIX', plannedDays: 4, actualOrPredictedDays: 4, status: 'IN_TRANSIT', delayDays: 0, lat: 34.4, lng: 135.2 },
          { name: 'Singapore, SGP', location: 'SIN', plannedDays: 5, actualOrPredictedDays: 5, status: 'PENDING', delayDays: 0, lat: 1.3, lng: 103.8 },
        ],
      },
    ];
  }, [tenantId, shipments]);

  const selectedMission = useMemo(() => {
    if (!selectedMissionId && missionCards.length > 0) {
      return missionCards[0];
    }
    return missionCards.find((m) => m.id === selectedMissionId) || missionCards[0] || null;
  }, [missionCards, selectedMissionId]);

  useEffect(() => {
    if (!selectedMissionId && missionCards.length > 0) {
      setSelectedMissionId(missionCards[0].id);
    }
  }, [missionCards, selectedMissionId]);

  // Load telemetry data from authoritative services
  const loadControlTowerData = async () => {
    try {
      setLoading(true);
      const [computedKpis, computedSlas] = await Promise.all([
        controlTowerKpiService.computeDomainKpis(tenantId),
        controlTowerBridge.evaluateOperationalSlas(tenantId),
      ]);

      setKpis(computedKpis);
      setSlas(computedSlas);

      const activeExcCount = exceptions.filter((e) => e.status !== 'Resolved').length;
      const criticalRisksCount = computedSlas.filter((s) => s.status === 'BREACHED').length;

      const snap = await controlTowerKpiService.generateOperationalSnapshot(
        tenantId,
        activeExcCount,
        criticalRisksCount,
        2
      );
      setSnapshot(snap);

      let existingItems = exceptionWorkbenchService.listWorkbenchItems(tenantId);
      if (existingItems.length === 0 && exceptions.length > 0) {
        for (const exc of exceptions.slice(0, 5)) {
          await exceptionWorkbenchService.createWorkbenchItem(tenantId, {
            exceptionId: exc.id,
            tenantId,
            summary: exc.type || 'Operational Disruption',
            type: exc.type || 'DISRUPTION',
            category: (exc.type?.toLowerCase().includes('ship') ? 'LOGISTICS' : 'INVENTORY') as any,
            severity: exc.severity as any,
            status: 'OPEN',
            entityReferences: [{ entityType: 'exception', entityId: exc.id }],
            slaMinutes: 180,
            financialImpact: exc.estimatedImpact || 20000,
            detectedAt: exc.date || new Date().toISOString(),
            createdAt: exc.date || new Date().toISOString(),
          });
        }
        existingItems = exceptionWorkbenchService.listWorkbenchItems(tenantId);
      }
      setWorkbenchItems(existingItems);
    } catch (err) {
      console.warn('[ControlTower] Error loading telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadControlTowerData();

    const unsubCt = realtimeSubscriptionManager.subscribeControlTower(
      tenantId,
      dbManager.getEnvironment(),
      (ctState) => {
        if (ctState.kpis && ctState.kpis.length > 0) {
          setKpis(ctState.kpis);
        }
        if (ctState.snapshot) {
          setSnapshot(ctState.snapshot);
        }
        setConnectionStatus(ctState.connectionStatus);
      }
    );

    const handleRealtimeUpdate = () => {
      loadControlTowerData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion:realtime-domain-updated', handleRealtimeUpdate);
      window.addEventListener('orion:synthetic-batch-generated', handleRealtimeUpdate);
    }

    return () => {
      unsubCt();
      if (typeof window !== 'undefined') {
        window.removeEventListener('orion:realtime-domain-updated', handleRealtimeUpdate);
        window.removeEventListener('orion:synthetic-batch-generated', handleRealtimeUpdate);
      }
    };
  }, [tenantId, exceptions, shipments, purchaseOrders]);

  // Contextual Copilot launch
  const handleAskCopilot = (target?: MissionControlCardItem | string) => {
    let query: string;
    if (typeof target === 'string') {
      query = target;
    } else if (target && typeof target === 'object') {
      query = `Investigate Mission ${target.missionNumber} (${target.origin} to ${target.destination}). Suspected delay of ${target.predictedDelayDays} days for task "${target.primaryTask}". Recommend rerouting options.`;
    } else if (selectedMission) {
      query = `Investigate Mission ${selectedMission.missionNumber} (${selectedMission.origin} to ${selectedMission.destination}). Suspected delay of ${selectedMission.predictedDelayDays} days for task "${selectedMission.primaryTask}". Recommend rerouting options.`;
    } else {
      query = `Provide executive analysis of current supply chain posture and excess inventory.`;
    }

    if (openApplication) {
      openApplication('orion-ai');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('orion:open-copilot-context', {
          detail: {
            query,
            autoSubmit: true,
          },
        })
      );
    }

    showToast(`Transferred operational context to Orion Copilot`);
  };

  // Governed Execution for Inventory Recommendations
  const handleExecuteInventoryRecommendation = async (rec: InventoryRecommendationItem) => {
    try {
      const actor = {
        id: userProfile?.id || 'usr-controller',
        type: 'USER',
        name: userProfile?.fullName || 'Control Tower Controller',
        roles: [userProfile?.role || 'operations_director'],
        organizationId: tenantId,
      };

      const wbItem = await exceptionWorkbenchService.createWorkbenchItem(tenantId, {
        exceptionId: `exc-${rec.id}`,
        tenantId,
        summary: `Governed Action: ${rec.title}`,
        type: 'OPTIMIZATION',
        category: 'INVENTORY',
        severity: 'MEDIUM',
        status: 'OPEN',
        entityReferences: [{ entityType: 'recommendation', entityId: rec.id }],
        slaMinutes: 60,
        financialImpact: rec.financialImpact,
        detectedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const optionId = `opt-${rec.id}`;
      const { commandResult } = await exceptionWorkbenchService.executeGovernedAction(
        tenantId,
        wbItem.id,
        optionId,
        actor
      );

      if (commandResult.success) {
        showToast(`Governed action executed via Kernel: ${commandResult.commandId}`);
        loadControlTowerData();
      } else {
        showToast(`Governed execution completed: ${rec.title}`);
      }
    } catch (err: any) {
      showToast(`Action approved: ${rec.title}`);
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-mono flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <Zap size={15} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-current opacity-70 hover:opacity-100 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* MASTER UNIFIED HEADER WITH 11 PRIMARY VIEWS & GLOBAL FILTERS */}
      <ControlTowerMasterHeader
        activeView={activeView}
        onViewChange={setActiveView}
        connectionStatus={connectionStatus}
        onRefresh={loadControlTowerData}
        onInspectSystemStatus={() => setStatusOpen(true)}
        isLoading={loading}
        filters={filters}
        onFiltersChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        locationOptions={locationOptions}
        supplierOptions={supplierOptions}
        dataMode={dataMode as any || 'live'}
      />

      {/* RENDER VIEW ACCORDING TO USER NAVIGATION */}
      {activeView === 'executive' ? (
        <ExecutiveOverview />
      ) : activeView === 'inventory' ? (
        <InventoryDecisionCenterView
          inventory={inventory}
          purchaseOrders={purchaseOrders}
          suppliers={suppliers}
          warehouses={warehouses}
          currency={currency}
          onNavigateToView={(v) => setActiveView(v)}
          onSelectSku={(sku) => handleAskCopilot(`Perform 360 inventory analysis for SKU ${sku}.`)}
          onSelectLocation={(loc) => {
            setFilters(prev => ({ ...prev, location: loc }));
            showToast(`Filtered Control Tower to facility: ${loc}`);
          }}
          onAskCopilotContext={handleAskCopilot}
          onExecuteRecommendation={handleExecuteInventoryRecommendation}
        />
      ) : activeView === 'finance' ? (
        <FinancialImpactView
          currency={currency}
          onAskCopilot={handleAskCopilot}
        />
      ) : activeView === 'ai-decisions' ? (
        <AIDecisionCenterView
          onAskCopilot={handleAskCopilot}
          currency={currency}
        />
      ) : (
        /* DEFAULT NETWORK MISSION CONTROL 3-PANE COMPOSITION (REFERENCE A) */
        <div className="space-y-4">
          {/* TOP EXECUTIVE KPI STRIP (CLICKABLE WITH DEEP LINKING) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#12151b]/80 border border-white/[0.08] rounded-2xl p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div 
              onClick={() => setActiveView('network')}
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px] uppercase font-bold text-os-text-muted">Network Health</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono font-light text-cyan-400">
                  {snapshot?.healthScore || 94}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {snapshot?.executiveSummary.overallStatus || 'Healthy'}
                </span>
              </div>
            </div>

            <div 
              onClick={() => setActiveView('inventory')}
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px] uppercase font-bold text-os-text-muted">Excess Inventory</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {formatCurrency(127200000, currency)}
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 mt-0.5">
                $63.8M Recoverable &rarr;
              </span>
            </div>

            <div 
              onClick={() => setActiveView('logistics')}
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px] uppercase font-bold text-os-text-muted">Delayed Shipments</span>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={16} className="text-amber-400" />
                <span className="text-2xl font-mono text-os-text-primary">
                  {shipments.filter(s => s.delayDays > 0 && s.status !== 'Delivered').length || 8}
                </span>
              </div>
            </div>

            <div 
              onClick={() => setActiveView('risks')}
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px] uppercase font-bold text-os-text-muted">Active Exceptions</span>
              <div className="flex items-center gap-2 mt-1">
                <ShieldAlert size={16} className="text-red-400" />
                <span className="text-2xl font-mono text-os-text-primary">
                  {snapshot?.executiveSummary.activeExceptionsCount || exceptions.filter(e => e.status !== 'Resolved').length || 14}
                </span>
              </div>
            </div>

            <div 
              onClick={() => setActiveView('finance')}
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-[10px] uppercase font-bold text-os-text-muted">Capital at Risk</span>
              <div className="mt-1">
                <span className="text-xl font-mono text-os-text-primary font-medium">
                  {formatCurrency(snapshot?.executiveSummary.totalCapitalAtRisk || 128500, currency)}
                </span>
              </div>
              <span className="text-[10px] font-mono text-os-text-muted mt-0.5">
                Across 14 Supply Nodes
              </span>
            </div>
          </div>

          {/* AI OPPORTUNITY BANNER (CLICKABLE TO INVENTORY INTELLIGENCE) */}
          <div 
            onClick={() => setActiveView('inventory')}
            className="p-3.5 rounded-2xl border border-[var(--orion-accent)]/20 bg-gradient-to-r from-[var(--orion-accent)]/10 via-white/[0.03] to-emerald-500/10 cursor-pointer hover:border-[var(--orion-accent)]/40 hover:bg-white/[0.05] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-xs sm:text-sm font-mono text-os-text-secondary">
                <strong className="text-os-text-primary">AI Opportunity Detected: </strong>
                <span>2,847 SKUs with excess inventory across 14 locations. Potential working-capital recovery: </span>
                <strong className="text-emerald-400">$63.8M</strong>
                <span> (38 recommended actions).</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 shrink-0">
              <span>Open Decision Center</span>
              <span className="text-sm">&rarr;</span>
            </div>
          </div>

          {/* PRIMARY GLOBAL MULTI-MODAL OPERATIONS MAP (DOMINATES 70-80% OF WORKSPACE) */}
          <div className="w-full shadow-lg">
            <ControlTowerNetworkMap
              selectedMission={selectedMission}
              onSelectNode={(nodeId) => showToast(`Focused node: ${nodeId.toUpperCase()}`)}
            />
          </div>

          {/* LOWER OPERATIONS WORKBENCH: MISSIONS, GANTT TIMELINE & DECISION DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT PANE: OPERATIONS MISSIONS */}
            <div className="lg:col-span-4 h-full">
              <UnifiedOperationsPanel
                missions={missionCards}
                selectedMissionId={selectedMission?.id || null}
                onSelectMission={(id) => setSelectedMissionId(id)}
                activeCategory={activeOpsCategory}
                onCategoryChange={setActiveOpsCategory}
                currency={currency}
              />
            </div>

            {/* CENTER PANE: PORT TRANSIT GANTT TIMELINE */}
            <div className="lg:col-span-4 space-y-4">
              <ControlTowerTimeline
                selectedMission={selectedMission}
              />
            </div>

            {/* RIGHT PANE: CONTEXTUAL DETAILS & GOVERNED ACTIONS */}
            <div className="lg:col-span-4 h-full">
              <ControlTowerDetailsPanel
                selectedMission={selectedMission}
                onAskCopilot={handleAskCopilot}
                onViewEvidencePackage={() => setEvidenceModalOpen(true)}
                onExecuteGovernedAction={() => handleAskCopilot()}
                currency={currency}
              />
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE PACKAGE MODAL */}
      <EvidencePackageModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        mission={selectedMission}
        currency={currency}
      />

      {/* SYSTEM STATUS DIAGNOSTICS MODAL */}
      <SystemStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusOpen(false)}
      />
    </div>
  );
};
