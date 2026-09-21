/**
 * ORION-9 INTEGRATION FABRIC HOOK
 * Wave 3.1 React Hook for accessing Integration Connectors, DLQ, Reconciliation Engine, and Ingress
 */

import { useState, useEffect, useCallback } from 'react';
import { connectorRegistry } from './ConnectorRegistry';
import { integrationDLQ } from './IntegrationDLQ';
import { reconciliationEngine } from './ReconciliationEngine';
import { integrationFabric, IngressMessageEnvelope } from './IntegrationFabric';
import {
  ConnectorRecord,
  DLQRecord,
  ReconciliationReport,
  ReconciliationDiscrepancy,
  IntegrationContract,
  ERPEntitlement
} from './types';
import { SourceSystemType, PurchaseOrder, Inventory, Shipment, Supplier } from '../types';
import { kernelEventBus } from '../kernel/EventBus';

import { syncJobEngine } from './SyncJobEngine';
import { SyncJobRecord } from './types';

import { transportRegistry } from './transport/TransportRegistry';
import { tradingPartnerRegistry } from './tradingPartner/TradingPartnerRegistry';
import { messageLifecycleManager } from './messaging/MessageLifecycleManager';
import { incidentManager } from './incidents/IncidentManager';
import { integrationScheduler } from './scheduling/IntegrationScheduler';
import { integrationTelemetry, IntegrationFabricSummary } from './observability/IntegrationTelemetry';
import {
  TransportRecord,
  TradingPartnerRecord,
  DurableMessageRecord,
  IncidentRecord,
  ScheduleRecord
} from './types';

export function useIntegrationFabric(tenantId: string = 'org-tenant-a') {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>(() => connectorRegistry.listConnectors(tenantId));
  const [dlqRecords, setDlqRecords] = useState<DLQRecord[]>(() => integrationDLQ.listDLQ(tenantId));
  const [contracts, setContracts] = useState<IntegrationContract[]>(() => reconciliationEngine.getContracts());
  const [entitlements, setEntitlements] = useState<ERPEntitlement[]>(() => reconciliationEngine.getEntitlements());
  const [reports, setReports] = useState<ReconciliationReport[]>(() => reconciliationEngine.getReports());
  const [discrepancies, setDiscrepancies] = useState<ReconciliationDiscrepancy[]>(() => reconciliationEngine.getOpenDiscrepancies());
  const [syncJobs, setSyncJobs] = useState<SyncJobRecord[]>(() => syncJobEngine.listSyncJobs(tenantId));
  const [isReconciling, setIsReconciling] = useState<boolean>(false);

  // Wave 3.3 State
  const [transports, setTransports] = useState<TransportRecord[]>(() => transportRegistry.getTransportRecords(tenantId));
  const [tradingPartners, setTradingPartners] = useState<TradingPartnerRecord[]>(() => tradingPartnerRegistry.listPartners(tenantId));
  const [durableMessages, setDurableMessages] = useState<DurableMessageRecord[]>(() => messageLifecycleManager.listMessages(tenantId));
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => incidentManager.listIncidents(tenantId));
  const [schedules, setSchedules] = useState<ScheduleRecord[]>(() => integrationScheduler.listSchedules(tenantId));
  const [summary, setSummary] = useState<IntegrationFabricSummary>(() => integrationTelemetry.getTenantSummary(tenantId));

  const refresh = useCallback(() => {
    setConnectors(connectorRegistry.listConnectors(tenantId));
    setDlqRecords(integrationDLQ.listDLQ(tenantId));
    setContracts(reconciliationEngine.getContracts());
    setEntitlements(reconciliationEngine.getEntitlements());
    setReports(reconciliationEngine.getReports());
    setDiscrepancies(reconciliationEngine.getOpenDiscrepancies());
    setSyncJobs(syncJobEngine.listSyncJobs(tenantId));

    setTransports(transportRegistry.getTransportRecords(tenantId));
    setTradingPartners(tradingPartnerRegistry.listPartners(tenantId));
    setDurableMessages(messageLifecycleManager.listMessages(tenantId));
    setIncidents(incidentManager.listIncidents(tenantId));
    setSchedules(integrationScheduler.listSchedules(tenantId));
    setSummary(integrationTelemetry.getTenantSummary(tenantId));
  }, [tenantId]);

  useEffect(() => {
    const unsub1 = kernelEventBus.subscribe('orion:connector:registered', refresh);
    const unsub2 = kernelEventBus.subscribe('orion:integration:dlq-enqueued', refresh);
    const unsub3 = kernelEventBus.subscribe('orion:integration:ingress-success', refresh);
    const unsub4 = kernelEventBus.subscribe('orion:reconciliation:run-completed', refresh);
    const unsub5 = kernelEventBus.subscribe('orion:reconciliation:discrepancy-resolved', refresh);
    const unsub6 = kernelEventBus.subscribe('orion:sync_job:completed' as any, refresh);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [refresh]);

  const testConnectorConnection = useCallback(async (connectorId: string) => {
    const runtime = connectorRegistry.getRuntimeInstance(connectorId, tenantId);
    if (!runtime) return { success: false, latencyMs: 0, message: 'Runtime instance not found' };
    const res = await runtime.testConnection();
    connectorRegistry.updateHealth(connectorId, tenantId, {
      success: res.success,
      latencyMs: res.latencyMs,
      error: res.success ? undefined : res.message,
    });
    refresh();
    return res;
  }, [tenantId, refresh]);

  const triggerSyncJob = useCallback(async (params: {
    connectorId: string;
    entityType: 'Supplier' | 'Product' | 'Inventory' | 'PurchaseOrder' | 'Shipment' | 'ASN' | 'Invoice' | 'CustomerOrder';
    mode?: 'FULL' | 'INCREMENTAL' | 'EVENT_DRIVEN' | 'MANUAL';
    actor?: string;
  }) => {
    const job = await syncJobEngine.createAndRunSyncJob({
      tenantId,
      ...params,
    });
    refresh();
    return job;
  }, [tenantId, refresh]);

  const registerConnector = useCallback((params: {
    type: ConnectorRecord['type'];
    name: string;
    environment?: 'SANDBOX' | 'LIVE';
    endpointReference?: string;
    configuration: Record<string, any>;
    actor?: string;
  }) => {
    const created = connectorRegistry.registerConnector({ ...params, tenantId });
    refresh();
    return created;
  }, [tenantId, refresh]);

  const retryDLQMessage = useCallback(async (messageId: string, actor: string) => {
    const success = await integrationDLQ.retryMessage(messageId, tenantId, actor, async (rec) => {
      // Re-evaluate payload against fabric
      const res = await integrationFabric.ingest({
        connectorId: rec.connectorId,
        tenantId: rec.tenantId,
        externalSystemId: rec.connectorId,
        externalMessageId: `retry-${Date.now()}`,
        idempotencyKey: `retry-key-${Date.now()}`,
        entityType: rec.entityType as any,
        payload: rec.payloadReference,
        actor: {
          id: actor,
          type: 'USER' as any,
          name: actor,
          roles: ['organization_admin'],
          organizationId: tenantId,
        },
      });
      return res.success;
    });
    refresh();
    return success;
  }, [tenantId, refresh]);

  const discardDLQMessage = useCallback((messageId: string, actor: string, reason?: string) => {
    const res = integrationDLQ.discardMessage(messageId, tenantId, actor, reason);
    refresh();
    return res;
  }, [tenantId, refresh]);

  const resolveDLQMessage = useCallback((messageId: string, actor: string, comment?: string) => {
    const res = integrationDLQ.resolveMessage(messageId, tenantId, actor, comment);
    refresh();
    return res;
  }, [tenantId, refresh]);

  const runIngest = useCallback(async (envelope: Omit<IngressMessageEnvelope, 'tenantId'>) => {
    const res = await integrationFabric.ingest({ ...envelope, tenantId });
    refresh();
    return res;
  }, [tenantId, refresh]);

  const runReconciliation = useCallback(async (params: {
    sourceSystem: SourceSystemType;
    purchaseOrders: PurchaseOrder[];
    inventory: Inventory[];
    shipments: Shipment[];
    suppliers: Supplier[];
    actor?: string;
  }) => {
    setIsReconciling(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const rep = reconciliationEngine.runReconciliation(params);
      refresh();
      return rep;
    } finally {
      setIsReconciling(false);
    }
  }, [refresh]);

  const resolveDiscrepancy = useCallback((
    discrepancyId: string,
    strategy: 'ALIGN_TO_ORION' | 'ALIGN_TO_ERP' | 'DISMISS',
    actor: string,
    comment?: string
  ) => {
    const res = reconciliationEngine.resolveDiscrepancy(discrepancyId, strategy, actor, comment);
    refresh();
    return res;
  }, [refresh]);

  const registerTradingPartner = useCallback((partner: Omit<TradingPartnerRecord, 'tenantId'>) => {
    const rec = tradingPartnerRegistry.registerPartner({ ...partner, tenantId });
    refresh();
    return rec;
  }, [tenantId, refresh]);

  const reportIncident = useCallback((incident: Omit<IncidentRecord, 'incidentId' | 'tenantId' | 'status' | 'createdAt'>) => {
    const rec = incidentManager.reportIncident({ ...incident, tenantId });
    refresh();
    return rec;
  }, [tenantId, refresh]);

  const resolveIncident = useCallback((incidentId: string, actor: string) => {
    const res = incidentManager.resolveIncident(tenantId, incidentId, actor);
    refresh();
    return res;
  }, [tenantId, refresh]);

  const createSchedule = useCallback((schedule: Omit<ScheduleRecord, 'scheduleId' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    const rec = integrationScheduler.createSchedule({ ...schedule, tenantId });
    refresh();
    return rec;
  }, [tenantId, refresh]);

  const triggerSchedule = useCallback((scheduleId: string) => {
    const res = integrationScheduler.triggerSchedule(tenantId, scheduleId);
    refresh();
    return res;
  }, [tenantId, refresh]);

  return {
    connectors,
    dlqRecords,
    contracts,
    entitlements,
    reports,
    discrepancies,
    syncJobs,
    isReconciling,
    transports,
    tradingPartners,
    durableMessages,
    incidents,
    schedules,
    summary,
    registerConnector,
    testConnectorConnection,
    triggerSyncJob,
    retryDLQMessage,
    discardDLQMessage,
    resolveDLQMessage,
    runIngest,
    runReconciliation,
    resolveDiscrepancy,
    registerTradingPartner,
    reportIncident,
    resolveIncident,
    createSchedule,
    triggerSchedule,
    refresh
  };
}

