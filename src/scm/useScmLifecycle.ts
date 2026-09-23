/**
 * ORION-9 WAVE 4 / PART 4 TRACK 2 — GOVERNED SCM LIFECYCLE REACT HOOK
 * Full lifecycle reactivity wired to Cloud Firestore persistence & ScmPersistenceService.
 */

import { useState, useEffect, useCallback } from 'react';
import { supplierLifecycleEngine } from './SupplierLifecycleEngine';
import { sourcingEngine } from './SourcingEngine';
import { poLifecycleEngine } from './POLifecycleEngine';
import { inboundLogisticsEngine } from './InboundLogisticsEngine';
import { receivingGRNEngine } from './ReceivingGRNEngine';
import { invoicingMatchingEngine } from './InvoicingMatchingEngine';
import { supplierPerformanceEngine } from './SupplierPerformanceEngine';
import { scmTraceabilityEngine } from './ScmTraceabilityEngine';
import { demandPlanningEngine } from './DemandPlanningEngine';
import { customerOrderFulfillmentEngine } from './CustomerOrderFulfillmentEngine';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';
import { kernelEventBus } from '../kernel/EventBus';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import {
  PurchaseOrderRecord,
  SupplierRecord,
  DemandPlanRecord,
  CustomerOrderRecord,
  InvoiceRecord,
  GRNRecord,
  ASNRecord,
} from './types';

export function useScmLifecycle(tenantId: string = 'org-tenant-a') {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => supplierLifecycleEngine.listSuppliers(tenantId));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(() => poLifecycleEngine.listPOs(tenantId));
  const [demandPlans, setDemandPlans] = useState<DemandPlanRecord[]>(() =>
    scmPersistenceService.listCachedRecords<DemandPlanRecord>('demand_plans', tenantId)
  );
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderRecord[]>(() => customerOrderFulfillmentEngine.listOrders(tenantId));
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() =>
    scmPersistenceService.listCachedRecords<InvoiceRecord>('invoices', tenantId)
  );
  const [grns, setGrns] = useState<GRNRecord[]>(() =>
    scmPersistenceService.listCachedRecords<GRNRecord>('grns', tenantId)
  );
  const [asns, setAsns] = useState<ASNRecord[]>(() =>
    scmPersistenceService.listCachedRecords<ASNRecord>('asns', tenantId)
  );

  const refresh = useCallback(() => {
    setSuppliers(supplierLifecycleEngine.listSuppliers(tenantId));
    setPurchaseOrders(poLifecycleEngine.listPOs(tenantId));
    setDemandPlans(scmPersistenceService.listCachedRecords<DemandPlanRecord>('demand_plans', tenantId));
    setCustomerOrders(customerOrderFulfillmentEngine.listOrders(tenantId));
    setInvoices(scmPersistenceService.listCachedRecords<InvoiceRecord>('invoices', tenantId));
    setGrns(scmPersistenceService.listCachedRecords<GRNRecord>('grns', tenantId));
    setAsns(scmPersistenceService.listCachedRecords<ASNRecord>('asns', tenantId));
  }, [tenantId]);

  useEffect(() => {
    const unsub = kernelEventBus.subscribe('orion:scm:*' as any, refresh);
    return () => unsub();
  }, [refresh]);

  // Supplier
  const registerSupplier = useCallback((actor: AuthorizationActor, params: Parameters<typeof supplierLifecycleEngine.registerSupplier>[0]) => {
    return supplierLifecycleEngine.registerSupplier(params);
  }, []);

  const evaluateQualification = useCallback((params: Parameters<typeof supplierLifecycleEngine.evaluateQualification>[0]) => {
    return supplierLifecycleEngine.evaluateQualification(params);
  }, []);

  const activateSupplier = useCallback((supplierId: string, actor: AuthorizationActor) => {
    return supplierLifecycleEngine.activateSupplier(tenantId, supplierId, actor);
  }, [tenantId]);

  // Sourcing
  const createPR = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof sourcingEngine.createPR>[0], 'tenantId' | 'actor'>) => {
    return sourcingEngine.createPR({ tenantId, actor, ...params });
  }, [tenantId]);

  const createRFQ = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof sourcingEngine.createRFQ>[0], 'tenantId' | 'actor'>) => {
    return sourcingEngine.createRFQ({ tenantId, actor, ...params });
  }, [tenantId]);

  // Purchase Order
  const createPO = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof poLifecycleEngine.createPO>[0], 'tenantId' | 'actor'>) => {
    return poLifecycleEngine.createPO({ tenantId, actor, ...params });
  }, [tenantId]);

  const releasePO = useCallback((poId: string, actor: AuthorizationActor) => {
    return poLifecycleEngine.releasePO(tenantId, poId, actor);
  }, [tenantId]);

  // Inbound & Receiving
  const createASN = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof inboundLogisticsEngine.createASN>[0], 'tenantId' | 'actor'>) => {
    return inboundLogisticsEngine.createASN({ tenantId, actor, ...params });
  }, [tenantId]);

  const recordReceiving = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof receivingGRNEngine.recordReceiving>[0], 'tenantId' | 'actor'>) => {
    return receivingGRNEngine.recordReceiving({ tenantId, actor, ...params });
  }, [tenantId]);

  const postGRN = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof receivingGRNEngine.postGRN>[0], 'tenantId' | 'actor'>) => {
    return receivingGRNEngine.postGRN({ tenantId, actor, ...params });
  }, [tenantId]);

  // Invoice & Matching
  const ingestInvoice = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof invoicingMatchingEngine.ingestInvoice>[0], 'tenantId' | 'actor'>) => {
    return invoicingMatchingEngine.ingestInvoice({ tenantId, actor, ...params });
  }, [tenantId]);

  const performMatch = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof invoicingMatchingEngine.performMatch>[0], 'tenantId' | 'actor'>) => {
    return invoicingMatchingEngine.performMatch({ tenantId, actor, ...params });
  }, [tenantId]);

  const createPaymentHandoff = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof invoicingMatchingEngine.createPaymentHandoff>[0], 'tenantId' | 'actor'>) => {
    return invoicingMatchingEngine.createPaymentHandoff({ tenantId, actor, ...params });
  }, [tenantId]);

  // Demand Planning & Orders
  const createDemandPlan = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof demandPlanningEngine.createDemandPlan>[0], 'tenantId' | 'actor'>) => {
    return demandPlanningEngine.createDemandPlan({ tenantId, actor, ...params });
  }, [tenantId]);

  const createCustomerOrder = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof customerOrderFulfillmentEngine.createCustomerOrder>[0], 'tenantId' | 'actor'>) => {
    return customerOrderFulfillmentEngine.createCustomerOrder({ tenantId, actor, ...params });
  }, [tenantId]);

  const fulfillCustomerOrder = useCallback((orderId: string, actor: AuthorizationActor, trackingNumber?: string) => {
    return customerOrderFulfillmentEngine.fulfillOrder(tenantId, orderId, actor, trackingNumber);
  }, [tenantId]);

  // Trace & Performance
  const getTraceForPO = useCallback((poId: string) => {
    return scmTraceabilityEngine.getTraceForPO(tenantId, poId);
  }, [tenantId]);

  const getPerformanceMetrics = useCallback((supplierId: string) => {
    return supplierPerformanceEngine.calculateMetrics(tenantId, supplierId);
  }, [tenantId]);

  return {
    suppliers,
    purchaseOrders,
    demandPlans,
    customerOrders,
    invoices,
    grns,
    asns,
    registerSupplier,
    evaluateQualification,
    activateSupplier,
    createPR,
    createRFQ,
    createPO,
    releasePO,
    createASN,
    recordReceiving,
    postGRN,
    ingestInvoice,
    performMatch,
    createPaymentHandoff,
    createDemandPlan,
    createCustomerOrder,
    fulfillCustomerOrder,
    getTraceForPO,
    getPerformanceMetrics,
    refresh,
  };
}
