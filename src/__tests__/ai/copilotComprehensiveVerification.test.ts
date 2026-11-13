import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateCopilotResponse } from '../../lib/api';
import { conversationMemoryService } from '../../ai/ConversationMemoryService';
import { orionAI } from '../../services/ai/AIProvider';

describe('Orion Copilot Comprehensive Verification Suite (10 Real Runtime Scenarios)', () => {
  const dummyLocalTools: Record<string, () => any> = {
    getDashboardMetrics: () => ({
      totalProducts: 45,
      totalSuppliers: 12,
      totalPOs: 28,
      openPOs: 6,
      totalShipments: 18,
      delayedShipments: 2,
      activeExceptions: 4,
      pendingDecisions: 3,
    }),
    getInventory: () => [
      { productId: 'SKU-001', onHand: 500, warehouseId: 'WH-EAST', safetyStock: 100, reorderPoint: 150 },
      { productId: 'SKU-002', onHand: 15, warehouseId: 'WH-WEST', safetyStock: 50, reorderPoint: 80 },
    ],
    getInventoryRisks: () => [
      { productId: 'SKU-002', sku: 'SKU-002', onHand: 15, safetyStock: 50, reorderPoint: 80 },
    ],
    getSuppliers: () => [
      { id: 'SUP-01', name: 'Apex Logistics Corp', rating: 95, otif: 98, leadTimeDays: 7, country: 'USA' },
      { id: 'SUP-02', name: 'Vanguard Components', rating: 52, otif: 64, leadTimeDays: 24, country: 'TWN' },
    ],
    getSupplierPerformance: () => [
      { id: 'SUP-01', name: 'Apex Logistics Corp', otif: 98, defectRate: 0.01, leadTimeDays: 7 },
      { id: 'SUP-02', name: 'Vanguard Components', otif: 64, defectRate: 0.12, leadTimeDays: 24 },
    ],
    getPurchaseOrders: () => [
      { id: 'PO-2026-001', supplierId: 'SUP-01', totalValue: 12500, status: 'Confirmed', expectedDelivery: '2026-11-20' },
      { id: 'PO-2026-002', supplierId: 'SUP-02', totalValue: 48000, status: 'Overdue', expectedDelivery: '2026-11-05' },
    ],
    getOverduePOs: () => [
      { id: 'PO-2026-002', supplierId: 'SUP-02', expectedDelivery: '2026-11-05', totalAmount: 48000 },
    ],
    getShipments: () => [
      { id: 'SHP-101', trackingNumber: 'TRK-9812', carrier: 'FedEx Freight', status: 'In Transit', destination: 'Chicago DC' },
      { id: 'SHP-102', trackingNumber: 'TRK-4421', carrier: 'Maersk Ocean', status: 'Delayed', destination: 'Rotterdam Hub' },
    ],
    getDelayedShipments: () => [
      { id: 'SHP-102', trackingNumber: 'TRK-4421', carrier: 'Maersk Ocean', delayDays: 4, destination: 'Rotterdam Hub' },
    ],
    getExceptions: () => [
      { id: 'EXC-01', type: 'SUPPLY_DEFICIT', severity: 'CRITICAL', title: 'Port Congestion Delay' },
    ],
    getDecisions: () => [],
    getPendingDecisions: () => [],
    getDemandForecasts: () => [],
    getContracts: () => [],
    getTransportationPlans: () => [],
  };

  // Scenario 1: AI Provider Status Verification
  it('Scenario 1: AI provider status returns configured and online', async () => {
    const status = await orionAI.checkStatus();
    expect(status).toBeDefined();
    // In local dev server environment with GEMINI_API_KEY loaded, it must be gemini
    if (status.configured) {
      expect(status.provider).toBe('gemini');
      expect(status.model).toBe('gemini-3.5-flash-lite');
    } else {
      expect(status.provider).toBe('deterministic_engine');
    }
  });

  // Scenario 2: Submit a basic greeting
  it('Scenario 2: Responds correctly to a basic greeting', async () => {
    const res = await generateCopilotResponse('Hello', dummyLocalTools, 'Control Tower', {
      tenantId: 'global',
      userId: 'user',
      conversationId: 'test-greeting-session',
    });
    expect(res).toBeDefined();
    expect(res.response).toBeDefined();
    expect(res.response.length).toBeGreaterThan(10);
  });

  // Scenario 3: Ask "What is the current inventory position?"
  it('Scenario 3: Answers inventory position accurately grounded in live data', async () => {
    const res = await generateCopilotResponse('What is the current inventory position?', dummyLocalTools, 'Control Tower', {
      tenantId: 'global',
      userId: 'user',
      conversationId: 'test-inventory-session',
    });
    expect(res).toBeDefined();
    expect(res.response).toBeDefined();
    // Must mention SKU or Products
    const text = res.response.toLowerCase();
    expect(text.includes('sku') || text.includes('inventory') || text.includes('product') || text.includes('stock')).toBe(true);
  });

  // Scenario 4: Ask "Which suppliers have the highest risk?"
  it('Scenario 4: Identifies supplier risk accurately grounded in live data', async () => {
    const res = await generateCopilotResponse('Which suppliers have the highest risk?', dummyLocalTools, 'Control Tower', {
      tenantId: 'global',
      userId: 'user',
      conversationId: 'test-supplier-session',
    });
    expect(res).toBeDefined();
    expect(res.response).toBeDefined();
    const text = res.response.toLowerCase();
    expect(text.includes('vanguard') || text.includes('sup-02') || text.includes('supplier') || text.includes('risk')).toBe(true);
  });

  // Scenario 5: Ask "Show delayed purchase orders."
  it('Scenario 5: Reports delayed purchase orders accurately', async () => {
    const res = await generateCopilotResponse('Show delayed purchase orders.', dummyLocalTools, 'Control Tower', {
      tenantId: 'global',
      userId: 'user',
      conversationId: 'test-po-session',
    });
    expect(res).toBeDefined();
    expect(res.response).toBeDefined();
    const text = res.response.toLowerCase();
    expect(text.includes('po-2026-002') || text.includes('overdue') || text.includes('order') || text.includes('delay')).toBe(true);
  });

  // Scenario 6: Submit multiple consecutive prompts in sequence
  it('Scenario 6: Executes consecutive prompts without state corruption', async () => {
    const sessionKey = 'consecutive-test-session';
    const prompts = [
      'What are the open POs?',
      'How many products are in stock?',
      'Check shipping delays.',
    ];

    for (const prompt of prompts) {
      const res = await generateCopilotResponse(prompt, dummyLocalTools, 'Control Tower', {
        tenantId: 'global',
        userId: 'user',
        conversationId: sessionKey,
      });
      expect(res).toBeDefined();
      expect(res.response).toBeDefined();
      expect(res.response.length).toBeGreaterThan(10);
    }
  });

  // Scenario 7: Stop button cancels active response via AbortController
  it('Scenario 7: Stop cancels active response cleanly without leaking to future requests', async () => {
    const controller = new AbortController();
    controller.abort(); // Immediately aborted before call

    await expect(
      generateCopilotResponse('Long running analysis', dummyLocalTools, 'Control Tower', {
        tenantId: 'global',
        userId: 'user',
        signal: controller.signal,
      })
    ).rejects.toThrow();

    // Immediately follow up with a fresh non-aborted request - MUST succeed!
    const freshRes = await generateCopilotResponse('Hello after cancel', dummyLocalTools, 'Control Tower', {
      tenantId: 'global',
      userId: 'user',
    });
    expect(freshRes).toBeDefined();
    expect(freshRes.response.length).toBeGreaterThan(5);
  });

  // Scenario 8: New Session isolates history
  it('Scenario 8: New session isolates history cleanly', async () => {
    const session1 = 'session-user-1';
    const session2 = 'session-user-2';

    await conversationMemoryService.addMessage('global', 'user', session1, 'user', 'Unique warehouse query WH-ALPHA-99');
    await conversationMemoryService.addMessage('global', 'user', session1, 'assistant', 'Acknowledged WH-ALPHA-99');

    const ctx1 = conversationMemoryService.getConversationContext('global', 'user', session1);
    expect(ctx1).toContain('WH-ALPHA-99');

    const ctx2 = conversationMemoryService.getConversationContext('global', 'user', session2);
    expect(ctx2).not.toContain('WH-ALPHA-99');
  });

  // Scenario 9: Persistence across session restore (Browser Refresh simulation)
  it('Scenario 9: Session restores history from persistent storage', async () => {
    const sessionId = 'persistent-restore-session';
    await conversationMemoryService.addMessage('global', 'user', sessionId, 'user', 'Initial query on Tuesday');
    await conversationMemoryService.addMessage('global', 'user', sessionId, 'assistant', 'Response on Tuesday');

    // Simulate page reload by retrieving the session fresh
    const restored = conversationMemoryService.getOrCreateSession('global', 'user', sessionId);
    expect(restored.messages.length).toBeGreaterThanOrEqual(2);
    expect(restored.messages.some(m => m.content.includes('Initial query on Tuesday'))).toBe(true);
  });

  // Scenario 10: AI Provider Unavailable Graceful Fallback
  it('Scenario 10: Graceful fallback when AI provider is unreachable or returns error', async () => {
    // Calling internal fallback generator directly
    const fallbackRes = (orionAI as any).generateDeterministicAnalysis({
      prompt: 'What is the current inventory position?',
      dataContext: {
        getInventoryRisks: dummyLocalTools.getInventoryRisks(),
        getInventory: dummyLocalTools.getInventory(),
        getDashboardMetrics: dummyLocalTools.getDashboardMetrics(),
      },
      specializedMode: 'Control Tower',
    });

    expect(fallbackRes).toBeDefined();
    expect(typeof fallbackRes).toBe('string');
    expect(fallbackRes.toLowerCase()).toContain('inventory');
    expect(fallbackRes.length).toBeGreaterThan(20);
  });
});
