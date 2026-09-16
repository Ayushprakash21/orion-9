const fs = require('fs');
let code = fs.readFileSync('src/components/DataCenter.tsx', 'utf8');

// Update imports
code = code.replace(
  'const { dataMode, switchToDemoData, switchToRealData, importData, inventory, suppliers, purchaseOrders, shipments, importHistory } = useSupplyChain();',
  'const { dataMode, switchToDemoData, switchToRealData, importData, products, warehouses, inventory, suppliers, purchaseOrders, shipments, importHistory } = useSupplyChain();'
);

const newPreviewType = `{
    entityType: string;
    filename: string;
    validData: any[];
    errors: any[];
    warnings: {row: string | number, message: string}[];
    headers: string[];
  } | null`;

code = code.replace(`{
    entityType: string;
    filename: string;
    validData: any[];
    errors: any[];
    headers: string[];
  } | null`, newPreviewType);

const fkValidationLogic = `
    let warnings: {row: string | number, message: string}[] = [];

    // FOREIGN KEY VALIDATION
    if (entityType === 'inventory') {
      parsed.valid.forEach((record, index) => {
        if (!products.find(p => p.sku === record.sku)) warnings.push({ row: index + 1, message: \`WARNING: Referenced entity not found (SKU: \${record.sku})\`});
        if (!warehouses.find(w => w.id === record.warehouseId)) warnings.push({ row: index + 1, message: \`WARNING: Referenced entity not found (Warehouse: \${record.warehouseId})\`});
      });
    } else if (entityType === 'purchaseOrders') {
      parsed.valid.forEach((record, index) => {
        if (!suppliers.find(s => s.id === record.supplierId)) warnings.push({ row: record.poNumber, message: \`WARNING: Referenced entity not found (Supplier: \${record.supplierId})\`});
        record.items.forEach((item: any) => {
          if (!products.find(p => p.sku === item.sku)) warnings.push({ row: record.poNumber, message: \`WARNING: Referenced entity not found (SKU: \${item.sku})\`});
        });
        if (!warehouses.find(w => w.id === record.destinationWarehouseId)) warnings.push({ row: record.poNumber, message: \`WARNING: Referenced entity not found (Warehouse: \${record.destinationWarehouseId})\`});
      });
    } else if (entityType === 'shipments') {
      parsed.valid.forEach((record, index) => {
        if (!purchaseOrders.find(po => po.id === record.poId)) warnings.push({ row: index + 1, message: \`WARNING: Referenced entity not found (PO: \${record.poId})\`});
        if (!suppliers.find(s => s.id === record.supplierId)) warnings.push({ row: index + 1, message: \`WARNING: Referenced entity not found (Supplier: \${record.supplierId})\`});
      });
    }

    setImportPreview({
      entityType,
      filename,
      validData: parsed.valid,
      errors: parsed.errors,
      warnings,
      headers: Object.keys(rawData[0])
    });
`;

code = code.replace(`setImportPreview({
      entityType,
      filename,
      validData: parsed.valid,
      errors: parsed.errors,
      headers: Object.keys(rawData[0])
    });`, fkValidationLogic);

fs.writeFileSync('src/components/DataCenter.tsx', code);
