import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception, ImportHistory } from '../types';
import * as demoData from '../data';
import { db, loadData, saveData, clearRealData } from '../data/db';

import { ExceptionEngine } from '../services/ExceptionEngine';

interface SupplyChainState {
  products: Product[];
  warehouses: Warehouse[];
  inventory: Inventory[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  shipments: Shipment[];
  exceptions: Exception[];
  importHistory: ImportHistory[];
  currency: string;
  dataMode: 'demo' | 'real';
  isInitializing: boolean;
  
  switchToDemoData: () => Promise<void>;
  switchToRealData: () => Promise<void>;
  updateData: (key: keyof Omit<SupplyChainState, 'loadDemoData' | 'updateData' | 'currency' | 'dataMode' | 'isInitializing' | 'switchToDemoData' | 'switchToRealData' | 'importData' | 'settings' | 'updateSettings'>, data: any[]) => Promise<void>;
  importData: (entityType: string, newRecords: any[], filename: string, warningsCount?: number) => Promise<void>;
  
  // Settings
  settings: any;
  updateSettings: (newSettings: any) => Promise<void>;
}

const SupplyChainContext = createContext<SupplyChainState | undefined>(undefined);

export const SupplyChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  
  const [currency, setCurrency] = useState('USD');
  const [dataMode, setDataMode] = useState<'demo' | 'real'>('demo');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [settings, setSettings] = useState<any>({
    criticalStockOutDays: 5,
    excessInventoryDays: 60,
    supplierHighRiskOtif: 70,
    shipmentDelayAlertDays: 2,
    supplierQualityThreshold: 90,
    supplierWeightOtif: 40,
    supplierWeightQuality: 30,
    supplierWeightLeadTime: 15,
    supplierWeightRisk: 15,
    demandSpikeThreshold: 1.5,
    inventoryHealthWeight: 30,
    supplierHealthWeight: 25,
    procurementHealthWeight: 20,
    logisticsHealthWeight: 25,
    dateFormat: 'DD MMM YYYY',
    timezone: 'UTC'
  });

  useEffect(() => {
    const initializeStore = async () => {
      try {
        const mode = await db.metadata.getItem<'demo' | 'real'>('dataMode') || 'demo';
        setDataMode(mode);
        
        const storedSettings = await db.settings.getItem<any>('config');
        if (storedSettings) {
          setSettings(storedSettings);
          if (storedSettings.currency) setCurrency(storedSettings.currency);
        }

        if (mode === 'real') {
          await loadRealData();
        } else {
          loadDemoData();
        }
      } catch (error) {
        console.error("Failed to initialize store", error);
        loadDemoData();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStore();
  }, []);

  const loadRealData = async () => {
    setProducts(await loadData<Product>(db.products));
    setWarehouses(await loadData<Warehouse>(db.warehouses));
    setInventory(await loadData<Inventory>(db.inventory));
    setSuppliers(await loadData<Supplier>(db.suppliers));
    setPurchaseOrders(await loadData<PurchaseOrder>(db.purchaseOrders));
    setShipments(await loadData<Shipment>(db.shipments));
    setExceptions(await loadData<Exception>(db.exceptions));
    setImportHistory(await loadData<ImportHistory>(db.importHistory));
  };

  const loadDemoData = () => {
    setProducts(demoData.demoProducts as Product[]);
    setWarehouses(demoData.demoWarehouses as Warehouse[]);
    setInventory(demoData.demoInventory as Inventory[]);
    setSuppliers(demoData.demoSuppliers as Supplier[]);
    setPurchaseOrders(demoData.demoPurchaseOrders as PurchaseOrder[]);
    setShipments(demoData.demoShipments as Shipment[]);
    setExceptions(demoData.demoExceptions as Exception[]);
    setImportHistory([]);
  };

  
  const switchToDemoData = async () => {
    setDataMode('demo');
    await db.metadata.setItem('dataMode', 'demo');
    loadDemoData();
  };

  const switchToRealData = async () => {
    setIsInitializing(true);
    setDataMode('real');
    await db.metadata.setItem('dataMode', 'real');
    
    // Load from DB
    const loadedProducts = await loadData(db.products) as Product[];
    const loadedWarehouses = await loadData(db.warehouses) as Warehouse[];
    const loadedInventory = await loadData(db.inventory) as Inventory[];
    const loadedSuppliers = await loadData(db.suppliers) as Supplier[];
    const loadedPOs = await loadData(db.purchaseOrders) as PurchaseOrder[];
    const loadedShipments = await loadData(db.shipments) as Shipment[];
    const loadedExceptions = await loadData(db.exceptions) as Exception[];
    const loadedHistory = await loadData(db.importHistory) as ImportHistory[];
    
    setProducts(loadedProducts);
    setWarehouses(loadedWarehouses);
    setInventory(loadedInventory);
    setSuppliers(loadedSuppliers);
    setPurchaseOrders(loadedPOs);
    setShipments(loadedShipments);
    setExceptions(loadedExceptions);
    setImportHistory(loadedHistory);
    
    setIsInitializing(false);
  };

  const updateData = async (key: keyof Omit<SupplyChainState, 'loadDemoData' | 'updateData' | 'currency' | 'dataMode' | 'isInitializing' | 'switchToDemoData' | 'switchToRealData' | 'importData' | 'settings' | 'updateSettings'>, data: any[]) => {
    if (key === 'products') setProducts(data);
    if (key === 'warehouses') setWarehouses(data);
    if (key === 'inventory') setInventory(data);
    if (key === 'suppliers') setSuppliers(data);
    if (key === 'purchaseOrders') setPurchaseOrders(data);
    if (key === 'shipments') setShipments(data);
    if (key === 'exceptions') setExceptions(data);
    if (key === 'importHistory') setImportHistory(data);
    
    await saveData((db as any)[key], data);
  };

  const importData = async (entityType: string, newRecords: any[], filename: string, warningsCount: number = 0) => {
    setIsInitializing(true);
    let updatedProducts = [...products];
    let updatedWarehouses = [...warehouses];
    let updatedInventory = [...inventory];
    let updatedSuppliers = [...suppliers];
    let updatedPOs = [...purchaseOrders];
    let updatedShipments = [...shipments];

    // Helper for Upsert
    const upsert = (existingArray: any[], newItems: any[]) => {
      const existingMap = new Map(existingArray.map(item => [item.id, item]));
      newItems.forEach(item => {
        existingMap.set(item.id, item);
      });
      return Array.from(existingMap.values());
    };

    if (entityType === 'inventory') updatedInventory = upsert(updatedInventory, newRecords);
    if (entityType === 'suppliers') updatedSuppliers = upsert(updatedSuppliers, newRecords);
    if (entityType === 'purchaseOrders') updatedPOs = upsert(updatedPOs, newRecords);
    if (entityType === 'shipments') updatedShipments = upsert(updatedShipments, newRecords);
    if (entityType === 'products') updatedProducts = upsert(updatedProducts, newRecords);
    if (entityType === 'warehouses') updatedWarehouses = upsert(updatedWarehouses, newRecords);

    // Call Exception Engine to refresh exceptions based on new data
    const newExceptions = ExceptionEngine.generateExceptions(
      updatedInventory,
      updatedSuppliers,
      updatedPOs,
      updatedShipments,
      settings,
      exceptions
    );

    const newImportHistory: ImportHistory[] = [
      {
        id: new Date().getTime().toString(),
        filename,
        entityType,
        totalRows: newRecords.length,
        successfulRows: newRecords.length,
        failedRows: 0,
        warnings: warningsCount,
        importedAt: new Date().toISOString(),
        status: warningsCount > 0 ? 'Success with warnings' : 'Success'
      },
      ...importHistory
    ];

    setDataMode('real');
    await db.metadata.setItem('dataMode', 'real');
    
    setProducts(updatedProducts);
    setWarehouses(updatedWarehouses);
    setInventory(updatedInventory);
    setSuppliers(updatedSuppliers);
    setPurchaseOrders(updatedPOs);
    setShipments(updatedShipments);
    setExceptions(newExceptions);
    setImportHistory(newImportHistory);
    
    await saveData(db.products, updatedProducts);
    await saveData(db.warehouses, updatedWarehouses);
    await saveData(db.inventory, updatedInventory);
    await saveData(db.suppliers, updatedSuppliers);
    await saveData(db.purchaseOrders, updatedPOs);
    await saveData(db.shipments, updatedShipments);
    await saveData(db.exceptions, newExceptions);
    await saveData(db.importHistory, newImportHistory);
    
    setIsInitializing(false);
  };

  const updateSettings = async (newSettings: any) => {
    setSettings(newSettings);
    if (newSettings.currency) setCurrency(newSettings.currency);
    await db.settings.setItem('config', newSettings);
    
    // Recalculate exceptions with new thresholds
    const newExceptions = ExceptionEngine.generateExceptions(inventory, suppliers, purchaseOrders, shipments, newSettings, exceptions);
    setExceptions(newExceptions);
    await saveData(db.exceptions, newExceptions);
  };

  const value = useMemo(() => ({
    products,
    warehouses,
    inventory,
    suppliers,
    purchaseOrders,
    shipments,
    exceptions,
    importHistory,
    currency,
    dataMode,
    isInitializing,
    switchToDemoData,
    switchToRealData,
    updateData,
    importData,
    settings,
    updateSettings
  }), [products, warehouses, inventory, suppliers, purchaseOrders, shipments, exceptions, importHistory, currency, dataMode, isInitializing, settings]);

  return (
    <SupplyChainContext.Provider value={value}>
      {children}
    </SupplyChainContext.Provider>
  );
};

export const useSupplyChain = () => {
  const context = useContext(SupplyChainContext);
  if (context === undefined) {
    throw new Error('useSupplyChain must be used within a SupplyChainProvider');
  }
  return context;
};
