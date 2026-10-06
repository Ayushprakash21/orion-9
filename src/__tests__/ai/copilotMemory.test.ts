/**
 * ORION-9 COPILOT MEMORY & TENANT ISOLATION — TEST SUITE
 *
 * Verifies:
 * 1. Conversation Memory: Multi-turn session history, summary context, user preference retrieval.
 * 2. AgentMemory: Bounded retrieval, tenant isolation (Tenant A memory NEVER leaks to Tenant B).
 * 3. Grounding Integrity: Live operational data changes produce updated reasoning even for identical questions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { conversationMemoryService } from '../../ai/ConversationMemoryService';
import { agentMemoryManager } from '../../ai/AgentMemory';
import { generateCopilotResponse } from '../../lib/api';

describe('ORION-9 Copilot Memory & Tenant Isolation', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('MEMORY-01: Maintains multi-turn conversation session history and user preferences', async () => {
    await conversationMemoryService.addMessage(
      'tenant-alpha',
      'user-1',
      'conv-memory-01',
      'user',
      'Priority supplier is Apex Logistics'
    );

    const context = conversationMemoryService.getConversationContext('tenant-alpha', 'user-1', 'conv-memory-01');
    expect(context).toContain('Priority supplier is Apex Logistics');

    const session = conversationMemoryService.getOrCreateSession('tenant-alpha', 'user-1', 'conv-memory-01');
    expect(session.userPreferences['priority_supplier']).toBe('Apex Logistics');
  });

  it('MEMORY-02: Enforces strict tenant isolation in AgentMemory (Tenant B cannot read Tenant A memories)', async () => {
    await agentMemoryManager.storeMemory({
      tenantId: 'tenant-a-isolated',
      agentId: 'control-tower-copilot',
      type: 'TASK',
      source: 'test',
      contentReference: { note: 'Isolated SKU-CONFIDENTIAL-999 analysis' },
      retentionPolicy: '30_DAYS'
    });

    const tenantAMemories = agentMemoryManager.getMemories('tenant-a-isolated', 'control-tower-copilot');
    expect(tenantAMemories.length).toBeGreaterThan(0);
    expect(tenantAMemories[0].tenantId).toBe('tenant-a-isolated');

    const tenantBMemories = agentMemoryManager.getMemories('tenant-b-other', 'control-tower-copilot');
    expect(tenantBMemories.some(m => m.tenantId === 'tenant-a-isolated')).toBe(false);
  });

  it('MEMORY-03: Grounding Integrity — Same question + changed live data yields changed reasoning', async () => {
    const question = 'What are current inventory stockout risks?';

    // State 1: Healthy inventory
    const state1Tools = {
      getDashboardMetrics: () => ({ activeExceptions: 0 }),
      getInventoryRisks: () => [],
      getExceptions: () => [],
      getOverduePOs: () => [],
      getDelayedShipments: () => [],
      getSupplierPerformance: () => [],
      getPendingDecisions: () => []
    };

    const res1 = await generateCopilotResponse(question, state1Tools, 'Control Tower', { tenantId: 'global', userId: 'user' });

    // State 2: Critical stockout risk on SKU-CRITICAL-777
    const state2Tools = {
      getDashboardMetrics: () => ({ activeExceptions: 1 }),
      getInventoryRisks: () => [{ productId: 'SKU-CRITICAL-777', sku: 'SKU-CRITICAL-777', onHand: 2, safetyStock: 50 }],
      getExceptions: () => [{ id: 'EX-CRIT-1', severity: 'Critical', estimatedImpact: 50000 }],
      getOverduePOs: () => [],
      getDelayedShipments: () => [],
      getSupplierPerformance: () => [],
      getPendingDecisions: () => []
    };

    const res2 = await generateCopilotResponse(question, state2Tools, 'Control Tower', { tenantId: 'global', userId: 'user' });

    expect(res1).not.toEqual(res2);
    expect(res2).toContain('SKU-CRITICAL-777');
  });
});
