/**
 * ORION-9 CREDENTIAL VAULT SERVICE
 * Wave 3.2 Security Architecture
 *
 * Provides a fail-closed, server-authoritative secret resolution abstraction.
 * Frontend client state, IndexedDB, and Firestore documents NEVER contain plain-text
 * credentials. They only hold safe references matching format:
 * "secret://tenant/<tenantId>/connector/<connectorId>"
 */

export interface ResolvedCredentials {
  authType: 'OAUTH2' | 'BASIC' | 'API_KEY' | 'SSH_KEY' | 'CERTIFICATE';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  privateKey?: string;
  bearerToken?: string;
  customHeaders?: Record<string, string>;
}

export class CredentialVaultService {
  private static instance: CredentialVaultService;
  // In-memory backend secret store (isolated from browser storage)
  private vaultStore: Map<string, ResolvedCredentials> = new Map();

  private constructor() {
    this.seedSandboxSecrets();
  }

  public static getInstance(): CredentialVaultService {
    if (!CredentialVaultService.instance) {
      CredentialVaultService.instance = new CredentialVaultService();
    }
    return CredentialVaultService.instance;
  }

  private seedSandboxSecrets(): void {
    const sandboxTenant = 'org-tenant-a';
    this.vaultStore.set(`secret://tenant/${sandboxTenant}/connector/conn-sap-s4hana-01`, {
      authType: 'OAUTH2',
      clientId: 'sap-client-id-sandbox-789',
      clientSecret: 'sap-client-secret-sandbox-456',
      bearerToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sandbox.sap.token'
    });

    this.vaultStore.set(`secret://tenant/${sandboxTenant}/connector/conn-oracle-otm-01`, {
      authType: 'OAUTH2',
      clientId: 'oracle-client-id-sandbox-123',
      clientSecret: 'oracle-client-secret-sandbox-999',
      bearerToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.sandbox.oracle.token'
    });

    this.vaultStore.set(`secret://tenant/${sandboxTenant}/connector/conn-edi-x12-01`, {
      authType: 'SSH_KEY',
      username: 'edi_sftp_user',
      privateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\nSANDBOX_KEY\n-----END OPENSSH PRIVATE KEY-----'
    });

    this.vaultStore.set(`secret://tenant/${sandboxTenant}/connector/conn-rest-webhook-01`, {
      authType: 'API_KEY',
      apiKey: 'orion9_rest_sandbox_key_sec_8910',
      customHeaders: { 'X-Orion-Webhook-Secret': 'whsec_sandbox_signature' }
    });

    this.vaultStore.set(`secret://tenant/${sandboxTenant}/connector/conn-file-sftp-01`, {
      authType: 'BASIC',
      username: 'file_importer',
      password: 'sandbox_file_pass_123'
    });
  }

  /**
   * Formats a safe credential reference URI for a tenant and connector
   */
  public generateCredentialReference(tenantId: string, connectorId: string): string {
    if (!tenantId || !connectorId) {
      throw new Error('[CredentialVault] Tenant ID and Connector ID are required to generate reference.');
    }
    return `secret://tenant/${tenantId}/connector/${connectorId}`;
  }

  /**
   * Server-side secret resolution. Fail-closed if reference invalid or tenant mismatch.
   */
  public resolveCredentials(credentialRef: string, requestingTenantId: string): ResolvedCredentials {
    if (!credentialRef || !credentialRef.startsWith('secret://tenant/')) {
      throw new Error(`[CredentialVault] Invalid credential reference format: '${credentialRef}'`);
    }

    // Validate tenant isolation from reference URI: secret://tenant/<tenantId>/connector/<connectorId>
    const parts = credentialRef.split('/');
    const referenceTenantId = parts[3];

    if (referenceTenantId !== requestingTenantId) {
      throw new Error(`[CredentialVault] SECURITY DENIAL: Tenant '${requestingTenantId}' requested credentials owned by '${referenceTenantId}'.`);
    }

    const secrets = this.vaultStore.get(credentialRef);
    if (!secrets) {
      // Fail closed
      throw new Error(`[CredentialVault] Secrets not found for reference '${credentialRef}'.`);
    }

    return { ...secrets };
  }

  /**
   * Stores secret in backend memory vault without exposing it to client layers
   */
  public storeCredentials(credentialRef: string, tenantId: string, credentials: ResolvedCredentials): void {
    if (!credentialRef.includes(`/tenant/${tenantId}/`)) {
      throw new Error(`[CredentialVault] Tenant mismatch between reference '${credentialRef}' and tenant '${tenantId}'.`);
    }
    this.vaultStore.set(credentialRef, credentials);
  }

  /**
   * Deletes credentials from vault
   */
  public deleteCredentials(credentialRef: string, requestingTenantId: string): void {
    this.resolveCredentials(credentialRef, requestingTenantId); // validates tenant isolation
    this.vaultStore.delete(credentialRef);
  }
}

export const credentialVaultService = CredentialVaultService.getInstance();
