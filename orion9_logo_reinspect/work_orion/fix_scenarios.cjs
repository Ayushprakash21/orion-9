const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Scenarios.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /        if \(activeScenario\.type === 'Supplier Delay'\) \{[\s\S]*?        \} else \{\n          affectedInvList = inventory\.slice\(0, 5\);\n          affectedSkus = affectedInvList\.length;\n          affectedPos = 3;\n          newStockouts = 2;\n          financialExposure = 125000;\n          riskIncrease = 25;\n        \}/m;

const replacement = `
        const engineResult = ScenarioEngine.runScenario(
          activeScenario.type,
          activeScenario.params,
          inventory,
          purchaseOrders,
          shipments,
          suppliers
        );
        
        affectedSkus = engineResult.affectedSkus;
        affectedPos = engineResult.affectedPosCount;
        newStockouts = engineResult.projectedStockouts;
        financialExposure = engineResult.financialExposure;
        riskIncrease = engineResult.riskChange === 'Increased' ? 15 : 0;
        affectedInvList = engineResult.affectedInventoryList;
        affectedPoList = engineResult.affectedPosList;
        affectedShpList = []; // Set count if needed
`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Scenarios updated");
