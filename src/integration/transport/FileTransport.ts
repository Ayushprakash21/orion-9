/**
 * ORION-9 WAVE 3.3 — FILE TRANSPORT ENGINE
 */

import { BaseTransport } from './BaseTransport';
import {
  FileChecksumResult,
  TransportConnectionResult,
  TransportReceiveOptions,
  TransportReceiveResult,
  TransportSendOptions,
  TransportSendResult,
  TransportStatus,
} from '../types';

export class FileTransport extends BaseTransport {
  private incomingDir: string;
  private outgoingDir: string;
  private archiveDir: string;
  private failedDir: string;
  private virtualStorage: Map<string, { content: string; checksum: string }> = new Map();
  private processedChecksums: Set<string> = new Set();

  constructor(record: {
    transportId: string;
    tenantId: string;
    connectorId: string;
    name: string;
    config: {
      incomingDir?: string;
      outgoingDir?: string;
      archiveDir?: string;
      failedDir?: string;
    };
    status?: TransportStatus;
  }) {
    super({
      ...record,
      protocol: 'FILE',
    });
    this.incomingDir = record.config.incomingDir || '/var/orion/data/incoming';
    this.outgoingDir = record.config.outgoingDir || '/var/orion/data/outgoing';
    this.archiveDir = record.config.archiveDir || '/var/orion/data/archive';
    this.failedDir = record.config.failedDir || '/var/orion/data/failed';
  }

  public async connect(): Promise<TransportConnectionResult> {
    this._status = 'CONNECTED';
    return {
      success: true,
      status: 'CONNECTED',
      latencyMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  public async testConnection(): Promise<TransportConnectionResult> {
    return this.connect();
  }

  public async disconnect(): Promise<boolean> {
    this._status = 'DISCONNECTED';
    return true;
  }

  public async send(options: TransportSendOptions): Promise<TransportSendResult> {
    const startTime = Date.now();
    const msgId = `FILE-OUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const content = typeof options.payload === 'string' ? options.payload : JSON.stringify(options.payload);

    const targetPath = options.destinationPath || `${this.outgoingDir}/${msgId}.dat`;
    const checksum = this.calculateChecksum(content);

    this.virtualStorage.set(targetPath, { content, checksum });
    const latency = Date.now() - startTime;
    this.updateTelemetryOnSend(true, latency);

    return {
      success: true,
      messageId: msgId,
      statusCode: 200,
      rawResponse: targetPath,
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    };
  }

  public async receive(options?: TransportReceiveOptions): Promise<TransportReceiveResult> {
    const startTime = Date.now();
    const targetDir = options?.sourcePath || this.incomingDir;

    const messages: Array<{
      messageId: string;
      payload: string;
      sourcePath: string;
      receivedAt: string;
    }> = [];

    for (const [filePath, data] of this.virtualStorage.entries()) {
      if (filePath.startsWith(targetDir)) {
        // Deduplication check
        if (this.processedChecksums.has(data.checksum)) {
          continue; // skip duplicate file content
        }

        this.processedChecksums.add(data.checksum);
        messages.push({
          messageId: `FILE-IN-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          payload: data.content,
          sourcePath: filePath,
          receivedAt: new Date().toISOString(),
        });

        // Simulate move to archive
        const archivePath = `${this.archiveDir}/${filePath.split('/').pop()}`;
        this.virtualStorage.delete(filePath);
        this.virtualStorage.set(archivePath, data);
      }
    }

    const latency = Date.now() - startTime;
    this.updateTelemetryOnReceive(true, messages.length, latency);

    return {
      success: true,
      messages,
      timestamp: new Date().toISOString(),
    };
  }

  public injectIncomingFile(fileName: string, content: string): string {
    const filePath = `${this.incomingDir}/${fileName}`;
    const checksum = this.calculateChecksum(content);
    this.virtualStorage.set(filePath, { content, checksum });
    return filePath;
  }

  public calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `sha256_${Math.abs(hash).toString(16)}`;
  }
}
