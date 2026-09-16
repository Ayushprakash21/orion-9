const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/SupplierDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Truck, ShieldAlert, BrainCircuit, CheckCircle2 } from 'lucide-react';", "import { Truck, ShieldAlert, BrainCircuit, CheckCircle2 } from 'lucide-react';\nimport { SupplierRiskEngine } from '../../services/SupplierRiskEngine';\nimport { InventoryEngine } from '../../services/InventoryEngine';");

const riskRegex = /const supExceptions = useMemo\(\(\) => exceptions.filter\(e => e.entityId === id \|\| supPOs.some\(po => po.id === e.entityId\)\), \[exceptions, id, supPOs\]\);/m;

const riskReplacement = `
  const { inventory } = useSupplyChain();
  const supExceptions = useMemo(() => exceptions.filter(e => e.entityId === id || supPOs.some(po => po.id === e.entityId)), [exceptions, id, supPOs]);
  const supplierRisk = useMemo(() => SupplierRiskEngine.calculateSupplierRisk(supplier, purchaseOrders, shipments, exceptions, inventory), [supplier, purchaseOrders, shipments, exceptions, inventory]);
`;

content = content.replace(riskRegex, riskReplacement);

const overviewTabRegex = /<div className="bg-\[#111111\] p-3 rounded-lg border border-\[#2A2A2A\]">\s*<div className="text-\[10px\] uppercase font-mono text-\[#777777\] mb-1">Status<\/div>\s*<div className="text-base font-mono text-\[#F5F5F5\]">\{supplier\.status \|\| 'Active'\}<\/div>\s*<\/div>/m;

const overviewTabReplacement = `
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Risk Level</div>
            <div className={\`text-base font-mono \${supplierRisk.riskLevel === 'CRITICAL' ? 'text-[#FF453A]' : supplierRisk.riskLevel === 'HIGH' ? 'text-[#FF9F0A]' : 'text-[#30D158]'}\`}>
              {supplierRisk.riskLevel}
            </div>
          </div>
`;
content = content.replace(overviewTabRegex, overviewTabReplacement);

const aiTabRegex = /<div className="text-xs text-\[#B3B3B3\] space-y-2">\s*<p>Supplier <span className="text-\[#F5F5F5\]">\{supplier\.name\}<\/span> is currently maintaining a <span className="text-\[#F5F5F5\]">\{supplier\.otif\}%<\/span> OTIF rate with <span className="text-\[#F5F5F5\]">\{supExceptions\.length\}<\/span> active exceptions\.<\/p>\s*<p>Quality ratings remain at <span className="text-\[#F5F5F5\]">\{supplier\.qualityRate\}%<\/span> with an average lead time of <span className="text-\[#F5F5F5\]">\{supplier\.leadTime\} days<\/span>\.<\/p>\s*<p>Overall Risk Assessment: <span className="text-\[#30D158\]">\{supplier\.riskLevel \|\| 'Low'\}<\/span><\/p>\s*<\/div>/m;

const aiTabReplacement = `
            <div className="text-xs text-[#B3B3B3] space-y-4">
              <p>ORION Supplier Assessment for <span className="text-[#F5F5F5]">{supplier.name}</span>:</p>
              <ul className="list-disc pl-4 space-y-1 text-[#F5F5F5]">
                <li>Risk Score: {supplierRisk.score} / 100 ({supplierRisk.riskLevel})</li>
                <li>Affected SKUs: {supplierRisk.affectedSkus.length}</li>
                <li>Spend Exposure: {formatCurrency(supplierRisk.spendExposure, currency)}</li>
              </ul>
              <div>
                <p className="font-semibold text-[#FF9F0A] mb-1">Risk Drivers:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {supplierRisk.drivers.length > 0 ? supplierRisk.drivers.map((d, i) => <li key={i}>{d}</li>) : <li>No critical drivers identified.</li>}
                </ul>
              </div>
              <div className="bg-[#1B1B1B] p-3 border border-[#2A2A2A] rounded-lg">
                <span className="text-[#30D158] font-mono uppercase tracking-wider text-[10px]">Recommended Action</span>
                <p className="mt-1">{supplierRisk.recommendedAction}</p>
              </div>
            </div>
`;

content = content.replace(aiTabRegex, aiTabReplacement);

fs.writeFileSync(file, content);
console.log("Supplier UI updated");
