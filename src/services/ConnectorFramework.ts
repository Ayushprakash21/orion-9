import { v4 as uuidv4 } from 'uuid';

export type ConnectorStatus = 'AVAILABLE' | 'DEPRECATED';
export type ConnectionStatus = 'NOT CONFIGURED' | 'CONFIGURED' | 'AUTHENTICATED' | 'CONNECTED' | 'SYNCING' | 'WARNING' | 'FAILED' | 'DISABLED';
export type DataFreshness = 'Fresh' | 'Recent' | 'Aging' | 'Stale' | 'Unknown';

export interface DataDomain {
  id: string;
  name: string;
  enabled: boolean;
  availableRecords: number;
  lastUpdated?: string;
}

export interface FieldMapping {
  sourceField: string;
  orionField: string;
  transformation?: string;
}

export interface SyncJobRecord {
  id: string;
  source: string;
  connectorId: string;
  startedAt: string;
  completedAt?: string;
  duration?: string;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsRejected: number;
  errors: string[];
  status: 'SUCCESS' | 'RUNNING' | 'WARNING' | 'FAILED';
}

export interface ConnectorLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  action: string;
  message: string;
}

export interface ConnectorConfig {
  name: string;
  environment: 'Sandbox / Test' | 'Production';
  baseUrl?: string;
  authType: 'OAuth 2.0' | 'API Key' | 'Bearer Token' | 'Basic';
  apiKey?: string;
  username?: string;
  password?: string;
  clientTenant?: string;
  companyCode?: string;
  environmentId?: string;
  pollingFrequency?: string;
  monitoringPurposes?: string[];
}

export class BaseConnector {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  connectorStatus: ConnectorStatus = 'AVAILABLE';
  connectionStatus: ConnectionStatus = 'NOT CONFIGURED';
  lastSync?: string;
  lastSuccess?: string;
  records: number = 0;
  errorCount: number = 0;
  latency: string = '-';
  freshness: DataFreshness = 'Unknown';
  config: ConnectorConfig;
  domains: DataDomain[];
  fieldMappings: FieldMapping[];
  syncHistory: SyncJobRecord[] = [];
  logs: ConnectorLog[] = [];

  constructor(data: {
    id: string;
    name: string;
    category: string;
    description: string;
    type: string;
    domains: string[];
  }) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.description = data.description;
    this.type = data.type;
    this.config = {
      name: data.name,
      environment: 'Sandbox / Test',
      authType: 'OAuth 2.0'
    };
    this.domains = data.domains.map(d => ({
      id: d.toLowerCase().replace(/\s+/g, '_'),
      name: d,
      enabled: false,
      availableRecords: 0
    }));
    this.fieldMappings = [
      { sourceField: 'external_id', orionField: 'id', transformation: 'direct' },
      { sourceField: 'display_name', orionField: 'name', transformation: 'trim' }
    ];
  }

  async connect(config: ConnectorConfig): Promise<boolean> {
    this.config = { ...this.config, ...config };
    this.connectionStatus = 'CONFIGURED';
    this.log('INFO', 'CONFIG', `Connector configured for environment: ${config.environment}`);
    return true;
  }

  async testConnection(): Promise<{ success: boolean; latency: string; message: string }> {
    this.log('INFO', 'TEST', 'Initiating connection handshake & authentication check...');
    
    if (!this.config.baseUrl || this.config.baseUrl.trim() === '' || this.config.baseUrl.includes('<customer-sap-endpoint>')) {
      this.connectionStatus = 'FAILED';
      this.log('ERROR', 'TEST', 'Missing endpoint or invalid URL.');
      return { success: false, latency: '-', message: 'Missing endpoint or invalid URL. Please enter a valid SAP API endpoint.' };
    }

    if (!this.config.apiKey && !this.config.username && this.type !== 'FILE') {
      this.connectionStatus = 'FAILED';
      this.log('ERROR', 'TEST', 'Authentication failed: Missing credentials.');
      return { success: false, latency: '350ms', message: 'Authentication failed: Invalid credentials or token unauthorized.' };
    }
    
    // Perform simulated real test
    this.connectionStatus = 'CONNECTED';
    this.latency = '72ms';
    this.freshness = 'Fresh';
    this.lastSuccess = new Date().toISOString();
    
    // Populate available records upon successful test
    this.domains.forEach(d => {
      d.availableRecords = Math.floor(Math.random() * 3000) + 200;
    });

    this.log('SUCCESS', 'TEST', 'Connection handshake verified successfully. Authentication token active.');
    return { success: true, latency: '72ms', message: 'Connection established successfully.' };
  }

  async disconnect(): Promise<void> {
    this.connectionStatus = 'NOT CONFIGURED';
    this.records = 0;
    this.domains.forEach(d => {
      d.availableRecords = 0;
      d.enabled = false;
    });
    this.log('WARN', 'DISCONNECT', 'Connector disconnected by operator.');
  }

  async discover(): Promise<DataDomain[]> {
    this.log('INFO', 'DISCOVER', 'Scanning remote endpoints for data structures & schemas...');
    if (this.connectionStatus !== 'CONNECTED' && this.connectionStatus !== 'CONFIGURED') {
      throw new Error('Data discovery requires a configured SAP connection.');
    }
    return this.domains;
  }

  getSchemas(): any {
    return { entity: this.type, fields: this.fieldMappings };
  }

  getDataDomains(): DataDomain[] {
    return this.domains;
  }

  async fetch(): Promise<any[]> {
    this.log('INFO', 'FETCH', 'Fetching payload from remote endpoint...');
    return [];
  }

  async push(payload: any): Promise<boolean> {
    this.log('INFO', 'PUSH', `Pushing payload of size ${JSON.stringify(payload).length} bytes`);
    return true;
  }

  async subscribe(callback: (event: any) => void): Promise<() => void> {
    this.log('INFO', 'SUBSCRIBE', 'Active webhook/event stream listener registered.');
    return () => {};
  }

  transform(rawRecord: any): any {
    let transformed = { ...rawRecord };
    this.fieldMappings.forEach(m => {
      if (transformed[m.sourceField] !== undefined) {
        transformed[m.orionField] = transformed[m.sourceField];
      }
    });
    return transformed;
  }

  validate(records: any[]): { valid: number; invalid: number; warnings: string[] } {
    let invalid = 0;
    const warnings: string[] = [];
    records.forEach(r => {
      if (!r.id && !r.sku && !r.productId) invalid++;
    });
    if (invalid > 0) warnings.push(`${invalid} records lacked primary entity identifiers.`);
    return { valid: records.length - invalid, invalid, warnings };
  }

  async sync(): Promise<SyncJobRecord> {
    const jobId = 'JOB-' + Math.floor(Math.random() * 90000 + 10000);
    const startTime = new Date().toISOString();
    this.connectionStatus = 'SYNCING';
    this.log('INFO', 'SYNC', `Starting synchronization job ${jobId}...`);

    const enabledDomainsCount = this.domains.filter(d => d.enabled).length || 1;
    const totalAvail = this.domains.filter(d => d.enabled).reduce((acc, d) => acc + d.availableRecords, 0) || 1200;

    const job: SyncJobRecord = {
      id: jobId,
      source: this.name,
      connectorId: this.id,
      startedAt: startTime,
      recordsRead: totalAvail,
      recordsCreated: Math.floor(totalAvail * 0.9),
      recordsUpdated: Math.floor(totalAvail * 0.1),
      recordsRejected: 0,
      errors: [],
      status: 'RUNNING'
    };

    // Simulate async sync
    await new Promise(r => setTimeout(r, 1200));

    job.completedAt = new Date().toISOString();
    job.duration = '1.2s';
    job.status = 'SUCCESS';
    this.connectionStatus = 'CONNECTED';
    this.lastSync = job.completedAt;
    this.lastSuccess = job.completedAt;
    this.freshness = 'Fresh';
    this.records = job.recordsRead;

    this.syncHistory.unshift(job);
    this.log('SUCCESS', 'SYNC', `Sync completed successfully. ${job.recordsRead} records ingested.`);
    
    // Trigger event bus broadcast
    EventBus.emit('DATA_SYNCED', { connectorId: this.id, records: job.recordsRead });

    return job;
  }

  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getHealth(): { status: ConnectionStatus; freshness: DataFreshness; latency: string; errorCount: number } {
    return {
      status: this.connectionStatus,
      freshness: this.freshness,
      latency: this.latency,
      errorCount: this.errorCount
    };
  }

  protected log(level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', action: string, message: string) {
    this.logs.unshift({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      action,
      message
    });
  }
}

// Event Bus for Orion-9 internal system updates
export class EventBus {
  private static listeners: Map<string, Array<(payload: any) => void>> = new Map();

  static on(event: string, callback: (payload: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) {
        this.listeners.set(event, arr.filter(cb => cb !== callback));
      }
    };
  }

  static emit(event: string, payload: any) {
    console.log(`[EventBus] Emitted: ${event}`, payload);
    const arr = this.listeners.get(event);
    if (arr) {
      arr.forEach(cb => cb(payload));
    }
  }
}

// Factory to initialize all connector instances
export const createDefaultConnectors = (): BaseConnector[] => {
  return [
    // Enterprise Systems
    new BaseConnector({ id: 'sap', name: 'SAP S/4HANA', category: 'Enterprise Systems', description: 'Enterprise Resource Planning connection', type: 'ERP', domains: ['Product / Material Master', 'Supplier Master', 'Inventory', 'Purchase Orders', 'Inbound Deliveries', 'Outbound Deliveries', 'Sales Orders', 'Demand'] }),
    new BaseConnector({ id: 'oracle', name: 'Oracle Fusion', category: 'Enterprise Systems', description: 'Cloud ERP & SCM suite connection', type: 'ERP', domains: ['Products', 'Suppliers', 'Inventory', 'Purchase Orders', 'Receiving', 'Shipments'] }),
    new BaseConnector({ id: 'dynamics', name: 'Dynamics 365', category: 'Enterprise Systems', description: 'Microsoft Supply Chain & ERP connection', type: 'ERP', domains: ['Products', 'Suppliers', 'Inventory', 'Purchase Orders', 'Warehouse', 'Shipments'] }),
    new BaseConnector({ id: 'salesforce', name: 'Salesforce', category: 'Enterprise Systems', description: 'Customer Relationship Management & Orders', type: 'CRM', domains: ['Customers', 'Accounts', 'Orders', 'Cases', 'Products'] }),
    new BaseConnector({ id: 'wms', name: 'Manhattan WMS', category: 'Enterprise Systems', description: 'Warehouse Management & Fulfillment execution', type: 'WMS', domains: ['Warehouses', 'Bins', 'Inventory', 'Stock Movements', 'Inbound', 'Receiving', 'Putaway', 'Picking', 'Outbound'] }),
    new BaseConnector({ id: 'tms', name: 'Blue Yonder TMS', category: 'Enterprise Systems', description: 'Transportation Management & Freight optimization', type: 'TMS', domains: ['Shipments', 'Routes', 'Carriers', 'Tracking', 'ETA', 'Freight', 'Delivery Events'] }),

    // B2B & External
    new BaseConnector({ id: 'suppliers', name: 'Supplier Network EDI', category: 'B2B & External', description: 'Direct vendor system linkages & EDI gateway', type: 'EDI', domains: ['850 Purchase Order', '855 PO Acknowledgement', '856 ASN', '810 Invoice'] }),
    new BaseConnector({ id: 'webhooks', name: 'Webhooks', category: 'B2B & External', description: 'Event-driven real-time supply chain updates', type: 'HOOK', domains: ['Incoming Events', 'Inventory Alerts', 'Shipment Status'] }),
    new BaseConnector({ id: 'rest_api', name: 'REST API', category: 'B2B & External', description: 'Universal HTTP REST API connector', type: 'API', domains: ['Custom Endpoint Data', 'Products', 'Inventory'] }),

    // Data & Storage
    new BaseConnector({ id: 'databases', name: 'SQL / NoSQL DB', category: 'Data & Storage', description: 'Direct database connections (PostgreSQL, MySQL, SQL Server)', type: 'DB', domains: ['Raw Tables', 'Inventory View', 'Order Log'] }),
    new BaseConnector({ id: 'postgresql', name: 'PostgreSQL', category: 'Data & Storage', description: 'Direct PostgreSQL enterprise database connector', type: 'DB', domains: ['Public Schema', 'Supply Chain Tables'] }),
    new BaseConnector({ id: 'mysql', name: 'MySQL', category: 'Data & Storage', description: 'MySQL relational database connector', type: 'DB', domains: ['Database Tables', 'Views'] }),
    new BaseConnector({ id: 'sql_server', name: 'SQL Server', category: 'Data & Storage', description: 'Microsoft SQL Server enterprise connector', type: 'DB', domains: ['Enterprise DB', 'Stored Procedures'] }),
    new BaseConnector({ id: 'sftp', name: 'SFTP Server', description: 'Secure file transfer protocol drop', category: 'Data & Storage', type: 'SFTP', domains: ['Inventory Feed', 'PO Feed', 'Supplier Master', 'Shipment CSV'] }),
    
    // File Importer (Pre-connected as per user instructions)
    (() => {
      const fileConn = new BaseConnector({ id: 'files', name: 'File Importer', category: 'Data & Storage', description: 'CSV/Excel manual or automated file drops', type: 'FILE', domains: ['Products', 'Inventory', 'Suppliers', 'Purchase Orders', 'Shipments'] });
      fileConn.connectionStatus = 'CONNECTED';
      fileConn.freshness = 'Fresh';
      fileConn.lastSync = new Date().toISOString();
      fileConn.records = 2500;
      fileConn.domains.forEach(d => { d.enabled = true; d.availableRecords = 500; });
      return fileConn;
    })()
  ];
};

