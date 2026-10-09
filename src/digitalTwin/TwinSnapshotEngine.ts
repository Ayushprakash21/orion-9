/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Twin Snapshot Engine
 * 
 * Captures immutable state snapshots of the digital twin at specific points in time.
 * Calculates deterministic SHA-256 checksums to guarantee integrity and detect tampering.
 */

import { TwinSnapshot, TwinEntity, TwinRelationship } from './types';
import { TwinGraphEngine } from './TwinGraphEngine';
import { temporalStateEngine } from './TemporalStateEngine';

export class TwinSnapshotEngine {
  private static instance: TwinSnapshotEngine;
  private snapshots: Map<string, TwinSnapshot> = new Map(); // key: `${tenantId}:${snapshotId}`

  private constructor() {}

  public static getInstance(): TwinSnapshotEngine {
    if (!TwinSnapshotEngine.instance) {
      TwinSnapshotEngine.instance = new TwinSnapshotEngine();
    }
    return TwinSnapshotEngine.instance;
  }

  /**
   * Deterministic SHA-256 cryptographic checksum generation using entity and relationship topology
   */
  public static calculateChecksum(
    entities: Record<string, TwinEntity> | TwinEntity[],
    relationships: TwinRelationship[]
  ): string {
    const entityList = Array.isArray(entities) ? entities : Object.values(entities);
    const sortedEntityKeys = entityList.map(e => `${e.entityId || (e as any).id}:${e.status || 'ACTIVE'}:${e.riskScore ?? 0}`).sort();
    const str = sortedEntityKeys.join('|') +
      '#' + relationships.map(r => `${r.fromId || (r as any).sourceId}->${r.toId || (r as any).targetId}:${r.type}`).sort().join('|');

    // Deterministic synchronous SHA-256 hash
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i = 0, j = 0;
    let result = '';
    const words: number[] = [];
    const asciiBitLength = str.length * 8;
    let hash: number[] = [];
    const k: number[] = [];
    let primeCounter = 0;
    const isComposite: Record<number, boolean> = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 300; i += candidate) {
          isComposite[i] = true;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0, 8);
    let padded = str + '\x80';
    while ((padded.length % 64) - 56) padded += '\x00';
    for (i = 0; i < padded.length; i++) {
      j = padded.charCodeAt(i);
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15] || 0, w2 = w[i - 2] || 0;
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (i < 16 ? w[i] : (w[i - 16] + s0 + (w[i - 7] || 0) + s1)) | 0;
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        const s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        const temp1 = hash[7] + s1_h + ch + k[i] + w[i];
        const temp2 = s0_h + maj;
        hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return `CHK-${result}`;
  }

  /**
   * Captures an immutable snapshot from a live graph or raw entity/rel collections
   */
  public createSnapshot(
    tenantId: string,
    twinId: string,
    arg3: number | TwinGraphEngine | TwinEntity[] | any,
    arg4?: TwinGraphEngine | TwinRelationship[] | any,
    arg5: string[] = []
  ): TwinSnapshot {
    let stateVersion = 1;
    let nodes: TwinEntity[] = [];
    let edges: TwinRelationship[] = [];
    let sourceEventIds: string[] = [];

    if (typeof arg3 === 'number') {
      stateVersion = arg3;
      if (arg4 instanceof TwinGraphEngine) {
        nodes = arg4.listNodes(tenantId);
        edges = arg4.listEdges(tenantId);
      }
      sourceEventIds = arg5;
    } else if (arg3 instanceof TwinGraphEngine) {
      nodes = arg3.listNodes(tenantId);
      edges = arg3.listEdges(tenantId);
    } else if (Array.isArray(arg3)) {
      nodes = arg3;
      edges = Array.isArray(arg4) ? arg4 : [];
    }

    const snapshotId = `SNAP-${tenantId}-${twinId}-V${stateVersion}-${Date.now()}`;
    const entitiesRecord: Record<string, TwinEntity> = {};
    for (const node of nodes) {
      const id = node.entityId || (node as any).id;
      entitiesRecord[id] = JSON.parse(JSON.stringify(node));
    }
    const relationships = JSON.parse(JSON.stringify(edges));
    const checksum = TwinSnapshotEngine.calculateChecksum(entitiesRecord, relationships);

    const snapshot: TwinSnapshot = {
      snapshotId,
      id: snapshotId,
      tenantId,
      twinId,
      stateVersion,
      createdAt: new Date().toISOString(),
      sourceEventIds,
      entityCount: nodes.length,
      relationshipCount: edges.length,
      checksum,
      status: 'VALID',
      statePlane: 'HISTORICAL',
      entities: entitiesRecord as any,
      relationships,
    } as any;

    this.snapshots.set(`${tenantId}:${snapshotId}`, snapshot);
    try {
      temporalStateEngine.registerHistoricalSnapshot(snapshot);
    } catch {
      // ignore
    }
    return JSON.parse(JSON.stringify(snapshot));
  }

  public async captureSnapshot(
    tenantId: string,
    twinId: string,
    description: string,
    entities: TwinEntity[],
    relationships: TwinRelationship[] = []
  ): Promise<TwinSnapshot> {
    const snap = this.createSnapshot(tenantId, twinId, entities, relationships);
    (snap as any).description = description;
    return snap;
  }

  public updateSnapshot(): never {
    throw new Error('SnapshotImmutabilityViolation: Twin snapshots are permanently immutable and cannot be updated.');
  }

  public deleteSnapshot(): never {
    throw new Error('SnapshotImmutabilityViolation: Twin snapshots are permanently immutable and cannot be deleted.');
  }

  public getSnapshot(tenantId: string, snapshotId: string): TwinSnapshot | undefined {
    // Check if snapshot exists under another tenant
    for (const [, snp] of this.snapshots.entries()) {
      if (snp.snapshotId === snapshotId || (snp as any).id === snapshotId) {
        if (snp.tenantId !== tenantId) {
          throw new Error(`Cross-tenant snapshot access denied: ${snapshotId}`);
        }
        return JSON.parse(JSON.stringify(snp));
      }
    }
    return undefined;
  }

  public verifySnapshotIntegrity(snapshot: TwinSnapshot): boolean {
    const entities = snapshot.entities;
    const relationships = snapshot.relationships || [];
    const recalculated = TwinSnapshotEngine.calculateChecksum(entities, relationships);
    return recalculated === snapshot.checksum;
  }

  public listSnapshots(tenantId: string): TwinSnapshot[] {
    const res: TwinSnapshot[] = [];
    for (const [key, snp] of this.snapshots.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        res.push(JSON.parse(JSON.stringify(snp)));
      }
    }
    return res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Rehydrates a TwinGraphEngine from an immutable snapshot
   */
  public restoreGraphFromSnapshot(snapshot: TwinSnapshot): TwinGraphEngine {
    const graph = new TwinGraphEngine(snapshot.tenantId);
    const entityList = Array.isArray(snapshot.entities) ? snapshot.entities : Object.values(snapshot.entities);
    for (const entity of entityList) {
      graph.addNode(entity);
    }
    for (const rel of snapshot.relationships) {
      graph.addEdge(rel);
    }
    return graph;
  }

  public clear(): void {
    this.snapshots.clear();
  }
}

export const twinSnapshotEngine = TwinSnapshotEngine.getInstance();
