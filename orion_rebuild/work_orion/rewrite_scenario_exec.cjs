const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Scenarios.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /setTimeout\(\(\) => \{\n      try \{\n[\s\S]*?\} catch \(e\) \{\n        console\.error\('Simulation error:', e\);\n        showToast\('Simulation failed', 'error'\);\n      \}\n    \}, 1200\);/m;

const newBlock = `setTimeout(() => {
      try {
        const result = ScenarioEngine.runScenario(
           activeScenario.type,
           activeScenario.params,
           inventory,
           purchaseOrders,
           shipments,
           suppliers
        );

        setSimulationResults(prev => ({
          ...prev,
          [activeScenario.id]: {
            scenarioId: activeScenario.id,
            scenarioName: activeScenario.name,
            executedAt: new Date().toISOString(),
            affectedInventory: [], // Left blank for now or populate if needed
            affectedPos: [],
            affectedShipments: [],
            financialExposure: result.financialExposure,
            riskIncreasePercent: result.riskChange === 'Increased' ? Math.round(result.exposureDelta / (result.baseExposure || 1) * 100) || 15 : 0,
            affectedSkusCount: result.affectedSkus,
            affectedPosCount: result.affectedPos,
            newStockoutsCount: result.projectedStockouts,
            status: 'COMPLETE'
          }
        }));
        showToast('Simulation complete.', 'success', 'Scenario Engine');
        setIsExecuting(false);
      } catch (e) {
        console.error('Simulation error:', e);
        showToast('Simulation failed', 'error');
        setIsExecuting(false);
      }
    }, 1200);`;

content = content.replace(regex, newBlock);

fs.writeFileSync(file, content);
console.log("handleExecute updated");
