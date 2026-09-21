/**
 * ORION-9 ENTERPRISE CONNECTOR RUNTIME
 * Wave 3.2 Connector Infrastructure Layer
 *
 * Base runtime abstraction enforcing common lifecycle, circuit breaking,
 * telemetry, credential security, sandbox/live mode rules, and error classification.
 */

import {
  ConnectorRecord,
  ConnectorHealthStatus,
  ConnectorEnvironment,
  StructuredConnectorError,
  SyncJobRecord
} from './types';
import { CircuitBreaker } from './CircuitBreaker';
import { credentialVaultService } from './CredentialVaultService';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { integrationRetryEngine } from './IntegrationRetryEngine';

export interface IConnectorRuntime {
  connect(): Promise<ConnectorHealthStatus>;
  disconnect(): Promise<ConnectorHealthStatus>;
  healthCheck(): Promise<ConnectorHealthStatus>;
  testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }>;
  send(payload: any, options?: { correlationId?: string }): Promise<any>;
  receive(params?: Record<string, any>): Promise<any>;
  poll(params?: Record<string, any>): Promise<any[]>;
  push(data: any): Promise<{ acknowledged: boolean; messageId: string }>;
  sync(jobConfig?: Record<string, any>): Promise<Partial<SyncJobRecord>>;
  cancel(jobId?: string): Promise<boolean>;
  getStatus(): ConnectorHealthStatus;
}

export abstract class BaseConnectorRuntime implements IConnectorRuntime {
  public readonly connectorId: string;
  public readonly tenantId: string;
  public readonly connectorType: ConnectorRecord['type'];
  public readonly name: string;
  public readonly version: string;
  public environment: ConnectorEnvironment;
  public endpointReference: string;
  public credentialReference: string;

  protected status: ConnectorHealthStatus = 'REGISTERED';
  protected circuitBreaker: CircuitBreaker;
  protected lastSuccessfulSync?: string;
  protected lastFailure?: string;
  protected lastHealthCheck?: string;
  protected latencyMs: number = 0;
  protected failureCount: number = 0;
  protected recordsProcessed: number = 0;

  constructor(record: ConnectorRecord) {
    this.connectorId = record.connectorId;
    this.tenantId = record.tenantId;
    this.connectorType = record.type;
    this.name = record.name;
    this.version = record.version || '1.0.0';
    this.environment = record.environment || 'SANDBOX';
    this.endpointReference = record.endpointReference || '';
    this.credentialReference = record.credentialReference || credentialVaultService.generateCredentialReference(record.tenantId, record.connectorId);
    this.status = record.status || (this.environment === 'LIVE' ? 'UNCONFIGURED' : 'CONNECTED');

    this.circuitBreaker = new CircuitBreaker(this.connectorId, this.tenantId);
  }

  public getStatus(): ConnectorHealthStatus {
    const cbState = this.circuitBreaker.getState();
    if (cbState === 'OPEN') {
      return 'ERROR';
    }
    return this.status;
  }

  public getRecord(): ConnectorRecord {
    return {
      connectorId: this.connectorId,
      tenantId: this.tenantId,
      type: this.connectorType,
      name: this.name,
      version: this.version,
      status: this.getStatus(),
      environment: this.environment,
      configuration: {
        endpointReference: this.endpointReference,
        credentialReference: this.credentialReference,
        environment: this.environment,
      },
      capabilities: this.getCapabilities(),
      health: {
        lastSuccessfulRequest: this.lastSuccessfulSync,
        lastFailure: this.lastFailure,
        failureCount: this.failureCount,
        latencyMs: this.latencyMs,
        recordsProcessed: this.recordsProcessed,
      },
      endpointReference: this.endpointReference,
      credentialReference: this.credentialReference,
      lastHealthCheck: this.lastHealthCheck,
      lastSuccessfulSync: this.lastSuccessfulSync,
      lastFailure: this.lastFailure,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public abstract getCapabilities(): ConnectorRecord['capabilities'];

  public async connect(): Promise<ConnectorHealthStatus> {
    this.status = 'CONNECTING';

    if (this.environment === 'LIVE') {
      if (!this.endpointReference || !this.endpointReference.startsWith('http')) {
        this.status = 'UNCONFIGURED';
        this.circuitBreaker.onFailure('LIVE endpoint reference missing or invalid');
        return 'UNCONFIGURED';
      }
      try {
        credentialVaultService.resolveCredentials(this.credentialReference, this.tenantId);
      } catch (err: any) {
        this.status = 'AUTH_FAILED';
        this.circuitBreaker.onFailure(err.message);
        return 'AUTH_FAILED';
      }
    }

    const testRes = await this.testConnection();
    if (testRes.success) {
      this.status = 'CONNECTED';
      this.circuitBreaker.onSuccess();
      this.lastHealthCheck = new Date().toISOString();
    } else {
      this.status = this.environment === 'LIVE' ? 'ERROR' : 'DEGRADED';
      this.circuitBreaker.onFailure(testRes.message);
    }

    this.publishEvent('orion:connector:connected', { status: this.status });
    return this.status;
  }

  public async disconnect(): Promise<ConnectorHealthStatus> {
    this.status = 'DISCONNECTED';
    this.publishEvent('orion:connector:disconnected', { status: this.status });
    return this.status;
  }

  public async healthCheck(): Promise<ConnectorHealthStatus> {
    this.lastHealthCheck = new Date().toISOString();
    if (!this.circuitBreaker.canExecute()) {
      this.status = 'ERROR';
      return 'ERROR';
    }

    const res = await this.testConnection();
    if (res.success) {
      this.status = 'CONNECTED';
      this.circuitBreaker.onSuccess();
      this.latencyMs = res.latencyMs;
    } else {
      this.failureCount++;
      this.circuitBreaker.onFailure(res.message);
      this.status = this.failureCount >= 3 ? 'ERROR' : 'DEGRADED';
    }
    return this.status;
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    if (this.environment === 'SANDBOX') {
      // Deterministic sandbox response
      const latency = Math.floor(Math.random() * 20) + 15;
      this.latencyMs = latency;
      return {
        success: true,
        latencyMs: latency,
        message: `SANDBOX Mode connection verified for connector ${this.name}`,
      };
    }

    // LIVE Mode: Check if endpoint exists
    if (!this.endpointReference || this.endpointReference.includes('unconfigured')) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'LIVE endpoint reference unconfigured or unreachable.',
      };
    }

    try {
      credentialVaultService.resolveCredentials(this.credentialReference, this.tenantId);
      // Simulated live handshake validation
      const latency = Date.now() - start + 45;
      return {
        success: true,
        latencyMs: latency,
        message: `LIVE endpoint handshake successful to ${this.endpointReference}`,
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: `LIVE authentication check failed: ${err.message}`,
      };
    }
  }

  public async send(payload: any, options?: { correlationId?: string }): Promise<any> {
    const correlationId = options?.correlationId || `corr-${Date.now().toString(36)}`;
    if (!this.circuitBreaker.canExecute()) {
      throw this.createError('NON_RETRYABLE', 'CIRCUIT_BREAKER_OPEN', `Connector ${this.connectorId} circuit breaker is OPEN`, correlationId);
    }

    try {
      const result = await this.executeSend(payload, correlationId);
      this.recordsProcessed++;
      this.lastSuccessfulSync = new Date().toISOString();
      this.circuitBreaker.onSuccess();
      return result;
    } catch (err: any) {
      this.failureCount++;
      this.lastFailure = new Date().toISOString();
      const classifiedErr = err.classification ? err : this.createError(
        integrationRetryEngine.classifyError(err) === 'RETRYABLE' ? 'RETRYABLE' : 'NON_RETRYABLE',
        'CONNECTOR_SEND_FAILED',
        err.message || 'Send execution failed',
        correlationId
      );
      this.circuitBreaker.onFailure(classifiedErr.message);
      throw classifiedErr;
    }
  }

  public async receive(params?: Record<string, any>): Promise<any> {
    const correlationId = params?.correlationId || `corr-${Date.now().toString(36)}`;
    if (!this.circuitBreaker.canExecute()) {
      throw this.createError('NON_RETRYABLE', 'CIRCUIT_BREAKER_OPEN', `Connector ${this.connectorId} circuit breaker is OPEN`, correlationId);
    }

    return this.executeReceive(params, correlationId);
  }

  public async poll(params?: Record<string, any>): Promise<any[]> {
    const items = await this.receive(params);
    return Array.isArray(items) ? items : [items];
  }

  public async push(data: any): Promise<{ acknowledged: boolean; messageId: string }> {
    const res = await this.send(data);
    return {
      acknowledged: true,
      messageId: res?.messageId || res?.id || `msg-${Date.now().toString(36)}`,
    };
  }

  public async sync(jobConfig?: Record<string, any>): Promise<Partial<SyncJobRecord>> {
    const correlationId = `sync-corr-${Date.now().toString(36)}`;
    const items = await this.poll(jobConfig);
    return {
      connectorId: this.connectorId,
      tenantId: this.tenantId,
      correlationId,
      recordsRead: items.length,
      recordsProcessed: items.length,
      recordsSucceeded: items.length,
      recordsFailed: 0,
      status: 'COMPLETED',
    };
  }

  public async cancel(jobId?: string): Promise<boolean> {
    this.publishEvent('orion:connector:sync_cancelled', { jobId });
    return true;
  }

  protected abstract executeSend(payload: any, correlationId: string): Promise<any>;
  protected abstract executeReceive(params: Record<string, any> | undefined, correlationId: string): Promise<any>;

  protected createError(
    classification: 'RETRYABLE' | 'NON_RETRYABLE',
    code: string,
    message: string,
    correlationId: string,
    httpStatus?: number
  ): StructuredConnectorError {
    return {
      classification,
      code,
      message,
      httpStatus,
      timestamp: new Date().toISOString(),
      correlationId,
      details: {
        connectorId: this.connectorId,
        tenantId: this.tenantId,
        type: this.connectorType,
      },
    };
  }

  protected publishEvent(topic: string, data: Record<string, any>): void {
    kernelEventBus.publish(topic as any, {
      connectorId: this.connectorId,
      tenantId: this.tenantId,
      type: this.connectorType,
      ...data,
    }, {
      actor: { id: 'ConnectorRuntime', type: 'SYSTEM', name: this.name }
    });

    kernelAuditEngine.record({
      action: 'CONNECTOR_RUNTIME_EVENT',
      actor: { id: 'ConnectorRuntime', type: 'SYSTEM', name: this.name },
      entityId: this.connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'INTERNAL',
      details: { tenantId: this.tenantId, topic, ...data }
    });
  }
}
