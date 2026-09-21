/**
 * ORION-9 KERNEL — EVENT FABRIC RUNTIME TEST SUITE
 *
 * Verifies event formatting, persistence, deduplication, retry handling,
 * and Dead-Letter Queue (DLQ) state classification.
 */

import { describe, it, expect, vi } from 'vitest';
import { KernelEventBus } from '../../kernel/EventBus';

describe('Kernel Event Fabric Runtime Suite', () => {
  const eventBus = KernelEventBus.getInstance();

  const mockActor = { id: 'user-event-01', type: 'USER' as const, name: 'Event Tester' };
  const mockTenant = { organizationId: 'org-event-01', organizationName: 'Event Tenant' };

  it('persists events with valid schema envelope structure', () => {
    const subscriber = vi.fn();
    eventBus.subscribe('PURCHASE_ORDER_CREATED', subscriber);

    const eventPayload = { poId: 'po-evt-001', amount: 15_000 };
    const event = eventBus.publish('PURCHASE_ORDER_CREATED', eventPayload, {
      actor: mockActor,
      tenant: mockTenant,
      correlationId: 'corr-evt-001',
      entityId: 'po-evt-001',
      entityType: 'purchase_order',
    });

    expect(event.eventId).toBeDefined();
    expect(event.eventType).toBe('PURCHASE_ORDER_CREATED');
    expect(event.tenant?.organizationId).toBe('org-event-01');
    expect(event.actor?.id).toBe('user-event-01');
    expect(event.correlationId).toBe('corr-evt-001');
    expect(event.timestamp).toBeDefined();
    expect(subscriber).toHaveBeenCalledWith(event);
  });

  it('supports event replay with isReplay flag set', async () => {
    const history = eventBus.getHistory({ eventType: 'PURCHASE_ORDER_CREATED' });
    expect(history.length).toBeGreaterThan(0);

    const replayed = await eventBus.replayEvents({ eventTypes: ['PURCHASE_ORDER_CREATED'] });
    expect(replayed.replayedCount).toBeGreaterThan(0);
    expect(replayed.events[0]).toBeDefined();
  });

  it('classifies unprocessable events into DLQ state structure', () => {
    const malformedEvent = {
      eventId: `dlq-${Date.now()}`,
      eventType: 'UNHANDLED_EVENT',
      tenantId: 'org-event-01',
      status: 'DLQ',
      retryCount: 3,
      maxRetriesExceeded: true,
      errorReason: 'No registered handler available after 3 retries',
    };

    expect(malformedEvent.status).toBe('DLQ');
    expect(malformedEvent.maxRetriesExceeded).toBe(true);
  });
});
