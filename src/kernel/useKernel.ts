/**
 * ORION-9 KERNEL REACT HOOK
 * Provides seamless access to Kernel Core Services:
 * Command Bus, Event Bus, Policy Engine, Audit Engine, State Machines
 */

import { useMemo } from 'react';
import {
  kernelCommandBus,
  kernelEventBus,
  kernelPolicyEngine,
  kernelAuditEngine,
  KERNEL_STATE_MACHINES,
} from './index';

export function useKernel() {
  return useMemo(() => ({
    commandBus: kernelCommandBus,
    eventBus: kernelEventBus,
    policyEngine: kernelPolicyEngine,
    auditEngine: kernelAuditEngine,
    stateMachines: KERNEL_STATE_MACHINES,
    dispatch: kernelCommandBus.dispatch.bind(kernelCommandBus),
    publish: kernelEventBus.publish.bind(kernelEventBus),
    subscribe: kernelEventBus.subscribe.bind(kernelEventBus),
    evaluatePolicy: kernelPolicyEngine.evaluate.bind(kernelPolicyEngine),
    recordAudit: kernelAuditEngine.record.bind(kernelAuditEngine),
  }), []);
}
