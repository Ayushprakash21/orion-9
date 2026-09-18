/**
 * ORION-9 EVENT FABRIC — KERNEL EVENT BUS
 * Layer 6: Enterprise event-driven communication, idempotency, correlation tracking,
 * replay buffer, and pub/sub broker.
 */

import { EventEnvelope, DataClassification } from './types';
import { generateCorrelationId } from './security/crypto';
import { db, loadData, saveData } from '../data/db';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export type EventHandler<T = any> = (event: EventEnvelope<T>) => void | Promise<void>;

export interface EventReplayOptions {
  fromTimestamp?: string;
  toTimestamp?: string;
  eventTypes?: string[];
  correlationId?: string;
  entityId?: string;
  delayMs?: number;
}

export class KernelEventBus {
  private static instance: KernelEventBus;
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private wildcardSubscribers: Set<EventHandler> = new Set();
  private eventHistory: EventEnvelope[] = [];
  private processedEventIds: Set<string> = new Set();
  private maxHistorySize: number = 1000;
  private isPersisting: boolean = false;

  private constructor() {
    this.hydrateFromStorage();
  }

  public static getInstance(): KernelEventBus {
    if (!KernelEventBus.instance) {
      KernelEventBus.instance = new KernelEventBus();
    }
    return KernelEventBus.instance;
  }

  private async hydrateFromStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<EventEnvelope>(db.eventFabric);
        if (stored && stored.length > 0) {
          this.eventHistory = stored.slice(-this.maxHistorySize);
          this.eventHistory.forEach(e => this.processedEventIds.add(e.eventId));
        }
      }
    } catch (e) {
      console.warn('[EventBus] Unable to hydrate events from local storage:', e);
    }
  }

  private async persistEvents(): Promise<void> {
    if (this.isPersisting || typeof window === 'undefined') return;
    this.isPersisting = true;
    try {
      await saveData(db.eventFabric, this.eventHistory);
    } catch (err) {
      console.warn('[EventBus] Event persistence warning:', err);
    } finally {
      this.isPersisting = false;
    }
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
      isReplay?: boolean;
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

    // Persist to indexed storage
    this.persistEvents();

    // Persist to Cloud Firestore events collection asynchronously
    try {
      const db = getFirebaseFirestore();
      if (db) {
        setDoc(doc(db, 'events', eventId), {
          ...envelope,
          organizationId: envelope.tenant?.organizationId || 'ORION_PLATFORM',
        }).catch(err => console.warn('[EventBus] Firestore event persistence warning:', err));
      }
    } catch (e) {}

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
   * Replays historical events matching criteria for time-travel analysis, state rebuild, or testing
   */
  public async replayEvents(options?: EventReplayOptions): Promise<{ replayedCount: number; events: EventEnvelope[] }> {
    let matched = [...this.eventHistory];

    if (options?.fromTimestamp) {
      const fromTime = new Date(options.fromTimestamp).getTime();
      matched = matched.filter(e => new Date(e.timestamp).getTime() >= fromTime);
    }
    if (options?.toTimestamp) {
      const toTime = new Date(options.toTimestamp).getTime();
      matched = matched.filter(e => new Date(e.timestamp).getTime() <= toTime);
    }
    if (options?.eventTypes && options.eventTypes.length > 0) {
      matched = matched.filter(e => options.eventTypes!.includes(e.eventType));
    }
    if (options?.correlationId) {
      matched = matched.filter(e => e.correlationId === options.correlationId);
    }
    if (options?.entityId) {
      matched = matched.filter(e => e.entityId === options.entityId);
    }

    const delay = options?.delayMs ?? 0;

    for (const evt of matched) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const replayEnvelope: EventEnvelope = {
        ...evt,
        isReplay: true,
      };

      // Dispatch to subscribers with isReplay tag
      const handlers = this.subscribers.get(evt.eventType);
      if (handlers) {
        handlers.forEach(h => {
          try {
            h(replayEnvelope);
          } catch (err) {
            console.error(`[EventBus Replay] Error in handler for ${evt.eventType}:`, err);
          }
        });
      }

      this.wildcardSubscribers.forEach(h => {
        try {
          h(replayEnvelope);
        } catch (err) {
          console.error(`[EventBus Replay] Error in wildcard handler for ${evt.eventType}:`, err);
        }
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orion:event:replay', { detail: replayEnvelope }));
      }
    }

    return { replayedCount: matched.length, events: matched };
  }

  /**
   * Clears event history (testing & maintenance only)
   */
  public async clearHistory(): Promise<void> {
    this.eventHistory = [];
    this.processedEventIds.clear();
    if (typeof window !== 'undefined') {
      try {
        await db.eventFabric.clear();
      } catch (err) {
        console.warn('[EventBus] Clear storage error:', err);
      }
    }
  }
}

export const kernelEventBus = KernelEventBus.getInstance();
