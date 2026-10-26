/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Retry Engine
 * 
 * Manages transient failure retry policies with Fixed, Linear, and Exponential backoff.
 * Strictly forbids retrying permanent authorization, policy, tenant, or approval rejections.
 */

import { WorkflowRetry, WorkflowRetryPolicy } from './types';

export class WorkflowRetryEngine {
  private static readonly NON_RETRYABLE_ERRORS = new Set([
    'UNAUTHORIZED',
    'FORBIDDEN',
    'PERMISSION_DENIED',
    'TENANT_ACCESS_DENIED',
    'TENANT_DENIED',
    'TENANT_MISMATCH',
    'UNAUTHENTICATED',
    'AUTH_EXPIRED',
    'POLICY_DENIED',
    'POLICY_BLOCKED',
    'POLICY_VIOLATION',
    'APPROVAL_REJECTED',
    'INVALID_STATE',
    'PROHIBITED_ACTION',
    'INVALID_ARGUMENT',
    'NOT_FOUND',
    'ALREADY_EXISTS'
  ]);

  /**
   * Evaluates whether an error can be retried
   */
  public static isRetryable(errorCode: string): boolean {
    if (!errorCode) return false;
    const normalized = errorCode.toUpperCase();
    if (this.NON_RETRYABLE_ERRORS.has(normalized)) {
      return false;
    }
    // Deep check for permission/authorization phrases in composite error codes
    if (
      normalized.includes('PERMISSION_DENIED') ||
      normalized.includes('UNAUTHORIZED') ||
      normalized.includes('FORBIDDEN') ||
      normalized.includes('TENANT_ACCESS_DENIED') ||
      normalized.includes('POLICY_BLOCKED') ||
      normalized.includes('UNAUTHENTICATED')
    ) {
      return false;
    }
    return (
      normalized.includes('NETWORK') ||
      normalized.includes('TIMEOUT') ||
      normalized.includes('RATE_LIMIT') ||
      normalized.includes('TEMPORARY') ||
      normalized.includes('UNAVAILABLE') ||
      normalized.includes('ECONNRESET') ||
      normalized.includes('EPIPE') ||
      normalized.includes('RESET') ||
      normalized.includes('503') ||
      normalized.includes('504')
    );
  }

  /**
   * Calculates backoff delay in milliseconds
   */
  public static calculateDelayMs(policy: WorkflowRetryPolicy, attempt: number): number {
    const base = policy.initialDelayMs || 1000;
    const max = policy.maxDelayMs || 60000;

    let delay = base;
    switch (policy.backoffStrategy) {
      case 'FIXED':
        delay = base;
        break;
      case 'LINEAR':
        delay = base * attempt;
        break;
      case 'EXPONENTIAL':
        delay = base * Math.pow(2, attempt - 1);
        break;
    }
    return Math.min(delay, max);
  }

  /**
   * Plans the next retry state or marks as exhausted
   */
  public static planNextRetry(
    tenantId: string,
    workflowInstanceId: string,
    stepId: string,
    currentAttempt: number,
    policy: WorkflowRetryPolicy,
    error: { code: string; message: string }
  ): WorkflowRetry {
    const isRetryable = this.isRetryable(error.code);
    const nextAttempt = currentAttempt + 1;
    const isExhausted = !isRetryable || nextAttempt > policy.maxRetries;

    const delayMs = isExhausted ? 0 : this.calculateDelayMs(policy, nextAttempt);
    const nextRetryAt = isExhausted
      ? new Date().toISOString()
      : new Date(Date.now() + delayMs).toISOString();

    return {
      retryId: `RETRY-${workflowInstanceId}-${stepId}-${nextAttempt}`,
      tenantId,
      workflowInstanceId,
      stepId,
      retryCount: currentAttempt,
      maxRetries: policy.maxRetries,
      backoffStrategy: policy.backoffStrategy,
      nextRetryAt,
      lastError: `[${error.code}] ${error.message}`,
      status: isExhausted ? 'EXHAUSTED' : 'PENDING'
    };
  }
}
