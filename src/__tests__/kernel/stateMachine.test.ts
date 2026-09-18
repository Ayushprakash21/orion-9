/**
 * ORION-9 KERNEL — STATE MACHINE TESTS
 */

import { describe, it, expect } from 'vitest';
import {
  poStateMachine,
  shipmentStateMachine,
  invoiceStateMachine,
  POState,
} from '../../kernel/StateMachine';

describe('Purchase Order State Machine', () => {
  it('allows DRAFT → VALIDATING', () => {
    const result = poStateMachine.canTransition('DRAFT', 'VALIDATING');
    expect(result.valid).toBe(true);
  });

  it('allows DRAFT → PENDING_APPROVAL', () => {
    const result = poStateMachine.canTransition('DRAFT', 'PENDING_APPROVAL');
    expect(result.valid).toBe(true);
  });

  it('allows PENDING_APPROVAL → APPROVED', () => {
    const result = poStateMachine.canTransition('PENDING_APPROVAL', 'APPROVED');
    expect(result.valid).toBe(true);
  });

  it('allows PENDING_APPROVAL → REJECTED', () => {
    const result = poStateMachine.canTransition('PENDING_APPROVAL', 'REJECTED');
    expect(result.valid).toBe(true);
  });

  it('allows APPROVED → RELEASED', () => {
    const result = poStateMachine.canTransition('APPROVED', 'RELEASED');
    expect(result.valid).toBe(true);
  });

  it('rejects illegal transition DRAFT → RECEIVED (non-existent state)', () => {
    // RECEIVED is not a valid POState; transition should fail.
    const result = poStateMachine.canTransition('DRAFT', 'FULFILLED');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Illegal state transition');
  });

  it('rejects transition from terminal state CLOSED', () => {
    const result = poStateMachine.canTransition('CLOSED', 'APPROVED');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('terminal state');
  });

  it('rejects transition from terminal state CANCELLED', () => {
    const result = poStateMachine.canTransition('CANCELLED', 'DRAFT');
    expect(result.valid).toBe(false);
  });

  it('allows same-state no-op transition', () => {
    const result = poStateMachine.canTransition('DRAFT', 'DRAFT');
    expect(result.valid).toBe(true);
  });

  it('transitions state and returns new state via .transition()', () => {
    const newState = poStateMachine.transition('po-test-001', 'DRAFT', 'PENDING_APPROVAL', {
      correlationId: 'corr-test-001',
      tenantId: 'org-001',
    });
    expect(newState).toBe('PENDING_APPROVAL');
  });

  it('throws when calling .transition() for invalid move', () => {
    expect(() => {
      poStateMachine.transition('po-test-002', 'CLOSED', 'APPROVED');
    }).toThrow();
  });
});

describe('Shipment State Machine', () => {
  it('allows BOOKED → PLANNED', () => {
    expect(shipmentStateMachine.canTransition('BOOKED', 'PLANNED').valid).toBe(true);
  });

  it('allows IN_TRANSIT → DELAYED', () => {
    expect(shipmentStateMachine.canTransition('IN_TRANSIT', 'DELAYED').valid).toBe(true);
  });

  it('rejects DELIVERED → IN_TRANSIT (terminal)', () => {
    const result = shipmentStateMachine.canTransition('DELIVERED', 'IN_TRANSIT');
    expect(result.valid).toBe(false);
  });
});

describe('Invoice State Machine', () => {
  it('allows RECEIVED → VALIDATING → MATCHING → MATCHED → APPROVED → PAID', () => {
    const transitions: Array<[string, string]> = [
      ['RECEIVED', 'VALIDATING'],
      ['VALIDATING', 'MATCHING'],
      ['MATCHING', 'MATCHED'],
      ['MATCHED', 'APPROVED'],
      ['APPROVED', 'PAID'],
    ];
    for (const [from, to] of transitions) {
      const r = invoiceStateMachine.canTransition(from as any, to as any);
      expect(r.valid).toBe(true);
    }
  });

  it('rejects PAID → REJECTED (terminal)', () => {
    const result = invoiceStateMachine.canTransition('PAID', 'REJECTED');
    expect(result.valid).toBe(false);
  });
});
