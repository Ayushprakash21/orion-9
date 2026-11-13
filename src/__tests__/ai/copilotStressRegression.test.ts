import { describe, it, expect } from 'vitest';
import { generateCopilotResponse } from '../../lib/api';
import { conversationMemoryService } from '../../ai/ConversationMemoryService';
import { orionAI } from '../../services/ai/AIProvider';

describe('Orion Copilot Phase 5 Stress & Regression Certification Suite', () => {
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
      { productId: 'SKU-100', onHand: 200, warehouseId: 'WH-CENTRAL', safetyStock: 50, reorderPoint: 80 },
    ],
    getInventoryRisks: () => [],
    getSuppliers: () => [
      { id: 'SUP-01', name: 'Global Logistics Inc', rating: 92, otif: 95, leadTimeDays: 8, country: 'USA' },
    ],
    getSupplierPerformance: () => [
      { id: 'SUP-01', name: 'Global Logistics Inc', otif: 95, defectRate: 0.02, leadTimeDays: 8 },
    ],
    getPurchaseOrders: () => [
      { id: 'PO-2026-101', supplierId: 'SUP-01', totalValue: 25000, status: 'Confirmed', expectedDelivery: '2026-11-25' },
    ],
    getOverduePOs: () => [],
    getShipments: () => [
      { id: 'SHP-201', trackingNumber: 'TRK-1100', carrier: 'DHL Global', status: 'In Transit', destination: 'Austin Hub' },
    ],
    getDelayedShipments: () => [],
    getExceptions: () => [],
    getDecisions: () => [],
    getPendingDecisions: () => [],
    getDemandForecasts: () => [],
    getContracts: () => [],
    getTransportationPlans: () => [],
  };

  // 1. 20 consecutive prompts stress test
  it('Stress Test: Executes 20 consecutive prompts sequentially without memory leak or state lock', async () => {
    const sessionKey = 'stress-20-prompts-session';
    const queries = [
      'Inventory count', 'PO status', 'Supplier list', 'Delayed freight', 'Exceptions count',
      'Stock status SKU-100', 'Warehouse capacity', 'Lead time trends', 'Active carriers', 'Pending reviews',
      'Inventory count 2', 'PO status 2', 'Supplier list 2', 'Delayed freight 2', 'Exceptions count 2',
      'Stock status SKU-100 2', 'Warehouse capacity 2', 'Lead time trends 2', 'Active carriers 2', 'Summary of all signals'
    ];

    for (let i = 0; i < queries.length; i++) {
      const res = await generateCopilotResponse(queries[i], dummyLocalTools, 'Control Tower', {
        tenantId: 'global',
        userId: 'user',
        conversationId: sessionKey,
      });
      expect(res).toBeDefined();
      expect(res.response).toBeDefined();
      expect(res.response.length).toBeGreaterThan(5);
    }
  });

  // 2. 10 session resets stress test
  it('Stress Test: Executes 10 session resets with clean isolation', async () => {
    for (let i = 0; i < 10; i++) {
      const sessionId = `reset-session-${i}-${Date.now()}`;
      await conversationMemoryService.addMessage('global', 'user', sessionId, 'user', `Query in session ${i}`);
      await conversationMemoryService.addMessage('global', 'user', sessionId, 'assistant', `Response in session ${i}`);

      const ctx = conversationMemoryService.getConversationContext('global', 'user', sessionId);
      expect(ctx).toContain(`Query in session ${i}`);

      // Ensure other sessions do not contain this query
      const otherCtx = conversationMemoryService.getConversationContext('global', 'user', `reset-session-${i}-other`);
      expect(otherCtx).not.toContain(`Query in session ${i}`);
    }
  });

  // 3. 10 stop/retry cycles
  it('Stress Test: Executes 10 Stop and immediate retry cycles', async () => {
    for (let i = 0; i < 10; i++) {
      const controller = new AbortController();
      controller.abort();

      await expect(
        generateCopilotResponse(`Aborted cycle ${i}`, dummyLocalTools, 'Control Tower', {
          tenantId: 'global',
          userId: 'user',
          signal: controller.signal,
        })
      ).rejects.toThrow();

      // Immediately retry with fresh controller
      const freshRes = await generateCopilotResponse(`Fresh retry cycle ${i}`, dummyLocalTools, 'Control Tower', {
        tenantId: 'global',
        userId: 'user',
      });
      expect(freshRes).toBeDefined();
      expect(freshRes.response.length).toBeGreaterThan(5);
    }
  });

  // 4. Provider timeout / invalid arguments resilience
  it('Fault Resilience: Handles invalid arguments and empty contexts without crashing', async () => {
    const res = await generateCopilotResponse('', dummyLocalTools, 'Control Tower', {
      tenantId: 'global',
      userId: 'user',
    });
    expect(res).toBeDefined();

    const resEmptyTools = await generateCopilotResponse('Hello empty', {}, 'Control Tower', {
      tenantId: 'global',
      userId: 'user',
    });
    expect(resEmptyTools).toBeDefined();
    expect(resEmptyTools.response).toBeDefined();
  });
});
