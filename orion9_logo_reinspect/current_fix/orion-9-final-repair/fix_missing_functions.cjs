const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');

const missingFuncs = `
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
`;

const insertPos = code.indexOf('  const importData = async');
code = code.substring(0, insertPos) + missingFuncs + '\n' + code.substring(insertPos);

fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
