import { aiService } from '../src/features/ai/aiService';

describe('Orion AI Copilot Service', () => {
  it('generates grounded network health summary with zero hallucinations', async () => {
    const response = await aiService.sendMessage('Summarize network health');
    expect(response.role).toBe('assistant');
    expect(response.text).toContain('87% Network Health Index');
    expect(response.text).toContain('Critical Exceptions');
    expect(response.evidence).toBeDefined();
    expect(response.evidence!.length).toBeGreaterThanOrEqual(2);

    const hasKnown = response.evidence!.some(e => e.groundingType === 'KNOWN');
    expect(hasKnown).toBe(true);

    expect(response.recommendedAction).toBeDefined();
    expect(response.recommendedAction?.entityId).toBe('SKU-1000');
  });

  it('analyzes delayed shipments with AIS tracking data and rerouting options', async () => {
    const response = await aiService.sendMessage('Which shipments are delayed?');
    expect(response.text).toContain('SHP-2026-0001');
    expect(response.text).toContain('Maersk Line');
    expect(response.text).toContain('+4 days');
    expect(response.text).toContain('PAC-04');

    expect(response.recommendedAction).toBeDefined();
    expect(response.recommendedAction?.actionType).toBe('REROUTE_SHIPMENT');
    expect(response.recommendedAction?.entityId).toBe('SHP-2026-0001');
  });

  it('analyzes SKU-1000 stockout risk with precise buffer calculations', async () => {
    const response = await aiService.sendMessage('Analyze SKU-1000 stockout risk');
    expect(response.text).toContain('SKU-1000');
    expect(response.text).toContain('Warehouse WH-CHI-01');
    expect(response.text).toContain('Days of Supply');

    expect(response.evidence).toBeDefined();
    const hasCalculated = response.evidence!.some(e => e.groundingType === 'CALCULATED');
    expect(hasCalculated).toBe(true);

    expect(response.recommendedAction).toBeDefined();
    expect(response.recommendedAction?.actionType).toBe('TRANSFER_STOCK');
  });

  it('audits Titan Microelectronics supplier SLA compliance', async () => {
    const response = await aiService.sendMessage('Review Titan Microelectronics performance');
    expect(response.text).toContain('Titan Microelectronics');
    expect(response.text).toContain('78.4%');
    expect(response.text).toContain('PO-2026-0042');

    expect(response.recommendedAction?.actionType).toBe('SUPPLIER_SLA_WARNING');
    expect(response.recommendedAction?.entityId).toBe('SUP-001');
  });
});
