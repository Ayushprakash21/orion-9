const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Scenarios.tsx');
let content = fs.readFileSync(file, 'utf8');

// I will import ScenarioEngine
content = content.replace("import { formatCurrency, formatNumber, formatPercentage } from '../lib/formatters';", "import { formatCurrency, formatNumber, formatPercentage } from '../lib/formatters';\nimport { ScenarioEngine } from '../services/ScenarioEngine';");

// find handleExecute
const oldLogic = `
        if (activeScenario.type === 'Supplier Delay') {
          const delay = activeScenario.params.delayDays || 7;
          // Dummy simulation logic for Supplier Delay
          affectedSkus = Math.floor(inventory.length * 0.4);
          affectedPos = Math.floor(purchaseOrders.length * 0.6);
          newStockouts = Math.floor(inventory.length * 0.15);
          financialExposure = 850000;
          riskIncrease = 25;
          affectedInvList = inventory.slice(0, affectedSkus);
          affectedPoList = purchaseOrders.slice(0, affectedPos);
        } else if (activeScenario.type === 'Demand Spike') {
          const surge = activeScenario.params.demandIncreasePercent || 50;
          affectedSkus = Math.floor(inventory.length * 0.8);
          affectedPos = 0;
          newStockouts = Math.floor(inventory.length * 0.3);
          financialExposure = 1200000;
          riskIncrease = 40;
          affectedInvList = inventory.slice(0, affectedSkus);
        } else if (activeScenario.type === 'Port Congestion') {
          affectedSkus = Math.floor(inventory.length * 0.2);
          affectedPos = Math.floor(purchaseOrders.length * 0.3);
          newStockouts = Math.floor(inventory.length * 0.05);
          financialExposure = 450000;
          riskIncrease = 18;
          affectedInvList = inventory.slice(0, affectedSkus);
          affectedShpList = shipments.slice(0, 5);
        }
`;

const newLogic = `
        const res = ScenarioEngine.runScenario(activeScenario.type, activeScenario.params, inventory, purchaseOrders, shipments, suppliers);
        affectedSkus = res.affectedSkus;
        newStockouts = res.projectedStockouts;
        financialExposure = res.financialExposure;
        riskIncrease = res.serviceImpact === 'High' ? 40 : 15;
`;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync(file, content);
console.log("Scenarios replaced with engine logic");
