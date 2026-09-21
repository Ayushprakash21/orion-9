/**
 * ORION-9 CONNECTOR CIRCUIT BREAKER
 * Wave 3.2 Resilience & Reliability Architecture
 *
 * Implements connector-level circuit breaker pattern with CLOSED, OPEN, and HALF_OPEN states.
 * Emits observable events and kernel audit logs for every state transition.
 */

import { CircuitBreakerState, CircuitBreakerTelemetry } from './types';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Consecutive failures before opening
  cooldownPeriodMs: number;  // Time OPEN state waits before HALF_OPEN probe
}

export class CircuitBreaker {
  public readonly connectorId: string;
  public readonly tenantId: string;
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures: number = 0;
  private lastStateChange: string = new Date().toISOString();
  private nextAttemptAllowedAt?: string;
  private config: CircuitBreakerConfig;

  constructor(connectorId: string, tenantId: string, config?: Partial<CircuitBreakerConfig>) {
    this.connectorId = connectorId;
    this.tenantId = tenantId;
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      cooldownPeriodMs: config?.cooldownPeriodMs ?? 5000,
    };
  }

  public getState(): CircuitBreakerState {
    this.evaluateCooldown();
    return this.state;
  }

  public getTelemetry(): CircuitBreakerTelemetry {
    this.evaluateCooldown();
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastStateChange: this.lastStateChange,
      nextAttemptAllowedAt: this.nextAttemptAllowedAt,
    };
  }

  /**
   * Checks if an execution request is allowed through the circuit breaker.
   * Throws Error if OPEN.
   */
  public canExecute(): boolean {
    this.evaluateCooldown();
    if (this.state === 'OPEN') {
      return false;
    }
    return true;
  }

  /**
   * Records a successful operation execution
   */
  public onSuccess(): void {
    this.evaluateCooldown();
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('CLOSED', 'Probe request succeeded in HALF_OPEN state.');
    }
    this.consecutiveFailures = 0;
  }

  /**
   * Records a failed operation execution
   */
  public onFailure(errorMessage: string): void {
    this.evaluateCooldown();
    this.consecutiveFailures += 1;

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN', `Probe request failed in HALF_OPEN state: ${errorMessage}`);
    } else if (this.state === 'CLOSED' && this.consecutiveFailures >= this.config.failureThreshold) {
      this.transitionTo('OPEN', `Failure threshold (${this.config.failureThreshold}) exceeded: ${errorMessage}`);
    }
  }

  /**
   * Manually resets circuit breaker to CLOSED state
   */
  public reset(actor: string = 'System Admin'): void {
    this.consecutiveFailures = 0;
    this.transitionTo('CLOSED', `Manual reset triggered by ${actor}`);
  }

  private evaluateCooldown(): void {
    if (this.state === 'OPEN' && this.nextAttemptAllowedAt) {
      const now = new Date().getTime();
      const allowedAt = new Date(this.nextAttemptAllowedAt).getTime();
      if (now >= allowedAt) {
        this.transitionTo('HALF_OPEN', 'Cooldown period expired. Allowing single probe request.');
      }
    }
  }

  private transitionTo(newState: CircuitBreakerState, reason: string): void {
    const previousState = this.state;
    if (previousState === newState) return;

    this.state = newState;
    const now = new Date();
    this.lastStateChange = now.toISOString();

    if (newState === 'OPEN') {
      this.nextAttemptAllowedAt = new Date(now.getTime() + this.config.cooldownPeriodMs).toISOString();
    } else {
      this.nextAttemptAllowedAt = undefined;
    }

    // Publish observable event
    kernelEventBus.publish('orion:circuit_breaker:changed' as any, {
      connectorId: this.connectorId,
      tenantId: this.tenantId,
      previousState,
      newState,
      reason,
      consecutiveFailures: this.consecutiveFailures,
    }, {
      actor: { id: 'System', type: 'SYSTEM', name: 'CircuitBreaker' }
    });

    // Audit log
    kernelAuditEngine.record({
      action: 'CIRCUIT_BREAKER_STATE_CHANGE',
      actor: { id: 'System', type: 'SYSTEM', name: 'CircuitBreaker' },
      entityId: this.connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'INTERNAL',
      details: {
        tenantId: this.tenantId,
        previousState,
        newState,
        reason,
        consecutiveFailures: this.consecutiveFailures,
      }
    });
  }
}
