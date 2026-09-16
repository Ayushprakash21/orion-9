const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/ScenarioEngine.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("affectedPos: new Set(affectedPosList).size,", `affectedPosCount: new Set(affectedPosList).size,
      affectedPosList: Array.from(new Set(affectedPosList)).map(id => pos.find(p => p.id === id)).filter(Boolean),
      affectedInventoryList: inventory.filter(inv => {
        const baseMetrics = InventoryEngine.calculateMetrics(inv, pos, shipments, suppliers);
        const simMetrics = InventoryEngine.calculateMetrics(inv, simPos, simShipments, suppliers);
        if (!simMetrics || !baseMetrics) return false;
        if (type === 'Demand Spike') return true;
        return baseMetrics.projectedShortage !== simMetrics.projectedShortage || baseMetrics.stockOutDate !== simMetrics.stockOutDate;
      }),`);

fs.writeFileSync(file, content);
console.log("ScenarioEngine updated lists");
