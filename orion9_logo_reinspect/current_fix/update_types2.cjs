const fs = require('fs');

let typesStr = fs.readFileSync('src/types.ts', 'utf8');

const newTypes = `
export type ConnectorStatus = 'NOT CONFIGURED' | 'AVAILABLE' | 'CONNECTED' | 'SYNCING' | 'ERROR';

export type Connector = {
  id: string;
  name: string;
  type: string; // ERP, WMS, TMS, CRM, DB, API, SFTP, EDI
  category: string;
  status: ConnectorStatus;
  lastSync?: string;
  recordsProcessed?: number;
  errorCount?: number;
};

export type SyncJob = {
  id: string;
  source: string;
  connectorId: string;
  startedAt: string;
  finishedAt?: string;
  duration?: string;
  records: number;
  status: 'SUCCESS' | 'RUNNING' | 'WARNING' | 'FAILED';
  errors?: string[];
};

export type OutboundOrder = {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: 'CREATED' | 'ALLOCATED' | 'PICKED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';
  promisedDate: string;
  shipmentId?: string;
  risk: string;
};
`;

if (!typesStr.includes('export type Connector')) {
    typesStr += newTypes;
    fs.writeFileSync('src/types.ts', typesStr);
}

