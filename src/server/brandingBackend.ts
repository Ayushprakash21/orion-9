/**
 * ORION-9 DURABLE BRANDING & CREATOR IDENTITY BACKEND SERVICE
 * 
 * Authoritative single source of truth for global branding and creator identity.
 * Persists directly to Cloud Firestore REST API (project: orion9-dev-db-2026).
 * 
 * Shared between Cloudflare Worker (src/worker.ts) and Node server (server.ts).
 * Never uses process memory, in-memory caches, /tmp, or local files as authoritative storage.
 */

import { BrandingConfig } from '../types/auth';
import { defaultBranding, normalizeBranding } from '../repositories/BrandingRepository';

export const FIREBASE_PROJECT_ID = 'orion9-dev-db-2026';

export const BRANDING_COLLECTION = 'system_configs';
export const BRANDING_DOC_ID = 'branding';
export const BRANDING_ASSET_COLLECTION = 'system_branding_assets';

/**
 * Sanitizes strings, URLs, and error messages to ensure API keys and credentials
 * are never leaked in logs, error payloads, or traces.
 */
export function sanitizeErrorMessage(message: unknown): string {
  const str = typeof message === 'string' ? message : (message as any)?.message || String(message || '');
  return str
    .replace(/[?&]key=[^&\s"']+/gi, '?key=[REDACTED]')
    .replace(/AIzaSy[0-9A-Za-z_-]{20,60}/g, 'AIzaSy[REDACTED]');
}

/**
 * Resolves the active Firebase project ID across Cloudflare Worker env and Node process.env.
 */
export function resolveProjectId(explicitProjectId?: string): string {
  if (explicitProjectId && explicitProjectId.trim()) {
    return explicitProjectId.trim();
  }
  if (typeof process !== 'undefined') {
    if (process.env?.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID.trim()) {
      return process.env.FIREBASE_PROJECT_ID.trim();
    }
    if (process.env?.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_PROJECT_ID.trim()) {
      return process.env.VITE_FIREBASE_PROJECT_ID.trim();
    }
  }
  return FIREBASE_PROJECT_ID;
}

/**
 * Resolves the active Firebase API key across Cloudflare Worker env and Node process.env.
 * Strict fail-closed policy: throws if no key is configured.
 */
export function resolveApiKey(explicitApiKey?: string): string {
  if (explicitApiKey && explicitApiKey.trim()) {
    return explicitApiKey.trim();
  }
  if (typeof process !== 'undefined') {
    if (process.env?.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY.trim()) {
      return process.env.FIREBASE_API_KEY.trim();
    }
    if (process.env?.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_API_KEY.trim()) {
      return process.env.VITE_FIREBASE_API_KEY.trim();
    }
  }
  throw new Error('Firebase API key is not configured. Server-side FIREBASE_API_KEY binding required.');
}

/**
 * Converts a plain JavaScript value to Firestore REST API field format.
 */
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Converts a plain JavaScript object to Firestore REST API fields structure.
 */
export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

/**
 * Converts Firestore REST API fields back to a plain JavaScript object.
 */
export function fromFirestoreFields(fields: Record<string, any> | undefined): Record<string, any> {
  if (!fields) return {};
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if ('stringValue' in v) {
      res[k] = v.stringValue;
    } else if ('booleanValue' in v) {
      res[k] = v.booleanValue;
    } else if ('integerValue' in v) {
      res[k] = parseInt(v.integerValue, 10);
    } else if ('doubleValue' in v) {
      res[k] = v.doubleValue;
    } else if ('nullValue' in v) {
      res[k] = null;
    } else if ('mapValue' in v) {
      res[k] = fromFirestoreFields(v.mapValue.fields);
    } else if ('arrayValue' in v) {
      res[k] = (v.arrayValue.values || []).map((val: any) => {
        if ('stringValue' in val) return val.stringValue;
        if ('booleanValue' in val) return val.booleanValue;
        if ('integerValue' in val) return parseInt(val.integerValue, 10);
        if ('doubleValue' in val) return val.doubleValue;
        if ('nullValue' in val) return null;
        return val;
      });
    }
  }
  return res;
}

/**
 * Builds the URL for a Firestore document in the REST API.
 */
function getDocumentUrl(collection: string, docId: string, apiKey: string, projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?key=${apiKey}`;
}

/**
 * Retrieves the authoritative branding record directly from Cloud Firestore.
 * Returns default branding if no custom record has been saved yet.
 */
export async function getDurableBranding(
  explicitApiKey?: string,
  explicitProjectId?: string
): Promise<BrandingConfig> {
  const projectId = resolveProjectId(explicitProjectId);
  const apiKey = resolveApiKey(explicitApiKey);
  const url = getDocumentUrl(BRANDING_COLLECTION, BRANDING_DOC_ID, apiKey, projectId);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
      // Document does not exist yet; return canonical defaults
      return { ...defaultBranding };
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloud Firestore read failed (${res.status}): ${sanitizeErrorMessage(errText)}`);
    }

    const doc = await res.json();
    const rawData = fromFirestoreFields(doc.fields);
    return normalizeBranding({ ...defaultBranding, ...rawData });
  } catch (error: any) {
    const safeMsg = sanitizeErrorMessage(error?.message || error);
    console.error('[BrandingBackend] Failed to fetch branding from Cloud Firestore:', safeMsg);
    throw new Error(safeMsg);
  }
}

/**
 * Persists an image asset (such as creator avatar or custom logo) to durable storage in Cloud Firestore
 * under the system_branding_assets collection. Returns a stable HTTPS reference URL.
 */
export async function saveDurableBrandingAsset(
  assetId: string,
  dataUrl: string,
  explicitApiKey?: string,
  explicitProjectId?: string
): Promise<string> {
  const projectId = resolveProjectId(explicitProjectId);
  const apiKey = resolveApiKey(explicitApiKey);

  // Validate data URL format
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Invalid image asset: expected data:image/* data URL format.');
  }

  // Check document size limit (stay safely below 1 MiB Firestore document limit)
  if (dataUrl.length > 900 * 1024) {
    throw new Error('Image asset exceeds maximum size limit (800KB). Please use a cropped or compressed image.');
  }

  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const mimeMatch = header.match(/:(.*?);/) || header.match(/:(.*?)$/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

  const assetPayload = {
    assetId,
    mimeType,
    dataUrl,
    sizeBytes: Math.round((dataUrl.length * 3) / 4),
    updatedAt: new Date().toISOString(),
  };

  const url = getDocumentUrl(BRANDING_ASSET_COLLECTION, assetId, apiKey, projectId);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fields: toFirestoreFields(assetPayload),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save image asset to Cloud Firestore (${res.status}): ${sanitizeErrorMessage(errText)}`);
  }

  // Return a stable versioned URL for the asset
  return `/api/branding/assets/${assetId}?v=${Date.now()}`;
}

/**
 * Removes a durable image asset from Cloud Firestore.
 */
export async function deleteDurableBrandingAsset(
  assetId: string,
  explicitApiKey?: string,
  explicitProjectId?: string
): Promise<void> {
  const projectId = resolveProjectId(explicitProjectId);
  const apiKey = resolveApiKey(explicitApiKey);
  const url = getDocumentUrl(BRANDING_ASSET_COLLECTION, assetId, apiKey, projectId);

  try {
    await fetch(url, { method: 'DELETE' });
  } catch (err: any) {
    console.warn(`[BrandingBackend] Notice: error removing asset ${assetId}:`, sanitizeErrorMessage(err?.message || err));
  }
}

/**
 * Retrieves a durable image asset from Cloud Firestore for binary image serving.
 */
export async function getDurableBrandingAsset(
  assetId: string,
  explicitApiKey?: string,
  explicitProjectId?: string
): Promise<{ dataUrl: string; mimeType: string; bytes: Uint8Array } | null> {
  const projectId = resolveProjectId(explicitProjectId);
  const apiKey = resolveApiKey(explicitApiKey);
  const url = getDocumentUrl(BRANDING_ASSET_COLLECTION, assetId, apiKey, projectId);

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404 || !res.ok) {
    return null;
  }

  const doc = await res.json();
  const rawData = fromFirestoreFields(doc.fields);
  const dataUrl = rawData.dataUrl as string;
  const mimeType = (rawData.mimeType as string) || 'image/png';

  if (!dataUrl || !dataUrl.includes(',')) {
    return null;
  }

  const base64Data = dataUrl.split(',')[1];
  const binaryString = typeof atob !== 'undefined'
    ? atob(base64Data)
    : Buffer.from(base64Data, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return { dataUrl, mimeType, bytes };
}

/**
 * Persists branding configuration and creator identity to Cloud Firestore.
 * Handles photo/logo assets durably, preventing base64 bloat in the main document.
 */
export async function saveDurableBranding(
  data: Partial<BrandingConfig>,
  explicitApiKey?: string,
  explicitProjectId?: string
): Promise<BrandingConfig> {
  const projectId = resolveProjectId(explicitProjectId);
  const apiKey = resolveApiKey(explicitApiKey);

  // 1. Fetch existing authoritative document to merge safely
  let existing: BrandingConfig;
  try {
    existing = await getDurableBranding(apiKey, projectId);
  } catch {
    existing = { ...defaultBranding };
  }

  // 2. Handle Creator Profile Photo asset persistence
  let resolvedCreatorPhotoUrl: string | null = existing.creatorPhotoUrl || null;
  if (data.creatorPhotoUrl !== undefined) {
    if (data.creatorPhotoUrl === null || data.creatorPhotoUrl === '') {
      // User removed the creator photo
      resolvedCreatorPhotoUrl = null;
      await deleteDurableBrandingAsset('creator_photo', apiKey, projectId);
    } else if (data.creatorPhotoUrl.startsWith('data:image/')) {
      // New base64 photo uploaded/cropped; store durably in asset collection
      resolvedCreatorPhotoUrl = await saveDurableBrandingAsset(
        'creator_photo',
        data.creatorPhotoUrl,
        apiKey,
        projectId
      );
    } else {
      // Existing stable URL (e.g. /api/branding/assets/creator_photo?v=... or https://...)
      resolvedCreatorPhotoUrl = data.creatorPhotoUrl;
    }
  }

  // 3. Handle Logo asset persistence
  let resolvedLogoUrl: string | null = existing.logoUrl || existing.logo || null;
  const rawLogo = data.logoUrl !== undefined ? data.logoUrl : data.logo;
  if (rawLogo !== undefined) {
    if (rawLogo === null || rawLogo === '') {
      // User removed the logo
      resolvedLogoUrl = null;
      await deleteDurableBrandingAsset('logo', apiKey, projectId);
    } else if (rawLogo.startsWith('data:image/')) {
      // New base64 logo uploaded; store durably in asset collection
      resolvedLogoUrl = await saveDurableBrandingAsset(
        'logo',
        rawLogo,
        apiKey,
        projectId
      );
    } else {
      resolvedLogoUrl = rawLogo;
    }
  }

  // 4. Assemble merged clean metadata payload
  const updated = normalizeBranding({
    ...existing,
    ...data,
    creatorPhotoUrl: resolvedCreatorPhotoUrl,
    logoUrl: resolvedLogoUrl,
    logo: resolvedLogoUrl,
    updatedAt: new Date().toISOString(),
  });

  // 5. Save metadata to Cloud Firestore system_configs/branding
  const url = getDocumentUrl(BRANDING_COLLECTION, BRANDING_DOC_ID, apiKey, projectId);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fields: toFirestoreFields(updated),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`authoritative database write failed (${res.status}): ${sanitizeErrorMessage(errText)}`);
  }

  return updated;
}

/**
 * Resets branding and creator identity in Cloud Firestore back to canonical defaults.
 */
export async function resetDurableBranding(
  explicitApiKey?: string,
  explicitProjectId?: string
): Promise<BrandingConfig> {
  const projectId = resolveProjectId(explicitProjectId);
  const apiKey = resolveApiKey(explicitApiKey);

  // 1. Clean up durable assets
  await deleteDurableBrandingAsset('creator_photo', apiKey, projectId);
  await deleteDurableBrandingAsset('logo', apiKey, projectId);

  // 2. Overwrite branding doc with canonical defaults
  const resetConfig = {
    ...defaultBranding,
    updatedAt: new Date().toISOString(),
  };

  const url = getDocumentUrl(BRANDING_COLLECTION, BRANDING_DOC_ID, apiKey, projectId);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fields: toFirestoreFields(resetConfig),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to reset branding in Cloud Firestore (${res.status}): ${sanitizeErrorMessage(errText)}`);
  }

  return { ...defaultBranding };
}
