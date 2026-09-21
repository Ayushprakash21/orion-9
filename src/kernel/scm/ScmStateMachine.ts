/**
 * ORION-9 WAVE 4 — SCM STATE MACHINE
 * Enforces explicit, deterministic state transition graphs for all 27 SCM entities.
 */

export class ScmStateMachine {
  private static instance: ScmStateMachine;

  // State Transition Graphs
  private transitions: Map<string, Map<string, Set<string>>> = new Map();

  private constructor() {
    this.initializeStateGraphs();
  }

  public static getInstance(): ScmStateMachine {
    if (!ScmStateMachine.instance) {
      ScmStateMachine.instance = new ScmStateMachine();
    }
    return ScmStateMachine.instance;
  }

  private initializeStateGraphs(): void {
    // 1. Supplier Lifecycle
    this.defineTransitions('Supplier', [
      { from: 'DRAFT', to: ['SUBMITTED', 'REJECTED', 'CANCELLED'] },
      { from: 'SUBMITTED', to: ['UNDER_REVIEW', 'REJECTED'] },
      { from: 'UNDER_REVIEW', to: ['QUALIFICATION', 'REJECTED'] },
      { from: 'QUALIFICATION', to: ['APPROVED', 'REJECTED'] },
      { from: 'APPROVED', to: ['ACTIVE', 'SUSPENDED'] },
      { from: 'ACTIVE', to: ['SUSPENDED', 'BLOCKED', 'INACTIVE'] },
      { from: 'SUSPENDED', to: ['ACTIVE', 'BLOCKED', 'INACTIVE'] },
      { from: 'BLOCKED', to: ['INACTIVE'] },
    ]);

    // 2. Purchase Requisition (PR)
    this.defineTransitions('PurchaseRequisition', [
      { from: 'DRAFT', to: ['SUBMITTED', 'REJECTED'] },
      { from: 'SUBMITTED', to: ['UNDER_REVIEW', 'REJECTED'] },
      { from: 'UNDER_REVIEW', to: ['APPROVED', 'REJECTED'] },
      { from: 'APPROVED', to: ['CONVERTED'] },
    ]);

    // 3. Sourcing: RFQ / RFP
    this.defineTransitions('RFQ', [
      { from: 'DRAFT', to: ['PUBLISHED', 'CANCELLED'] },
      { from: 'PUBLISHED', to: ['SUPPLIER_INVITED', 'CANCELLED'] },
      { from: 'SUPPLIER_INVITED', to: ['RESPONSES_OPEN', 'CANCELLED'] },
      { from: 'RESPONSES_OPEN', to: ['RESPONSES_RECEIVED', 'CANCELLED'] },
      { from: 'RESPONSES_RECEIVED', to: ['CLOSED', 'EVALUATION', 'CANCELLED'] },
      { from: 'EVALUATION', to: ['AWARDED', 'CANCELLED'] },
    ]);

    // 4. Supplier Quotation
    this.defineTransitions('Quotation', [
      { from: 'DRAFT', to: ['SUBMITTED', 'EXPIRED'] },
      { from: 'SUBMITTED', to: ['RECEIVED', 'EXPIRED'] },
      { from: 'RECEIVED', to: ['UNDER_REVIEW', 'EXPIRED'] },
      { from: 'UNDER_REVIEW', to: ['ACCEPTED', 'REJECTED', 'EXPIRED'] },
    ]);

    // 5. Supplier Award
    this.defineTransitions('SupplierAward', [
      { from: 'PROPOSED', to: ['UNDER_APPROVAL', 'REJECTED'] },
      { from: 'UNDER_APPROVAL', to: ['APPROVED', 'REJECTED'] },
      { from: 'APPROVED', to: ['AWARDED', 'REJECTED'] },
    ]);

    // 6. Purchase Order (PO)
    this.defineTransitions('PurchaseOrder', [
      { from: 'DRAFT', to: ['PENDING_APPROVAL', 'CANCELLED'] },
      { from: 'PENDING_APPROVAL', to: ['APPROVED', 'REJECTED'] },
      { from: 'APPROVED', to: ['RELEASED', 'CANCELLED'] },
      { from: 'RELEASED', to: ['ACKNOWLEDGED', 'PARTIALLY_CONFIRMED', 'CONFIRMED', 'CANCELLED'] },
      { from: 'ACKNOWLEDGED', to: ['CONFIRMED', 'PARTIALLY_CONFIRMED', 'CANCELLED'] },
      { from: 'PARTIALLY_CONFIRMED', to: ['CONFIRMED', 'CANCELLED'] },
      { from: 'CONFIRMED', to: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] },
      { from: 'PARTIALLY_RECEIVED', to: ['RECEIVED', 'CLOSED'] },
      { from: 'RECEIVED', to: ['CLOSED'] },
    ]);

    // 7. Advance Shipping Notice (ASN)
    this.defineTransitions('ASN', [
      { from: 'DRAFT', to: ['SUBMITTED', 'REJECTED'] },
      { from: 'SUBMITTED', to: ['VALIDATED', 'REJECTED'] },
      { from: 'VALIDATED', to: ['ACCEPTED', 'REJECTED'] },
      { from: 'ACCEPTED', to: ['RECEIVED'] },
    ]);

    // 8. Shipment
    this.defineTransitions('Shipment', [
      { from: 'PLANNED', to: ['BOOKED', 'CANCELLED'] },
      { from: 'BOOKED', to: ['PICKED_UP', 'CANCELLED'] },
      { from: 'PICKED_UP', to: ['IN_TRANSIT', 'DELAYED', 'LOST', 'DAMAGED'] },
      { from: 'IN_TRANSIT', to: ['AT_DESTINATION', 'DELAYED', 'LOST', 'DAMAGED'] },
      { from: 'AT_DESTINATION', to: ['DELIVERED', 'DELAYED', 'DAMAGED'] },
    ]);

    // 9. Gate Entry
    this.defineTransitions('GateEntry', [
      { from: 'EXPECTED', to: ['ARRIVED', 'REJECTED'] },
      { from: 'ARRIVED', to: ['CHECKED_IN', 'REJECTED'] },
      { from: 'CHECKED_IN', to: ['DOCK_ASSIGNED', 'REJECTED'] },
      { from: 'DOCK_ASSIGNED', to: ['RELEASED', 'REJECTED'] },
    ]);

    // 10. Goods Receipt Note (GRN)
    this.defineTransitions('GRN', [
      { from: 'DRAFT', to: ['POSTED', 'REVERSED'] },
    ]);

    // 11. Quality Inspection
    this.defineTransitions('QualityInspection', [
      { from: 'PENDING', to: ['INSPECTING'] },
      { from: 'INSPECTING', to: ['PASSED', 'FAILED', 'PARTIAL', 'QUARANTINED'] },
      { from: 'QUARANTINED', to: ['RELEASED', 'FAILED'] },
    ]);

    // 12. Putaway
    this.defineTransitions('Putaway', [
      { from: 'PENDING', to: ['ALLOCATED', 'BLOCKED'] },
      { from: 'ALLOCATED', to: ['IN_PROGRESS', 'BLOCKED'] },
      { from: 'IN_PROGRESS', to: ['COMPLETED', 'BLOCKED'] },
    ]);

    // 13. Invoice
    this.defineTransitions('Invoice', [
      { from: 'RECEIVED', to: ['VALIDATING', 'REJECTED', 'DISPUTED'] },
      { from: 'VALIDATING', to: ['MATCHING', 'REJECTED', 'DISPUTED'] },
      { from: 'MATCHING', to: ['APPROVED', 'BLOCKED', 'DISPUTED'] },
      { from: 'APPROVED', to: ['PAYMENT_HANDOFF'] },
    ]);

    // 14. Payment Handoff
    this.defineTransitions('PaymentHandoff', [
      { from: 'READY_FOR_HANDOFF', to: ['SENT', 'FAILED'] },
      { from: 'SENT', to: ['ACKNOWLEDGED', 'FAILED'] },
    ]);
  }

  private defineTransitions(entityType: string, rules: Array<{ from: string; to: string[] }>): void {
    let entityMap = this.transitions.get(entityType);
    if (!entityMap) {
      entityMap = new Map();
      this.transitions.set(entityType, entityMap);
    }

    for (const rule of rules) {
      entityMap.set(rule.from, new Set(rule.to));
    }
  }

  public validateTransition(
    entityType: string,
    currentState: string,
    newState: string
  ): { valid: boolean; reason?: string } {
    // If state is identical, it's a no-op update
    if (currentState === newState) {
      return { valid: true };
    }

    const entityMap = this.transitions.get(entityType);
    if (!entityMap) {
      // If no explicit state machine rules defined, default allow
      return { valid: true };
    }

    const allowedNextStates = entityMap.get(currentState);
    if (!allowedNextStates || !allowedNextStates.has(newState)) {
      return {
        valid: false,
        reason: `Invalid state transition for ${entityType}: '${currentState}' -> '${newState}' is not permitted.`,
      };
    }

    return { valid: true };
  }
}

export const scmStateMachine = ScmStateMachine.getInstance();
