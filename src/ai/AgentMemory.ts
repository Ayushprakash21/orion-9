/**
 * ORION-9 WAVE 5 — AGENT MEMORY ABSTRACTION
 *
 * Controlled agent memory system:
 * - Categories: SESSION, TASK, DECISION, OUTCOME
 * - Strictly tenant-scoped (never leaks cross-tenant)
 * - Zero secrets or credentials permitted
 * - Non-authoritative (does not replace transactional database state)
 */

import { AgentMemoryEntry, AIMemoryType } from './types';
import { aiSecurityGuard } from './AISecurityGuard';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

export class AgentMemoryManager {
  private static instance: AgentMemoryManager;
  private memories: Map<string, AgentMemoryEntry> = new Map();

  private constructor() {}

  public static getInstance(): AgentMemoryManager {
    if (!AgentMemoryManager.instance) {
      AgentMemoryManager.instance = new AgentMemoryManager();
    }
    return AgentMemoryManager.instance;
  }

  /**
   * Persist a memory entry
   */
  public async storeMemory(entry: Omit<AgentMemoryEntry, 'memoryId' | 'createdAt'>): Promise<AgentMemoryEntry> {
    if (!entry.tenantId || !entry.agentId) {
      throw new Error('Agent Memory Violation: Missing tenantId or agentId.');
    }

    // Assert no secrets in memory payload
    const contentStr = JSON.stringify(entry.contentReference);
    aiSecurityGuard.assertNoSecretAccess(contentStr);

    const memoryId = `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullEntry: AgentMemoryEntry = {
      ...entry,
      memoryId,
      createdAt: new Date().toISOString(),
    };

    this.memories.set(`${entry.tenantId}:${memoryId}`, fullEntry);

    // Sync to Firestore if available
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'agent_memory', `${entry.tenantId}_${memoryId}`), fullEntry);
      }
    } catch (err) {}

    return fullEntry;
  }

  /**
   * Query memories by tenant, agent, and optionally memory type
   */
  public getMemories(tenantId: string, agentId: string, type?: AIMemoryType): AgentMemoryEntry[] {
    const results: AgentMemoryEntry[] = [];
    for (const [key, mem] of this.memories.entries()) {
      if (mem.tenantId === tenantId && mem.agentId === agentId) {
        if (!type || mem.type === type) {
          results.push(mem);
        }
      }
    }
    return results;
  }

  /**
   * Clear in-memory entries (for testing)
   */
  public reset(): void {
    this.memories.clear();
  }
}

export const agentMemoryManager = AgentMemoryManager.getInstance();
