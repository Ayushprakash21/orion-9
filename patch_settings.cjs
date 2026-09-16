const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// The type SystemSettings has:
// lowStockDays
// excessInventoryDays
// criticalStockOutDays

// Instead of healthyStockDays, highDemandThreshold, delayedDeliveryHours, riskToleranceScore

code = code.replace(/<input name="healthyStockDays" value=\{localSettings\.healthyStockDays \?\? ''\}/g, '<input name="lowStockDays" value={localSettings.lowStockDays ?? \'\'}');
code = code.replace(/Healthy Stock \(Days\)/g, 'Low Stock (Days)');

code = code.replace(/<input name="highDemandThreshold" value=\{localSettings\.highDemandThreshold \?\? ''\}/g, '<input name="excessInventoryDays" value={localSettings.excessInventoryDays ?? \'\'}');
code = code.replace(/High Demand \(Units\/Day\)/g, 'Excess Inventory (Days)');

code = code.replace(/<input name="delayedDeliveryHours" value=\{localSettings\.delayedDeliveryHours \?\? ''\}/g, '<input name="shipmentDelayAlertDays" value={localSettings.shipmentDelayAlertDays ?? \'\'}');
code = code.replace(/Delayed Delivery \(Hours\)/g, 'Shipment Delay Alert (Days)');

code = code.replace(/<input name="riskToleranceScore" value=\{localSettings\.riskToleranceScore \?\? ''\}/g, '<input name="supplierHighRiskThreshold" value={localSettings.supplierHighRiskThreshold ?? \'\'}');
code = code.replace(/Risk Tolerance \(0-100\)/g, 'Supplier High Risk Threshold');

fs.writeFileSync('src/components/Settings.tsx', code);
