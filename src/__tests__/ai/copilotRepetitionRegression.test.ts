/**
 * ORION-9 COPILOT REPETITION REGRESSION TEST SUITE (PHASE 21)
 *
 * Verifies that 6 distinct operational queries return distinct, question-specific headers
 * and answers, without repeating the generic "ORION-9 — COGNITIVE SUMMARY" header.
 */

import { describe, it, expect } from 'vitest';
import { generateCopilotResponse } from '../../lib/api';

describe('ORION-9 Copilot Repetition Regression Suite', () => {
  const mockTools = {
    getDashboardMetrics: () => ({ totalProducts: 10, openPOs: 2, totalShipments: 5, activeExceptions: 1 }),
    getInventory: () => [{ productId: 'SKU-1000', onHand: 4, safetyStock: 20 }],
    getInventoryRisks: () => [{ productId: 'SKU-1000', sku: 'SKU-1000', onHand: 4, safetyStock: 20 }],
    getSuppliers: () => [{ id: 'SUP-A', name: 'Apex Logistics', otif: 72, defectRate: 3.5 }],
    getSupplierPerformance: () => [{ id: 'SUP-A', name: 'Apex Logistics', otif: 72, defectRate: 3.5 }],
    getPurchaseOrders: () => [{ id: 'PO-12345', supplierId: 'SUP-A', totalValue: 50000, status: 'Overdue', expectedDelivery: '2026-03-01' }],
    getOverduePOs: () => [{ id: 'PO-12345', supplierId: 'SUP-A', totalValue: 50000, status: 'Overdue', expectedDelivery: '2026-03-01' }],
    getShipments: () => [{ id: 'SHP-999', trackingNumber: 'TRK-999', carrier: 'FastFreight', status: 'Delayed', delayDays: 4, destination: 'Hub 1' }],
    getDelayedShipments: () => [{ id: 'SHP-999', trackingNumber: 'TRK-999', carrier: 'FastFreight', status: 'Delayed', delayDays: 4, destination: 'Hub 1' }],
    getExceptions: () => [{ id: 'EX-1', severity: 'Critical', estimatedImpact: 15000 }],
    getDecisions: () => [{ id: 'DEC-1', title: 'Reroute Shipment SHP-999', status: 'READY_FOR_REVIEW' }],
    getPendingDecisions: () => [{ id: 'DEC-1', title: 'Reroute Shipment SHP-999', status: 'READY_FOR_REVIEW' }],
    getDemandForecasts: () => [],
    getContracts: () => [],
    getTransportationPlans: () => []
  };

  const context = { tenantId: 't-rep-test', userId: 'u-rep-1' };

  it('Verifies 6 queries produce 6 distinct responses with non-identical headers', async () => {
    const queries = [
      'Show inventory',
      'Show delayed shipments',
      'Show overdue POs',
      'Show supplier performance',
      'Show exceptions',
      'Show pending decisions'
    ];

    const responses: string[] = [];

    for (const q of queries) {
      const res = await generateCopilotResponse(q, mockTools, 'Control Tower', context);
      const text = res.response || String(res);
      responses.push(text);
      
      // Assert that none contain generic Control Tower summary header
      expect(text).not.toContain('#### 1. EXECUTIVE SUMMARY');
    }

    // Verify all 6 responses are unique
    const uniqueResponses = new Set(responses);
    expect(uniqueResponses.size).toBe(6);

    // Extract first line of each response as header
    const headers = responses.map(r => r.split('\n')[0]);
    const uniqueHeaders = new Set(headers);
    expect(uniqueHeaders.size).toBe(6);
  });
});
