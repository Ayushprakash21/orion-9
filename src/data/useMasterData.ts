/**
 * ORION-9 MASTER DATA HOOK
 * React hook for subscribing to Master Data records, Golden Records, and lifecycle actions
 */

import { useState, useEffect, useCallback } from 'react';
import { masterDataService, MasterDataRecord, MasterDataEntityType } from './MasterDataService';
import { MasterDataLifecycleState, SourceSystemType, DataClassification, GoldenRecord } from '../types';
import { kernelEventBus } from '../kernel/EventBus';

export function useMasterData(tenantId?: string) {
  const [records, setRecords] = useState<MasterDataRecord[]>(() => masterDataService.getAllRecords({ tenantId }));
  const [goldenRecords, setGoldenRecords] = useState<GoldenRecord[]>(() => masterDataService.getAllGoldenRecords(tenantId));

  const refresh = useCallback(() => {
    setRecords(masterDataService.getAllRecords({ tenantId }));
    setGoldenRecords(masterDataService.getAllGoldenRecords(tenantId));
  }, [tenantId]);

  useEffect(() => {
    // Subscribe to all master data lifecycle events
    const unsub1 = kernelEventBus.subscribe('orion:master-data:created', refresh);
    const unsub2 = kernelEventBus.subscribe('orion:master-data:validated', refresh);
    const unsub3 = kernelEventBus.subscribe('orion:master-data:duplicate-checked', refresh);
    const unsub4 = kernelEventBus.subscribe('orion:master-data:approval-requested', refresh);
    const unsub5 = kernelEventBus.subscribe('orion:master-data:activated', refresh);
    const unsub6 = kernelEventBus.subscribe('orion:master-data:retired', refresh);
    const unsub7 = kernelEventBus.subscribe('orion:master-data:ingestion-completed', refresh);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  }, [refresh]);

  const proposeRecord = useCallback((params: {
    entityType: MasterDataEntityType;
    tenantId?: string;
    data: any;
    sourceSystemType: SourceSystemType;
    sourceSystemId?: string;
    classification?: DataClassification;
    actor: string;
  }) => {
    const rec = masterDataService.proposeRecord(params);
    refresh();
    return rec;
  }, [refresh]);

  const updateRecord = useCallback((recordId: string, updatedData: any, actor: string, reason?: string) => {
    const rec = masterDataService.updateRecord(recordId, updatedData, actor, reason);
    refresh();
    return rec;
  }, [refresh]);

  const validateRecord = useCallback((recordId: string, actor?: string) => {
    const result = masterDataService.validateRecord(recordId, actor);
    refresh();
    return result;
  }, [refresh]);

  const checkDuplicates = useCallback((recordId: string, existingRecords: Array<{ id: string; name: string }>, actor?: string) => {
    const result = masterDataService.checkDuplicates(recordId, existingRecords, actor);
    refresh();
    return result;
  }, [refresh]);

  const submitForApproval = useCallback((recordId: string, actor: string) => {
    const rec = masterDataService.submitForApproval(recordId, actor);
    refresh();
    return rec;
  }, [refresh]);

  const activateRecord = useCallback((recordId: string, approver: string, comment?: string) => {
    const rec = masterDataService.activateRecord(recordId, approver, comment);
    refresh();
    return rec;
  }, [refresh]);

  const rejectRecord = useCallback((recordId: string, actor: string, reason: string) => {
    const rec = masterDataService.rejectRecord(recordId, actor, reason);
    refresh();
    return rec;
  }, [refresh]);

  const retireRecord = useCallback((recordId: string, actor: string, reason: string) => {
    const rec = masterDataService.retireRecord(recordId, actor, reason);
    refresh();
    return rec;
  }, [refresh]);

  const ingestBatch = useCallback(async (params: {
    tenantId: string;
    entityType: MasterDataEntityType;
    records: Array<{ rawId?: string; sourceSystemType: SourceSystemType; sourceRecordId?: string; payload: Record<string, any> }>;
    actor: string;
    autoApproveClean?: boolean;
  }) => {
    const report = await masterDataService.ingestBatch(params);
    refresh();
    return report;
  }, [refresh]);

  return {
    records,
    goldenRecords,
    refresh,
    proposeRecord,
    updateRecord,
    validateRecord,
    checkDuplicates,
    submitForApproval,
    activateRecord,
    rejectRecord,
    retireRecord,
    ingestBatch,
  };
}
