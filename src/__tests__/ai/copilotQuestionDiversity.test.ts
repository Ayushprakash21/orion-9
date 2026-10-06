/**
 * ORION-9 COPILOT QUESTION DIVERSITY & INTENT GROUNDING — TEST SUITE
 *
 * Verifies that the Copilot provides question-specific, fact-grounded responses
 * rather than outputting generic repeated Control Tower reports across all 14 prompt types.
 */

import { describe, it, expect } from 'vitest';
import { generateCopilotResponse } from '../../lib/api';
import { agentMemoryManager } from '../../ai/AgentMemory';

describe('ORION-9 Copilot Question Diversity & Grounding (14 Prompts)', () => {
  const mockTools = {
    getDashboardMetrics: () => ({ totalProducts: 10, openPOs: 2, totalShipments: 5, activeExceptions: 1 }),
    getInventory: () => [
      { productId: 'SKU-1000', onHand: 4, safetyStock: 20 },
      { productId: 'SKU-2000', onHand: 150, safetyStock: 50 }
    ],
    getInventoryRisks: () => [
      { productId: 'SKU-1000', sku: 'SKU-1000', onHand: 4, safetyStock: 20 }
    ],
    getSuppliers: () => [
      { id: 'SUP-A', name: 'Apex Logistics', otif: 72, defectRate: 3.5 },
      { id: 'SUP-B', name: 'Global Components', otif: 98, defectRate: 0.1 }
    ],
    getSupplierPerformance: () => [
      { id: 'SUP-A', name: 'Apex Logistics', otif: 72, defectRate: 3.5 },
      { id: 'SUP-B', name: 'Global Components', otif: 98, defectRate: 0.1 }
    ],
    getPurchaseOrders: () => [
      { id: 'PO-12345', supplierId: 'SUP-A', totalValue: 50000, status: 'Overdue', expectedDelivery: '2026-03-01' },
      { id: 'PO-67890', supplierId: 'SUP-B', totalValue: 12000, status: 'Confirmed', expectedDelivery: '2026-10-15' }
    ],
    getOverduePOs: () => [
      { id: 'PO-12345', supplierId: 'SUP-A', totalValue: 50000, status: 'Overdue', expectedDelivery: '2026-03-01' }
    ],
    getShipments: () => [
      { id: 'SHP-999', trackingNumber: 'TRK-999', carrier: 'FastFreight', status: 'Delayed', delayDays: 4, destination: 'Hub 1' }
    ],
    getDelayedShipments: () => [
      { id: 'SHP-999', trackingNumber: 'TRK-999', carrier: 'FastFreight', status: 'Delayed', delayDays: 4, destination: 'Hub 1' }
    ],
    getExceptions: () => [
      { id: 'EX-1', severity: 'Critical', estimatedImpact: 15000 }
    ],
    getDecisions: () => [
      { id: 'DEC-1', title: 'Reroute Shipment SHP-999', status: 'READY_FOR_REVIEW' }
    ],
    getPendingDecisions: () => [
      { id: 'DEC-1', title: 'Reroute Shipment SHP-999', status: 'READY_FOR_REVIEW' }
    ],
    getDemandForecasts: () => [
      { productId: 'SKU-1000', forecastedDemand: 120, horizonDays: 30 }
    ],
    getContracts: () => [],
    getTransportationPlans: () => []
  };

  const context = { tenantId: 't-div-14', userId: 'u-1' };

  it('PROMPT-01: "Hi" -> Warm greeting, no Control Tower report', async () => {
    const res = await generateCopilotResponse('Hi', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('Orion Copilot');
    expect(text).not.toContain('#### 1. EXECUTIVE SUMMARY');
  });

  it('PROMPT-02: "What is the current inventory position?" -> Inventory summary', async () => {
    const res = await generateCopilotResponse('What is the current inventory position?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('INVENTORY POSITION');
    expect(text).not.toContain('#### 1. EXECUTIVE SUMMARY');
  });

  it('PROMPT-03: "Which SKUs are below safety stock?" -> Safety stock breakdown', async () => {
    const res = await generateCopilotResponse('Which SKUs are below safety stock?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('SKU-1000');
    expect(text).toContain('safety stock');
  });

  it('PROMPT-04: "Show stockout risks" -> Stockout risk analysis', async () => {
    const res = await generateCopilotResponse('Show stockout risks', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('STOCKOUT');
    expect(text).toContain('SKU-1000');
  });

  it('PROMPT-05: "Show delayed shipments" -> Delayed shipment breakdown', async () => {
    const res = await generateCopilotResponse('Show delayed shipments', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('LOGISTICS & SHIPMENT DELAYS');
    expect(text).toContain('FastFreight');
  });

  it('PROMPT-06: "Which purchase orders are overdue?" -> Overdue PO details', async () => {
    const res = await generateCopilotResponse('Which purchase orders are overdue?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('OVERDUE PURCHASE ORDERS');
    expect(text).toContain('PO-12345');
  });

  it('PROMPT-07: "How are suppliers performing?" -> Supplier performance analysis', async () => {
    const res = await generateCopilotResponse('How are suppliers performing?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('SUPPLIER PERFORMANCE ANALYSIS');
    expect(text).toContain('Apex Logistics');
  });

  it('PROMPT-08: "What decisions are pending?" -> Pending decisions list', async () => {
    const res = await generateCopilotResponse('What decisions are pending?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('DECISION');
  });

  it('PROMPT-09: "Show active exceptions" -> Active exceptions summary', async () => {
    const res = await generateCopilotResponse('Show active exceptions', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('EXCEPTION');
  });

  it('PROMPT-10: "What is the demand forecast?" -> Demand forecast summary', async () => {
    const res = await generateCopilotResponse('What is the demand forecast?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('FORECAST');
  });

  it('PROMPT-11: "Give me an executive summary" -> Full 4-section Control Tower report', async () => {
    const res = await generateCopilotResponse('Give me an executive summary', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('#### 1. EXECUTIVE SUMMARY');
    expect(text).toContain('#### 2. OPERATIONAL SIGNALS & ROOT CAUSES');
    expect(text).toContain('#### 3. DOWNSTREAM RISK & BUSINESS IMPACT');
    expect(text).toContain('#### 4. RECOMMENDED DECISIONS & ACTIONS');
  });

  it('PROMPT-12: "Why is SKU-1000 at risk?" -> Entity-specific SKU risk explanation', async () => {
    const res = await generateCopilotResponse('Why is SKU-1000 at risk?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toContain('SKU-1000');
  });

  it('PROMPT-13: "What should I investigate next?" -> Investigative recommendations', async () => {
    const res = await generateCopilotResponse('What should I investigate next?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(50);
  });

  it('PROMPT-14: "Why?" (as a follow-up) -> Conversational context preservation', async () => {
    // First query SKU-1000
    await generateCopilotResponse('Tell me about SKU-1000', mockTools, 'Control Tower', context);
    // Follow-up query "Why?"
    const res = await generateCopilotResponse('Why?', mockTools, 'Control Tower', context);
    const text = res.response || String(res);
    expect(text).toBeDefined();
    expect(text).not.toContain('#### 1. EXECUTIVE SUMMARY');
  });

  it('Zero-data state correctly reports 0 risks without false delay statements', async () => {
    const healthyTools = {
      getDashboardMetrics: () => ({ totalProducts: 5, openPOs: 0 }),
      getInventory: () => [{ productId: 'SKU-OK', onHand: 100, safetyStock: 10 }],
      getInventoryRisks: () => [],
      getSuppliers: () => [],
      getSupplierPerformance: () => [],
      getPurchaseOrders: () => [],
      getOverduePOs: () => [],
      getShipments: () => [],
      getDelayedShipments: () => [],
      getExceptions: () => [],
      getDecisions: () => [],
      getPendingDecisions: () => [],
      getDemandForecasts: () => [],
      getContracts: () => [],
      getTransportationPlans: () => []
    };

    const res = await generateCopilotResponse('What are my inventory stockout risks?', healthyTools, 'Control Tower', { tenantId: 't-div-zero', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('Zero active stockout risks detected');
    expect(text).not.toContain('Inbound transit delays');
  });

  it('Formats memory references cleanly without [object Object]', async () => {
    await agentMemoryManager.storeMemory({
      tenantId: 't-div-mem',
      agentId: 'control-tower-copilot',
      type: 'TASK',
      source: 'test',
      contentReference: { note: 'Priority PO-9000 expediting needed' },
      retentionPolicy: '30_DAYS'
    });

    const res = await generateCopilotResponse('Give me an executive summary', mockTools, 'Control Tower', { tenantId: 't-div-mem', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).not.toContain('[object Object]');
  });
});
