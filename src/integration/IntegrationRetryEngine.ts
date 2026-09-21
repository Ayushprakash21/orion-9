/**
 * ORION-9 INTEGRATION RETRY ENGINE
 * Layer 8 Integration Fabric Foundation
 *
 * Implements exponential backoff, retryable vs non-retryable error classification,
 * and maximum attempt thresholds to prevent infinite loops.
 */

import { RetryPolicy } from './types';

export class IntegrationRetryEngine {
  private static defaultPolicy: RetryPolicy = {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    backoffFactor: 2,
  };

  /**
   * Determines if an error is transient and retryable
   */
  public static isRetryable(error: any): boolean {
    if (!error) return false;

    const msg = (error.message || String(error)).toUpperCase();
    const code = error.code || error.status;

    // Non-retryable scenarios
    if (msg.includes('UNAUTHORIZED') || msg.includes('AUTH_FAILED') || code === 401 || code === 403) {
      return false;
    }
    if (msg.includes('VALIDATION') || msg.includes('MISSING REQUIRED FIELD') || code === 400 || code === 422) {
      return false;
    }
    if (msg.includes('DUPLICATE') || msg.includes('IDEMPOTENCY_CONFLICT')) {
      return false;
    }

    // Retryable scenarios
    if (
      msg.includes('TIMEOUT') ||
      msg.includes('NETWORK') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('BUSY') ||
      msg.includes('LOCK_CONTENTION') ||
      code === 500 ||
      code === 502 ||
      code === 503 ||
      code === 504 ||
      code === 429
    ) {
      return true;
    }

    // Default to retryable for unknown infrastructure faults
    return true;
  }

  /**
   * Classifies error into RETRYABLE vs NON_RETRYABLE
   */
  public static classifyError(error: any): 'RETRYABLE' | 'NON_RETRYABLE' {
    return this.isRetryable(error) ? 'RETRYABLE' : 'NON_RETRYABLE';
  }

  /**
   * Calculates backoff delay in milliseconds for attempt N
   */
  public static calculateBackoff(attempt: number, policy: Partial<RetryPolicy> = {}): number {
    const config = { ...this.defaultPolicy, ...policy };
    if (attempt <= 1) return config.initialDelayMs;

    const expDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(expDelay, config.maxDelayMs);
  }

  /**
   * Executes an async integration action with controlled retry policy
   */
  public static async executeWithRetry<T>(
    action: (attempt: number) => Promise<T>,
    policy: Partial<RetryPolicy> = {}
  ): Promise<{ result?: T; attemptCount: number; lastError?: Error }> {
    const config = { ...this.defaultPolicy, ...policy };
    let attemptCount = 0;
    let lastError: Error | undefined;

    while (attemptCount < config.maxAttempts) {
      attemptCount++;
      try {
        const result = await action(attemptCount);
        return { result, attemptCount };
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // If error is not retryable, break early
        if (!this.isRetryable(lastError)) {
          break;
        }

        // If max attempts reached, stop retrying
        if (attemptCount >= config.maxAttempts) {
          break;
        }

        // Wait backoff duration before next attempt
        const delay = this.calculateBackoff(attemptCount, config);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { attemptCount, lastError };
  }
}

export const integrationRetryEngine = IntegrationRetryEngine;
