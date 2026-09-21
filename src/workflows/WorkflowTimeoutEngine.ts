/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Timeout Engine
 * 
 * Enforces step, approval, external wait, and workflow-level bounded timeouts.
 * Guarantees that workflows cannot remain in indefinite execution states.
 */

import { WorkflowInstance, WorkflowTimeoutPolicy } from './types';

export interface TimeoutEvaluationResult {
  hasTimedOut: boolean;
  timeoutType?: 'WORKFLOW' | 'STEP' | 'APPROVAL' | 'EXTERNAL_WAIT';
  action: 'FAIL' | 'COMPENSATE' | 'ESCALATE' | 'RETRY';
  elapsedMs: number;
  thresholdMs: number;
}

export class WorkflowTimeoutEngine {
  public static readonly DEFAULT_WORKFLOW_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours max
  public static readonly DEFAULT_STEP_TIMEOUT_MS = 15 * 60 * 1000; // 15 mins
  public static readonly DEFAULT_APPROVAL_TIMEOUT_MS = 48 * 60 * 60 * 1000; // 48 hours

  /**
   * Checks if an instance or step has breached timeout limits
   */
  public static evaluateInstanceTimeout(
    instance: WorkflowInstance,
    policy?: WorkflowTimeoutPolicy,
    stepTimeoutMs?: number,
    now: number = Date.now()
  ): TimeoutEvaluationResult {
    const startedAt = new Date(instance.startedAt).getTime();
    const updatedAt = new Date(instance.updatedAt).getTime();
    const totalElapsed = now - startedAt;

    // 1. Overall workflow timeout check
    const maxWorkflowTimeout = policy?.workflowTimeoutMs || this.DEFAULT_WORKFLOW_TIMEOUT_MS;
    if (totalElapsed > maxWorkflowTimeout) {
      return {
        hasTimedOut: true,
        timeoutType: 'WORKFLOW',
        action: policy?.onTimeout || 'FAIL',
        elapsedMs: totalElapsed,
        thresholdMs: maxWorkflowTimeout
      };
    }

    // 2. Step timeout check
    const currentStepElapsed = now - updatedAt;
    const maxStepTimeout = stepTimeoutMs || policy?.stepTimeoutMs || this.DEFAULT_STEP_TIMEOUT_MS;

    if (instance.status === 'RUNNING' && currentStepElapsed > maxStepTimeout) {
      return {
        hasTimedOut: true,
        timeoutType: 'STEP',
        action: policy?.onTimeout || 'FAIL',
        elapsedMs: currentStepElapsed,
        thresholdMs: maxStepTimeout
      };
    }

    // 3. Approval timeout check
    if (instance.status === 'WAITING_APPROVAL' && currentStepElapsed > (stepTimeoutMs || this.DEFAULT_APPROVAL_TIMEOUT_MS)) {
      return {
        hasTimedOut: true,
        timeoutType: 'APPROVAL',
        action: 'ESCALATE',
        elapsedMs: currentStepElapsed,
        thresholdMs: stepTimeoutMs || this.DEFAULT_APPROVAL_TIMEOUT_MS
      };
    }

    // 4. External wait timeout check
    if (instance.status === 'WAITING_EXTERNAL' && currentStepElapsed > (stepTimeoutMs || this.DEFAULT_STEP_TIMEOUT_MS)) {
      return {
        hasTimedOut: true,
        timeoutType: 'EXTERNAL_WAIT',
        action: 'ESCALATE',
        elapsedMs: currentStepElapsed,
        thresholdMs: stepTimeoutMs || this.DEFAULT_STEP_TIMEOUT_MS
      };
    }

    return {
      hasTimedOut: false,
      action: 'FAIL',
      elapsedMs: totalElapsed,
      thresholdMs: maxWorkflowTimeout
    };
  }
}
