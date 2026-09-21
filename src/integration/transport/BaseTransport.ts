/**
 * ORION-9 WAVE 3.3 — BASE TRANSPORT IMPLEMENTATION
 */

import { ITransport } from './ITransport';
import {
  TransportConnectionResult,
  TransportProtocol,
  TransportRecord,
  TransportReceiveOptions,
  TransportReceiveResult,
  TransportSendOptions,
  TransportSendResult,
  TransportStatus,
  TransportTelemetry,
} from '../types';
import { credentialVaultService } from '../CredentialVaultService';

export abstract class BaseTransport implements ITransport {
  public readonly transportId: string;
  public readonly tenantId: string;
  public readonly connectorId: string;
  public readonly protocol: TransportProtocol;
  public readonly name: string;

  protected _status: TransportStatus = 'UNCONFIGURED';
  protected _config: Record<string, any>;
  protected _credentialRef?: string;
  protected _certificateRef?: string;
  protected _telemetry: TransportTelemetry;
  protected _createdAt: string;
  protected _updatedAt: string;

  constructor(record: {
    transportId: string;
    tenantId: string;
    connectorId: string;
    name: string;
    protocol: TransportProtocol;
    config?: Record<string, any>;
    credentialRef?: string;
    certificateRef?: string;
    status?: TransportStatus;
    telemetry?: Partial<TransportTelemetry>;
  }) {
    this.transportId = record.transportId;
    this.tenantId = record.tenantId;
    this.connectorId = record.connectorId;
    this.name = record.name;
    this.protocol = record.protocol;
    this._config = record.config || {};
    this._credentialRef = record.credentialRef;
    this._certificateRef = record.certificateRef;
    this._status = record.status || 'UNCONFIGURED';
    this._createdAt = new Date().toISOString();
    this._updatedAt = new Date().toISOString();

    this._telemetry = {
      totalMessagesSent: record.telemetry?.totalMessagesSent || 0,
      totalMessagesReceived: record.telemetry?.totalMessagesReceived || 0,
      totalErrors: record.telemetry?.totalErrors || 0,
      averageLatencyMs: record.telemetry?.averageLatencyMs || 0,
      lastConnectionAttempt: record.telemetry?.lastConnectionAttempt,
      lastSuccessfulConnection: record.telemetry?.lastSuccessfulConnection,
      lastFailure: record.telemetry?.lastFailure,
    };
  }

  get status(): TransportStatus {
    return this._status;
  }

  get config(): Record<string, any> {
    return { ...this._config };
  }

  get telemetry(): TransportTelemetry {
    return { ...this._telemetry };
  }

  public getStatus(): TransportStatus {
    return this._status;
  }

  public getRecord(): TransportRecord {
    return {
      transportId: this.transportId,
      tenantId: this.tenantId,
      connectorId: this.connectorId,
      name: this.name,
      protocol: this.protocol,
      status: this._status,
      config: { ...this._config },
      credentialRef: this._credentialRef,
      certificateRef: this._certificateRef,
      telemetry: { ...this._telemetry },
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  protected async resolveCredential(secretRef?: string): Promise<any> {
    const ref = secretRef || this._credentialRef;
    if (!ref) return null;
    try {
      return credentialVaultService.resolveCredentials(ref, this.tenantId);
    } catch (err) {
      return null;
    }
  }


  protected updateTelemetryOnSend(success: boolean, latencyMs: number): void {
    if (success) {
      this._telemetry.totalMessagesSent += 1;
      this._telemetry.lastSuccessfulConnection = new Date().toISOString();
    } else {
      this._telemetry.totalErrors += 1;
      this._telemetry.lastFailure = new Date().toISOString();
    }
    this.updateAvgLatency(latencyMs);
    this._updatedAt = new Date().toISOString();
  }

  protected updateTelemetryOnReceive(success: boolean, count: number, latencyMs: number): void {
    if (success) {
      this._telemetry.totalMessagesReceived += count;
      this._telemetry.lastSuccessfulConnection = new Date().toISOString();
    } else {
      this._telemetry.totalErrors += 1;
      this._telemetry.lastFailure = new Date().toISOString();
    }
    this.updateAvgLatency(latencyMs);
    this._updatedAt = new Date().toISOString();
  }

  private updateAvgLatency(latencyMs: number): void {
    const totalOps = this._telemetry.totalMessagesSent + this._telemetry.totalMessagesReceived;
    if (totalOps <= 1) {
      this._telemetry.averageLatencyMs = latencyMs;
    } else {
      this._telemetry.averageLatencyMs = Math.round(
        (this._telemetry.averageLatencyMs * (totalOps - 1) + latencyMs) / totalOps
      );
    }
  }

  public abstract connect(): Promise<TransportConnectionResult>;
  public abstract disconnect(): Promise<boolean>;
  public abstract testConnection(): Promise<TransportConnectionResult>;
  public abstract send(options: TransportSendOptions): Promise<TransportSendResult>;
  public abstract receive(options?: TransportReceiveOptions): Promise<TransportReceiveResult>;
}
