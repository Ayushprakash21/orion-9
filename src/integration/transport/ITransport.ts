/**
 * ORION-9 WAVE 3.3 — TRANSPORT ABSTRACTION CONTRACT
 */

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

export interface ITransport {
  readonly transportId: string;
  readonly tenantId: string;
  readonly connectorId: string;
  readonly protocol: TransportProtocol;
  readonly status: TransportStatus;
  readonly config: Record<string, any>;
  readonly telemetry: TransportTelemetry;

  connect(): Promise<TransportConnectionResult>;
  disconnect(): Promise<boolean>;
  testConnection(): Promise<TransportConnectionResult>;
  send(options: TransportSendOptions): Promise<TransportSendResult>;
  receive(options?: TransportReceiveOptions): Promise<TransportReceiveResult>;
  getStatus(): TransportStatus;
  getRecord(): TransportRecord;
}
