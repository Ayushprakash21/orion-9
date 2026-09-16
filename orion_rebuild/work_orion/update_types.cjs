const fs = require('fs');

let typesStr = fs.readFileSync('src/types.ts', 'utf8');

const newTypes = `
export type ASN = {
  id: string;
  poId: string;
  supplierId: string;
  shipmentId?: string;
  warehouseId: string;
  expectedArrival: string;
  cartons: number;
  units: number;
  carrier?: string;
  dock?: string;
  status: 'CREATED' | 'CONFIRMED' | 'IN_TRANSIT' | 'ARRIVED' | 'DOCKED' | 'UNLOADING' | 'QC' | 'RECEIVED' | 'PUTAWAY' | 'CANCELLED';
  createdAt: string;
};

export type Event = {
  id: string;
  companyId: string;
  source: string;
  entityType: string;
  entityId: string;
  eventType: string;
  timestamp: string;
  payload: any;
  processed: boolean;
  processingStatus: string;
};

export type Action = {
  id: string;
  entity: string;
  issue: string;
  priority: string;
  recommendation: string;
  impact: string;
  status: 'PROPOSED' | 'AWAITING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  approvalRequired: boolean;
  createdAt: string;
};
`;

if (!typesStr.includes('export type ASN')) {
    typesStr += newTypes;
    fs.writeFileSync('src/types.ts', typesStr);
}

