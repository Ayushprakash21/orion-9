import localforage from 'localforage';
import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception, ImportHistory } from '../../types';

localforage.config({
  name: 'SupplyChainControlTower',
  storeName: 'sc_data',
});

export const db = {
  products: localforage.createInstance({ name: 'SC_DB', storeName: 'products' }),
  warehouses: localforage.createInstance({ name: 'SC_DB', storeName: 'warehouses' }),
  inventory: localforage.createInstance({ name: 'SC_DB', storeName: 'inventory' }),
  suppliers: localforage.createInstance({ name: 'SC_DB', storeName: 'suppliers' }),
  purchaseOrders: localforage.createInstance({ name: 'SC_DB', storeName: 'purchaseOrders' }),
  shipments: localforage.createInstance({ name: 'SC_DB', storeName: 'shipments' }),
  exceptions: localforage.createInstance({ name: 'SC_DB', storeName: 'exceptions' }),
  metadata: localforage.createInstance({ name: 'SC_DB', storeName: 'metadata' }), // for sync info, mode
  actions: localforage.createInstance({ name: 'SC_DB', storeName: 'actions' }),
  importHistory: localforage.createInstance({ name: 'SC_DB', storeName: 'importHistory' }),
  settings: localforage.createInstance({ name: 'SC_DB', storeName: 'settings' }),
  decisions: localforage.createInstance({ name: 'SC_DB', storeName: 'decisions' }),
  auditEvents: localforage.createInstance({ name: 'SC_DB', storeName: 'auditEvents' }),
  userProfile: localforage.createInstance({ name: 'SC_DB', storeName: 'userProfile' }),
  organizationProfile: localforage.createInstance({ name: 'SC_DB', storeName: 'organizationProfile' }),
};

export const saveData = async <T>(store: LocalForage, data: T[]) => {
  await store.setItem('all', data);
};

export const loadData = async <T>(store: LocalForage): Promise<T[]> => {
  const data = await store.getItem<T[]>('all');
  return data || [];
};

export const clearRealData = async () => {
  await db.products.removeItem('all');
  await db.warehouses.removeItem('all');
  await db.inventory.removeItem('all');
  await db.suppliers.removeItem('all');
  await db.purchaseOrders.removeItem('all');
  await db.shipments.removeItem('all');
  await db.exceptions.removeItem('all');
  await db.actions.removeItem('all');
  await db.importHistory.removeItem('all');
  await db.decisions.removeItem('all');
  await db.auditEvents.removeItem('all');
  await db.metadata.setItem('dataMode', 'demo');
};

