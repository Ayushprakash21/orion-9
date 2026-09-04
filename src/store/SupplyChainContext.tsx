import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception, ImportHistory, Action, Decision, DecisionAuditEvent, UserProfile, OrganizationProfile } from '../types';
import * as demoData from '../data';
import { db, loadData, saveData, clearRealData } from '../data/db';

import { ExceptionEngine } from '../services/ExceptionEngine';
import { ActionEngine } from '../services/ActionEngine';
import { DecisionEngine } from '../services/DecisionEngine';

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
  
  currency: string;
  dataMode: 'demo' | 'real';
  isInitializing: boolean;
  
  switchToDemoData: () => Promise<void>;
  switchToRealData: () => Promise<void>;
  updateData: (key: keyof Omit<SupplyChainState, 'loadDemoData' | 'updateData' | 'currency' | 'dataMode' | 'isInitializing' | 'switchToDemoData' | 'switchToRealData' | 'importData' | 'settings' | 'updateSettings' | 'approveAction' | 'executeAction' | 'cancelAction' | 'approveDecision' | 'rejectDecision'>, data: any[]) => Promise<void>;
  importData: (entityType: string, newRecords: any[], filename: string, metrics?: { total: number; failed: number; warnings: number }) => Promise<void>;
  
  // Settings
  settings: any;
  updateSettings: (newSettings: any) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  updateOrganizationProfile: (profile: OrganizationProfile) => Promise<void>;
  approveAction: (actionId: string) => void;
  executeAction: (actionId: string) => void;
  cancelAction: (actionId: string) => void;
  approveDecision: (decisionId: string, optionId: string, user: string, comment?: string) => void;
  rejectDecision: (decisionId: string, user: string, comment?: string) => void;
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
  };

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
        
        const userProfiles = await loadData<UserProfile>(db.userProfile);
        const orgProfiles = await loadData<OrganizationProfile>(db.organizationProfile);
        
        if (userProfiles && userProfiles.length > 0) {
          setUserProfile(userProfiles[0]);
        }
        
        if (orgProfiles && orgProfiles.length > 0) {
          setOrganizationProfile(orgProfiles[0]);
        }
        
        if (userProfiles && userProfiles.length > 0 && orgProfiles && orgProfiles.length > 0) {
          
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

  const loadDemoData = () => {
    setProducts(demoData.demoProducts as Product[]);
    setWarehouses(demoData.demoWarehouses as Warehouse[]);
    setInventory(demoData.demoInventory as Inventory[]);
    setSuppliers(demoData.demoSuppliers as Supplier[]);
    setPurchaseOrders(demoData.demoPurchaseOrders as PurchaseOrder[]);
    setShipments(demoData.demoShipments as Shipment[]);
    const demoExceptions = demoData.demoExceptions as Exception[];
    setExceptions(demoExceptions);
    setActions(ActionEngine.generateActions(demoExceptions, [], demoData.demoInventory, demoData.demoPurchaseOrders, demoData.demoShipments, demoData.demoSuppliers));
    const newDecisions = demoExceptions.map(ex => DecisionEngine.generateDecisionFromException(ex, demoData.demoInventory, demoData.demoPurchaseOrders, demoData.demoShipments, demoData.demoSuppliers)).filter(Boolean) as Decision[];
    setDecisions(newDecisions);
    setAuditEvents([]);
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
    const loadedActions = await loadData(db.actions) as Action[];
    const loadedDecisions = await loadData(db.decisions) as Decision[];
    const loadedAuditEvents = await loadData(db.auditEvents) as DecisionAuditEvent[];
    const loadedHistory = await loadData(db.importHistory) as ImportHistory[];
    
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
    
    setIsInitializing(false);
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

  const updateSettings = async (newSettings: any) => {
    setSettings(newSettings);
    if (newSettings.currency) setCurrency(newSettings.currency);
    await db.settings.setItem('config', newSettings);
    
    // Recalculate exceptions with new thresholds
    const newExceptions = ExceptionEngine.generateExceptions(inventory, suppliers, purchaseOrders, shipments, newSettings, exceptions);
    setExceptions(newExceptions);
    const newActs = ActionEngine.generateActions(newExceptions, actions, inventory, purchaseOrders, shipments, suppliers);
    const newDecisions = newExceptions.map(ex => DecisionEngine.generateDecisionFromException(ex, inventory, purchaseOrders, shipments, suppliers)).filter(Boolean) as Decision[];
    setActions(newActs);
    setDecisions(newDecisions);
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
    setActions(prev => {
      const next = prev.map(a => 
       a.id === actionId ? { ...a, status: 'APPROVED' as const } : a
      );
      saveData(db.actions, next);
      return next;
    });
  };

  const executeAction = (actionId: string) => {
    setActions(prev => {
      const next = prev.map(a => 
      a.id === actionId ? { ...a, status: 'EXECUTED' as const } : a
      );
      saveData(db.actions, next);
      return next;
    });
    // showToast('Action executed successfully.', 'success', 'Action Center');
  };

  const cancelAction = (actionId: string) => {
    setActions(prev => {
      const next = prev.map(a => 
      a.id === actionId ? { ...a, status: 'CANCELLED' as const } : a
      );
      saveData(db.actions, next);
      return next;
    });
    // showToast('Action cancelled.', 'info', 'Action Center');
  };

  const approveDecision = (decisionId: string, optionId: string, user: string, comment?: string) => {
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
              comment
            }
          };
        }
        return d;
      });
      saveData(db.decisions, next);
      return next;
    });
  };

  const rejectDecision = (decisionId: string, user: string, comment?: string) => {
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
              comment
            }
          };
        }
        return d;
      });
      saveData(db.decisions, next);
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
    
    currency,
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
    rejectDecision
  }), [products, warehouses, inventory, suppliers, purchaseOrders, shipments, exceptions, importHistory, userProfile, organizationProfile,  currency, dataMode, isInitializing, settings, actions, decisions, auditEvents]);

  
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
