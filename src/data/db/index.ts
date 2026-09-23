import localforage from 'localforage';
import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception, ImportHistory } from '../../types';

localforage.config({
  name: 'SupplyChainControlTower',
  storeName: 'sc_data',
});

// Safe instance creation helper
const createSafeInstance = (config: { name: string; storeName: string }) => {
  try {
    return localforage.createInstance(config);
  } catch (e) {
    console.warn(`[ORION-DB] Failed to create localforage instance for ${config.storeName}, falling back to memory/no-op.`, e);
    // Return a minimal compliant interface that does nothing
    return {
      getItem: async () => null,
      setItem: async () => null,
      removeItem: async () => null,
      clear: async () => null,
      key: async () => null,
      keys: async () => [],
      length: async () => 0,
      iterate: async () => {},
      config: () => {},
      setDriver: async () => {},
      driver: () => 'memory',
      ready: async () => {},
      dropInstance: async () => {},
    } as unknown as LocalForage;
  }
};

export const db = {
  products: createSafeInstance({ name: 'SC_DB', storeName: 'products' }),
  warehouses: createSafeInstance({ name: 'SC_DB', storeName: 'warehouses' }),
  inventory: createSafeInstance({ name: 'SC_DB', storeName: 'inventory' }),
  suppliers: createSafeInstance({ name: 'SC_DB', storeName: 'suppliers' }),
  purchaseOrders: createSafeInstance({ name: 'SC_DB', storeName: 'purchaseOrders' }),
  shipments: createSafeInstance({ name: 'SC_DB', storeName: 'shipments' }),
  exceptions: createSafeInstance({ name: 'SC_DB', storeName: 'exceptions' }),
  metadata: createSafeInstance({ name: 'SC_DB', storeName: 'metadata' }), // for sync info, mode
  actions: createSafeInstance({ name: 'SC_DB', storeName: 'actions' }),
  importHistory: createSafeInstance({ name: 'SC_DB', storeName: 'importHistory' }),
  settings: createSafeInstance({ name: 'SC_DB', storeName: 'settings' }),
  decisions: createSafeInstance({ name: 'SC_DB', storeName: 'decisions' }),
  auditEvents: createSafeInstance({ name: 'SC_DB', storeName: 'auditEvents' }),
  userProfile: createSafeInstance({ name: 'SC_DB', storeName: 'userProfile' }),
  organizationProfile: createSafeInstance({ name: 'SC_DB', storeName: 'organizationProfile' }),
  customers: createSafeInstance({ name: 'SC_DB', storeName: 'customers' }),
  customerOrders: createSafeInstance({ name: 'SC_DB', storeName: 'customerOrders' }),
  carriers: createSafeInstance({ name: 'SC_DB', storeName: 'carriers' }),
  routes: createSafeInstance({ name: 'SC_DB', storeName: 'routes' }),
  contracts: createSafeInstance({ name: 'SC_DB', storeName: 'contracts' }),
  rfqs: createSafeInstance({ name: 'SC_DB', storeName: 'rfqs' }),
  scenarios: createSafeInstance({ name: 'SC_DB', storeName: 'scenarios' }),
  contingencyPlans: createSafeInstance({ name: 'SC_DB', storeName: 'contingencyPlans' }),
  documents: createSafeInstance({ name: 'SC_DB', storeName: 'documents' }),
  supplierCommunications: createSafeInstance({ name: 'SC_DB', storeName: 'supplierCommunications' }),
  warehouseDetails: createSafeInstance({ name: 'SC_DB', storeName: 'warehouseDetails' }),
  workflows: createSafeInstance({ name: 'SC_DB', storeName: 'workflows' }),
  eventFabric: createSafeInstance({ name: 'SC_DB', storeName: 'eventFabric' }),
  masterData: createSafeInstance({ name: 'SC_DB', storeName: 'masterData' }),
  reconciliations: createSafeInstance({ name: 'SC_DB', storeName: 'reconciliations' }),
  freightConsignments: createSafeInstance({ name: 'SC_DB', storeName: 'freightConsignments' }),
  yardAppointments: createSafeInstance({ name: 'SC_DB', storeName: 'yardAppointments' }),
  consolidationPlans: createSafeInstance({ name: 'SC_DB', storeName: 'consolidationPlans' }),
  laneCongestionMetrics: createSafeInstance({ name: 'SC_DB', storeName: 'laneCongestionMetrics' }),
  echelonNodes: createSafeInstance({ name: 'SC_DB', storeName: 'echelonNodes' }),
  skuBuffers: createSafeInstance({ name: 'SC_DB', storeName: 'skuBuffers' }),
  replenishmentOrders: createSafeInstance({ name: 'SC_DB', storeName: 'replenishmentOrders' }),
  bullwhipMetrics: createSafeInstance({ name: 'SC_DB', storeName: 'bullwhipMetrics' }),
  connectors: createSafeInstance({ name: 'SC_DB', storeName: 'connectors' }),
  dlqMessages: createSafeInstance({ name: 'SC_DB', storeName: 'dlqMessages' }),
  workflowDefinitions: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_definitions' }),
  workflowInstances: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_instances' }),
  workflowCheckpoints: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_checkpoints' }),
  workflowTasks: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_tasks' }),
  workflowApprovals: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_approvals' }),
  workflowSchedules: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_schedules' }),
  workflowEvents: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_events' }),
  workflowDlq: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_dlq' }),
  workflowAudit: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_audit' }),
  workflowOutcomes: createSafeInstance({ name: 'SC_DB', storeName: 'workflow_outcomes' }),
  documentVersions: createSafeInstance({ name: 'SC_DB', storeName: 'document_versions' }),

  documentExtractions: createSafeInstance({ name: 'SC_DB', storeName: 'document_extractions' }),
  documentChunks: createSafeInstance({ name: 'SC_DB', storeName: 'document_chunks' }),
  knowledgeEntries: createSafeInstance({ name: 'SC_DB', storeName: 'knowledge_entries' }),
  knowledgeEmbeddings: createSafeInstance({ name: 'SC_DB', storeName: 'knowledge_embeddings' }),
  knowledgeRetrievals: createSafeInstance({ name: 'SC_DB', storeName: 'knowledge_retrievals' }),
  documentReviews: createSafeInstance({ name: 'SC_DB', storeName: 'document_reviews' }),
  documentExpirations: createSafeInstance({ name: 'SC_DB', storeName: 'document_expirations' }),
};



export const saveData = async <T>(store: LocalForage, data: T[]): Promise<void> => {
  try {
    await store.setItem('all', data);
  } catch (err) {
    console.warn('LocalForage save warning (fallback to memory):', err);
  }
};

export const loadData = async <T>(store: LocalForage): Promise<T[]> => {
  try {
    const data = await store.getItem<T[]>('all');
    return data || [];
  } catch (err) {
    console.warn('LocalForage load warning (fallback to empty array):', err);
    return [];
  }
};

export const clearRealData = async (): Promise<void> => {
  try {
    await Promise.allSettled([
      db.products.removeItem('all'),
      db.warehouses.removeItem('all'),
      db.inventory.removeItem('all'),
      db.suppliers.removeItem('all'),
      db.purchaseOrders.removeItem('all'),
      db.shipments.removeItem('all'),
      db.exceptions.removeItem('all'),
      db.actions.removeItem('all'),
      db.importHistory.removeItem('all'),
      db.decisions.removeItem('all'),
      db.auditEvents.removeItem('all'),
      db.customers.removeItem('all'),
      db.customerOrders.removeItem('all'),
      db.carriers.removeItem('all'),
      db.routes.removeItem('all'),
      db.contracts.removeItem('all'),
      db.rfqs.removeItem('all'),
      db.scenarios.removeItem('all'),
      db.contingencyPlans.removeItem('all'),
      db.documents.removeItem('all'),
      db.supplierCommunications.removeItem('all'),
      db.warehouseDetails.removeItem('all'),
      db.freightConsignments.removeItem('all'),
      db.yardAppointments.removeItem('all'),
      db.consolidationPlans.removeItem('all'),
      db.laneCongestionMetrics.removeItem('all'),
      db.echelonNodes.removeItem('all'),
      db.skuBuffers.removeItem('all'),
      db.replenishmentOrders.removeItem('all'),
      db.bullwhipMetrics.removeItem('all'),
      db.metadata.setItem('dataMode', 'demo'),
    ]);
  } catch (err) {
    console.warn('Failed to clear real data:', err);
  }
};

