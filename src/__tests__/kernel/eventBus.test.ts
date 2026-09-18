/**
 * ORION-9 KERNEL — EVENT BUS TESTS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KernelEventBus } from '../../kernel/EventBus';

describe('KernelEventBus', () => {
  let bus: KernelEventBus;

  beforeEach(() => {
    bus = KernelEventBus.getInstance();
  });

  it('publishes an event and notifies subscribers', () => {
    const handler = vi.fn();
    bus.subscribe('TEST_EVENT', handler);

    bus.publish('TEST_EVENT', { value: 42 }, {
      actor: { id: 'u1', type: 'USER', name: 'User' },
      tenant: { organizationId: 'org-001' },
      entityType: 'test',
    });

    expect(handler).toHaveBeenCalledOnce();
    const envelope = handler.mock.calls[0][0];
    expect(envelope.eventType).toBe('TEST_EVENT');
    expect(envelope.payload.value).toBe(42);
  });

  it('notifies wildcard (*) subscribers', () => {
    const handler = vi.fn();
    const unsub = bus.subscribe('*', handler);

    bus.publish('ANY_EVENT', { ping: true });

    expect(handler).toHaveBeenCalled();
    unsub();
  });

  it('supports unsubscription', () => {
    const handler = vi.fn();
    const unsub = bus.subscribe('UNSUB_TEST', handler);
    unsub();

    bus.publish('UNSUB_TEST', {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('assigns eventId and timestamp automatically', () => {
    const envelope = bus.publish('AUTO_FIELDS_EVENT', {});

    expect(envelope.eventId).toMatch(/^evt-/);
    expect(envelope.timestamp).toBeDefined();
    expect(new Date(envelope.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('assigns correlationId automatically when not provided', () => {
    const envelope = bus.publish('CORR_EVENT', {});
    expect(envelope.correlationId).toBeDefined();
    expect(envelope.correlationId.length).toBeGreaterThan(0);
  });

  it('uses provided correlationId', () => {
    const envelope = bus.publish('CORR_PROVIDED', {}, { correlationId: 'custom-corr-001' });
    expect(envelope.correlationId).toBe('custom-corr-001');
  });

  it('sets causationId from options', () => {
    const envelope = bus.publish('CAUSATION_EVENT', {}, { causationId: 'evt-prev-001' });
    expect(envelope.causationId).toBe('evt-prev-001');
  });

  it('returns event from getHistory', () => {
    bus.publish('HISTORY_TEST', { marker: 'xyz' }, { entityId: 'res-999', entityType: 'order' });

    const history = bus.getHistory({ entityId: 'res-999' });
    expect(history.length).toBeGreaterThan(0);
    expect(history.some(e => e.payload?.marker === 'xyz')).toBe(true);
  });

  it('replay events returns matching events with isReplay flag', async () => {
    const replayed: any[] = [];
    bus.subscribe('REPLAY_EVT', (e) => { if (e.isReplay) replayed.push(e); });

    bus.publish('REPLAY_EVT', { r: 1 });
    await bus.replayEvents({ eventTypes: ['REPLAY_EVT'] });

    expect(replayed.length).toBeGreaterThan(0);
    expect(replayed[0].isReplay).toBe(true);
  });
});
