/**
 * ORION-9 GOVERNED CONVERSATION MEMORY SERVICE
 * 
 * Manages persistent multi-turn conversation sessions, summaries, entity tracking,
 * user preferences, and business corrections with strict tenant and user isolation.
 */

import { aiSecurityGuard } from './AISecurityGuard';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  evidence?: string;
  recommendation?: string;
  governanceStatus?: string;
}

export interface ConversationSession {
  conversationId: string;
  tenantId: string;
  userId: string;
  agentId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
  topics: string[];
  entities: string[];
  importantDecisions: string[];
  userPreferences: Record<string, string>;
  userCorrections: string[];
  openQuestions: string[];
}

export class ConversationMemoryService {
  private static instance: ConversationMemoryService;
  private sessions: Map<string, ConversationSession> = new Map(); // key: `${tenantId}:${userId}:${conversationId}`

  private constructor() {
    this.restoreLocalSessions();
  }

  public static getInstance(): ConversationMemoryService {
    if (!ConversationMemoryService.instance) {
      ConversationMemoryService.instance = new ConversationMemoryService();
    }
    return ConversationMemoryService.instance;
  }

  private restoreLocalSessions(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('orion_conv_session_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const session: ConversationSession = JSON.parse(raw);
              if (session && session.tenantId && session.conversationId) {
                this.sessions.set(`${session.tenantId}:${session.userId}:${session.conversationId}`, session);
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  private persistSessionLocal(session: ConversationSession): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(
          `orion_conv_session_${session.tenantId}_${session.userId}_${session.conversationId}`,
          JSON.stringify(session)
        );
      } catch (e) {}
    }
  }

  /**
   * Get or create a conversation session for tenant/user
   */
  public getOrCreateSession(tenantId: string, userId: string, conversationId?: string): ConversationSession {
    this.restoreLocalSessions();

    const activeId = conversationId || `conv-${tenantId}-${userId}-default`;
    const key = `${tenantId}:${userId}:${activeId}`;

    let session = this.sessions.get(key);
    if (!session) {
      session = {
        conversationId: activeId,
        tenantId,
        userId,
        agentId: 'control-tower-copilot',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        topics: [],
        entities: [],
        importantDecisions: [],
        userPreferences: {},
        userCorrections: [],
        openQuestions: [],
      };
      this.sessions.set(key, session);
      this.persistSessionLocal(session);
    }

    return session;
  }

  /**
   * Add message to conversation session & extract operational facts / preferences / corrections
   */
  public async addMessage(
    tenantId: string,
    userId: string,
    conversationId: string | undefined,
    role: 'user' | 'assistant',
    content: string,
    metadata?: { evidence?: string; recommendation?: string; governanceStatus?: string }
  ): Promise<ConversationSession> {
    const session = this.getOrCreateSession(tenantId, userId, conversationId);
    
    // Assert no secret in message text
    aiSecurityGuard.assertNoSecretAccess(content);

    const msg: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    session.messages.push(msg);
    session.updatedAt = new Date().toISOString();

    // Extract operational entities & topics (e.g. SKUs, Suppliers, POs, Shipments)
    const skuMatches = content.match(/\b(SKU-[A-Z0-9-]+|PROD-[A-Z0-9-]+|[A-Z]{3}-\d{3,4})\b/gi);
    if (skuMatches) {
      skuMatches.forEach(m => {
        if (!session.entities.includes(m.toUpperCase())) session.entities.push(m.toUpperCase());
      });
    }

    const poMatches = content.match(/\b(PO-\d{3,6}|SHP-\d{3,6})\b/gi);
    if (poMatches) {
      poMatches.forEach(p => {
        if (!session.entities.includes(p.toUpperCase())) session.entities.push(p.toUpperCase());
      });
    }

    // Extract user preferences / user corrections
    const lower = content.toLowerCase();
    if (role === 'user') {
      if (lower.includes('priority supplier is') || lower.includes('prefer supplier') || lower.includes('favorite carrier')) {
        const prefMatch = content.match(/priority supplier is\s+([A-Za-z0-9\s]+)/i) || content.match(/prefer supplier\s+([A-Za-z0-9\s]+)/i);
        if (prefMatch && prefMatch[1]) {
          session.userPreferences['priority_supplier'] = prefMatch[1].trim();
        }
      }

      if (lower.includes('that is wrong') || lower.includes('is not delayed') || lower.includes('incorrect') || lower.includes('use metric')) {
        if (!session.userCorrections.includes(content)) {
          session.userCorrections.push(content);
        }
      }
    }

    // Summarize active conversation if message length grows
    if (session.messages.length >= 4) {
      const recentUserMsgs = session.messages.filter(m => m.role === 'user').slice(-3).map(m => m.content);
      session.summary = `User inquiring about: ${recentUserMsgs.join(' | ')}`;
    }

    this.persistSessionLocal(session);

    // Sync to Firestore if available
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'conversation_sessions', `${tenantId}_${userId}_${session.conversationId}`), session, { merge: true });
      }
    } catch (e) {}

    return session;
  }

  /**
   * Retrieve active conversation summary context for Gemini prompt assembly
   */
  public getConversationContext(tenantId: string, userId: string, conversationId?: string): string {
    const session = this.getOrCreateSession(tenantId, userId, conversationId);
    if (session.messages.length === 0) return '';

    let ctx = `### RELEVANT CONVERSATION HISTORY & MEMORY\n`;
    if (session.summary) {
      ctx += `- Summary: ${session.summary}\n`;
    }
    if (Object.keys(session.userPreferences).length > 0) {
      ctx += `- User Preferences: ${JSON.stringify(session.userPreferences)}\n`;
    }
    if (session.userCorrections.length > 0) {
      ctx += `- User Corrections: ${session.userCorrections.slice(-3).join('; ')}\n`;
    }
    if (session.entities.length > 0) {
      ctx += `- Referenced Operational Entities: ${session.entities.join(', ')}\n`;
    }

    // Include last 3 exchanges (max 6 messages) for multi-turn continuity
    const recentMessages = session.messages.slice(-6);
    ctx += `Recent Exchanges:\n`;
    for (const msg of recentMessages) {
      ctx += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    }

    return ctx;
  }

  public clear(tenantId?: string, userId?: string): void {
    if (!tenantId) {
      this.sessions.clear();
    } else {
      for (const [key, session] of this.sessions.entries()) {
        if (session.tenantId === tenantId && (!userId || session.userId === userId)) {
          this.sessions.delete(key);
        }
      }
    }
  }
}

export const conversationMemoryService = ConversationMemoryService.getInstance();
