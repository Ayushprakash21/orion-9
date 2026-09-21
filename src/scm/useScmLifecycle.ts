/**
 * ORION-9 WAVE 4 — GOVERNED SCM LIFECYCLE REACT HOOK
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
import { kernelEventBus } from '../kernel/EventBus';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import {
  PurchaseOrderRecord,
  SupplierRecord,
} from './types';

export function useScmLifecycle(tenantId: string = 'org-tenant-a') {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => supplierLifecycleEngine.listSuppliers(tenantId));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(() => poLifecycleEngine.listPOs(tenantId));

  const refresh = useCallback(() => {
    setSuppliers(supplierLifecycleEngine.listSuppliers(tenantId));
    setPurchaseOrders(poLifecycleEngine.listPOs(tenantId));
  }, [tenantId]);

  useEffect(() => {
    const unsub = kernelEventBus.subscribe('orion:scm:*' as any, refresh);
    return () => unsub();
  }, [refresh]);

  const registerSupplier = useCallback((actor: AuthorizationActor, params: Parameters<typeof supplierLifecycleEngine.registerSupplier>[0]) => {
    return supplierLifecycleEngine.registerSupplier(params);
  }, []);

  const evaluateQualification = useCallback((params: Parameters<typeof supplierLifecycleEngine.evaluateQualification>[0]) => {
    return supplierLifecycleEngine.evaluateQualification(params);
  }, []);

  const activateSupplier = useCallback((supplierId: string, actor: AuthorizationActor) => {
    return supplierLifecycleEngine.activateSupplier(tenantId, supplierId, actor);
  }, [tenantId]);

  const createPO = useCallback((actor: AuthorizationActor, params: Omit<Parameters<typeof poLifecycleEngine.createPO>[0], 'tenantId' | 'actor'>) => {
    return poLifecycleEngine.createPO({ tenantId, actor, ...params });
  }, [tenantId]);

  const releasePO = useCallback((poId: string, actor: AuthorizationActor) => {
    return poLifecycleEngine.releasePO(tenantId, poId, actor);
  }, [tenantId]);

  const getTraceForPO = useCallback((poId: string) => {
    return scmTraceabilityEngine.getTraceForPO(tenantId, poId);
  }, [tenantId]);

  const getPerformanceMetrics = useCallback((supplierId: string) => {
    return supplierPerformanceEngine.calculateMetrics(tenantId, supplierId);
  }, [tenantId]);

  return {
    suppliers,
    purchaseOrders,
    registerSupplier,
    evaluateQualification,
    activateSupplier,
    createPO,
    releasePO,
    getTraceForPO,
    getPerformanceMetrics,
    refresh,
  };
}
