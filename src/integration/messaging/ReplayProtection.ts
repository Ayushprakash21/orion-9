/**
 * ORION-9 WAVE 3.3 — REPLAY PROTECTION ENGINE
 */

export class ReplayProtection {
  private static instance: ReplayProtection;
  private processedKeys: Map<string, { timestamp: string; messageId: string }> = new Map(); // key: `${tenantId}:${compositeKey}`

  private constructor() {}

  public static getInstance(): ReplayProtection {
    if (!ReplayProtection.instance) {
      ReplayProtection.instance = new ReplayProtection();
    }
    return ReplayProtection.instance;
  }

  public isDuplicate(params: {
    tenantId: string;
    partnerId?: string;
    externalId?: string;
    controlNumber?: string;
    idempotencyKey?: string;
  }): { duplicate: boolean; originalMessageId?: string } {
    const keysToCheck = this.buildCompositeKeys(params);

    for (const key of keysToCheck) {
      const existing = this.processedKeys.get(`${params.tenantId}:${key}`);
      if (existing) {
        return { duplicate: true, originalMessageId: existing.messageId };
      }
    }

    return { duplicate: false };
  }

  public recordMessage(params: {
    tenantId: string;
    messageId: string;
    partnerId?: string;
    externalId?: string;
    controlNumber?: string;
    idempotencyKey?: string;
  }): void {
    const keysToStore = this.buildCompositeKeys(params);
    const now = new Date().toISOString();

    for (const key of keysToStore) {
      this.processedKeys.set(`${params.tenantId}:${key}`, {
        timestamp: now,
        messageId: params.messageId,
      });
    }
  }

  private buildCompositeKeys(params: {
    partnerId?: string;
    externalId?: string;
    controlNumber?: string;
    idempotencyKey?: string;
  }): string[] {
    const keys: string[] = [];

    if (params.idempotencyKey) {
      keys.push(`idempotency:${params.idempotencyKey}`);
    }

    if (params.partnerId && params.controlNumber) {
      keys.push(`partnerControl:${params.partnerId}:${params.controlNumber}`);
    }

    if (params.partnerId && params.externalId) {
      keys.push(`partnerExternal:${params.partnerId}:${params.externalId}`);
    }

    if (params.externalId && !params.partnerId) {
      keys.push(`external:${params.externalId}`);
    }

    return keys;
  }

  public clear(): void {
    this.processedKeys.clear();
  }
}

export const replayProtection = ReplayProtection.getInstance();
