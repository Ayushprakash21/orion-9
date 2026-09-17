/**
 * ORION-9 MASTER DATA HOOK
 * React hook for subscribing to Master Data records and lifecycle actions
 */

import { useState, useEffect, useCallback } from 'react';
import { masterDataService, MasterDataRecord, MasterDataEntityType } from './MasterDataService';
import { MasterDataLifecycleState, SourceSystemType, DataClassification } from '../types';
import { kernelEventBus } from '../kernel/EventBus';

export function useMasterData() {
  const [records, setRecords] = useState<MasterDataRecord[]>(() => masterDataService.getAllRecords());

  const refresh = useCallback(() => {
    setRecords(masterDataService.getAllRecords());
  }, []);

  useEffect(() => {
    // Subscribe to all master data lifecycle events
    const unsub1 = kernelEventBus.subscribe('orion:master-data:created', refresh);
    const unsub2 = kernelEventBus.subscribe('orion:master-data:validated', refresh);
    const unsub3 = kernelEventBus.subscribe('orion:master-data:duplicate-checked', refresh);
    const unsub4 = kernelEventBus.subscribe('orion:master-data:approval-requested', refresh);
    const unsub5 = kernelEventBus.subscribe('orion:master-data:activated', refresh);
    const unsub6 = kernelEventBus.subscribe('orion:master-data:retired', refresh);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [refresh]);

  const proposeRecord = useCallback((params: {
    entityType: MasterDataEntityType;
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

  const retireRecord = useCallback((recordId: string, actor: string, reason: string) => {
    const rec = masterDataService.retireRecord(recordId, actor, reason);
    refresh();
    return rec;
  }, [refresh]);

  return {
    records,
    refresh,
    proposeRecord,
    validateRecord,
    checkDuplicates,
    submitForApproval,
    activateRecord,
    retireRecord,
  };
}
