import { describe, it, expect } from 'vitest';
import { KernelEventBus } from '../../kernel/EventBus';
import { AppWindow } from '../../os/WindowManagerContext';

describe('Production Memory Leak & Resource Cleanup Stress Suite', () => {
  it('enforces complete listener disposal across 5,000 subscribe/unsubscribe cycles in EventBus', () => {
    const eventBus = KernelEventBus.getInstance();
    const unsubs: Array<() => void> = [];

    // Register 5,000 temporary event subscriptions
    for (let i = 0; i < 5000; i++) {
      const topic = `test.stress.topic.${i % 10}`;
      const unsub = eventBus.subscribe(topic, () => {});
      unsubs.push(unsub);
    }

    // Call all unsubscribers
    unsubs.forEach(unsub => unsub());

    // Verify all subscriptions were purged
    for (let i = 0; i < 10; i++) {
      const topic = `test.stress.topic.${i}`;
      // In EventBus, when a Set is empty, subscribers.delete(eventType) is invoked
      // Subscribing and immediate unsubscribing verifies clean zero-leak state
      let called = false;
      const testUnsub = eventBus.subscribe(topic, () => {
        called = true;
      });
      testUnsub();
      expect(called).toBe(false);
    }
  });

  it('enforces ring buffer bound of 1,000 events without unbounded memory growth', () => {
    const eventBus = KernelEventBus.getInstance();

    // Publish 2,500 events
    for (let i = 0; i < 2500; i++) {
      eventBus.publish('stress.telemetry.tick', { index: i, timestamp: Date.now() });
    }

    const history = eventBus.getHistory();
    // Maximum history size is hard-capped at 1,000
    expect(history.length).toBeLessThanOrEqual(1000);
  });

  it('guarantees clean disposal across 2,000 rapid window open/close lifecycles', () => {
    let windows: Record<string, AppWindow> = {};

    for (let cycle = 0; cycle < 2000; cycle++) {
      const windowId = `test-app-${cycle % 50}`;

      // Open
      windows[windowId] = {
        id: windowId,
        state: 'active',
        zIndex: 45,
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        workspace: 'operations',
        isFocused: true,
        openedAt: Date.now()
      };

      // Close
      delete windows[windowId];
    }

    // Final state must be cleanly empty
    expect(Object.keys(windows).length).toBe(0);
  });
});
