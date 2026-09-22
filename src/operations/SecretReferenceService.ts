/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * SecretReferenceService: Provider-Agnostic Secret Abstraction
 * 
 * Guarantees zero plaintext secret exposure in client bundles, UI, or unredacted logs.
 */

import { SecretReference, SecretProvider } from './types';

export class SecretReferenceService {
  private static instance: SecretReferenceService;
  private references: Map<string, SecretReference> = new Map();
  // Server-side / test mock storage (never serialized to client)
  private resolvedStore: Map<string, string> = new Map();

  private constructor() {
    this.seedDefaultSecretReferences();
  }

  public static getInstance(): SecretReferenceService {
    if (!SecretReferenceService.instance) {
      SecretReferenceService.instance = new SecretReferenceService();
    }
    return SecretReferenceService.instance;
  }

  private seedDefaultSecretReferences(): void {
    const defaultRefs: SecretReference[] = [
      {
        secretId: 'sec-gemini-api-key',
        provider: 'GOOGLE_SECRET_MANAGER',
        referenceKey: 'projects/orion-9/secrets/GEMINI_API_KEY/versions/latest',
        version: 'latest',
        isRedacted: true,
        maskedValue: '********-****-****-****-************',
        lastRotatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        secretId: 'sec-firebase-service-account',
        provider: 'GOOGLE_SECRET_MANAGER',
        referenceKey: 'projects/orion-9/secrets/FIREBASE_ADMIN_CREDENTIALS/versions/latest',
        version: 'latest',
        isRedacted: true,
        maskedValue: '************************************',
        lastRotatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        secretId: 'sec-erp-connector-token',
        provider: 'HASHICORP_VAULT',
        referenceKey: 'secret/data/orion/erp/integration_oauth',
        version: 'v2',
        isRedacted: true,
        maskedValue: '********************************',
        lastRotatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        secretId: 'sec-cloudflare-turnstile-secret',
        provider: 'CLOUDFLARE_SECRETS',
        referenceKey: 'CF_TURNSTILE_SECRET_KEY',
        isRedacted: true,
        maskedValue: '********************************',
        lastRotatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    for (const ref of defaultRefs) {
      this.references.set(ref.secretId, ref);
      // Store dummy mock for local testing
      this.resolvedStore.set(ref.secretId, `resolved-mock-for-${ref.secretId}`);
    }
  }

  /**
   * Retrieves a client-safe, completely redacted SecretReference.
   * Under NO circumstances returns plaintext values.
   */
  public getSecretReference(secretId: string): SecretReference | undefined {
    const ref = this.references.get(secretId);
    if (!ref) return undefined;
    return {
      ...ref,
      isRedacted: true,
      maskedValue: '********',
    };
  }

  public getAllSecretReferences(): SecretReference[] {
    return Array.from(this.references.values()).map(ref => ({
      ...ref,
      isRedacted: true,
      maskedValue: '********',
    }));
  }

  public registerSecretReference(
    secretId: string,
    provider: SecretProvider,
    referenceKey: string,
    version?: string
  ): SecretReference {
    const newRef: SecretReference = {
      secretId,
      provider,
      referenceKey,
      version: version || 'latest',
      isRedacted: true,
      maskedValue: '********',
      lastRotatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.references.set(secretId, newRef);
    return newRef;
  }

  /**
   * Server-side secure resolution. In browser client, returns null to enforce safety.
   */
  public resolveSecretSecurely(secretId: string): string | null {
    // If in browser window environment, strictly forbid resolution
    if (typeof window !== 'undefined') {
      console.warn(`[SECURITY] Attempted plaintext secret resolution on client side for ${secretId}. Access Denied.`);
      return null;
    }
    return this.resolvedStore.get(secretId) || null;
  }
}

export const secretReferenceService = SecretReferenceService.getInstance();
