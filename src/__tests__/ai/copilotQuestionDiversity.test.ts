/**
 * ORION-9 COPILOT QUESTION DIVERSITY & INTENT GROUNDING — TEST SUITE
 *
 * Verifies that the Copilot provides question-specific, fact-grounded responses
 * rather than outputting generic repeated Control Tower reports.
 *
 * Test cases:
 * 1. Simple greeting ("Hello") -> Warm greeting, no 4-section report
 * 2. Capability query ("What can you help me with?") -> Structured list of capabilities
 * 3. Open POs count query ("How many open POs do we have?") -> Direct PO counts
 * 4. Underperforming suppliers ("Which suppliers are underperforming?") -> Direct supplier list
 * 5. Delayed shipments ("Which shipments are delayed?") -> Direct delay information
 * 6. Inventory stockout risks ("What are my inventory stockout risks?") -> Direct risk items
 * 7. Specific SKU inquiry ("Tell me about SKU-1000") -> Targeted SKU breakdown
 * 8. Specific PO inquiry ("Explain PO-12345") -> Targeted PO status
 * 9. Specific SKU risk explanation ("Why is SKU-1000 risky?") -> Specific stockout cause
 * 10. Recommended action query ("What should I do?") -> Recommended actions
 * 11. Zero data state (Empty risks) -> Reports 0 stockout risks, no false delay messages
 * 12. Memory formatting integrity -> NO [object Object] text in outputs
 */

import { describe, it, expect } from 'vitest';
import { generateCopilotResponse } from '../../lib/api';
import { agentMemoryManager } from '../../ai/AgentMemory';

describe('ORION-9 Copilot Question Diversity & Grounding', () => {
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
    getDecisions: () => [],
    getPendingDecisions: () => [],
    getDemandForecasts: () => [],
    getContracts: () => [],
    getTransportationPlans: () => []
  };

  it('DIVERSITY-01: Greeting returns warm greeting instead of 4-section Control Tower report', async () => {
    const res = await generateCopilotResponse('Hello', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('Orion Copilot');
    expect(text).not.toContain('#### 1. EXECUTIVE SUMMARY');
  });

  it('DIVERSITY-02: Capabilities query returns feature overview', async () => {
    const res = await generateCopilotResponse('What can you help me with?', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('COPILOT CAPABILITIES');
    expect(text).toContain('Inventory Optimization');
    expect(text).not.toContain('#### 1. EXECUTIVE SUMMARY');
  });

  it('DIVERSITY-03: Open POs query returns open PO counts and overdue details', async () => {
    const res = await generateCopilotResponse('How many open POs do we have?', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('OPEN PURCHASE ORDERS SUMMARY');
    expect(text).toContain('PO-12345');
  });

  it('DIVERSITY-04: Underperforming suppliers query identifies low OTIF vendors', async () => {
    const res = await generateCopilotResponse('Which suppliers are underperforming?', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('SUPPLIER PERFORMANCE ANALYSIS');
    expect(text).toContain('Apex Logistics');
    expect(text).toContain('72% OTIF');
  });

  it('DIVERSITY-05: Delayed shipments query highlights carrier transit delays', async () => {
    const res = await generateCopilotResponse('Which shipments are delayed?', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('LOGISTICS & SHIPMENT STATUS');
    expect(text).toContain('FastFreight');
    expect(text).toContain('TRK-999');
  });

  it('DIVERSITY-06: Stockout risk query details critical inventory SKUs', async () => {
    const res = await generateCopilotResponse('What are my inventory stockout risks?', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('INVENTORY RISK ANALYSIS');
    expect(text).toContain('SKU-1000');
  });

  it('DIVERSITY-07: SKU specific query provides targeted item breakdown', async () => {
    const res = await generateCopilotResponse('Tell me about SKU-1000', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('SKU ANALYSIS: SKU-1000');
    expect(text).toContain('CRITICAL STOCKOUT RISK');
  });

  it('DIVERSITY-08: PO specific query provides targeted PO status', async () => {
    const res = await generateCopilotResponse('Explain PO-12345', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('PURCHASE ORDER ANALYSIS: PO-12345');
    expect(text).toContain('Overdue');
  });

  it('DIVERSITY-09: Control Tower overview prompt returns structured 4-section report', async () => {
    const res = await generateCopilotResponse('Generate executive Control Tower risk overview', mockTools, 'Control Tower', { tenantId: 't-div', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).toContain('#### 1. EXECUTIVE SUMMARY');
    expect(text).toContain('#### 2. OPERATIONAL SIGNALS & ROOT CAUSES');
    expect(text).toContain('#### 3. DOWNSTREAM RISK & BUSINESS IMPACT');
    expect(text).toContain('#### 4. RECOMMENDED DECISIONS & ACTIONS');
  });

  it('DIVERSITY-10: Zero-data state correctly reports 0 risks without false delay statements', async () => {
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

  it('DIVERSITY-11: Formats memory references cleanly without [object Object]', async () => {
    await agentMemoryManager.storeMemory({
      tenantId: 't-div-mem',
      agentId: 'control-tower-copilot',
      type: 'TASK',
      source: 'test',
      contentReference: { note: 'Priority PO-9000 expediting needed' },
      retentionPolicy: '30_DAYS'
    });

    const res = await generateCopilotResponse('Generate executive report', mockTools, 'Control Tower', { tenantId: 't-div-mem', userId: 'u-1' });
    const text = res.response || String(res);

    expect(text).not.toContain('[object Object]');
  });
});
