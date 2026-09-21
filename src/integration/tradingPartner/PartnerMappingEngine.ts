/**
 * ORION-9 WAVE 3.3 — PARTNER-SPECIFIC VERSIONED MAPPING ENGINE
 */

import { FieldMappingContract, IntegrationContract } from '../types';

export class PartnerMappingEngine {
  private static instance: PartnerMappingEngine;
  private partnerOverrides: Map<string, FieldMappingContract[]> = new Map(); // key: `${tenantId}:${partnerId}:${entityType}`

  private constructor() {}

  public static getInstance(): PartnerMappingEngine {
    if (!PartnerMappingEngine.instance) {
      PartnerMappingEngine.instance = new PartnerMappingEngine();
    }
    return PartnerMappingEngine.instance;
  }

  public registerPartnerMapping(
    tenantId: string,
    partnerId: string,
    entityType: string,
    mappings: FieldMappingContract[]
  ): void {
    const key = `${tenantId}:${partnerId}:${entityType}`;
    this.partnerOverrides.set(key, mappings);
  }

  public getPartnerMapping(
    tenantId: string,
    partnerId: string,
    entityType: string
  ): FieldMappingContract[] | undefined {
    return this.partnerOverrides.get(`${tenantId}:${partnerId}:${entityType}`);
  }

  public applyPartnerMapping(
    tenantId: string,
    partnerId: string,
    entityType: string,
    baseContract: IntegrationContract,
    rawPayload: Record<string, any>
  ): Record<string, any> {
    const customMappings = this.getPartnerMapping(tenantId, partnerId, entityType) || baseContract.mappings;

    const mappedResult: Record<string, any> = { tenantId };

    for (const rule of customMappings) {
      let rawVal = rawPayload[rule.sourceField];
      if (rawVal === undefined || rawVal === null) {
        rawVal = rule.defaultValue;
      }

      if (rawVal !== undefined && rawVal !== null) {
        switch (rule.rule) {
          case 'TRIM':
            mappedResult[rule.orionField] = String(rawVal).trim();
            break;
          case 'UPPERCASE':
            mappedResult[rule.orionField] = String(rawVal).toUpperCase();
            break;
          case 'LOWERCASE':
            mappedResult[rule.orionField] = String(rawVal).toLowerCase();
            break;
          case 'NUMERIC_PARSE':
            mappedResult[rule.orionField] = Number(rawVal);
            break;
          case 'LOOKUP_MAP':
            if (rule.lookupTable && rule.lookupTable[String(rawVal)]) {
              mappedResult[rule.orionField] = rule.lookupTable[String(rawVal)];
            } else {
              mappedResult[rule.orionField] = rawVal;
            }
            break;
          default:
            mappedResult[rule.orionField] = rawVal;
            break;
        }
      }
    }

    return mappedResult;
  }

  public clear(): void {
    this.partnerOverrides.clear();
  }
}

export const partnerMappingEngine = PartnerMappingEngine.getInstance();
