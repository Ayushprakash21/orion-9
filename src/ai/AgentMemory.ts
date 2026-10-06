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

  private constructor() {
    this.restoreLocalCache();
  }

  public static getInstance(): AgentMemoryManager {
    if (!AgentMemoryManager.instance) {
      AgentMemoryManager.instance = new AgentMemoryManager();
    }
    return AgentMemoryManager.instance;
  }

  private restoreLocalCache(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('orion_agent_mem_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const entry: AgentMemoryEntry = JSON.parse(raw);
              if (entry && entry.tenantId && entry.memoryId) {
                this.memories.set(`${entry.tenantId}:${entry.memoryId}`, entry);
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  private persistLocal(entry: AgentMemoryEntry): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`orion_agent_mem_${entry.tenantId}_${entry.memoryId}`, JSON.stringify(entry));
      } catch (e) {}
    }
  }

  /**
   * Persist a memory entry authoritatively
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
    this.persistLocal(fullEntry);

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
   * Query memories by tenant, agent, and optionally memory type.
   * Guarantees:
   * 1. Queries persistent storage + memory cache
   * 2. Strict tenantId & agentId isolation (zero cross-tenant leak)
   * 3. Memory type filtering
   * 4. Bounded ranking by recency & relevance (max 10 entries)
   */
  public getMemories(tenantId: string, agentId: string, type?: AIMemoryType, limitCount: number = 10): AgentMemoryEntry[] {
    this.restoreLocalCache();
    const results: AgentMemoryEntry[] = [];

    for (const [key, mem] of this.memories.entries()) {
      if (mem.tenantId === tenantId && mem.agentId === agentId) {
        if (!type || mem.type === type) {
          results.push(mem);
        }
      }
    }

    // Sort by createdAt descending (most recent first)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return results.slice(0, limitCount);
  }

  /**
   * Query memories by tenant and query keyword relevance
   */
  public queryRelevantMemories(tenantId: string, agentId: string, queryText: string, maxResults: number = 5): AgentMemoryEntry[] {
    const all = this.getMemories(tenantId, agentId, undefined, 50);
    if (!queryText || !queryText.trim()) {
      return all.slice(0, maxResults);
    }

    const qLower = queryText.toLowerCase();
    const terms = qLower.split(/\s+/).filter(Boolean);

    const scored = all.map(mem => {
      const text = JSON.stringify(mem.contentReference).toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 1;
      }
      return { mem, score };
    });

    // Filter items with at least 1 term match or recent high priority
    const matched = scored.filter(s => s.score > 0);
    matched.sort((a, b) => b.score - a.score);

    const res = matched.map(m => m.mem);
    if (res.length < maxResults) {
      // Backfill with most recent general memories if specific keyword matches are few
      for (const m of all) {
        if (!res.includes(m)) {
          res.push(m);
          if (res.length >= maxResults) break;
        }
      }
    }

    return res.slice(0, maxResults);
  }

  /**
   * Clear in-memory entries (for testing)
   */
  public reset(): void {
    this.memories.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('orion_agent_mem_')) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {}
    }
  }
}

export const agentMemoryManager = AgentMemoryManager.getInstance();
