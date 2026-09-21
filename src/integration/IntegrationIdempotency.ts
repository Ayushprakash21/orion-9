/**
 * ORION-9 INTEGRATION IDEMPOTENCY SERVICE
 * Layer 8 Integration Fabric Foundation
 *
 * Tracks external system message keys (externalSystemId, externalMessageId, idempotencyKey)
 * to prevent duplicate transaction creation across external integrations.
 */

export interface ExternalIdempotencyEntry {
  compositeKey: string;
  tenantId: string;
  externalSystemId: string;
  externalMessageId: string;
  idempotencyKey: string;
  processedAt: string;
  transactionResultId?: string;
}

export class IntegrationIdempotency {
  private static instance: IntegrationIdempotency;
  private entries: Map<string, ExternalIdempotencyEntry> = new Map();

  private constructor() {}

  public static getInstance(): IntegrationIdempotency {
    if (!IntegrationIdempotency.instance) {
      IntegrationIdempotency.instance = new IntegrationIdempotency();
    }
    return IntegrationIdempotency.instance;
  }

  private buildCompositeKey(tenantId: string, externalSystemId: string, idempotencyKey: string): string {
    return `${tenantId}::${externalSystemId}::${idempotencyKey}`;
  }

  /**
   * Checks if an external message has already been processed for this tenant
   */
  public isProcessed(tenantId: string, externalSystemId: string, idempotencyKey: string): boolean {
    const key = this.buildCompositeKey(tenantId, externalSystemId, idempotencyKey);
    return this.entries.has(key);
  }

  /**
   * Registers an external message key as processed
   */
  public registerProcessed(params: {
    tenantId: string;
    externalSystemId: string;
    externalMessageId: string;
    idempotencyKey: string;
    transactionResultId?: string;
  }): ExternalIdempotencyEntry {
    const key = this.buildCompositeKey(params.tenantId, params.externalSystemId, params.idempotencyKey);
    if (this.entries.has(key)) {
      throw new Error(
        `Duplicate external message detected for tenant '${params.tenantId}', system '${params.externalSystemId}', idempotencyKey '${params.idempotencyKey}'.`
      );
    }

    const entry: ExternalIdempotencyEntry = {
      compositeKey: key,
      tenantId: params.tenantId,
      externalSystemId: params.externalSystemId,
      externalMessageId: params.externalMessageId,
      idempotencyKey: params.idempotencyKey,
      processedAt: new Date().toISOString(),
      transactionResultId: params.transactionResultId,
    };

    this.entries.set(key, entry);
    return entry;
  }

  /**
   * Gets details of a previously processed idempotency entry
   */
  public getEntry(tenantId: string, externalSystemId: string, idempotencyKey: string): ExternalIdempotencyEntry | undefined {
    const key = this.buildCompositeKey(tenantId, externalSystemId, idempotencyKey);
    return this.entries.get(key);
  }

  /**
   * Clears internal state (for testing)
   */
  public clear(): void {
    this.entries.clear();
  }
}

export const integrationIdempotency = IntegrationIdempotency.getInstance();
