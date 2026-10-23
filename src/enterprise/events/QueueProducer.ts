/**
 * ORION-9 CLOUDFLARE QUEUE PRODUCER
 * Uses the supported Cloudflare Queue producer API (send, sendBatch).
 * Preserves canonical DistributedEventEnvelope and guarantees strict payload validation,
 * tenant isolation, idempotency keys, and explicit error surfacing.
 */

import { DistributedEventEnvelope } from './EventEnvelope';

export interface CloudflareQueueBinding<T = any> {
  send(message: T, options?: { delaySeconds?: number }): Promise<any>;
  sendBatch(messages: Iterable<{ body: T; delaySeconds?: number }>): Promise<any>;
}

export interface QueuePublishOptions {
  isLive?: boolean;
  delaySeconds?: number;
}

export interface QueuePublishSuccess {
  success: true;
  eventId: string;
  idempotencyKey: string;
  deliveredDurable: boolean;
  status: 'DELIVERED';
  error?: undefined;
}

export interface QueuePublishFailure {
  success: false;
  eventId?: string;
  idempotencyKey?: string;
  deliveredDurable: false;
  status: 'UNBOUND_LOCAL_DEV' | 'VALIDATION_ERROR' | 'PUBLISH_FAILED' | 'BINDING_MISSING';
  error: string;
}

export type QueuePublishResult = QueuePublishSuccess | QueuePublishFailure;

export interface BatchPublishResult {
  total: number;
  succeeded: number;
  failed: number;
  deliveredDurable: boolean;
  results: QueuePublishResult[];
}

export class QueueProducer {
  private static instance: QueueProducer;

  public static getInstance(): QueueProducer {
    if (!QueueProducer.instance) {
      QueueProducer.instance = new QueueProducer();
    }
    return QueueProducer.instance;
  }

  /**
   * Validate that the message strictly conforms to the canonical DistributedEventEnvelope.
   */
  public validateEnvelope(envelope: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!envelope || typeof envelope !== 'object') {
      return { valid: false, errors: ['Envelope must be a non-null object'] };
    }

    if (!envelope.eventId || typeof envelope.eventId !== 'string' || !envelope.eventId.trim()) {
      errors.push('Missing or invalid eventId');
    }
    if (!envelope.tenantId || typeof envelope.tenantId !== 'string' || !envelope.tenantId.trim()) {
      errors.push('Missing or invalid tenantId');
    }
    if (!envelope.eventType || typeof envelope.eventType !== 'string' || !envelope.eventType.trim()) {
      errors.push('Missing or invalid eventType');
    }
    if (!envelope.partitionKey || typeof envelope.partitionKey !== 'string' || !envelope.partitionKey.trim()) {
      errors.push('Missing or invalid partitionKey');
    }
    if (!envelope.idempotencyKey || typeof envelope.idempotencyKey !== 'string' || !envelope.idempotencyKey.trim()) {
      errors.push('Missing or invalid idempotencyKey');
    }
    if (!envelope.producer || typeof envelope.producer !== 'string' || !envelope.producer.trim()) {
      errors.push('Missing or invalid producer');
    }
    if (!envelope.occurredAt || isNaN(Date.parse(envelope.occurredAt))) {
      errors.push('Missing or invalid occurredAt ISO timestamp');
    }
    if (envelope.payload === undefined || envelope.payload === null) {
      errors.push('Missing payload');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Publish a canonical DistributedEventEnvelope to Cloudflare Queue using queue.send().
   * Never reports false successful delivery if the binding is missing.
   */
  public async publish(
    queue: CloudflareQueueBinding<DistributedEventEnvelope> | undefined,
    envelope: DistributedEventEnvelope,
    options: QueuePublishOptions = {}
  ): Promise<QueuePublishResult> {
    const validation = this.validateEnvelope(envelope);
    if (!validation.valid) {
      const errorMsg = `[QUEUE-PRODUCER-VALIDATION] Invalid event envelope: ${validation.errors.join(', ')}`;
      console.error(errorMsg, { envelope });
      return {
        success: false,
        eventId: envelope?.eventId,
        idempotencyKey: envelope?.idempotencyKey,
        deliveredDurable: false,
        status: 'VALIDATION_ERROR',
        error: errorMsg
      };
    }

    // Handle missing queue binding
    if (!queue || typeof queue.send !== 'function') {
      if (options.isLive) {
        const err = `[QUEUE-PRODUCER-ERROR] Cloudflare Queue binding is unavailable in LIVE mode for event ${envelope.eventId}`;
        console.error(err);
        return {
          success: false,
          eventId: envelope.eventId,
          idempotencyKey: envelope.idempotencyKey,
          deliveredDurable: false,
          status: 'BINDING_MISSING',
          error: err
        };
      }

      // Explicit local development fallback — strictly does NOT claim durable delivery
      const localMsg = `[QUEUE-PRODUCER-LOCAL] Cloudflare Queue binding is not configured in local environment for event ${envelope.eventId}. Durable delivery NOT performed.`;
      console.warn(localMsg);
      return {
        success: false,
        eventId: envelope.eventId,
        idempotencyKey: envelope.idempotencyKey,
        deliveredDurable: false,
        status: 'UNBOUND_LOCAL_DEV',
        error: localMsg
      };
    }

    try {
      await queue.send(envelope, options.delaySeconds ? { delaySeconds: options.delaySeconds } : undefined);

      return {
        success: true,
        eventId: envelope.eventId,
        idempotencyKey: envelope.idempotencyKey,
        deliveredDurable: true,
        status: 'DELIVERED'
      };
    } catch (err: any) {
      const errorMsg = `[QUEUE-PRODUCER-ERROR] Cloudflare Queue send failed for event ${envelope.eventId}: ${err?.message || err}`;
      console.error(errorMsg, err);
      return {
        success: false,
        eventId: envelope.eventId,
        idempotencyKey: envelope.idempotencyKey,
        deliveredDurable: false,
        status: 'PUBLISH_FAILED',
        error: errorMsg
      };
    }
  }

  /**
   * Publish multiple envelopes using queue.sendBatch().
   */
  public async publishBatch(
    queue: CloudflareQueueBinding<DistributedEventEnvelope> | undefined,
    envelopes: DistributedEventEnvelope[],
    options: QueuePublishOptions = {}
  ): Promise<BatchPublishResult> {
    if (!envelopes || envelopes.length === 0) {
      return { total: 0, succeeded: 0, failed: 0, deliveredDurable: false, results: [] };
    }

    // Validate all envelopes
    const validEnvelopes: DistributedEventEnvelope[] = [];
    const results: QueuePublishResult[] = [];

    for (const env of envelopes) {
      const val = this.validateEnvelope(env);
      if (!val.valid) {
        results.push({
          success: false,
          eventId: env?.eventId,
          idempotencyKey: env?.idempotencyKey,
          deliveredDurable: false,
          status: 'VALIDATION_ERROR',
          error: val.errors.join(', ')
        });
      } else {
        validEnvelopes.push(env);
      }
    }

    if (!queue || typeof queue.sendBatch !== 'function') {
      const status = options.isLive ? 'BINDING_MISSING' : 'UNBOUND_LOCAL_DEV';
      const errMsg = options.isLive
        ? '[QUEUE-PRODUCER-ERROR] Cloudflare Queue binding is unavailable in LIVE mode'
        : '[QUEUE-PRODUCER-LOCAL] Cloudflare Queue binding is not configured in local environment';

      for (const env of validEnvelopes) {
        results.push({
          success: false,
          eventId: env.eventId,
          idempotencyKey: env.idempotencyKey,
          deliveredDurable: false,
          status,
          error: errMsg
        });
      }

      return {
        total: envelopes.length,
        succeeded: 0,
        failed: envelopes.length,
        deliveredDurable: false,
        results
      };
    }

    if (validEnvelopes.length === 0) {
      return {
        total: envelopes.length,
        succeeded: 0,
        failed: envelopes.length,
        deliveredDurable: false,
        results
      };
    }

    try {
      const batchRequests = validEnvelopes.map(env => ({
        body: env,
        delaySeconds: options.delaySeconds
      }));

      await queue.sendBatch(batchRequests);

      for (const env of validEnvelopes) {
        results.push({
          success: true,
          eventId: env.eventId,
          idempotencyKey: env.idempotencyKey,
          deliveredDurable: true,
          status: 'DELIVERED'
        });
      }

      return {
        total: envelopes.length,
        succeeded: validEnvelopes.length,
        failed: envelopes.length - validEnvelopes.length,
        deliveredDurable: true,
        results
      };
    } catch (err: any) {
      const errorMsg = `[QUEUE-PRODUCER-ERROR] Cloudflare Queue sendBatch failed: ${err?.message || err}`;
      console.error(errorMsg, err);

      for (const env of validEnvelopes) {
        results.push({
          success: false,
          eventId: env.eventId,
          idempotencyKey: env.idempotencyKey,
          deliveredDurable: false,
          status: 'PUBLISH_FAILED',
          error: errorMsg
        });
      }

      return {
        total: envelopes.length,
        succeeded: 0,
        failed: envelopes.length,
        deliveredDurable: false,
        results
      };
    }
  }
}

export const queueProducer = QueueProducer.getInstance();
