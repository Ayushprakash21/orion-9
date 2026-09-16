const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const servicesDir = path.join(srcDir, 'services');

// InventoryEngine.ts
const inventoryEngine = `import { Inventory } from '../types';

export class InventoryEngine {
  static calculateMetrics(inv: Inventory) {
    if (!inv) return null;
    const onHand = Math.max(0, inv.onHand || 0);
    const reserved = Math.max(0, inv.reserved || 0);
    const available = Math.max(0, onHand - reserved);
    const incoming = Math.max(0, inv.inTransit || 0);
    const safetyStock = Math.max(0, inv.safetyStock || 0);
    const reorderPoint = Math.max(0, inv.reorderPoint || 0);
    const dailyDemand = Math.max(0, inv.averageDailyDemand || 0);
    const unitCost = Math.max(0, inv.unitCost || 0);
    
    const daysOfSupply = dailyDemand > 0 ? available / dailyDemand : null;
    const inventoryValue = onHand * unitCost;
    
    const shortageQuantity = available < safetyStock ? safetyStock - available : 0;
    const excessQuantity = dailyDemand > 0 && available > dailyDemand * 60 ? available - (dailyDemand * 60) : 0;
    
    let stockOutDate = null;
    if (daysOfSupply !== null && daysOfSupply < 365) {
      const d = new Date();
      d.setDate(d.getDate() + Math.floor(daysOfSupply));
      stockOutDate = d.toISOString();
    }
    
    return {
      onHand,
      reserved,
      available,
      incoming,
      safetyStock,
      reorderPoint,
      dailyDemand,
      daysOfSupply,
      stockOutDate,
      shortageQuantity,
      excessQuantity,
      inventoryValue
    };
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'InventoryEngine.ts'), inventoryEngine);

// SupplierEngine.ts
const supplierEngine = `import { Supplier } from '../types';

export class SupplierEngine {
  static calculateScore(supplier: Supplier, settings: any) {
    if (!supplier) return { score: 0, status: 'High Risk', riskLevel: 'High' };
    
    const otifWeight = settings.supplierWeightOtif || 40;
    const qualityWeight = settings.supplierWeightQuality || 30;
    const leadTimeWeight = settings.supplierWeightLeadTime || 15;
    const riskWeight = settings.supplierWeightRisk || 15;

    const otifScore = (Math.min(100, Math.max(0, supplier.otif || 0)) / 100) * otifWeight;
    const qualityScore = (Math.min(100, Math.max(0, supplier.qualityRate || 0)) / 100) * qualityWeight;
    
    const leadTimeScore = Math.max(0, (1 - ((supplier.leadTime || 0) / 30))) * leadTimeWeight;
    const riskScore = Math.max(0, (1 - ((supplier.defectRate || 0) / 5))) * riskWeight;

    const score = Math.min(100, Math.max(0, Math.round(otifScore + qualityScore + leadTimeScore + riskScore)));
    
    let status = 'High Risk';
    if (score >= 90) status = 'Preferred';
    else if (score >= 75) status = 'Approved';
    else if (score >= 60) status = 'Watchlist';
    
    let riskLevel = 'High';
    if (score >= 80) riskLevel = 'Low';
    else if (score >= 60) riskLevel = 'Medium';

    return { score, status, riskLevel };
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'SupplierEngine.ts'), supplierEngine);

console.log("Created engines");
