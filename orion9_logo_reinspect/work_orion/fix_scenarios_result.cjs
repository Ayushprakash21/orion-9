const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Scenarios.tsx');
let content = fs.readFileSync(file, 'utf8');

const regexType = /export interface SimulationResult \{\n  scenarioId: string;\n  scenarioName: string;\n  executedAt: string;\n  affectedSkusCount: number;\n  affectedPosCount: number;\n  newStockoutsCount: number;\n  financialExposure: number;\n  riskIncreasePercent: number;\n  affectedInventory: any\[\];\n  affectedPos: any\[\];\n  affectedShipments: any\[\];\n  status: 'PENDING' \| 'COMPLETE';\n\}/m;

const typeReplacement = `export interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  executedAt: string;
  affectedSkusCount: number;
  affectedPosCount: number;
  baseStockouts: number;
  newStockoutsCount: number;
  baseExposure: number;
  financialExposure: number;
  exposureDelta: number;
  riskIncreasePercent: number;
  affectedInventory: any[];
  affectedPos: any[];
  affectedShipments: any[];
  status: 'PENDING' | 'COMPLETE';
}`;
content = content.replace(regexType, typeReplacement);

const regexResult = /        const result: SimulationResult = \{\n          scenarioId: activeScenario\.id,\n          scenarioName: activeScenario\.name,\n          executedAt: new Date\(\)\.toLocaleTimeString\(\),\n          affectedSkusCount: affectedSkus,\n          affectedPosCount: affectedPos,\n          newStockoutsCount: newStockouts,\n          financialExposure,\n          riskIncreasePercent: riskIncrease,\n          affectedInventory: affectedInvList,\n          affectedPos: affectedPoList,\n          affectedShipments: affectedShpList,\n          status: 'COMPLETE'\n        \};/m;

const resultReplacement = `
        const result: SimulationResult = {
          scenarioId: activeScenario.id,
          scenarioName: activeScenario.name,
          executedAt: new Date().toLocaleTimeString(),
          affectedSkusCount: affectedSkus,
          affectedPosCount: affectedPos,
          baseStockouts: engineResult.baseStockouts,
          newStockoutsCount: newStockouts,
          baseExposure: engineResult.baseExposure,
          financialExposure,
          exposureDelta: engineResult.exposureDelta,
          riskIncreasePercent: riskIncrease,
          affectedInventory: affectedInvList,
          affectedPos: affectedPoList,
          affectedShipments: affectedShpList,
          status: 'COMPLETE'
        };
`;
content = content.replace(regexResult, resultReplacement);

const uiRegex = /<div className="flex justify-between items-center pb-2 border-b border-\[#2A2A2A\]">\s*<span className="text-\[#777777\]">New Projected Stock-Outs<\/span>\s*<span className="font-mono text-\[#FF453A\] font-medium">\{res\.newStockoutsCount\}<\/span>\s*<\/div>\s*<div className="flex justify-between items-center pb-2 border-b border-\[#2A2A2A\]">\s*<span className="text-\[#777777\]">Financial Exposure Increase<\/span>\s*<span className="font-mono text-\[#FF453A\] font-medium">\{formatCurrency\(res\.financialExposure, currency\)\}<\/span>\s*<\/div>/m;

const uiReplacement = `
                  <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
                    <span className="text-[#777777]">Base Stock-Outs</span>
                    <span className="font-mono text-[#F5F5F5] font-medium">{res.baseStockouts}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
                    <span className="text-[#777777]">Projected Stock-Outs</span>
                    <span className={\`font-mono font-medium \${res.newStockoutsCount > res.baseStockouts ? 'text-[#FF453A]' : 'text-[#F5F5F5]'}\`}>{res.newStockoutsCount}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
                    <span className="text-[#777777]">Base Exposure</span>
                    <span className="font-mono text-[#F5F5F5] font-medium">{formatCurrency(res.baseExposure, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
                    <span className="text-[#777777]">Projected Exposure</span>
                    <span className="font-mono text-[#FF453A] font-medium">{formatCurrency(res.financialExposure, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2A]">
                    <span className="text-[#777777]">Exposure Delta</span>
                    <span className={\`font-mono font-medium \${res.exposureDelta > 0 ? 'text-[#FF453A]' : res.exposureDelta < 0 ? 'text-[#30D158]' : 'text-[#F5F5F5]'}\`}>
                      {res.exposureDelta > 0 ? '+' : ''}{formatCurrency(res.exposureDelta, currency)}
                    </span>
                  </div>
`;
content = content.replace(uiRegex, uiReplacement);

fs.writeFileSync(file, content);
console.log("Scenarios updated");
