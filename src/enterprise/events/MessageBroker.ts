/**
 * ORION-9 WAVE 11: DISTRIBUTED EVENT FABRIC — MESSAGE BROKER ABSTRACTION
 * Provider-neutral broker interface supporting Topics, Partitions,
 * Consumer Groups, and deterministic offset management.
 */

import { DistributedEventEnvelope } from './EventEnvelope';

export interface PartitionRecord {
  offset: number;
  envelope: DistributedEventEnvelope;
  publishedAt: string;
}

export interface TopicConfig {
  topicName: string;
  partitionsCount: number;
  retentionHours: number;
  maxMessageBytes: number;
}

export interface ConsumerOffset {
  consumerGroupId: string;
  topicName: string;
  partitionId: number;
  committedOffset: number;
  lastCommittedAt: string;
}

export interface TopicLagMetric {
  topicName: string;
  consumerGroupId: string;
  partitionId: number;
  highWatermark: number;
  committedOffset: number;
  lag: number;
}

export type MessageHandler = (envelope: DistributedEventEnvelope) => Promise<void> | void;

export class MessageBroker {
  private static instance: MessageBroker;

  // Topic -> Partition ID -> array of PartitionRecord
  private topics: Map<string, Map<number, PartitionRecord[]>> = new Map();
  // Topic -> TopicConfig
  private topicConfigs: Map<string, TopicConfig> = new Map();
  // ConsumerGroup:Topic:Partition -> ConsumerOffset
  private consumerOffsets: Map<string, ConsumerOffset> = new Map();
  // ConsumerGroup:Topic -> MessageHandler
  private consumerHandlers: Map<string, MessageHandler[]> = new Map();

  // Deduplication cache: idempotencyKey -> timestamp
  private deduplicationCache: Map<string, number> = new Map();
  private readonly DEDUP_TTL_MS = 3600000; // 1 hour

  private constructor() {
    this.createDefaultTopics();
  }

  public static getInstance(): MessageBroker {
    if (!MessageBroker.instance) {
      MessageBroker.instance = new MessageBroker();
    }
    return MessageBroker.instance;
  }

  private createDefaultTopics(): void {
    const defaults: TopicConfig[] = [
      { topicName: 'enterprise.events.orders', partitionsCount: 8, retentionHours: 72, maxMessageBytes: 1048576 },
      { topicName: 'enterprise.events.shipments', partitionsCount: 8, retentionHours: 72, maxMessageBytes: 1048576 },
      { topicName: 'enterprise.events.inventory', partitionsCount: 4, retentionHours: 48, maxMessageBytes: 1048576 },
      { topicName: 'enterprise.events.sap.inbound', partitionsCount: 4, retentionHours: 168, maxMessageBytes: 2097152 },
      { topicName: 'enterprise.events.oracle.inbound', partitionsCount: 4, retentionHours: 168, maxMessageBytes: 2097152 },
      { topicName: 'enterprise.events.edi.inbound', partitionsCount: 4, retentionHours: 168, maxMessageBytes: 2097152 },
      { topicName: 'enterprise.events.reconciliation', partitionsCount: 4, retentionHours: 72, maxMessageBytes: 1048576 },
      { topicName: 'enterprise.events.jobs.status', partitionsCount: 4, retentionHours: 24, maxMessageBytes: 524288 },
      { topicName: 'enterprise.events.dlq', partitionsCount: 2, retentionHours: 720, maxMessageBytes: 5242880 }
    ];

    for (const t of defaults) {
      this.createTopic(t);
    }
  }

  public createTopic(config: TopicConfig): void {
    if (this.topicConfigs.has(config.topicName)) return;
    this.topicConfigs.set(config.topicName, config);
    const partitions = new Map<number, PartitionRecord[]>();
    for (let p = 0; p < config.partitionsCount; p++) {
      partitions.set(p, []);
    }
    this.topics.set(config.topicName, partitions);
  }

  /**
   * Deterministic partition calculation using partitionKey
   */
  public getPartitionFor(topicName: string, partitionKey: string): number {
    const config = this.topicConfigs.get(topicName);
    const count = config ? config.partitionsCount : 4;
    let hash = 0;
    for (let i = 0; i < partitionKey.length; i++) {
      hash = (hash << 5) - hash + partitionKey.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) % count;
  }

  /**
   * Publish an event to the distributed broker
   */
  public async publish(topicName: string, envelope: DistributedEventEnvelope): Promise<{
    topicName: string;
    partition: number;
    offset: number;
    isDuplicate: boolean;
  }> {
    // 1. Idempotency & Deduplication check
    if (envelope.idempotencyKey) {
      if (this.deduplicationCache.has(envelope.idempotencyKey)) {
        return {
          topicName,
          partition: this.getPartitionFor(topicName, envelope.partitionKey),
          offset: -1,
          isDuplicate: true
        };
      }
      this.deduplicationCache.set(envelope.idempotencyKey, Date.now());
    }

    // Ensure topic exists
    if (!this.topics.has(topicName)) {
      this.createTopic({ topicName, partitionsCount: 4, retentionHours: 72, maxMessageBytes: 1048576 });
    }

    const partitionId = this.getPartitionFor(topicName, envelope.partitionKey);
    const partitionsMap = this.topics.get(topicName)!;
    const partitionRecords = partitionsMap.get(partitionId) || [];

    const offset = partitionRecords.length;
    envelope.sequence = offset;

    const record: PartitionRecord = {
      offset,
      envelope: { ...envelope },
      publishedAt: new Date().toISOString()
    };

    partitionRecords.push(record);
    partitionsMap.set(partitionId, partitionRecords);

    // Notify registered consumer handlers asynchronously
    this.dispatchToConsumers(topicName, envelope);

    return {
      topicName,
      partition: partitionId,
      offset,
      isDuplicate: false
    };
  }

  /**
   * Publish a batch of events
   */
  public async publishBatch(topicName: string, envelopes: DistributedEventEnvelope[]): Promise<{
    totalPublished: number;
    duplicatesIgnored: number;
  }> {
    let published = 0;
    let duplicates = 0;
    for (const env of envelopes) {
      const res = await this.publish(topicName, env);
      if (res.isDuplicate) {
        duplicates++;
      } else {
        published++;
      }
    }
    return { totalPublished: published, duplicatesIgnored: duplicates };
  }

  /**
   * Subscribe a consumer group handler to a topic
   */
  public subscribe(consumerGroupId: string, topicName: string, handler: MessageHandler): void {
    const key = `${consumerGroupId}:${topicName}`;
    const handlers = this.consumerHandlers.get(key) || [];
    handlers.push(handler);
    this.consumerHandlers.set(key, handlers);
  }

  private dispatchToConsumers(topicName: string, envelope: DistributedEventEnvelope): void {
    for (const [key, handlers] of this.consumerHandlers.entries()) {
      const [groupId, tName] = key.split(':');
      if (tName === topicName) {
        for (const handler of handlers) {
          Promise.resolve().then(async () => {
            try {
              await handler(envelope);
              // Auto-commit offset for this consumer
              const partitionId = this.getPartitionFor(topicName, envelope.partitionKey);
              this.commitOffset(groupId, topicName, partitionId, envelope.sequence || 0);
            } catch (err) {
              console.error(`Consumer group ${groupId} failed processing event ${envelope.eventId} on topic ${topicName}:`, err);
            }
          });
        }
      }
    }
  }

  public commitOffset(consumerGroupId: string, topicName: string, partitionId: number, offset: number): void {
    const key = `${consumerGroupId}:${topicName}:${partitionId}`;
    this.consumerOffsets.set(key, {
      consumerGroupId,
      topicName,
      partitionId,
      committedOffset: offset,
      lastCommittedAt: new Date().toISOString()
    });
  }

  public getCommittedOffset(consumerGroupId: string, topicName: string, partitionId: number): number {
    const key = `${consumerGroupId}:${topicName}:${partitionId}`;
    return this.consumerOffsets.get(key)?.committedOffset ?? -1;
  }

  public getLagMetrics(consumerGroupId: string, topicName: string): TopicLagMetric[] {
    const partitionsMap = this.topics.get(topicName);
    if (!partitionsMap) return [];

    const metrics: TopicLagMetric[] = [];
    for (const [pId, records] of partitionsMap.entries()) {
      const highWatermark = records.length;
      const committed = this.getCommittedOffset(consumerGroupId, topicName, pId);
      const lag = Math.max(0, highWatermark - (committed + 1));
      metrics.push({
        topicName,
        consumerGroupId,
        partitionId: pId,
        highWatermark,
        committedOffset: committed,
        lag
      });
    }
    return metrics;
  }

  public getTopicMessages(topicName: string, partitionId?: number): PartitionRecord[] {
    const partitionsMap = this.topics.get(topicName);
    if (!partitionsMap) return [];
    if (partitionId !== undefined) {
      return [...(partitionsMap.get(partitionId) || [])];
    }
    const all: PartitionRecord[] = [];
    for (const records of partitionsMap.values()) {
      all.push(...records);
    }
    all.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    return all;
  }

  public clear(): void {
    this.topics.clear();
    this.topicConfigs.clear();
    this.consumerOffsets.clear();
    this.consumerHandlers.clear();
    this.deduplicationCache.clear();
    this.createDefaultTopics();
  }
}

export const messageBroker = MessageBroker.getInstance();
