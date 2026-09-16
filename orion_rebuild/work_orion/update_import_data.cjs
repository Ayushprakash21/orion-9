const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');

const importDataRegex = /const importData = async \([^)]+\) => \{[\s\S]*?setIsInitializing\(false\);\n  \};/;

const newImportData = `const importData = async (entityType: string, newRecords: any[], filename: string, warningsCount: number = 0) => {
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
  };`;

code = code.replace(importDataRegex, newImportData);

fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
