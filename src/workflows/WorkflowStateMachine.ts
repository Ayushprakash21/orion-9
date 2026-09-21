/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow State Machine
 * 
 * Strict deterministic state transitions for enterprise workflow execution.
 * Prevents illegal jumps or client-side status manipulation.
 */

import { WorkflowInstanceStatus, WorkflowTransition } from './types';

export class WorkflowStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<WorkflowInstanceStatus, WorkflowInstanceStatus[]> = {
    PENDING: ['RUNNING', 'CANCELLED'],
    RUNNING: [
      'WAITING_APPROVAL',
      'WAITING_RETRY',
      'WAITING_EXTERNAL',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
      'TIMED_OUT',
      'COMPENSATING'
    ],
    WAITING_APPROVAL: ['RUNNING', 'CANCELLED', 'TIMED_OUT', 'FAILED'],
    WAITING_RETRY: ['RUNNING', 'CANCELLED', 'FAILED'],
    WAITING_EXTERNAL: ['RUNNING', 'CANCELLED', 'TIMED_OUT', 'FAILED'],
    TIMED_OUT: ['COMPENSATING', 'FAILED', 'ESCALATED'],
    FAILED: ['WAITING_RETRY', 'COMPENSATING', 'ESCALATED', 'CANCELLED'],
    COMPENSATING: ['COMPENSATED', 'FAILED'],
    ESCALATED: ['RUNNING', 'COMPENSATING', 'FAILED', 'CANCELLED'],
    COMPLETED: [], // Terminal
    COMPENSATED: [], // Terminal
    CANCELLED: [] // Terminal
  };

  /**
   * Evaluates if a state transition is legal
   */
  public static canTransition(from: WorkflowInstanceStatus, to: WorkflowInstanceStatus): boolean {
    const targets = this.ALLOWED_TRANSITIONS[from];
    return targets ? targets.includes(to) : false;
  }

  /**
   * Asserts that a state transition is valid or throws descriptive error
   */
  public static validateTransition(from: WorkflowInstanceStatus, to: WorkflowInstanceStatus): WorkflowTransition {
    const allowed = this.canTransition(from, to);
    if (!allowed) {
      const errorMsg = `Illegal workflow state transition from '${from}' to '${to}'. Allowed transitions from '${from}': [${(this.ALLOWED_TRANSITIONS[from] || []).join(', ')}]`;
      return {
        from,
        to,
        allowed: false,
        reason: errorMsg
      };
    }
    return {
      from,
      to,
      allowed: true
    };
  }

  /**
   * Returns true if status is an active running/waiting state
   */
  public static isActive(status: WorkflowInstanceStatus): boolean {
    return [
      'RUNNING',
      'WAITING_APPROVAL',
      'WAITING_RETRY',
      'WAITING_EXTERNAL',
      'COMPENSATING',
      'ESCALATED'
    ].includes(status);
  }

  /**
   * Returns true if state is terminal
   */
  public static isTerminal(status: WorkflowInstanceStatus): boolean {
    return ['COMPLETED', 'COMPENSATED', 'CANCELLED'].includes(status);
  }
}
