import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception,
  ImportHistory, Action, Decision, DecisionAuditEvent, UserProfile, OrganizationProfile,
  SystemSettings, DEFAULT_SYSTEM_SETTINGS, normalizeSettings,
  Customer, CustomerOrder, Carrier, Route, WarehouseDetail, Contract,
  DocumentRecord, SupplierCommunication, KpiRecord
} from '../types';
import * as demoData from '../data';
import {
  demoCustomers, demoCustomerOrders, demoCarriers, demoRoutes,
  demoWarehouseDetails, demoContracts, demoDocuments,
  demoSupplierCommunications, demoKpis
} from '../data/normalizedModel';
import { db, loadData, saveData, clearRealData } from '../data/db';

import { ExceptionEngine } from '../services/ExceptionEngine';
import { ActionEngine } from '../services/ActionEngine';
import { DecisionEngine } from '../services/DecisionEngine';
import { AuditService } from '../services/AuditService';
import { dataEngine, rulesEngine, kpiEngine } from '../core';

interface SupplyChainState {
  products: Product[];
  warehouses: Warehouse[];
  inventory: Inventory[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  shipments: Shipment[];
  exceptions: Exception[];
  actions: Action[];
  decisions: Decision[];
  auditEvents: DecisionAuditEvent[];
  importHistory: ImportHistory[];
  userProfile: UserProfile | null;
  organizationProfile: OrganizationProfile | null;
  
  // Extended Operational SCM Models
  customers: Customer[];
  customerOrders: CustomerOrder[];
  carriers: Carrier[];
  routes: Route[];
  warehouseDetails: WarehouseDetail[];
  contracts: Contract[];
  documents: DocumentRecord[];
  supplierCommunications: SupplierCommunication[];
  kpiRecords: KpiRecord[];

  currency: string;
  timezone: string;
  dataMode: 'demo' | 'real';
  isInitializing: boolean;
  
  switchToDemoData: () => Promise<void>;
  switchToRealData: () => Promise<void>;
  updateData: (key: keyof Omit<SupplyChainState, 'loadDemoData' | 'updateData' | 'currency' | 'dataMode' | 'isInitializing' | 'switchToDemoData' | 'switchToRealData' | 'importData' | 'settings' | 'updateSettings' | 'approveAction' | 'executeAction' | 'cancelAction' | 'approveDecision' | 'rejectDecision' | 'repairDataQuality'>, data: any[]) => Promise<void>;
  importData: (entityType: string, newRecords: any[], filename: string, metrics?: { total: number; failed: number; warnings: number }) => Promise<void>;
  
  // Settings
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings> | any) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  updateOrganizationProfile: (profile: OrganizationProfile) => Promise<void>;
  approveAction: (actionId: string) => void;
  executeAction: (actionId: string) => void;
  cancelAction: (actionId: string) => void;
  approveDecision: (decisionId: string, optionId: string, user: string, comment?: string) => void;
  rejectDecision: (decisionId: string, user: string, comment?: string) => void;

  // New Operational Handlers
  addSupplierCommunication: (comm: Omit<SupplierCommunication, 'id'>) => void;
  approveSupplierCommunication: (commId: string) => void;
  dispatchSupplierCommunication: (commId: string) => void;
  addDocumentRecord: (doc: DocumentRecord) => void;
  updateContract: (contractId: string, updates: Partial<Contract>) => void;
  updateCustomerOrder: (orderId: string, updates: Partial<CustomerOrder>) => void;
  repairDataQuality: (repairs: Array<{ entityType: string; id: string; fixes: Record<string, any> }>) => Promise<void>;
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
  const [actions, setActions] = useState<Action[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [auditEvents, setAuditEvents] = useState<DecisionAuditEvent[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | null>(null);

  // Extended Operational SCM Models State
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(demoCustomerOrders);
  const [carriers, setCarriers] = useState<Carrier[]>(demoCarriers);
  const [routes, setRoutes] = useState<Route[]>(demoRoutes);
  const [warehouseDetails, setWarehouseDetails] = useState<WarehouseDetail[]>(demoWarehouseDetails);
  const [contracts, setContracts] = useState<Contract[]>(demoContracts);
  const [documents, setDocuments] = useState<DocumentRecord[]>(demoDocuments);
  const [supplierCommunications, setSupplierCommunications] = useState<SupplierCommunication[]>(demoSupplierCommunications);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>(demoKpis);
  
  
  const [currency, setCurrency] = useState(DEFAULT_SYSTEM_SETTINGS.currency);
  const [timezone, setTimezone] = useState(DEFAULT_SYSTEM_SETTINGS.timezone);
  const [dataMode, setDataMode] = useState<'demo' | 'real'>('demo');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const cached = localStorage.getItem('orion_settings');
      if (cached) {
        return normalizeSettings(JSON.parse(cached));
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });

  const loadRealData = async () => {
    setProducts(await loadData<Product>(db.products));
    setWarehouses(await loadData<Warehouse>(db.warehouses));
    setInventory(await loadData<Inventory>(db.inventory));
    setSuppliers(await loadData<Supplier>(db.suppliers));
    setPurchaseOrders(await loadData<PurchaseOrder>(db.purchaseOrders));
    setShipments(await loadData<Shipment>(db.shipments));
    setExceptions(await loadData<Exception>(db.exceptions));
    setActions(await loadData<Action>(db.actions));
    setDecisions(await loadData<Decision>(db.decisions));
    setAuditEvents(await loadData<DecisionAuditEvent>(db.auditEvents));
    setImportHistory(await loadData<ImportHistory>(db.importHistory));

    const loadedCustomers = await loadData<Customer>(db.customers);
    if (loadedCustomers.length > 0) setCustomers(loadedCustomers);
    const loadedOrders = await loadData<CustomerOrder>(db.customerOrders);
    if (loadedOrders.length > 0) setCustomerOrders(loadedOrders);
    const loadedCarriers = await loadData<Carrier>(db.carriers);
    if (loadedCarriers.length > 0) setCarriers(loadedCarriers);
    const loadedRoutes = await loadData<Route>(db.routes);
    if (loadedRoutes.length > 0) setRoutes(loadedRoutes);
    const loadedContracts = await loadData<Contract>(db.contracts);
    if (loadedContracts.length > 0) setContracts(loadedContracts);
    const loadedDocs = await loadData<DocumentRecord>(db.documents);
    if (loadedDocs.length > 0) setDocuments(loadedDocs);
    const loadedComms = await loadData<SupplierCommunication>(db.supplierCommunications);
    if (loadedComms.length > 0) setSupplierCommunications(loadedComms);
    const loadedWarehouseDetails = await loadData<WarehouseDetail>(db.warehouseDetails);
    if (loadedWarehouseDetails.length > 0) setWarehouseDetails(loadedWarehouseDetails);
  };

  const loadSettings = async () => {
    try {
      const storedSettings = await db.settings.getItem<any>('config').catch(() => null);
      
      const raw = storedSettings || settings;
      
      // Implement a normalization layer in the loadSettings function
      const normalized: SystemSettings = {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...raw,
        criticalStockOutDays: !isNaN(Number(raw.criticalStockOutDays)) && Number(raw.criticalStockOutDays) > 0 ? Number(raw.criticalStockOutDays) : DEFAULT_SYSTEM_SETTINGS.criticalStockOutDays,
        lowStockDays: !isNaN(Number(raw.lowStockDays)) && Number(raw.lowStockDays) > 0 ? Number(raw.lowStockDays) : DEFAULT_SYSTEM_SETTINGS.lowStockDays,
        excessInventoryDays: !isNaN(Number(raw.excessInventoryDays)) && Number(raw.excessInventoryDays) > 0 ? Number(raw.excessInventoryDays) : DEFAULT_SYSTEM_SETTINGS.excessInventoryDays,
        supplierLowRiskThreshold: !isNaN(Number(raw.supplierLowRiskThreshold)) && Number(raw.supplierLowRiskThreshold) > 0 ? Number(raw.supplierLowRiskThreshold) : DEFAULT_SYSTEM_SETTINGS.supplierLowRiskThreshold,
        supplierHighRiskThreshold: !isNaN(Number(raw.supplierHighRiskThreshold ?? raw.supplierHighRiskOtif)) && Number(raw.supplierHighRiskThreshold ?? raw.supplierHighRiskOtif) > 0 ? Number(raw.supplierHighRiskThreshold ?? raw.supplierHighRiskOtif) : DEFAULT_SYSTEM_SETTINGS.supplierHighRiskThreshold,
        supplierHighRiskOtif: !isNaN(Number(raw.supplierHighRiskThreshold ?? raw.supplierHighRiskOtif)) && Number(raw.supplierHighRiskThreshold ?? raw.supplierHighRiskOtif) > 0 ? Number(raw.supplierHighRiskThreshold ?? raw.supplierHighRiskOtif) : DEFAULT_SYSTEM_SETTINGS.supplierHighRiskThreshold,
        shipmentDelayAlertDays: !isNaN(Number(raw.shipmentDelayAlertDays)) && Number(raw.shipmentDelayAlertDays) >= 0 ? Number(raw.shipmentDelayAlertDays) : DEFAULT_SYSTEM_SETTINGS.shipmentDelayAlertDays,
        healthWeightInventory: !isNaN(Number(raw.healthWeightInventory ?? raw.inventoryHealthWeight)) && Number(raw.healthWeightInventory ?? raw.inventoryHealthWeight) >= 0 ? Number(raw.healthWeightInventory ?? raw.inventoryHealthWeight) : DEFAULT_SYSTEM_SETTINGS.healthWeightInventory,
        inventoryHealthWeight: !isNaN(Number(raw.healthWeightInventory ?? raw.inventoryHealthWeight)) && Number(raw.healthWeightInventory ?? raw.inventoryHealthWeight) >= 0 ? Number(raw.healthWeightInventory ?? raw.inventoryHealthWeight) : DEFAULT_SYSTEM_SETTINGS.healthWeightInventory,
        healthWeightSuppliers: !isNaN(Number(raw.healthWeightSuppliers ?? raw.supplierHealthWeight)) && Number(raw.healthWeightSuppliers ?? raw.supplierHealthWeight) >= 0 ? Number(raw.healthWeightSuppliers ?? raw.supplierHealthWeight) : DEFAULT_SYSTEM_SETTINGS.healthWeightSuppliers,
        supplierHealthWeight: !isNaN(Number(raw.healthWeightSuppliers ?? raw.supplierHealthWeight)) && Number(raw.healthWeightSuppliers ?? raw.supplierHealthWeight) >= 0 ? Number(raw.healthWeightSuppliers ?? raw.supplierHealthWeight) : DEFAULT_SYSTEM_SETTINGS.healthWeightSuppliers,
        healthWeightShipments: !isNaN(Number(raw.healthWeightShipments ?? raw.logisticsHealthWeight)) && Number(raw.healthWeightShipments ?? raw.logisticsHealthWeight) >= 0 ? Number(raw.healthWeightShipments ?? raw.logisticsHealthWeight) : DEFAULT_SYSTEM_SETTINGS.healthWeightShipments,
        logisticsHealthWeight: !isNaN(Number(raw.healthWeightShipments ?? raw.logisticsHealthWeight)) && Number(raw.healthWeightShipments ?? raw.logisticsHealthWeight) >= 0 ? Number(raw.healthWeightShipments ?? raw.logisticsHealthWeight) : DEFAULT_SYSTEM_SETTINGS.healthWeightShipments,
        currency: (raw.currency && typeof raw.currency === 'string' && raw.currency.trim()) ? raw.currency.trim() : DEFAULT_SYSTEM_SETTINGS.currency,
        timezone: (raw.timezone && typeof raw.timezone === 'string' && raw.timezone.trim()) ? raw.timezone.trim() : DEFAULT_SYSTEM_SETTINGS.timezone,
      };
      
      setSettings(normalized);
      if (normalized.currency) setCurrency(normalized.currency);
      if (normalized.timezone) setTimezone(normalized.timezone);
      rulesEngine.setSettings(normalized);
      kpiEngine.setSettings(normalized);
      return normalized;
    } catch (e) {
      console.warn('Failed to load settings', e);
      return settings;
    }
  };

  useEffect(() => {
    const initializeStore = async () => {
      try {
        const storedMode = await db.metadata.getItem<string>('dataMode').catch(() => 'demo');
        const mode: 'demo' | 'real' = storedMode === 'real' ? 'real' : 'demo';
        setDataMode(mode);
        
        await loadSettings();
        
        const userProfiles = await loadData<UserProfile>(db.userProfile);
        const orgProfiles = await loadData<OrganizationProfile>(db.organizationProfile);
        
        if (userProfiles && userProfiles.length > 0) {
          setUserProfile(userProfiles[0]);
        }
        
        if (orgProfiles && orgProfiles.length > 0) {
          setOrganizationProfile(orgProfiles[0]);
        }

        if (mode === 'real') {
          await loadRealData();
        } else {
          loadDemoData();
        }
      } catch (error) {
        console.error("Failed to initialize store", error);
        try {
          loadDemoData();
        } catch (demoErr) {
          console.error("Failed to load fallback demo data", demoErr);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStore().catch(err => {
      console.error("Critical store init failure:", err);
      setIsInitializing(false);
    });
  }, []);

  const loadDemoData = () => {
    const clonedProducts = [...(demoData.demoProducts as Product[])];
    const clonedWarehouses = [...(demoData.demoWarehouses as Warehouse[])];
    const clonedInventory = [...(demoData.demoInventory as Inventory[])];
    const clonedSuppliers = [...(demoData.demoSuppliers as Supplier[])];
    const clonedPurchaseOrders = [...(demoData.demoPurchaseOrders as PurchaseOrder[])];
    const clonedShipments = [...(demoData.demoShipments as Shipment[])];
    const clonedExceptions = [...(demoData.demoExceptions as Exception[])];

    setProducts(clonedProducts);
    setWarehouses(clonedWarehouses);
    setInventory(clonedInventory);
    setSuppliers(clonedSuppliers);
    setPurchaseOrders(clonedPurchaseOrders);
    setShipments(clonedShipments);
    setExceptions(clonedExceptions);

    // Reset extended operational models
    setCustomers([...demoCustomers]);
    setCustomerOrders([...demoCustomerOrders]);
    setCarriers([...demoCarriers]);
    setRoutes([...demoRoutes]);
    setWarehouseDetails([...demoWarehouseDetails]);
    setContracts([...demoContracts]);
    setDocuments([...demoDocuments]);
    setSupplierCommunications([...demoSupplierCommunications]);
    setKpiRecords([...demoKpis]);

    dataEngine.setData({
      products: clonedProducts,
      warehouses: clonedWarehouses,
      inventory: clonedInventory,
      suppliers: clonedSuppliers,
      purchaseOrders: clonedPurchaseOrders,
      shipments: clonedShipments,
      exceptions: clonedExceptions
    });
    rulesEngine.evaluateAllRules(); // Read back exceptions in case Rules Engine generated new ones
    const evaluatedExceptions = dataEngine.getExceptions();
    setExceptions([...evaluatedExceptions]);
    
    setActions(ActionEngine.generateActions(evaluatedExceptions, [], clonedInventory, clonedPurchaseOrders, clonedShipments, clonedSuppliers));
    const newDecisions = evaluatedExceptions.map(ex => DecisionEngine.generateDecisionFromException(ex, clonedInventory, clonedPurchaseOrders, clonedShipments, clonedSuppliers)).filter(Boolean) as Decision[];
    setDecisions(newDecisions);
    setAuditEvents([]);
    setImportHistory([]); };
  
  const switchToDemoData = async () => {
    try {
      setDataMode('demo');
      await db.metadata.setItem('dataMode', 'demo').catch(() => {});
      loadDemoData();
    } catch (err) {
      console.warn('Switch to demo data error:', err);
    }
  };

  const switchToRealData = async () => {
    setIsInitializing(true);
    try {
      setDataMode('real');
      await db.metadata.setItem('dataMode', 'real').catch(() => {});
      
      // Load from DB
      const loadedProducts = (await loadData(db.products) as Product[]) || [];
      const loadedWarehouses = (await loadData(db.warehouses) as Warehouse[]) || [];
      const loadedInventory = (await loadData(db.inventory) as Inventory[]) || [];
      const loadedSuppliers = (await loadData(db.suppliers) as Supplier[]) || [];
      const loadedPOs = (await loadData(db.purchaseOrders) as PurchaseOrder[]) || [];
      const loadedShipments = (await loadData(db.shipments) as Shipment[]) || [];
      const loadedExceptions = (await loadData(db.exceptions) as Exception[]) || [];
      const loadedActions = (await loadData(db.actions) as Action[]) || [];
      const loadedDecisions = (await loadData(db.decisions) as Decision[]) || [];
      const loadedAuditEvents = (await loadData(db.auditEvents) as DecisionAuditEvent[]) || [];
      const loadedHistory = (await loadData(db.importHistory) as ImportHistory[]) || [];
      
      setProducts(loadedProducts);
      setWarehouses(loadedWarehouses);
      setInventory(loadedInventory);
      setSuppliers(loadedSuppliers);
      setPurchaseOrders(loadedPOs);
      setShipments(loadedShipments);
      setExceptions(loadedExceptions);
      setActions(loadedActions);
      setDecisions(loadedDecisions);
      setAuditEvents(loadedAuditEvents);
      setImportHistory(loadedHistory);

      const loadedCustomers = (await loadData(db.customers) as Customer[]) || [];
      if (loadedCustomers.length > 0) setCustomers(loadedCustomers);
      const loadedOrders = (await loadData(db.customerOrders) as CustomerOrder[]) || [];
      if (loadedOrders.length > 0) setCustomerOrders(loadedOrders);
      const loadedCarriers = (await loadData(db.carriers) as Carrier[]) || [];
      if (loadedCarriers.length > 0) setCarriers(loadedCarriers);
      const loadedRoutes = (await loadData(db.routes) as Route[]) || [];
      if (loadedRoutes.length > 0) setRoutes(loadedRoutes);
      const loadedContracts = (await loadData(db.contracts) as Contract[]) || [];
      if (loadedContracts.length > 0) setContracts(loadedContracts);
      const loadedDocs = (await loadData(db.documents) as DocumentRecord[]) || [];
      if (loadedDocs.length > 0) setDocuments(loadedDocs);
      const loadedComms = (await loadData(db.supplierCommunications) as SupplierCommunication[]) || [];
      if (loadedComms.length > 0) setSupplierCommunications(loadedComms);
      const loadedWarehouseDetails = (await loadData(db.warehouseDetails) as WarehouseDetail[]) || [];
      if (loadedWarehouseDetails.length > 0) setWarehouseDetails(loadedWarehouseDetails);

      dataEngine.setData({
        products: loadedProducts,
        warehouses: loadedWarehouses,
        inventory: loadedInventory,
        suppliers: loadedSuppliers,
        purchaseOrders: loadedPOs,
        shipments: loadedShipments,
        exceptions: loadedExceptions
      });
      rulesEngine.evaluateAllRules(); // Read back exceptions in case Rules Engine generated new ones
      const evaluatedExceptions = dataEngine.getExceptions();
      setExceptions([...evaluatedExceptions]);
      
      setActions(ActionEngine.generateActions(evaluatedExceptions, loadedActions, loadedInventory, loadedPOs, loadedShipments, loadedSuppliers));
    } catch (err) {
      console.warn('Switch to real data error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const updateData = async (key: keyof Omit<SupplyChainState, 'loadDemoData' | 'updateData' | 'currency' | 'dataMode' | 'isInitializing' | 'switchToDemoData' | 'switchToRealData' | 'importData' | 'settings' | 'updateSettings' | 'approveAction' | 'executeAction' | 'cancelAction' | 'approveDecision' | 'rejectDecision'>, data: any[]) => {
    if (key === 'products') setProducts(data);
    if (key === 'warehouses') setWarehouses(data);
    if (key === 'inventory') setInventory(data);
    if (key === 'suppliers') setSuppliers(data);
    if (key === 'purchaseOrders') setPurchaseOrders(data);
    if (key === 'shipments') setShipments(data);
    if (key === 'exceptions') setExceptions(data);
    if (key === 'actions') setActions(data);
    if (key === 'decisions') setDecisions(data);
    if (key === 'auditEvents') setAuditEvents(data);
    if (key === 'importHistory') setImportHistory(data);
    
    await saveData((db as any)[key], data);
  };

  const importData = async (entityType: string, newRecords: any[], filename: string, metrics = { total: newRecords.length, failed: 0, warnings: 0 }) => {
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

    const normType = entityType.toLowerCase().replace(/[-_]/g, '');
    if (normType === 'inventory' || normType === 'inv') updatedInventory = upsert(updatedInventory, newRecords);
    if (normType === 'suppliers' || normType === 'supplier') updatedSuppliers = upsert(updatedSuppliers, newRecords);
    if (normType === 'purchaseorders' || normType === 'purchaseorder' || normType === 'po' || normType === 'pos') updatedPOs = upsert(updatedPOs, newRecords);
    if (normType === 'shipments' || normType === 'shipment') updatedShipments = upsert(updatedShipments, newRecords);
    if (normType === 'products' || normType === 'product') updatedProducts = upsert(updatedProducts, newRecords);
    if (normType === 'warehouses' || normType === 'warehouse') updatedWarehouses = upsert(updatedWarehouses, newRecords);

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
        totalRows: metrics.total,
        successfulRows: newRecords.length,
        failedRows: metrics.failed,
        warnings: metrics.warnings,
        importedAt: new Date().toISOString(),
        status: metrics.failed > 0 && newRecords.length === 0 ? 'Failed' : (metrics.failed > 0 || metrics.warnings > 0) ? 'Success with warnings' : 'Success'
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
    
    const newActions = ActionEngine.generateActions(newExceptions, actions, updatedInventory, updatedPOs, updatedShipments, updatedSuppliers);
    const newDecisions = newExceptions.map(ex => DecisionEngine.generateDecisionFromException(ex, updatedInventory, updatedPOs, updatedShipments, updatedSuppliers)).filter(Boolean) as Decision[];
    setActions(newActions as Action[]);
    setDecisions(newDecisions);
    setImportHistory(newImportHistory);
    
    await saveData(db.products, updatedProducts);
    await saveData(db.warehouses, updatedWarehouses);
    await saveData(db.inventory, updatedInventory);
    await saveData(db.suppliers, updatedSuppliers);
    await saveData(db.purchaseOrders, updatedPOs);
    await saveData(db.shipments, updatedShipments);
    await saveData(db.exceptions, newExceptions);
    if (typeof newActions !== 'undefined') await saveData(db.actions, newActions);
    await saveData(db.decisions, newDecisions);
    await saveData(db.importHistory, newImportHistory);
    
    setIsInitializing(false);
  };

  const updateSettings = async (newSettings: Partial<SystemSettings> | any) => {
    const merged = { ...settings, ...newSettings };
    const normalized = normalizeSettings(merged);
    setSettings(normalized);
    if (normalized.currency) setCurrency(normalized.currency);
    if (normalized.timezone) setTimezone(normalized.timezone);

    try {
      localStorage.setItem('orion_settings', JSON.stringify(normalized));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }
    await db.settings.setItem('config', normalized);
    
    // Propagate to core system engines
    rulesEngine.setSettings(normalized);
    kpiEngine.setSettings(normalized);

    // Recalculate exceptions with new thresholds
    const newExceptions = ExceptionEngine.generateExceptions(inventory, suppliers, purchaseOrders, shipments, normalized, exceptions);
    setExceptions(newExceptions);
    const newActs = ActionEngine.generateActions(newExceptions, actions, inventory, purchaseOrders, shipments, suppliers);
    const newDecisions = newExceptions.map(ex => DecisionEngine.generateDecisionFromException(ex, inventory, purchaseOrders, shipments, suppliers)).filter(Boolean) as Decision[];
    setActions(newActs);
    setDecisions(newDecisions);

    // Trigger rule re-evaluations and KPI updates
    rulesEngine.evaluateAllRules();
    kpiEngine.calculateKPIs();

    await saveData(db.actions, newActs);
    await saveData(db.decisions, newDecisions);
    await saveData(db.exceptions, newExceptions);
  };

  const updateUserProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    await saveData(db.userProfile, [profile]);
    if (organizationProfile) {
      
    }
  };

  const updateOrganizationProfile = async (profile: OrganizationProfile) => {
    setOrganizationProfile(profile);
    await saveData(db.organizationProfile, [profile]);
    if (userProfile) {
      
    }
  };


  
  const approveAction = (actionId: string) => {
    let targetAction: Action | undefined;
    setActions(prev => {
      const next = prev.map(a => {
        if (a.id === actionId) {
          targetAction = { ...a, status: 'APPROVED' as const };
          return targetAction;
        }
        return a;
      });
      saveData(db.actions, next);
      return next;
    });

    const audit = AuditService.createEvent(
      actionId,
      'ACTION_APPROVED',
      userProfile?.fullName || 'Platform Operator',
      { actionId, recommendation: targetAction?.recommendation || actionId, status: 'APPROVED' }
    );
    setAuditEvents(prev => {
      const next = [audit, ...prev];
      saveData(db.auditEvents, next);
      return next;
    });
  };

  const executeAction = (actionId: string) => {
    const targetAction = actions.find(a => a.id === actionId);
    if (!targetAction) return;

    // 1. Update action status to EXECUTED
    setActions(prev => {
      const next = prev.map(a => 
        a.id === actionId ? { ...a, status: 'EXECUTED' as const } : a
      );
      saveData(db.actions, next);
      return next;
    });

    // 2. Perform operational state mutations on affected entity
    const entityId = targetAction.entity || '';
    const recLower = (targetAction.recommendation || '').toLowerCase();
    const issueLower = (targetAction.issue || '').toLowerCase();

    // Purchase Order mutations
    if (entityId.startsWith('PO-') || recLower.includes('po') || recLower.includes('expedite') || issueLower.includes('po')) {
      setPurchaseOrders(prev => {
        const next = prev.map(po => {
          if (po.id === entityId || recLower.includes(po.id.toLowerCase())) {
            return {
              ...po,
              status: (po.status === 'Draft' ? 'Approved' : 'In Transit') as PurchaseOrder['status']
            };
          }
          return po;
        });
        saveData(db.purchaseOrders, next);
        return next;
      });
    }

    // Inventory mutations
    if (entityId.startsWith('INV-') || recLower.includes('transfer') || recLower.includes('reorder') || recLower.includes('stock')) {
      setInventory(prev => {
        const next = prev.map(inv => {
          if (inv.id === entityId || inv.productId === entityId || recLower.includes(inv.productId.toLowerCase())) {
            return {
              ...inv,
              onHand: inv.onHand + Math.max(50, (inv as any).reorderQuantity || 100),
              safetyStock: Math.max(inv.safetyStock, 25)
            };
          }
          return inv;
        });
        saveData(db.inventory, next);
        return next;
      });
    }

    // Shipment mutations
    if (entityId.startsWith('SHP-') || recLower.includes('carrier') || recLower.includes('reroute') || recLower.includes('freight')) {
      setShipments(prev => {
        const next = prev.map(shp => {
          if (shp.id === entityId || recLower.includes(shp.id.toLowerCase())) {
            return {
              ...shp,
              delayDays: 0,
              status: 'In Transit' as const
            };
          }
          return shp;
        });
        saveData(db.shipments, next);
        return next;
      });
    }

    // Resolve matching exception
    setExceptions(prev => {
      const next = prev.map(ex => {
        if (ex.entityId === entityId || ex.id === entityId || ex.id === targetAction.id) {
          return {
            ...ex,
            status: 'Resolved' as const
          };
        }
        return ex;
      });
      saveData(db.exceptions, next);
      return next;
    });

    // 3. Log persistent execution audit event
    const audit = AuditService.createEvent(
      actionId,
      'ACTION_EXECUTED',
      userProfile?.fullName || 'Platform Operator',
      {
        actionId,
        entity: targetAction.entity,
        recommendation: targetAction.recommendation,
        impact: targetAction.impact,
        executedAt: new Date().toISOString()
      }
    );
    setAuditEvents(prev => {
      const next = [audit, ...prev];
      saveData(db.auditEvents, next);
      return next;
    });
  };

  const cancelAction = (actionId: string) => {
    const targetAction = actions.find(a => a.id === actionId);
    setActions(prev => {
      const next = prev.map(a => 
        a.id === actionId ? { ...a, status: 'CANCELLED' as const } : a
      );
      saveData(db.actions, next);
      return next;
    });

    const audit = AuditService.createEvent(
      actionId,
      'ACTION_CANCELLED',
      userProfile?.fullName || 'Platform Operator',
      { actionId, title: targetAction?.recommendation || actionId, status: 'CANCELLED' }
    );
    setAuditEvents(prev => {
      const next = [audit, ...prev];
      saveData(db.auditEvents, next);
      return next;
    });
  };

  const approveDecision = (decisionId: string, optionId: string, user: string, comment?: string) => {
    const targetDecision = decisions.find(d => d.id === decisionId);
    const selectedOption = targetDecision?.options?.find(o => o.id === optionId) || targetDecision?.options?.[0];

    // 1. Update Decision status & approval record
    setDecisions(prev => {
      const next = prev.map(d => {
        if (d.id === decisionId) {
          return {
            ...d,
            status: 'APPROVED' as const,
            approval: {
              approvedBy: user,
              approvedAt: new Date().toISOString(),
              decisionId,
              selectedOptionId: optionId,
              comment: comment || 'Approved via Decision Center'
            },
            auditTrail: [
              ...(d.auditTrail || []),
              `[${new Date().toISOString()}] Approved by ${user}. Option: ${selectedOption?.name || optionId}. Rationale: ${comment || 'Standard approval'}`
            ]
          };
        }
        return d;
      });
      saveData(db.decisions, next);
      return next;
    });

    // 2. Operational state consequences
    if (targetDecision) {
      const entityId = targetDecision.entityId;
      const optDesc = (selectedOption?.description || selectedOption?.name || '').toLowerCase();

      if (entityId.startsWith('PO-') || optDesc.includes('po') || optDesc.includes('expedite')) {
        setPurchaseOrders(prev => {
          const next = prev.map(po => po.id === entityId ? { ...po, status: 'In Transit' as const } : po);
          saveData(db.purchaseOrders, next);
          return next;
        });
      }

      if (entityId.startsWith('INV-') || optDesc.includes('transfer') || optDesc.includes('stock')) {
        setInventory(prev => {
          const next = prev.map(inv => (inv.id === entityId || inv.productId === entityId) ? { ...inv, onHand: inv.onHand + 100 } : inv);
          saveData(db.inventory, next);
          return next;
        });
      }

      if (entityId.startsWith('SHP-') || optDesc.includes('reroute') || optDesc.includes('freight')) {
        setShipments(prev => {
          const next = prev.map(shp => shp.id === entityId ? { ...shp, delayDays: 0, status: 'In Transit' as const } : shp);
          saveData(db.shipments, next);
          return next;
        });
      }

      setExceptions(prev => {
        const next = prev.map(ex => (ex.entityId === entityId || ex.id === entityId) ? { ...ex, status: 'Resolved' as const } : ex);
        saveData(db.exceptions, next);
        return next;
      });
    }

    // 3. Persistent audit event
    const audit = AuditService.createEvent(
      decisionId,
      'APPROVED',
      user,
      {
        decisionId,
        title: targetDecision?.title,
        optionId,
        optionName: selectedOption?.name,
        comment: comment || 'Approved decision option'
      }
    );
    setAuditEvents(prev => {
      const next = [audit, ...prev];
      saveData(db.auditEvents, next);
      return next;
    });
  };

  const rejectDecision = (decisionId: string, user: string, comment?: string) => {
    const targetDecision = decisions.find(d => d.id === decisionId);
    setDecisions(prev => {
      const next = prev.map(d => {
        if (d.id === decisionId) {
          return {
            ...d,
            status: 'REJECTED' as const,
            approval: {
              approvedBy: user,
              approvedAt: new Date().toISOString(),
              decisionId,
              selectedOptionId: '',
              comment: comment || 'Rejected by operator'
            },
            auditTrail: [
              ...(d.auditTrail || []),
              `[${new Date().toISOString()}] Rejected by ${user}. Rationale: ${comment || 'Declined'}`
            ]
          };
        }
        return d;
      });
      saveData(db.decisions, next);
      return next;
    });

    const audit = AuditService.createEvent(
      decisionId,
      'REJECTED',
      user,
      {
        decisionId,
        title: targetDecision?.title,
        comment: comment || 'Rejected decision'
      }
    );
    setAuditEvents(prev => {
      const next = [audit, ...prev];
      saveData(db.auditEvents, next);
      return next;
    });
  };

  // Extended Operational Handlers with DB Persistence
  const addSupplierCommunication = (comm: Omit<SupplierCommunication, 'id'>) => {
    const newComm: SupplierCommunication = {
      ...comm,
      id: `COMM-${Date.now()}`
    };
    setSupplierCommunications(prev => {
      const next = [newComm, ...prev];
      saveData(db.supplierCommunications, next);
      return next;
    });
  };

  const approveSupplierCommunication = (commId: string) => {
    setSupplierCommunications(prev => {
      const next = prev.map(c => c.id === commId ? { ...c, status: 'APPROVED' as const } : c);
      saveData(db.supplierCommunications, next);
      return next;
    });
  };

  const dispatchSupplierCommunication = (commId: string) => {
    setSupplierCommunications(prev => {
      const next = prev.map(c => c.id === commId ? {
        ...c,
        status: 'DISPATCHED' as const,
        sentAt: new Date().toISOString(),
        sentBy: userProfile ? userProfile.fullName : 'SC Operations'
      } : c);
      saveData(db.supplierCommunications, next);
      return next;
    });
  };

  const addDocumentRecord = (doc: DocumentRecord) => {
    setDocuments(prev => {
      const next = [doc, ...prev];
      saveData(db.documents, next);
      return next;
    });
  };

  const updateContract = (contractId: string, updates: Partial<Contract>) => {
    setContracts(prev => {
      const next = prev.map(c => c.id === contractId ? { ...c, ...updates } : c);
      saveData(db.contracts, next);
      return next;
    });
  };

  const updateCustomerOrder = (orderId: string, updates: Partial<CustomerOrder>) => {
    setCustomerOrders(prev => {
      const next = prev.map(o => o.id === orderId ? { ...o, ...updates } : o);
      saveData(db.customerOrders, next);
      return next;
    });
  };

  const repairDataQuality = async (repairs: Array<{ entityType: string; id: string; fixes: Record<string, any> }>) => {
    for (const repair of repairs) {
      if (repair.entityType === 'inventory') {
        setInventory(prev => {
          const next = prev.map(inv => inv.id === repair.id ? { ...inv, ...repair.fixes } : inv);
          saveData(db.inventory, next);
          return next;
        });
      } else if (repair.entityType === 'purchaseOrders') {
        setPurchaseOrders(prev => {
          const next = prev.map(po => po.id === repair.id ? { ...po, ...repair.fixes } : po);
          saveData(db.purchaseOrders, next);
          return next;
        });
      } else if (repair.entityType === 'shipments') {
        setShipments(prev => {
          const next = prev.map(shp => shp.id === repair.id ? { ...shp, ...repair.fixes } : shp);
          saveData(db.shipments, next);
          return next;
        });
      } else if (repair.entityType === 'suppliers') {
        setSuppliers(prev => {
          const next = prev.map(sup => sup.id === repair.id ? { ...sup, ...repair.fixes } : sup);
          saveData(db.suppliers, next);
          return next;
        });
      }
    }

    const audit = AuditService.createEvent(
      `DQ-${Date.now()}`,
      'DATA_QUALITY_REPAIR',
      userProfile?.fullName || 'System Auditor',
      { repairsCount: repairs.length, repairs }
    );
    setAuditEvents(prev => {
      const next = [audit, ...prev];
      saveData(db.auditEvents, next);
      return next;
    });
  };

  const value = useMemo(() => ({
    products,
    warehouses,
    inventory,
    suppliers,
    purchaseOrders,
    shipments,
    exceptions,
    actions,
    decisions,
    auditEvents,
    importHistory,
    userProfile,
    organizationProfile,

    // Extended Operational Models
    customers,
    customerOrders,
    carriers,
    routes,
    warehouseDetails,
    contracts,
    documents,
    supplierCommunications,
    kpiRecords,
    
    currency,
    timezone,
    dataMode,
    isInitializing,
    switchToDemoData,
    switchToRealData,
    updateData,
    importData,
    updateUserProfile,
    updateOrganizationProfile,
    settings,
    updateSettings,
    approveAction,
    executeAction,
    cancelAction,
    approveDecision,
    rejectDecision,

    // Extended Operational Handlers
    addSupplierCommunication,
    approveSupplierCommunication,
    dispatchSupplierCommunication,
    addDocumentRecord,
    updateContract,
    updateCustomerOrder,
    repairDataQuality
  }), [
    products, warehouses, inventory, suppliers, purchaseOrders, shipments, exceptions,
    importHistory, userProfile, organizationProfile, currency, timezone, dataMode, isInitializing,
    settings, actions, decisions, auditEvents, customers, customerOrders, carriers,
    routes, warehouseDetails, contracts, documents, supplierCommunications, kpiRecords
  ]);

  
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
