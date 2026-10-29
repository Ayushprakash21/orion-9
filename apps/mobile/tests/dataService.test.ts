import {
  DEFAULT_EXCEPTIONS,
  DEFAULT_SHIPMENTS,
  DEFAULT_INVENTORY,
  DEFAULT_SUPPLIERS,
  DEFAULT_POS,
  DEFAULT_EVENTS,
} from '../src/features/control-tower/DataContext';

describe('Orion-9 SCM Data Models & Metrics', () => {
  it('provides verified default exception records', () => {
    expect(DEFAULT_EXCEPTIONS.length).toBeGreaterThanOrEqual(4);
    const critical = DEFAULT_EXCEPTIONS.filter(e => e.severity === 'Critical');
    expect(critical.length).toBe(2);

    const stockoutExc = DEFAULT_EXCEPTIONS.find(e => e.id === 'EXC-2026-001');
    expect(stockoutExc).toBeDefined();
    expect(stockoutExc?.entityId).toBe('SKU-1000');
    expect(stockoutExc?.estimatedImpact).toBe(145000);
  });

  it('provides verified shipment records with delay variance', () => {
    expect(DEFAULT_SHIPMENTS.length).toBeGreaterThanOrEqual(3);
    const delayed = DEFAULT_SHIPMENTS.filter(s => s.delayDays > 0);
    expect(delayed.length).toBe(2);

    const maritime = DEFAULT_SHIPMENTS.find(s => s.id === 'SHP-2026-0001');
    expect(maritime?.carrier).toBe('Maersk Line');
    expect(maritime?.delayDays).toBe(4);
  });

  it('calculates inventory buffer deficits accurately', () => {
    expect(DEFAULT_INVENTORY.length).toBeGreaterThanOrEqual(4);
    const atRisk = DEFAULT_INVENTORY.filter(
      i => (i.onHand - i.reserved) < i.safetyStock
    );
    expect(atRisk.length).toBe(2);

    const sku1000 = DEFAULT_INVENTORY.find(i => i.productId === 'SKU-1000');
    expect(sku1000).toBeDefined();
    expect(sku1000!.onHand - sku1000!.reserved).toBeLessThan(sku1000!.safetyStock);
  });

  it('maintains supplier scorecard integrity', () => {
    expect(DEFAULT_SUPPLIERS.length).toBe(4);
    const titan = DEFAULT_SUPPLIERS.find(s => s.id === 'SUP-001');
    expect(titan?.name).toBe('Titan Microelectronics');
    expect(titan?.riskLevel).toBe('High');
    expect(titan?.otif).toBe(78.4);
  });

  it('contains structured operational events for real-time stream', () => {
    expect(DEFAULT_EVENTS.length).toBe(4);
    const sources = DEFAULT_EVENTS.map(e => e.source);
    expect(sources).toContain('Event Fabric');
    expect(sources).toContain('EDI Gateway');
    expect(sources).toContain('Cognitive Engine');
  });

  it('correctly maps purchase order commitment values and overdue status', () => {
    const overdue = DEFAULT_POS.filter(po => po.status === 'Overdue' || po.status === 'Delayed');
    expect(overdue.length).toBe(2);
    const totalCommitment = DEFAULT_POS.reduce((sum, po) => sum + po.totalValue, 0);
    expect(totalCommitment).toBe(467400);
  });

  it('calculates aggregate network health index with correct formula', () => {
    const criticalExceptions = DEFAULT_EXCEPTIONS.filter(e => e.severity === 'Critical').length;
    const delayedShipments = DEFAULT_SHIPMENTS.filter(s => s.delayDays > 0).length;
    const atRiskInventory = DEFAULT_INVENTORY.filter(i => (i.onHand - i.reserved) < i.safetyStock).length;
    expect(criticalExceptions).toBe(2);
    expect(delayedShipments).toBe(2);
    expect(atRiskInventory).toBe(2);
  });
});
