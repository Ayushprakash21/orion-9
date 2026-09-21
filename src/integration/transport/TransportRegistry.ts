/**
 * ORION-9 WAVE 3.3 — TRANSPORT REGISTRY
 * Tenant-isolated registry for managing active transport instances.
 */

import { ITransport } from './ITransport';
import { TransportRecord } from '../types';

export class TransportRegistry {
  private static instance: TransportRegistry;
  private transports: Map<string, ITransport> = new Map(); // key: `${tenantId}:${transportId}`

  private constructor() {}

  public static getInstance(): TransportRegistry {
    if (!TransportRegistry.instance) {
      TransportRegistry.instance = new TransportRegistry();
    }
    return TransportRegistry.instance;
  }

  public registerTransport(transport: ITransport): void {
    if (!transport.tenantId || !transport.transportId) {
      throw new Error('Transport must have both tenantId and transportId');
    }
    const key = `${transport.tenantId}:${transport.transportId}`;
    this.transports.set(key, transport);
  }

  public getTransport(tenantId: string, transportId: string): ITransport | undefined {
    const key = `${tenantId}:${transportId}`;
    return this.transports.get(key);
  }

  public listTransports(tenantId: string): ITransport[] {
    const result: ITransport[] = [];
    for (const [key, transport] of this.transports.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push(transport);
      }
    }
    return result;
  }

  public listTransportsByConnector(tenantId: string, connectorId: string): ITransport[] {
    return this.listTransports(tenantId).filter((t) => t.connectorId === connectorId);
  }

  public unregisterTransport(tenantId: string, transportId: string): boolean {
    const key = `${tenantId}:${transportId}`;
    return this.transports.delete(key);
  }

  public clear(): void {
    this.transports.clear();
  }

  public getTransportRecords(tenantId: string): TransportRecord[] {
    return this.listTransports(tenantId).map((t) => t.getRecord());
  }
}

export const transportRegistry = TransportRegistry.getInstance();
