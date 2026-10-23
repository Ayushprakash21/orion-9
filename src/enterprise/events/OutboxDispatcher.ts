/**
 * ORION-9 OUTBOX DISPATCHER
 * Executes concurrency-safe outbox event dispatching to Cloudflare Queues.
 * Guarantees:
 * 1. Atomicity: Business state and outbox events are written together in Firestore transactions.
 * 2. Concurrency Safety: Lease-based claiming with ownership and expiration prevents race conditions.
 * 3. Isolation: Transactions are committed BEFORE network Queue publication.
 * 4. At-least-once delivery: Tolerates worker failure between publish and mark-published.
 * 5. Quarantine: Poison pills and exhausted retries route to DeadLetterQueueManager and DLQ queue.
 */

import { queueProducer, CloudflareQueueBinding } from './QueueProducer';
import { scmPersistenceService, OutboxEventRecord } from '../../services/scm/ScmPersistenceService';
import { DeadLetterQueueManager } from './DeadLetterQueueManager';

export interface DispatchOptions {
  queue?: CloudflareQueueBinding;
  dlq?: CloudflareQueueBinding;
  isLive?: boolean;
  environment?: 'LIVE' | 'DEMO' | 'STAGING';
  limit?: number;
  workerId?: string;
  leaseDurationMs?: number;
}

export interface DispatchSummary {
  workerId: string;
  scanned: number;
  claimed: number;
  published: number;
  failed: number;
  quarantined: number;
  skipped: number;
  durationMs: number;
  records: Array<{
    outboxId: string;
    eventId: string;
    idempotencyKey: string;
    status: 'PUBLISHED' | 'FAILED' | 'DEAD_LETTER' | 'SKIPPED';
    error?: string;
  }>;
}

export class OutboxDispatcher {
  private static instance: OutboxDispatcher;
  private readonly defaultLeaseDurationMs = 60000; // 60 seconds

  public static getInstance(): OutboxDispatcher {
    if (!OutboxDispatcher.instance) {
      OutboxDispatcher.instance = new OutboxDispatcher();
    }
    return OutboxDispatcher.instance;
  }

  /**
   * Run the outbox dispatch cycle.
   */
  public async dispatch(options: DispatchOptions = {}): Promise<DispatchSummary> {
    const startTime = Date.now();
    const workerId = options.workerId || `worker_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const leaseDurationMs = options.leaseDurationMs || this.defaultLeaseDurationMs;
    const limit = options.limit || 50;

    const summary: DispatchSummary = {
      workerId,
      scanned: 0,
      claimed: 0,
      published: 0,
      failed: 0,
      quarantined: 0,
      skipped: 0,
      durationMs: 0,
      records: []
    };

    try {
      // 1. Scan for candidate pending or expired-claim events
      const candidates = await scmPersistenceService.getPendingOutboxEvents(undefined, limit);
      summary.scanned = candidates.length;

      for (const candidate of candidates) {
        // 2. Concurrency-safe claim (inside Firestore transaction, short and isolated)
        let claimed: OutboxEventRecord | null = null;
        try {
          claimed = await scmPersistenceService.claimOutboxEvent(candidate.id, workerId, leaseDurationMs);
        } catch (claimErr: any) {
          console.warn(`[OUTBOX-DISPATCHER] Failed to claim event ${candidate.id}:`, claimErr);
          claimed = null;
        }

        if (!claimed) {
          // Another worker claimed it, or lease is still active, or max attempts reached
          summary.skipped++;
          summary.records.push({
            outboxId: candidate.id,
            eventId: candidate.envelope?.eventId || 'unknown',
            idempotencyKey: candidate.idempotencyKey || candidate.id,
            status: 'SKIPPED',
            error: 'Document claimed by another worker or lease still valid'
          });
          continue;
        }

        summary.claimed++;

        // 3. Network publication performed OUTSIDE any database transaction
        const pubResult = await queueProducer.publish(options.queue, claimed.envelope, {
          isLive: options.isLive,
          environment: options.environment
        });

        if (!pubResult.success) {
          // 4b. Handle publication failure
          const pubError = pubResult.error || 'Unknown publish error';
          const attempts = claimed.attempts;
          const maxAttempts = claimed.maxAttempts || 5;

          if (attempts >= maxAttempts) {
            // Retries exhausted — quarantine to DLQ
            summary.quarantined++;
            console.error(`[OUTBOX-DISPATCHER] Event ${claimed.id} exhausted max retries (${attempts}/${maxAttempts}). Quarantining to DLQ.`);

            // Record in DeadLetterQueueManager
            try {
              await DeadLetterQueueManager.getInstance().quarantineMessage({
                tenantId: claimed.tenantId,
                originalTopic: 'orion-scm-events',
                envelope: claimed.envelope,
                failureReason: pubError,
                attemptCount: attempts,
                maxAttempts,
                isPoisonPill: true
              });
            } catch (dlqErr) {
              console.error(`[OUTBOX-DISPATCHER] Failed to register dead letter in DeadLetterQueueManager:`, dlqErr);
            }

            // Route to DLQ queue binding if available
            if (options.dlq) {
              try {
                await queueProducer.publish(options.dlq, claimed.envelope, {
                  isLive: options.isLive,
          environment: options.environment
                });
              } catch (dlqPubErr) {
                console.error(`[OUTBOX-DISPATCHER] Failed to publish event ${claimed.id} to Cloudflare SCM_EVENTS_DLQ:`, dlqPubErr);
              }
            }

            // Mark outbox doc as DEAD_LETTER
            await scmPersistenceService.markOutboxFailed(claimed.id, workerId, pubError, true, claimed.fenceToken);

            summary.records.push({
              outboxId: claimed.id,
              eventId: claimed.envelope.eventId,
              idempotencyKey: claimed.idempotencyKey,
              status: 'DEAD_LETTER',
              error: pubError
            });
          } else {
            // Transient failure — release claim and reset to PENDING for retry
            summary.failed++;
            console.warn(`[OUTBOX-DISPATCHER] Event ${claimed.id} transient publish failure (attempt ${attempts}/${maxAttempts}): ${pubError}`);

            await scmPersistenceService.markOutboxFailed(claimed.id, workerId, pubError, false, claimed.fenceToken);

            summary.records.push({
              outboxId: claimed.id,
              eventId: claimed.envelope.eventId,
              idempotencyKey: claimed.idempotencyKey,
              status: 'FAILED',
              error: pubError
            });
          }
        } else {
          // 4a. Mark published successfully
          try {
            const markOk = await scmPersistenceService.markOutboxPublished(claimed.id, workerId, claimed.fenceToken);
            if (!markOk) {
              console.warn(`[OUTBOX-DISPATCHER] Stale lease detected for ${claimed.id}: claim lost to another worker.`);
            }
          } catch (markErr: any) {
            console.error(`[OUTBOX-DISPATCHER] Publish succeeded but markPublished failed for ${claimed.id}. At-least-once recovery will handle it on lease expiry:`, markErr);
          }

          summary.published++;
          summary.records.push({
            outboxId: claimed.id,
            eventId: claimed.envelope.eventId,
            idempotencyKey: claimed.idempotencyKey,
            status: 'PUBLISHED'
          });
        }
      }
    } catch (err: any) {
      console.error(`[OUTBOX-DISPATCHER] Critical dispatch loop error:`, err);
    } finally {
      summary.durationMs = Date.now() - startTime;
    }

    return summary;
  }
}

export const outboxDispatcher = OutboxDispatcher.getInstance();
