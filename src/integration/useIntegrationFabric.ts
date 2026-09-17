/**
 * ORION-9 INTEGRATION FABRIC HOOK
 * React hook for accessing Integration Contracts, ERP Entitlements, and Reconciliation Engine
 */

import { useState, useEffect, useCallback } from 'react';
import { reconciliationEngine } from './ReconciliationEngine';
import {
  IntegrationContract,
  ERPEntitlement,
  ReconciliationReport,
  ReconciliationDiscrepancy
} from './types';
import { SourceSystemType, PurchaseOrder, Inventory, Shipment, Supplier } from '../types';
import { kernelEventBus } from '../kernel/EventBus';

export function useIntegrationFabric() {
  const [contracts, setContracts] = useState<IntegrationContract[]>(() => reconciliationEngine.getContracts());
  const [entitlements, setEntitlements] = useState<ERPEntitlement[]>(() => reconciliationEngine.getEntitlements());
  const [reports, setReports] = useState<ReconciliationReport[]>(() => reconciliationEngine.getReports());
  const [discrepancies, setDiscrepancies] = useState<ReconciliationDiscrepancy[]>(() => reconciliationEngine.getOpenDiscrepancies());
  const [isReconciling, setIsReconciling] = useState<boolean>(false);

  const refresh = useCallback(() => {
    setContracts(reconciliationEngine.getContracts());
    setEntitlements(reconciliationEngine.getEntitlements());
    setReports(reconciliationEngine.getReports());
    setDiscrepancies(reconciliationEngine.getOpenDiscrepancies());
  }, []);

  useEffect(() => {
    const unsub1 = kernelEventBus.subscribe('orion:reconciliation:run-completed', refresh);
    const unsub2 = kernelEventBus.subscribe('orion:reconciliation:drift-detected', refresh);
    const unsub3 = kernelEventBus.subscribe('orion:reconciliation:discrepancy-resolved', refresh);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [refresh]);

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
      // Small simulated latency for async audit verification
      await new Promise(resolve => setTimeout(resolve, 800));
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

  return {
    contracts,
    entitlements,
    reports,
    discrepancies,
    isReconciling,
    runReconciliation,
    resolveDiscrepancy,
    refresh
  };
}
