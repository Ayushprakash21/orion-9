/**
 * ORION-9 WAVE 3.3 — TRADING PARTNER REGISTRY
 * Tenant-isolated registry for managing EDI trading partners & transaction capabilities.
 */

import { TradingPartnerRecord, TradingPartnerStatus, TransactionCapability } from '../types';

export class TradingPartnerRegistry {
  private static instance: TradingPartnerRegistry;
  private partners: Map<string, TradingPartnerRecord> = new Map(); // key: `${tenantId}:${partnerId}`

  private constructor() {}

  public static getInstance(): TradingPartnerRegistry {
    if (!TradingPartnerRegistry.instance) {
      TradingPartnerRegistry.instance = new TradingPartnerRegistry();
    }
    return TradingPartnerRegistry.instance;
  }

  public registerPartner(partner: Omit<TradingPartnerRecord, 'createdAt' | 'updatedAt'> & Partial<Pick<TradingPartnerRecord, 'createdAt' | 'updatedAt'>>): TradingPartnerRecord {
    if (!partner.tenantId || !partner.partnerId) {
      throw new Error('Trading partner must specify tenantId and partnerId');
    }
    const key = `${partner.tenantId}:${partner.partnerId}`;
    const record: TradingPartnerRecord = {
      ...partner,
      status: partner.status || 'DRAFT',
      supportedCapabilities: partner.supportedCapabilities || [],
      createdAt: partner.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.partners.set(key, record);
    return record;
  }


  public getPartner(tenantId: string, partnerId: string): TradingPartnerRecord | undefined {
    return this.partners.get(`${tenantId}:${partnerId}`);
  }

  public getPartnerByEDI(tenantId: string, qualifier: string, identifier: string): TradingPartnerRecord | undefined {
    for (const partner of this.listPartners(tenantId)) {
      if (partner.ediQualifier === qualifier && partner.ediIdentifier === identifier) {
        return partner;
      }
    }
    return undefined;
  }

  public listPartners(tenantId: string): TradingPartnerRecord[] {
    const result: TradingPartnerRecord[] = [];
    for (const [key, partner] of this.partners.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...partner });
      }
    }
    return result;
  }

  public updatePartnerStatus(tenantId: string, partnerId: string, status: TradingPartnerStatus): boolean {
    const partner = this.getPartner(tenantId, partnerId);
    if (!partner) return false;
    partner.status = status;
    partner.updatedAt = new Date().toISOString();
    this.partners.set(`${tenantId}:${partnerId}`, partner);
    return true;
  }

  public addCapability(tenantId: string, partnerId: string, capability: TransactionCapability): boolean {
    const partner = this.getPartner(tenantId, partnerId);
    if (!partner) return false;

    // Check if capability already exists
    const idx = partner.supportedCapabilities.findIndex(
      (c) => c.transactionType === capability.transactionType && c.direction === capability.direction
    );

    if (idx >= 0) {
      partner.supportedCapabilities[idx] = capability;
    } else {
      partner.supportedCapabilities.push(capability);
    }

    partner.updatedAt = new Date().toISOString();
    this.partners.set(`${tenantId}:${partnerId}`, partner);
    return true;
  }

  public removePartner(tenantId: string, partnerId: string): boolean {
    return this.partners.delete(`${tenantId}:${partnerId}`);
  }

  public clear(): void {
    this.partners.clear();
  }
}

export const tradingPartnerRegistry = TradingPartnerRegistry.getInstance();
