/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Decision Memory Service
 * 
 * Tenant-isolated memory store for past operational decisions and their verified outcomes.
 * Enables semantic and categorical retrieval of institutional precedent.
 */

import { OutcomeRecord, DecisionEffectivenessClass } from './types';

export interface DecisionMemoryItem {
  memoryId: string;
  tenantId: string;
  decisionId: string;
  category: string; // e.g., 'PORT_CONGESTION', 'SUPPLIER_INSOLVENCY', 'INVENTORY_REBALANCE'
  contextSummary: string;
  actionTaken: string;
  outcomeRecordId: string;
  effectivenessClass: DecisionEffectivenessClass;
  qualityScore: number;
  tags: string[];
  recordedAt: string;
}

export class DecisionMemoryService {
  private static instance: DecisionMemoryService;
  private memories: Map<string, DecisionMemoryItem> = new Map(); // key: `${tenantId}:${memoryId}`

  private constructor() {}

  public static getInstance(): DecisionMemoryService {
    if (!DecisionMemoryService.instance) {
      DecisionMemoryService.instance = new DecisionMemoryService();
    }
    return DecisionMemoryService.instance;
  }

  public storeMemory(params: {
    tenantId: string;
    decisionId: string;
    category: string;
    contextSummary: string;
    actionTaken: string;
    outcomeRecordId: string;
    effectivenessClass: DecisionEffectivenessClass;
    qualityScore: number;
    tags?: string[];
  }): DecisionMemoryItem {
    const memoryId = `MEM-${params.tenantId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const memory: DecisionMemoryItem = {
      memoryId,
      tenantId: params.tenantId,
      decisionId: params.decisionId,
      category: params.category,
      contextSummary: params.contextSummary,
      actionTaken: params.actionTaken,
      outcomeRecordId: params.outcomeRecordId,
      effectivenessClass: params.effectivenessClass,
      qualityScore: params.qualityScore,
      tags: params.tags || [],
      recordedAt: new Date().toISOString(),
    };

    this.memories.set(`${params.tenantId}:${memoryId}`, memory);
    return memory;
  }

  /**
   * Search precedent decisions by query term or category
   */
  public queryMemories(params: {
    tenantId: string;
    query?: string;
    category?: string;
    minQualityScore?: number;
    limit?: number;
  }): DecisionMemoryItem[] {
    const list: DecisionMemoryItem[] = [];
    const q = params.query?.toLowerCase();

    for (const [key, item] of this.memories.entries()) {
      if (!key.startsWith(`${params.tenantId}:`)) continue;

      if (params.category && item.category !== params.category) continue;
      if (params.minQualityScore !== undefined && item.qualityScore < params.minQualityScore) continue;

      if (q) {
        const matches = 
          item.contextSummary.toLowerCase().includes(q) ||
          item.actionTaken.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q));
        if (!matches) continue;
      }

      list.push(item);
    }

    return list
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, params.limit || 20);
  }

  public clear(): void {
    this.memories.clear();
  }
}
