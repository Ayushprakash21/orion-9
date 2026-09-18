/**
 * ORION-9 KERNEL STATE ENGINE
 * Layer 4: Explicit, auditable state machines for all transactional entities.
 * Enforces business transition rules and blocks illegal status jumps.
 */

import { StateMachineConfig, StateTransitionResult } from './types';
import { kernelEventBus } from './EventBus';

export class StateMachine<S extends string> {
  private config: StateMachineConfig<S>;

  constructor(config: StateMachineConfig<S>) {
    this.config = config;
  }

  public get entityType(): string {
    return this.config.entityType;
  }

  public get initialState(): S {
    return this.config.initialState;
  }

  public get terminalStates(): S[] {
    return [...this.config.terminalStates];
  }

  /**
   * Evaluates whether a transition from `fromState` to `toState` is legally permitted.
   */
  public canTransition(fromState: S, toState: S, actorRole?: string): StateTransitionResult<S> {
    if (fromState === toState) {
      return { valid: true, fromState, toState };
    }

    if (this.config.terminalStates.includes(fromState)) {
      return {
        valid: false,
        fromState,
        toState,
        reason: `Entity ${this.config.entityType} is in terminal state '${fromState}' and cannot be modified.`,
      };
    }

    const matchingRule = this.config.transitions.find(rule => {
      const matchesFrom = Array.isArray(rule.from) ? rule.from.includes(fromState) : rule.from === fromState;
      return matchesFrom && rule.to === toState;
    });

    if (!matchingRule) {
      return {
        valid: false,
        fromState,
        toState,
        reason: `Illegal state transition for ${this.config.entityType}: cannot move from '${fromState}' to '${toState}'.`,
      };
    }

    if (matchingRule.allowedRoles && actorRole) {
      if (!matchingRule.allowedRoles.includes(actorRole)) {
        return {
          valid: false,
          fromState,
          toState,
          reason: `Role '${actorRole}' is not authorized to transition ${this.config.entityType} from '${fromState}' to '${toState}'.`,
        };
      }
    }

    return { valid: true, fromState, toState };
  }

  /**
   * Asserts valid transition, throwing an error if invalid, and publishes an audit event.
   */
  public transition(
    entityId: string,
    fromState: S,
    toState: S,
    options?: {
      actorRole?: string;
      actorId?: string;
      correlationId?: string;
      tenantId?: string;
      metadata?: any;
    }
  ): S {
    const result = this.canTransition(fromState, toState, options?.actorRole);
    if (!result.valid) {
      throw new Error(result.reason || `Invalid transition from ${fromState} to ${toState}`);
    }

    // Emit event
    kernelEventBus.publish(
      `${this.config.entityType.toUpperCase()}_STATE_CHANGED`,
      {
        entityId,
        entityType: this.config.entityType,
        fromState,
        toState,
        metadata: options?.metadata,
      },
      {
        entityId,
        entityType: this.config.entityType,
        correlationId: options?.correlationId,
        tenant: options?.tenantId ? { organizationId: options.tenantId } : undefined,
      }
    );

    return toState;
  }
}

// =========================================================================
// STANDARD CANONICAL SUPPLY CHAIN STATE MACHINES
// =========================================================================

/**
 * 1. PURCHASE ORDER STATE MACHINE
 */
export type POState =
  | 'DRAFT'
  | 'VALIDATING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'RELEASED'
  | 'SUPPLIER_ACKNOWLEDGED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ON_HOLD'
  | 'ERROR';

export const poStateMachine = new StateMachine<POState>({
  entityType: 'purchase_order',
  initialState: 'DRAFT',
  terminalStates: ['CLOSED', 'CANCELLED'],
  transitions: [
    { from: 'DRAFT', to: 'VALIDATING' },
    { from: ['DRAFT', 'VALIDATING'], to: 'PENDING_APPROVAL' },
    { from: 'VALIDATING', to: 'ERROR' },
    { from: 'PENDING_APPROVAL', to: 'APPROVED', requiresApproval: true },
    { from: 'PENDING_APPROVAL', to: 'REJECTED' },
    { from: 'APPROVED', to: 'RELEASED' },
    { from: 'RELEASED', to: 'SUPPLIER_ACKNOWLEDGED' },
    { from: ['RELEASED', 'SUPPLIER_ACKNOWLEDGED'], to: 'PARTIALLY_FULFILLED' },
    { from: ['SUPPLIER_ACKNOWLEDGED', 'PARTIALLY_FULFILLED'], to: 'FULFILLED' },
    { from: 'FULFILLED', to: 'CLOSED' },
    { from: ['DRAFT', 'VALIDATING', 'PENDING_APPROVAL', 'APPROVED'], to: 'CANCELLED' },
    { from: ['RELEASED', 'SUPPLIER_ACKNOWLEDGED', 'PARTIALLY_FULFILLED'], to: 'ON_HOLD' },
    { from: 'ON_HOLD', to: 'SUPPLIER_ACKNOWLEDGED' },
  ],
});

/**
 * 2. SHIPMENT STATE MACHINE
 */
export type ShipmentState =
  | 'BOOKED'
  | 'PLANNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELAYED'
  | 'EXCEPTION'
  | 'CANCELLED';

export const shipmentStateMachine = new StateMachine<ShipmentState>({
  entityType: 'shipment',
  initialState: 'BOOKED',
  terminalStates: ['DELIVERED', 'CANCELLED'],
  transitions: [
    { from: 'BOOKED', to: 'PLANNED' },
    { from: ['BOOKED', 'PLANNED'], to: 'PICKED_UP' },
    { from: 'PICKED_UP', to: 'IN_TRANSIT' },
    { from: 'IN_TRANSIT', to: 'DELAYED' },
    { from: 'DELAYED', to: 'IN_TRANSIT' },
    { from: ['IN_TRANSIT', 'DELAYED'], to: 'EXCEPTION' },
    { from: 'EXCEPTION', to: 'IN_TRANSIT' },
    { from: ['IN_TRANSIT', 'DELAYED'], to: 'OUT_FOR_DELIVERY' },
    { from: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'], to: 'DELIVERED' },
    { from: ['BOOKED', 'PLANNED', 'PICKED_UP'], to: 'CANCELLED' },
  ],
});

/**
 * 3. ACTION STATE MACHINE
 */
export type ActionState =
  | 'PROPOSED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED';

export const actionStateMachine = new StateMachine<ActionState>({
  entityType: 'action',
  initialState: 'PROPOSED',
  terminalStates: ['EXECUTED', 'CANCELLED', 'REJECTED'],
  transitions: [
    { from: 'PROPOSED', to: 'AWAITING_APPROVAL' },
    { from: 'PROPOSED', to: 'APPROVED' }, // Low-risk self-governed
    { from: 'AWAITING_APPROVAL', to: 'APPROVED', requiresApproval: true },
    { from: 'AWAITING_APPROVAL', to: 'REJECTED' },
    { from: 'APPROVED', to: 'EXECUTING' },
    { from: 'EXECUTING', to: 'EXECUTED' },
    { from: 'EXECUTING', to: 'FAILED' },
    { from: ['PROPOSED', 'AWAITING_APPROVAL', 'APPROVED'], to: 'CANCELLED' },
  ],
});

/**
 * 4. DECISION STATE MACHINE
 */
export type DecisionState =
  | 'DETECTED'
  | 'EVALUATING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTED'
  | 'REJECTED';

export const decisionStateMachine = new StateMachine<DecisionState>({
  entityType: 'decision',
  initialState: 'DETECTED',
  terminalStates: ['EXECUTED', 'REJECTED'],
  transitions: [
    { from: 'DETECTED', to: 'EVALUATING' },
    { from: 'EVALUATING', to: 'PENDING_APPROVAL' },
    { from: 'PENDING_APPROVAL', to: 'APPROVED', requiresApproval: true },
    { from: 'PENDING_APPROVAL', to: 'REJECTED' },
    { from: 'APPROVED', to: 'EXECUTED' },
  ],
});

/**
 * 5. QUALITY INSPECTION STATE MACHINE
 */
export type QualityState =
  | 'REQUIRED'
  | 'SCHEDULED'
  | 'INSPECTING'
  | 'PASSED'
  | 'FAILED'
  | 'QUALITY_HOLD'
  | 'RELEASED'
  | 'REJECTED';

export const qualityStateMachine = new StateMachine<QualityState>({
  entityType: 'quality_inspection',
  initialState: 'REQUIRED',
  terminalStates: ['PASSED', 'RELEASED', 'REJECTED'],
  transitions: [
    { from: 'REQUIRED', to: 'SCHEDULED' },
    { from: 'SCHEDULED', to: 'INSPECTING' },
    { from: 'INSPECTING', to: 'PASSED' },
    { from: 'INSPECTING', to: 'FAILED' },
    { from: 'FAILED', to: 'QUALITY_HOLD' },
    { from: 'QUALITY_HOLD', to: 'RELEASED', requiresApproval: true },
    { from: 'QUALITY_HOLD', to: 'REJECTED' },
  ],
});

/**
 * 6. INVOICE STATE MACHINE
 */
export type InvoiceState =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'MATCHING'
  | 'MATCHED'
  | 'MISMATCH'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED'
  | 'ON_HOLD';

export const invoiceStateMachine = new StateMachine<InvoiceState>({
  entityType: 'invoice',
  initialState: 'RECEIVED',
  terminalStates: ['PAID', 'REJECTED'],
  transitions: [
    { from: 'RECEIVED', to: 'VALIDATING' },
    { from: 'VALIDATING', to: 'MATCHING' },
    { from: 'MATCHING', to: 'MATCHED' },
    { from: 'MATCHING', to: 'MISMATCH' },
    { from: 'MATCHED', to: 'APPROVED' },
    { from: 'MISMATCH', to: 'PENDING_APPROVAL' },
    { from: 'PENDING_APPROVAL', to: 'APPROVED', requiresApproval: true },
    { from: 'PENDING_APPROVAL', to: 'REJECTED' },
    { from: 'APPROVED', to: 'PAID' },
    { from: ['VALIDATING', 'MATCHING', 'MISMATCH'], to: 'ON_HOLD' },
    { from: 'ON_HOLD', to: 'MATCHING' },
  ],
});

/**
 * 7. VENDOR STATE MACHINE
 */
export type VendorState =
  | 'INVITED'
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVATED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'RETIRED';

export const vendorStateMachine = new StateMachine<VendorState>({
  entityType: 'vendor',
  initialState: 'INVITED',
  terminalStates: ['RETIRED', 'REJECTED'],
  transitions: [
    { from: 'INVITED', to: 'APPLIED' },
    { from: 'APPLIED', to: 'UNDER_REVIEW' },
    { from: 'UNDER_REVIEW', to: 'APPROVED', requiresApproval: true },
    { from: 'UNDER_REVIEW', to: 'REJECTED' },
    { from: 'APPROVED', to: 'ACTIVATED' },
    { from: 'ACTIVATED', to: 'SUSPENDED' },
    { from: 'SUSPENDED', to: 'ACTIVATED' },
    { from: ['ACTIVATED', 'SUSPENDED'], to: 'RETIRED' },
  ],
});

/**
 * 8. CONTRACT STATE MACHINE
 */
export type ContractState =
  | 'DRAFT'
  | 'UNDER_LEGAL_REVIEW'
  | 'PENDING_EXECUTIVE_APPROVAL'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'AMENDED'
  | 'EXPIRED'
  | 'TERMINATED';

export const contractStateMachine = new StateMachine<ContractState>({
  entityType: 'contract',
  initialState: 'DRAFT',
  terminalStates: ['EXPIRED', 'TERMINATED'],
  transitions: [
    { from: 'DRAFT', to: 'UNDER_LEGAL_REVIEW' },
    { from: 'UNDER_LEGAL_REVIEW', to: 'PENDING_EXECUTIVE_APPROVAL' },
    { from: 'UNDER_LEGAL_REVIEW', to: 'ACTIVE' },
    { from: 'PENDING_EXECUTIVE_APPROVAL', to: 'ACTIVE', requiresApproval: true },
    { from: 'PENDING_EXECUTIVE_APPROVAL', to: 'UNDER_LEGAL_REVIEW' },
    { from: 'ACTIVE', to: 'EXPIRING_SOON' },
    { from: 'ACTIVE', to: 'AMENDED' },
    { from: 'AMENDED', to: 'ACTIVE' },
    { from: 'EXPIRING_SOON', to: 'ACTIVE' },
    { from: ['ACTIVE', 'EXPIRING_SOON'], to: 'EXPIRED' },
    { from: ['DRAFT', 'UNDER_LEGAL_REVIEW', 'PENDING_EXECUTIVE_APPROVAL', 'ACTIVE', 'EXPIRING_SOON', 'AMENDED'], to: 'TERMINATED' },
  ],
});

/**
 * 9. SCENARIO & STRESS TEST STATE MACHINE
 */
export type ScenarioKernelState =
  | 'DRAFT'
  | 'READY'
  | 'SIMULATING'
  | 'CONVERGED'
  | 'CONTINGENCY_DRAFTED'
  | 'ROUTED_TO_APPROVAL'
  | 'COMMITTED'
  | 'ARCHIVED';

export const scenarioStateMachine = new StateMachine<ScenarioKernelState>({
  entityType: 'scenario',
  initialState: 'DRAFT',
  terminalStates: ['ARCHIVED'],
  transitions: [
    { from: 'DRAFT', to: 'READY' },
    { from: 'READY', to: 'SIMULATING' },
    { from: 'SIMULATING', to: 'CONVERGED' },
    { from: 'CONVERGED', to: 'CONTINGENCY_DRAFTED' },
    { from: 'CONVERGED', to: 'SIMULATING' }, // rerun
    { from: ['CONVERGED', 'CONTINGENCY_DRAFTED'], to: 'ROUTED_TO_APPROVAL', requiresApproval: true },
    { from: ['CONVERGED', 'CONTINGENCY_DRAFTED'], to: 'COMMITTED' }, // if within autonomous budget
    { from: 'ROUTED_TO_APPROVAL', to: 'COMMITTED', requiresApproval: true },
    { from: 'ROUTED_TO_APPROVAL', to: 'CONTINGENCY_DRAFTED' }, // rejected/revised
    { from: ['DRAFT', 'READY', 'CONVERGED', 'CONTINGENCY_DRAFTED', 'ROUTED_TO_APPROVAL', 'COMMITTED'], to: 'ARCHIVED' },
  ],
});

/**
 * 10. YARD MANAGEMENT & DOCK APPOINTMENT STATE MACHINE
 */
export type YardAppointmentKernelState =
  | 'SCHEDULED'
  | 'GATE_CHECKED_IN'
  | 'AT_DOCK_DOOR'
  | 'UNLOADING'
  | 'COMPLETED'
  | 'DEMURRAGE_TRIGGERED';

export const yardAppointmentStateMachine = new StateMachine<YardAppointmentKernelState>({
  entityType: 'yard_appointment',
  initialState: 'SCHEDULED',
  terminalStates: ['COMPLETED'],
  transitions: [
    { from: 'SCHEDULED', to: 'GATE_CHECKED_IN' },
    { from: 'GATE_CHECKED_IN', to: 'AT_DOCK_DOOR' },
    { from: 'AT_DOCK_DOOR', to: 'UNLOADING' },
    { from: 'UNLOADING', to: 'COMPLETED' },
    { from: ['GATE_CHECKED_IN', 'AT_DOCK_DOOR', 'UNLOADING'], to: 'DEMURRAGE_TRIGGERED' },
    { from: 'DEMURRAGE_TRIGGERED', to: 'COMPLETED' },
  ],
});

/**
 * 11. FREIGHT CONSOLIDATION STATE MACHINE
 */
export type FreightConsolidationKernelState =
  | 'PROPOSED'
  | 'ROUTED_TO_APPROVAL'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'REJECTED';

export const consolidationStateMachine = new StateMachine<FreightConsolidationKernelState>({
  entityType: 'freight_consolidation',
  initialState: 'PROPOSED',
  terminalStates: ['DISPATCHED', 'REJECTED'],
  transitions: [
    { from: 'PROPOSED', to: 'ROUTED_TO_APPROVAL', requiresApproval: true },
    { from: 'PROPOSED', to: 'APPROVED' },
    { from: 'ROUTED_TO_APPROVAL', to: 'APPROVED', requiresApproval: true },
    { from: 'ROUTED_TO_APPROVAL', to: 'REJECTED' },
    { from: 'APPROVED', to: 'DISPATCHED' },
  ],
});

/**
 * 12. AUTONOMOUS REPLENISHMENT & STOCK TRANSFER ORDER STATE MACHINE
 */
export type ReplenishmentOrderKernelState =
  | 'DRAFT_PROPOSED'
  | 'POLICY_EVALUATED'
  | 'PENDING_APPROVAL'
  | 'AUTO_APPROVED'
  | 'TRANSMITTED_TO_ERP'
  | 'IN_TRANSIT'
  | 'FULFILLED'
  | 'REJECTED';

export const replenishmentOrderStateMachine = new StateMachine<ReplenishmentOrderKernelState>({
  entityType: 'replenishment_order',
  initialState: 'DRAFT_PROPOSED',
  terminalStates: ['FULFILLED', 'REJECTED'],
  transitions: [
    { from: 'DRAFT_PROPOSED', to: 'POLICY_EVALUATED' },
    { from: 'POLICY_EVALUATED', to: 'PENDING_APPROVAL', requiresApproval: true },
    { from: 'POLICY_EVALUATED', to: 'AUTO_APPROVED' },
    { from: 'PENDING_APPROVAL', to: 'AUTO_APPROVED', requiresApproval: true },
    { from: 'PENDING_APPROVAL', to: 'REJECTED' },
    { from: 'AUTO_APPROVED', to: 'TRANSMITTED_TO_ERP' },
    { from: 'TRANSMITTED_TO_ERP', to: 'IN_TRANSIT' },
    { from: 'IN_TRANSIT', to: 'FULFILLED' },
  ],
});

/**
 * Global Registry Mapping
 */
export const KERNEL_STATE_MACHINES: Record<string, StateMachine<any>> = {
  purchase_order: poStateMachine,
  shipment: shipmentStateMachine,
  action: actionStateMachine,
  decision: decisionStateMachine,
  quality_inspection: qualityStateMachine,
  invoice: invoiceStateMachine,
  vendor: vendorStateMachine,
  contract: contractStateMachine,
  scenario: scenarioStateMachine,
  yard_appointment: yardAppointmentStateMachine,
  freight_consolidation: consolidationStateMachine,
  replenishment_order: replenishmentOrderStateMachine,
};



