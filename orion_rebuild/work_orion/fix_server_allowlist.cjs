const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

const filterLogic = `      try {
        const rawTools = JSON.parse(response.text || "[]");
        const allowlist = ['getInventory', 'getInventoryRisks', 'getSuppliers', 'getSupplierPerformance', 'getPurchaseOrders', 'getOverduePOs', 'getShipments', 'getDelayedShipments', 'getExceptions', 'getDashboardMetrics'];
        tools = rawTools.filter(t => allowlist.includes(t));
      } catch (e) {
        tools = ["getDashboardMetrics"];
      }`;

content = content.replace(/      try \{\n        tools = JSON\.parse\(response\.text \|\| "\[\]"\);\n      \} catch \(e\) \{\n        tools = \["getDashboardMetrics"\];\n      \}/, filterLogic);

fs.writeFileSync(file, content);
console.log("Server AI allowlist updated");
