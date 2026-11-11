/**
 * ORION-9 TWO-TIER EDI INTERCHANGE IDEMPOTENCY STORE
 *
 * Tier 1 (L1): Bounded per-isolate FIFO Set (fast edge lookup & local burst deduplication).
 * Tier 2 (L2): Shared durable store across Cloudflare Worker isolates when bound:
 *   1. Cloudflare KV namespace (`env.ORION_EDI_DEDUP`, eventually consistent across POPs)
 *   2. Cloud Firestore REST `createDocument` atomic check (`?documentId=...`, 409 ALREADY_EXISTS)
 *
 * Explicitly reports which durability tier handled a request so callers/audits
 * never misrepresent isolate-local deduplication as cluster-wide persistence.
 */

export type EdiDedupeTier = 'kv_durable' | 'firestore_atomic' | 'isolate_memory';

export interface EdiIdempotencyResult {
  duplicate: boolean;
  tier: EdiDedupeTier;
  dedupeKey: string;
}

const MAX_SEEN_ICNS = 50000;
const seenInterchangeControlNumbers = new Set<string>();

function sanitizeFirestoreDocId(key: string): string {
  return `edi_${key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)}`;
}

export function recordIsolateEdiKey(key: string): void {
  if (seenInterchangeControlNumbers.has(key)) return;
  if (seenInterchangeControlNumbers.size >= MAX_SEEN_ICNS) {
    const oldest = seenInterchangeControlNumbers.values().next().value;
    if (oldest !== undefined) seenInterchangeControlNumbers.delete(oldest);
  }
  seenInterchangeControlNumbers.add(key);
}

export function clearIsolateEdiCache(): void {
  seenInterchangeControlNumbers.clear();
}

/**
 * Atomically checks and records an EDI idempotency key across L1 isolate memory
 * and optional shared L2 storage (Cloudflare KV or Firestore REST in STAGING/LIVE).
 */
export async function checkAndRecordEdiIdempotency(
  dedupeKey: string,
  meta: {
    tenantId: string;
    senderId: string;
    interchangeControlNumber: string;
    transactionType: string;
    activeEnv: 'DEMO' | 'STAGING' | 'LIVE';
  },
  env: {
    ORION_EDI_DEDUP?: {
      get: (k: string) => Promise<string | null>;
      put: (k: string, v: string, opts?: { expirationTtl?: number }) => Promise<void>;
      delete?: (k: string) => Promise<void>;
    };
    FIREBASE_API_KEY?: string;
    FIREBASE_PROJECT_ID?: string;
  } = {}
): Promise<EdiIdempotencyResult> {
  if (seenInterchangeControlNumbers.has(dedupeKey)) {
    return { duplicate: true, tier: 'isolate_memory', dedupeKey };
  }

  // Shared L2 option 1: Cloudflare KV namespace (if bound)
  if (env.ORION_EDI_DEDUP && typeof env.ORION_EDI_DEDUP.get === 'function') {
    try {
      const existing = await env.ORION_EDI_DEDUP.get(dedupeKey);
      if (existing !== null) {
        recordIsolateEdiKey(dedupeKey);
        return { duplicate: true, tier: 'kv_durable', dedupeKey };
      }
      await env.ORION_EDI_DEDUP.put(
        dedupeKey,
        JSON.stringify({
          tenantId: meta.tenantId,
          senderId: meta.senderId,
          icn: meta.interchangeControlNumber,
          transactionType: meta.transactionType,
          recordedAt: new Date().toISOString(),
        }),
        { expirationTtl: 86400 * 30 }
      );
      recordIsolateEdiKey(dedupeKey);
      return { duplicate: false, tier: 'kv_durable', dedupeKey };
    } catch (kvErr) {
      console.warn('[EDI-DEDUP-WARN] KV lookup/write failed, falling back to L1 isolate cache:', kvErr);
    }
  }

  // Shared L2 option 2: Firestore REST atomic createDocument in STAGING/LIVE when configured
  const isDurableEnv = meta.activeEnv === 'STAGING' || meta.activeEnv === 'LIVE';
  if (isDurableEnv && env.FIREBASE_API_KEY && env.FIREBASE_PROJECT_ID) {
    const docId = sanitizeFirestoreDocId(dedupeKey);
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/edi_idempotency?documentId=${encodeURIComponent(docId)}&key=${encodeURIComponent(env.FIREBASE_API_KEY)}`;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 1500) : null;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller?.signal,
          body: JSON.stringify({
            fields: {
              tenantId: { stringValue: meta.tenantId },
              senderId: { stringValue: meta.senderId },
              interchangeControlNumber: { stringValue: meta.interchangeControlNumber },
              transactionType: { stringValue: meta.transactionType },
              recordedAt: { stringValue: new Date().toISOString() },
            },
          }),
        });
        if (res.status === 409) {
          recordIsolateEdiKey(dedupeKey);
          return { duplicate: true, tier: 'firestore_atomic', dedupeKey };
        }
        if (res.ok) {
          recordIsolateEdiKey(dedupeKey);
          return { duplicate: false, tier: 'firestore_atomic', dedupeKey };
        }
        // Unauthenticated REST write rejected by rules or upstream HTTP error: fall back cleanly to L1
        console.warn(`[EDI-DEDUP-WARN] Firestore atomic dedupe returned HTTP ${res.status}; using isolate L1 cache.`);
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (fsErr) {
      console.warn('[EDI-DEDUP-WARN] Firestore REST atomic dedupe unreachable; using isolate L1 cache:', fsErr);
    }
  }

  recordIsolateEdiKey(dedupeKey);
  return { duplicate: false, tier: 'isolate_memory', dedupeKey };
}

/**
 * Rolls back a recorded EDI idempotency key if durable queue handoff fails.
 */
export async function rollbackEdiIdempotencyKey(
  dedupeKey: string,
  env: {
    ORION_EDI_DEDUP?: { delete?: (k: string) => Promise<void> };
  } = {}
): Promise<void> {
  seenInterchangeControlNumbers.delete(dedupeKey);
  if (env.ORION_EDI_DEDUP && typeof env.ORION_EDI_DEDUP.delete === 'function') {
    try {
      await env.ORION_EDI_DEDUP.delete(dedupeKey);
    } catch {}
  }
}
