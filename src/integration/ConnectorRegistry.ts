/**
 * ORION-9 CONNECTOR REGISTRY
 * Wave 3.2 Enterprise Connector Registry Architecture
 *
 * Manages connector metadata, runtime instantiation (SAP, ORACLE, EDI, REST, FILE),
 * tenant isolation, health monitoring, and credential references. Does not store plain-text secrets in frontend state.
 */

import {
  ConnectorRecord,
  ConnectorType,
  ConnectorHealthStatus,
  ConnectorEnvironment
} from './types';
import { IConnectorRuntime } from './ConnectorRuntime';
import { SAPConnector } from './adapters/SAPConnector';
import { OracleConnector } from './adapters/OracleConnector';
import { EDIConnector } from './adapters/EDIConnector';
import { FileConnector } from './adapters/FileConnector';
import { RESTConnector } from './adapters/RESTConnector';
import { credentialVaultService } from './CredentialVaultService';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { db, loadData, saveData } from '../data/db';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, ConnectorRecord> = new Map();
  private runtimes: Map<string, IConnectorRuntime> = new Map();

  private constructor() {
    this.seedDefaultConnectors();
    this.hydrate();
  }

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  private seedDefaultConnectors(): void {
    const defaultTenant = 'org-tenant-a';
    const now = new Date().toISOString();

    const seeds: ConnectorRecord[] = [
      {
        connectorId: 'conn-sap-s4hana-01',
        tenantId: defaultTenant,
        type: 'SAP',
        name: 'SAP S/4HANA Enterprise ERP Gateway',
        version: '2.4.0',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        configuration: {
          clientNumber: '100',
          systemId: 'PRD',
          authMethod: 'OAUTH2_MUTUAL_TLS',
        },
        capabilities: {
          supportsInbound: true,
          supportsOutbound: true,
          supportsRealtime: true,
          supportsBatch: true,
          specificCapabilities: ['SAP_CAPABILITY_PURCHASE_ORDER', 'SAP_CAPABILITY_SUPPLIER'],
        },
        health: {
          lastSuccessfulRequest: now,
          failureCount: 0,
          latencyMs: 42,
          recordsProcessed: 148500,
        },
        endpointReference: 'https://sap.enterprise.orion9.internal/sap/bc/srt/rfc',
        credentialReference: `secret://tenant/${defaultTenant}/connector/conn-sap-s4hana-01`,
        connectivityClassification: 'BOUNDARY',
        organizationId: 'ORG-MAIN',
        region: 'us-east-1',
        provider: 'SAP SE',
        lastHealthCheck: now,
        lastSuccessfulSync: now,
        createdAt: '2026-01-15T08:00:00Z',
        updatedAt: now,
      },
      {
        connectorId: 'conn-oracle-otm-01',
        tenantId: defaultTenant,
        type: 'ORACLE',
        name: 'Oracle Transportation Management (OTM)',
        version: '1.9.1',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        connectivityClassification: 'BOUNDARY',
        organizationId: 'ORG-MAIN',
        region: 'us-east-1',
        provider: 'Oracle Corp',
        configuration: {
          authMethod: 'OAUTH2_BEARER',
        },
        capabilities: {
          supportsInbound: true,
          supportsOutbound: true,
          supportsRealtime: true,
          supportsBatch: false,
          specificCapabilities: ['ORACLE_CAPABILITY_SHIPMENT', 'ORACLE_CAPABILITY_PURCHASE_ORDER'],
        },
        health: {
          lastSuccessfulRequest: now,
          failureCount: 0,
          latencyMs: 85,
          recordsProcessed: 89400,
        },
        endpointReference: 'https://otm.oraclecloud.com/gc3/glog.web.api',
        credentialReference: `secret://tenant/${defaultTenant}/connector/conn-oracle-otm-01`,
        lastHealthCheck: now,
        lastSuccessfulSync: now,
        createdAt: '2026-02-01T09:30:00Z',
        updatedAt: now,
      },
      {
        connectorId: 'conn-edi-x12-01',
        tenantId: defaultTenant,
        type: 'EDI',
        name: 'ANSI X12 B2B EDI Fabric (850, 856, 810)',
        version: '4.0.1',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        connectivityClassification: 'BOUNDARY',
        organizationId: 'ORG-MAIN',
        region: 'us-east-1',
        provider: 'ANSI X12 Standard',
        configuration: {
          standard: 'ANSI_X12_004010',
          isaQualifier: 'ZZ',
          authMethod: 'SFTP_SSH_KEY',
        },
        capabilities: {
          supportsInbound: true,
          supportsOutbound: true,
          supportsRealtime: false,
          supportsBatch: true,
        },
        health: {
          lastSuccessfulRequest: now,
          failureCount: 0,
          latencyMs: 120,
          recordsProcessed: 31200,
        },
        endpointReference: 'sftp://edi.partner.orion9.internal/inbound',
        credentialReference: `secret://tenant/${defaultTenant}/connector/conn-edi-x12-01`,
        lastHealthCheck: now,
        lastSuccessfulSync: now,
        createdAt: '2026-02-15T11:00:00Z',
        updatedAt: now,
      },
      {
        connectorId: 'conn-rest-webhook-01',
        tenantId: defaultTenant,
        type: 'REST',
        name: 'Enterprise Logistics Webhook REST Gateway',
        version: '1.0.0',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        connectivityClassification: 'BOUNDARY',
        organizationId: 'ORG-MAIN',
        region: 'us-east-1',
        provider: 'Orion Gateway',
        configuration: {
          authMethod: 'HMAC_SHA256_SIGNATURE',
        },
        capabilities: {
          supportsInbound: true,
          supportsOutbound: true,
          supportsRealtime: true,
          supportsBatch: false,
        },
        health: {
          lastSuccessfulRequest: now,
          failureCount: 0,
          latencyMs: 18,
          recordsProcessed: 95400,
        },
        endpointReference: 'https://api.logistics.orion9.internal/v2',
        credentialReference: `secret://tenant/${defaultTenant}/connector/conn-rest-webhook-01`,
        lastHealthCheck: now,
        lastSuccessfulSync: now,
        createdAt: '2026-03-01T14:00:00Z',
        updatedAt: now,
      },
      {
        connectorId: 'conn-file-sftp-01',
        tenantId: defaultTenant,
        type: 'FILE',
        name: 'Automated CSV/XLSX Bulk File Ingestion',
        version: '1.2.0',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        connectivityClassification: 'BOUNDARY',
        organizationId: 'ORG-MAIN',
        region: 'us-east-1',
        provider: 'Generic SFTP',
        configuration: {
          protocol: 'SFTP',
          authMethod: 'PUBLIC_KEY_AUTH',
        },
        capabilities: {
          supportsInbound: true,
          supportsOutbound: false,
          supportsRealtime: false,
          supportsBatch: true,
        },
        health: {
          lastSuccessfulRequest: now,
          failureCount: 0,
          latencyMs: 240,
          recordsProcessed: 62000,
        },
        endpointReference: 'sftp.partner.orion9.internal/imports',
        credentialReference: `secret://tenant/${defaultTenant}/connector/conn-file-sftp-01`,
        lastHealthCheck: now,
        lastSuccessfulSync: now,
        createdAt: '2026-03-10T10:15:00Z',
        updatedAt: now,
      }
    ];

    seeds.forEach(c => {
      this.connectors.set(c.connectorId, c);
      this.instantiateRuntime(c);
    });
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<ConnectorRecord>(db.connectors);
        if (stored && stored.length > 0) {
          stored.forEach(c => {
            this.connectors.set(c.connectorId, c);
            this.instantiateRuntime(c);
          });
        }
      }
    } catch (e) {
      console.warn('[ConnectorRegistry] Hydration error:', e);
    }
  }

  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await saveData(db.connectors, Array.from(this.connectors.values()));
    } catch (e) {
      console.warn('[ConnectorRegistry] Persistence error:', e);
    }
  }

  private instantiateRuntime(record: ConnectorRecord): IConnectorRuntime {
    let runtime: IConnectorRuntime;
    switch (record.type) {
      case 'SAP':
        runtime = new SAPConnector(record);
        break;
      case 'ORACLE':
        runtime = new OracleConnector(record);
        break;
      case 'EDI':
        runtime = new EDIConnector(record);
        break;
      case 'FILE':
        runtime = new FileConnector(record);
        break;
      case 'REST':
      default:
        runtime = new RESTConnector(record);
        break;
    }
    this.runtimes.set(record.connectorId, runtime);
    return runtime;
  }

  /**
   * Retrieves active runtime instance for a connector with tenant check
   */
  public getRuntimeInstance(connectorId: string, tenantId: string): IConnectorRuntime | undefined {
    const record = this.getConnector(connectorId, tenantId);
    let runtime = this.runtimes.get(connectorId);
    if (!runtime) {
      runtime = this.instantiateRuntime(record);
    }
    return runtime;
  }

  /**
   * Registers a new integration connector for a specific tenant
   */
  public registerConnector(params: {
    tenantId: string;
    organizationId?: string;
    region?: string;
    type: ConnectorType;
    name: string;
    provider?: string;
    version?: string;
    status?: ConnectorRecord['status'];
    environment?: ConnectorEnvironment;
    connectivityClassification?: ConnectorRecord['connectivityClassification'];
    endpointReference?: string;
    configuration: Record<string, any>;
    capabilities?: Partial<ConnectorRecord['capabilities']>;
    actor?: string;
  }): ConnectorRecord {
    if (!params.tenantId) throw new Error('Tenant ID is required for connector registration.');

    // Sanitize configuration to prevent credentials storage
    const sanitizedConfig = { ...params.configuration };
    delete sanitizedConfig.password;
    delete sanitizedConfig.secret;
    delete sanitizedConfig.apiKey;
    delete sanitizedConfig.token;

    const connectorId = `conn-${params.type.toLowerCase()}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const actor = params.actor || 'System Admin';
    const env = params.environment || 'SANDBOX';
    const credRef = credentialVaultService.generateCredentialReference(params.tenantId, connectorId);

    const connector: ConnectorRecord = {
      connectorId,
      tenantId: params.tenantId,
      organizationId: params.organizationId || 'ORG-MAIN',
      region: params.region || 'us-east-1',
      provider: params.provider || 'Generic Provider',
      type: params.type,
      name: params.name,
      version: params.version || '1.0.0',
      status: params.status || (env === 'LIVE' ? 'UNCONFIGURED' : 'CONNECTED'),
      environment: env,
      connectivityClassification: params.connectivityClassification || (env === 'LIVE' ? 'UNVERIFIED' : 'BOUNDARY'),
      configuration: sanitizedConfig,
      capabilities: {
        supportsInbound: params.capabilities?.supportsInbound ?? true,
        supportsOutbound: params.capabilities?.supportsOutbound ?? true,
        supportsRealtime: params.capabilities?.supportsRealtime ?? true,
        supportsBatch: params.capabilities?.supportsBatch ?? true,
      },
      health: {
        lastSuccessfulRequest: now,
        failureCount: 0,
        latencyMs: 25,
        recordsProcessed: 0,
      },
      endpointReference: params.endpointReference || (env === 'LIVE' ? '' : `sandbox://${params.type.toLowerCase()}`),
      credentialReference: credRef,
      lastHealthCheck: now,
      createdAt: now,
      updatedAt: now,
    };

    this.connectors.set(connectorId, connector);
    this.instantiateRuntime(connector);
    this.persist();

    kernelAuditEngine.record({
      action: 'REGISTER_INTEGRATION_CONNECTOR',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'INTERNAL',
      details: { tenantId: params.tenantId, type: params.type, name: params.name, environment: env }
    });

    kernelEventBus.publish('orion:connector:registered', {
      connectorId,
      tenantId: params.tenantId,
      type: params.type,
      name: params.name
    }, {
      actor: { id: actor, type: 'USER', name: actor }
    });

    return connector;
  }

  /**
   * Governed lifecycle transition: Configures a Connector
   */
  public configureConnector(connectorId: string, tenantId: string, configuration: Record<string, any>, actor: string): ConnectorRecord {
    const connector = this.getConnector(connectorId, tenantId);
    const sanitized = { ...configuration };
    delete sanitized.password;
    delete sanitized.secret;
    delete sanitized.apiKey;
    delete sanitized.token;

    connector.configuration = { ...connector.configuration, ...sanitized };
    connector.status = 'CONFIGURED';
    connector.updatedAt = new Date().toISOString();
    this.persist();

    kernelAuditEngine.record({
      action: 'CONFIGURE_INTEGRATION_CONNECTOR',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'INTERNAL',
      details: { tenantId }
    });

    return connector;
  }

  /**
   * Governed lifecycle transition: Validates Connector
   */
  public validateConnector(connectorId: string, tenantId: string, actor: string): ConnectorRecord {
    const connector = this.getConnector(connectorId, tenantId);
    connector.status = 'VALIDATING';
    connector.updatedAt = new Date().toISOString();
    this.persist();

    kernelAuditEngine.record({
      action: 'VALIDATE_INTEGRATION_CONNECTOR',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'INTERNAL',
      details: { tenantId }
    });

    return connector;
  }

  /**
   * Governed lifecycle transition: Activates Connector under Kernel authorization
   */
  public activateConnector(connectorId: string, tenantId: string, actor: { id: string; isAi?: boolean }): ConnectorRecord {
    if (actor.isAi) {
      throw new Error(`[Kernel Governance Violation] AI agents are prohibited from self-activating connectors directly.`);
    }

    const connector = this.getConnector(connectorId, tenantId);
    connector.status = 'ACTIVE';
    connector.updatedAt = new Date().toISOString();
    this.persist();

    kernelAuditEngine.record({
      action: 'ACTIVATE_INTEGRATION_CONNECTOR',
      actor: { id: actor.id, type: 'USER', name: actor.id },
      entityId: connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'INTERNAL',
      details: { tenantId, status: connector.status }
    });

    kernelEventBus.publish('orion:connector:activated', {
      connectorId,
      tenantId,
      status: connector.status
    }, {
      actor: { id: actor.id, type: 'USER', name: actor.id }
    });

    return connector;
  }

  /**
   * Governed lifecycle transition: Quarantine Connector
   */
  public quarantineConnector(connectorId: string, tenantId: string, reason: string, actor: string): ConnectorRecord {
    const connector = this.getConnector(connectorId, tenantId);
    connector.status = 'QUARANTINED';
    connector.updatedAt = new Date().toISOString();
    this.persist();

    kernelAuditEngine.record({
      action: 'QUARANTINE_INTEGRATION_CONNECTOR',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'RESTRICTED',
      details: { tenantId, reason }
    });

    return connector;
  }

  /**
   * Updates health telemetry and status for a connector
   */
  public updateHealth(
    connectorId: string,
    tenantId: string,
    update: {
      status?: ConnectorHealthStatus;
      success?: boolean;
      latencyMs?: number;
      recordsProcessedDelta?: number;
      error?: string;
    }
  ): ConnectorRecord {
    const connector = this.connectors.get(connectorId);
    if (!connector) throw new Error(`Connector ${connectorId} not found.`);
    if (connector.tenantId !== tenantId) {
      throw new Error(`Tenant '${tenantId}' is not authorized to access connector '${connectorId}'.`);
    }

    const now = new Date().toISOString();

    if (update.status) {
      connector.status = update.status;
    }

    if (update.success === true) {
      connector.health.lastSuccessfulRequest = now;
      connector.lastSuccessfulSync = now;
      if (connector.status === 'ERROR' || connector.status === 'DEGRADED') {
        connector.status = 'CONNECTED';
      }
    } else if (update.success === false) {
      connector.health.lastFailure = now;
      connector.lastFailure = now;
      connector.health.failureCount += 1;
      if (connector.health.failureCount >= 3) {
        connector.status = update.error?.includes('AUTH') ? 'AUTH_FAILED' : 'ERROR';
      } else {
        connector.status = 'DEGRADED';
      }
    }

    if (update.latencyMs !== undefined) {
      connector.health.latencyMs = update.latencyMs;
    }

    if (update.recordsProcessedDelta) {
      connector.health.recordsProcessed += update.recordsProcessedDelta;
    }

    connector.updatedAt = now;
    this.persist();

    return connector;
  }

  /**
   * Retrieves a single connector enforcing tenant boundary
   */
  public getConnector(connectorId: string, tenantId: string): ConnectorRecord {
    const connector = this.connectors.get(connectorId);
    if (!connector) throw new Error(`Connector ${connectorId} not found.`);
    if (connector.tenantId !== tenantId) {
      throw new Error(`Tenant '${tenantId}' is not authorized to access connector '${connectorId}'.`);
    }
    return { ...connector };
  }

  /**
   * Lists all connectors owned by a specific tenant
   */
  public listConnectors(tenantId: string): ConnectorRecord[] {
    if (!tenantId) return [];
    return Array.from(this.connectors.values()).filter(c => c.tenantId === tenantId);
  }

  /**
   * Deletes a connector
   */
  public deleteConnector(connectorId: string, tenantId: string, actor: string): void {
    const connector = this.getConnector(connectorId, tenantId);
    this.connectors.delete(connectorId);
    this.runtimes.delete(connectorId);
    this.persist();

    kernelAuditEngine.record({
      action: 'DELETE_INTEGRATION_CONNECTOR',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: connectorId,
      entityType: 'INTEGRATION_CONNECTOR',
      classification: 'INTERNAL',
      details: { tenantId, name: connector.name }
    });
  }
}

export const connectorRegistry = ConnectorRegistry.getInstance();
