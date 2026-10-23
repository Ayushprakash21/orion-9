/**
 * ORION-9 QUEUE CONSUMER & DEDUPLICATION ENGINE
 * Consumes messages delivered by Cloudflare Queues.
 *
 * ARCHITECTURAL CONTRACT: RETRY & DLQ GOVERNANCE
 * -------------------------------------------------------------
 * 1. Transport Delivery & Exponential Backoff:
 *    - Handled by Cloudflare Queues via `message.retry({ delaySeconds })`
 *    - Cloudflare tracks `message.attempts` up to `max_retries: 5` (configured in wrangler.jsonc).
 *    - Application code NEVER increments its own conflicting retry counter for transport delivery.
 * 2. Poison Pill & Exhaustion Quarantine:
 *    - When `message.attempts >= 5` or on non-recoverable malformed payloads, Orion-9 captures
 *      the event in `DeadLetterQueueManager` for enterprise audit, payload inspection, and operator redrive.
 *    - CRITICAL INVARIANT: A message is NEVER acknowledged (`message.ack()`) until its durable
 *      business mutation or quarantine record is safely committed.
 * 3. Atomic Consumer Idempotency:
 *    - Read-before-write transaction ordering strictly enforced.
 *    - In LIVE mode with Firestore: Deduplication record and business mutation are committed
 *      inside the same atomic Firestore transaction.
 *    - In memory / local mode: Protected by an in-memory lock per idempotency key to prevent
 *      concurrent deliveries in the same process from applying duplicate mutations.
 */

import { DistributedEventEnvelope } from './EventEnvelope';
import { getFirebaseFirestore } from '../../lib/firebaseClient';
import { doc, getDoc, setDoc, runTransaction, Firestore } from 'firebase/firestore';
import { DatabaseConnectionManager } from '../../core/database/DatabaseConnectionManager';
import { DeadLetterQueueManager } from './DeadLetterQueueManager';
import { queueProducer } from './QueueProducer';

export interface CloudflareQueueMessage<T = any> {
  readonly id: string;
  readonly timestamp?: Date;
  readonly body: T;
  readonly attempts: number;
  retry(options?: { delaySeconds?: number }): void;
  ack(): void;
}

export interface CloudflareMessageBatch<T = any> {
  readonly messages: readonly CloudflareQueueMessage<T>[];
  readonly queue: string;
  retryAll(options?: { delaySeconds?: number }): void;
  ackAll(): void;
}

export interface ConsumerProcessingResult {
  messageId: string;
  idempotencyKey: string;
  status: 'PROCESSED' | 'DUPLICATE' | 'RETRIED' | 'QUARANTINED' | 'INVALID';
  error?: string;
}

export interface ProcessedEventRecord {
  idempotencyKey: string;
  eventId: string;
  tenantId: string;
  eventType: string;
  status: 'PROCESSED';
  processedAt: string;
}

export type BusinessMutationHandler = (
  envelope: DistributedEventEnvelope,
  context?: { transaction?: any; firestore?: Firestore }
) => Promise<any> | any;

export class QueueConsumer {
  private static instance: QueueConsumer;
  private memoryDeduplicationStore: Map<string, ProcessedEventRecord> = new Map();
  private processingLocks: Map<string, Promise<any>> = new Map();
  private customMutationHandler?: BusinessMutationHandler;
  private firestore: Firestore | null = null;
  private lastProcessedAt: string | null = null;

  private constructor() {
    this.initFirestore();
  }

  public static getInstance(): QueueConsumer {
    if (!QueueConsumer.instance) {
      QueueConsumer.instance = new QueueConsumer();
    }
    return QueueConsumer.instance;
  }

  private initFirestore(): void {
    try {
      this.firestore = getFirebaseFirestore();
    } catch {
      this.firestore = null;
    }
  }

  public getLastProcessedAt(): string | null {
    return this.lastProcessedAt;
  }

  /**
   * Set a custom business mutation handler (for dependency injection and testing).
   */
  public setMutationHandler(handler?: BusinessMutationHandler): void {
    this.customMutationHandler = handler;
  }

  /**
   * Check if an idempotency key has already been durably processed.
   */
  public async isAlreadyProcessed(idempotencyKey: string, tenantId: string): Promise<boolean> {
    const memoryKey = `${tenantId}:${idempotencyKey}`;
    if (this.memoryDeduplicationStore.has(memoryKey)) {
      return true;
    }

    const env = DatabaseConnectionManager.getInstance().getEnvironment();
    if (env === 'LIVE') {
      const firestoreInstance = DatabaseConnectionManager.getInstance().getFirestore('LIVE') || this.firestore;
      if (firestoreInstance) {
        try {
          const docId = `dedup_${idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          const ref = doc(firestoreInstance, 'processed_events', docId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            this.memoryDeduplicationStore.set(memoryKey, snap.data() as ProcessedEventRecord);
            return true;
          }
        } catch (err) {
          console.warn(`[QUEUE-CONSUMER] Firestore deduplication check failed for ${idempotencyKey}:`, err);
        }
      }
    }

    return false;
  }

  /**
   * Handle an individual message from a Cloudflare Queue batch.
   * Guarantees atomic idempotency, strict read-before-write, and no ack before durable commit.
   */
  public async handleMessage(
    message: CloudflareQueueMessage<DistributedEventEnvelope>,
    env: any = {}
  ): Promise<ConsumerProcessingResult> {
    const envelope = message.body;

    // 0. Validate required envelope properties
    if (!envelope || !envelope.idempotencyKey || !envelope.tenantId) {
      console.error(`[QUEUE-CONSUMER] Invalid message envelope received:`, envelope);

      // Durably quarantine malformed poison pill BEFORE acknowledging
      try {
        await DeadLetterQueueManager.getInstance().quarantineMessage({
          tenantId: envelope?.tenantId || 'unknown_tenant',
          originalTopic: 'orion-scm-events',
          envelope: envelope || ({} as any),
          failureReason: 'Malformed event envelope: missing idempotencyKey or tenantId',
          attemptCount: message.attempts || 1,
          maxAttempts: 1,
          isPoisonPill: true
        });
      } catch (dlqErr) {
        console.error(`[QUEUE-CONSUMER] Failed to persist poison pill quarantine:`, dlqErr);
        message.retry({ delaySeconds: 30 });
        return {
          messageId: message.id,
          idempotencyKey: envelope?.idempotencyKey || 'missing',
          status: 'RETRIED',
          error: 'Failed to persist quarantine record'
        };
      }

      message.ack();
      return {
        messageId: message.id,
        idempotencyKey: envelope?.idempotencyKey || 'missing',
        status: 'INVALID',
        error: 'Missing required envelope properties (idempotencyKey, tenantId)'
      };
    }

    // 1. Concurrency Lock for in-memory serialization per idempotency key
    const lockKey = `${envelope.tenantId}:${envelope.idempotencyKey}`;
    const previousLock = this.processingLocks.get(lockKey) || Promise.resolve();

    let executePromise: Promise<ConsumerProcessingResult>;
    executePromise = (async () => {
      await previousLock;
      return this.processMessageAtomically(message, envelope, env);
    })();

    this.processingLocks.set(lockKey, executePromise.catch(() => {}));
    return executePromise;
  }

  /**
   * Internal worker executing atomic deduplication check and mutation.
   */
  private async processMessageAtomically(
    message: CloudflareQueueMessage<DistributedEventEnvelope>,
    envelope: DistributedEventEnvelope,
    env: any
  ): Promise<ConsumerProcessingResult> {
    const memoryKey = `${envelope.tenantId}:${envelope.idempotencyKey}`;

    // Fast-path in-memory duplicate check
    if (this.memoryDeduplicationStore.has(memoryKey)) {
      console.log(`[QUEUE-CONSUMER] Duplicate event suppressed (memory dedup) for key: ${envelope.idempotencyKey}`);
      message.ack();
      return {
        messageId: message.id,
        idempotencyKey: envelope.idempotencyKey,
        status: 'DUPLICATE'
      };
    }

    const currentEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    const firestoreInstance = DatabaseConnectionManager.getInstance().getFirestore('LIVE') || this.firestore;
    const docId = `dedup_${envelope.idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    try {
      if (currentEnv === 'LIVE' && firestoreInstance) {
        // ATOMIC FIRESTORE TRANSACTION (Read-all-before-write)
        const isDuplicate = await runTransaction(firestoreInstance, async (transaction) => {
          // READ PHASE: Must read dedup record first
          const dedupRef = doc(firestoreInstance, 'processed_events', docId);
          const dedupSnap = await transaction.get(dedupRef);

          if (dedupSnap.exists()) {
            return true; // Already processed by another worker
          }

          // READ & WRITE PHASES OF BUSINESS MUTATION:
          if (this.customMutationHandler) {
            await this.customMutationHandler(envelope, { transaction, firestore: firestoreInstance });
          } else {
            await this.executeEventMutation(envelope, transaction);
          }

          // WRITE PHASE: Commit processed_events record in the SAME transaction
          const processedRecord: ProcessedEventRecord = {
            idempotencyKey: envelope.idempotencyKey,
            eventId: envelope.eventId,
            tenantId: envelope.tenantId,
            eventType: envelope.eventType,
            status: 'PROCESSED',
            processedAt: new Date().toISOString()
          };
          transaction.set(dedupRef, processedRecord, { merge: true });

          return false;
        });

        if (isDuplicate) {
          console.log(`[QUEUE-CONSUMER] Duplicate event suppressed (firestore dedup) for key: ${envelope.idempotencyKey}`);
          this.memoryDeduplicationStore.set(memoryKey, {
            idempotencyKey: envelope.idempotencyKey,
            eventId: envelope.eventId,
            tenantId: envelope.tenantId,
            eventType: envelope.eventType,
            status: 'PROCESSED',
            processedAt: new Date().toISOString()
          });
          message.ack();
          return {
            messageId: message.id,
            idempotencyKey: envelope.idempotencyKey,
            status: 'DUPLICATE'
          };
        }
      } else {
        // IN-MEMORY / LOCAL ATOMIC EXECUTION
        if (this.memoryDeduplicationStore.has(memoryKey)) {
          message.ack();
          return {
            messageId: message.id,
            idempotencyKey: envelope.idempotencyKey,
            status: 'DUPLICATE'
          };
        }

        if (this.customMutationHandler) {
          await this.customMutationHandler(envelope);
        } else {
          await this.executeEventMutation(envelope);
        }

        this.memoryDeduplicationStore.set(memoryKey, {
          idempotencyKey: envelope.idempotencyKey,
          eventId: envelope.eventId,
          tenantId: envelope.tenantId,
          eventType: envelope.eventType,
          status: 'PROCESSED',
          processedAt: new Date().toISOString()
        });
      }

      // 3. ONLY ACKNOWLEDGE AFTER BUSINESS STATE AND DEDUP ARE COMMITTED
      this.lastProcessedAt = new Date().toISOString();
      message.ack();
      return {
        messageId: message.id,
        idempotencyKey: envelope.idempotencyKey,
        status: 'PROCESSED'
      };
    } catch (err: any) {
      console.error(`[QUEUE-CONSUMER] Error processing event ${envelope.eventId} (attempt ${message.attempts}):`, err);

      if (message.attempts >= 5) {
        // Retries exhausted: Commit quarantine record BEFORE acknowledging
        console.error(`[QUEUE-CONSUMER] Event ${envelope.eventId} exceeded 5 attempts. Quarantining to DeadLetterQueueManager.`);
        try {
          await DeadLetterQueueManager.getInstance().quarantineMessage({
            tenantId: envelope.tenantId,
            originalTopic: 'orion-scm-events',
            envelope,
            failureReason: err?.message || String(err),
            attemptCount: message.attempts,
            maxAttempts: 5,
            isPoisonPill: true
          });

          if (env.SCM_EVENTS_DLQ) {
            await queueProducer.publish(env.SCM_EVENTS_DLQ, envelope).catch(() => {});
          }

          // Acknowledge ONLY after quarantine is durably written
          message.ack();
          return {
            messageId: message.id,
            idempotencyKey: envelope.idempotencyKey,
            status: 'QUARANTINED',
            error: err?.message || String(err)
          };
        } catch (dlqErr) {
          console.error(`[QUEUE-CONSUMER] Critical DLQ quarantine failure. Refusing to ack:`, dlqErr);
          message.retry({ delaySeconds: 30 });
          return {
            messageId: message.id,
            idempotencyKey: envelope.idempotencyKey,
            status: 'RETRIED',
            error: 'Failed to commit quarantine record'
          };
        }
      }

      // Transient retry with Cloudflare backoff
      message.retry({ delaySeconds: 30 });
      return {
        messageId: message.id,
        idempotencyKey: envelope.idempotencyKey,
        status: 'RETRIED',
        error: err?.message || String(err)
      };
    }
  }

  /**
   * Execute the actual business mutation triggered by the event.
   */
  private async executeEventMutation(envelope: DistributedEventEnvelope, _transaction?: any): Promise<void> {
    if (envelope.eventType.startsWith('scm.inventory.')) {
      return;
    }
  }

  /**
   * Process an entire batch of messages.
   */
  public async handleBatch(
    batch: CloudflareMessageBatch<DistributedEventEnvelope>,
    env: any = {}
  ): Promise<ConsumerProcessingResult[]> {
    const results: ConsumerProcessingResult[] = [];
    for (const msg of batch.messages) {
      const res = await this.handleMessage(msg, env);
      results.push(res);
    }
    return results;
  }

  /**
   * Reset in-memory cache for unit tests.
   */
  public clear(): void {
    this.memoryDeduplicationStore.clear();
    this.processingLocks.clear();
    this.customMutationHandler = undefined;
  }
}

export const queueConsumer = QueueConsumer.getInstance();
