/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * ControlledBackpressureService: Circuit Breakers, Rate Limiting & Queue Load Shedding
 */

import { CircuitBreakerStatus, CircuitBreakerState } from './types';
import { observabilityService } from './ObservabilityService';

export class ControlledBackpressureService {
  private static instance: ControlledBackpressureService;
  private breakers: Map<string, CircuitBreakerStatus> = new Map();
  private defaultThreshold: number = 5;
  private defaultResetTimeoutMs: number = 30000; // 30s

  private constructor() {
    this.seedDefaultBreakers();
  }

  public static getInstance(): ControlledBackpressureService {
    if (!ControlledBackpressureService.instance) {
      ControlledBackpressureService.instance = new ControlledBackpressureService();
    }
    return ControlledBackpressureService.instance;
  }

  private seedDefaultBreakers(): void {
    const defaultServices = [
      'ERP_SAP_CONNECTOR',
      'CARRIER_3PL_WEBHOOK',
      'GEMINI_AI_ENDPOINT',
      'CUSTOMS_BROKER_EDI',
    ];

    for (const service of defaultServices) {
      this.breakers.set(service, {
        serviceName: service,
        state: 'CLOSED',
        failureCount: 0,
        threshold: this.defaultThreshold,
        resetTimeoutMs: this.defaultResetTimeoutMs,
      });
    }
  }

  public getStatus(serviceName: string): CircuitBreakerStatus {
    let breaker = this.breakers.get(serviceName);
    if (!breaker) {
      breaker = {
        serviceName,
        state: 'CLOSED',
        failureCount: 0,
        threshold: this.defaultThreshold,
        resetTimeoutMs: this.defaultResetTimeoutMs,
      };
      this.breakers.set(serviceName, breaker);
    }

    // Check if timeout has expired to transition OPEN -> HALF_OPEN
    if (breaker.state === 'OPEN' && breaker.lastFailureTime) {
      const elapsed = Date.now() - breaker.lastFailureTime;
      if (elapsed > breaker.resetTimeoutMs) {
        breaker.state = 'HALF_OPEN';
        this.breakers.set(serviceName, breaker);
        observabilityService.info(`[CIRCUIT_BREAKER_HALF_OPEN] Circuit breaker for ${serviceName} entered HALF_OPEN state`);
      }
    }

    return breaker;
  }

  /**
   * Asserts whether a call to the service is permitted.
   */
  public canExecute(serviceName: string): boolean {
    const status = this.getStatus(serviceName);
    return status.state !== 'OPEN';
  }

  /**
   * Reports a successful operation, resetting failure count.
   */
  public recordSuccess(serviceName: string): void {
    const breaker = this.getStatus(serviceName);
    if (breaker.state === 'HALF_OPEN' || breaker.failureCount > 0) {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.lastFailureTime = undefined;
      this.breakers.set(serviceName, breaker);
      observabilityService.info(`[CIRCUIT_BREAKER_RESET] Circuit breaker for ${serviceName} reset to CLOSED`);
    }
  }

  /**
   * Reports a failed operation, potentially tripping the circuit breaker to OPEN.
   */
  public recordFailure(serviceName: string): CircuitBreakerStatus {
    const breaker = this.getStatus(serviceName);
    breaker.failureCount += 1;
    breaker.lastFailureTime = Date.now();

    if (breaker.state === 'HALF_OPEN' || breaker.failureCount >= breaker.threshold) {
      breaker.state = 'OPEN';
      observabilityService.error(`[CIRCUIT_BREAKER_TRIPPED] Circuit breaker for ${serviceName} tripped to OPEN (${breaker.failureCount} failures)`);
    }

    this.breakers.set(serviceName, breaker);
    return breaker;
  }

  public getAllBreakers(): CircuitBreakerStatus[] {
    return Array.from(this.breakers.values()).map(b => this.getStatus(b.serviceName));
  }

  public manuallyReset(serviceName: string): boolean {
    const breaker = this.breakers.get(serviceName);
    if (!breaker) return false;
    breaker.state = 'CLOSED';
    breaker.failureCount = 0;
    breaker.lastFailureTime = undefined;
    this.breakers.set(serviceName, breaker);
    return true;
  }
}

export const controlledBackpressureService = ControlledBackpressureService.getInstance();
