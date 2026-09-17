/**
 * ORION-9 EVENT FABRIC — KERNEL EVENT BUS
 * Layer 6: Enterprise event-driven communication, idempotency, correlation tracking,
 * replay buffer, and pub/sub broker.
 */

import { EventEnvelope, DataClassification } from './types';
import { generateCorrelationId } from './security/crypto';

export type EventHandler<T = any> = (event: EventEnvelope<T>) => void | Promise<void>;

export class KernelEventBus {
  private static instance: KernelEventBus;
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private wildcardSubscribers: Set<EventHandler> = new Set();
  private eventHistory: EventEnvelope[] = [];
  private processedEventIds: Set<string> = new Set();
  private maxHistorySize: number = 500;

  private constructor() {}

  public static getInstance(): KernelEventBus {
    if (!KernelEventBus.instance) {
      KernelEventBus.instance = new KernelEventBus();
    }
    return KernelEventBus.instance;
  }

  /**
   * Publishes an event through the event fabric.
   * Automatically assigns eventId, timestamp, correlationId if missing.
   */
  public publish<T = any>(
    eventType: string,
    payload: T,
    options?: {
      actor?: EventEnvelope['actor'];
      tenant?: EventEnvelope['tenant'];
      source?: string;
      correlationId?: string;
      causationId?: string;
      entityId?: string;
      entityType?: string;
      classification?: DataClassification;
    }
  ): EventEnvelope<T> {
    const eventId = `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const correlationId = options?.correlationId || generateCorrelationId('evt');

    const envelope: EventEnvelope<T> = {
      eventId,
      eventType,
      version: '2.0',
      timestamp: new Date().toISOString(),
      actor: options?.actor || {
        id: 'system',
        type: 'SYSTEM',
        name: 'Orion Kernel',
      },
      tenant: options?.tenant || {
        organizationId: 'ORION_PLATFORM',
        organizationName: 'ORION_PLATFORM',
      },
      source: options?.source || 'orion-kernel',
      correlationId,
      causationId: options?.causationId,
      entityId: options?.entityId,
      entityType: options?.entityType,
      payload,
      schemaVersion: '1.0',
      classification: options?.classification || 'INTERNAL',
    };

    // Idempotency check
    if (this.processedEventIds.has(eventId)) {
      console.warn(`[EventBus] Duplicate event ${eventId} ignored.`);
      return envelope;
    }
    this.processedEventIds.add(eventId);

    // Keep ring buffer under max capacity
    this.eventHistory.push(envelope);
    if (this.eventHistory.length > this.maxHistorySize) {
      const removed = this.eventHistory.shift();
      if (removed) this.processedEventIds.delete(removed.eventId);
    }

    // Dispatch to specific topic subscribers
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(envelope);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${eventType}:`, err);
        }
      });
    }

    // Dispatch to wildcard subscribers
    this.wildcardSubscribers.forEach(handler => {
      try {
        handler(envelope);
      } catch (err) {
        console.error(`[EventBus] Error in wildcard handler for ${eventType}:`, err);
      }
    });

    // Notify browser runtime if available
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion:event', { detail: envelope }));
    }

    return envelope;
  }

  /**
   * Subscribes to a specific event type or all events ('*')
   */
  public subscribe<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (eventType === '*') {
      this.wildcardSubscribers.add(handler as EventHandler);
      return () => this.wildcardSubscribers.delete(handler as EventHandler);
    }

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    const handlers = this.subscribers.get(eventType)!;
    handlers.add(handler as EventHandler);

    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Returns recent event history for audit, replay, or telemetry
   */
  public getHistory(filter?: { eventType?: string; entityId?: string; correlationId?: string }): EventEnvelope[] {
    if (!filter) return [...this.eventHistory];
    return this.eventHistory.filter(e => {
      if (filter.eventType && e.eventType !== filter.eventType) return false;
      if (filter.entityId && e.entityId !== filter.entityId) return false;
      if (filter.correlationId && e.correlationId !== filter.correlationId) return false;
      return true;
    });
  }

  /**
   * Clears event history (testing & maintenance only)
   */
  public clearHistory(): void {
    this.eventHistory = [];
    this.processedEventIds.clear();
  }
}

export const kernelEventBus = KernelEventBus.getInstance();
